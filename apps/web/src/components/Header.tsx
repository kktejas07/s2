"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  SearchX,
  Plus,
  Sparkles,
  User,
  Briefcase,
  CalendarCheck,
  FileText,
  Palette,
  Sun,
  Moon,
  Check,
  ChevronDown,
  Settings,
  LogOut,
  Building2,
  Factory,
  ClipboardList,
  ShieldCheck,
  FileSpreadsheet,
  Users,
  DollarSign,
  Award,
  CheckSquare,
  Shield,
  Layers,
  Sliders,
  BarChart3,
  Ruler,
  AlertTriangle,
  Printer,
  Pill,
  Compass,
  Zap,
  PackageCheck,
  Menu,
  X,
  BookOpen,
  Table,
  Receipt,
  CreditCard,
  PhoneCall,
  HardHat,
} from "@/components/icons";
import { api } from "@/lib/api";
import { ThemeType } from "./LayoutWrapper";
import { IQELogo } from "./IQELogo";

const THEME_LABELS: Record<ThemeType, string> = {
  "iqe-brand": "IQE Brand",
  "google-light": "Google Light",
  "google-dark": "Google Dark",
  "material-blue": "Material Blue",
};

interface HeaderProps {
  theme?: ThemeType;
  changeTheme?: (theme: ThemeType) => void;
}

