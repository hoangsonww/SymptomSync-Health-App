import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { Toaster } from "sonner";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // Hide the nav on the landing, auth pages, and the 404 page.
  const authPaths = ["/", "/auth/signUp", "/auth/login", "/404"];
  const hideNav = authPaths.includes(router.pathname);

  const [navExpanded, setNavExpanded] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkScreen = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkScreen();
      window.addEventListener("resize", checkScreen);
      return () => window.removeEventListener("resize", checkScreen);
    }
  }, []);

  useEffect(() => {
    const storedPref = localStorage.getItem("navExpanded");
    if (storedPref !== null) {
      setNavExpanded(storedPref === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("navExpanded", String(navExpanded));
  }, [navExpanded]);

  // Pushing the nav to the left when it's expanded on desktop.
  // This is kinda a hacky way to do it, but it works for now
  const marginLeft = isMobile ? "0" : navExpanded ? "16rem" : "5rem";

  if (hideNav) {
    return (
      <>
        <Component {...pageProps} />
        <Toaster />
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
      <Toaster />
    </div>
  );
}
