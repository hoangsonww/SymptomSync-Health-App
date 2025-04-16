import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Calendar,
  MessageSquare,
  User,
  Menu,
  LogIn,
  LogOut,
  File,
  List,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { signOut } from "@/lib/auth";
import { ModeToggle } from "@/components/ModeToggle";

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isExpanded: boolean;
  onClick?: () => void;
};

function NavItem({ href, icon, label, isExpanded, onClick }: NavItemProps) {
  const router = useRouter();
  const active = router.asPath === href;
  const commonClasses =
    "w-full flex items-center transition-colors cursor-pointer rounded";
  const expandedClasses = isExpanded
    ? `items-center gap-3 px-4 py-3 ${active ? "bg-white text-accent" : "hover:bg-white/10"}`
    : `justify-center p-3 ${active ? "bg-white text-accent" : "hover:bg-white/10"}`;
  return (
    <Link href={href} legacyBehavior>
      <a onClick={onClick} className={`${commonClasses} ${expandedClasses}`}>
        <div className="flex-shrink-0 flex justify-center items-center w-5 h-5">
          {icon}
        </div>
        {isExpanded && (
          <span className="whitespace-nowrap transition-opacity duration-200 block text-base font-medium">
            {label}
          </span>
        )}
      </a>
    </Link>
  );
}

type NavBarProps = {
  staticNav?: boolean;
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function NavBar({
  staticNav = false,
  isExpanded,
  setIsExpanded,
}: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session?.user);
      },
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (window.innerWidth >= 768) return;

      if (
        mobileOpen &&
        navRef.current &&
        mobileButtonRef.current &&
        !navRef.current.contains(event.target as Node) &&
        !mobileButtonRef.current.contains(event.target as Node)
      ) {
        setMobileOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [mobileOpen]);

  const expandedWidth = "w-64";
  const collapsedWidth = "w-20";
  const desktopWidth = isExpanded ? expandedWidth : collapsedWidth;
  const mobileTranslate = mobileOpen ? "translate-x-0" : "-translate-x-full";
  const containerClasses = staticNav
    ? `${desktopWidth} bg-primary text-white flex flex-col justify-between transition-all duration-300 h-screen shadow-xl`
    : `fixed top-0 left-0 h-screen ${desktopWidth} bg-primary text-white flex flex-col justify-between transition-all duration-300 z-40 transform ${mobileTranslate} md:translate-x-0 shadow-xl`;
  const navItemsContainerClasses = isExpanded
    ? "mt-4 space-y-2 flex flex-col items-start"
    : "mt-4 space-y-2 flex flex-col items-center";

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {!staticNav && (
        <button
          ref={mobileButtonRef}
          className="fixed top-2 right-2 z-50 md:hidden p-2 bg-primary text-white rounded-full shadow hover:bg-white/10 hover:text-primary cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setMobileOpen((prev) => !prev);
          }}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      )}
      <nav ref={navRef} className={containerClasses}>
        <div>
          <div className="flex items-center justify-center p-4 border-b border-white/20">
            {isExpanded ? (
              <span className="text-xl font-bold tracking-wide cursor-pointer">
                <Link href="/home" className="flex items-center">
                  SymptomSync
                </Link>
              </span>
            ) : (
              <span className="text-xl font-extrabold cursor-pointer">
                <Link href="/home" className="flex items-center">
                  SS
                </Link>
              </span>
            )}
          </div>
          <div className={navItemsContainerClasses}>
            <NavItem
              href="/home"
              icon={<Home className="w-5 h-5" />}
              label="Home"
              isExpanded={isExpanded}
            />
            <NavItem
              href="/calendar"
              icon={<Calendar className="w-5 h-5" />}
              label="Calendar"
              isExpanded={isExpanded}
            />
            <NavItem
              href="/chat"
              icon={<MessageSquare className="w-5 h-5" />}
              label="Chat"
              isExpanded={isExpanded}
            />
            <NavItem
              href="/uploads"
              icon={<File className="w-5 h-5" />}
              label="Documents"
              isExpanded={isExpanded}
            />
            <NavItem
              href="/reminder"
              icon={<List className="w-5 h-5" />}
              label="Medications"
              isExpanded={isExpanded}
            />
            <NavItem
              href="/profile"
              icon={<User className="w-5 h-5" />}
              label="Profile"
              isExpanded={isExpanded}
            />
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className={
                  isExpanded
                    ? "w-full flex items-center gap-3 px-4 py-3 rounded hover:bg-white/10 transition-colors cursor-pointer"
                    : "w-full flex justify-center items-center p-3 rounded hover:bg-white/10 transition-colors cursor-pointer"
                }
              >
                <div className="flex-shrink-0 flex justify-center items-center w-5 h-5">
                  <LogOut className="w-5 h-5 text-red-500" />
                </div>
                {isExpanded && (
                  <span className="whitespace-nowrap transition-opacity duration-200 block font-medium text-red-500">
                    Log Out
                  </span>
                )}
              </button>
            ) : (
              <NavItem
                href="/auth/login"
                icon={<LogIn className="w-5 h-5" />}
                label="Log In"
                isExpanded={isExpanded}
              />
            )}
            <ModeToggle isExpanded={isExpanded} />
          </div>
        </div>
        <div className="p-0 border-t border-white/20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
            className="w-full flex items-center justify-center p-4 hover:bg-white/20 rounded transition-colors cursor-pointer"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            ) : (
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
