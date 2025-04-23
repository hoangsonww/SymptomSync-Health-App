import React, { useEffect, useRef, useState, memo } from "react";
import Chart, { ChartConfiguration } from "chart.js/auto";

const PALETTE = [
  "#344966",
  "#F97F51",
  "#EAD637",
  "#4CD137",
  "#FF577F",
  "#9A6AFF",
  "#00BDA5",
  "#FF8C00",
  "#00A8E8",
  "#9B5DE5",
  "#F15BB5",
  "#7D7D7D",
];

const normalizeLabel = (label: string): string =>
  label
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const ChartBlock: React.FC<{ spec: ChartConfiguration }> = memo(({ spec }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains("dark"),
  );
  const [visible, setVisible] = useState<boolean>(false);

  /**
   * Listen for changes to the theme. This is done using
   * the MutationObserver API. This is important for
   * performance reasons, as we don't want to create all
   * charts at once, especially on mobile
   */
  useEffect(() => {
    const mo = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => mo.disconnect();
  }, []);

  /**
   * Instead of creating all charts at once on app load, we
   * only create them when they are scrolled into view. This
   * is done using the IntersectionObserver API. This is
   * important for performance reasons, as we don't want
   * to create all charts at once, especially on mobile
   */
  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  /**
   * Create the chart when the component is mounted.
   * This is done using the Chart.js library. We use
   * the requestIdleCallback API to wait for the browser
   * to be idle before creating the chart. This is done
   * for performance reasons, as we don't want to create
   * all charts at once, especially on mobile
   */
  useEffect(() => {
    if (!visible || chartRef.current || !canvasRef.current) return;

    const mount = () => {
      const cfg = structuredClone(spec) as ChartConfiguration;

      // normalize labels
      if (cfg.data?.labels) {
        cfg.data.labels = cfg.data.labels.map((lbl) =>
          normalizeLabel(String(lbl)),
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cfg.data?.datasets?.forEach((ds: any, idx: number) => {
        if (cfg.type === "line") {
          ds.borderColor = PALETTE[0];
          ds.backgroundColor = PALETTE[0];
          ds.pointBackgroundColor = PALETTE[0];
          ds.borderWidth = 3;
          return;
        }

        if (cfg.type === "radar") {
          ds.borderColor = PALETTE[0];
          ds.backgroundColor = "transparent";
          ds.borderWidth = 3;
          return;
        }

        const c = PALETTE[idx % PALETTE.length];
        if (Array.isArray(ds.data)) {
          ds.backgroundColor = ds.data.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (_: any, i: number) => PALETTE[i % PALETTE.length],
          );
          ds.borderColor = ds.backgroundColor;
        } else {
          ds.backgroundColor = c;
          ds.borderColor = c;
        }
        ds.borderWidth = ds.borderWidth ?? 1;
      });

      const fontColor = isDark ? "#ffffff" : "#000000";
      Chart.defaults.color = fontColor;

      cfg.options = {
        ...(cfg.options || {}),
        maintainAspectRatio: false,
        plugins: {
          ...(cfg.options?.plugins || {}),
          legend: {
            ...(cfg.options?.plugins?.legend || {}),
            labels: { color: fontColor },
          },
        },
      };

      if (cfg.options.scales) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.values(cfg.options.scales as any).forEach((s: any) => {
          s.ticks = { ...(s.ticks || {}), color: fontColor };
          s.title = { ...(s.title || {}), color: fontColor };
        });
      }

      chartRef.current = new Chart(canvasRef.current!, cfg);
    };

    // wait for the idle callback to mount the chart
    if ("requestIdleCallback" in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).requestIdleCallback(mount);
    } else {
      setTimeout(mount, 200);
    }
  }, [visible, spec, isDark]);

  // update only colors on theme change
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const fontColor = isDark ? "#ffffff" : "#000000";
    Chart.defaults.color = fontColor;

    if (chart.options.plugins?.legend?.labels) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chart.options.plugins.legend.labels as any).color = fontColor;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.values((chart.options.scales as any) || {}).forEach((s: any) => {
      if (s.ticks) s.ticks.color = fontColor;
      if (s.title) s.title.color = fontColor;
    });

    chart.update("none");
  }, [isDark]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
});

ChartBlock.displayName = "ChartBlock";

export default ChartBlock;
