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
  PackageCheck,
  Truck,
  Send,
  Boxes,
  Loader2,
} from "@/components/icons";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";
import { confirmDialog } from "@/components/feedback";

export interface ReleaseItem {
  id: string;
  poItemNo: number;
  description: string;
  drawingRef: string;
  tagNo: string;
  poQty: number;
  prevReleasedQty: number;
  inspectedQty: number;
  acceptedQty: number;
  currentReleasedQty: number;
  unit: string;
  remarks: string;
  isLocked?: boolean;
}

export interface InspectionReportRef {
  id: string;
  slNo: number;
  reportNo: string;
  date: string;
  stage: string;
  remarks: string;
}

export interface DeviationRef {
  id: string;
  slNo: number;
  concessionNo: string;
  date: string;
  status: "NIL" | "Approved by Client" | "Waived with Conditions" | "Under Review";
  remarks: string;
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
  contractRef: string;
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
    contractRef: "GIL/GAG/2025/TPI-1710",
    poNumber: "WO-3400077675/18.08.25",
    poDate: "2025-10-17",
    rfiRef: "RFI-GIL-2026-095",
    rfiDate: "2026-09-28",
    inspector: "Alok Gupta (Senior TPI Lead Auditor)",
  },
  "Atom Project (New Atom Project)": {
    projectName: "New Atom Process Heavy Fabrication Pkg 01",
    projectLocation: "Atom Site Industrial Zone, India",
    customer: "Atom Process Energy Asset Owner",
    supplier: "Larsen & Toubro Ltd - Infra Div",
    contractRef: "ATOM/PKG01/2026/TPI-9901",
    poNumber: "PO-ATOM-2026-88120",
    poDate: "2026-05-14",
    rfiRef: "RFI-ATOM-PKG01-108",
    rfiDate: "2026-09-27",
    inspector: "Rajesh V. Sharma (TPI Inspector)",
  },
  "Suven Pharmaceuticals Ltd (Chonce Life Science)": {
    projectName: "Suven Cleanroom Tank Civil & Structural Works",
    projectLocation: "Chonce Life Science Plant, Suryapet, TS",
    customer: "Suven Pharmaceuticals Ltd",
    supplier: "SVS CONSTRUCTIONS",
    contractRef: "SUVEN/CIVIL/2025/TPI-4443",
    poNumber: "PO-SUVEN-50054",
    poDate: "2025-12-13",
    rfiRef: "RFI-SUV-CIV-050",
    rfiDate: "2026-09-25",
    inspector: "K. Mohan Rao (Senior Quality Inspector)",
  },
  "MCGM (Greater Mumbai Corp)": {
    projectName: "Mumbai Coastal Road Pkg 03 - Retaining Wall",
    projectLocation: "Worli-Nariman Corridor, Mumbai, MH",
    customer: "Municipal Corporation of Greater Mumbai",
    supplier: "Larsen & Toubro Ltd - Infra Div",
    contractRef: "MCGM/CWD/2024/TPI-8892",
    poNumber: "PO-MCGM-2024-99812",
    poDate: "2024-04-15",
    rfiRef: "RFI-MCGM-CWD-325",
    rfiDate: "2026-09-26",
    inspector: "Sunil Patil (Lead Quality Assessor)",
  },
  "S2 / Standard Client": {
    projectName: "Standard Industrial Facility Phase 2",
    projectLocation: "Industrial Zone Phase 2, India",
    customer: "S2 Standard Asset Owner",
    supplier: "Tata Projects Infrastructure",
    contractRef: "S2/STD/2024/TPI-1010",
    poNumber: "PO-S2-2024-10100",
    poDate: "2024-05-15",
    rfiRef: "RFI-S2-STD-065",
    rfiDate: "2026-09-28",
    inspector: "Alok Gupta (Senior TPI Lead Auditor)",
  },
};

const INITIAL_ITEMS: ReleaseItem[] = [
  {
    id: "irn-001",
    poItemNo: 1,
    description: "Reaction Vessel 5 KL with limpet coil, internal electro-polishing & mechanical seal (SS 316L)",
    drawingRef: "GFC-DWG-RV-501-01 Rev 03",
    tagNo: "RV-501A",
    poQty: 2,
    prevReleasedQty: 0,
    inspectedQty: 1,
    acceptedQty: 1,
    currentReleasedQty: 1,
    unit: "Nos",
    remarks: "Released for dispatch. Nitrogen purging at 0.5 bar maintained. Blind flanges installed on all nozzles.",
    isLocked: false,
  },
  {
    id: "irn-002",
    poItemNo: 2,
    description: "Centrifugal Process Pump (SS 316, 25 m3/hr @ 45m head) with Ex-d Motor",
    drawingRef: "GA-PUMP-202-02 Rev 01",
    tagNo: "P-202B",
    poQty: 4,
    prevReleasedQty: 0,
    inspectedQty: 2,
    acceptedQty: 2,
    currentReleasedQty: 2,
    unit: "Nos",
    remarks: "Released for dispatch. Coupling aligned and wooden skid packaging verified.",
    isLocked: false,
  },
  {
    id: "irn-003",
    poItemNo: 3,
    description: "Shell & Tube Heat Exchanger (Hastelloy C-22 tubes / SS 304 shell)",
    drawingRef: "DWG-HE-104-01 Rev 02",
    tagNo: "HE-104",
    poQty: 1,
    prevReleasedQty: 0,
    inspectedQty: 1,
    acceptedQty: 0,
    currentReleasedQty: 0,
    unit: "Nos",
    remarks: "NOT RELEASED. Scratch marks on tube sheet face pending re-buffing and final QC clearance.",
    isLocked: false,
  },
];

const INITIAL_REPORTS: InspectionReportRef[] = [
  {
    id: "rep-01",
    slNo: 1,
    reportNo: "IQE-IVR-2026-0812",
    date: "2026-09-29",
    stage: "Final Inspection",
    remarks: "Comprehensive inspection visit report covering dimensional, hydrotest, and MTR review.",
  },
  {
    id: "rep-02",
    slNo: 2,
    reportNo: "IQE-FL-2026-0901",
    date: "2026-09-28",
    stage: "Stage Inspection",
    remarks: "Flash preliminary inspection report endorsed at vendor premises.",
  },
];

const INITIAL_DEVIATIONS: DeviationRef[] = [
  {
    id: "dev-01",
    slNo: 1,
    concessionNo: "NIL",
    date: "2026-09-29",
    status: "NIL",
    remarks: "No concessions or engineering deviations requested for released items.",
  },
];

