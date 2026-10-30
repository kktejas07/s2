"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "@/components/icons";
import { Header } from "./Header";
import { FeedbackHost } from "./feedback";

export type ThemeType = "iqe-brand" | "google-light" | "google-dark" | "material-blue";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<ThemeType>("iqe-brand");
  const [routeLoading, setRouteLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  // Public pages render without the app header (verify is opened by scanning a report QR)
  const isAuthPage = pathname === "/login" || pathname === "/" || pathname.startsWith("/verify");

  useEffect(() => {
    const saved = localStorage.getItem("iqe_theme") as ThemeType;
    if (saved) setTheme(saved);
  }, []);

  // Keep Tailwind `dark:` variants in sync with the in-app theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "google-dark" && !isAuthPage);
  }, [theme, isAuthPage]);

  // Brief top progress bar on every route change
  useEffect(() => {
    setRouteLoading(true);
    const t = setTimeout(() => setRouteLoading(false), 450);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const changeTheme = (newTheme: ThemeType) => {
    setTheme(newTheme);
    localStorage.setItem("iqe_theme", newTheme);
  };

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        {children}
        <FeedbackHost />
      </main>
    );
  }

  const getThemeBg = () => {
    if (theme === "google-dark") return "bg-[#001a2c] text-slate-100";
    if (theme === "material-blue") return "bg-[#f0f7ff] text-slate-900";
    if (theme === "google-light") return "bg-[#f8fafc] text-slate-800";
    return "bg-[#f4f8fb] text-slate-900"; // iqe-brand default
  };

  return (
    <div className={`min-h-screen flex flex-col ${getThemeBg()} antialiased font-sans transition-colors duration-300`}>
      {/* Route change progress bar */}
      <div
        aria-hidden
        className={`no-print fixed top-0 inset-x-0 h-0.5 z-[60] overflow-hidden pointer-events-none transition-opacity duration-300 ${
          routeLoading ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full w-full origin-left bg-gradient-to-r from-[#0084bf] via-sky-400 to-[#e35f14] animate-progress-indeterminate" />
      </div>

      <Header theme={theme} changeTheme={changeTheme} />

      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1920px] w-full mx-auto">
        {/* Keyed on pathname so each page animates in on navigation */}
        <div key={pathname} className="animate-page-in">
          {children}
        </div>
      </main>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        title="Back to top"
        className={`no-print fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-gradient-to-br from-[#0084bf] to-[#00618e] text-white shadow-glow-blue flex items-center justify-center hover:-translate-y-1 transition-all duration-300 ${
          showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ArrowUp className="w-4 h-4" />
      </button>

      <FeedbackHost />
    </div>
  );
}
