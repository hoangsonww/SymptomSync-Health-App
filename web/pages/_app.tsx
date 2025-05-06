import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import NavBar from "@/components/NavBar";
import { Toaster, toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient();

const shownNotifications = new Set<string>();
const handleToast = (r: { title: string; body: string }) => {
  const key = `${r.title}:${r.body}`;
  if (shownNotifications.has(key)) return;
  shownNotifications.add(key);
  toast.info(r.title, { description: r.body });
};

supabase.auth.onAuthStateChange((_, session) => {
  const userId = session?.user?.id;
  if (!userId) return;

  supabase.removeAllChannels();

  const fetchMissed = async () => {
    const since = new Date(Date.now() - 60_000).toISOString();
    const { data, error } = await supabase
      .from("user_notifications")
      .select("title, body")
      .eq("user_profile_id", userId)
      .gte("created_at", since);

    if (error) {
      console.error("Missed fetch error:", error);
      return;
    }
    (data ?? []).forEach(handleToast);
  };

  const channel = supabase.channel(`reminders-${userId}`).on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "user_notifications",
      filter: `user_profile_id=eq.${userId}`,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ new: row }) => handleToast(row as any),
  );

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      console.log("✅ reminders channel LIVE");
      fetchMissed();
    }
  });
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // Wanna hide the nav bar on auth pages and landing page and 404
  const authPaths = [
    "/",
    "/auth/signUp",
    "/auth/login",
    "/404",
    "/auth/forgotPassword",
    "/auth/updatePassword",
  ];
  const hideNav = authPaths.includes(router.pathname);

  const [navExpanded, setNavExpanded] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkScreen = () => setIsMobile(window.innerWidth < 768);
      checkScreen();
      window.addEventListener("resize", checkScreen);
      return () => window.removeEventListener("resize", checkScreen);
    }
  }, []);

  useEffect(() => {
    const storedPref = localStorage.getItem("navExpanded");
    if (storedPref !== null) setNavExpanded(storedPref === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("navExpanded", String(navExpanded));
  }, [navExpanded]);

  // Push content to the right when nav is expanded. This is kinda a
  // hacky way to do it, but it works
  const marginLeft = isMobile ? "0" : navExpanded ? "16rem" : "5rem";
  const [userId, setUserId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastChannelRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && isMounted) {
        setUserId(user.id);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (!userId) return;

    const fetchMissed = async () => {
      const since = new Date(Date.now() - 60_000).toISOString();
      const { data, error } = await supabase
        .from("user_notifications")
        .select("title, body")
        .eq("user_profile_id", userId)
        .gte("created_at", since);

      if (error) {
        console.error("Missed fetch error:", error);
        return;
      }

      (data ?? []).forEach(handleToast);
    };

    const channel = supabase.channel(`reminders-${userId}`).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "user_notifications",
        filter: `user_profile_id=eq.${userId}`,
      },
      ({ new: row }) => handleToast(row as { title: string; body: string }),
    );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        fetchMissed();
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  /**
   * Supabase Realtime #3: Reminder notifications.
   * This will be used to notify the user when a reminder is due.
   * How it works: Supabase CRON is set up in Supbase Dashboard to
   * call a function every second. This function will check if
   * there are any reminders due and if so, it will insert
   * a new row in the user_notifications table. This will
   * trigger the realtime subscription in this file and the
   * user will be notified via a toast notification, immediately
   * after the row is inserted (i.e. when their reminder is due).
   *
   * Something I'm so proud of too lol :>
   */
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`reminders-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_profile_id=eq.${userId}`,
        },
        (payload) => {
          const { title, body } = payload.new as {
            title: string;
            body: string;
          };
          handleToast({ title, body });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  /**
   * Supabase Realtime #2: In the above realtime functionality, we already
   * created postgres changes for meds, appointments, and health logs. However,
   * that will only update the UI if the user adds a new med, appointment, or log
   * from another device. But we may also wanna broadcast a message to the user
   * when a new med, appointment, or log is added from another device as well.
   * This is where the broadcast channel comes in - it will broadcast a message
   * to the user when a new med, appointment, or log is added from another device so
   * that the user knows that something has changed in the UI and the reason
   * for that change.
   */
  useEffect(() => {
    broadcastChannelRef.current = supabase.channel("universal-channel", {
      config: { broadcast: { self: false } },
    });
    const channel = broadcastChannelRef.current;
    channel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("broadcast", { event: "*" }, (payload: any) => {
        if (payload?.payload?.message) {
          toast.success(`Notification: ${payload.payload.message}`);
        }
      })
      .subscribe((status: string) => {
        console.log("Universal channel status:", status);
      });
    return () => {
      supabase.removeChannel(channel);
      broadcastChannelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Helper to fetch reminders due in the current minute window
    const fetchDueReminders = async () => {
      const now = new Date();
      const windowStart = new Date(now.setSeconds(0, 0));
      const windowEnd = new Date(windowStart.getTime() + 60_000);

      const { data: dueReminders, error } = await supabase
        .from("user_notifications")
        .select("title, body")
        .eq("user_profile_id", userId)
        .gte("created_at", windowStart.toISOString())
        .lt("created_at", windowEnd.toISOString());

      if (error) {
        console.error("Error fetching due reminders:", error);
        return;
      }
      dueReminders?.forEach(({ title, body }) => handleToast({ title, body }));
    };

    const now = new Date();
    const msToNextMinute =
      60_000 - (now.getSeconds() * 1_000 + now.getMilliseconds());

    const timeoutId = setTimeout(() => {
      fetchDueReminders();

      const intervalId = setInterval(fetchDueReminders, 60_000);

      return () => clearInterval(intervalId);
    }, msToNextMinute);

    fetchDueReminders();

    return () => clearTimeout(timeoutId);
  }, [userId]);

  if (hideNav) {
    return (
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
        <Toaster position="bottom-right" richColors />
        <Analytics />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div>
          <NavBar
            isExpanded={navExpanded}
            setIsExpanded={setNavExpanded}
            staticNav={false}
          />
          <main className="transition-all duration-300" style={{ marginLeft }}>
            <Component {...pageProps} />
          </main>
          <Toaster position="bottom-right" richColors />
          <Analytics />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
