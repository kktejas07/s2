"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  CalendarCheck,
  FileText,
  Building2,
  Factory,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  LogOut,
  ChevronRight,
  ChevronDown,
  Shield,
  AlertTriangle,
  FileSpreadsheet,
  CheckSquare,
  Pill,
  Layers,
  Compass,
  Zap,
  PackageCheck,
  BookOpen,
  BarChart3,
  Award,
  PhoneCall,
  HardHat,
  Receipt,
  CreditCard,
  Table, Boxes, FileCheck, Users, UserCheck, Gauge,
  Camera, Scale, History,
  MapPin, UserPlus, Clock, DollarSign, Star, LogIn,
  ShoppingCart, FileSearch, ListChecks, MessageSquare,
  ArrowRightLeft, PenTool, TrendingUp, Bell
} from "@/components/icons";

interface SidebarProps {
  isCollapsed?: boolean;
  toggleSidebar?: () => void;
  theme?: string;
}

interface SubModuleItem {
  name: string;
  subtitle: string;
  href: string;
  icon: any;
  color: string;
}

const formatsSubModules: SubModuleItem[] = [
  {
    name: "PMS Formats Hub",
    subtitle: "Master Formats Index",
    href: "/pms-formats",
    icon: BookOpen,
    color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40",
  },
  {
    name: "Flash Inspection",
    subtitle: "Quick Day Summary (IQE-TP-02)",
    href: "/flash-inspection-report",
    icon: Zap,
    color: "text-amber-600 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
  },
  {
    name: "Inspection Visit",
    subtitle: "Complete Visit Report (IQE-TP-03)",
    href: "/inspection-visit-report",
    icon: FileSpreadsheet,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
  },
  {
    name: "Inspection Release (IRN)",
    subtitle: "Dispatch Clearance (IQE-TP-04)",
    href: "/inspection-release-note",
    icon: PackageCheck,
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
  },
  {
    name: "Expediting Report",
    subtitle: "Vendor Visit & Fab (IQE-TP-05)",
    href: "/expediting-visit-report",
    icon: Compass,
    color: "text-teal-600 bg-teal-100 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800/40",
  },
  {
    name: "Bill Verification",
    subtitle: "RA Bills & TPI Billing (F-BILL-01)",
    href: "/tpi-billing",
    icon: FileSpreadsheet,
    color: "text-[#0084bf] bg-sky-100 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800/40",
  },
  {
    name: "BOQ Reconciliation",
    subtitle: "Material & Quantity Audit (F-BOQ-01)",
    href: "/boq-reconciliation",
    icon: Layers,
    color: "text-purple-600 bg-purple-100 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800/40",
  },
  {
    name: "Construction Matrix",
    subtitle: "27-Col Measurement Verification",
    href: "/construction-bill-verification",
    icon: Table,
    color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40",
  },
  {
    name: "Quality Verification",
    subtitle: "Concealed Work & Quality Audit",
    href: "/quality-bill-verification",
    icon: ShieldCheck,
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
  },
  {
    name: "Mpharma EPC",
    subtitle: "Formats F-01 to F-12",
    href: "/schedule-m-pharma-epc",
    icon: Pill,
    color: "text-[#e35f14] bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
  },
];

