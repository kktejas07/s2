"use client";
import { promptDialog, toast } from "@/components/feedback";

import { API_BASE } from "@/lib/config";
import { useEffect, useState } from "react";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";
import {
  ShieldCheck,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Ruler,
  DollarSign,
  FileCheck,
  Search,
  Filter,
  Download,
  Plus,
  ChevronRight,
  Printer,
  Building,
  Activity,
  Award,
  Eye,
  Flag,
  HelpCircle,
  CheckSquare,
  BarChart3,
  Sliders,
  FileText,
  BadgeAlert,
  Flame,
  Info,
  Settings,
  X,
  Loader2,
} from "@/components/icons";
import { api } from "@/lib/api";

export default function ScheduleMPharmaEPCPage() {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "checklists" | "requirements" | "commercial" | "governance" | "reports" | "expert_scorecard"
  >("checklists");
  const [isTabSwitching, setIsTabSwitching] = useState<boolean>(false);

  const handleTabSwitch = (
    tab: "checklists" | "requirements" | "commercial" | "governance" | "reports" | "expert_scorecard"
  ) => {
    if (tab === activeTab) return;
    setIsTabSwitching(true);
    setActiveTab(tab);
    setTimeout(() => setIsTabSwitching(false), 220);
  };

  // Filters & State
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");
  const [selectedResultFilter, setSelectedResultFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [governanceSubTab, setGovernanceSubTab] = useState<"ncrs" | "rfis" | "punch" | "calibration" | "dossier">("ncrs");
  const [commercialSubTab, setCommercialSubTab] = useState<"red_flags" | "measurements" | "reconciliation" | "rabill">("red_flags");
  const [showProjectSetupModal, setShowProjectSetupModal] = useState<boolean>(false);
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);

  // Form Modals / Direct Adds
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({
    boq_item: "",
    description: "",
    unit: "Sqm",
    rate: 0,
    location_grid_room_tag: "",
    length: 0,
    width: 0,
    height_depth: 0,
  });

  const [showAddRFI, setShowAddRFI] = useState(false);
  const [newRFI, setNewRFI] = useState({
    rfi_id: `RFI-00${Math.floor(Math.random() * 900) + 100}`,
    discipline: "Process & Piping",
    doc_ref: "DWG-REV-A",
    query: "",
    impact: "Quality / Schedule",
    addressed_to: "EPC Lead Consultant",
  });

  const [showAddNCR, setShowAddNCR] = useState(false);
  const [newNCR, setNewNCR] = useState({
    ncr_id: `NCR-REV-${Math.floor(Math.random() * 900) + 100}`,
    discipline: "HVAC & Cleanrooms",
    location_tag: "Grade B Fill Suite",
    requirement_source: "Schedule M Clause 3.1",
    objective_evidence: "",
    risk_impact: "HIGH",
    severity: "Major",
    containment: "",
    root_cause: "",
    corrective_action: "",
    owner: "Lead Contractor QC",
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  });

  const [showAddPunch, setShowAddPunch] = useState(false);
  const [newPunch, setNewPunch] = useState({
    item_id: `PL-${Math.floor(Math.random() * 900) + 100}`,
    system: "HVAC & Cleanrooms",
    category: "CAT_B",
    location_tag: "Grade B Background",
    description: "",
    owner: "Lead HVAC Contractor",
    due_date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    prerequisite_impact: "Commissioning Handover",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await api.getScheduleMProject();
      setProject(p);
      const s = await api.getScheduleMSummary();
      setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam && ["checklists", "requirements", "commercial", "governance", "reports", "expert_scorecard"].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  const handleResultCodeUpdate = async (itemId: string, newResultCode: string) => {
    try {
      await api.updateScheduleMChecklist(itemId, { result_code: newResultCode });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRedFlagToggle = async (checkId: string, currentResult: string) => {
    try {
      const nextResult = currentResult === "CLEAR" ? "FLAGGED" : "CLEAR";
      await api.updateScheduleMRedFlag(checkId, { result: nextResult });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMeasurementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addScheduleMMeasurement(newMeasurement);
      setShowAddMeasurement(false);
      setNewMeasurement({
        boq_item: "",
        description: "",
        unit: "Sqm",
        rate: 0,
        location_grid_room_tag: "",
        length: 0,
        width: 0,
        height_depth: 0,
      });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddRFISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addScheduleMRFI(newRFI);
      setShowAddRFI(false);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNCRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addScheduleMNCR(newNCR);
      setShowAddNCR(false);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPunchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addScheduleMPunchItem(newPunch);
      setShowAddPunch(false);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeedData = async () => {
    try {
      await api.triggerScheduleMSeed();
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Filter checklists
  const filteredChecklists = (project?.checklists || []).filter((item: any) => {
    const matchDiscipline =
      selectedDiscipline === "ALL" ||
      item.discipline === selectedDiscipline ||
      (selectedDiscipline === "QC Laboratory" && (item.discipline === "QC Laboratory" || item.item_id.startsWith("LAB"))) ||
      (selectedDiscipline === "Warehouse" && (item.discipline === "Warehouse" || item.item_id.startsWith("WHS"))) ||
      (selectedDiscipline === "Waste & Environment" && (item.discipline === "Waste & Environment" || item.item_id.startsWith("ENV"))) ||
      (selectedDiscipline === "QC Lab, Warehouse & Env" && (item.item_id.startsWith("LAB") || item.item_id.startsWith("WHS") || item.item_id.startsWith("ENV")));
    const matchResult =
      selectedResultFilter === "ALL" ||
      (selectedResultFilter === "C" && (item.result_code === "C" || item.status === "PASS")) ||
      (selectedResultFilter === "NC" && (item.result_code === "NC" || item.status === "FAIL")) ||
      (selectedResultFilter === "OBS" && item.result_code === "OBS") ||
      (selectedResultFilter === "PND" && (item.result_code === "PND" || item.status === "PENDING")) ||
      (selectedResultFilter === "NA" && (item.result_code === "NA" || item.status === "NA"));
    const matchSearch =
      item.verification_point.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.requirement_source && item.requirement_source.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.drawing_spec_ref && item.drawing_spec_ref.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchDiscipline && matchResult && matchSearch;
  });

  const disciplinesList = [
    "ALL",
    "Schedule M Matrix",
    "Design & URS",
    "Civil & Cleanroom",
    "HVAC",
    "Process & Piping",
    "Critical Utilities",
    "E&I",
    "Automation & Data Integrity",
    "Fire & Plumbing",
    "CQV & Handover",
    "Materials",
    "Sterile Add-on",
    "QC Laboratory",
    "Warehouse",
    "Waste & Environment",
    "Facility Condition Walk-Through",
  ];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-9 h-9 text-sky-500 animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-slate-400">
          Loading Schedule M Pharma EPC Engine (Rev 1.0)...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Banner Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#031525] via-[#052844] to-[#041a30] p-6 sm:p-8 text-white border border-sky-800/50 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>IQE / PH / QA / CHK / 001 • Rev 1.0 (28-Sep-2026)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Mpharma EPC Quality Inspection Engine
              <Sparkles className="w-6 h-6 text-amber-400" />
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Authoritative Schedule M (Revised 2024), WHO-GMP & ISPE verification suite. Includes 191 master
              checklists, clause mapping, URS traceability, 3-tier bill verification, D16 fraud red flag quick screen, and
              field-proven inspection proformas.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-sky-200/90 font-medium">
              <span className="flex items-center gap-1.5 bg-sky-900/40 px-2.5 py-1 rounded-md border border-sky-700/50">
                <Building className="w-3.5 h-3.5 text-sky-400" />
                {project?.client_name || "SunPharma BioTech Ltd."}
              </span>
              <span className="flex items-center gap-1.5 bg-sky-900/40 px-2.5 py-1 rounded-md border border-sky-700/50">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                {project?.facility_type || "Formulation & Sterile Injectables"}
              </span>
              <span className="flex items-center gap-1.5 bg-sky-900/40 px-2.5 py-1 rounded-md border border-sky-700/50">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                {project?.licence_authority || "CDSCO / State FDA"}
              </span>
            </div>
          </div>

          <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2.5 shrink-0">
            <button
              onClick={() => setShowProjectSetupModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-950/80 hover:bg-sky-900/90 text-sky-300 border border-sky-600/50 font-semibold text-xs transition-all active:scale-95 shadow-sm"
            >
              <Settings className="w-4 h-4 text-sky-400" />
              Project Setup &amp; Contract Basis
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPdfPreview(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0084bf] hover:bg-[#0073a8] text-white font-semibold text-xs shadow-lg shadow-sky-600/30 transition-all active:scale-95 cursor-pointer"
                title="Live PDF Preview of Schedule M Compliance Report"
              >
                <Eye className="w-4 h-4" />
                Live Preview
              </button>
              <button
                onClick={handleSeedData}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-400 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Re-Sync Rev 1
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/20 transition-all"
              >
                <Printer className="w-4 h-4" />
                Print Cover
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Compliance Score */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-sky-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Schedule M Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">
              {summary?.compliance_score || project?.schedule_m_compliance_score || 94.5}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {summary?.total_checklists || 191} verification points
          </p>
        </div>

        {/* NC Severity Triage */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-red-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>NC Severity Triage</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="my-2 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/60 text-red-300 font-bold text-xs">
              {summary?.nc_severity_breakdown?.critical_open || 1} Crit
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-300 font-bold text-xs">
              {summary?.nc_severity_breakdown?.major_open || 1} Maj
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/60 text-blue-300 font-bold text-xs">
              {summary?.nc_severity_breakdown?.minor_open || 1} Min
            </span>
          </div>
          <p className="text-[11px] text-red-400/80">SLA: 24h / 48h / 30d</p>
        </div>

        {/* Punch Gate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Punch List Gate</span>
            <CheckSquare className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-400">
              {summary?.punch_summary?.cat_a_open || 1}
            </span>
            <span className="text-xs text-slate-400 font-medium">Cat A (Blocking)</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {summary?.punch_summary?.total_open || 3} total open items
          </p>
        </div>

        {/* Bill Verification */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Discrepancy Withheld</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-emerald-400">
              ₹{((summary?.commercial_summary?.discrepancy_withheld || 157500) / 1000).toFixed(1)}k
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Saved via joint measurement</p>
        </div>

        {/* D16 Red Flags Quick Screen */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>D16 Red Flags</span>
            <Flame className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-cyan-400">
              {summary?.red_flag_summary?.clear || 10}/10
            </span>
            <span className="text-xs text-emerald-400 font-semibold">CLEAR</span>
          </div>
          <p className="text-[11px] text-slate-400">Fraud & overbilling screen</p>
        </div>

        {/* Handover Readiness */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-brand-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>CQV Handover</span>
            <Layers className="w-4 h-4 text-brand-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-brand-400">
              {summary?.cqv_handover_readiness || 33.3}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Turnover dossiers approved</p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-sm">
        <button
          onClick={() => handleTabSwitch("checklists")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === "checklists"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Master Checklists (D1-D15)
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {project?.checklists?.length || 191}
          </span>
        </button>

        <button
          onClick={() => handleTabSwitch("requirements")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === "requirements"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          Requirements & URS Trace
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {project?.requirements_registers?.length || 12}
          </span>
        </button>

        <button
          onClick={() => handleTabSwitch("commercial")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === "commercial"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Ruler className="w-4 h-4" />
          Commercial & D16 Red Flags
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            F-07 / 08 / 09
          </span>
        </button>

        <button
          onClick={() => handleTabSwitch("governance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === "governance"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Quality Logs & Registers
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            NCR / RFI / Punch
          </span>
        </button>

        <button
          onClick={() => handleTabSwitch("reports")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === "reports"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Printer className="w-4 h-4" />
          Inspection Reports (F-04)
        </button>

        <button
          onClick={() => handleTabSwitch("expert_scorecard")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === "expert_scorecard"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Award className="w-4 h-4" />
          Expert Review & Scorecard
        </button>
      </div>

      {/* MODULE TABS BODY WITH TRANSITION LOADER */}
      {isTabSwitching ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-2xs animate-in fade-in duration-200">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
          <p className="text-xs font-bold text-slate-300 font-mono tracking-wide">Switching Module View...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: MASTER FIELD CHECKLISTS */}
          {activeTab === "checklists" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input aria-label="Search verification points"
                type="text"
                placeholder="Search by verification point, ID, clause, drawing..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Result filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
              <span className="text-slate-500 font-medium mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Result:
              </span>
              {[
                { code: "ALL", label: "All" },
                { code: "C", label: "C (Conforming)", bg: "hover:bg-emerald-950 text-emerald-400" },
                { code: "NC", label: "NC (Defect)", bg: "hover:bg-red-950 text-red-400" },
                { code: "OBS", label: "OBS", bg: "hover:bg-amber-950 text-amber-400" },
                { code: "PND", label: "Pending", bg: "hover:bg-slate-800 text-slate-300" },
              ].map((rf) => (
                <button
                  key={rf.code}
                  onClick={() => setSelectedResultFilter(rf.code)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                    selectedResultFilter === rf.code
                      ? "bg-sky-500/20 border-sky-400 text-sky-300"
                      : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white"
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Discipline Badges Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
            {disciplinesList.map((disc) => (
              <button
                key={disc}
                onClick={() => setSelectedDiscipline(disc)}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 border transition-all ${
                  selectedDiscipline === disc
                    ? "bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                {disc}
              </button>
            ))}
          </div>

          {/* Checklists Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">ID / Discipline</th>
                    <th className="p-3.5">Inspection / Verification Point</th>
                    <th className="p-3.5">Approved Criteria / Source</th>
                    <th className="p-3.5">Intensity</th>
                    <th className="p-3.5">Result (C / NC / OBS / PND)</th>
                    <th className="p-3.5">NCR / Evidence</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredChecklists.map((item: any) => {
                    const isConforming = item.result_code === "C" || item.status === "PASS";
                    const isDefect = item.result_code === "NC" || item.status === "FAIL";
                    const isObs = item.result_code === "OBS";

                    return (
                      <tr key={item.item_id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 align-top">
                          <span className="font-mono font-bold text-sky-400 block">{item.item_id}</span>
                          <span className="text-[11px] text-slate-400">{item.discipline}</span>
                          {item.sub_category && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-slate-800 text-[11px] text-cyan-300">
                              {item.sub_category}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 align-top max-w-sm">
                          <p className="font-semibold text-white leading-snug">{item.verification_point}</p>
                          {item.comments && (
                            <p className="text-[11px] text-slate-400 mt-1 italic">
                              Reading / Note: {item.comments}
                            </p>
                          )}
                        </td>
                        <td className="p-3.5 align-top max-w-xs text-slate-300">
                          <p className="text-[11px] leading-tight font-medium text-slate-200">
                            {item.acceptance_criteria || "Per approved ITP & URS"}
                          </p>
                          <span className="inline-block mt-1 font-mono text-[11px] text-sky-400/80">
                            {item.requirement_source} • {item.drawing_spec_ref}
                          </span>
                        </td>
                        <td className="p-3.5 align-top whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {item.inspection_intensity || "Risk-based sample"}
                          </span>
                        </td>
                        <td className="p-3.5 align-top whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleResultCodeUpdate(item.item_id, "C")}
                              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                                isConforming
                                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                                  : "bg-slate-800/80 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40"
                              }`}
                              title="Conforming (Pass)"
                            >
                              C
                            </button>
                            <button
                              onClick={() => handleResultCodeUpdate(item.item_id, "NC")}
                              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                                isDefect
                                  ? "bg-red-500 text-white shadow-sm shadow-red-500/30"
                                  : "bg-slate-800/80 text-slate-400 hover:text-red-400 hover:bg-red-950/40"
                              }`}
                              title="Non-Conforming (Defect)"
                            >
                              NC
                            </button>
                            <button
                              onClick={() => handleResultCodeUpdate(item.item_id, "OBS")}
                              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                                isObs
                                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                                  : "bg-slate-800/80 text-slate-400 hover:text-amber-400 hover:bg-amber-950/40"
                              }`}
                              title="Observation"
                            >
                              OBS
                            </button>
                            <button
                              onClick={() => handleResultCodeUpdate(item.item_id, "PND")}
                              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                                item.result_code === "PND" || item.status === "PENDING"
                                  ? "bg-slate-600 text-white"
                                  : "bg-slate-800/80 text-slate-400 hover:text-white"
                              }`}
                              title="Pending"
                            >
                              PND
                            </button>
                          </div>
                          {isDefect && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-red-950 text-red-300 border border-red-800/60">
                              Sev: {item.severity || "Major"}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 align-top whitespace-nowrap text-slate-400">
                          {item.ncr_id ? (
                            <span className="text-red-400 font-mono font-bold block">{item.ncr_id}</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                          {item.evidence_ref && (
                            <span className="text-[11px] text-cyan-400 block font-mono">{item.evidence_ref}</span>
                          )}
                        </td>
                        <td className="p-3.5 align-top whitespace-nowrap">
                          <button
                            onClick={async () => {
                              const note = await promptDialog({
                                title: "Add inspector note",
                                label: "Actual reading or observation",
                                defaultValue: item.comments || "",
                                multiline: true,
                              });
                              if (note !== null) {
                                api.updateScheduleMChecklist(item.item_id, { comments: note })
                                  .then(() => {
                                    toast.success("Note saved");
                                    loadData();
                                  })
                                  .catch(() => toast.error("Couldn't save the note. Please try again."));
                              }
                            }}
                            className="text-sky-400 hover:text-sky-300 font-medium underline text-[11px]"
                          >
                            Add Note
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-950/70 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
              <span>Showing {filteredChecklists.length} of {project?.checklists?.length || 191} verification points</span>
              <span>Controlled SOP IQE/PH/QA/CHK/001</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REQUIREMENTS REGISTER & URS TRACEABILITY */}
      {activeTab === "requirements" && (
        <div className="space-y-6">
          {/* Requirements Register */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-400" />
                  Schedule M Requirements Register (F-01 Mapping)
                </h3>
                <p className="text-xs text-slate-400">
                  Mandatory regulatory themes mapped to facility systems and design references.
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold">
                12 Themes Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
                  <tr>
                    <th className="p-3">Req ID</th>
                    <th className="p-3">Schedule M Theme</th>
                    <th className="p-3">Controlled Statement</th>
                    <th className="p-3">Applicability / Rationale</th>
                    <th className="p-3">Design Ref</th>
                    <th className="p-3">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {(project?.requirements_registers || []).map((req: any) => (
                    <tr key={req.req_id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-sky-400">{req.req_id}</td>
                      <td className="p-3 font-semibold text-white max-w-xs">{req.theme}</td>
                      <td className="p-3 text-slate-300 max-w-md leading-relaxed">{req.statement}</td>
                      <td className="p-3 text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[11px] font-bold block w-fit mb-1">
                          {req.applicability}
                        </span>
                        <span className="text-[11px] italic">{req.rationale}</span>
                      </td>
                      <td className="p-3 font-mono text-cyan-400">{req.design_ref}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-950/90 text-emerald-300 border border-emerald-600/50">
                          {req.compliance_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* URS Traceability Matrix */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-400" />
                  URS-to-Design & Qualification Traceability Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  Critical process parameters (CPP) and critical quality attributes (CQA) traced from URS to OQ protocol evidence.
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-brand-950/80 border border-brand-500/40 text-brand-300 font-semibold">
                GAMP 5 & Schedule M V-Model
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
                  <tr>
                    <th className="p-3">URS ID</th>
                    <th className="p-3">URS Requirement</th>
                    <th className="p-3">Design Ref & Rev</th>
                    <th className="p-3">Verification Method & Protocol</th>
                    <th className="p-3">Evidence / Finding</th>
                    <th className="p-3">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {(project?.urs_traceabilities || []).map((u: any) => (
                    <tr key={u.urs_id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-brand-400 align-top">{u.urs_id}</td>
                      <td className="p-3 font-medium text-white max-w-sm align-top">{u.urs_requirement}</td>
                      <td className="p-3 font-mono text-sky-400 align-top">{u.design_ref}</td>
                      <td className="p-3 align-top max-w-xs text-slate-300">
                        <p className="font-semibold text-slate-200">{u.test_protocol_ref}</p>
                        <p className="text-[11px] text-slate-400">{u.verification_method}</p>
                      </td>
                      <td className="p-3 align-top text-slate-300 max-w-md">
                        <p className="text-[11px] text-slate-200">{u.finding}</p>
                        {u.evidence_ref && (
                          <span className="text-[11px] font-mono text-cyan-400 block mt-1">
                            Evidence: {u.evidence_ref}
                          </span>
                        )}
                      </td>
                      <td className="p-3 align-top">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            u.risk === "Critical"
                              ? "bg-red-950 text-red-300 border border-red-700"
                              : "bg-amber-950 text-amber-300 border border-amber-700"
                          }`}
                        >
                          {u.risk}
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

      {/* TAB 3: COMMERCIAL & D16 RED FLAGS */}
      {activeTab === "commercial" && (
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
            {[
              { id: "red_flags", label: "D16 Fraud & Overbilling Red Flags", icon: Flame, badge: "10 Checks" },
              { id: "measurements", label: "Quantity Measurements (F-07)", icon: Ruler, badge: `${project?.quantity_measurements?.length || 3}` },
              { id: "reconciliation", label: "BOQ Reconciliation (F-08)", icon: FileSpreadsheet, badge: `${project?.boq_reconciliations?.length || 3}` },
              { id: "rabill", label: "RA Bill Verification (F-09)", icon: DollarSign, badge: "Active" },
            ].map((sub: any) => {
              const Icon = sub.icon;
              return (
                <button
                  key={sub.id}
                  onClick={() => setCommercialSubTab(sub.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    commercialSubTab === sub.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {sub.label}
                  <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                    {sub.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* D16 RED FLAGS QUICK SCREEN */}
          {commercialSubTab === "red_flags" && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Flame className="w-5 h-5 text-red-400" />
                      D16: Bill & Measurement Red Flags Quick Screen (Senior Auditor Anti-Fraud Protocol)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Standard screening checks required before certifying any EPC progressive RA bill or contractor milestone.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                      {summary?.red_flag_summary?.clear || 10}/10 Checks Clear
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(project?.bill_red_flags || []).map((rf: any) => {
                    const isClear = rf.result === "CLEAR";
                    return (
                      <div
                        key={rf.check_id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          isClear
                            ? "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                            : "bg-red-950/40 border-red-600/70 shadow-lg shadow-red-950/50"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-sky-400">{rf.check_id}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                isClear
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : "bg-red-900 text-white animate-pulse"
                              }`}
                            >
                              {rf.result}
                            </span>
                          </div>
                          <p className="font-semibold text-xs text-white leading-snug">{rf.check_item}</p>
                          <p className="text-[11px] text-slate-400 italic">
                            Verification: {rf.evidence_remarks || "Cross-checked with site joint measurements and ITP sign-offs."}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                            Risk Impact: {rf.risk_impact}
                          </span>
                          <button
                            onClick={() => handleRedFlagToggle(rf.check_id, rf.result)}
                            className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
                          >
                            Toggle Result
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MEASUREMENT SHEETS (F-07) */}
          {commercialSubTab === "measurements" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-emerald-400" />
                    Joint Measurement Sheet (F-07)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Joint field measurements recorded with EPC contractor engineer prior to concealment or billing.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddMeasurement(!showAddMeasurement)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Measurement
                </button>
              </div>

              {showAddMeasurement && (
                <form
                  onSubmit={handleAddMeasurementSubmit}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3"
                >
                  <h4 className="text-xs font-bold text-slate-300 uppercase">New Measurement Line</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label htmlFor="smp-boq-item-ref" className="text-slate-400 block mb-1">BOQ Item Ref</label>
                      <input id="smp-boq-item-ref"
                        type="text"
                        placeholder="BOQ-CIV-04"
                        value={newMeasurement.boq_item}
                        onChange={(e) => setNewMeasurement({ ...newMeasurement, boq_item: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="smp-description" className="text-slate-400 block mb-1">Description</label>
                      <input id="smp-description"
                        type="text"
                        placeholder="Cleanroom panels 50mm"
                        value={newMeasurement.description}
                        onChange={(e) => setNewMeasurement({ ...newMeasurement, description: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="smp-unit" className="text-slate-400 block mb-1">Unit</label>
                      <select id="smp-unit"
                        value={newMeasurement.unit}
                        onChange={(e) => setNewMeasurement({ ...newMeasurement, unit: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        <option value="Sqm">Sqm</option>
                        <option value="Rm">Rm</option>
                        <option value="Cum">Cum</option>
                        <option value="Nos">Nos</option>
                        <option value="Kg">Kg</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="smp-rate" className="text-slate-400 block mb-1">Rate (₹)</label>
                      <input id="smp-rate"
                        type="number"
                        placeholder="3850"
                        value={newMeasurement.rate || ""}
                        onChange={(e) => setNewMeasurement({ ...newMeasurement, rate: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="smp-length-m" className="text-slate-400 block mb-1">Length (m)</label>
                      <input id="smp-length-m"
                        type="number"
                        step="0.01"
                        placeholder="18.5"
                        value={newMeasurement.length || ""}
                        onChange={(e) => setNewMeasurement({ ...newMeasurement, length: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="smp-width-m" className="text-slate-400 block mb-1">Width (m)</label>
                      <input id="smp-width-m"
                        type="number"
                        step="0.01"
                        placeholder="3.2"
                        value={newMeasurement.width || ""}
                        onChange={(e) => setNewMeasurement({ ...newMeasurement, width: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="smp-height-depth-m" className="text-slate-400 block mb-1">Height / Depth (m)</label>
                      <input id="smp-height-depth-m"
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={newMeasurement.height_depth || ""}
                        onChange={(e) => setNewMeasurement({ ...newMeasurement, height_depth: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="smp-location-grid-tag" className="text-slate-400 block mb-1">Location Grid / Tag</label>
                      <input id="smp-location-grid-tag"
                        type="text"
                        placeholder="Room 104 Grid A3"
                        value={newMeasurement.location_grid_room_tag}
                        onChange={(e) => setNewMeasurement({ ...newMeasurement, location_grid_room_tag: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMeasurement(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      Save Measurement Line
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
                    <tr>
                      <th className="p-3">Sheet / Item</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Dimensions (L × W × H)</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Rate ₹</th>
                      <th className="p-3">Total Amount ₹</th>
                      <th className="p-3">Location / Tag</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {(project?.quantity_measurements || []).map((m: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-sky-400">
                          {m.sheet_no} • {m.boq_item}
                        </td>
                        <td className="p-3 font-medium text-white max-w-xs">{m.description}</td>
                        <td className="p-3 font-mono text-slate-300">
                          {m.length}m × {m.width}m {m.height_depth > 0 ? `× ${m.height_depth}m` : ""}
                        </td>
                        <td className="p-3 font-bold text-white">
                          {m.calculated_qty} {m.unit}
                        </td>
                        <td className="p-3 font-mono text-slate-300">₹{m.rate.toLocaleString()}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          ₹{m.total_amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-400">{m.location_grid_room_tag}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold">
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BOQ RECONCILIATION (F-08) */}
          {commercialSubTab === "reconciliation" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-brand-400" />
                  BOQ Quantity Reconciliation (F-08)
                </h3>
                <p className="text-xs text-slate-400">
                  Tracking contract quantities against approved variations, certified quantities, and balances to complete.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
                    <tr>
                      <th className="p-3">BOQ Item</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Contract Qty</th>
                      <th className="p-3">Variation</th>
                      <th className="p-3">Revised Qty</th>
                      <th className="p-3">Prev Certified</th>
                      <th className="p-3">Current Measured</th>
                      <th className="p-3">Cumulative</th>
                      <th className="p-3">Balance Qty</th>
                      <th className="p-3">Cumulative Value ₹</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {(project?.boq_reconciliations || []).map((b: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-sky-400">{b.boq_item}</td>
                        <td className="p-3 font-semibold text-white max-w-xs">{b.description}</td>
                        <td className="p-3 font-mono text-slate-300">{b.contract_qty} {b.unit}</td>
                        <td className="p-3 font-mono text-amber-400">+{b.approved_variation_qty}</td>
                        <td className="p-3 font-mono font-bold text-white">{b.revised_qty}</td>
                        <td className="p-3 font-mono text-slate-400">{b.previous_certified_qty}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">{b.current_measured_qty}</td>
                        <td className="p-3 font-mono text-cyan-300">{b.cumulative_qty}</td>
                        <td className="p-3 font-mono text-brand-300 font-bold">{b.balance_qty}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          ₹{b.cumulative_value.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RA BILL REVIEW (F-09) */}
          {commercialSubTab === "rabill" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  RA Bill Verification Review (F-09 Line Item Discrepancy Analysis)
                </h3>
                <p className="text-xs text-slate-400">
                  Detailed comparison of contractor claimed quantities versus IQE third-party verified work.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
                    <tr>
                      <th className="p-3">Package / Item</th>
                      <th className="p-3">Claimed Qty</th>
                      <th className="p-3">Verified Qty</th>
                      <th className="p-3">Claimed Value ₹</th>
                      <th className="p-3">Verified Value ₹</th>
                      <th className="p-3">Variance / Withheld ₹</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Inspector Audit Findings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {(project?.ra_bill_reviews || []).map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-3 align-top font-mono">
                          <span className="font-bold text-white block">{r.description}</span>
                          <span className="text-[11px] text-sky-400">{r.package} • {r.boq_item}</span>
                        </td>
                        <td className="p-3 align-top font-mono text-slate-300">{r.claimed_qty} {r.unit}</td>
                        <td className="p-3 align-top font-mono font-bold text-white">{r.verified_qty} {r.unit}</td>
                        <td className="p-3 align-top font-mono text-slate-300">₹{r.claimed_value.toLocaleString()}</td>
                        <td className="p-3 align-top font-mono font-bold text-emerald-400">
                          ₹{r.verified_value.toLocaleString()}
                        </td>
                        <td className="p-3 align-top font-mono font-bold text-red-400">
                          {r.variance_value > 0 ? `-₹${r.variance_value.toLocaleString()}` : "₹0"}
                        </td>
                        <td className="p-3 align-top">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              r.status === "VERIFIED"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : "bg-red-950 text-red-300 border border-red-800"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 align-top text-slate-300 max-w-sm text-[11px] leading-relaxed">
                          {r.remarks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: QUALITY GOVERNANCE & SITE LOGS */}
      {activeTab === "governance" && (
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
            {[
              { id: "ncrs", label: "NCR & CAPA Register (F-06)", count: project?.ncr_capas?.length || 3 },
              { id: "rfis", label: "RFI Register (F-05)", count: project?.rfi_registers?.length || 3 },
              { id: "punch", label: "Punch List (F-13)", count: project?.punch_lists?.length || 3 },
              { id: "calibration", label: "Instrument Calibration (F-11)", count: project?.calibrations?.length || 4 },
              { id: "dossier", label: "Turnover Dossiers (TOP)", count: project?.turnover_dossiers?.length || 3 },
            ].map((sub: any) => (
              <button
                key={sub.id}
                onClick={() => setGovernanceSubTab(sub.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  governanceSubTab === sub.id
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {sub.label}
                <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                  {sub.count}
                </span>
              </button>
            ))}
          </div>

          {/* NCR & CAPA (F-06) */}
          {governanceSubTab === "ncrs" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Non-Conformance & CAPA Register (F-06 with Severity Classification)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Triaged by severity: Critical (24h stop-work), Major (48h), Minor (30d) per Expert SOP guidelines.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddNCR(!showAddNCR)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Raise New NCR
                </button>
              </div>

              {showAddNCR && (
                <form onSubmit={handleAddNCRSubmit} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-300 uppercase">Raise Formal Non-Conformance Report</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="smp-ncr-id" className="text-slate-400 block mb-1">NCR ID</label>
                      <input id="smp-ncr-id"
                        type="text"
                        value={newNCR.ncr_id}
                        onChange={(e) => setNewNCR({ ...newNCR, ncr_id: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="smp-severity-class" className="text-slate-400 block mb-1">Severity Class</label>
                      <select id="smp-severity-class"
                        value={newNCR.severity}
                        onChange={(e) => setNewNCR({ ...newNCR, severity: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        <option value="Critical">Critical (Stop Work / 24h)</option>
                        <option value="Major">Major (48h Containment)</option>
                        <option value="Minor">Minor (30 Days)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="smp-discipline" className="text-slate-400 block mb-1">Discipline</label>
                      <input id="smp-discipline"
                        type="text"
                        value={newNCR.discipline}
                        onChange={(e) => setNewNCR({ ...newNCR, discipline: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="smp-objective-evidence" className="text-slate-400 block mb-1">Objective Evidence</label>
                    <textarea id="smp-objective-evidence"
                      rows={2}
                      placeholder="Detail exact physical discrepancy, measurement, or test failure..."
                      value={newNCR.objective_evidence}
                      onChange={(e) => setNewNCR({ ...newNCR, objective_evidence: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="smp-immediate-containment-action" className="text-slate-400 block mb-1">Immediate Containment Action</label>
                      <input id="smp-immediate-containment-action"
                        type="text"
                        placeholder="Tag out of service, quarantine..."
                        value={newNCR.containment}
                        onChange={(e) => setNewNCR({ ...newNCR, containment: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="smp-corrective-action-plan-capa" className="text-slate-400 block mb-1">Corrective Action Plan (CAPA)</label>
                      <input id="smp-corrective-action-plan-capa"
                        type="text"
                        placeholder="Re-weld, re-torque, replace..."
                        value={newNCR.corrective_action}
                        onChange={(e) => setNewNCR({ ...newNCR, corrective_action: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddNCR(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold"
                    >
                      Submit NCR
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {(project?.ncr_capas || []).map((ncr: any) => (
                  <div
                    key={ncr.ncr_id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-red-400 text-sm">{ncr.ncr_id}</span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            ncr.severity === "Critical"
                              ? "bg-red-950 text-red-300 border border-red-700"
                              : ncr.severity === "Major"
                              ? "bg-amber-950 text-amber-300 border border-amber-700"
                              : "bg-blue-950 text-blue-300 border border-blue-700"
                          }`}
                        >
                          Severity: {ncr.severity || "Major"}
                        </span>
                        <span className="text-slate-400 font-medium">• {ncr.discipline}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Status:</span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            ncr.status === "CLOSED"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                              : "bg-red-950 text-red-300 border border-red-700"
                          }`}
                        >
                          {ncr.status}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 font-semibold mb-1">Defect Evidence & Location:</p>
                        <p className="text-white font-medium">{ncr.objective_evidence}</p>
                        <p className="text-[11px] text-sky-400 mt-1">Location: {ncr.location_tag}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-semibold mb-1">Containment & CAPA:</p>
                        <p className="text-amber-200">Containment: {ncr.containment}</p>
                        <p className="text-emerald-300 mt-1">CAPA: {ncr.corrective_action}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 text-[11px] text-slate-500">
                      <span>Owner: {ncr.owner} • Due: {ncr.due_date}</span>
                      {ncr.status !== "CLOSED" && (
                        <button
                          onClick={() => {
                            api.updateScheduleMNCR(ncr.ncr_id, { status: "CLOSED" }).then(() => loadData());
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600/30 border border-emerald-500 text-emerald-300 hover:bg-emerald-600 hover:text-white font-semibold transition-all"
                        >
                          Verify & Close NCR
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RFI REGISTER (F-05) */}
          {governanceSubTab === "rfis" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-sky-400" />
                    Request For Information (RFI / F-05 Technical Query Log)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Resolving engineering ambiguities, drawing discrepancies, and specification conflicts.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddRFI(!showAddRFI)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Raise New RFI
                </button>
              </div>

              {showAddRFI && (
                <form onSubmit={handleAddRFISubmit} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-300 uppercase">Raise Technical Query RFI</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="smp-rfi-id" className="text-slate-400 block mb-1">RFI ID</label>
                      <input id="smp-rfi-id"
                        type="text"
                        value={newRFI.rfi_id}
                        onChange={(e) => setNewRFI({ ...newRFI, rfi_id: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="smp-discipline-2" className="text-slate-400 block mb-1">Discipline</label>
                      <input id="smp-discipline-2"
                        type="text"
                        value={newRFI.discipline}
                        onChange={(e) => setNewRFI({ ...newRFI, discipline: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="smp-drawing-spec-ref" className="text-slate-400 block mb-1">Drawing / Spec Ref</label>
                      <input id="smp-drawing-spec-ref"
                        type="text"
                        value={newRFI.doc_ref}
                        onChange={(e) => setNewRFI({ ...newRFI, doc_ref: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="smp-query-statement" className="text-slate-400 block mb-1">Query Statement</label>
                    <textarea id="smp-query-statement"
                      rows={2}
                      placeholder="Specify conflict between drawings or specification..."
                      value={newRFI.query}
                      onChange={(e) => setNewRFI({ ...newRFI, query: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddRFI(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold"
                    >
                      Submit RFI
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
                    <tr>
                      <th className="p-3">RFI ID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Discipline & Doc Ref</th>
                      <th className="p-3">Query Statement</th>
                      <th className="p-3">Consultant Response</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {(project?.rfi_registers || []).map((rfi: any) => (
                      <tr key={rfi.rfi_id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-sky-400 align-top">{rfi.rfi_id}</td>
                        <td className="p-3 text-slate-400 align-top whitespace-nowrap">{rfi.date_raised}</td>
                        <td className="p-3 align-top font-mono">
                          <span className="font-bold text-white block">{rfi.discipline}</span>
                          <span className="text-[11px] text-cyan-400">{rfi.doc_ref}</span>
                        </td>
                        <td className="p-3 align-top max-w-sm text-slate-200">{rfi.query}</td>
                        <td className="p-3 align-top max-w-sm text-emerald-300">
                          {rfi.response || <span className="text-slate-500 italic">Pending Consultant Response</span>}
                        </td>
                        <td className="p-3 align-top">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              rfi.status === "CLOSED"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                                : "bg-amber-950 text-amber-300 border border-amber-700"
                            }`}
                          >
                            {rfi.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PUNCH LIST (F-13) */}
          {governanceSubTab === "punch" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-amber-400" />
                    Punch List Register (F-13 Categorized A / B / C)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cat A: Handover/Qualification blocking • Cat B: Major rectification before final acceptance • Cat C: Cosmetic/Minor.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddPunch(!showAddPunch)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Punch Item
                </button>
              </div>

              {showAddPunch && (
                <form onSubmit={handleAddPunchSubmit} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-300 uppercase">Log Site Punch Item</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="smp-item-id" className="text-slate-400 block mb-1">Item ID</label>
                      <input id="smp-item-id"
                        type="text"
                        value={newPunch.item_id}
                        onChange={(e) => setNewPunch({ ...newPunch, item_id: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="smp-category" className="text-slate-400 block mb-1">Category</label>
                      <select id="smp-category"
                        value={newPunch.category}
                        onChange={(e) => setNewPunch({ ...newPunch, category: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        <option value="CAT_A">Cat A (Handover-Blocking)</option>
                        <option value="CAT_B">Cat B (Commissioning Major)</option>
                        <option value="CAT_C">Cat C (Minor / Cosmetic)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="smp-system-package" className="text-slate-400 block mb-1">System / Package</label>
                      <input id="smp-system-package"
                        type="text"
                        value={newPunch.system}
                        onChange={(e) => setNewPunch({ ...newPunch, system: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="smp-description-2" className="text-slate-400 block mb-1">Description</label>
                    <input id="smp-description-2"
                      type="text"
                      placeholder="Specify punch snag..."
                      value={newPunch.description}
                      onChange={(e) => setNewPunch({ ...newPunch, description: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddPunch(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
                    >
                      Save Punch Item
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
                    <tr>
                      <th className="p-3">Item ID</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">System & Tag</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Prerequisite Impact</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {(project?.punch_lists || []).map((pl: any) => (
                      <tr key={pl.item_id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-sky-400 align-top">{pl.item_id}</td>
                        <td className="p-3 align-top whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              pl.category === "CAT_A"
                                ? "bg-red-950 text-red-300 border border-red-700 animate-pulse"
                                : pl.category === "CAT_B"
                                ? "bg-amber-950 text-amber-300 border border-amber-700"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}
                          >
                            {pl.category}
                          </span>
                        </td>
                        <td className="p-3 align-top font-mono">
                          <span className="font-bold text-white block">{pl.system}</span>
                          <span className="text-[11px] text-slate-400">{pl.location_tag}</span>
                        </td>
                        <td className="p-3 align-top max-w-sm text-slate-200">{pl.description}</td>
                        <td className="p-3 align-top text-amber-300 text-[11px]">{pl.prerequisite_impact}</td>
                        <td className="p-3 align-top">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              pl.status === "CLOSED"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                                : "bg-amber-950 text-amber-300 border border-amber-700"
                            }`}
                          >
                            {pl.status}
                          </span>
                        </td>
                        <td className="p-3 align-top">
                          {pl.status !== "CLOSED" && (
                            <button
                              onClick={() => {
                                api.updateScheduleMPunchItem(pl.item_id, { status: "CLOSED" }).then(() => loadData());
                              }}
                              className="text-emerald-400 hover:text-emerald-300 font-semibold underline text-[11px]"
                            >
                              Verify Close
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INSTRUMENT CALIBRATION (F-11) */}
          {governanceSubTab === "calibration" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Inspection Instrument Calibration Register (F-11 NABL Traceable)
                </h3>
                <p className="text-xs text-slate-400">
                  All instruments used for validation, HEPA leak testing, balancing, and qualification must possess valid NABL certificates.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
                    <tr>
                      <th className="p-3">Instrument ID</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Range & Spec</th>
                      <th className="p-3">Serial / Cert No</th>
                      <th className="p-3">Cal Date</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {(project?.calibrations || []).map((cal: any) => (
                      <tr key={cal.instrument_id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-sky-400">{cal.instrument_id}</td>
                        <td className="p-3 font-semibold text-white">{cal.description}</td>
                        <td className="p-3 text-slate-300">{cal.range_spec}</td>
                        <td className="p-3 font-mono text-cyan-300">
                          {cal.serial_no} • {cal.certificate_no}
                        </td>
                        <td className="p-3 font-mono text-slate-400">{cal.calibration_date}</td>
                        <td className="p-3 font-mono font-bold text-white">{cal.due_date}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              cal.status === "VALID"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                                : "bg-amber-950 text-amber-300 border border-amber-700"
                            }`}
                          >
                            {cal.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TURNOVER DOSSIER (TOP) */}
          {governanceSubTab === "dossier" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-400" />
                  Turnover Package Dossier Register (TOP / Handover Gate)
                </h3>
                <p className="text-xs text-slate-400">
                  Required qualification, as-built, metallurgy, and calibration turnover binders per system package.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
                    <tr>
                      <th className="p-3">Dossier ID</th>
                      <th className="p-3">Package System</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Required Documents</th>
                      <th className="p-3">Responsible Party</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {(project?.turnover_dossiers || []).map((top: any) => (
                      <tr key={top.dossier_id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-brand-400 align-top">{top.dossier_id}</td>
                        <td className="p-3 font-bold text-white align-top">{top.system_package}</td>
                        <td className="p-3 font-medium text-slate-300 align-top">{top.record_category}</td>
                        <td className="p-3 text-slate-300 align-top max-w-md leading-relaxed">
                          {top.required_document}
                        </td>
                        <td className="p-3 text-slate-400 align-top whitespace-nowrap">{top.responsible_party}</td>
                        <td className="p-3 align-top">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              top.status === "APPROVED"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                                : "bg-sky-950 text-sky-300 border border-sky-700"
                            }`}
                          >
                            {top.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: OFFICIAL INSPECTION REPORTS (F-04) */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {(project?.inspection_reports || []).map((ir: any, idx: number) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 print:border-none print:shadow-none print:bg-white print:text-black"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-sky-950 border border-sky-700/60 text-sky-300 text-xs font-mono font-bold">
                    FORM F-04 • OFFICIAL INSPECTION REPORT
                  </div>
                  <h3 className="text-2xl font-black text-white">{ir.report_no}</h3>
                  <p className="text-xs text-slate-400">{ir.project_client_epc}</p>
                </div>
                <div className="flex flex-col sm:items-end gap-1.5">
                  <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold text-xs">
                    RESULT: {ir.overall_result}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Date: {ir.inspection_datetime}</span>
                  <button
                    onClick={() => setShowPdfPreview(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0084bf] hover:bg-[#0073a8] text-white font-semibold text-xs transition-all cursor-pointer shadow-xs mt-0.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Live PDF Preview
                  </button>
                </div>
              </div>

              {/* Scope & Methodology */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Scope Inspected</span>
                  <p className="font-semibold text-white text-sm leading-snug">{ir.scope_inspected}</p>
                  <p className="text-slate-400 text-[11px]">Location: {ir.discipline_system_location}</p>
                  <p className="text-sky-400 font-mono text-[11px]">ITP Point: {ir.ir_no_itp_point}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Methodology & Instruments</span>
                  <p className="font-semibold text-white leading-snug">{ir.method_procedure}</p>
                  <p className="text-cyan-300 font-mono text-[11px]">{ir.instrument_ids_validity}</p>
                  <p className="text-slate-400 text-[11px]">Ref Drawing: {ir.drawing_spec_rev}</p>
                </div>
              </div>

              {/* Findings & Criteria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Acceptance Criteria</span>
                  <p className="font-medium text-slate-200">{ir.acceptance_criteria}</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1.5">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider block">Actual Test Results</span>
                  <p className="font-semibold text-white">{ir.actual_results}</p>
                </div>
              </div>

              {/* Disposition */}
              <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-800/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-sky-400 font-bold uppercase tracking-wider block">Disposition & Next Action</span>
                  <p className="text-white font-bold text-sm mt-0.5">{ir.disposition_next_action}</p>
                  <p className="text-slate-400 text-[11px] mt-1">{ir.photo_evidence_refs}</p>
                </div>
                <div className="shrink-0">
                  <span className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono">
                    Highest NC: {ir.highest_nc_severity}
                  </span>
                </div>
              </div>

              {/* Digital Sign-off Signatures */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block">IQE Lead Inspector</span>
                  <p className="font-bold text-sky-400">{ir.inspector_sign}</p>
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Digitally Signed &amp; Authenticated</span>
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block">Technical Reviewer</span>
                  <p className="font-bold text-cyan-400">{ir.technical_reviewer_sign}</p>
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Peer Review Sign-Off</span>
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block">Client Acknowledgement</span>
                  <p className="font-bold text-slate-300">{ir.client_ack}</p>
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified &amp; Logged</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 6: EXPERT REVIEW, SCORECARD & TECHNICAL BENCHMARKS */}
      {activeTab === "expert_scorecard" && (
        <div className="space-y-6">
          {/* Executive Assessment & Scorecard */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Part A: Expert Analysis & Scorecard of SOP Manual (IQE/PH/QA/MAN/001)
                </h3>
                <p className="text-xs text-slate-400">
                  Reviewed by Senior Pharma EPC Quality & Documentation Expert (28 September 2026).
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
                Overall Score: 4.1 / 5.0
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                { dim: "Regulatory positioning & disclaimers", score: "4.0/5", comment: "Clear, correct disclaimers; keeps IQE safely in inspection role." },
                { dim: "Organization & process flow", score: "4.5/5", comment: "Logical sequence from pre-visit to handover; clear gate concept." },
                { dim: "ITP and proformas", score: "3.5/5", comment: "Good hold/witness architecture; upgraded with F-01 to F-14." },
                { dim: "Field inspection checklists", score: "5.0/5", comment: "Full D1 to D16 checklists implemented across 14 disciplines." },
                { dim: "Sampling & inspection intensity", score: "4.5/5", comment: "Clear risk-based sampling rules defined per system (100% critical welds/HEPA)." },
                { dim: "Technical benchmarks reference", score: "4.5/5", comment: "Indicative technical benchmarks integrated for HVAC, WFI, coving & slope." },
                { dim: "Sterile facility content", score: "4.5/5", comment: "Dedicated Grade A/B/C/D aseptic suite checks & airlock gowning rules active." },
                { dim: "Commercial & bill verification", score: "5.0/5", comment: "3-tier verification formula, F-07 joint measurement, and D16 anti-fraud screen active." },
              ].map((sc, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">{sc.dim}</span>
                    <span className="font-mono font-bold text-amber-400">{sc.score}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{sc.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 14 Expert Gaps & Remediation Tracker */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  14 Expert Gaps & Recommended Fixes Tracker (Part A4)
                </h3>
                <p className="text-xs text-slate-400">
                  All 14 expert gaps identified in the SOP manual review are fully implemented in Rev 1.0!
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold">
                14 / 14 IMPLEMENTED
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
                  <tr>
                    <th className="p-3"># / Priority</th>
                    <th className="p-3">Gap Identified</th>
                    <th className="p-3">Why It Matters</th>
                    <th className="p-3">Recommended Fix & Rev 1 Status</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {(project?.expert_gaps || []).map((gap: any) => (
                    <tr key={gap.gap_no} className="hover:bg-slate-800/40">
                      <td className="p-3 align-top whitespace-nowrap">
                        <span className="font-mono font-bold text-white block">#{gap.gap_no}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold text-[11px] ${
                            gap.priority === "P1"
                              ? "bg-red-950 text-red-300 border border-red-800"
                              : gap.priority === "P2"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-blue-950 text-blue-300 border border-blue-800"
                          }`}
                        >
                          {gap.priority}
                        </span>
                      </td>
                      <td className="p-3 align-top font-bold text-white max-w-xs">{gap.gap_title}</td>
                      <td className="p-3 align-top text-slate-300 max-w-xs text-[11px] leading-relaxed">
                        {gap.why_it_matters}
                      </td>
                      <td className="p-3 align-top text-emerald-300 max-w-sm text-[11px] leading-relaxed">
                        {gap.recommended_fix}
                      </td>
                      <td className="p-3 align-top whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{gap.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Technical Benchmarks Reference */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sky-400" />
                  Indicative Technical Benchmarks Reference Card (Part A6)
                </h3>
                <p className="text-xs text-slate-400">
                  Orientation benchmarks commonly referenced in pharma EPC (controlling value is always approved URS & spec).
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-sky-950 text-sky-300 border border-sky-700 font-bold font-mono">
                10 Benchmarks
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(project?.technical_benchmarks || []).map((bench: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-white">{bench.parameter}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-cyan-300 font-medium shrink-0">
                      {bench.category}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/90 border border-slate-800 font-mono text-emerald-400 font-bold text-[11px]">
                    {bench.commonly_referenced_value}
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans italic">
                    Source: {bench.typical_source}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* PROJECT SETUP & CONTRACT BASIS MODAL */}
      {showProjectSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Project Setup &amp; Contract Basis (F-00 / Rev 1.0)</h3>
                  <p className="text-xs text-slate-400">
                    Controlling parameters, contract rules, notice periods, and SLAs from the Rev 1 Master Workbook.
                  </p>
                </div>
              </div>
              <button aria-label="Close"
                onClick={() => setShowProjectSetupModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <h4 className="font-bold text-sky-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Project &amp; Regulatory Identity
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Project / Site</span>
                    <span className="font-bold text-white text-sm">{project?.project_name || "Schedule M Revised Formulation & Sterile Facility EPC"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Client / Owner</span>
                    <span className="font-medium text-slate-200">{project?.client_name || "SunPharma BioTech Ltd."}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Turnkey EPC Contractor</span>
                    <span className="font-medium text-slate-200">{project?.epc_contractor || "Ideal Pharma EPC Solutions Pvt. Ltd."}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Site Location</span>
                    <span className="font-medium text-slate-200">{project?.facility_location || "Baddi Pharma Hub, Himachal Pradesh"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Product / Facility Type</span>
                    <span className="font-medium text-cyan-300">{project?.facility_type || "Formulation & Sterile Injectables Facility"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Statutory Licence / Basis</span>
                    <span className="font-medium text-amber-300">{project?.licence_authority || "CDSCO / State FDA (Revised Schedule M 2024)"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Schedule M Verified By / Date</span>
                    <span className="font-medium text-emerald-400">{project?.schedule_m_verified_by_date || "Dr. A. V. Kumar (Director QA) / 28-Sep-2026"}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <h4 className="font-bold text-brand-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Engineering &amp; Quality Specifications
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Requirements Register Ref</span>
                    <span className="font-mono text-sky-400">{project?.requirements_register_ref || "REQ-SCH-M-2026-01"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">URS &amp; Design Basis Revision</span>
                    <span className="font-mono text-slate-200">{project?.urs_design_basis_rev || "BOD-REV-02 / URS-QA-2026-01 Rev C"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Quality Plan &amp; ITP Revision</span>
                    <span className="font-mono text-emerald-400">{project?.quality_plan_itp_rev || "ITP-PH-EPC-001 Rev 1.0"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">IQE Project Lead Inspector</span>
                    <span className="font-medium text-white">{project?.iqe_project_lead || "Er. S. Mehta (Lead QA/QC Inspector)"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Client Quality Head Contact</span>
                    <span className="font-medium text-white">{project?.client_qa_contact || "P. Nair (Head QA, SunPharma)"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Design Authority Consultant</span>
                    <span className="font-medium text-slate-200">{project?.design_authority || "PharmEng Solutions Consulting"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Escalation Route</span>
                    <span className="font-medium text-slate-300">{project?.escalation_route || "Lead Inspector -> IQE Technical Director -> Client Steering Committee"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 text-xs">
              <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Notice Rules, Response SLAs &amp; Commercial Tolerances
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[11px] uppercase">Min IR Notice</span>
                  <span className="font-bold text-white text-sm">{project?.minimum_ir_notice_days || 1} Working Day</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[11px] uppercase">Bill Review Turnaround</span>
                  <span className="font-bold text-white text-sm">{project?.bill_review_turnaround || "5 to 7 days"}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[11px] uppercase">Over-Claim Alert Trigger</span>
                  <span className="font-bold text-amber-400 text-sm">&gt; {project?.overclaim_review_threshold_percent || 10}%</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[11px] uppercase">Calibration Alert Window</span>
                  <span className="font-bold text-cyan-400 text-sm">{project?.calibration_alert_window_days || 30} Days</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60">
                  <span className="text-red-400 block text-[11px] font-bold uppercase">Critical NC Response SLA</span>
                  <span className="font-black text-red-200 text-sm">24 Hours (1 Day)</span>
                  <p className="text-[11px] text-red-300 mt-1">Immediate stop-work and containment required.</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/60">
                  <span className="text-amber-400 block text-[11px] font-bold uppercase">Major NC Response SLA</span>
                  <span className="font-black text-amber-200 text-sm">5 Days (48h Containment)</span>
                  <p className="text-[11px] text-amber-300 mt-1">Engineering disposition and CAPA approval.</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-800/60">
                  <span className="text-blue-400 block text-[11px] font-bold uppercase">Minor NC Response SLA</span>
                  <span className="font-black text-blue-200 text-sm">30 Calendar Days</span>
                  <p className="text-[11px] text-blue-300 mt-1">Rectification before final turnover dossier closure.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowProjectSetupModal(false)}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg transition-all"
              >
                Close Project Setup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standardized Live PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        title="Schedule M (2024 Revised) Cleanroom & Pharma EPC Audit Report"
        reportNo="F-01 - F-14"
        pdfUrl={`${API_BASE}/api/v1/reports/pdf/schedule-m-pharma-epc`}
      />
    </div>
  );
}
