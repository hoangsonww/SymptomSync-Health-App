import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import NavBar from "@/components/NavBar";
import { Toaster, toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // Wanna hide the nav bar on auth pages and landing page and 404
  const authPaths = ["/", "/auth/signUp", "/auth/login", "/404"];
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

    // We only wanna show due reminders that have passed for not too long
    // If you see a reminder has already been toasted, it's intentional
    // and it's because the reminder is overdue.
    const MAX_OVERDUE_THRESHOLD = 1000 * 60 * 60;

    const subscription = supabase
      .channel(`user-notifications-${userId}`, {
        config: { broadcast: { self: false } },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_profile_id=eq.${userId}`,
        },
        (payload) => {
          if (payload?.new) {
            const notification = payload.new;
            const dueTime = new Date(notification.due_time);
            const now = new Date();
            if (now.getTime() - dueTime.getTime() > MAX_OVERDUE_THRESHOLD) {
              return;
            }
            toast(`Reminder: ${notification.title} is due now!`, {
              description:
                notification.type === "appointment"
                  ? "You have an appointment scheduled."
                  : "Time to take your medication.",
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
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
