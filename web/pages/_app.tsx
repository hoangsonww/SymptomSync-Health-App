import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { Toaster } from "sonner";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // We don't wanna show the nav bar on auth pages and landing page
  const authPaths = ["/", "/auth/signUp", "/auth/login"];
  const hideNav = authPaths.includes(router.pathname);
  const [navExpanded, setNavExpanded] = useState<boolean>(true);

  useEffect(() => {
    const storedPref = localStorage.getItem("navExpanded");
    if (storedPref !== null) {
      setNavExpanded(storedPref === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("navExpanded", String(navExpanded));
  }, [navExpanded]);

  // Push content to the right when nav is expanded.
  // Expanded: w-64 = 16rem; Collapsed: w-20 ≈ 5rem.
  const marginLeft = navExpanded ? "16rem" : "5rem";

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
      <main className="p-4" style={{ marginLeft }}>
        <Component {...pageProps} />
      </main>
      {/* <Footer /> */}
      <Toaster />
    </div>
  );
}
