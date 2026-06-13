"use client";

/**
 * HeroScene3D — an interactive WebGL backdrop for the landing hero.
 *
 * Notes:
 *  - Procedural geometry only. No binary assets (.glb/.gltf/.hdr/.exr/textures).
 *  - Health-tech motif: a glowing "molecular core" wrapped by an orbiting node
 *    network and a drifting particle field. All materials are basic/additive,
 *    so the scene needs no lights and stays cheap on weak GPUs.
 *  - Reacts to cursor movement (parallax + tilt) and scroll (dolly + spin).
 *  - Sits absolutely inside the dark hero, behind the foreground content.
 *  - Adapts to the device (low / mobile / desktop tiers), honors
 *    prefers-reduced-motion, pauses while the tab is hidden, and degrades to a
 *    transparent layer when WebGL is unavailable.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ---------------------------------------------------------------------------
 * Live input (pointer + scroll) kept in a ref so updates never re-render React.
 * ------------------------------------------------------------------------- */
type LiveInput = {
  px: number; // pointer x in [-1, 1]
  py: number; // pointer y in [-1, 1]
  scroll: number; // hero scroll progress in [0, 1]
  reduced: boolean;
};

const InputContext = createContext<React.MutableRefObject<LiveInput> | null>(
  null,
);

function useInput() {
  const ref = useContext(InputContext);
  if (!ref) throw new Error("useInput must be used inside HeroScene3D");
  return ref;
}

const damp = THREE.MathUtils.damp;

/* ---------------------------------------------------------------------------
 * Palette — fixed dark health-tech colors (the hero is always dark).
 * ------------------------------------------------------------------------- */
const PARTICLE_COLORS = ["#38bdf8", "#22d3ee", "#2dd4bf", "#5eead4", "#7dd3fc"];
const CORE_COLOR = new THREE.Color("#22d3ee");
const CORE_INNER = new THREE.Color("#2dd4bf");
const NODE_COLORS = ["#5eead4", "#38bdf8", "#2dd4bf", "#7dd3fc"];
const LINE_COLOR = new THREE.Color("#22d3ee");

/* ---------------------------------------------------------------------------
 * Performance tiers — weak GPUs skip per-vertex CPU work, antialiasing, and a
 * high pixel ratio. `cpuDrift` gates the per-frame particle loop; when off,
 * motion comes from cheap group transforms instead.
 * ------------------------------------------------------------------------- */
type Tier = "low" | "mobile" | "desktop";

type Perf = {
  particles: number;
  nodes: number;
  dprMax: number;
  antialias: boolean;
  cpuDrift: boolean;
};

const PERF: Record<Tier, Perf> = {
  desktop: {
    particles: 2600,
    nodes: 14,
    dprMax: 1.75,
    antialias: true,
    cpuDrift: true,
  },
  mobile: {
    particles: 900,
    nodes: 9,
    dprMax: 1.4,
    antialias: false,
    cpuDrift: false,
  },
  low: {
    particles: 340,
    nodes: 6,
    dprMax: 1,
    antialias: false,
    cpuDrift: false,
  },
};

function detectTier(): Tier {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = typeof nav.deviceMemory === "number" ? nav.deviceMemory : null;
  const cores = nav.hardwareConcurrency || 0;
  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const constrained = (mem !== null && mem <= 4) || (cores > 0 && cores <= 4);

  if (coarse) return w < 480 || constrained ? "low" : "mobile";
  return w < 768 ? "mobile" : "desktop";
}

// Evenly distribute points on a sphere (Fibonacci spiral).
function fibonacciSphere(count: number, radius: number) {
  const pts: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    pts.push(
      new THREE.Vector3(
        Math.cos(theta) * r * radius,
        y * radius,
        Math.sin(theta) * r * radius,
      ),
    );
  }
  return pts;
}

/* ---------------------------------------------------------------------------
 * ParticleField — drifting point cloud.
 * ------------------------------------------------------------------------- */
