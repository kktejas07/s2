"use client";

import { API_BASE } from "@/lib/config";
import { downloadPdfFile } from "@/lib/downloadPdf";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  Edit3,
  Building2,
  Factory,
  HardHat,
  Calendar,
  Layers,
  Save,
  Printer,
  ChevronDown,
  X,
  Clock,
  Eye,
  Sparkles,
  Columns,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  FileCheck2,
  Coins,
  RefreshCw,
  Scale,
  BadgeAlert,
  Percent,
  Check,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Users,
  Camera,
  Upload,
  Zap,
  ArrowLeft,
  SlidersHorizontal,
  Loader2,
} from "@/components/icons";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";
import { confirmDialog } from "@/components/feedback";

export interface FlashInspectionItem {
  id: string;
  itemNo: number;
  description: string;
  tagNo: string;
  poQty: number;
  offeredQty: number;
  inspectedQty: number;
  acceptedQty: number;
  unit: string;
  remarks: string;
  isLocked?: boolean;
}

export interface KeyFinding {
  id: string;
  slNo: number;
  finding: string;
  reference: string;
  actionRequired: string;
  status: "OPEN" | "RESOLVED" | "UNDER_REVIEW";
}

export interface ImmediateAction {
  id: string;
  action: string;
  targetDate: string;
  followUpParty: string;
  status: "PENDING" | "IN_PROGRESS" | "CLOSED";
}

const CLIENT_OPTIONS = [
  "Granules India Limited - Gagillapur",
  "Atom Project (New Atom Project)",
  "Suven Pharmaceuticals Ltd (Chonce Life Science)",
  "MCGM (Greater Mumbai Corp)",
  "S2 / Standard Client",
];

interface ClientDetails {
  projectName: string;
  projectLocation: string;
  customer: string;
  supplier: string;
  subSupplier: string;
  poNumber: string;
  poDate: string;
  rfiRef: string;
  rfiDate: string;
  inspector: string;
}

const CLIENT_DETAILS_MAP: Record<string, ClientDetails> = {
  "Granules India Limited - Gagillapur": {
    projectName: "Biopharma Manufacturing Facility Expansion - Block C",
    projectLocation: "Gagillapur Plant, Hyderabad, Telangana",
    customer: "Granules India Limited",
    supplier: "L&T Heavy Engineering Ltd.",
    subSupplier: "Devi Sri Civil & Fabricators",
    poNumber: "WO-3400077675/18.08.25",
    poDate: "2025-10-17",
    rfiRef: "RFI-GIL-2026-089",
    rfiDate: "2026-09-28",
    inspector: "Alok Gupta (Senior TPI Lead Auditor)",
  },
  "Atom Project (New Atom Project)": {
    projectName: "New Atom Process Heavy Fabrication Pkg 01",
    projectLocation: "Atom Site Industrial Zone, India",
    customer: "Atom Process Energy Asset Owner",
    supplier: "Larsen & Toubro Ltd - Infra Div",
    subSupplier: "Apex Heavy Engg Corp",
    poNumber: "PO-ATOM-2026-88120",
    poDate: "2026-05-14",
    rfiRef: "RFI-ATOM-PKG01-094",
    rfiDate: "2026-09-27",
    inspector: "Rajesh V. Sharma (TPI Inspector)",
  },
  "Suven Pharmaceuticals Ltd (Chonce Life Science)": {
    projectName: "Suven Cleanroom Tank Civil & Structural Works",
    projectLocation: "Chonce Life Science Plant, Suryapet, TS",
    customer: "Suven Pharmaceuticals Ltd",
    supplier: "SVS CONSTRUCTIONS",
    subSupplier: "SV Enterprises",
    poNumber: "PO-SUVEN-50054",
    poDate: "2025-12-13",
    rfiRef: "RFI-SUV-CIV-041",
    rfiDate: "2026-09-25",
    inspector: "K. Mohan Rao (Senior Quality Inspector)",
  },
  "MCGM (Greater Mumbai Corp)": {
    projectName: "Mumbai Coastal Road Pkg 03 - Retaining Wall",
    projectLocation: "Worli-Nariman Corridor, Mumbai, MH",
    customer: "Municipal Corporation of Greater Mumbai",
    supplier: "Larsen & Toubro Ltd - Infra Div",
    subSupplier: "Shapoorji Pallonji Engineering",
    poNumber: "PO-MCGM-2024-99812",
    poDate: "2024-04-15",
    rfiRef: "RFI-MCGM-2026-102",
    rfiDate: "2026-09-26",
    inspector: "V. R. Deshmukh (Lead Inspection Engineer)",
  },
  "S2 / Standard Client": {
    projectName: "Pharma Process Equipment Skid Fabrication",
    projectLocation: "Balanagar Industrial Area, Hyderabad",
    customer: "S2 Engineering Services Pvt Ltd",
    supplier: "Quality Fabtech India",
    subSupplier: "Precision Machining Works",
    poNumber: "PO-S2-2026-3391",
    poDate: "2026-01-20",
    rfiRef: "RFI-S2-2026-018",
    rfiDate: "2026-09-28",
    inspector: "P. Venkatraman (TPI Inspector)",
  },
};

const INITIAL_ITEMS: FlashInspectionItem[] = [
  {
    id: "item-1",
    itemNo: 1,
    description: "Multi-Tube Clean Steam Condenser 316L (500 LPH, 6.0 Bar Design)",
    tagNo: "HE-3101",
    poQty: 4,
    offeredQty: 2,
    inspectedQty: 2,
    acceptedQty: 2,
    unit: "Nos",
    remarks: "Hydrostatic test witnessed at 9.0 bar for 45 mins. Shell & tube passed.",
    isLocked: false,
  },
  {
    id: "item-2",
    itemNo: 2,
    description: "Electropolished Sanitary Piping Spools (DN50, ASME BPE SF4 0.38µm Ra)",
    tagNo: "SP-BPE-01 to 24",
    poQty: 60,
    offeredQty: 24,
    inspectedQty: 24,
    acceptedQty: 20,
    unit: "Spools",
    remarks: "4 spools flagged with borescope root concavity; sent for buffing & pickle.",
    isLocked: false,
  },
  {
    id: "item-3",
    itemNo: 3,
    description: "Pure Steam Sampling Cooler (SS316L Double Tube Sheet Design)",
    tagNo: "SC-901-A/B",
    poQty: 2,
    offeredQty: 2,
    inspectedQty: 2,
    acceptedQty: 2,
    unit: "Sets",
    remarks: "Visual, dimension and MTR verification satisfactory per QAP clause 4.2.",
    isLocked: false,
  },
  {
    id: "item-4",
    itemNo: 4,
    description: "Pneumatic Diaphragm Actuated Sanitary Control Valve (DN40 Tri-Clamp)",
    tagNo: "CV-201",
    poQty: 12,
    offeredQty: 6,
    inspectedQty: 6,
    acceptedQty: 6,
    unit: "Nos",
    remarks: "Seat leakage rate Class VI witnessed with nitrogen at 4 bar. Satisfactory.",
    isLocked: true,
  },
];

