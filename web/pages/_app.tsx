import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import NavBar from "@/components/NavBar";
import { Toaster, toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { fetchUserReminders, Reminder } from "@/lib/reminders";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
  const toastedReminderIds = useRef<Set<string>>(new Set());
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

  // Poll for reminders only if a user is authenticated
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(async () => {
      if (!userId) return;

      try {
        const reminders: Reminder[] = await fetchUserReminders(userId);
        const now = new Date();
        const MAX_OVERDUE = 1000 * 60 * 60;

        reminders.forEach((reminder) => {
          const reminderDueTime = reminder.dueTime.getTime();
          const diff = now.getTime() - reminderDueTime;

          if (
            diff >= 0 &&
            diff <= MAX_OVERDUE &&
            !toastedReminderIds.current.has(reminder.id)
          ) {
            toast(`Reminder: ${reminder.title} is due now!`, {
              description:
                reminder.type === "appointment"
                  ? "You have an appointment scheduled."
                  : "Time to take your medication.",
            });
            toastedReminderIds.current.add(reminder.id);
          }
        });
      } catch (err) {
        console.error("Error polling reminders:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
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
    </QueryClientProvider>
  );
}
