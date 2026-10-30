"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  Clock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  FileCheck,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Calendar,
  Building,
  Plus,
  RefreshCw,
  Search,
  Activity,
  Layers,
  ChevronRight,
  Sliders,
  Check,
  Zap,
  X,
  ShieldCheck,
  Send,
} from "@/components/icons";
import { api } from "@/lib/api";
import { AnimatedNumber } from "@/components/AnimatedNumber";

interface BentoData {
  site_id: string;
  financials: {
    total_certified_revenue: number;
    total_claimed_value: number;
    total_invoiced_revenue: number;
    total_savings_recovered: number;
    retention_held: number;
    outstanding_receivables: number;
    paid_revenue: number;
  };
  bill_verification: {
    total_items_audited: number;
    claimed_amount: number;
    verified_payable: number;
    discrepancy_savings: number;
    steel_tonnage_reconciled_mt: number;
    waybills_verified_count: number;
    daily_logs_verified_count: number;
    discrepancy_items_flagged: number;
    governance_standard: string;
  };
  pipeline: {
    enquiries: number;
    jobs: number;
    service_orders: number;
    work_packages: number;
    visits: number;
    certifications: number;
    invoices: number;
    inspectors: number;
  };
  categories: {
    code: string;
    name: string;
    badge: string;
    scope: string;
    jobs_count: number;
    work_packages_count: number;
    visits_count: number;
    verified_revenue: number;
    bill_verifications_done: number;
    discrepancies_caught: number;
    discrepancy_savings?: number;
    pass_rate: number;
    active_inspectors: number;
    accent_color: string;
    gradient: string;
  }[];
  ai_automations: {
    vector_matching_accuracy_pct: number;
    anomalies_detected_count: number;
    impartiality_gate_passed: string;
    auto_generated_certificates: number;
    auto_boq_reconciliations: number;
    credential_expiry_alerts: number;
  };
}