const operationsSubModules: SubModuleItem[] = [
  {
    name: "Console",
    subtitle: "Your role's open items",
    href: "/console",
    icon: Gauge,
    color: "text-[#0084bf] bg-sky-100 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800/40",
  },
  {
    name: "People",
    subtitle: "Competence & authorization",
    href: "/people",
    icon: Users,
    color: "text-violet-600 bg-violet-100 dark:bg-violet-950/80 dark:text-violet-300 border-violet-200 dark:border-violet-800/40",
  },
  {
    name: "Work Packages",
    subtitle: "Scope, assignment & certification",
    href: "/work-packages",
    icon: Layers,
    color: "text-[#0084bf] bg-sky-100 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800/40",
  },
  {
    name: "Assignments",
    subtitle: "Who is qualified to take the work",
    href: "/assignments",
    icon: UserCheck,
    color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40",
  },
  {
    name: "Work Types",
    subtitle: "How each kind of work is run",
    href: "/work-types",
    icon: Boxes,
    color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40",
  },
  {
    name: "Certifications",
    subtitle: "Claimed vs certified value",
    href: "/certifications",
    icon: FileCheck,
    color: "text-[#e35f14] bg-orange-100 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-800/40",
  },
  {
    name: "Billing",
    subtitle: "Certified work ready to invoice",
    href: "/billing",
    icon: Receipt,
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
  },
  {
    name: "Reports",
    subtitle: "Formats & end-to-end project report",
    href: "/reports",
    icon: FileText,
    color: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  {
    name: "Visit Schedule",
    subtitle: "Inspection Calendar & Timeline",
    href: "/visit-schedule",
    icon: CalendarCheck,
    color: "text-blue-500 bg-blue-100 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
  },
  {
    name: "Open Calls Intake",
    subtitle: "Customer Inspection Call Registry",
    href: "/open-calls",
    icon: PhoneCall,
    color: "text-amber-600 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
  },
  {
    name: "Proposed Assignments",
    subtitle: "Inspector Allocation Matrix",
    href: "/proposed-assignments",
    icon: Briefcase,
    color: "text-purple-600 bg-purple-100 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800/40",
  },
  {
    name: "Site Daily Logsheet",
    subtitle: "Daily Inspection & Attendance",
    href: "/logsheet",
    icon: HardHat,
    color: "text-teal-600 bg-teal-100 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800/40",
  },
  {
    name: "Control Numbers",
    subtitle: "IRN / IVR Certificate Control",
    href: "/control-numbers",
    icon: ShieldCheck,
    color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40",
  },
  {
    name: "Enquiries",
    subtitle: "Bid Gate, Proposals & Award",
    href: "/enquiries",
    icon: Briefcase,
    color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40",
  },
  {
    name: "Pipeline",
    subtitle: "Funnel, Win Rate & Loss Reasons",
    href: "/pipeline",
    icon: BarChart3,
    color: "text-violet-600 bg-violet-100 dark:bg-violet-950/80 dark:text-violet-300 border-violet-200 dark:border-violet-800/40",
  },
  {
    name: "Evidence & Checks",
    subtitle: "Photographs, Certificates, Readiness",
    href: "/evidence",
    icon: Camera,
    color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40",
  },
  {
    name: "Public Authenticator",
    subtitle: "QR Certificate Verification",
    href: "/verify",
    icon: Shield,
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
  },
];

const financeSubModules: SubModuleItem[] = [
  {
    name: "Rate Cards & Floors",
    subtitle: "Pricing, Discounts & the Rate Floor",
    href: "/rates",
    icon: Receipt,
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
  },
  {
    name: "Contracts & Amendments",
    subtitle: "Order Ceilings, Periods & Renewals",
    href: "/contracts",
    icon: FileText,
    color: "text-amber-600 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
  },
  {
    name: "Billing Invoices",
    subtitle: "Client Invoices & Records",
    href: "/invoices",
    icon: Receipt,
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
  },
  {
    name: "Accounts Receivable",
    subtitle: "Customer Inflows & Tracking",
    href: "/accounts-receivable",
    icon: CreditCard,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
  },
  {
    name: "Accounts Payable",
    subtitle: "Vendor Outflows & Bills",
    href: "/accounts-payable",
    icon: Receipt,
    color: "text-rose-600 bg-rose-100 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800/40",
  },
  {
    name: "Service Orders",
    subtitle: "Client Service Engagements",
    href: "/service-orders",
    icon: ClipboardList,
    color: "text-[#0084bf] bg-sky-100 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800/40",
  },
  {
    name: "Purchase Orders",
    subtitle: "Procurement & PO Tracking",
    href: "/purchase-orders",
    icon: FileText,
    color: "text-amber-600 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
  },
];

const sopsSubModules: SubModuleItem[] = [
  {
    name: "SOP Library",
    subtitle: "SOP-01 to SOP-08 Manuals",
    href: "/sops",
    icon: FileText,
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
  },
  {
    name: "TPI Process Flow",
    subtitle: "RFQ to Certificate Workflow",
    href: "/tpi-process-flow",
    icon: Sparkles,
    color: "text-teal-600 bg-teal-100 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800/40",
  },
  {
    name: "Complaints & Feedback",
    subtitle: "Customer Service Quality Log",
    href: "/complaints",
    icon: Award,
    color: "text-amber-600 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
  },
  {
    name: "External Providers",
    subtitle: "Subcontractors & Calibration Labs",
    href: "/providers",
    icon: Building2,
    color: "text-teal-600 bg-teal-100 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800/40",
  },
  {
    name: "Nonconformities",
    subtitle: "Findings, Dispositions & Closure",
    href: "/ncrs",
    icon: AlertTriangle,
    color: "text-rose-600 bg-rose-100 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800/40",
  },
  {
    name: "Impartiality Exposure",
    subtitle: "Revenue Concentration & Inspector Ties",
    href: "/impartiality",
    icon: Shield,
    color: "text-amber-600 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
  },
  {
    name: "Risk Register",
    subtitle: "Risks, Controls & Audit Plan",
    href: "/risks",
    icon: Shield,
    color: "text-rose-600 bg-rose-100 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800/40",
  },
  {
    name: "Appeals",
    subtitle: "Challenges to Issued Decisions",
    href: "/appeals",
    icon: Scale,
    color: "text-violet-600 bg-violet-100 dark:bg-violet-950/80 dark:text-violet-300 border-violet-200 dark:border-violet-800/40",
  },
  {
    name: "Equipment Register",
    subtitle: "Instruments & Calibration Status",
    href: "/equipment",
    icon: Gauge,
    color: "text-sky-600 bg-sky-100 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800/40",
  },
  {
    name: "Audit Trail",
    subtitle: "Who Changed What, and When",
    href: "/audit",
    icon: History,
    color: "text-slate-600 bg-slate-100 dark:bg-slate-900/80 dark:text-slate-300 border-slate-200 dark:border-slate-700/40",
  },
];

const hrmsSubModules: SubModuleItem[] = [
  { name: "Regions & Offices", subtitle: "N/S/E/W structure & deputies", href: "/regions", icon: MapPin, color: "text-blue-600 bg-blue-100 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800/40" },
  { name: "Recruitment", subtitle: "Manpower requests to induction", href: "/recruitment", icon: UserPlus, color: "text-violet-600 bg-violet-100 dark:bg-violet-950/80 dark:text-violet-300 border-violet-200 dark:border-violet-800/40" },
  { name: "Leave & Attendance", subtitle: "Leave, attendance & timesheets", href: "/leave-attendance", icon: Clock, color: "text-teal-600 bg-teal-100 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800/40" },
  { name: "Payroll", subtitle: "Runs, PF/ESI/PT & payslips", href: "/payroll", icon: DollarSign, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40" },
  { name: "Appraisals", subtitle: "KPIs & witnessed inspections", href: "/appraisals-monitoring", icon: Star, color: "text-amber-600 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/40" },
  { name: "Exit Management", subtitle: "Separation & final settlement", href: "/exit-management", icon: LogIn, color: "text-rose-600 bg-rose-100 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800/40" },
  { name: "Purchasing", subtitle: "Requisitions & vendor payments", href: "/purchasing", icon: ShoppingCart, color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40" },
];

const projectExecSubModules: SubModuleItem[] = [
  { name: "RFIs", subtitle: "Request for inspection", href: "/rfis", icon: FileSearch, color: "text-blue-600 bg-blue-100 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800/40" },
  { name: "Punch List", subtitle: "Snag items A/B/C", href: "/punch-list", icon: ListChecks, color: "text-amber-600 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/40" },
  { name: "Release Notes", subtitle: "IRN sign-off & release", href: "/release-notes", icon: PackageCheck, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40" },
  { name: "Client Feedback", subtitle: "Ratings & MRM review", href: "/client-feedback", icon: MessageSquare, color: "text-violet-600 bg-violet-100 dark:bg-violet-950/80 dark:text-violet-300 border-violet-200 dark:border-violet-800/40" },
  { name: "Job Handoff", subtitle: "Enquiry → job conversion", href: "/job-handoff", icon: ArrowRightLeft, color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40" },
  { name: "Report Sign-off", subtitle: "TM/deputy approval gate", href: "/signoffs", icon: PenTool, color: "text-teal-600 bg-teal-100 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800/40" },
  { name: "Win-Loss Analysis", subtitle: "Conversion & loss reasons", href: "/win-loss", icon: TrendingUp, color: "text-rose-600 bg-rose-100 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800/40" },
];

const generalNavItems = [
  { name: "Vendor Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Assessments", href: "/jobs", icon: Briefcase },
  { name: "Visits", href: "/visits", icon: CalendarCheck },
  { name: "Clients", href: "/clients", icon: Building2 },
  { name: "Manufacturers", href: "/manufacturers", icon: Factory },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Admin System", href: "/admin", icon: ShieldCheck },
];

export function Sidebar({ isCollapsed, toggleSidebar, theme }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string>("user");
  const [userName, setUserName] = useState<string>("TPI Engineer");
  const [formatsOpen, setFormatsOpen] = useState<boolean>(true);
  const [operationsOpen, setOperationsOpen] = useState<boolean>(false);
  const [financeOpen, setFinanceOpen] = useState<boolean>(false);
  const [sopsOpen, setSopsOpen] = useState<boolean>(false);
  const [hrmsOpen, setHrmsOpen] = useState<boolean>(false);
  const [projectExecOpen, setProjectExecOpen] = useState<boolean>(false);

  const isFormatsActive =
    pathname.startsWith("/pms-formats") ||
    pathname.startsWith("/flash-inspection-report") ||
    pathname.startsWith("/inspection-visit-report") ||
    pathname.startsWith("/inspection-release-note") ||
    pathname.startsWith("/expediting-visit-report") ||
    pathname.startsWith("/boq-reconciliation") ||
    pathname.startsWith("/construction-bill-verification") ||
    pathname.startsWith("/tpi-billing") ||
    pathname.startsWith("/quality-bill-verification") ||
    pathname.startsWith("/schedule-m-pharma-epc");

  const isOperationsActive =
    pathname.startsWith("/visit-schedule") ||
    pathname.startsWith("/open-calls") ||
    pathname.startsWith("/proposed-assignments") ||
    pathname.startsWith("/logsheet") ||
    pathname.startsWith("/control-numbers") ||
    pathname.startsWith("/evidence") ||
    pathname.startsWith("/enquiries") ||
    pathname.startsWith("/pipeline") ||
    pathname.startsWith("/verify");

  const isFinanceActive =
    pathname.startsWith("/contracts") ||
    pathname.startsWith("/rates") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/accounts-receivable") ||
    pathname.startsWith("/accounts-payable") ||
    pathname.startsWith("/service-orders") ||
    pathname.startsWith("/purchase-orders");

  const isSopsActive =
    pathname.startsWith("/sops") ||
    pathname.startsWith("/tpi-process-flow") ||
    pathname.startsWith("/complaints") ||
    pathname.startsWith("/appeals") ||
    pathname.startsWith("/equipment") ||
    pathname.startsWith("/audit") ||
    pathname.startsWith("/providers") ||
    pathname.startsWith("/risks") ||
    pathname.startsWith("/ncrs") ||
    pathname.startsWith("/impartiality");

  const isHrmsActive =
    pathname.startsWith("/regions") ||
    pathname.startsWith("/recruitment") ||
    pathname.startsWith("/leave-attendance") ||
    pathname.startsWith("/payroll") ||
    pathname.startsWith("/appraisals-monitoring") ||
    pathname.startsWith("/exit-management") ||
    pathname.startsWith("/purchasing");

  const isProjectExecActive =
    pathname.startsWith("/rfis") ||
    pathname.startsWith("/punch-list") ||
    pathname.startsWith("/release-notes") ||
    pathname.startsWith("/client-feedback") ||
    pathname.startsWith("/job-handoff") ||
    pathname.startsWith("/signoffs") ||
    pathname.startsWith("/win-loss");

  const isWorkInstructionsActive = pathname.startsWith("/work-instructions");
  const isQualityPlansActive =
    pathname.startsWith("/itps") || pathname.startsWith("/inspection-calls");

  // Automatically expand active sections
  useEffect(() => {
    if (isOperationsActive) setOperationsOpen(true);
    if (isFinanceActive) setFinanceOpen(true);
    if (isSopsActive) setSopsOpen(true);
    if (isHrmsActive) setHrmsOpen(true);
    if (isProjectExecActive) setProjectExecOpen(true);
  }, [isOperationsActive, isFinanceActive, isSopsActive, isHrmsActive, isProjectExecActive]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const r = localStorage.getItem("user_role") || "user";
      const u = localStorage.getItem("user_name") || "TPI Engineer";
      setRole(r);
      setUserName(u);
    }
  }, [pathname]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    router.push("/login");
  };

  const getRoleBadge = () => {
    if (role === "admin") return { label: "Admin Mode", color: "bg-purple-950 text-purple-300 border-purple-800" };
    if (role === "tenant") return { label: "Tenant Client", color: "bg-blue-950 text-blue-300 border-blue-800" };
    return { label: "TPI Engineer", color: "bg-emerald-950 text-emerald-300 border-emerald-800" };
  };

  const badge = getRoleBadge();

  return (
    <aside
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-[#001a2c] border-r border-slate-800/80 flex flex-col justify-between min-h-screen text-slate-300 select-none flex-shrink-0 transition-all duration-300 z-40`}
    >
      <div>
        {/* Brand Header */}
        <div className={`p-4 border-b border-slate-800/80 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0084bf] to-[#e35f14] flex items-center justify-center text-white shadow-md glow-iqe-blue group-hover:scale-105 transition-transform duration-200 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div>
                <span className="font-heading text-lg font-bold tracking-tight text-white block">
                  IQEApp
                </span>
                <span className="text-[11px] uppercase tracking-widest text-[#e35f14] font-semibold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#0084bf]" /> Inspection AI
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Active Role Indicator */}
        {!isCollapsed && (
          <div className="mx-3 mt-4 p-3 rounded-2xl bg-gradient-to-br from-[#002b48] to-[#001a2c] border border-[#0084bf]/40 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <CheckSquare className="w-4 h-4 text-[#e35f14] shrink-0" />
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">TPI Verification Engine</p>
                <p className="text-[11px] text-sky-200/70 truncate">ISO & BOQ Compliance</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border uppercase shrink-0 ${badge.color}`}>
              {role}
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 mt-3">
          {!isCollapsed && (
            <p className="px-3 text-[11px] uppercase font-bold tracking-wider text-slate-400 mb-2">
              Main Navigation
            </p>
          )}

          {/* Dashboard Item */}
          <Link
            href="/dashboard"
            title={isCollapsed ? "Dashboard" : undefined}
            className={`flex items-center ${
              isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
            } py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              pathname === "/dashboard"
                ? "bg-gradient-to-r from-[#0084bf] to-[#00618e] text-white shadow-md glow-iqe-blue font-semibold border border-sky-400/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard
                className={`w-4 h-4 shrink-0 transition-colors ${
                  pathname === "/dashboard" ? "text-white" : "text-slate-400 group-hover:text-[#0084bf]"
                }`}
              />
              {!isCollapsed && <span className="truncate">Dashboard</span>}
            </div>
            {!isCollapsed && pathname === "/dashboard" && <ChevronRight className="w-4 h-4 text-[#e35f14] shrink-0" />}
          </Link>

          {/* MAIN TITLE 1: FORMATS */}
          <div className="pt-1">
            <button
              onClick={() => setFormatsOpen(!formatsOpen)}
              title={isCollapsed ? "Formats" : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
              } py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                isFormatsActive
                  ? "bg-[#0084bf]/20 text-sky-300 border border-[#0084bf]/40"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileSpreadsheet className="w-4 h-4 text-[#0084bf] shrink-0" />
                {!isCollapsed && <span className="truncate uppercase tracking-wider text-[11px]">Formats</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    formatsOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {/* Formats Sub-items */}
            {(!isCollapsed && formatsOpen) && (
              <div className="mt-1 pl-2.5 pr-1 space-y-1.5 border-l-2 border-[#0084bf]/30 ml-4 py-1">
                {formatsSubModules.map((item) => {
                  const SubIcon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-[#0084bf] to-[#00618e] text-white font-bold shadow-xs border border-sky-400/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${isActive ? "bg-white/20 text-white border-white/30" : item.color}`}>
                        <SubIcon className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate font-semibold text-xs leading-tight">
                          {item.name}
                        </div>
                        <div className={`text-[11px] truncate leading-tight ${isActive ? "text-sky-200" : "text-slate-400"}`}>
                          {item.subtitle}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* MAIN TITLE 2: OPERATIONS & FIELD */}
          <div className="pt-1">
            <button
              onClick={() => setOperationsOpen(!operationsOpen)}
              title={isCollapsed ? "Operations" : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
              } py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                isOperationsActive
                  ? "bg-blue-950/60 text-blue-300 border border-blue-800/60"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CalendarCheck className="w-4 h-4 text-blue-400 shrink-0" />
                {!isCollapsed && <span className="truncate uppercase tracking-wider text-[11px]">Operations</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    operationsOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {/* Operations Sub-items */}
            {(!isCollapsed && operationsOpen) && (
              <div className="mt-1 pl-2.5 pr-1 space-y-1.5 border-l-2 border-blue-500/30 ml-4 py-1">
                {operationsSubModules.map((item) => {
                  const SubIcon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold shadow-xs border border-blue-400/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${isActive ? "bg-white/20 text-white border-white/30" : item.color}`}>
                        <SubIcon className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate font-semibold text-xs leading-tight">
                          {item.name}
                        </div>
                        <div className={`text-[11px] truncate leading-tight ${isActive ? "text-blue-200" : "text-slate-400"}`}>
                          {item.subtitle}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* MAIN TITLE 3: FINANCE & ORDERS */}
          <div className="pt-1">
            <button
              onClick={() => setFinanceOpen(!financeOpen)}
              title={isCollapsed ? "Finance" : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
              } py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                isFinanceActive
                  ? "bg-amber-950/60 text-amber-300 border border-amber-800/60"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Receipt className="w-4 h-4 text-[#e35f14] shrink-0" />
                {!isCollapsed && <span className="truncate uppercase tracking-wider text-[11px]">Finance</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    financeOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {/* Finance Sub-items */}
            {(!isCollapsed && financeOpen) && (
              <div className="mt-1 pl-2.5 pr-1 space-y-1.5 border-l-2 border-amber-500/30 ml-4 py-1">
                {financeSubModules.map((item) => {
                  const SubIcon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-amber-600 to-[#e35f14] text-white font-bold shadow-xs border border-amber-400/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${isActive ? "bg-white/20 text-white border-white/30" : item.color}`}>
                        <SubIcon className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate font-semibold text-xs leading-tight">
                          {item.name}
                        </div>
                        <div className={`text-[11px] truncate leading-tight ${isActive ? "text-amber-200" : "text-slate-400"}`}>
                          {item.subtitle}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* MAIN TITLE 4: SOPS & QMS */}
          <div className="pt-1">
            <button
              onClick={() => setSopsOpen(!sopsOpen)}
              title={isCollapsed ? "SOPs" : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
              } py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                isSopsActive
                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                {!isCollapsed && <span className="truncate uppercase tracking-wider text-[11px]">SOPs</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    sopsOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {/* SOPs Sub-items */}
            {(!isCollapsed && sopsOpen) && (
              <div className="mt-1 pl-2.5 pr-1 space-y-1.5 border-l-2 border-emerald-500/30 ml-4 py-1">
                {sopsSubModules.map((item) => {
                  const SubIcon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold shadow-xs border border-emerald-400/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${isActive ? "bg-white/20 text-white border-white/30" : item.color}`}>
                        <SubIcon className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate font-semibold text-xs leading-tight">
                          {item.name}
                        </div>
                        <div className={`text-[11px] truncate leading-tight ${isActive ? "text-emerald-200" : "text-slate-400"}`}>
                          {item.subtitle}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* MAIN TITLE 5: HRMS & ADMIN */}
          <div className="pt-1">
            <button
              onClick={() => setHrmsOpen(!hrmsOpen)}
              title={isCollapsed ? "HRMS" : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
              } py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                isHrmsActive
                  ? "bg-violet-950/60 text-violet-300 border border-violet-800/60"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Users className="w-4 h-4 text-violet-400 shrink-0" />
                {!isCollapsed && <span className="truncate uppercase tracking-wider text-[11px]">HRMS</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    hrmsOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {(!isCollapsed && hrmsOpen) && (
              <div className="mt-1 pl-2.5 pr-1 space-y-1.5 border-l-2 border-violet-500/30 ml-4 py-1">
                {hrmsSubModules.map((item) => {
                  const SubIcon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold shadow-xs border border-violet-400/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${isActive ? "bg-white/20 text-white border-white/30" : item.color}`}>
                        <SubIcon className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate font-semibold text-xs leading-tight">{item.name}</div>
                        <div className={`text-[11px] truncate leading-tight ${isActive ? "text-violet-200" : "text-slate-400"}`}>{item.subtitle}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* MAIN TITLE 6: PROJECT EXECUTION */}
          <div className="pt-1">
            <button
              onClick={() => setProjectExecOpen(!projectExecOpen)}
              title={isCollapsed ? "Project Execution" : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
              } py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                isProjectExecActive
                  ? "bg-indigo-950/60 text-indigo-300 border border-indigo-800/60"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ClipboardList className="w-4 h-4 text-indigo-400 shrink-0" />
                {!isCollapsed && <span className="truncate uppercase tracking-wider text-[11px]">Execution</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    projectExecOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {(!isCollapsed && projectExecOpen) && (
              <div className="mt-1 pl-2.5 pr-1 space-y-1.5 border-l-2 border-indigo-500/30 ml-4 py-1">
                {projectExecSubModules.map((item) => {
                  const SubIcon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-600 to-blue-700 text-white font-bold shadow-xs border border-indigo-400/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${isActive ? "bg-white/20 text-white border-white/30" : item.color}`}>
                        <SubIcon className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate font-semibold text-xs leading-tight">{item.name}</div>
                        <div className={`text-[11px] truncate leading-tight ${isActive ? "text-indigo-200" : "text-slate-400"}`}>{item.subtitle}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* WORK INSTRUCTIONS */}
          <div className="pt-1">
            <Link
              href="/work-instructions"
              title={isCollapsed ? "Work Instructions" : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
              } py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                isWorkInstructionsActive
                  ? "bg-gradient-to-r from-amber-600 to-[#e35f14] text-white shadow-xs border border-amber-400/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                {!isCollapsed && <span className="truncate uppercase tracking-wider text-[11px]">Work Instructions</span>}
              </div>
              {!isCollapsed && isWorkInstructionsActive && <ChevronRight className="w-3.5 h-3.5 text-white shrink-0" />}
            </Link>
          </div>

          {/* MAIN TITLE 4: QUALITY PLANS */}
          <div className="pt-1">
            <Link
              href="/itps"
              title={isCollapsed ? "Quality Plans" : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
              } py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                isQualityPlansActive
                  ? "bg-gradient-to-r from-purple-600 to-brand-700 text-white shadow-xs border border-purple-400/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                {!isCollapsed && <span className="truncate uppercase tracking-wider text-[11px]">Quality Plans</span>}
              </div>
              {!isCollapsed && isQualityPlansActive && <ChevronRight className="w-3.5 h-3.5 text-white shrink-0" />}
            </Link>
            <Link
              href="/inspection-calls"
              title={isCollapsed ? "Inspection Calls" : undefined}
              className={`mt-1 w-full flex items-center ${
                isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
              } py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                pathname.startsWith("/inspection-calls")
                  ? "bg-gradient-to-r from-purple-600 to-brand-700 text-white shadow-xs border border-purple-400/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <PhoneCall className="w-4 h-4 text-purple-400 shrink-0" />
                {!isCollapsed && <span className="truncate uppercase tracking-wider text-[11px]">Inspection Calls</span>}
              </div>
              {!isCollapsed && pathname.startsWith("/inspection-calls") && (
                <ChevronRight className="w-3.5 h-3.5 text-white shrink-0" />
              )}
            </Link>
          </div>

          {/* General Nav Items */}
          {generalNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center ${
                  isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
                } py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#0084bf] to-[#00618e] text-white shadow-md glow-iqe-blue font-semibold border border-sky-400/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-[#0084bf]"
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </div>
                {!isCollapsed && isActive && <ChevronRight className="w-4 h-4 text-[#e35f14] shrink-0" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800/80">
        {!isCollapsed && (
          <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0084bf] to-[#e35f14] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {role.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate capitalize">{userName}</p>
                <p className="text-[11px] text-slate-400 truncate">{badge.label}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title={isCollapsed ? "Sign Out" : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? "justify-center" : "justify-center"
          } gap-2 px-3 py-2 rounded-full text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 border border-transparent hover:border-rose-800/40 transition-all duration-200`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