const INITIAL_FINDINGS: KeyFinding[] = [
  {
    id: "find-1",
    slNo: 1,
    finding: "Root concavity (>0.3mm) detected via borescope on orbital weld W-14 of spool SP-BPE-18.",
    reference: "ASME BPE 2024 Table MJ-8-1 & QAP Cl. 5.3",
    actionRequired: "Vendor to cut & re-weld orbital joint using internal argon backing purge.",
    status: "OPEN",
  },
  {
    id: "find-2",
    slNo: 2,
    finding: "Calibration certificate for Caliper vernier (SN: MIT-4401) expiring within 5 calendar days.",
    reference: "IQE Quality Inspection Manual",
    actionRequired: "Supplier must recalibrate at NABL lab prior to final release inspection.",
    status: "RESOLVED",
  },
  {
    id: "find-3",
    slNo: 3,
    finding: "Tag plate embossing font height is 3mm instead of 5mm specified on approved drawing.",
    reference: "Drawing GA-GIL-HE-3101 Rev 02 Note 6",
    actionRequired: "Client concession required or replacement SS316 tag plate to be riveted.",
    status: "UNDER_REVIEW",
  },
];

const INITIAL_ACTIONS: ImmediateAction[] = [
  {
    id: "act-1",
    action: "Submit cut & re-weld NDT Radiography and Borescope videos for Spools SP-BPE-18 to 22.",
    targetDate: "2026-10-02",
    followUpParty: "Supplier QA Lead / IQE",
    status: "IN_PROGRESS",
  },
  {
    id: "act-2",
    action: "Provide updated Mill Test Certificates with Positive Material Identification (PMI) trace for heat #H-8821.",
    targetDate: "2026-09-30",
    followUpParty: "Sub-Supplier Devi Sri / L&T",
    status: "PENDING",
  },
];