export function Header({ theme = "iqe-brand", changeTheme }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quickMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Close all menus when navigating
  useEffect(() => {
    setActiveDropdown(null);
    setShowQuickMenu(false);
    setShowThemeMenu(false);
    setMobileMenuOpen(false);
    setSearchResults(null);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click outside / Escape closes popovers; Ctrl+K or Cmd+K focuses search
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (quickMenuRef.current && !quickMenuRef.current.contains(target)) setShowQuickMenu(false);
      if (themeMenuRef.current && !themeMenuRef.current.contains(target)) setShowThemeMenu(false);
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) setSearchResults(null);
      if (navRef.current && !navRef.current.contains(target)) setActiveDropdown(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (e.key === "Escape") {
        setShowQuickMenu(false);
        setShowThemeMenu(false);
        setActiveDropdown(null);
        setSearchResults(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.aiSearch(query);
      setSearchResults(res.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const isDark = theme === "google-dark";

  const handleLogout = () => {
    if (typeof window !== "undefined") localStorage.clear();
    router.push("/login");
  };

  return (
    <header className={`w-full ${isDark ? "bg-[#001a2c]/95 backdrop-blur-md border-slate-800 text-white" : "bg-white/90 backdrop-blur-md border-slate-200/90 text-slate-800"} border-b sticky top-0 z-[100] transition-all duration-300 ${scrolled ? "header-scrolled" : "shadow-sm"}`}>
      {/* Top Header Branding & Primary Navigation Row */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* IQE Brand Logo (Official Q & Globe Logo + Title) */}
        <Link href="/dashboard" className="flex items-center gap-3 group min-w-0 shrink" aria-label="Ideal Quality Engineers (I) Pvt Ltd - home">
          <IQELogo className="w-11 h-11 shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 ease-spring drop-shadow-sm" />
          {/* The wordmark is deliberately not repeated here. Measured at 1600px
              the nav needs 1148px and the actions 295px, leaving 77px - not
              enough for the company name, which rendered as "I...". Inside the
              app the logo already says whose product this is, and the full
              legal name is on this link's accessible name and in every
              document the app produces. Restoring it means re-adding the
              block and reducing the number of top-level nav items. */}
        </Link>

        {/* Top Navigation Menu (ADMIN, ANALYTICS, PMS FORMATES, QMS) - [HOME, SALES, OPERATIONS, FINANCE are hidden as requested] */}
        <nav ref={navRef} className="hidden shrink-0 lg:flex items-center gap-0.5 xl:gap-1 text-xs font-extrabold uppercase tracking-wider whitespace-nowrap">
          {/* ADMIN Dropdown */}
          <div className="relative group/dd" onMouseEnter={() => setActiveDropdown("admin")} onMouseLeave={() => setActiveDropdown(null)}>
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "admin" ? null : "admin")}
              className={`flex items-center gap-1 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl transition-all cursor-pointer ${
              pathname.startsWith("/admin") || pathname.startsWith("/clients") || pathname.startsWith("/manufacturers")
                ? "bg-[#0084bf] text-white font-extrabold shadow-sm shadow-sky-500/20"
                : isDark
                ? "text-slate-100 hover:bg-slate-800 font-extrabold"
                : "text-[#004b6e] hover:bg-sky-50 hover:text-[#0084bf] font-extrabold"
            }`}>
              <span>ADMIN</span>
              <ChevronDown className={`w-3.5 h-3.5 ${isDark ? "text-slate-300" : "text-[#0084bf]"} transition-transform duration-300 group-hover/dd:rotate-180`} />
            </button>
            {activeDropdown === "admin" && (
              <div className={`absolute top-full left-0 w-56 max-h-[85vh] overflow-y-auto origin-top-left animate-dropdown-in ${isDark ? "bg-[#001a2c] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"} border rounded-2xl shadow-2xl p-1.5 z-[110] capitalize normal-case text-xs space-y-1`}>
                <Link onClick={() => setActiveDropdown(null)} href="/clients" className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-sky-50 text-[#00618e]"} font-bold`}>
                  <Building2 className="w-4 h-4 text-[#0084bf]" /> Clients &amp; Corporate Details
                </Link>
                <Link onClick={() => setActiveDropdown(null)} href="/manufacturers" className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-amber-50 text-amber-800"} font-bold`}>
                  <Factory className="w-4 h-4 text-[#e35f14]" /> Manufacturers Directory
                </Link>
                <Link onClick={() => setActiveDropdown(null)} href="/admin" className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-sky-50 text-[#00618e]"} font-bold`}>
                  <ShieldCheck className="w-4 h-4 text-purple-600" /> Admin System Settings
                </Link>
              </div>
            )}
          </div>

          {/* ANALYTICS */}
          <Link
            href="/analytics"
            className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              pathname.startsWith("/analytics")
                ? "bg-[#0084bf] text-white font-extrabold shadow-sm shadow-sky-500/20"
                : isDark
                ? "text-sky-400 hover:bg-slate-800 font-extrabold"
                : "text-[#004b6e] hover:bg-sky-50 hover:text-[#0084bf] font-extrabold"
            }`}
          >
            <BarChart3 className={`w-3.5 h-3.5 hidden 2xl:block ${pathname.startsWith("/analytics") ? "text-sky-200" : "text-[#0084bf]"}`} />
            <span>ANALYTICS</span>
          </Link>

          {/* OPERATIONS Dropdown */}
          <div className="relative group/dd" onMouseEnter={() => setActiveDropdown("operations")} onMouseLeave={() => setActiveDropdown(null)}>
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "operations" ? null : "operations")}
              className={`flex items-center gap-1 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl transition-all cursor-pointer ${
              pathname.startsWith("/visit-schedule") ||
              pathname.startsWith("/open-calls") ||
              pathname.startsWith("/visits") ||
              pathname.startsWith("/jobs") ||
              pathname.startsWith("/proposed-assignments") ||
              pathname.startsWith("/logsheet") ||
              pathname.startsWith("/control-numbers") ||
              pathname.startsWith("/verify")
                ? "bg-[#0084bf] text-white font-extrabold shadow-sm shadow-sky-500/20"
                : isDark
                ? "text-slate-100 hover:bg-slate-800 font-extrabold"
                : "text-[#004b6e] hover:bg-sky-50 hover:text-[#0084bf] font-extrabold"
            }`}>
              <CalendarCheck className="w-3.5 h-3.5 hidden 2xl:block" />
              <span>OPERATIONS</span>
              <ChevronDown className={`w-3.5 h-3.5 ${isDark ? "text-slate-300" : "text-[#0084bf]"} transition-transform duration-300 group-hover/dd:rotate-180`} />
            </button>
            {activeDropdown === "operations" && (
              <div className={`absolute top-full left-0 w-72 max-h-[85vh] overflow-y-auto origin-top-left animate-dropdown-in ${isDark ? "bg-[#001a2c] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"} border rounded-2xl shadow-2xl p-2 z-[110] capitalize normal-case text-xs space-y-1`}>
                <div className="px-3 py-1 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
                  <span>Field Operations</span>
                  <span className="text-blue-500 font-bold">8 Tools</span>
                </div>
                <Link onClick={() => setActiveDropdown(null)} href="/visit-schedule" className={`flex items-center gap-2.5 p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-blue-50 text-blue-900"} font-bold`}>
                  <CalendarCheck className="w-4 h-4 text-blue-500" />
                  <div>
                    <div>Visit Schedule</div>
                    <div className="text-[11px] text-slate-400 font-normal">Inspection Calendar &amp; Timeline</div>
                  </div>
                </Link>
                <Link onClick={() => setActiveDropdown(null)} href="/open-calls" className={`flex items-center gap-2.5 p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-amber-50 text-amber-900"} font-bold`}>
                  <PhoneCall className="w-4 h-4 text-amber-600" />
                  <div>
                    <div>Open Calls Intake</div>
                    <div className="text-[11px] text-slate-400 font-normal">Customer Call Request Intake</div>
                  </div>
                </Link>
                <Link onClick={() => setActiveDropdown(null)} href="/visits" className={`flex items-center gap-2.5 p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-sky-50 text-[#00618e]"} font-bold`}>
                  <CalendarCheck className="w-4 h-4 text-[#0084bf]" />
                  <div>
                    <div>Field Visits</div>
                    <div className="text-[11px] text-slate-400 font-normal">Site Visits &amp; Attendance</div>
                  </div>
                </Link>
                <Link onClick={() => setActiveDropdown(null)} href="/jobs" className={`flex items-center gap-2.5 p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-purple-50 text-purple-900"} font-bold`}>
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <div>
                    <div>Assessments / Jobs</div>
                    <div className="text-[11px] text-slate-400 font-normal">Active Inspection Assignments</div>
                  </div>
                </Link>
                <Link onClick={() => setActiveDropdown(null)} href="/proposed-assignments" className={`flex items-center gap-2.5 p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-indigo-50 text-indigo-900"} font-bold`}>
                  <Users className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div>Proposed Assignments</div>
                    <div className="text-[11px] text-slate-400 font-normal">Inspector Allocation Matrix</div>
                  </div>
                </Link>
                <Link onClick={() => setActiveDropdown(null)} href="/logsheet" className={`flex items-center gap-2.5 p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-teal-50 text-teal-900"} font-bold`}>
                  <HardHat className="w-4 h-4 text-teal-600" />
                  <div>
                    <div>Site Daily Logsheet</div>
                    <div className="text-[11px] text-slate-400 font-normal">Daily Inspection Records</div>
                  </div>
                </Link>
                <Link onClick={() => setActiveDropdown(null)} href="/control-numbers" className={`flex items-center gap-2.5 p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-sky-50 text-[#00618e]"} font-bold`}>
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <div>
                    <div>Control Numbers</div>
                    <div className="text-[11px] text-slate-400 font-normal">IRN / IVR Certificate Registry</div>
                  </div>
                </Link>
                <Link onClick={() => setActiveDropdown(null)} href="/verify" className={`flex items-center gap-2.5 p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-emerald-50 text-emerald-900"} font-bold`}>
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div>Public Authenticator</div>
                    <div className="text-[11px] text-slate-400 font-normal">QR Certificate Verification</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* MAIN TITLE 1: FORMATS */}
          <div className="relative group/dd" onMouseEnter={() => setActiveDropdown("formats")} onMouseLeave={() => setActiveDropdown(null)}>
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "formats" ? null : "formats")}
              className={`flex items-center gap-1 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl transition-all cursor-pointer ${
              pathname.startsWith("/pms-formats") ||
              pathname.startsWith("/boq-reconciliation") ||
              pathname.startsWith("/expediting-visit-report") ||
              pathname.startsWith("/flash-inspection-report") ||
              pathname.startsWith("/inspection-visit-report") ||
              pathname.startsWith("/inspection-release-note") ||
              pathname.startsWith("/construction-bill-verification") ||
              pathname.startsWith("/tpi-billing") ||
              pathname.startsWith("/quality-bill-verification") ||
              pathname.startsWith("/schedule-m-pharma-epc")
                ? "bg-gradient-to-r from-[#0084bf] to-[#00618e] text-white font-extrabold shadow-md glow-iqe-blue"
                : isDark
                ? "text-sky-300 hover:bg-slate-800 font-extrabold"
                : "text-[#004b6e] hover:bg-sky-50 hover:text-[#0084bf] font-extrabold"
            }`}>
              <FileSpreadsheet className="w-3.5 h-3.5 hidden 2xl:block" />
              <span>FORMATS</span>
              <ChevronDown className="w-3 h-3 transition-transform duration-300 group-hover/dd:rotate-180" />
            </button>
            {activeDropdown === "formats" && (
              <div className={`absolute top-full left-0 w-88 max-h-[85vh] overflow-y-auto origin-top-left animate-dropdown-in ${isDark ? "bg-[#001a2c] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"} border rounded-2xl shadow-2xl p-2 z-[110] capitalize normal-case text-xs space-y-1`}>
                <div className="px-3 py-1 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
                  <span>Inspection Formats</span>
                  <span className="text-sky-500 font-bold">10 Formats</span>
                </div>
                <Link
                  href="/pms-formats"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname.startsWith("/pms-formats")
                      ? isDark ? "bg-indigo-950/70 text-white" : "bg-indigo-50 text-indigo-900"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">PMS Formats Hub</div>
                    <div className="text-[11px] text-slate-400 truncate">Central Index of All Engineering Formats</div>
                  </div>
                </Link>
                <Link
                  href="/tpi-billing"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname.startsWith("/tpi-billing")
                      ? isDark ? "bg-sky-950/70 text-white" : "bg-sky-50 text-[#00618e]"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-sky-100 dark:bg-sky-950/80 text-[#0084bf] flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Bill Verification</div>
                    <div className="text-[11px] text-slate-400 truncate">RA Bills &amp; TPI Billing (F-BILL-01)</div>
                  </div>
                </Link>
                <Link
                  href="/boq-reconciliation"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname.startsWith("/boq-reconciliation")
                      ? isDark ? "bg-purple-950/70 text-white" : "bg-purple-50 text-purple-900"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">BOQ Reconciliation</div>
                    <div className="text-[11px] text-slate-400 truncate">Material &amp; Quantity Audit (F-BOQ-01)</div>
                  </div>
                </Link>
                <Link
                  href="/construction-bill-verification"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname.startsWith("/construction-bill-verification")
                      ? isDark ? "bg-cyan-950/70 text-white" : "bg-cyan-50 text-cyan-900"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 flex items-center justify-center shrink-0">
                    <Table className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Construction Bill Verification</div>
                    <div className="text-[11px] text-slate-400 truncate">27-Col Measurements &amp; Rate Matrix</div>
                  </div>
                </Link>
                <Link
                  href="/flash-inspection-report"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname.startsWith("/flash-inspection-report")
                      ? isDark ? "bg-amber-950/70 text-white" : "bg-amber-50 text-amber-900"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Flash Inspection Report</div>
                    <div className="text-[11px] text-slate-400 truncate">Preliminary Inspection (IQE-TP-02)</div>
                  </div>
                </Link>
                <Link
                  href="/inspection-visit-report"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname.startsWith("/inspection-visit-report")
                      ? isDark ? "bg-blue-950/70 text-white" : "bg-blue-50 text-blue-900"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Inspection Visit Report</div>
                    <div className="text-[11px] text-slate-400 truncate">Formal Visit &amp; Calibration (IQE-TP-03)</div>
                  </div>
                </Link>
                <Link
                  href="/inspection-release-note"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname.startsWith("/inspection-release-note")
                      ? isDark ? "bg-emerald-950/70 text-white" : "bg-emerald-50 text-emerald-900"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 flex items-center justify-center shrink-0">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Inspection Release Note</div>
                    <div className="text-[11px] text-slate-400 truncate">Dispatch Clearance (IQE-TP-04)</div>
                  </div>
                </Link>
                <Link
                  href="/expediting-visit-report"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname.startsWith("/expediting-visit-report")
                      ? isDark ? "bg-teal-950/70 text-white" : "bg-teal-50 text-teal-900"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-teal-100 dark:bg-teal-950/80 text-teal-600 flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Expediting Visit Report</div>
                    <div className="text-[11px] text-slate-400 truncate">Supplier Progress &amp; Fab Audit (IQE-TP-05)</div>
                  </div>
                </Link>
                <Link
                  href="/quality-bill-verification"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname.startsWith("/quality-bill-verification")
                      ? isDark ? "bg-emerald-950/70 text-white" : "bg-emerald-50 text-emerald-800"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Quality Verification</div>
                    <div className="text-[11px] text-slate-400 truncate">Concealed Work &amp; Quality Audit (F-QUAL-01)</div>
                  </div>
                </Link>
                <Link
                  href="/schedule-m-pharma-epc"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname.startsWith("/schedule-m-pharma-epc")
                      ? isDark ? "bg-amber-950/70 text-white" : "bg-amber-50 text-amber-900"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-amber-100 dark:bg-amber-950/80 text-[#e35f14] flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Mpharma EPC</div>
                    <div className="text-[11px] text-slate-400 truncate">Inspection Formats F-01 to F-12</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* FINANCE Dropdown */}
          <div className="relative group/dd" onMouseEnter={() => setActiveDropdown("finance")} onMouseLeave={() => setActiveDropdown(null)}>
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "finance" ? null : "finance")}
              className={`flex items-center gap-1 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl transition-all cursor-pointer ${
              pathname.startsWith("/invoices") ||
              pathname.startsWith("/accounts-receivable") ||
              pathname.startsWith("/accounts-payable") ||
              pathname.startsWith("/service-orders") ||
              pathname.startsWith("/purchase-orders")
                ? "bg-gradient-to-r from-amber-600 to-[#e35f14] text-white font-extrabold shadow-md"
                : isDark
                ? "text-amber-400 hover:bg-slate-800 font-extrabold"
                : "text-amber-800 hover:bg-amber-50 hover:text-amber-900 font-extrabold"
            }`}>
              <Receipt className="w-3.5 h-3.5 hidden 2xl:block" />
              <span>FINANCE</span>
              <ChevronDown className="w-3 h-3 transition-transform duration-300 group-hover/dd:rotate-180" />
            </button>
            {activeDropdown === "finance" && (
              <div className={`absolute top-full left-0 w-72 max-h-[85vh] overflow-y-auto origin-top-left animate-dropdown-in ${isDark ? "bg-[#001a2c] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"} border rounded-2xl shadow-2xl p-2 z-[110] capitalize normal-case text-xs space-y-1`}>
                <div className="px-3 py-1 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
                  <span>Finance &amp; Contracts</span>
                  <span className="text-amber-600 font-bold">5 Modules</span>
                </div>
                <Link onClick={() => setActiveDropdown(null)} href="/invoices" className={`flex items-center gap-2.5 p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-emerald-50 text-emerald-900"} font-bold`}>
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div>Billing Invoices</div>
                    <div className="text-[11px] text-slate-400 font-normal">Client Invoices &amp; Ledger</div>
                  </div>
                </Link>
                <Link onClick={() => setActiveDropdown(null)} href="/accounts-receivable" className={`flex items-center gap-2.5 p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-blue-50 text-blue-900"} font-bold`}>
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <div>
                    <div>Accounts Receivable</div>
                    <div className="text-[11px] text-slate-400 font-normal">Client Inflows &amp; Aging</div>
                  </div>
                </Link>
                <Link onClick={() => setActiveDropdown(null)} href="/accounts-payable" className={`flex items-center gap-2.5 p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-rose-50 text-rose-900"} font-bold`}>
                  <Receipt className="w-4 h-4 text-rose-600" />
                  <div>
                    <div>Accounts Payable</div>
                    <div className="text-[11px] text-slate-400 font-normal">Vendor Bills &amp; Outflows</div>
                  </div>
                </Link>
                <Link onClick={() => setActiveDropdown(null)} href="/service-orders" className={`flex items-center gap-2.5 p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-sky-50 text-[#00618e]"} font-bold`}>
                  <ClipboardList className="w-4 h-4 text-[#0084bf]" />
                  <div>
                    <div>Service Orders</div>
                    <div className="text-[11px] text-slate-400 font-normal">Client Engagement Contracts</div>
                  </div>
                </Link>
                <Link onClick={() => setActiveDropdown(null)} href="/purchase-orders" className={`flex items-center gap-2.5 p-2 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-amber-50 text-amber-900"} font-bold`}>
                  <FileText className="w-4 h-4 text-amber-600" />
                  <div>
                    <div>Purchase Orders</div>
                    <div className="text-[11px] text-slate-400 font-normal">Procurement &amp; PO Tracking</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* MAIN TITLE 2: SOPS */}
          <div className="relative group/dd" onMouseEnter={() => setActiveDropdown("sops")} onMouseLeave={() => setActiveDropdown(null)}>
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "sops" ? null : "sops")}
              className={`flex items-center gap-1 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl transition-all cursor-pointer ${
              pathname.startsWith("/sops") || pathname.startsWith("/tpi-process-flow")
                ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-extrabold shadow-md"
                : isDark
                ? "text-emerald-400 hover:bg-slate-800 font-extrabold"
                : "text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 font-extrabold"
            }`}>
              <FileText className="w-3.5 h-3.5 hidden 2xl:block" />
              <span>SOPS</span>
              <ChevronDown className="w-3 h-3 transition-transform duration-300 group-hover/dd:rotate-180" />
            </button>
            {activeDropdown === "sops" && (
              <div className={`absolute top-full left-0 w-72 max-h-[85vh] overflow-y-auto origin-top-left animate-dropdown-in ${isDark ? "bg-[#001a2c] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"} border rounded-2xl shadow-2xl p-2 z-[110] capitalize normal-case text-xs space-y-1.5`}>
                <div className="px-3 py-1 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
                  <span>Standard Operating Procedures</span>
                  <span className="text-emerald-600 font-bold">SOP Hub</span>
                </div>
                <Link
                  onClick={() => setActiveDropdown(null)}
                  href="/sops"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname === "/sops"
                      ? isDark ? "bg-emerald-950/70 text-white" : "bg-emerald-50 text-emerald-800"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">SOP Library</div>
                    <div className="text-[11px] text-slate-400 truncate">SOP-01 to SOP-08 Procedures</div>
                  </div>
                </Link>
                <Link
                  onClick={() => setActiveDropdown(null)}
                  href="/tpi-process-flow"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname === "/tpi-process-flow"
                      ? isDark ? "bg-teal-950/70 text-white" : "bg-teal-50 text-teal-800"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-teal-100 dark:bg-teal-950/80 text-teal-600 flex items-center justify-center shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">TPI Process Flow</div>
                    <div className="text-[11px] text-slate-400 truncate">RFQ to Certificate Workflow</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* MAIN TITLE 3: WORK INSTRUCTIONS */}
          <div className="relative group/dd" onMouseEnter={() => setActiveDropdown("wi")} onMouseLeave={() => setActiveDropdown(null)}>
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "wi" ? null : "wi")}
              className={`flex items-center gap-1 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl transition-all cursor-pointer ${
              pathname.startsWith("/work-instructions")
                ? "bg-gradient-to-r from-amber-600 to-[#e35f14] text-white font-extrabold shadow-md"
                : isDark
                ? "text-amber-400 hover:bg-slate-800 font-extrabold"
                : "text-amber-800 hover:bg-amber-50 hover:text-amber-900 font-extrabold"
            }`}>
              <CheckSquare className="w-3.5 h-3.5 hidden 2xl:block" />
              <span>WORK INSTRUCTIONS</span>
              <ChevronDown className="w-3 h-3 transition-transform duration-300 group-hover/dd:rotate-180" />
            </button>
            {activeDropdown === "wi" && (
              <div className={`absolute top-full left-0 w-80 max-h-[85vh] overflow-y-auto origin-top-left animate-dropdown-in ${isDark ? "bg-[#001a2c] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"} border rounded-2xl shadow-2xl p-2 z-[110] capitalize normal-case text-xs space-y-1.5`}>
                <div className="px-3 py-1 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
                  <span>Field Execution Protocols</span>
                  <span className="text-amber-600 font-bold">WI Library</span>
                </div>
                <Link
                  onClick={() => setActiveDropdown(null)}
                  href="/work-instructions"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname === "/work-instructions"
                      ? isDark ? "bg-amber-950/70 text-white" : "bg-amber-50 text-amber-900"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-amber-100 dark:bg-amber-950/80 text-[#e35f14] flex items-center justify-center shrink-0">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Field Inspection Protocols</div>
                    <div className="text-[11px] text-slate-400 truncate">WI-01 to WI-08 Technical Guides</div>
                  </div>
                </Link>
                <Link
                  onClick={() => setActiveDropdown(null)}
                  href="/work-instructions#civil"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-sky-100 dark:bg-sky-950/80 text-[#0084bf] flex items-center justify-center shrink-0">
                    <Ruler className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Civil &amp; Structural Protocols</div>
                    <div className="text-[11px] text-slate-400 truncate">Pre-pour, Rebar &amp; MEP Verification</div>
                  </div>
                </Link>
                <Link
                  onClick={() => setActiveDropdown(null)}
                  href="/work-instructions#mechanical"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Mechanical &amp; NDT Protocols</div>
                    <div className="text-[11px] text-slate-400 truncate">Weld Visual, NDT &amp; Hydrostatic</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* MAIN TITLE 4: QUALITY PLANS */}
          <div className="relative group/dd" onMouseEnter={() => setActiveDropdown("qp")} onMouseLeave={() => setActiveDropdown(null)}>
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "qp" ? null : "qp")}
              className={`flex items-center gap-1 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl transition-all cursor-pointer ${
              pathname.startsWith("/itps") || pathname.startsWith("/inspection-calls")
                ? "bg-gradient-to-r from-purple-600 to-brand-700 text-white font-extrabold shadow-md"
                : isDark
                ? "text-purple-400 hover:bg-slate-800 font-extrabold"
                : "text-purple-800 hover:bg-purple-50 hover:text-purple-900 font-extrabold"
            }`}>
              <Layers className="w-3.5 h-3.5 hidden 2xl:block" />
              <span>QUALITY PLANS</span>
              <ChevronDown className="w-3 h-3 transition-transform duration-300 group-hover/dd:rotate-180" />
            </button>
            {activeDropdown === "qp" && (
              <div className={`absolute top-full left-0 w-80 max-h-[85vh] overflow-y-auto origin-top-left animate-dropdown-in ${isDark ? "bg-[#001a2c] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"} border rounded-2xl shadow-2xl p-2 z-[110] capitalize normal-case text-xs space-y-1.5`}>
                <div className="px-3 py-1 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
                  <span>Inspection &amp; Test Plans (ITP)</span>
                  <span className="text-purple-600 font-bold">QA Plans</span>
                </div>
                <Link
                  onClick={() => setActiveDropdown(null)}
                  href="/itps"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname === "/itps"
                      ? isDark ? "bg-purple-950/70 text-white" : "bg-purple-50 text-purple-900"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Inspection &amp; Test Plans (ITP)</div>
                    <div className="text-[11px] text-slate-400 truncate">Hold &amp; Witness Point Matrix</div>
                  </div>
                </Link>
                <Link
                  onClick={() => setActiveDropdown(null)}
                  href="/inspection-calls"
                  className={`group/item flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                    pathname.startsWith("/inspection-calls")
                      ? isDark ? "bg-purple-950/70 text-white" : "bg-purple-50 text-purple-900"
                      : isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg transition-transform duration-300 group-hover/item:scale-110 bg-brand-100 dark:bg-brand-950/80 text-brand-600 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Inspection Calls</div>
                    <div className="text-[11px] text-slate-400 truncate">Hold &amp; witness points called for attendance</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* QMS Dropdown */}
          <div className="relative group/dd" onMouseEnter={() => setActiveDropdown("qms")} onMouseLeave={() => setActiveDropdown(null)}>
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "qms" ? null : "qms")}
              className={`flex items-center gap-1 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl transition-all cursor-pointer ${
              pathname.startsWith("/complaints")
                ? "bg-[#0084bf] text-white font-extrabold shadow-sm shadow-sky-500/20"
                : isDark
                ? "text-slate-100 hover:bg-slate-800 font-extrabold"
                : "text-[#004b6e] hover:bg-sky-50 hover:text-[#0084bf] font-extrabold"
            }`}>
              <span>QMS</span>
              <ChevronDown className={`w-3.5 h-3.5 ${isDark ? "text-slate-300" : "text-[#0084bf]"} transition-transform duration-300 group-hover/dd:rotate-180`} />
            </button>
            {activeDropdown === "qms" && (
              <div className={`absolute top-full left-0 w-56 max-h-[85vh] overflow-y-auto origin-top-left animate-dropdown-in ${isDark ? "bg-[#001a2c] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"} border rounded-2xl shadow-2xl p-1.5 z-[110] capitalize normal-case text-xs space-y-1`}>
                <Link onClick={() => setActiveDropdown(null)} href="/complaints" className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl ${isDark ? "hover:bg-slate-800 text-slate-100" : "hover:bg-amber-50 text-amber-800"} font-bold`}>
                  <Award className="w-4 h-4 text-[#e35f14]" /> Customer Complaints &amp; Feedback
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Header Quick Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Navigation Toggle (Visible on lg:hidden) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50 dark:bg-slate-800 text-[#00618e] dark:text-slate-100 hover:bg-sky-100 transition-colors cursor-pointer"
            title="Toggle All Modules Navigation"
            aria-label="Toggle All Modules Navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-[#e35f14]" /> : <Menu className="w-4 h-4 text-[#0084bf]" />}
          </button>

          {/* Quick Create Dropdown */}
          <div className="relative" ref={quickMenuRef}>
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              aria-expanded={showQuickMenu}
              aria-haspopup="menu"
              className="sheen flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0084bf] via-[#0075ab] to-[#e35f14] text-white text-xs font-bold transition-all duration-500 shadow-md glow-iqe-blue hover:shadow-glow-orange"
            >
              <Plus className={`w-4 h-4 transition-transform duration-300 ${showQuickMenu ? "rotate-45" : ""}`} />
              <span className="hidden sm:inline">Create</span>
            </button>

            {showQuickMenu && (
              <div role="menu" className={`absolute right-0 top-12 w-56 origin-top-right animate-dropdown-in ${isDark ? "bg-[#001a2c] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"} border rounded-2xl shadow-2xl p-1.5 z-[110]`}>
                <Link
                  href="/jobs/new"
                  onClick={() => setShowQuickMenu(false)}
                  className="group/item flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold hover:bg-sky-50 dark:hover:bg-slate-800 rounded-xl transition-all hover:translate-x-0.5"
                >
                  <Briefcase className="w-4 h-4 text-[#0084bf]" />
                  <span>New Assignment</span>
                </Link>
                <Link
                  href="/visits/new"
                  onClick={() => setShowQuickMenu(false)}
                  className="group/item flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold hover:bg-sky-50 dark:hover:bg-slate-800 rounded-xl transition-all hover:translate-x-0.5"
                >
                  <CalendarCheck className="w-4 h-4 text-emerald-600" />
                  <span>Schedule Inspector Visit</span>
                </Link>
                <Link
                  href="/tpi-billing"
                  onClick={() => setShowQuickMenu(false)}
                  className="group/item flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold hover:bg-amber-50 dark:hover:bg-slate-800 rounded-xl transition-all hover:translate-x-0.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#e35f14]" />
                  <span>New RA Bill Claim</span>
                </Link>
              </div>
            )}
          </div>

          {/* Theme Dropdown */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              aria-expanded={showThemeMenu}
              aria-haspopup="menu"
              className="p-2 px-3 rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50/80 dark:bg-slate-800 hover:bg-sky-100 text-[#00618e] dark:text-slate-100 flex items-center gap-1.5 text-xs font-extrabold shadow-xs"
              title="Theme Switcher"
            >
              <Palette className={`w-4 h-4 text-[#e35f14] transition-transform duration-500 ${showThemeMenu ? "rotate-180" : ""}`} />
              <span className="hidden 2xl:inline">{THEME_LABELS[theme]}</span>
            </button>
            {showThemeMenu && changeTheme && (
              <div role="menu" className="absolute right-0 top-11 w-56 origin-top-right animate-dropdown-in bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 z-[110] text-xs space-y-0.5">
                <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Appearance</div>
                {([
                  { id: "iqe-brand", label: "IQE Brand", swatch: "from-[#0084bf] to-[#e35f14]" },
                  { id: "google-light", label: "Google Light", swatch: "from-slate-100 to-white" },
                  { id: "google-dark", label: "Google Dark", swatch: "from-[#001a2c] to-slate-700" },
                  { id: "material-blue", label: "Material Blue", swatch: "from-sky-300 to-[#0084bf]" },
                ] as { id: ThemeType; label: string; swatch: string }[]).map((t) => (
                  <button
                    key={t.id}
                    role="menuitemradio"
                    aria-checked={theme === t.id}
                    onClick={() => { changeTheme(t.id); setShowThemeMenu(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 font-bold transition-colors ${
                      theme === t.id
                        ? "bg-sky-50 dark:bg-slate-800 text-[#00618e] dark:text-sky-300"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-md bg-gradient-to-br ${t.swatch} border border-slate-200 dark:border-slate-700 shadow-xs shrink-0`} />
                    <span className="flex-1">{t.label}</span>
                    {theme === t.id && <Check className="w-3.5 h-3.5 text-[#0084bf] animate-scale-up" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Avatar & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#0084bf] to-[#e35f14] text-white font-bold flex items-center justify-center text-xs shadow-sm ring-2 ring-white dark:ring-slate-900 hover:scale-105 transition-transform">
              <User className="w-4 h-4" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" title="Online" />
            </div>
            <button
              onClick={handleLogout}
              className="group/logout p-2 rounded-xl text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors"
              aria-label="Sign out"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 transition-transform duration-300 group-hover/logout:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Header Bar with AI Search */}
      <div className={`px-4 sm:px-6 py-2 ${isDark ? "bg-[#080e21] border-slate-800" : "bg-slate-50/90 border-slate-200/80"} border-t flex items-center justify-between gap-4 text-xs`}>
        <div className="relative flex-1 max-w-xl" ref={searchBoxRef}>
          <form onSubmit={handleSearch} className="relative group/search">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value) setSearchResults(null);
              }}
              placeholder="Search for assignments, clients, visits, TPI bill verification numbers..."
              aria-label="Search"
              className={`w-full pl-9 pr-20 py-1.5 text-xs font-semibold ${isDark ? "bg-slate-800 text-white border-slate-700 placeholder-slate-400" : "bg-white text-slate-900 border-slate-300 placeholder-slate-500"} border rounded-xl focus:outline-none focus:ring-4 focus:ring-[#0084bf]/15 focus:border-[#0084bf] shadow-inner`}
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 transition-colors group-focus-within/search:text-[#0084bf]" />
            <kbd className={`hidden sm:flex absolute right-9 top-1.5 items-center gap-0.5 px-1.5 h-5 rounded-md border text-[11px] font-mono font-bold pointer-events-none transition-opacity group-focus-within/search:opacity-0 ${isDark ? "border-slate-600 text-slate-400 bg-slate-900" : "border-slate-200 text-slate-400 bg-slate-50"}`}>
              Ctrl K
            </kbd>
            <button type="submit" className="absolute right-2 top-1 p-1 rounded-lg text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-700" title="AI Search" aria-label="Run AI search">
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            </button>
          </form>

          {searchResults && (
            <div className="absolute top-10 left-0 w-full origin-top animate-dropdown-in bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[110] max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between px-2 mb-1 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {searchResults.length} result{searchResults.length === 1 ? "" : "s"}
                </span>
                <button onClick={() => setSearchResults(null)} className="text-[11px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">Esc</button>
              </div>
              {searchResults.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-2 text-center animate-fade-in">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <SearchX className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No matches for &ldquo;{query}&rdquo;</p>
                  <p className="text-[11px] text-slate-400">Try an assignment ID, client name or bill number.</p>
                </div>
              ) : (
                <div className="stagger space-y-0.5">
                  {searchResults.map((item: any, idx: number) => (
                    <button type="button" key={idx} onClick={() => { setSearchResults(null); if (item.type === "job") router.push(`/jobs/${item.id}`); }} className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center gap-3 text-xs transition-colors">
                      <span className="font-semibold truncate">{item.title || item.id}</span>
                      <span className="shrink-0 px-2 py-0.5 rounded-full badge-iqe text-[11px] uppercase font-bold">{item.type === 'job' ? 'Assignment' : item.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Responsive Mobile Drawer for Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 max-h-[75vh] overflow-y-auto space-y-4 animate-dropdown-in shadow-2xl">
          {/* Section 1: ADMIN & ANALYTICS */}
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> ADMIN &amp; OVERVIEW
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              <Link
                href="/clients"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <Building2 className="w-4 h-4 text-[#0084bf]" /> Clients &amp; Corporate Details
              </Link>
              <Link
                href="/manufacturers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <Factory className="w-4 h-4 text-[#e35f14]" /> Manufacturers Directory
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" /> Admin System Settings
              </Link>
              <Link
                href="/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <BarChart3 className="w-4 h-4 text-[#0084bf]" /> Analytics Dashboard
              </Link>
            </div>
          </div>

          {/* Section 2: OPERATIONS & FIELD */}
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-500 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5" /> OPERATIONS &amp; FIELD
              </span>
              <span>8 Modules</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              <Link
                href="/visit-schedule"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <CalendarCheck className="w-4 h-4 text-blue-500" />
                <div>
                  <div>Visit Schedule</div>
                  <div className="text-[11px] text-slate-400 font-normal">Inspection Calendar &amp; Timeline</div>
                </div>
              </Link>
              <Link
                href="/open-calls"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <PhoneCall className="w-4 h-4 text-amber-600" />
                <div>
                  <div>Open Calls Intake</div>
                  <div className="text-[11px] text-slate-400 font-normal">Customer Call Request Intake</div>
                </div>
              </Link>
              <Link
                href="/visits"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <CalendarCheck className="w-4 h-4 text-[#0084bf]" />
                <div>
                  <div>Field Visits</div>
                  <div className="text-[11px] text-slate-400 font-normal">Site Visits &amp; Attendance</div>
                </div>
              </Link>
              <Link
                href="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <Briefcase className="w-4 h-4 text-purple-600" />
                <div>
                  <div>Assessments / Jobs</div>
                  <div className="text-[11px] text-slate-400 font-normal">Active Inspection Assignments</div>
                </div>
              </Link>
              <Link
                href="/proposed-assignments"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <Users className="w-4 h-4 text-indigo-600" />
                <div>
                  <div>Proposed Assignments</div>
                  <div className="text-[11px] text-slate-400 font-normal">Inspector Allocation Matrix</div>
                </div>
              </Link>
              <Link
                href="/logsheet"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <HardHat className="w-4 h-4 text-teal-600" />
                <div>
                  <div>Site Daily Logsheet</div>
                  <div className="text-[11px] text-slate-400 font-normal">Daily Inspection Records</div>
                </div>
              </Link>
              <Link
                href="/control-numbers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <div>
                  <div>Control Numbers</div>
                  <div className="text-[11px] text-slate-400 font-normal">IRN / IVR Certificate Registry</div>
                </div>
              </Link>
              <Link
                href="/verify"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <Shield className="w-4 h-4 text-emerald-600" />
                <div>
                  <div>Public Authenticator</div>
                  <div className="text-[11px] text-slate-400 font-normal">QR Certificate Verification</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Section 3: FORMATS */}
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-500 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" /> INSPECTION FORMATS
              </span>
              <span>10 Formats</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              <Link
                href="/pms-formats"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <div>
                  <div>PMS Formats Hub</div>
                  <div className="text-[11px] text-slate-400 font-normal">Master Formats Directory</div>
                </div>
              </Link>
              <Link
                href="/tpi-billing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#0084bf]" />
                <div>
                  <div>Bill Verification</div>
                  <div className="text-[11px] text-slate-400 font-normal">RA Bills &amp; TPI (F-BILL-01)</div>
                </div>
              </Link>
              <Link
                href="/boq-reconciliation"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <div>
                  <div>BOQ Reconciliation</div>
                  <div className="text-[11px] text-slate-400 font-normal">Material Audit (F-BOQ-01)</div>
                </div>
              </Link>
              <Link
                href="/construction-bill-verification"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-cyan-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <Table className="w-4 h-4 text-cyan-600" />
                <div>
                  <div>Construction Bill Verification</div>
                  <div className="text-[11px] text-slate-400 font-normal">27-Col Measurement Matrix</div>
                </div>
              </Link>
              <Link
                href="/flash-inspection-report"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <Zap className="w-4 h-4 text-amber-600" />
                <div>
                  <div>Flash Inspection Report</div>
                  <div className="text-[11px] text-slate-400 font-normal">Preliminary (IQE-TP-02)</div>
                </div>
              </Link>
              <Link
                href="/inspection-visit-report"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <div>
                  <div>Inspection Visit Report</div>
                  <div className="text-[11px] text-slate-400 font-normal">Formal Visit (IQE-TP-03)</div>
                </div>
              </Link>
              <Link
                href="/inspection-release-note"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                <div>
                  <div>Inspection Release Note</div>
                  <div className="text-[11px] text-slate-400 font-normal">Dispatch Clearance (IQE-TP-04)</div>
                </div>
              </Link>
              <Link
                href="/expediting-visit-report"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <Compass className="w-4 h-4 text-teal-600" />
                <div>
                  <div>Expediting Visit Report</div>
                  <div className="text-[11px] text-slate-400 font-normal">Supplier Audit (IQE-TP-05)</div>
                </div>
              </Link>
              <Link
                href="/quality-bill-verification"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <div>
                  <div>Quality Verification</div>
                  <div className="text-[11px] text-slate-400 font-normal">Quality Audit (F-QUAL-01)</div>
                </div>
              </Link>
              <Link
                href="/schedule-m-pharma-epc"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <Pill className="w-4 h-4 text-[#e35f14]" />
                <div>
                  <div>Mpharma EPC</div>
                  <div className="text-[11px] text-slate-400 font-normal">F-01 to F-12 Formats</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Section 4: FINANCE & CONTRACTS */}
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-500 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> FINANCE &amp; CONTRACTS
              </span>
              <span>5 Modules</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              <Link
                href="/invoices"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <Receipt className="w-4 h-4 text-emerald-600" />
                <div>
                  <div>Billing Invoices</div>
                  <div className="text-[11px] text-slate-400 font-normal">Client Invoices &amp; Ledger</div>
                </div>
              </Link>
              <Link
                href="/accounts-receivable"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
                <div>
                  <div>Accounts Receivable</div>
                  <div className="text-[11px] text-slate-400 font-normal">Client Inflows &amp; Aging</div>
                </div>
              </Link>
              <Link
                href="/accounts-payable"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <Receipt className="w-4 h-4 text-rose-600" />
                <div>
                  <div>Accounts Payable</div>
                  <div className="text-[11px] text-slate-400 font-normal">Vendor Bills &amp; Outflows</div>
                </div>
              </Link>
              <Link
                href="/service-orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <ClipboardList className="w-4 h-4 text-[#0084bf]" />
                <div>
                  <div>Service Orders</div>
                  <div className="text-[11px] text-slate-400 font-normal">Client Service Engagements</div>
                </div>
              </Link>
              <Link
                href="/purchase-orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              >
                <FileText className="w-4 h-4 text-amber-600" />
                <div>
                  <div>Purchase Orders</div>
                  <div className="text-[11px] text-slate-400 font-normal">Procurement &amp; PO Tracking</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Section 5: SOPS, WI, QP, QMS */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-[11px] font-extrabold uppercase text-slate-400 mb-1">SOPS</p>
                <Link
                  href="/sops"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1 hover:text-[#0084bf] font-semibold text-slate-700 dark:text-slate-300"
                >
                  SOP Library
                </Link>
                <Link
                  href="/tpi-process-flow"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1 hover:text-[#0084bf] font-semibold text-slate-700 dark:text-slate-300"
                >
                  Process Flow
                </Link>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase text-slate-400 mb-1">WORK INSTR.</p>
                <Link
                  href="/work-instructions"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1 hover:text-[#0084bf] font-semibold text-slate-700 dark:text-slate-300"
                >
                  Field Protocols
                </Link>
                <Link
                  href="/work-instructions#civil"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1 hover:text-[#0084bf] font-semibold text-slate-700 dark:text-slate-300"
                >
                  Civil &amp; Structural
                </Link>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase text-slate-400 mb-1">QUALITY PLANS</p>
                <Link
                  href="/itps"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1 hover:text-[#0084bf] font-semibold text-slate-700 dark:text-slate-300"
                >
                  ITP Matrix
                </Link>
                <Link
                  href="/inspection-calls"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1 hover:text-[#0084bf] font-semibold text-slate-700 dark:text-slate-300"
                >
                  Inspection Calls
                </Link>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase text-slate-400 mb-1">QMS</p>
                <Link
                  href="/complaints"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1 hover:text-[#0084bf] font-semibold text-slate-700 dark:text-slate-300"
                >
                  Complaints &amp; Feedback
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