export default function InspectionReleaseNotePage() {
  const [selectedClient, setSelectedClient] = useState<string>("Granules India Limited - Gagillapur");
  const [items, setItems] = useState<ReleaseItem[]>(INITIAL_ITEMS);
  const [reports, setReports] = useState<InspectionReportRef[]>(INITIAL_REPORTS);
  const [deviations, setDeviations] = useState<DeviationRef[]>(INITIAL_DEVIATIONS);

  const [activeTab, setActiveTab] = useState<"items" | "basis" | "dispatch" | "reports" | "signoff">("items");
  const [isInlineEditMode, setIsInlineEditMode] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ReleaseItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ReleaseItem | null>(null);
  const [isTabSwitching, setIsTabSwitching] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [isInlineEditReports, setIsInlineEditReports] = useState<boolean>(false);
  const [isInlineEditDeviations, setIsInlineEditDeviations] = useState<boolean>(false);

  const handleAddReport = () => {
    const newId = `rep-${Date.now()}`;
    const newReport: InspectionReportRef = {
      id: newId,
      slNo: reports.length + 1,
      reportNo: `IQE-IVR-2026-${String(reports.length + 1).padStart(4, "0")}`,
      date: new Date().toISOString().split("T")[0],
      stage: "Stage / Final Inspection",
      remarks: "Field inspection endorsed per QAP.",
    };
    setReports((prev) => [...prev, newReport]);
    setIsInlineEditReports(true);
  };

  const handleAddDeviation = () => {
    const newId = `dev-${Date.now()}`;
    const newDev: DeviationRef = {
      id: newId,
      slNo: deviations.length + 1,
      concessionNo: `DEV-${new Date().getFullYear()}-${String(deviations.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
      status: "Approved by Client",
      remarks: "Concession deviation approved by client / TPI.",
    };
    setDeviations((prev) => [...prev, newDev]);
    setIsInlineEditDeviations(true);
  };

  const handleExportSingleRowCSV = (item: ReleaseItem) => {
    const headers = ["PO Item No", "Description", "Drawing Ref", "Tag No", "Unit", "PO Qty", "Prev Released", "Current Released", "Remarks"];
    const row = [item.poItemNo, `"${(item.description || "").replace(/"/g, '""')}"`, `"${item.drawingRef || ""}"`, `"${item.tagNo || ""}"`, item.unit, item.poQty, item.prevReleasedQty, item.currentReleasedQty, `"${(item.remarks || "").replace(/"/g, '""')}"`];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), row.join(",")].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `IRN_Item_${item.tagNo || item.poItemNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const initialDetails = CLIENT_DETAILS_MAP["Granules India Limited - Gagillapur"];
  const [irnNo, setIrnNo] = useState<string>("IQE-IRN-2026-0419");
  const [irnDate, setIrnDate] = useState<string>("2026-09-29");
  const [poStatus, setPoStatus] = useState<"Complete" | "Partially Completed" | "Balance Pending">("Partially Completed");
  const [releaseType, setReleaseType] = useState<"Full" | "Partial" | "Conditional">("Partial");
  const [releaseDecision, setReleaseDecision] = useState<
    "RELEASED FOR DISPATCH" | "RELEASED WITH COMMENTS / CONDITIONS" | "HOLD – CLIENT CLEARANCE REQUIRED" | "NOT RELEASED"
  >("RELEASED FOR DISPATCH");

  const [clientMeta, setClientMeta] = useState<ClientDetails>(initialDetails);

  const handleClientChange = (c: string) => {
    setSelectedClient(c);
    const d = CLIENT_DETAILS_MAP[c];
    if (d) {
      setClientMeta(d);
    }
  };

  const triggerSaveToast = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleInlineChange = (id: string, field: keyof ReleaseItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleToggleLock = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isLocked: !item.isLocked } : item))
    );
  };

  const handleDeleteItem = async (id: string) => {
    if (
      !(await confirmDialog({
        title: "Remove this item from the release note?",
        message: "The item will be taken off this IRN.",
        confirmLabel: "Remove",
        danger: true,
      }))
    )
      return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const kpis = useMemo(() => {
    const totalPOQty = items.reduce((acc, i) => acc + i.poQty, 0);
    const totalCurrentReleased = items.reduce((acc, i) => acc + i.currentReleasedQty, 0);
    const totalCumulativeReleased = items.reduce((acc, i) => acc + i.prevReleasedQty + i.currentReleasedQty, 0);
    const totalBalanceQty = Math.max(0, totalPOQty - totalCumulativeReleased);
    return {
      totalPOQty,
      totalCurrentReleased,
      totalCumulativeReleased,
      totalBalanceQty,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((i) =>
      i.description.toLowerCase().includes(search.toLowerCase()) ||
      i.tagNo.toLowerCase().includes(search.toLowerCase()) ||
      i.drawingRef.toLowerCase().includes(search.toLowerCase()) ||
      i.remarks.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const handleExportCSV = () => {
    const headers = [
      "PO Item No",
      "Item Description",
      "Drawing Ref",
      "Tag / Part No",
      "PO Qty",
      "Prev Released",
      "Inspected Qty",
      "Accepted Qty",
      "Current Qty Released",
      "Balance Qty",
      "Unit",
      "Remarks",
    ];
    const rows = items.map((it) => {
      const balance = Math.max(0, it.poQty - (it.prevReleasedQty + it.currentReleasedQty));
      return [
        it.poItemNo,
        `"${it.description.replace(/"/g, '""')}"`,
        `"${it.drawingRef}"`,
        `"${it.tagNo}"`,
        it.poQty,
        it.prevReleasedQty,
        it.inspectedQty,
        it.acceptedQty,
        it.currentReleasedQty,
        balance,
        it.unit,
        `"${it.remarks.replace(/"/g, '""')}"`,
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encoded;
    link.download = `Inspection_Release_Note_${irnNo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Toast Alert */}
      {showSavedToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Inspection Release Note (IQE-TP-04) saved successfully!</span>
        </div>
      )}

      {/* TOP HEADER CONTAINER */}
      <div className="bg-white text-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#003366] dark:text-sky-300 font-heading tracking-tight flex items-center gap-2">
              <PackageCheck className="w-6 h-6 text-emerald-600" />
              <span>Inspection Release Note (IRN)</span>
            </h1>

            {/* Select Client Dropdown */}
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs min-w-0 max-w-full">
              <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <label htmlFor="report-client-select" className="text-slate-600 font-extrabold shrink-0">Select Client:</label>
              <select
                id="report-client-select"
                value={selectedClient}
                onChange={(e) => handleClientChange(e.target.value)}
                className="min-w-0 flex-1 sm:flex-none truncate bg-white text-slate-900 font-extrabold border border-slate-300 rounded-lg text-xs p-1 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {CLIENT_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* IRN No & Decision */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
              <span className="text-slate-500 text-[11px] font-bold">IRN No:</span>
              <span className="text-slate-800 font-extrabold font-mono">{irnNo}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 text-[11px] font-bold">Type:</span>
              <select aria-label="Release type"
                value={releaseType}
                onChange={(e) => setReleaseType(e.target.value as any)}
                className="bg-white text-slate-900 font-bold border border-slate-300 rounded text-xs p-0.5"
              >
                <option value="Partial">Partial</option>
                <option value="Full">Full</option>
                <option value="Conditional">Conditional</option>
              </select>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPdfPreview(true)}
              className="px-3 py-1.5 rounded-xl bg-[#0084bf] hover:bg-[#0073a8] text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Preview Live PDF"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Live PDF</span>
            </button>

            <button
              onClick={async () => {
                await downloadPdfFile(
                  `${API_BASE}/api/tpi/preview/TP04.pdf`,
                  `IRN_${irnNo}.pdf`,
                  "/sample-pdfs/TP04.pdf"
                );
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Download PDF IRN Certificate"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button aria-label="Save IRN"
              onClick={triggerSaveToast}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition-all shadow-sm cursor-pointer"
              title="Save IRN"
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

            <button aria-label="Print IRN Certificate"
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all shadow-sm cursor-pointer"
              title="Print IRN Certificate"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Jump Links Strip (Sticky so inspector can use anytime while scrolling) */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
        {isTabSwitching && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center gap-2 z-10 text-xs font-bold text-[#0084bf]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Navigating to section...</span>
          </div>
        )}
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Jump to:</span>
        {[
          { id: "sec-1", label: "1.0 Release Status" },
          { id: "sec-2", label: "2.0 Report References" },
          { id: "sec-3", label: "3.0 Deviations" },
          { id: "sec-4", label: "4.0 Items Released" },
          { id: "sec-5", label: "5.0 Basis of Release" },
          { id: "sec-6", label: "6.0 Traceability" },
          { id: "sec-7", label: "7.0 Dispatch Instructions" },
          { id: "sec-8", label: "8.0 Remarks" },
          { id: "sec-9", label: "9.0 Signatures" },
          { id: "sec-10", label: "10.0 Disclaimer" },
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
            <div className="font-extrabold text-slate-800">FORM NO.: IQE-TP-04</div>
            <div className="text-slate-500 text-[11px]">REVISION: 00</div>
            <div className="font-bold text-[#003366]">IRN NO.: {irnNo}</div>
          </div>
        </div>

        <div className="text-center py-1">
          <h3 className="text-lg sm:text-xl font-extrabold text-[#003366] uppercase tracking-tight">
            INSPECTION RELEASE NOTE
          </h3>
          <p className="text-xs italic text-slate-500">Formal release of inspected items for dispatch, subject to the conditions stated herein.</p>
        </div>
      </div>

      {/* Top Document Metadata Table (IQE-TP-04 Page 1 as is) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
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
                <td className="p-2.5">IRN No.</td>
                <td className="p-2.5 font-mono">{irnNo}</td>
                <td className="p-2.5">Date</td>
                <td className="p-2.5 font-mono">{irnDate}</td>
              </tr>
              <tr>
                <td className="p-2.5">Contract Ref.</td>
                <td className="p-2.5 font-mono">{clientMeta.contractRef}</td>
                <td className="p-2.5">PO No. &amp; Date</td>
                <td className="p-2.5 font-mono">{clientMeta.poNumber} &bull; {clientMeta.poDate}</td>
              </tr>
              <tr>
                <td className="p-2.5">Customer</td>
                <td className="p-2.5">{clientMeta.customer}</td>
                <td className="p-2.5">Supplier</td>
                <td className="p-2.5">{clientMeta.supplier}</td>
              </tr>
              <tr>
                <td className="p-2.5">Project</td>
                <td className="p-2.5">{clientMeta.projectName}</td>
                <td className="p-2.5">Inspection Location</td>
                <td className="p-2.5">{clientMeta.projectLocation}</td>
              </tr>
              <tr>
                <td className="p-2.5">RFI No. &amp; Date</td>
                <td className="p-2.5 font-mono">{clientMeta.rfiRef}</td>
                <td className="p-2.5">IQE Inspector</td>
                <td className="p-2.5">{clientMeta.inspector}</td>
              </tr>
              <tr>
                <td className="p-2.5">PO Status</td>
                <td className="p-2.5">
                  <div className="flex flex-wrap items-center gap-3">
                    {(["Complete", "Partially Completed", "Balance Pending"] as const).map((st) => (
                      <label key={st} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="poStatus"
                          checked={poStatus === st}
                          onChange={() => setPoStatus(st)}
                          className="text-[#003366]"
                        />
                        <span className="text-[11px] font-semibold">{st}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className="p-2.5">Release Type</td>
                <td className="p-2.5">
                  <div className="flex flex-wrap items-center gap-3">
                    {(["Full", "Partial", "Conditional"] as const).map((rt) => (
                      <label key={rt} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="releaseType"
                          checked={releaseType === rt}
                          onChange={() => setReleaseType(rt)}
                          className="text-[#003366]"
                        />
                        <span className="text-[11px] font-semibold">{rt}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 1.0 INSPECTION & RELEASE STATUS */}
      <div id="sec-1" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider">1.0 INSPECTION &amp; RELEASE STATUS</span>
          <span className="font-mono text-[11px] text-sky-200">IQE-TP-04 Clause 1.0</span>
        </div>
        <div className="p-4 bg-white space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 block">
                RELEASE DECISION (Select as Applicable)
              </span>
              {[
                "RELEASED FOR DISPATCH",
                "RELEASED WITH COMMENTS / CONDITIONS",
                "HOLD – CLIENT CLEARANCE REQUIRED",
                "NOT RELEASED",
              ].map((decision) => (
                <label key={decision} className="flex items-center gap-2 cursor-pointer font-bold text-xs p-1.5 rounded hover:bg-white transition-colors">
                  <input
                    type="radio"
                    name="releaseDecision"
                    checked={releaseDecision === decision}
                    onChange={() => setReleaseDecision(decision as any)}
                    className="text-[#003366]"
                  />
                  <span className={releaseDecision === decision ? "text-[#003366] dark:text-sky-300 font-extrabold" : "text-slate-700"}>
                    {decision}
                  </span>
                </label>
              ))}
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-emerald-50/60 flex flex-col justify-center space-y-2">
              <span className="text-xs font-bold text-emerald-800">Total Quantity Released under this IRN:</span>
              <p className="text-2xl font-extrabold font-mono text-emerald-900">
                {kpis.totalCurrentReleased} Units
              </p>
              <p className="text-xs text-slate-600">
                Out of {kpis.totalPOQty} Total PO Units ({kpis.totalBalanceQty} Balance Units Remaining)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2.0 INSPECTION REPORT REFERENCES */}
      <div id="sec-2" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">2.0 INSPECTION REPORT REFERENCES</span>
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">{reports.length} reports</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInlineEditReports(!isInlineEditReports)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isInlineEditReports ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>{isInlineEditReports ? "Exit Inline Edit" : "Inline Edit"}</span>
            </button>
            <button
              onClick={handleAddReport}
              className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Report Ref</span>
            </button>
            <span className="font-mono text-[11px] text-sky-200 hidden md:inline ml-2">IQE-TP-04 Clause 2.0</span>
          </div>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-center w-12 border-r border-slate-200">Sl. No.</th>
                <th className="p-2.5 border-r border-slate-200 font-mono">Inspection Report No.</th>
                <th className="p-2.5 border-r border-slate-200">Date</th>
                <th className="p-2.5 border-r border-slate-200">Inspection Stage</th>
                <th className="p-2.5 border-r border-slate-200">Remarks</th>
                <th className="p-2.5 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r, idx) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-mono font-bold text-slate-600 border-r border-slate-100">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditReports ? (
                      <input aria-label="Report No."
                        type="text"
                        value={r.reportNo}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReports((prev) => prev.map((item) => (item.id === r.id ? { ...item, reportNo: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono font-bold text-[#003366] dark:text-sky-300"
                      />
                    ) : (
                      <span className="font-mono font-bold text-[#003366] dark:text-sky-300">{r.reportNo}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditReports ? (
                      <input aria-label="Date"
                        type="date"
                        value={r.date}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReports((prev) => prev.map((item) => (item.id === r.id ? { ...item, date: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono"
                      />
                    ) : (
                      <span className="font-mono">{r.date}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditReports ? (
                      <input aria-label="Stage"
                        type="text"
                        value={r.stage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReports((prev) => prev.map((item) => (item.id === r.id ? { ...item, stage: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-semibold text-slate-800"
                      />
                    ) : (
                      <span className="font-semibold text-slate-800">{r.stage}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditReports ? (
                      <input aria-label="Remarks"
                        type="text"
                        value={r.remarks}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReports((prev) => prev.map((item) => (item.id === r.id ? { ...item, remarks: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs text-slate-700"
                      />
                    ) : (
                      <span className="text-slate-600">{r.remarks}</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <button aria-label="Delete Report Reference"
                      onClick={() => setReports((prev) => prev.filter((item) => item.id !== r.id))}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Delete Report Reference"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3.0 COMPLIANCE / DEVIATION REFERENCES */}
      <div id="sec-3" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">3.0 COMPLIANCE / DEVIATION REFERENCES</span>
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">{deviations.length} records</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInlineEditDeviations(!isInlineEditDeviations)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isInlineEditDeviations ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>{isInlineEditDeviations ? "Exit Inline Edit" : "Inline Edit"}</span>
            </button>
            <button
              onClick={handleAddDeviation}
              className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Deviation</span>
            </button>
            <span className="font-mono text-[11px] text-sky-200 hidden md:inline ml-2">IQE-TP-04 Clause 3.0</span>
          </div>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-center w-12 border-r border-slate-200">Sl. No.</th>
                <th className="p-2.5 border-r border-slate-200 font-mono">Compliance / Deviation Acceptance No.</th>
                <th className="p-2.5 border-r border-slate-200">Date</th>
                <th className="p-2.5 border-r border-slate-200">Status</th>
                <th className="p-2.5 border-r border-slate-200">Remarks</th>
                <th className="p-2.5 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deviations.map((d, idx) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-mono font-bold text-slate-600 border-r border-slate-100">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditDeviations ? (
                      <input aria-label="Concession No."
                        type="text"
                        value={d.concessionNo}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDeviations((prev) => prev.map((item) => (item.id === d.id ? { ...item, concessionNo: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono font-bold text-slate-800"
                      />
                    ) : (
                      <span className="font-mono font-bold text-slate-800">{d.concessionNo}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditDeviations ? (
                      <input aria-label="Date"
                        type="date"
                        value={d.date}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDeviations((prev) => prev.map((item) => (item.id === d.id ? { ...item, date: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono"
                      />
                    ) : (
                      <span className="font-mono">{d.date}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditDeviations ? (
                      <select aria-label="Status"
                        value={d.status}
                        onChange={(e) => {
                          const val = e.target.value as DeviationRef["status"];
                          setDeviations((prev) => prev.map((item) => (item.id === d.id ? { ...item, status: val } : item)));
                        }}
                        className="p-1 bg-amber-50 border border-amber-300 rounded text-xs font-semibold text-emerald-700"
                      >
                        <option value="Approved by Client">Approved by Client</option>
                        <option value="Waived with Conditions">Waived with Conditions</option>
                        <option value="Under Review">Under Review</option>
                        <option value="NIL">NIL</option>
                      </select>
                    ) : (
                      <span className="font-semibold text-emerald-700">{d.status}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditDeviations ? (
                      <input aria-label="Remarks"
                        type="text"
                        value={d.remarks}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDeviations((prev) => prev.map((item) => (item.id === d.id ? { ...item, remarks: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs text-slate-700"
                      />
                    ) : (
                      <span className="text-slate-600">{d.remarks}</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <button aria-label="Delete Deviation Record"
                      onClick={() => setDeviations((prev) => prev.filter((item) => item.id !== d.id))}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Delete Deviation Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* 4.0 ITEMS RELEASED */}
      <div id="sec-4" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">4.0 ITEMS RELEASED</span>
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">{filteredItems.length} items</span>
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
              <span>+ Add Item</span>
            </button>
            <span className="font-mono text-[11px] text-sky-200 hidden md:inline ml-2">IQE-TP-04 Clause 4.0</span>
          </div>
        </div>
        <div className="p-4 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-600" />
              <span>Section 4.0 Items Released for Dispatch ({filteredItems.length} items)</span>
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <input aria-label="Search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description, tag, drawing..."
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              <button
                onClick={() => setIsInlineEditMode(!isInlineEditMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs cursor-pointer ${
                  isInlineEditMode
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-amber-500/20"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                }`}
                title="Toggle Inline Editing"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isInlineEditMode ? "Exit Inline Edit" : "Enable Inline Edit"}</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setShowPdfPreview(true)}
                className="px-3.5 py-1.5 bg-[#0084bf] hover:bg-[#0073a8] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Preview Live PDF"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Live PDF</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item #{items.length + 1}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-left text-xs border-collapse min-w-[1700px]">
              <thead className="sticky top-0 bg-slate-100 text-slate-800 font-bold border-b border-slate-300 z-10 select-none shadow-xs">
                <tr>
                  <th className="p-3 text-center border-r border-slate-200 w-12">PO Item</th>
                  <th className="p-3 border-r border-slate-200 min-w-[280px]">Item Description</th>
                  <th className="p-3 border-r border-slate-200 min-w-[180px]">Drawing / Rev.</th>
                  <th className="p-3 border-r border-slate-200 min-w-[130px]">Tag / Part No.</th>
                  <th className="p-3 border-r border-slate-200 text-center w-16">UOM</th>
                  <th className="p-3 border-r border-slate-200 text-right">PO Qty</th>
                  <th className="p-3 border-r border-slate-200 text-right">Prev. Released</th>
                  <th className="p-3 border-r border-slate-200 text-right bg-blue-100 text-blue-900 font-extrabold">Inspected</th>
                  <th className="p-3 border-r border-slate-200 text-right bg-emerald-100 text-emerald-900 font-extrabold">Accepted</th>
                  <th className="p-3 border-r border-slate-200 text-right bg-emerald-200 text-emerald-950 font-extrabold min-w-[120px]">
                    Current Qty Released
                  </th>
                  <th className="p-3 border-r border-slate-200 text-right">Balance Qty</th>
                  <th className="p-3 border-r border-slate-200 min-w-[260px]">Remarks / Packing Notes</th>
                  <th className="p-3 text-center min-w-[210px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredItems.map((item, idx) => {
                  const balance = Math.max(0, item.poQty - (item.prevReleasedQty + item.currentReleasedQty));
                  return (
                    <tr key={item.id} className="hover:bg-brand-50/40 transition-colors">
                      <td className="p-3 text-center font-mono font-bold text-slate-700 bg-slate-50 border-r border-slate-100">
                        #{item.poItemNo}
                      </td>

                      <td className="p-3 border-r border-slate-100 font-medium">
                        {isInlineEditMode && !item.isLocked ? (
                          <textarea aria-label="Description"
                            rows={2}
                            value={item.description}
                            onChange={(e) => handleInlineChange(item.id, "description", e.target.value)}
                            className="w-full p-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        ) : (
                          <span className="font-semibold text-slate-900">{item.description}</span>
                        )}
                      </td>

                      <td className="p-3 font-mono text-slate-600 border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label="Drawing Ref."
                            type="text"
                            value={item.drawingRef}
                            onChange={(e) => handleInlineChange(item.id, "drawingRef", e.target.value)}
                            className="w-24 p-1 bg-white border border-slate-300 rounded text-xs font-mono"
                          />
                        ) : (
                          item.drawingRef
                        )}
                      </td>

                      <td className="p-3 font-mono font-bold text-brand-600 border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label="Tag No."
                            type="text"
                            value={item.tagNo}
                            onChange={(e) => handleInlineChange(item.id, "tagNo", e.target.value)}
                            className="w-24 p-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-brand-600"
                          />
                        ) : (
                          item.tagNo
                        )}
                      </td>

                      <td className="p-3 text-center font-mono border-r border-slate-100 font-semibold">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label="Unit"
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleInlineChange(item.id, "unit", e.target.value)}
                            className="w-14 p-1 text-center bg-white border border-slate-300 rounded text-xs font-mono"
                          />
                        ) : (
                          item.unit
                        )}
                      </td>

                      <td className="p-3 text-right font-mono border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label="PO Qty"
                            type="number"
                            value={item.poQty}
                            onChange={(e) => handleInlineChange(item.id, "poQty", parseFloat(e.target.value) || 0)}
                            className="w-16 p-1 text-right bg-white border border-slate-300 rounded text-xs font-mono"
                          />
                        ) : (
                          item.poQty
                        )}
                      </td>

                      <td className="p-3 text-right font-mono border-r border-slate-100 text-slate-500">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label="Prev released Qty"
                            type="number"
                            value={item.prevReleasedQty}
                            onChange={(e) => handleInlineChange(item.id, "prevReleasedQty", parseFloat(e.target.value) || 0)}
                            className="w-16 p-1 text-right bg-white border border-slate-300 rounded text-xs font-mono"
                          />
                        ) : (
                          item.prevReleasedQty
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-blue-800 bg-blue-50/40 border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label="Inspected Qty"
                            type="number"
                            value={item.inspectedQty}
                            onChange={(e) => handleInlineChange(item.id, "inspectedQty", parseFloat(e.target.value) || 0)}
                            className="w-16 p-1 text-right bg-white border border-blue-300 rounded text-xs font-mono font-bold text-blue-800"
                          />
                        ) : (
                          item.inspectedQty
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40 border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label="Accepted Qty"
                            type="number"
                            value={item.acceptedQty}
                            onChange={(e) => handleInlineChange(item.id, "acceptedQty", parseFloat(e.target.value) || 0)}
                            className="w-16 p-1 text-right bg-white border border-emerald-300 rounded text-xs font-mono font-bold text-emerald-800"
                          />
                        ) : (
                          item.acceptedQty
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-extrabold text-emerald-950 bg-emerald-100/60 border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label="Current released Qty"
                            type="number"
                            value={item.currentReleasedQty}
                            onChange={(e) => handleInlineChange(item.id, "currentReleasedQty", parseFloat(e.target.value) || 0)}
                            className="w-16 p-1 text-right font-mono font-extrabold text-emerald-900 bg-white border border-emerald-400 rounded text-xs"
                          />
                        ) : (
                          item.currentReleasedQty
                        )}
                      </td>

                      <td className="p-3 text-right font-mono border-r border-slate-100 text-slate-500">
                        {balance}
                      </td>

                      <td className="p-3 border-r border-slate-100 text-[11px] leading-tight text-slate-700">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label="Remarks"
                            type="text"
                            value={item.remarks}
                            onChange={(e) => handleInlineChange(item.id, "remarks", e.target.value)}
                            className="w-full p-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        ) : (
                          item.remarks || "-"
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* 1. Lock/Unlock */}
                          <button aria-label={item.isLocked ? "Locked — Click to Unlock Row" : "Unlocked — Click to Lock Row"}
                            onClick={() => handleToggleLock(item.id)}
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
                            onClick={() => !item.isLocked && setEditingItem({ ...item })}
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
                            onClick={() => downloadPdfFile(`${API_BASE}/api/tpi/preview/TP04.pdf`, `IRN_Item_${item.poItemNo}_Certificate.pdf`, "/sample-pdfs/TP04.pdf")}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer border border-rose-200/60"
                            title="Download Single PDF Report"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* 7. Delete */}
                          <button aria-label="Delete Row"
                            onClick={() => !item.isLocked && handleDeleteItem(item.id)}
                            disabled={item.isLocked}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.isLocked
                                ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                : "bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 cursor-pointer"
                            }`}
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5.0 BASIS OF RELEASE */}
      <div id="sec-5" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider">5.0 BASIS OF RELEASE</span>
          <span className="font-mono text-[11px] text-sky-200">IQE-TP-04 Clause 5.0</span>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-left border-r border-slate-200">Applicable Basis</th>
                <th className="p-2.5 text-center w-48">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {[
                { title: "Purchase Order / Contract Requirements", defaultVal: "Applicable" },
                { title: "Approved QAP / ITP", defaultVal: "Applicable" },
                { title: "Approved Drawings / Specifications / Datasheets", defaultVal: "Applicable" },
                { title: "Inspection Report(s) Referenced Above", defaultVal: "Applicable" },
                { title: "Compliance / Deviation Acceptance", defaultVal: "Applicable" },
                { title: "Client-Approved Documents / Clearance", defaultVal: "Applicable" },
                { title: "Other: Final Factory Acceptance Report Cleared", defaultVal: "Applicable" },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2.5 border-r border-slate-100 font-semibold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item.title}</span>
                  </td>
                  <td className="p-2.5 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name={`basis-${idx}`} defaultChecked={item.defaultVal === "Applicable"} className="text-[#003366]" />
                        <span className="text-[11px] font-semibold text-emerald-700">Applicable</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name={`basis-${idx}`} defaultChecked={item.defaultVal === "N/A"} className="text-slate-400" />
                        <span className="text-[11px] font-semibold text-slate-500">N/A</span>
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6.0 IDENTIFICATION / TRACEABILITY */}
      <div id="sec-6" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider">6.0 IDENTIFICATION / TRACEABILITY</span>
          <span className="font-mono text-[11px] text-sky-200">IQE-TP-04 Clause 6.0</span>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-left border-r border-slate-200 min-w-[220px]">Identification / Traceability Item</th>
                <th className="p-2.5 text-center w-36 border-r border-slate-200">Status</th>
                <th className="p-2.5 text-left min-w-[280px]">Details / Specimen / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {[
                { item: "Tag / Identification", defaultStatus: "Yes", details: "Stainless steel SS316 tag plate riveted to shell (Tag: HE-3101, SC-901)" },
                { item: "Serial No.", defaultStatus: "Yes", details: "Permanent punched serial numbers verified against mill test certificates" },
                { item: "Hard Stamping", defaultStatus: "Yes", details: "Inspector low-stress hard punch stamp IQE-TPI applied adjacent to nameplate" },
                { item: "Paint Marking", defaultStatus: "Yes", details: "Project code and dispatch bundle markings stenciled with indelible paint" },
                { item: "Other", defaultStatus: "Yes", details: "Color-coded end caps applied on all tube sheet nozzles" },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2.5 border-r border-slate-100 font-semibold text-slate-800">{row.item}</td>
                  <td className="p-2.5 border-r border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name={`trace-${idx}`} defaultChecked={row.defaultStatus === "Yes"} className="text-emerald-600" />
                        <span className="text-[11px] font-semibold text-emerald-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name={`trace-${idx}`} defaultChecked={row.defaultStatus === "No"} className="text-rose-600" />
                        <span className="text-[11px] font-semibold text-rose-700">No</span>
                      </label>
                    </div>
                  </td>
                  <td className="p-2.5 text-slate-600">{row.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7.0 DISPATCH / PRESERVATION INSTRUCTIONS */}
      <div id="sec-7" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider">7.0 DISPATCH / PRESERVATION INSTRUCTIONS</span>
          <span className="font-mono text-[11px] text-sky-200">IQE-TP-04 Clause 7.0</span>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-left border-r border-slate-200">Instruction</th>
                <th className="p-2.5 text-center w-36">Applicable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {[
                { title: "Ensure suitable packing to prevent transit damage", def: "Yes" },
                { title: "Protect machined surfaces against corrosion", def: "Yes" },
                { title: "Fix name plate", def: "Yes" },
                { title: "Blank / close nozzles and openings", def: "Yes" },
                { title: "Purge with nitrogen and maintain positive pressure", def: "Yes" },
                { title: "Submit as-built drawings / final documentation / statutory certificates", def: "Yes" },
                { title: "Submit operating and maintenance instructions", def: "Yes" },
                { title: "Dispatch immediately", def: "Yes" },
                { title: "Dispatch after obtaining client clearance", def: "Yes" },
                { title: "Other: Export seaworthy wooden pallet wrapping required", def: "Yes" },
              ].map((inst, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2.5 border-r border-slate-100 font-semibold text-slate-800 flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span>{inst.title}</span>
                  </td>
                  <td className="p-2.5 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name={`inst-${idx}`} defaultChecked={inst.def === "Yes"} className="text-emerald-600" />
                        <span className="text-[11px] font-semibold text-emerald-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name={`inst-${idx}`} defaultChecked={inst.def === "N/A"} className="text-slate-400" />
                        <span className="text-[11px] font-semibold text-slate-500">N/A</span>
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8.0 REMARKS / CONDITIONS OF RELEASE */}
      <div id="sec-8" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider">8.0 REMARKS / CONDITIONS OF RELEASE</span>
          <span className="font-mono text-[11px] text-sky-200">IQE-TP-04 Clause 8.0</span>
        </div>
        <div className="p-4 bg-white space-y-3">
          <textarea
            aria-label="Remarks and conditions of release"
            rows={3}
            defaultValue="All items released under this IRN have undergone visual, dimensional, hydrostatic pressure testing and positive material identification (PMI) satisfactorily in accordance with approved QAP and client purchase order. Vendor shall ensure nitrogen positive charge (0.5 bar) is verified prior to dispatch. Material Test Certificates and Calibration Certificates are reviewed and endorsed."
            className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003366] text-slate-800 bg-slate-50/50"
          />
        </div>
      </div>

      {/* 9.0 SUPPLIER ACKNOWLEDGEMENT & IQE AUTHORIZATION */}
      <div id="sec-9" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider">9.0 SUPPLIER ACKNOWLEDGEMENT &amp; IQE AUTHORIZATION</span>
          <span className="font-mono text-[11px] text-sky-200">IQE-TP-04 Clause 9.0</span>
        </div>
        <div className="p-4 bg-white space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Supplier / Manufacturer */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
              <span className="font-extrabold text-sm text-[#003366] dark:text-sky-300 block border-b border-slate-200 pb-2">
                Supplier / Manufacturer
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Name:</span>
                  <span className="font-bold text-slate-800">Rajesh V. Sharma</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Designation:</span>
                  <span className="font-bold text-slate-800">Quality Assurance Manager</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Signature:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    [Digitally Signed - R.V. Sharma]
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Date:</span>
                  <span className="font-mono font-bold text-slate-800">{irnDate}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Company Stamp:</span>
                  <div className="mt-1 h-14 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-[11px]">
                    {clientMeta.supplier} &bull; Quality Department
                  </div>
                </div>
              </div>
            </div>

            {/* Ideal Quality Engineers (I) Pvt. Ltd. */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
              <span className="font-extrabold text-sm text-[#003366] dark:text-sky-300 block border-b border-slate-200 pb-2">
                Ideal Quality Engineers (I) Pvt. Ltd.
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Name:</span>
                  <span className="font-bold text-slate-800">{clientMeta.inspector}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">IQE Inspector:</span>
                  <span className="font-bold text-slate-800">Lead TPI Inspector (Level-III / CSWIP)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Signature:</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    [Digitally Endorsed - IQE]
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Date:</span>
                  <span className="font-mono font-bold text-slate-800">{irnDate}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 block">IQE Stamp:</span>
                  <div className="mt-1 h-14 border border-dashed border-blue-300 bg-blue-50/40 rounded-lg flex items-center justify-center text-blue-800 font-bold text-[11px]">
                    IDEAL QUALITY ENGINEERS (I) PVT. LTD. &bull; INSPECTION RELEASE APPROVED
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
            <label htmlFor="supplier-comments" className="text-xs font-bold text-slate-700 block mb-1">Supplier&apos;s Comments (if any):</label>
            <input
              id="supplier-comments"
              type="text"
              defaultValue="All items packed seaworthy per contract requirements. Ready for client logistics carrier pickup."
              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* 10.0 DISCLAIMER & LIMITATION OF LIABILITY */}
      <div id="sec-10" className="scroll-mt-32 border border-slate-200 rounded-xl p-4 bg-slate-50/80 space-y-3 text-xs text-slate-600 leading-relaxed">
        <h4 className="font-extrabold text-[#003366] dark:text-sky-300 uppercase text-xs tracking-wider">
          10.0 DISCLAIMER &amp; LIMITATION OF LIABILITY
        </h4>
        <p>
          <strong className="text-slate-800">Supplier Responsibility:</strong> This release note is issued without prejudice to the contractual obligations of the supplier and does not relieve the supplier/manufacturer from the responsibilities and obligations set forth in the Purchase Order and other approved documents.
        </p>
        <p>
          <strong className="text-slate-800">Basis of Release:</strong> This release note reflects the inspection status and release decision based on the items, documents and information made available to IQE during the referenced inspection(s). It does not relieve the manufacturer/supplier of its contractual, statutory or regulatory responsibilities.
        </p>
        <p>
          <strong className="text-slate-800">Limitation of Liability:</strong> The existing IQE-approved liability wording in the current IQE-TP-04 format should be retained here without alteration unless formally reviewed and approved by IQE management/legal counsel.
        </p>
        <div className="pt-3 border-t border-slate-200 text-center font-extrabold text-slate-700 tracking-wider">
          &mdash; END OF INSPECTION RELEASE NOTE &mdash;
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200 pt-2 font-mono">
          <span>IQE-TP-04 | Rev. 00 | Controlled Document</span>
          <span>Page 2 of 2</span>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Document:</span>
          <span className="text-xs font-extrabold text-[#003366] dark:text-sky-300 font-mono">IQE-TP-04 &bull; {irnNo}</span>
          <span className="text-xs text-slate-300">|</span>
          <span className="text-xs font-semibold text-slate-600">{items.length} Release Items</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPdfPreview(true)}
            className="px-4 py-2 rounded-xl bg-[#0084bf] hover:bg-[#0073a8] text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
            title="Preview Live PDF"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Live PDF</span>
          </button>
          <button
            onClick={triggerSaveToast}
            className="px-4 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
            title="Save IRN"
          >
            <Save className="w-4 h-4 text-sky-400" />
            <span>Save IRN</span>
          </button>
        </div>
      </div>

      {/* VIEW ROW DETAILS MODAL */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-heading">
                    Item Details &bull; Item #{viewingItem.poItemNo}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">{viewingItem.tagNo}</p>
                </div>
              </div>
              <button aria-label="Close" title="Close"
                onClick={() => setViewingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Description of Material</span>
                <span className="font-semibold text-slate-800 text-xs">{viewingItem.description}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Drawing Ref</span>
                <span className="font-mono text-slate-700">{viewingItem.drawingRef}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Tag / Heat No</span>
                <span className="font-mono font-bold text-slate-800">{viewingItem.tagNo}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">PO Quantity</span>
                <span className="font-bold text-slate-900">{viewingItem.poQty} {viewingItem.unit}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Previously Released</span>
                <span className="font-bold text-slate-600">{viewingItem.prevReleasedQty} {viewingItem.unit}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Inspected / Accepted</span>
                <span className="font-bold text-emerald-700">{viewingItem.inspectedQty} / {viewingItem.acceptedQty} {viewingItem.unit}</span>
              </div>
              <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-100">
                <span className="text-[11px] text-sky-600 uppercase font-bold tracking-wider block">Current Released Qty</span>
                <span className="font-black text-sky-800 text-sm">{viewingItem.currentReleasedQty} {viewingItem.unit}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Remarks / Notes</span>
                <span className="text-slate-700 italic">{viewingItem.remarks || "—"}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ROW MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                Edit Release Item &bull; {editingItem.tagNo}
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
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea aria-label="Description"
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
                  <label className="block text-slate-700 font-bold mb-1">Drawing Ref</label>
                  <input aria-label="Drawing Ref"
                    type="text"
                    value={editingItem.drawingRef}
                    onChange={(e) => setEditingItem({ ...editingItem, drawingRef: e.target.value })}
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
                  <label className="block text-slate-700 font-bold mb-1">Prev Released</label>
                  <input aria-label="Prev Released"
                    type="number"
                    value={editingItem.prevReleasedQty}
                    onChange={(e) => setEditingItem({ ...editingItem, prevReleasedQty: parseFloat(e.target.value) || 0 })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Current Release</label>
                  <input aria-label="Current Release"
                    type="number"
                    value={editingItem.currentReleasedQty}
                    onChange={(e) => setEditingItem({ ...editingItem, currentReleasedQty: parseFloat(e.target.value) || 0 })}
                    className="w-full p-1.5 border border-emerald-400 rounded-lg font-mono font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">UOM</label>
                  <input aria-label="UOM"
                    type="text"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Dispatch Remarks</label>
                <input aria-label="Dispatch Remarks"
                  type="text"
                  value={editingItem.remarks}
                  onChange={(e) => setEditingItem({ ...editingItem, remarks: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#003366] text-white font-bold shadow-md hover:bg-[#002244]"
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
                Add Release Item #{items.length + 1}
              </h3>
              <button aria-label="Close" title="Close" onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                const created: ReleaseItem = {
                  id: `irn-${Date.now()}`,
                  poItemNo: items.length + 1,
                  description: (fd.get("description") as string) || "Item Description",
                  drawingRef: (fd.get("drawingRef") as string) || "GFC-DWG-01",
                  tagNo: (fd.get("tagNo") as string) || `TAG-${items.length + 1}`,
                  unit: (fd.get("unit") as string) || "Nos",
                  poQty: parseFloat(fd.get("poQty") as string) || 1,
                  prevReleasedQty: parseFloat(fd.get("prevReleasedQty") as string) || 0,
                  inspectedQty: parseFloat(fd.get("currentReleasedQty") as string) || 1,
                  acceptedQty: parseFloat(fd.get("currentReleasedQty") as string) || 1,
                  currentReleasedQty: parseFloat(fd.get("currentReleasedQty") as string) || 1,
                  remarks: (fd.get("remarks") as string) || "Released for dispatch",
                  isLocked: false,
                };
                setItems([...items, created]);
                setShowAddModal(false);
                triggerSaveToast();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-slate-700 font-bold mb-1">Item Description *</label>
                <textarea aria-label="Item Description"
                  name="description"
                  required
                  rows={2}
                  placeholder="e.g. Centrifugal Slurry Pump..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tag / Serial No. *</label>
                  <input aria-label="Tag / Serial No."
                    type="text"
                    name="tagNo"
                    required
                    placeholder="e.g. P-101A"
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Drawing Ref</label>
                  <input aria-label="Drawing Ref"
                    type="text"
                    name="drawingRef"
                    defaultValue="DWG-GA-01"
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">PO Qty</label>
                  <input aria-label="PO Qty"
                    type="number"
                    name="poQty"
                    defaultValue={1}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Prev Released</label>
                  <input aria-label="Prev Released"
                    type="number"
                    name="prevReleasedQty"
                    defaultValue={0}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Current Release</label>
                  <input aria-label="Current Release"
                    type="number"
                    name="currentReleasedQty"
                    defaultValue={1}
                    className="w-full p-1.5 border border-emerald-400 rounded-lg font-mono font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">UOM</label>
                  <input aria-label="UOM"
                    type="text"
                    name="unit"
                    defaultValue="Nos"
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Dispatch Remarks</label>
                <input aria-label="Dispatch Remarks"
                  type="text"
                  name="remarks"
                  placeholder="Packing & transit notes..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold shadow-md hover:bg-brand-700"
                >
                  Add Item
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
        formCode="TP04"
        payload={{
          report_no: irnNo,
          date: irnDate,
          contract_ref: clientMeta.contractRef,
          po_no_and_date: `${clientMeta.poNumber} & ${clientMeta.poDate}`.trim(),
          customer: clientMeta.customer,
          supplier: clientMeta.supplier,
          project: clientMeta.projectName,
          location: clientMeta.projectLocation,
          rfi_no_and_date: `${clientMeta.rfiRef} & ${clientMeta.rfiDate}`.trim(),
          inspector: clientMeta.inspector,
          po_status: poStatus,
          release_type: releaseType,
          release_decision: releaseDecision,
          total_quantity_released: items.reduce((acc, i) => acc + i.currentReleasedQty, 0).toString(),
          report_refs: reports.map((r) => ({
            sl_no: r.slNo,
            report_no: r.reportNo,
            date: r.date,
            stage: r.stage,
            remarks: r.remarks,
          })),
          deviation_refs: deviations.map((d) => ({
            sl_no: d.slNo,
            concession_no: d.concessionNo,
            date: d.date,
            status: d.status,
            remarks: d.remarks,
          })),
          release_items: items.map((i) => ({
            po_item: i.poItemNo,
            description: i.description,
            drawing_rev: i.drawingRef,
            tag_no: i.tagNo,
            po_qty: i.poQty,
            prev_released: i.prevReleasedQty,
            inspected_qty: i.inspectedQty,
            accepted_qty: i.acceptedQty,
            current_released: i.currentReleasedQty,
            balance_qty: Math.max(0, i.poQty - i.prevReleasedQty - i.currentReleasedQty),
            remarks: i.remarks,
          })),
          selected_basis: ["po", "qap", "reports"],
          other_basis: "",
          traceability: {
            tag: { status: "Yes", details: "Stainless steel etched tag plate riveted" },
            serial: { status: "Yes", details: "Hard stamped heat number on flange rim" },
            hard_stamp: { status: "Yes", details: "Low-stress round nose punch IQE-04" },
            paint: { status: "No", details: "N/A - Electropolished stainless surface" },
          },
          dispatch_instructions: ["packing", "protect", "asbuilt", "dispatch_now"],
          remarks: "All items inspected as per approved QAP. Release granted for dispatch.",
        }}
        pdfUrl={`${API_BASE}/api/tpi/preview/TP04.pdf`}
        title="IQE-TP-04 Inspection Release Note (IRN)"
        reportNo={irnNo}
      />
    </div>
  );
}
