"use client";

import { API_BASE } from "@/lib/config";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  Users,
  Search,
  Download,
  Plus,
  RefreshCw,
  Eye,
  Award,
  ChevronRight,
  Send,
  Check,
  X,
  FileCheck,
  SlidersHorizontal,
  Building2,
  Calendar,
  Sparkles,
  Loader2,
} from "@/components/icons";
import { IQELoader } from "@/components/IQELoader";
import { toast } from "@/components/feedback";

interface TPICallItem {
  id: string;
  rfiNo: string;
  client: string;
  mfr: string;
  rfiDate: string;
  ackStatus: "Pending" | "Acknowledged (<4h)" | "Overdue";
  readiness: "Ready (Yes)" | "Not Ready (No)";
  assignedInspector: string;
  locationType: "PAN India (24h)" | "Worldwide WWI (1 Wk)";
  itpRef: string;
  currentStage: number;
  reportFormat: string;
  tmReviewStatus: "Pending Review" | "Approved" | "Queries Flagged";
  dispatchStatus: "Dispatched (<24h)" | "In Progress";
}

const INITIAL_CALLS: TPICallItem[] = [
  {
    id: "CALL-2026-001",
    rfiNo: "RFI-MCGM-8812",
    client: "MCGM (Greater Mumbai Corp)",
    mfr: "Larsen & Toubro Ltd - Heavy Engg",
    rfiDate: "2026-08-12 09:30 AM",
    ackStatus: "Acknowledged (<4h)",
    readiness: "Ready (Yes)",
    assignedInspector: "Er. Rao (NDT Level III)",
    locationType: "PAN India (24h)",
    itpRef: "ITP-MCR-PIPING-Rev2",
    currentStage: 6,
    reportFormat: "IQE-TP-03 & 04 (Visit Report & IRN)",
    tmReviewStatus: "Pending Review",
    dispatchStatus: "In Progress",
  },
  {
    id: "CALL-2026-002",
    rfiNo: "RFI-TATA-4402",
    client: "Tata Power Renewable",
    mfr: "Sterling & Wilson Solar",
    rfiDate: "2026-08-12 08:15 AM",
    ackStatus: "Acknowledged (<4h)",
    readiness: "Ready (Yes)",
    assignedInspector: "Er. V. Sharma (Elec & Solar Audit)",
    locationType: "PAN India (24h)",
    itpRef: "ITP-TPRE-TRANS-001",
    currentStage: 7,
    reportFormat: "IQE-TP-02 (Flash Report)",
    tmReviewStatus: "Approved",
    dispatchStatus: "Dispatched (<24h)",
  },
  {
    id: "CALL-2026-003",
    rfiNo: "RFI-IOCL-9910",
    client: "Indian Oil Corporation (IOCL)",
    mfr: "Thermax Quality Systems",
    rfiDate: "2026-08-11 02:00 PM",
    ackStatus: "Acknowledged (<4h)",
    readiness: "Not Ready (No)",
    assignedInspector: "Er. K. Patel (Pressure Vessel)",
    locationType: "Worldwide WWI (1 Wk)",
    itpRef: "ITP-IOCL-REACT-99",
    currentStage: 3,
    reportFormat: "IQE-TP-08 (NAN Issued)",
    tmReviewStatus: "Queries Flagged",
    dispatchStatus: "In Progress",
  },
];

const IQE_FORMAT_TEMPLATES = [
  { code: "IQE-TP-01A", name: "Competence Matrix & Qualification Record", category: "Admin" },
  { code: "IQE-TP-02 & 02A", name: "Flash Report (Immediate Status Alert)", category: "Site Alert" },
  { code: "IQE-TP-03 & 03A", name: "Visit Report (Technical Inspection Log)", category: "Inspection" },
  { code: "IQE-TP-04 & 04A", name: "Inspection Release Note (IRN - Material Clearance)", category: "Clearance" },
  { code: "IQE-TP-05 & 05A", name: "Expediting Report (Manufacturing Progress)", category: "Expediting" },
  { code: "IQE-TP-06", name: "Shop Evaluation Report (Vendor Audit)", category: "Vendor Audit" },
  { code: "IQE-TP-07", name: "Field Quality Verification Protocol", category: "Field Audit" },
  { code: "IQE-TP-08", name: "Non-Conformity Advisory Notice (NAN Defect Log)", category: "Quality Defect" },
  { code: "IQE-TP-09", name: "Quantity Survey Report (BOQ Measurement Verification)", category: "Quantity" },
  { code: "IQE-TP-10", name: "Inspector Performance Monitoring Report", category: "Management" },
];

