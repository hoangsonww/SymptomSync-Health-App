import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import NavBar from "@/components/NavBar";
import { Toaster, toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { fetchUserReminders, Reminder } from "@/lib/reminders";

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

  // Push content to the right when nav is expanded - this is kinda
  // a hacky way to do it, but it works for now
  const marginLeft = isMobile ? "0" : navExpanded ? "16rem" : "5rem";

  const [userId, setUserId] = useState<string | null>(null);
  const toastedReminderIds = useRef<Set<string>>(new Set());

  // Get user ID from Supabase auth on initial load to set up polling
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

  // Simple polling function to check for reminders every second
  // and toast if any are due. We're trying with cron but hasn't
  // worked yet due to timezone issues.
  // This is a temporary solution until we can get the cron job working
  // and will be removed once we have a better solution.
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(async () => {
      try {
        const reminders: Reminder[] = await fetchUserReminders(userId);
        const now = new Date();
        reminders.forEach((reminder) => {
          if (
            reminder.dueTime.getTime() <= now.getTime() &&
            !toastedReminderIds.current.has(reminder.id)
          ) {
            toast(`${reminder.title} is due now!`, {
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

  if (hideNav) {
    return (
      <>
        <Component {...pageProps} />
        <Toaster position="bottom-right" richColors />
      </>
    );
  }

  return (
    <div>
      <NavBar
        isExpanded={navExpanded}
        setIsExpanded={setNavExpanded}
        staticNav={false}
      />
      <main className="p-4 transition-all duration-300" style={{ marginLeft }}>
        <Component {...pageProps} />
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