export default function FlashInspectionReportPage() {
  const [selectedClient, setSelectedClient] = useState<string>("Granules India Limited - Gagillapur");
  const clientMeta = useMemo(() => CLIENT_DETAILS_MAP[selectedClient] || CLIENT_DETAILS_MAP["Granules India Limited - Gagillapur"], [selectedClient]);

  const [reportNo, setReportNo] = useState<string>("IQE-TP-02-2026-089");
  const [reportDate, setReportDate] = useState<string>("2026-09-29");
  const [nextVisitDate, setNextVisitDate] = useState<string>("2026-10-04");
  const [inspectionStage, setInspectionStage] = useState<"Stage" | "Final" | "Re-inspection">("Stage");
  const [inspectionOutcome, setInspectionOutcome] = useState<"SATISFACTORY" | "SATISFACTORY WITH COMMENTS" | "NON-COMPLIANCE OBSERVED" | "RE-INSPECTION REQUIRED" | "INSPECTION ON HOLD">("SATISFACTORY WITH COMMENTS");
  const [orderStatus, setOrderStatus] = useState<"Complete" | "Incomplete" | "Partially Completed">("Partially Completed");
  const [remarksText, setRemarksText] = useState<string>(
    "Preliminary inspection completed as per approved QAP. Dimensions, visual, and hydrostatic pressure testing for Condenser HE-3101 witnessed satisfactorily with zero pressure drop over 45 minutes. Material Test Certificates cross-verified with heat stamping on shell plates. Borescope orbital weld punch items identified on 4 spools; formal visit report IQE-TP-03 to follow upon supplier rectification."
  );

  const [items, setItems] = useState<FlashInspectionItem[]>(INITIAL_ITEMS);
  const [findings, setFindings] = useState<KeyFinding[]>(INITIAL_FINDINGS);
  const [actions, setActions] = useState<ImmediateAction[]>(INITIAL_ACTIONS);

  const [search, setSearch] = useState<string>("");
  const [isInlineEditMode, setIsInlineEditMode] = useState<boolean>(false);
  const [isInlineEditFindings, setIsInlineEditFindings] = useState<boolean>(false);
  const [isInlineEditActions, setIsInlineEditActions] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FlashInspectionItem | null>(null);
  const [viewingItem, setViewingItem] = useState<FlashInspectionItem | null>(null);
  const [isTabSwitching, setIsTabSwitching] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showMetaEditModal, setShowMetaEditModal] = useState<boolean>(false);
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);

  const handleAddFinding = () => {
    const newF: KeyFinding = {
      id: `find-${Date.now()}`,
      slNo: findings.length + 1,
      finding: "Visual observation satisfactory per standard QAP requirements",
      reference: "QAP Cl. 4.2",
      actionRequired: "Vendor to provide final test certificate",
      status: "OPEN",
    };
    setFindings([...findings, newF]);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleAddAction = () => {
    const newA: ImmediateAction = {
      id: `act-${Date.now()}`,
      action: "Submit calibrated dimensional and NDT witness reports",
      targetDate: new Date().toISOString().split("T")[0],
      followUpParty: "Vendor QA / IQE Inspector",
      status: "PENDING",
    };
    setActions([...actions, newA]);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const triggerSaveToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2800);
  };

  const handleToggleLockItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isLocked: !it.isLocked } : it))
    );
  };

  const handleExportSingleRowCSV = (item: FlashInspectionItem) => {
    const headers = ["Item No", "Description", "Tag / Serial No", "PO Qty", "Offered", "Inspected", "Accepted", "Remarks"];
    const row = [item.itemNo, `"${(item.description || "").replace(/"/g, '""')}"`, `"${item.tagNo || ""}"`, item.poQty, item.offeredQty, item.inspectedQty, item.acceptedQty, `"${(item.remarks || "").replace(/"/g, '""')}"`];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), row.join(",")].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Flash_Item_${item.tagNo || item.itemNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      return (
        item.description.toLowerCase().includes(q) ||
        item.tagNo.toLowerCase().includes(q) ||
        item.remarks.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const kpis = useMemo(() => {
    const totalOffered = items.reduce((acc, i) => acc + i.offeredQty, 0);
    const totalInspected = items.reduce((acc, i) => acc + i.inspectedQty, 0);
    const totalAccepted = items.reduce((acc, i) => acc + i.acceptedQty, 0);
    const openConcernsCount = findings.filter((f) => f.status === "OPEN").length;
    return { totalOffered, totalInspected, totalAccepted, openConcernsCount };
  }, [items, findings]);

  const handleExportCSV = () => {
    const headers = ["Item", "Description", "Tag / Serial No.", "PO Qty", "Offered Qty", "Inspected Qty", "Accepted Qty", "Unit", "Remarks"];
    const rows = items.map((i) => [
      i.itemNo,
      `"${i.description.replace(/"/g, '""')}"`,
      `"${i.tagNo}"`,
      i.poQty,
      i.offeredQty,
      i.inspectedQty,
      i.acceptedQty,
      i.unit,
      `"${i.remarks.replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportNo}_Items.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6 space-y-5">
      {saveToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-xl text-xs font-bold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>Flash Inspection Report Updated &amp; Saved</span>
        </div>
      )}

      {/* Main Clean UI Document Container following Word Document Flow */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
        {/* Header Strip & Document Title (Bill Verification Standard) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#003366] dark:text-sky-300 tracking-tight font-heading flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
              <span>Flash Inspection Report</span>
            </h1>

            {/* Select Client Dropdown right in the top bar */}
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs min-w-0 max-w-full">
              <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <label htmlFor="report-client-select" className="text-slate-600 font-extrabold shrink-0">Select Client:</label>
              <select
                id="report-client-select"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="min-w-0 flex-1 sm:flex-none truncate bg-white text-slate-900 font-extrabold border border-slate-300 rounded-lg text-xs p-1 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {CLIENT_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Metadata Pill */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
              <span className="text-slate-500 text-[11px] font-bold">Ref:</span>
              <span className="text-slate-800 font-extrabold font-mono">{reportNo}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 text-[11px] font-bold">Date:</span>
              <span className="text-slate-800 font-bold">{reportDate}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 text-[11px] font-bold">Stage:</span>
              <span className="text-slate-800 font-bold uppercase">{inspectionStage}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowMetaEditModal(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={() => setShowPdfPreview(true)}
              className="px-3 py-1.5 bg-[#0084bf] hover:bg-[#0073a8] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Live PDF</span>
            </button>

            <button
              onClick={async () => {
                await downloadPdfFile(
                  `${API_BASE}/api/tpi/preview/TP02.pdf`,
                  `Flash_Report_${reportNo}.pdf`,
                  "/sample-pdfs/TP02.pdf"
                );
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Download PDF Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button aria-label="Save Flash Report"
              onClick={triggerSaveToast}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition-all shadow-sm cursor-pointer"
              title="Save Flash Report"
            >
              <Save className="w-4 h-4 text-sky-400" />
            </button>

            <button aria-label="Export CSV"
              onClick={handleExportCSV}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all shadow-2xs cursor-pointer"
              title="Export CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            </button>

            <button aria-label="Print / PDF"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all shadow-sm cursor-pointer"
              title="Print / PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section Jump Links for Document Flow Navigation (Sticky so inspector can use anytime while scrolling) */}
        <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          {isTabSwitching && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center gap-2 z-10 text-xs font-bold text-[#0084bf]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Navigating to section...</span>
            </div>
          )}
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Jump to:</span>
          {[
            { id: "sec-1", label: "1.0 Info" },
            { id: "sec-2", label: "2.0 Visit Type" },
            { id: "sec-3", label: "3.0 Inspected Items" },
            { id: "sec-4", label: "4.0 Outcome" },
            { id: "sec-5", label: "5.0 Key Findings" },
            { id: "sec-6", label: "6.0 Follow-Up" },
            { id: "sec-7", label: "7.0 Remarks" },
            { id: "sec-8", label: "8.0 Photos" },
            { id: "sec-9", label: "9.0 Sign-Off" },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => {
                setIsTabSwitching(true);
                const el = document.getElementById(sec.id);
                if (el) el.scrollIntoView({ behavior: "smooth" });
                setTimeout(() => setIsTabSwitching(false), 250);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-[#003366] hover:text-white rounded-md text-slate-700 font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Controlled Document Running Header */}
        <div className="keep-light border border-slate-200 rounded-xl p-4 bg-slate-50 text-slate-900 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-200 pb-3 gap-2">
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 uppercase tracking-tight">
                IDEAL QUALITY ENGINEERS (I) PVT. LTD.
              </h2>
              <p className="text-xs text-slate-500 font-semibold">Third Party Inspection Services</p>
            </div>
            <div className="text-right font-mono text-xs space-y-0.5 sm:self-auto">
              <div className="font-extrabold text-slate-800">FORM NO.: IQE-TP-02</div>
              <div className="text-slate-500 text-[11px]">REVISION: 00</div>
              <div className="font-bold text-[#003366]">FLASH REPORT NO.: {reportNo}</div>
            </div>
          </div>

          <div className="text-center py-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-[#003366] uppercase tracking-tight">
              FLASH INSPECTION REPORT
            </h3>
            <p className="text-xs italic text-slate-500">Preliminary communication of inspection outcome and key observations</p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1.0 INSPECTION INFORMATION (As is from IQE-TP-02)                 */}
        {/* ========================================================================= */}
        <div id="sec-1" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
            <span className="uppercase tracking-wider">1.0 INSPECTION INFORMATION</span>
            <span className="font-mono text-[11px] text-sky-200">IQE-TP-02 Clause 1.0</span>
          </div>

          <div className="overflow-x-auto bg-white">
            <table className="w-full text-xs border-collapse">
              <colgroup>
                <col className="w-1/4 bg-slate-50 border-r border-slate-200 font-medium text-slate-600" />
                <col className="w-1/4 border-r border-slate-200 font-bold text-slate-900" />
                <col className="w-1/4 bg-slate-50 border-r border-slate-200 font-medium text-slate-600" />
                <col className="w-1/4 font-bold text-slate-900" />
              </colgroup>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5">Flash Report No.</td>
                  <td className="p-2.5 font-mono">{reportNo}</td>
                  <td className="p-2.5">Date of Inspection</td>
                  <td className="p-2.5 font-mono">{reportDate}</td>
                </tr>
                <tr>
                  <td className="p-2.5">Customer</td>
                  <td className="p-2.5">{clientMeta.customer}</td>
                  <td className="p-2.5">Project Name</td>
                  <td className="p-2.5">{clientMeta.projectName}</td>
                </tr>
                <tr>
                  <td className="p-2.5">Supplier</td>
                  <td className="p-2.5">{clientMeta.supplier}</td>
                  <td className="p-2.5">Sub-Supplier / Manufacturer</td>
                  <td className="p-2.5">{clientMeta.subSupplier}</td>
                </tr>
                <tr>
                  <td className="p-2.5">Supplier PO No. &amp; Date</td>
                  <td className="p-2.5 font-mono">{clientMeta.poNumber} &bull; {clientMeta.poDate}</td>
                  <td className="p-2.5">Inspection Location</td>
                  <td className="p-2.5">{clientMeta.projectLocation}</td>
                </tr>
                <tr>
                  <td className="p-2.5">RFI Reference &amp; Date</td>
                  <td className="p-2.5 font-mono">{clientMeta.rfiRef} &bull; {clientMeta.rfiDate}</td>
                  <td className="p-2.5">Next Planned Visit</td>
                  <td className="p-2.5 font-mono text-brand-700">{nextVisitDate}</td>
                </tr>
                <tr>
                  <td className="p-2.5">IQE Inspector</td>
                  <td className="p-2.5 font-bold text-[#003366] dark:text-sky-300">{clientMeta.inspector}</td>
                  <td className="p-2.5">Inspection Stage</td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-3">
                      {(["Stage", "Final", "Re-inspection"] as const).map((st) => (
                        <label key={st} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="flashInspectionStage"
                            checked={inspectionStage === st}
                            onChange={() => setInspectionStage(st)}
                            className="text-[#003366] focus:ring-0"
                          />
                          <span className="font-semibold text-xs">{st}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2.0 TYPE OF VISIT / INSPECTION ACTIVITY (Word Document Table 2)   */}
        {/* ========================================================================= */}
        <div id="sec-2" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
            <span className="uppercase tracking-wider">2.0 TYPE OF VISIT / INSPECTION ACTIVITY</span>
            <span className="font-mono text-[11px] text-sky-200">IQE-TP-02 Clause 2.0</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white text-xs p-4 gap-4 md:gap-0">
            {/* Column 1: Meeting / Review */}
            <div className="space-y-2.5 md:pr-4">
              <span className="font-extrabold text-[#003366] dark:text-sky-300 uppercase block text-[11px]">
                Meeting / Review
              </span>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="checkbox" defaultChecked className="rounded text-[#003366]" />
                <span>Pre-Inspection Meeting</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="checkbox" defaultChecked className="rounded text-[#003366]" />
                <span>Review Certificates / Documents</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="checkbox" defaultChecked className="rounded text-[#003366]" />
                <span>WPS / PQR / Welder Quals</span>
              </label>
            </div>

            {/* Column 2: Inspection / Testing */}
            <div className="space-y-2.5 md:px-4">
              <span className="font-extrabold text-[#003366] dark:text-sky-300 uppercase block text-[11px]">
                Inspection / Testing
              </span>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="checkbox" defaultChecked className="rounded text-[#003366]" />
                <span>Dimension &amp; Workmanship</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="checkbox" defaultChecked className="rounded text-[#003366]" />
                <span>Mechanical Tests</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="checkbox" defaultChecked className="rounded text-[#003366]" />
                <span>Pressure Tests</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="checkbox" defaultChecked className="rounded text-[#003366]" />
                <span>NDT (UT/RT/DPT)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="checkbox" className="rounded text-[#003366]" />
                <span>Performance Tests</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="checkbox" defaultChecked className="rounded text-[#003366]" />
                <span>Intermediate Inspection</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="checkbox" className="rounded text-[#003366]" />
                <span>Final Inspection</span>
              </label>
            </div>

            {/* Column 3: Surface / Preservation */}
            <div className="space-y-2.5 md:pl-4">
              <span className="font-extrabold text-[#003366] dark:text-sky-300 uppercase block text-[11px]">
                Surface / Preservation
              </span>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="checkbox" defaultChecked className="rounded text-[#003366]" />
                <span>Coating &amp; Painting</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="checkbox" className="rounded text-[#003366]" />
                <span>Packing &amp; Marking</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="checkbox" className="rounded text-[#003366]" />
                <span>Loading / Dispatch</span>
              </label>
              <div className="pt-2">
                <label className="block text-[11px] text-slate-500 font-bold mb-1">Other Scope:</label>
                <input aria-label="Other Scope"
                  type="text"
                  placeholder="Specify other activity if any..."
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3.0 MATERIAL / EQUIPMENT INSPECTED (Word Document Table 3)        */}
        {/* ========================================================================= */}
        <div id="sec-3" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider">3.0 MATERIAL / EQUIPMENT INSPECTED</span>
              <span className="px-2 py-0.2 rounded-full bg-white/20 text-white font-mono text-[11px]">
                {filteredItems.length} line items
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsInlineEditMode(!isInlineEditMode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isInlineEditMode ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>{isInlineEditMode ? "Exit Inline Edit" : "Inline Edit"}</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center">Item</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Description</th>
                  <th className="py-2.5 px-3 w-32 font-mono">Tag / Serial No.</th>
                  <th className="py-2.5 px-3 w-20 text-right">PO Qty</th>
                  <th className="py-2.5 px-3 w-20 text-right">Offered</th>
                  <th className="py-2.5 px-3 w-20 text-right">Inspected</th>
                  <th className="py-2.5 px-3 w-20 text-right">Accepted</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Remarks</th>
                  <th className="py-2.5 px-3 min-w-[210px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">
                      {isInlineEditMode ? (
                        <input aria-label="Item No."
                          type="number"
                          value={item.itemNo}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setItems(items.map((i) => (i.id === item.id ? { ...i, itemNo: val } : i)));
                          }}
                          className="w-12 p-1 text-center font-mono bg-amber-50 border border-amber-300 rounded text-xs font-bold"
                        />
                      ) : (
                        item.itemNo
                      )}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900">
                      {isInlineEditMode ? (
                        <input aria-label="Description"
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            setItems(items.map((i) => (i.id === item.id ? { ...i, description: e.target.value } : i)));
                          }}
                          className="w-full min-w-[200px] p-1 bg-amber-50 border border-amber-300 rounded text-xs font-medium"
                        />
                      ) : (
                        item.description
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-[#003366] dark:text-sky-300">
                      {isInlineEditMode ? (
                        <input aria-label="Tag No."
                          type="text"
                          value={item.tagNo}
                          onChange={(e) => {
                            setItems(items.map((i) => (i.id === item.id ? { ...i, tagNo: e.target.value } : i)));
                          }}
                          className="w-28 p-1 font-mono font-bold text-[#003366] dark:text-sky-300 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        item.tagNo
                      )}
                    </td>

                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      {isInlineEditMode ? (
                        <input aria-label="PO Qty"
                          type="number"
                          value={item.poQty}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setItems(items.map((i) => (i.id === item.id ? { ...i, poQty: val } : i)));
                          }}
                          className="w-16 p-1 text-right font-mono bg-amber-50 border border-amber-300 rounded font-bold"
                        />
                      ) : (
                        item.poQty
                      )}
                    </td>

                    <td className="py-2 px-3 text-right font-mono text-slate-800 font-bold">
                      {isInlineEditMode ? (
                        <input aria-label="Offered Qty"
                          type="number"
                          value={item.offeredQty}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setItems(items.map((i) => (i.id === item.id ? { ...i, offeredQty: val } : i)));
                          }}
                          className="w-16 p-1 text-right font-mono bg-amber-50 border border-amber-300 rounded font-bold"
                        />
                      ) : (
                        item.offeredQty
                      )}
                    </td>

                    <td className="py-2 px-3 text-right font-mono text-blue-700 font-bold">
                      {isInlineEditMode ? (
                        <input aria-label="Inspected Qty"
                          type="number"
                          value={item.inspectedQty}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setItems(items.map((i) => (i.id === item.id ? { ...i, inspectedQty: val } : i)));
                          }}
                          className="w-16 p-1 text-right font-mono bg-amber-50 border border-amber-300 rounded font-bold"
                        />
                      ) : (
                        item.inspectedQty
                      )}
                    </td>

                    <td className="py-2 px-3 text-right font-mono text-emerald-700 font-extrabold">
                      {isInlineEditMode ? (
                        <input aria-label="Accepted Qty"
                          type="number"
                          value={item.acceptedQty}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setItems(items.map((i) => (i.id === item.id ? { ...i, acceptedQty: val } : i)));
                          }}
                          className="w-16 p-1 text-right font-mono bg-amber-50 border border-amber-300 rounded font-bold"
                        />
                      ) : (
                        item.acceptedQty
                      )}
                    </td>

                    <td className="py-2 px-3 text-slate-600 text-[11px]">
                      {isInlineEditMode ? (
                        <input aria-label="Remarks"
                          type="text"
                          value={item.remarks}
                          onChange={(e) => {
                            setItems(items.map((i) => (i.id === item.id ? { ...i, remarks: e.target.value } : i)));
                          }}
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        item.remarks
                      )}
                    </td>

                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* 1. Lock/Unlock */}
                        <button aria-label={item.isLocked ? "Locked — Click to Unlock Row" : "Unlocked — Click to Lock Row"}
                          onClick={() => handleToggleLockItem(item.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.isLocked
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                          }`}
                          title={item.isLocked ? "Locked — Click to Unlock Row" : "Unlocked — Click to Lock Row"}
                        >
                          {item.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-700" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />}
                        </button>

                        {/* 2. View Details Modal */}
                        <button aria-label="View Row Details"
                          onClick={() => setViewingItem(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-100 text-slate-700 hover:text-brand-700 transition-colors cursor-pointer"
                          title="View Row Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* 3. Edit Row */}
                        <button aria-label={item.isLocked ? "Item Locked" : "Edit Row Values"}
                          onClick={() => !item.isLocked && setEditingItem(item)}
                          disabled={item.isLocked}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.isLocked
                              ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                              : "bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 cursor-pointer"
                          }`}
                          title={item.isLocked ? "Item Locked" : "Edit Row Values"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* 4. Single CSV */}
                        <button aria-label="Download Single Row CSV"
                          onClick={() => handleExportSingleRowCSV(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="Download Single Row CSV"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* 5. Live Preview Single Item PDF */}
                        <button aria-label="Live Preview Single Item PDF Certificate"
                          onClick={() => setShowPdfPreview(true)}
                          className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0084bf] transition-colors cursor-pointer border border-sky-200/60"
                          title="Live Preview Single Item PDF Certificate"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* 6. Download Single Item PDF */}
                        <button aria-label="Download Single PDF Report"
                          onClick={() => downloadPdfFile(`${API_BASE}/api/tpi/preview/TP02.pdf`, `Flash_Report_Item_${item.itemNo}.pdf`, "/sample-pdfs/TP02.pdf")}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer border border-rose-200/60"
                          title="Download Single PDF Report"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* 7. Delete */}
                        <button aria-label="Delete Item"
                          onClick={async () => {
                            if (item.isLocked) return;
                            if (
                              !(await confirmDialog({
                                title: `Remove item ${item.tagNo}?`,
                                message: "This item will be removed from the report.",
                                confirmLabel: "Remove",
                                danger: true,
                              }))
                            )
                              return;
                            setItems((prev) => prev.filter((i) => i.id !== item.id));
                          }}
                          disabled={item.isLocked}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.isLocked
                              ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                              : "bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 cursor-pointer"
                          }`}
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4.0 INSPECTION OUTCOME (Word Document Table 4)                    */}
        {/* ========================================================================= */}
        <div id="sec-4" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
            <span className="uppercase tracking-wider">4.0 INSPECTION OUTCOME</span>
            <span className="font-mono text-[11px] text-sky-200">IQE-TP-02 Clause 4.0</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white text-xs p-4 gap-4 md:gap-0">
            {/* Outcome Selection */}
            <div className="space-y-3 md:pr-4">
              <span className="font-extrabold text-[#003366] dark:text-sky-300 uppercase block text-[11px]">
                INSPECTION OUTCOME (SELECT AS APPLICABLE)
              </span>
              {(
                [
                  "SATISFACTORY",
                  "SATISFACTORY WITH COMMENTS",
                  "NON-COMPLIANCE OBSERVED",
                  "RE-INSPECTION REQUIRED",
                  "INSPECTION ON HOLD",
                ] as const
              ).map((out) => (
                <label
                  key={out}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer font-bold transition-all ${
                    inspectionOutcome === out
                      ? "bg-sky-50 border-[#003366] text-[#003366] dark:text-sky-300"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="inspectionOutcome"
                    checked={inspectionOutcome === out}
                    onChange={() => setInspectionOutcome(out)}
                    className="text-[#003366]"
                  />
                  <span>{out}</span>
                </label>
              ))}
            </div>

            {/* Order Status */}
            <div className="space-y-3 md:pl-4">
              <span className="font-extrabold text-[#003366] dark:text-sky-300 uppercase block text-[11px]">
                ORDER STATUS
              </span>
              {(["Complete", "Incomplete", "Partially Completed"] as const).map((ord) => (
                <label
                  key={ord}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer font-bold transition-all ${
                    orderStatus === ord
                      ? "bg-sky-50 border-[#003366] text-[#003366] dark:text-sky-300"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="orderStatus"
                    checked={orderStatus === ord}
                    onChange={() => setOrderStatus(ord)}
                    className="text-[#003366]"
                  />
                  <span>{ord}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5.0 KEY FINDINGS / AREAS OF CONCERN (Word Document Table 5)       */}
        {/* ========================================================================= */}
        <div id="sec-5" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider">5.0 KEY FINDINGS / AREAS OF CONCERN</span>
              <span className="px-2 py-0.2 rounded-full bg-white/20 text-white font-mono text-[11px]">
                {findings.length} findings
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsInlineEditFindings(!isInlineEditFindings)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isInlineEditFindings ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>{isInlineEditFindings ? "Exit Inline Edit" : "Inline Edit"}</span>
              </button>

              <button
                onClick={handleAddFinding}
                className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Finding</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3 w-14 text-center">Sl. No.</th>
                  <th className="py-2.5 px-3 min-w-[260px]">Key Finding / Observation</th>
                  <th className="py-2.5 px-3 w-48">Reference</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Action / Next Step</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {findings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">{f.slNo}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {isInlineEditFindings ? (
                        <input aria-label="Finding"
                          type="text"
                          value={f.finding}
                          onChange={(e) =>
                            setFindings(findings.map((x) => (x.id === f.id ? { ...x, finding: e.target.value } : x)))
                          }
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        f.finding
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {isInlineEditFindings ? (
                        <input aria-label="Reference"
                          type="text"
                          value={f.reference}
                          onChange={(e) =>
                            setFindings(findings.map((x) => (x.id === f.id ? { ...x, reference: e.target.value } : x)))
                          }
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        f.reference
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {isInlineEditFindings ? (
                        <input aria-label="Action required"
                          type="text"
                          value={f.actionRequired}
                          onChange={(e) =>
                            setFindings(findings.map((x) => (x.id === f.id ? { ...x, actionRequired: e.target.value } : x)))
                          }
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        f.actionRequired
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isInlineEditFindings ? (
                        <select aria-label="Status"
                          value={f.status}
                          onChange={(e) =>
                            setFindings(findings.map((x) => (x.id === f.id ? { ...x, status: e.target.value as any } : x)))
                          }
                          className="p-1 font-bold text-[11px] bg-white border border-slate-300 rounded"
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            f.status === "OPEN"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : f.status === "RESOLVED"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {f.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 6.0 IMMEDIATE ACTION / FOLLOW-UP (Word Document Table 6)          */}
        {/* ========================================================================= */}
        <div id="sec-6" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider">6.0 IMMEDIATE ACTION / FOLLOW-UP</span>
              <span className="px-2 py-0.2 rounded-full bg-white/20 text-white font-mono text-[11px]">
                {actions.length} actions
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsInlineEditActions(!isInlineEditActions)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isInlineEditActions ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>{isInlineEditActions ? "Exit Inline Edit" : "Inline Edit"}</span>
              </button>

              <button
                onClick={handleAddAction}
                className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Action</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3 min-w-[280px]">Action Required from Supplier</th>
                  <th className="py-2.5 px-3 w-32 font-mono">Target Date</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Client / IQE Follow-up</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {actions.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {isInlineEditActions ? (
                        <input aria-label="Action"
                          type="text"
                          value={act.action}
                          onChange={(e) =>
                            setActions(actions.map((x) => (x.id === act.id ? { ...x, action: e.target.value } : x)))
                          }
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        act.action
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-700">
                      {isInlineEditActions ? (
                        <input aria-label="Target date"
                          type="date"
                          value={act.targetDate}
                          onChange={(e) =>
                            setActions(actions.map((x) => (x.id === act.id ? { ...x, targetDate: e.target.value } : x)))
                          }
                          className="p-1 font-mono text-xs bg-amber-50 border border-amber-300 rounded"
                        />
                      ) : (
                        act.targetDate
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {isInlineEditActions ? (
                        <input aria-label="Follow up party"
                          type="text"
                          value={act.followUpParty}
                          onChange={(e) =>
                            setActions(actions.map((x) => (x.id === act.id ? { ...x, followUpParty: e.target.value } : x)))
                          }
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        act.followUpParty
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isInlineEditActions ? (
                        <select aria-label="Status"
                          value={act.status}
                          onChange={(e) =>
                            setActions(actions.map((x) => (x.id === act.id ? { ...x, status: e.target.value as any } : x)))
                          }
                          className="p-1 font-bold text-[11px] bg-white border border-slate-300 rounded"
                        >
                          <option value="Open">Open</option>
                          <option value="Closed">Closed</option>
                        </select>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {act.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 7.0 REMARKS (Word Document Section 7.0)                           */}
        {/* ========================================================================= */}
        <div id="sec-7" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
            <span className="uppercase tracking-wider">7.0 REMARKS</span>
            <span className="font-mono text-[11px] text-sky-200">IQE-TP-02 Clause 7.0</span>
          </div>

          <div className="p-4 bg-white space-y-2">
            <textarea aria-label="Remarks"
              rows={3}
              value={remarksText}
              onChange={(e) => setRemarksText(e.target.value)}
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003366] text-slate-800 leading-relaxed font-sans"
              placeholder="Enter official inspection remarks..."
            />
            <p className="text-[11px] text-slate-400 italic">
              Note: This Flash Report is issued as a preliminary communication of the inspection outcome and key observations. Detailed inspection findings, document review and supporting evidence, where applicable, shall be recorded in the formal Inspection Visit Report (IQE-TP-03).
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 8.0 PHOTOGRAPHIC EVIDENCE (Word Document Section 8.0)             */}
        {/* ========================================================================= */}
        <div id="sec-8" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
            <span className="uppercase tracking-wider">8.0 PHOTOGRAPHIC EVIDENCE</span>
            <span className="font-mono text-[11px] text-sky-200">IQE-TP-02 Clause 8.0</span>
          </div>

          <div className="p-4 bg-white space-y-3 text-xs">
            <p className="text-[11px] text-slate-500">
              Photographs are taken with prior permission from the supplier/vendor. Photographs shall be included as applicable.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { title: "Photo 1", desc: "Hydrostatic Test Pressure Gauge & Shell Setup", tag: "HE-3101 @ 9.0 Bar" },
                { title: "Photo 2", desc: "Nameplate & Heat Stamping Verification", tag: "Heat #H-8821 Verified" },
                { title: "Photo 3", desc: "Orbital Borescope Video Inspection", tag: "Weld W-14 Joint" },
                { title: "Photo 4", desc: "Sanitary Diaphragm Valve Nitrogen Seat Test", tag: "CV-201 Class VI Leak" },
              ].map((ph, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 flex flex-col justify-between">
                  <div className="h-28 rounded-lg bg-slate-200 border border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-1">
                    <Camera className="w-6 h-6 text-slate-400" />
                    <span className="text-[11px] font-mono">[Photo {idx + 1} Attached]</span>
                  </div>
                  <div>
                    <span className="font-mono text-[11px] font-extrabold text-[#003366] dark:text-sky-300 block">{ph.title}</span>
                    <p className="font-bold text-slate-800 text-[11px] mt-0.5">{ph.desc}</p>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{ph.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 9.0 ACKNOWLEDGEMENT & SIGNATURES (Word Document Section 9.0)      */}
        {/* ========================================================================= */}
        <div id="sec-9" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
            <span className="uppercase tracking-wider">9.0 ACKNOWLEDGEMENT &amp; SIGNATURES</span>
            <span className="font-mono text-[11px] text-sky-200">IQE-TP-02 Clause 9.0</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white p-5 gap-5 md:gap-0 text-xs">
            {/* Supplier / Manufacturer */}
            <div className="space-y-3 md:pr-5">
              <span className="font-extrabold text-[#003366] dark:text-sky-300 uppercase block text-xs">
                For Supplier / Manufacturer
              </span>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium block">Name &amp; Designation:</span>
                <p className="font-bold text-slate-900 text-sm">Rajesh V. Sharma &bull; QA/QC Manager</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium block">Company Stamp:</span>
                <p className="font-bold text-slate-800">{clientMeta.supplier}</p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-emerald-700 font-bold font-mono">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Acknowledged &amp; Signed at Site</span>
              </div>
            </div>

            {/* Ideal Quality Engineers */}
            <div className="space-y-3 md:pl-5">
              <span className="font-extrabold text-[#003366] dark:text-sky-300 uppercase block text-xs">
                For Ideal Quality Engineers (I) Pvt. Ltd.
              </span>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium block">IQE Lead Inspector:</span>
                <p className="font-bold text-slate-900 text-sm">{clientMeta.inspector}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium block">IQE Stamp &amp; Certification:</span>
                <p className="font-bold text-slate-800">TPI Inspection Body Stamp</p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-blue-700 font-bold font-mono">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Digitally Certified via IQE Engine &bull; {reportDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* DISCLAIMER & FORMAL DOCUMENT FOOTER */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
          <strong className="text-slate-700 uppercase">DISCLAIMER:</strong> This Flash Report records the observations and information made available to IQE during the inspection at the time and location stated herein. It does not relieve the supplier/manufacturer of its contractual, statutory or regulatory responsibilities or obligations under the Purchase Order and other approved documents.
          <div className="text-center font-mono font-bold text-slate-400 mt-2 tracking-widest text-[11px]">
            — END OF FLASH REPORT —
          </div>
        </div>

      </div>

      {/* EDIT ROW MODAL */}
      {/* VIEW ITEM DETAILS MODAL */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#0084bf]" />
                <h3 className="text-base font-extrabold text-slate-900 font-heading">
                  Inspection Item Dossier &bull; {viewingItem.tagNo}
                </h3>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setViewingItem(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-500 uppercase font-bold">Work Description</span>
                <p className="font-semibold text-slate-900">{viewingItem.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block">Tag / Serial No</span>
                  <span className="font-mono font-bold text-[#003366] dark:text-sky-300">{viewingItem.tagNo}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block">Item No &amp; UOM</span>
                  <span className="font-mono font-bold text-slate-800">#{viewingItem.itemNo} ({viewingItem.unit})</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <span className="text-[11px] text-blue-700 uppercase font-bold block">PO Qty</span>
                  <span className="font-mono font-extrabold text-blue-900 text-sm">{viewingItem.poQty}</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[11px] text-amber-700 uppercase font-bold block">Offered</span>
                  <span className="font-mono font-extrabold text-amber-900 text-sm">{viewingItem.offeredQty}</span>
                </div>
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-center">
                  <span className="text-[11px] text-purple-700 uppercase font-bold block">Inspected</span>
                  <span className="font-mono font-extrabold text-purple-900 text-sm">{viewingItem.inspectedQty}</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[11px] text-emerald-700 uppercase font-bold block">Accepted</span>
                  <span className="font-mono font-extrabold text-emerald-900 text-sm">{viewingItem.acceptedQty}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-500 uppercase font-bold">Engineering Remarks</span>
                <p className="text-slate-700">{viewingItem.remarks || "No defects noted. Conforms to approved drawing & spec."}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                Edit Item &bull; {editingItem.tagNo}
              </h3>
              <button aria-label="Close" title="Close" onClick={() => setEditingItem(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setItems(items.map((i) => (i.id === editingItem.id ? editingItem : i)));
                setEditingItem(null);
                triggerSaveToast();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-slate-700 font-bold mb-1">Item Description</label>
                <textarea aria-label="Item Description"
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tag / Serial No.</label>
                  <input aria-label="Tag / Serial No."
                    type="text"
                    value={editingItem.tagNo}
                    onChange={(e) => setEditingItem({ ...editingItem, tagNo: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">UOM</label>
                  <input aria-label="UOM"
                    type="text"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">PO Qty</label>
                  <input aria-label="PO Qty"
                    type="number"
                    value={editingItem.poQty}
                    onChange={(e) => setEditingItem({ ...editingItem, poQty: parseFloat(e.target.value) || 0 })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Offered</label>
                  <input aria-label="Offered"
                    type="number"
                    value={editingItem.offeredQty}
                    onChange={(e) => setEditingItem({ ...editingItem, offeredQty: parseFloat(e.target.value) || 0 })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Inspected</label>
                  <input aria-label="Inspected"
                    type="number"
                    value={editingItem.inspectedQty}
                    onChange={(e) => setEditingItem({ ...editingItem, inspectedQty: parseFloat(e.target.value) || 0 })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Accepted</label>
                  <input aria-label="Accepted"
                    type="number"
                    value={editingItem.acceptedQty}
                    onChange={(e) => setEditingItem({ ...editingItem, acceptedQty: parseFloat(e.target.value) || 0 })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Inspection Remarks</label>
                <textarea aria-label="Inspection Remarks"
                  rows={2}
                  value={editingItem.remarks}
                  onChange={(e) => setEditingItem({ ...editingItem, remarks: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#003366] text-white rounded-xl font-bold hover:bg-sky-900"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                Add Material / Equipment for Inspection
              </h3>
              <button aria-label="Close" title="Close" onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const newItem: FlashInspectionItem = {
                  id: `item-${Date.now()}`,
                  itemNo: items.length + 1,
                  description: form.desc.value,
                  tagNo: form.tag.value,
                  poQty: parseFloat(form.poQty.value) || 0,
                  offeredQty: parseFloat(form.offeredQty.value) || 0,
                  inspectedQty: parseFloat(form.inspectedQty.value) || 0,
                  acceptedQty: parseFloat(form.acceptedQty.value) || 0,
                  unit: form.unit.value || "Nos",
                  remarks: form.remarks.value,
                  isLocked: false,
                };
                setItems([...items, newItem]);
                setShowAddModal(false);
                triggerSaveToast();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-slate-700 font-bold mb-1">Item Description</label>
                <input aria-label="Item Description"
                  name="desc"
                  required
                  placeholder="e.g. Sanitary Pressure Relief Valve"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tag / Serial No.</label>
                  <input aria-label="Tag / Serial No."
                    name="tag"
                    required
                    placeholder="PRV-401"
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">UOM</label>
                  <input aria-label="UOM"
                    name="unit"
                    defaultValue="Nos"
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">PO Qty</label>
                  <input aria-label="PO Qty"
                    name="poQty"
                    type="number"
                    defaultValue="1"
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Offered</label>
                  <input aria-label="Offered"
                    name="offeredQty"
                    type="number"
                    defaultValue="1"
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Inspected</label>
                  <input aria-label="Inspected"
                    name="inspectedQty"
                    type="number"
                    defaultValue="1"
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Accepted</label>
                  <input aria-label="Accepted"
                    name="acceptedQty"
                    type="number"
                    defaultValue="1"
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Remarks</label>
                <textarea aria-label="Remarks"
                  name="remarks"
                  rows={2}
                  placeholder="Set pressure tested at 6 bar..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#003366] text-white rounded-xl font-bold hover:bg-sky-900"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT METADATA MODAL */}
      {showMetaEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                Edit 1.0 Inspection Information
              </h3>
              <button aria-label="Close" title="Close" onClick={() => setShowMetaEditModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowMetaEditModal(false);
                triggerSaveToast();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Report No.</label>
                  <input aria-label="Report No."
                    type="text"
                    value={reportNo}
                    onChange={(e) => setReportNo(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Report Date</label>
                  <input aria-label="Report Date"
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Next Visit Date</label>
                  <input aria-label="Next Visit Date"
                    type="date"
                    value={nextVisitDate}
                    onChange={(e) => setNextVisitDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Inspection Stage</label>
                  <select aria-label="Inspection Stage"
                    value={inspectionStage}
                    onChange={(e) => setInspectionStage(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Stage">Stage</option>
                    <option value="Final">Final</option>
                    <option value="Re-inspection">Re-inspection</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowMetaEditModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#003366] text-white rounded-xl font-bold hover:bg-sky-900"
                >
                  Save Information
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Pixel-Matched PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        formCode="TP02"
        payload={{
          report_no: reportNo,
          date: reportDate,
          customer: clientMeta.customer,
          project: clientMeta.projectName,
          supplier: clientMeta.supplier,
          sub_supplier: clientMeta.subSupplier,
          po_no_and_date: `${clientMeta.poNumber} & ${clientMeta.poDate}`.trim(),
          location: clientMeta.projectLocation,
          rfi_ref_and_date: `${clientMeta.rfiRef} & ${clientMeta.rfiDate}`.trim(),
          next_visit: nextVisitDate,
          inspector: clientMeta.inspector,
          inspection_stage: inspectionStage,
          visit_activities: ["dimension", "pressure", "review_certs"],
          items: items.map((i) => ({
            item: i.itemNo,
            description: i.description,
            tag_no: i.tagNo,
            po_qty: i.poQty,
            offered_qty: i.offeredQty,
            inspected_qty: i.inspectedQty,
            accepted_qty: i.acceptedQty,
            remarks: i.remarks,
          })),
          outcome: inspectionOutcome,
          order_status: orderStatus,
          findings: findings.map((f) => ({
            sl_no: f.slNo,
            finding: f.finding,
            reference: f.reference,
            action: f.actionRequired,
          })),
          actions: actions.map((a) => ({
            action: a.action,
            target_date: a.targetDate,
            follow_up: a.followUpParty,
          })),
          remarks: remarksText,
        }}
        pdfUrl={`${API_BASE}/api/tpi/preview/TP02.pdf`}
        title="IQE-TP-02 Flash Inspection Report"
        reportNo={reportNo}
      />
    </div>
  );
}