export default function TPIProcessFlowPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"flow" | "tm_review" | "templates" | "competence" | "nan">("flow");
  const [isTabSwitching, setIsTabSwitching] = useState<boolean>(false);

  const handleTabSwitch = (tab: "flow" | "tm_review" | "templates" | "competence") => {
    if (tab === activeTab) return;
    setIsTabSwitching(true);
    setActiveTab(tab);
    setTimeout(() => setIsTabSwitching(false), 220);
  };

  const [calls, setCalls] = useState<TPICallItem[]>(INITIAL_CALLS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 700);
  };

  if (loading) {
    return <IQELoader message="Loading TPI Process Flow Engine (IQE-PFC-03)..." />;
  }

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Top Title & Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-[#003366] dark:text-sky-400 font-heading tracking-tight">
            TPI Process Flow Module
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button aria-label="Refresh Data"
            onClick={handleRefresh}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4 text-[#003366] dark:text-sky-300" />
          </button>
          <a
            href={`${API_BASE}/api/v1/reports/pdf/tpi-billing`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-[#003366] hover:bg-[#002855] text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-sky-300" />
            <span>Download Process SOP PDF</span>
          </a>
        </div>
      </div>

      {/* SLA Metric Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">4h RFI Acknowledgment SLA</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">100%</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-semibold">Response within 4 working hrs</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Inspector Response SLA</p>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-1">24h / 1 Wk</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-semibold">PAN India (24h) | Worldwide (1 Wk)</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">TM Review &amp; Query Queue</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-1">1 Pending</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-semibold">Technical Manager Approval</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">24h Client Delivery Goal</p>
            <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 font-mono mt-1">94.2%</p>
            <p className="text-[11px] text-brand-700 dark:text-brand-300 font-bold mt-0.5">Target: 90% submitted &lt;24h</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Module Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm gap-1 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => handleTabSwitch("flow")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "flow"
              ? "bg-[#003366] text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>1. 7-Stage Process Stepper &amp; SLA Calls</span>
        </button>

        <button
          onClick={() => handleTabSwitch("tm_review")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "tm_review"
              ? "bg-[#003366] text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>2. TM Review Queue</span>
        </button>

        <button
          onClick={() => handleTabSwitch("templates")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "templates"
              ? "bg-[#003366] text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4 text-sky-400" />
          <span>3. Formats &amp; Templates (TP-01 to TP-10)</span>
        </button>

        <button
          onClick={() => handleTabSwitch("competence")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "competence"
              ? "bg-[#003366] text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>4. Competence Matrix (IQE-TP-01A)</span>
        </button>
      </div>

      {/* SUB-MODULE TABS BODY WITH TRANSITION LOADER */}
      {isTabSwitching ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-2xs animate-in fade-in duration-200">
          <Loader2 className="w-8 h-8 animate-spin text-[#0084bf]" />
          <p className="text-xs font-bold text-slate-600 font-mono tracking-wide">Switching Module View...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: 7-STAGE PROCESS FLOW STEPPER */}
          {activeTab === "flow" && (
        <div className="space-y-6">
          {/* Interactive Stepper Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#002855] via-[#003366] to-[#00509d] text-white shadow-xl space-y-6">
            <h3 className="font-extrabold text-base uppercase tracking-wider text-sky-200 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Official 7-Stage Process Flow Stepper (Doc. No: IQE-PFC-03)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-xs">
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-1">
                <span className="px-2 py-0.5 rounded bg-sky-500/30 text-sky-200 font-mono text-[11px] font-bold">Stage 1</span>
                <p className="font-extrabold text-white">Receipt of RFI &amp; Docs</p>
                <p className="text-[11px] text-slate-300">Log details in call logsheet</p>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-1">
                <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 font-mono text-[11px] font-bold">Stage 2</span>
                <p className="font-extrabold text-white">Check Readiness</p>
                <p className="text-[11px] text-slate-300">SLA: 4 working hours</p>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-1">
                <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 font-mono text-[11px] font-bold">Stage 3</span>
                <p className="font-extrabold text-white">Schedule Inspector</p>
                <p className="text-[11px] text-slate-300">TP-01A Competence Matrix</p>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-1">
                <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 font-mono text-[11px] font-bold">Stage 4</span>
                <p className="font-extrabold text-white">Site Inspection</p>
                <p className="text-[11px] text-slate-300">Per approved Drawings &amp; ITP</p>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-1">
                <span className="px-2 py-0.5 rounded bg-brand-500/30 text-brand-200 font-mono text-[11px] font-bold">Stage 5</span>
                <p className="font-extrabold text-white">Generate Reports</p>
                <p className="text-[11px] text-slate-300">Flash, Visit, IRN, NAN</p>
              </div>

              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-1">
                <span className="px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 font-mono text-[11px] font-bold">Stage 6</span>
                <p className="font-extrabold text-white">TM Review</p>
                <p className="text-[11px] text-slate-300">Technical Manager sign-off</p>
              </div>

              <div className="bg-emerald-500/30 p-3 rounded-2xl border border-emerald-400/40 space-y-1">
                <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-mono text-[11px] font-bold">Stage 7</span>
                <p className="font-extrabold text-white">Client Dispatch</p>
                <p className="text-[11px] text-emerald-200">Submit &lt;24h (CC: Coord/GM)</p>
              </div>
            </div>
          </div>

          {/* Active Calls Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-extrabold text-lg text-slate-900 font-heading">
                Active Inspection Calls &amp; Process SLA Status
              </h3>

              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  aria-label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search calls, inspectors, clients..."
                  className="w-full pl-9 pr-4 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto border rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Call / RFI No</th>
                    <th className="p-3">Client &amp; Manufacturer</th>
                    <th className="p-3">4h Ack SLA</th>
                    <th className="p-3">Assigned Inspector</th>
                    <th className="p-3">Current PFC-03 Stage</th>
                    <th className="p-3">TM Review</th>
                    <th className="p-3 text-center">24h Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calls.map((call) => (
                    <tr key={call.id} className="hover:bg-blue-50/40 font-medium">
                      <td className="p-3 font-mono font-bold text-blue-700">{call.rfiNo}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{call.client}</p>
                        <p className="text-[11px] text-slate-500">{call.mfr}</p>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          {call.ackStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-800">{call.assignedInspector}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{call.locationType}</p>
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-[#003366] dark:text-sky-300 font-extrabold">
                          Stage {call.currentStage} of 7
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            call.tmReviewStatus === "Approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : call.tmReviewStatus === "Pending Review"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {call.tmReviewStatus}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            call.dispatchStatus === "Dispatched (<24h)"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {call.dispatchStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICAL MANAGER (TM) REVIEW QUEUE */}
      {activeTab === "tm_review" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 font-heading flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>Technical Manager (TM) Review &amp; Sign-off Queue</span>
              </h3>
              <p className="text-xs text-slate-500">
                Review submitted inspection reports (Flash, Visit, IRN, NAN) prior to 24h client dispatch.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {calls.map((call) => (
              <div key={call.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="font-mono font-bold text-xs text-blue-700">{call.rfiNo}</span>
                    <h4 className="font-bold text-sm text-slate-900">{call.client}</h4>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-800 font-bold text-xs">
                    Format: {call.reportFormat}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-bold">Inspector</span>
                    <span className="font-bold text-slate-800">{call.assignedInspector}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-bold">ITP Reference</span>
                    <span className="font-mono text-slate-800">{call.itpRef}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-bold">Review Status</span>
                    <span className="font-bold text-amber-700">{call.tmReviewStatus}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => toast.info(`Query flagged on ${call.rfiNo} and sent back to the inspector.`)}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                  >
                    Flag Query
                  </button>
                  <button
                    onClick={() => {
                      setCalls((prev) =>
                        prev.map((c) => (c.id === call.id ? { ...c, tmReviewStatus: "Approved", dispatchStatus: "Dispatched (<24h)" } : c))
                      );
                      toast.success(`Report ${call.rfiNo} approved and sent to the client, with a copy to the coordinator and GM.`);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve &amp; Dispatch to Client (&lt;24h)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FORMATS & TEMPLATES GENERATOR (TP-01 TO TP-10) */}
      {activeTab === "templates" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 font-heading">
              Official IQE Inspection Formats &amp; Report Templates (Format No: IQE-TP-01)
            </h3>
            <p className="text-xs text-slate-500">
              Generate standardized ISO 9001:2026 &amp; ISO/IEC 17020:2026 inspection reports with digital sign-off table (Prepared by / Approved by).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {IQE_FORMAT_TEMPLATES.map((tmpl) => (
              <div key={tmpl.code} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-xs text-[#003366] dark:text-sky-300 bg-blue-100 px-2.5 py-0.5 rounded-lg">
                    {tmpl.code}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">{tmpl.category}</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">{tmpl.name}</h4>
                <button
                  onClick={() => setSelectedFormat(tmpl.code)}
                  className="w-full py-2 rounded-xl bg-white border border-slate-300 hover:bg-blue-50 text-blue-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Format &amp; Digital Stamp</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: COMPETENCE MATRIX (IQE-TP-01A) */}
      {activeTab === "competence" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 font-heading">
                IQE-TP-01A: Inspector Competence &amp; Qualification Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Match technical requirements against inspector qualifications (NDT Level II/III, Pressure Vessel, Coating, Electrical).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
              <h4 className="font-extrabold text-xs text-[#003366] dark:text-sky-300">Er. Rao (Senior Lead TPI)</h4>
              <p className="text-[11px] text-slate-600">NDT Level III (UT, RT, MPT, LPT) • ASME Sec VIII</p>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono">PAN India 24h</span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
              <h4 className="font-extrabold text-xs text-[#003366] dark:text-sky-300">Er. V. Sharma (Electrical Inspector)</h4>
              <p className="text-[11px] text-slate-600">Substation &amp; Transformer Calibration • HV Testing</p>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono">PAN India 24h</span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
              <h4 className="font-extrabold text-xs text-[#003366] dark:text-sky-300">Er. K. Patel (Global Expeditor)</h4>
              <p className="text-[11px] text-slate-600">Pressure Vessel Hydrotest • ISO Quality Lead Auditor</p>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[11px] font-bold font-mono">Worldwide WWI</span>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Format Modal Preview */}
      {selectedFormat && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900 font-heading">
                Format Preview: {selectedFormat}
              </h3>
              <button aria-label="Close" title="Close" onClick={() => setSelectedFormat(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-slate-700">Format No: IQE-TP-01</span>
                <span className="font-mono text-slate-500">Doc. No: IQE-PFC-03</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Official ISO 9001:2026 &amp; ISO/IEC 17020:2026 Third Party Inspection Template format with signature sign-off blocks.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t text-[11px]">
                <div className="p-3 bg-white rounded-xl border">
                  <span className="font-bold text-slate-700 block">Prepared By:</span>
                  <span className="text-slate-500">TPI Site Inspector / Expeditor</span>
                </div>
                <div className="p-3 bg-white rounded-xl border">
                  <span className="font-bold text-slate-700 block">Approved By:</span>
                  <span className="text-slate-500">Technical Manager (TM)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSelectedFormat(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                Close
              </button>
              <button
                onClick={() => {
                  toast.info(`Downloading the ${selectedFormat} PDF template.`);
                  setSelectedFormat(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#003366] text-white font-extrabold text-xs shadow-md"
              >
                Download PDF Format
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