function ParticleField({
  count,
  cpuDrift,
}: {
  count: number;
  cpuDrift: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const rx = useRef(0);
  const ry = useRef(0);
  const input = useInput();

  const { positions, colors, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const palette = PARTICLE_COLORS.map((c) => new THREE.Color(c));
    const spread = 30;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * spread * 1.7;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread - 4;
      const c = palette[i % palette.length];
      const tint = 0.55 + Math.random() * 0.45;
      colors[i * 3 + 0] = c.r * tint;
      colors[i * 3 + 1] = c.g * tint;
      colors[i * 3 + 2] = c.b * tint;
      speeds[i] = 0.4 + Math.random() * 1.1;
    }
    return { positions, colors, speeds };
  }, [count]);

  useFrame((state, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const { px, py, scroll, reduced } = input.current;
    const dt = Math.min(delta, 0.05);
    const t = reduced ? 0 : state.clock.elapsedTime;

    if (!reduced && cpuDrift) {
      const pos = pts.geometry.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const rise = 0.5 * dt;
      for (let i = 0; i < count; i++) {
        let y = arr[i * 3 + 1] + speeds[i] * rise;
        if (y > 16) y = -16;
        arr[i * 3 + 1] = y;
      }
      pos.needsUpdate = true;
    }

    ry.current = damp(ry.current, px * 0.3, 3, dt);
    rx.current = damp(rx.current, -py * 0.2, 3, dt);
    pts.rotation.y = t * 0.02 + scroll * 0.6 + ry.current;
    pts.rotation.x = rx.current;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---------------------------------------------------------------------------
 * MolecularCore — nested wireframe icosahedrons with a heartbeat pulse.
 * ------------------------------------------------------------------------- */
function MolecularCore() {
  const groupRef = useRef<THREE.Group>(null);
  const input = useInput();

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const { px, py, scroll, reduced } = input.current;
    const dt = Math.min(delta, 0.05);
    const t = reduced ? 0 : state.clock.elapsedTime;

    g.rotation.y = t * 0.12 + scroll * Math.PI * 0.8 + px * 0.35;
    g.rotation.x = damp(g.rotation.x, py * 0.3 + scroll * 0.4, 2.5, dt);

    // Heartbeat: a gentle breathing pulse.
    const pulse = 1 + (reduced ? 0 : Math.sin(t * 1.6) * 0.04);
    g.scale.setScalar(pulse);
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[2.4, 1]} />
        <meshBasicMaterial
          color={CORE_COLOR}
          wireframe
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={0.66}>
        <icosahedronGeometry args={[2.4, 0]} />
        <meshBasicMaterial
          color={CORE_INNER}
          wireframe
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={0.32}>
        <icosahedronGeometry args={[2.4, 0]} />
        <meshBasicMaterial
          color={CORE_INNER}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------------------
 * NodeNetwork — orbiting glowing nodes linked to the core, like a health graph.
 * ------------------------------------------------------------------------- */
function NodeNetwork({ count }: { count: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const input = useInput();

  const { nodes, lineGeometry } = useMemo(() => {
    const nodes = fibonacciSphere(count, 4.2).map((p, i) => ({
      position: p,
      scale: 0.12 + (i % 3) * 0.05,
      color: new THREE.Color(NODE_COLORS[i % NODE_COLORS.length]),
    }));
    // Spokes from the core to each node.
    const verts: number[] = [];
    for (const n of nodes) {
      verts.push(0, 0, 0, n.position.x, n.position.y, n.position.z);
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(verts), 3),
    );
    return { nodes, lineGeometry };
  }, [count]);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const { px, py, scroll, reduced } = input.current;
    const dt = Math.min(delta, 0.05);
    const t = reduced ? 0 : state.clock.elapsedTime;

    g.rotation.y = t * -0.06 + scroll * Math.PI * 0.5;
    g.rotation.x = damp(g.rotation.x, py * 0.4 - 0.1, 2.5, dt);
    g.rotation.z = damp(g.rotation.z, -px * 0.25, 2.5, dt);
    const pulse = 1 + (reduced ? 0 : Math.sin(t * 1.6 + 0.6) * 0.03);
    g.scale.setScalar(pulse);
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          color={LINE_COLOR}
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
      {nodes.map((n, i) => (
        <mesh key={i} position={n.position} scale={n.scale}>
          <icosahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color={n.color}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------------------
 * Rig — camera parallax + scroll dolly.
 * ------------------------------------------------------------------------- */
function Rig({ baseZ }: { baseZ: number }) {
  const input = useInput();
  const { camera } = useThree();

  useFrame((_, delta) => {
    const { px, py, scroll } = input.current;
    const dt = Math.min(delta, 0.05);
    camera.position.x = damp(camera.position.x, px * 1.6, 3, dt);
    camera.position.y = damp(
      camera.position.y,
      -py * 1.1 + scroll * 1.4,
      3,
      dt,
    );
    camera.position.z = damp(camera.position.z, baseZ + scroll * 1.5, 2.5, dt);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ---------------------------------------------------------------------------
 * Experience — the assembled scene graph.
 * ------------------------------------------------------------------------- */
function Experience({
  perf,
  baseZ,
  offsetX,
}: {
  perf: Perf;
  baseZ: number;
  offsetX: number;
}) {
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x0b1120, 0.035);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  return (
    <>
      <Rig baseZ={baseZ} />
      {/* Core + network can be shifted off-center (e.g. behind centered CTA
          copy) while the particle field stays full-bleed. */}
      <group position={[offsetX, 0, 0]}>
        <MolecularCore />
        <NodeNetwork count={perf.nodes} />
      </group>
      <ParticleField count={perf.particles} cpuDrift={perf.cpuDrift} />
    </>
  );
}

/* ---------------------------------------------------------------------------
 * HeroScene3D — public component. Owns the layer, listeners, tiers, pause.
 * ------------------------------------------------------------------------- */
export default function HeroScene3D({
  cameraZ = 9,
  offsetX = 0,
}: {
  cameraZ?: number;
  offsetX?: number;
}) {
  const inputRef = useRef<LiveInput>({
    px: 0,
    py: 0,
    scroll: 0,
    reduced: false,
  });
  const [tier, setTier] = useState<Tier>("desktop");
  const [enabled, setEnabled] = useState(true);
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");

  useEffect(() => {
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyReduced = () => {
      inputRef.current.reduced = reducedMq.matches;
    };
    applyReduced();
    reducedMq.addEventListener("change", applyReduced);

    const resize = () => setTier(detectTier());
    resize();
    window.addEventListener("resize", resize);

    const onVis = () => setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVis);

    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) setEnabled(false);
    } catch {
      setEnabled(false);
    }

    return () => {
      reducedMq.removeEventListener("change", applyReduced);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      inputRef.current.px = (e.clientX / window.innerWidth) * 2 - 1;
      inputRef.current.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    // Hero-local scroll progress (the hero is ~one viewport tall).
    const onScroll = () => {
      const p = window.scrollY / Math.max(window.innerHeight, 1);
      inputRef.current.scroll = Math.min(Math.max(p, 0), 1.2);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const perf = PERF[tier];

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      <InputContext.Provider value={inputRef}>
        <Canvas
          key={tier}
          className="!absolute inset-0"
          frameloop={frameloop}
          dpr={[1, perf.dprMax]}
          gl={{
            alpha: true,
            antialias: perf.antialias,
            powerPreference: "high-performance",
          }}
          camera={{ position: [0, 0, cameraZ], fov: 60 }}
          onCreated={({ gl }) => gl.setClearAlpha(0)}
        >
          <Experience perf={perf} baseZ={cameraZ} offsetX={offsetX} />
        </Canvas>
      </InputContext.Provider>

      {/* Vignette keeps the hero copy crisp over the brightest center. */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_40%,rgba(11,17,32,0.55)_100%)]" />
    </div>
  );
}