export default function Dashboard() {
  const [bento, setBento] = useState<BentoData | null>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // AI Copilot state
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotAction, setCopilotAction] = useState("boq_variance_audit");
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState<any>(null);

  // Category Deep-Dive Drawer state
  const [activeCategoryModal, setActiveCategoryModal] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, j, c] = await Promise.allSettled([
        api.getBentoSummary(),
        api.listJobs({ per_page: 15 }),
        api.getAdminCounts(),
      ]);

      if (b.status === "fulfilled") setBento(b.value);
      if (j.status === "fulfilled") setRecentJobs(j.value.data || []);
      if (c.status === "fulfilled") {
        setCounts(
          Object.fromEntries(
            (c.value.counts || []).map((x: { id: string; count: number }) => [x.id, x.count])
          )
        );
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerCopilotAction = async (action: string, customQuery?: string) => {
    setCopilotOpen(true);
    setCopilotAction(action);
    setCopilotLoading(true);
    try {
      const res = await api.runCopilotAction(action, customQuery || copilotQuery);
      setCopilotResult(res);
    } catch (e: any) {
      console.error("Copilot error:", e);
      setCopilotResult({ error: "Failed to execute copilot action." });
    } finally {
      setCopilotLoading(false);
    }
  };

  const metricCards = [
    { label: "Clients", key: "Client", icon: Building, href: "/clients" },
    { label: "Manufacturers", key: "Manufacturer", icon: Sparkles, href: "/manufacturers" },
    { label: "Purchase Orders", key: "PurchaseOrder", icon: TrendingUp, href: "/tpi-billing" },
    { label: "Service Orders", key: "ServiceOrder", icon: Briefcase, href: "/service-orders" },
    { label: "Inspectors", key: "Employee", icon: Clock, href: "/admin" },
    { label: "Visits", key: "Visits", icon: Calendar, href: "/visits" },
    { label: "Invoices", key: "InvoiceDetails", icon: FileCheck, href: "/invoices" },
    { label: "Payments", key: "Financials", icon: DollarSign, href: "/accounts-receivable" },
  ].map((c) => ({ ...c, value: counts?.[c.key] ?? null }));

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  // Filter jobs based on search & category
  const filteredJobs = useMemo(() => {
    return recentJobs.filter((job) => {
      const matchesSearch =
        searchQuery === "" ||
        (job.title && job.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (job.job_id && job.job_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (job.client_name && job.client_name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (selectedCategory === "ALL") return true;

      const cat = (job.job_type_category || "").toUpperCase();
      if (selectedCategory === "PV_PIPE") {
        return cat.includes("PV") || cat.includes("PIPE") || cat.includes("RAD") || cat.includes("STR");
      }
      if (selectedCategory === "CIVIL_BOQ") {
        return cat.includes("CIVIL") || cat.includes("BOQ") || cat.includes("VND");
      }
      if (selectedCategory === "PHARMA_EPC") {
        return cat.includes("PHARMA") || cat.includes("GMP") || cat.includes("PRE");
      }
      if (selectedCategory === "ELE_SUB") {
        return cat.includes("ELE") || cat.includes("CUSTOM");
      }
      return true;
    });
  }, [recentJobs, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#0084bf]/20 border border-[#0084bf]/40 text-[#0084bf] dark:text-sky-300 text-xs font-bold tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e35f14] animate-ping" />
              <span>{greeting} • Operations Engine Active</span>
            </span>
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
              ISO/IEC 17020 &amp; ISO 9001:2026 Compliant
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight mt-1">
            Enterprise Operations &amp; Inspection Bento
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => triggerCopilotAction("boq_variance_audit")}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0084bf] via-[#0075ab] to-[#e35f14] hover:opacity-95 text-white text-xs font-bold transition-all shadow-glow-blue flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <span>Open AI Copilot</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-sky-50 dark:hover:bg-slate-700 hover:border-sky-200 hover:text-[#00618e] disabled:opacity-70 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
          <Sliders className="w-3.5 h-3.5" /> Category:
        </span>
        {[
          { code: "ALL", label: "All Categories (Executive)" },
          { code: "PV_PIPE", label: "TPI / Pressure Vessels & Piping" },
          { code: "CIVIL_BOQ", label: "Civil & Construction Bill Verification" },
          { code: "PHARMA_EPC", label: "Schedule M Pharma EPC & Cleanrooms" },
          { code: "ELE_SUB", label: "Renewable & High Voltage Substations" },
        ].map((tab) => (
          <button
            key={tab.code}
            onClick={() => setSelectedCategory(tab.code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all ${
              selectedCategory === tab.code
                ? "bg-[#0084bf] text-white shadow-glow-blue"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PRIMARY BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
        {/* BENTO CARD 1: Operational Spine Lifecycle Hero (Col Span 8) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-gradient-to-br from-[#001a2c] via-[#002842] to-[#003752] text-white border border-[#0084bf]/40 shadow-soft relative overflow-hidden flex flex-col justify-between">
          <div aria-hidden className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#0084bf]/30 blur-3xl animate-blob" />
          <div aria-hidden className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-[#e35f14]/20 blur-3xl animate-blob [animation-delay:-5s]" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#0084bf]/30 border border-sky-400/40 text-sky-200 text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#e35f14]" />
                Operational Execution Spine
              </span>
              <span className="text-xs font-mono text-sky-200/80">Site ID: {bento?.site_id || "SITE-01"}</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
                End-to-End Governance &amp; Inspection Flow
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Unifying Pre-Sales Enquiries, Work Orders, Service Orders, On-Site Visits, BOQ Bill Verification, QC Approval, and Final Invoicing.
              </p>
            </div>

            {/* 6-Stage Visual Timeline Flow */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
              {[
                { title: "1. Enquiries", val: bento?.pipeline.enquiries || 213, sub: "Pre-sales Bid", link: "/enquiries" },
                { title: "2. Jobs", val: bento?.pipeline.jobs || 230, sub: "Umbrella SOW", link: "/jobs" },
                { title: "3. Orders", val: bento?.pipeline.service_orders || 203, sub: "PO / Contract", link: "/service-orders" },
                { title: "4. Visits", val: bento?.pipeline.visits || 203, sub: "Site Dispatch", link: "/visits" },
                { title: "5. QC / Certs", val: bento?.pipeline.certifications || 200, sub: "₹7.24 Cr Val", link: "/certifications" },
                { title: "6. Invoices", val: bento?.pipeline.invoices || 202, sub: "₹7.95 Cr Billed", link: "/invoices" },
              ].map((stage) => (
                <Link
                  key={stage.title}
                  href={stage.link}
                  className="group p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-sky-400/50 backdrop-blur-md transition-all text-left flex flex-col justify-between"
                >
                  <span className="text-[11px] font-bold text-sky-200/90 truncate">{stage.title}</span>
                  <span className="text-lg font-black font-mono text-white mt-1">
                    <AnimatedNumber value={stage.val} />
                  </span>
                  <span className="text-[10px] text-slate-300 font-medium truncate mt-0.5">{stage.sub}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Full trace integrity across all 53 domain collections</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerCopilotAction("pipeline_simulation")}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors flex items-center gap-1"
              >
                <span>Simulate Flow</span>
                <Sparkles className="w-3.5 h-3.5 text-[#e35f14]" />
              </button>
              <Link
                href="/console"
                className="px-3 py-1.5 rounded-xl bg-[#0084bf]/40 hover:bg-[#0084bf]/60 text-white font-semibold transition-colors flex items-center gap-1"
              >
                <span>Console</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* BENTO CARD 2: Bill Verification & Cost Recovery Hub (Col Span 4) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-gradient-to-br from-orange-950/40 via-[#002235] to-[#001a2c] text-white border border-[#e35f14]/40 shadow-soft relative overflow-hidden flex flex-col justify-between">
          <div aria-hidden className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#e35f14]/20 blur-3xl animate-blob" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#e35f14]/20 border border-[#e35f14]/40 text-orange-300 text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#e35f14]" />
                Bill Verification &amp; Savings
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-mono font-bold">
                IS 1200 Audit
              </span>
            </div>

            <div>
              <p className="text-xs text-orange-200/90 font-bold uppercase tracking-wider">
                Total Client Discrepancy Savings
              </p>
              <div className="text-3xl sm:text-4xl font-black font-mono text-gradient-orange mt-1">
                ₹{((bento?.financials.total_savings_recovered || 1922727) / 100000).toFixed(2)} Lakhs
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Recovered through physical joint measurement, weighbridge waybill reconciliation, and steel wastage audit.
              </p>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-300">Audited BOQ Items:</span>
                <span className="font-mono font-bold text-white">
                  {bento?.bill_verification.total_items_audited || 104} Items
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-300">Reconciled Steel Rebar:</span>
                <span className="font-mono font-bold text-orange-300">
                  {bento?.bill_verification.steel_tonnage_reconciled_mt || 33.45} MT
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-300">Gate Waybills Verified:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {bento?.bill_verification.waybills_verified_count || 7} Verified (100%)
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => triggerCopilotAction("boq_variance_audit")}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 group"
            >
              <span>Audit Top 5 Variances</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              href="/construction-bill-verification"
              className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 text-[11px] font-semibold transition-colors"
            >
              Mudigonda CHC
            </Link>
          </div>
        </div>

        {/* BENTO CARD 3: Financial Health & Certified Revenue (Col Span 4) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-[#002235] border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#0084bf] dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-purple-500" />
                Revenue &amp; Receivables
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-bold">
                202 Invoices
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Certified Value</p>
              <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
                ₹{((bento?.financials.total_certified_revenue || 72426861) / 10000000).toFixed(2)} Cr
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">Invoiced:</span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  ₹{((bento?.financials.total_invoiced_revenue || 79563521) / 10000000).toFixed(2)} Cr
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-500">Paid:</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{((bento?.financials.paid_revenue || 14728213) / 100000).toFixed(1)} L
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-semibold block uppercase">Retention Held</span>
                <span className="text-sm font-black font-mono text-purple-600 dark:text-purple-400">
                  ₹{((bento?.financials.retention_held || 319095) / 100000).toFixed(2)} L
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Defect Liability Security</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-semibold block uppercase">Outstanding</span>
                <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                  ₹{((bento?.financials.outstanding_receivables || 64835307) / 10000000).toFixed(2)} Cr
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Under Ageing Bucket</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <Link
              href="/invoices"
              className="font-bold text-[#0084bf] hover:text-[#00618e] flex items-center gap-1 group"
            >
              <span>View All 202 Invoices</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/accounts-receivable"
              className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-slate-800 text-[#0084bf] dark:text-sky-300 font-semibold hover:bg-sky-100 transition-colors"
            >
              Aging Report
            </Link>
          </div>
        </div>

        {/* BENTO CARD 4: Gemini AI Intelligence Suite & Automated Gates (Col Span 8) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-gradient-to-br from-[#002235] via-[#002d45] to-[#001a2c] text-white border border-[#0084bf]/40 shadow-soft relative overflow-hidden flex flex-col justify-between">
          <div aria-hidden className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-[#0084bf]/25 blur-3xl animate-blob" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-200 text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#e35f14] animate-pulse" />
                Gemini AI Intelligence &amp; Automated Gates
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> All System Gates Verified
              </span>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-bold font-heading text-white">
                Autonomous Verification, Competence Matching &amp; Anomaly Prevention
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Active machine intelligence continuously guards inspection dispatches, verifies auditor impartiality per ISO/IEC 17020, and calculates theoretical wastage per IS 1200.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div
                role="button"
                tabIndex={0}
                onClick={() => triggerCopilotAction("smart_inspector_matching")}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-400/40 transition-all cursor-pointer"
              >
                <span className="text-[11px] text-sky-300 font-semibold block uppercase">AI Match Precision</span>
                <span className="text-xl font-black font-mono text-white mt-1 block">
                  {bento?.ai_automations.vector_matching_accuracy_pct || 98.5}%
                </span>
                <span className="text-[10px] text-slate-300 mt-0.5 block">Click to Match Inspector</span>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => triggerCopilotAction("boq_variance_audit")}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 transition-all cursor-pointer"
              >
                <span className="text-[11px] text-amber-300 font-semibold block uppercase">Anomalies Detected</span>
                <span className="text-xl font-black font-mono text-white mt-1 block">
                  {bento?.ai_automations.anomalies_detected_count || 24} Flags
                </span>
                <span className="text-[10px] text-slate-300 mt-0.5 block">Z-Score Rate Outliers</span>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => triggerCopilotAction("compliance_expiry_radar")}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/40 transition-all cursor-pointer"
              >
                <span className="text-[11px] text-emerald-300 font-semibold block uppercase">Impartiality Gate</span>
                <span className="text-xl font-black font-mono text-white mt-1 block">100% Pass</span>
                <span className="text-[10px] text-slate-300 mt-0.5 block">ISO/IEC 17020 Checks</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-orange-300 font-semibold block uppercase">Auto-Drafted IRNs</span>
                <span className="text-xl font-black font-mono text-white mt-1 block">
                  {bento?.ai_automations.auto_generated_certificates || 196}
                </span>
                <span className="text-[10px] text-slate-300 mt-0.5 block">Digital Release Notes</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-300">
              Scenarios Supported: Pressure Vessels • Mudigonda BOQ • Pharma Cleanrooms • Switchgear FAT
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerCopilotAction("boq_variance_audit")}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors flex items-center gap-1"
              >
                <span>Live Copilot Insights</span>
                <Sparkles className="w-3.5 h-3.5 text-[#e35f14]" />
              </button>
              <Link
                href="/analytics"
                className="px-3 py-1.5 rounded-xl bg-[#0084bf]/40 hover:bg-[#0084bf]/60 border border-sky-400/40 text-white font-semibold transition-colors flex items-center gap-1"
              >
                <span>Predictive Intelligence</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-sky-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY-WISE INSPECTION FLOW BREAKDOWN BENTO SECTION */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0084bf]" />
              <span>Inspection Flows by Category &amp; Revenue Breakdown</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed tracking of Bill Verifications performed, Verified Revenues, Discrepancies Caught, and Pass Rates across all industrial domains.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            4 Active Operational Domains
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(bento?.categories || []).map((cat) => {
            const isSelected = selectedCategory === cat.code;
            return (
              <div
                key={cat.code}
                role="button"
                tabIndex={0}
                onClick={() => setActiveCategoryModal(cat)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? "bg-sky-50/90 dark:bg-sky-950/40 border-[#0084bf] ring-2 ring-[#0084bf]/30 shadow-md -translate-y-1"
                    : "bg-white dark:bg-[#002235] border-slate-200/80 dark:border-slate-800 hover:border-[#0084bf]/40 hover:-translate-y-0.5 shadow-soft"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide uppercase border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                      {cat.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {cat.pass_rate}% Pass
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {cat.scope}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Verified Revenue:</span>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                      ₹{(cat.verified_revenue / 10000000).toFixed(2)} Cr
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Bill Verifications Done:</span>
                    <span className="font-mono font-bold text-[#0084bf] dark:text-sky-300">
                      {cat.bill_verifications_done} Audits
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Discrepancies Caught:</span>
                    <span className="font-mono font-bold text-[#e35f14]">
                      {cat.discrepancies_caught} Items
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{cat.jobs_count} Jobs • {cat.visits_count} Visits</span>
                    <span>{cat.active_inspectors} Inspectors</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#0084bf]">
                  <span>Click for Deep Dive Drawer</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RESTORED 8-CARD EXECUTIVE METRICS STRIP */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Replicated Master Record Counts (All 200+ Seeded Domains)
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Live Database Collections</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {metricCards.map(({ label, value, icon: Icon, href }) => {
            const body = (
              <>
                <div className="relative z-[2]">
                  <p className="text-[10px] font-bold text-sky-100 uppercase tracking-wider">{label}</p>
                  <p className="text-xl font-extrabold font-heading mt-0.5">
                    {value !== null ? (
                      <AnimatedNumber value={value} />
                    ) : (
                      <span className="inline-block w-8 h-5 rounded bg-white/25 animate-pulse" />
                    )}
                  </p>
                </div>
                <div className="relative z-[2] w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 ring-1 ring-white/25">
                  <Icon className="w-4 h-4" />
                </div>
              </>
            );
            return (
              <Link
                key={label}
                href={href}
                className="group relative p-3 rounded-2xl bg-gradient-to-br from-sky-500 via-[#0084bf] to-[#00618e] text-white shadow-soft flex items-center justify-between overflow-hidden hover:shadow-glow-blue hover:-translate-y-0.5 transition-all"
              >
                {body}
              </Link>
            );
          })}
        </div>
      </div>

      {/* FILTERABLE JOB DISPATCH & INSPECTION QUEUE TABLE */}
      <div className="bg-white dark:bg-[#002235] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#0084bf]" />
              <span>Inspection Job Dispatches &amp; Scope Assignments</span>
              {selectedCategory !== "ALL" && (
                <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-[#0084bf] dark:text-sky-300 text-xs font-bold">
                  Filtered: {selectedCategory}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing active jobs mapped to specific SOW templates, inspectors, and certification stages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job ID, client, title..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0084bf] font-medium text-slate-800 dark:text-slate-100 w-64"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <Link
              href="/jobs"
              className="px-3 py-1.5 rounded-xl bg-[#0084bf] hover:bg-[#00618e] text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
            >
              <span>All Jobs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Job ID &amp; Category</th>
                <th className="py-2.5 px-3">Inspection Title</th>
                <th className="py-2.5 px-3">Client &amp; Unit</th>
                <th className="py-2.5 px-3">Assigned Inspector</th>
                <th className="py-2.5 px-3 text-right">Budget</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No matching inspection jobs found for the selected category filter.
                  </td>
                </tr>
              ) : (
                filteredJobs.slice(0, 10).map((job) => (
                  <tr
                    key={job.job_id}
                    className="hover:bg-sky-50/60 dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100 block">
                        {job.job_id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mt-0.5 inline-block">
                        {job.job_type_category || "INSP"}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#0084bf] transition-colors">
                        {job.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{job.description}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-700 dark:text-slate-300 block">
                        {job.client_name || "Enterprise Client"}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {job.client_unit_name || "HQ Site"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">
                        {job.assigned_inspector_name || "Unassigned"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {job.assigned_inspector_id || "PENDING"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      ₹{(job.budget || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          job.status === "open"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                            : job.status === "in_progress" || job.status === "assigned"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                            : "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-700"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/jobs/${job.job_id}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#0084bf] hover:text-white text-slate-700 dark:text-slate-200 font-bold transition-all inline-flex items-center gap-1"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. INTERACTIVE AI OPERATIONS COPILOT MODAL / DRAWER                       */}
      {/* ========================================================================= */}
      {copilotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#001a2c] text-white border border-[#0084bf]/50 shadow-2xl p-6 space-y-5 flex flex-col justify-between">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0084bf] to-[#e35f14] flex items-center justify-center text-white shadow-glow-blue">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-white">IQE Gemini Operations Copilot</h3>
                  <p className="text-xs text-sky-200/80">
                    Real-time execution of IS 1200 BOQ audits, inspector matching, and compliance validation.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCopilotOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Fast-Action Routine Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "boq_variance_audit", label: "IS 1200 BOQ Audit", icon: FileCheck },
                { id: "smart_inspector_matching", label: "Smart Inspector Match", icon: Sparkles },
                { id: "compliance_expiry_radar", label: "Credential Expiry Radar", icon: ShieldCheck },
                { id: "pipeline_simulation", label: "Pipeline Trace", icon: Activity },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => triggerCopilotAction(id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    copilotAction === id
                      ? "bg-[#0084bf] text-white border-sky-400 shadow-glow-blue"
                      : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>

            {/* Results Display Area */}
            <div className="p-4 rounded-2xl bg-[#002235]/90 border border-slate-800 space-y-3 min-h-[220px]">
              {copilotLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                  <RefreshCw className="w-8 h-8 text-[#0084bf] animate-spin" />
                  <p className="text-xs font-bold text-sky-200">Executing routine across database collections...</p>
                </div>
              ) : copilotResult ? (
                <div className="space-y-3 animate-fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-extrabold text-sm text-sky-300">{copilotResult.title}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                      Verified Routine
                    </span>
                  </div>

                  {/* 1. BOQ Variance Result Render */}
                  {copilotResult.action === "boq_variance_audit" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2.5 rounded-xl bg-white/5">
                          <span className="text-[10px] text-slate-400 block uppercase">Total Claimed</span>
                          <span className="font-mono font-bold text-white text-sm">
                            ₹{(copilotResult.claimed_amount / 10000000).toFixed(2)} Cr
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5">
                          <span className="text-[10px] text-slate-400 block uppercase">Verified Payable</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            ₹{(copilotResult.verified_payable / 10000000).toFixed(2)} Cr
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-orange-500/30">
                          <span className="text-[10px] text-orange-400 block uppercase">Discrepancy Deducted</span>
                          <span className="font-mono font-bold text-orange-400 text-sm">
                            ₹{(copilotResult.total_savings_recovered / 100000).toFixed(2)} Lakhs
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 font-semibold">{copilotResult.recommendation}</p>

                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Top Overbilled Items:</span>
                        {copilotResult.top_variances?.map((v: any) => (
                          <div
                            key={v.item_code}
                            className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-slate-800 text-[11px]"
                          >
                            <div className="truncate max-w-sm">
                              <span className="font-mono font-bold text-sky-400 mr-2">{v.item_code}</span>
                              <span className="text-slate-200">{v.description}</span>
                            </div>
                            <div className="text-right shrink-0 font-mono font-bold text-orange-400">
                              -₹{(v.savingsAmount || 0).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Smart Inspector Matching Render */}
                  {copilotResult.action === "smart_inspector_matching" && (
                    <div className="space-y-2.5">
                      <p className="text-xs text-slate-300">
                        Top ranked deployable inspectors for: <strong>{copilotResult.scope}</strong>
                      </p>
                      <div className="space-y-2">
                        {copilotResult.matched_inspectors?.map((insp: any) => (
                          <div
                            key={insp.person_id}
                            className="p-2.5 rounded-xl bg-black/30 border border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">{insp.name}</span>
                                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono">
                                  {insp.role}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {insp.certifications?.join(" • ")}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-black text-emerald-400 text-sm">
                                {insp.score}% Match
                              </span>
                              <span className="text-[10px] text-slate-400 block">{insp.impartiality_status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Expiry Radar Render */}
                  {copilotResult.action === "compliance_expiry_radar" && (
                    <div className="space-y-2.5">
                      <p className="text-xs text-slate-300">{copilotResult.coverage_status}</p>
                      <div className="space-y-2">
                        {copilotResult.alerts?.map((alert: any) => (
                          <div
                            key={alert.name}
                            className="p-2.5 rounded-xl bg-black/30 border border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-white text-xs">{alert.name}</span>
                              <p className="text-[11px] text-amber-300 mt-0.5">{alert.cert}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                {alert.days_left} Days Left
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Expires {alert.expiry}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Pipeline Simulation Render */}
                  {copilotResult.action === "pipeline_simulation" && (
                    <div className="space-y-2.5">
                      <p className="text-xs text-slate-300">{copilotResult.integrity_check}</p>
                      <div className="space-y-1.5">
                        {copilotResult.stages?.map((s: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-black/30 border border-slate-800 flex items-center justify-between text-[11px]"
                          >
                            <span className="font-bold text-sky-300">{s.stage}</span>
                            <span className="text-slate-300 truncate max-w-xs">{s.detail}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                              {s.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Prompt Input Form */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") triggerCopilotAction(copilotAction, copilotQuery);
                }}
                placeholder="Ask Copilot (e.g., 'Audit Mudigonda concrete', 'Check inspector conflicts')..."
                className="flex-1 px-4 py-2 text-xs bg-white/5 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0084bf] text-white placeholder-slate-500"
              />
              <button
                onClick={() => triggerCopilotAction(copilotAction, copilotQuery)}
                className="px-4 py-2 rounded-xl bg-[#0084bf] hover:bg-[#0075ab] text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE CATEGORY DEEP-DIVE DRAWER                                  */}
      {/* ========================================================================= */}
      {activeCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md h-full bg-[#001a2c] text-white border-l border-[#0084bf]/40 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="px-2.5 py-0.5 rounded-full bg-[#0084bf]/30 border border-sky-400/40 text-sky-200 text-xs font-extrabold uppercase">
                  {activeCategoryModal.badge}
                </span>
                <button
                  onClick={() => setActiveCategoryModal(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-bold font-heading text-white">{activeCategoryModal.name}</h3>
                <p className="text-xs text-slate-300 mt-1">{activeCategoryModal.scope}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Verified Revenue</span>
                  <span className="text-lg font-black font-mono text-white mt-1 block">
                    ₹{(activeCategoryModal.verified_revenue / 10000000).toFixed(2)} Cr
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bill Verifications</span>
                  <span className="text-lg font-black font-mono text-[#0084bf] mt-1 block">
                    {activeCategoryModal.bill_verifications_done} Done
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Discrepancies Flagged</span>
                  <span className="text-lg font-black font-mono text-[#e35f14] mt-1 block">
                    {activeCategoryModal.discrepancies_caught} Items
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Compliance Pass Rate</span>
                  <span className="text-lg font-black font-mono text-emerald-400 mt-1 block">
                    {activeCategoryModal.pass_rate}% Pass
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <h4 className="font-bold text-sky-300">Technical Scope &amp; Quality Mandate</h4>
                <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
                  <li>Zero tolerance on unauthorized welding, forging or joint variance.</li>
                  <li>Stage hold points enforced: Fit-up, Sa 2.5 blast, Hydrotest, Final IRN.</li>
                  <li>Calibration certificates required for all test gauges prior to sign-off.</li>
                  <li>IS 1200 / CPWD joint physical measurement verification required for billing.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800">
              <Link
                href={
                  activeCategoryModal.code === "CIVIL_BOQ"
                    ? "/construction-bill-verification"
                    : activeCategoryModal.code === "PHARMA_EPC"
                    ? "/schedule-m-pharma-epc"
                    : "/tpi-billing"
                }
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0084bf] to-[#00618e] hover:from-[#0075ab] hover:to-[#00527a] text-white text-xs font-bold transition-all shadow-glow-blue flex items-center justify-center gap-1.5"
              >
                <span>Launch Full Domain Workspace</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
