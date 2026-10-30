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
  Gauge,
  BookOpen,
  ArrowLeft,
  Paperclip,
  Loader2,
} from "@/components/icons";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";
import { confirmDialog } from "@/components/feedback";

export interface InspectedItem {
  id: string;
  slNo: number;
  description: string;
  tagNo: string;
  poQty: number;
  offeredQty: number;
  inspectedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unit: string;
  remarks: string;
  isLocked?: boolean;
}

export interface DocumentReview {
  id: string;
  slNo: number;
  docType: string;
  docNo: string;
  rev: string;
  status: string;
  approvalStatus: string;
  remarks: string;
}

export interface InspectionActivity {
  id: string;
  slNo: number;
  activity: string;
  referenceClause: string;
  tpiScope: "Witness" | "Review" | "Hold" | "Verify";
  result: "Satisfactory" | "Non-Compliant" | "In Progress";
  remarks: string;
}

export interface InspectionFinding {
  id: string;
  slNo: number;
  finding: string;
  reference: string;
  evidenceDocNo: string;
  status: "Compliant" | "Observation" | "Concession Required";
}

export interface PunchItem {
  id: string;
  slNo: number;
  observation: string;
  reference: string;
  supplierAction: string;
  status: "Open" | "Closed" | "Pending Client Approval";
}

export interface CalibrationItem {
  id: string;
  equipment: string;
  manufacturer: string;
  model: string;
  serialNo: string;
  range: string;
  accuracy: string;
  certNo: string;
  dueDate: string;
  status: "Valid" | "Due for Calibration";
}

export interface AttachmentItem {
  id: string;
  slNo: number;
  description: string;
  referencePages: string;
  remarks: string;
}

export interface PhotoItem {
  id: string;
  title: string;
  desc: string;
  tag: string;
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
  applicableQAP: string;
  applicableSpec: string;
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
    rfiRef: "RFI-GIL-2026-092",
    rfiDate: "2026-09-28",
    applicableQAP: "QAP-GIL-PV-2025-REV02",
    applicableSpec: "TS-PHARMA-VESSEL-REV01",
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
    rfiRef: "RFI-ATOM-PKG01-105",
    rfiDate: "2026-09-27",
    applicableQAP: "QAP-ATOM-MECH-004",
    applicableSpec: "SPEC-ATOM-FAB-REV03",
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
    rfiRef: "RFI-SUV-CIV-048",
    rfiDate: "2026-09-25",
    applicableQAP: "QAP-SUVEN-CIV-01",
    applicableSpec: "SPEC-CLEANROOM-02",
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
    rfiRef: "RFI-MCGM-2026-110",
    rfiDate: "2026-09-26",
    applicableQAP: "QAP-MCGM-CIVIL-003",
    applicableSpec: "SPEC-MUNICIPAL-COASTAL-01",
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
    rfiRef: "RFI-S2-2026-024",
    rfiDate: "2026-09-28",
    applicableQAP: "QAP-S2-SKID-2026",
    applicableSpec: "SPEC-S2-FAB-001",
    inspector: "P. Venkatraman (TPI Inspector)",
  },
};

const INITIAL_ITEMS: InspectedItem[] = [
  {
    id: "item-1",
    slNo: 1,
    description: "Multi-Tube Clean Steam Condenser 316L (500 LPH, 6.0 Bar Design Pressure)",
    tagNo: "HE-3101",
    poQty: 4,
    offeredQty: 2,
    inspectedQty: 2,
    acceptedQty: 2,
    rejectedQty: 0,
    unit: "Nos",
    remarks: "Hydrostatic pressure test witnessed at 9.0 bar for 45 mins. Passed with 0 leak.",
    isLocked: false,
  },
  {
    id: "item-2",
    slNo: 2,
    description: "Electropolished Sanitary Piping Spools (DN50, ASME BPE SF4 Ra < 0.38µm)",
    tagNo: "SP-BPE-01 to 24",
    poQty: 60,
    offeredQty: 24,
    inspectedQty: 24,
    acceptedQty: 20,
    rejectedQty: 4,
    unit: "Spools",
    remarks: "4 spools sent for pickling/re-buffing due to borescope root concavity.",
    isLocked: false,
  },
  {
    id: "item-3",
    slNo: 3,
    description: "Pure Steam Sampling Cooler (SS316L Double Tube Sheet Sanitary Design)",
    tagNo: "SC-901-A/B",
    poQty: 2,
    offeredQty: 2,
    inspectedQty: 2,
    acceptedQty: 2,
    rejectedQty: 0,
    unit: "Sets",
    remarks: "Dimensional check, visual and material traceability 100% compliant.",
    isLocked: false,
  },
  {
    id: "item-4",
    slNo: 4,
    description: "Pneumatic Diaphragm Actuated Sanitary Control Valve (DN40 Tri-Clamp)",
    tagNo: "CV-201",
    poQty: 12,
    offeredQty: 6,
    inspectedQty: 6,
    acceptedQty: 6,
    rejectedQty: 0,
    unit: "Nos",
    remarks: "Seat leakage rate Class VI witnessed with dry nitrogen at 4.0 bar.",
    isLocked: true,
  },
];

const INITIAL_DOCS: DocumentReview[] = [
  {
    id: "doc-1",
    slNo: 1,
    docType: "Purchase Order",
    docNo: "WO-3400077675/18.08.25",
    rev: "01",
    status: "Reviewed & Found in Order",
    approvalStatus: "Client Approved",
    remarks: "Commercial & technical scopes cross-verified with scope matrix.",
  },
  {
    id: "doc-2",
    slNo: 2,
    docType: "Approved Drawing",
    docNo: "GA-GIL-HE-3101",
    rev: "02",
    status: "Approved",
    approvalStatus: "Client Approved",
    remarks: "Fabrication drawing released for manufacture with nozzle schedule.",
  },
  {
    id: "doc-3",
    slNo: 3,
    docType: "QAP / ITP",
    docNo: "QAP-GIL-PV-2025",
    rev: "02",
    status: "Approved",
    approvalStatus: "Client Approved",
    remarks: "Quality Assurance Plan witness and hold points endorsed.",
  },
  {
    id: "doc-4",
    slNo: 4,
    docType: "Specification / Datasheet",
    docNo: "TS-PHARMA-VESSEL-REV01",
    rev: "01",
    status: "Reviewed & Found in Order",
    approvalStatus: "Client Approved",
    remarks: "Sanitary electropolish criteria and Delta-ferrite limits (<1.0%).",
  },
  {
    id: "doc-5",
    slNo: 5,
    docType: "MTC / Test Certificate",
    docNo: "MTC-JINDAL-SS316L-8821",
    rev: "00",
    status: "Reviewed & Found in Order",
    approvalStatus: "Supplier Internal",
    remarks: "EN 10204 Type 3.1 Mill Certificate with heat #H-8821 chemical/mechanical trace.",
  },
  {
    id: "doc-6",
    slNo: 6,
    docType: "Procedure / Method Statement",
    docNo: "SOP-HYDRO-IQE-04",
    rev: "03",
    status: "Approved",
    approvalStatus: "Consultant Approved",
    remarks: "Hydrostatic test procedure calibrated gauge and demineralized water chloride <25ppm.",
  },
  {
    id: "doc-7",
    slNo: 7,
    docType: "Other (WPS/PQR)",
    docNo: "WPS-SS316L-GTAW-01",
    rev: "01",
    status: "Reviewed & Found in Order",
    approvalStatus: "Client Approved",
    remarks: "Orbital GTAW welding procedure qualification per ASME Section IX.",
  },
];

const INITIAL_ACTIVITIES: InspectionActivity[] = [
  {
    id: "act-1",
    slNo: 1,
    activity: "Raw Material Identification & Heat Transfer Verification",
    referenceClause: "QAP Cl 2.1 & EN 10204 3.1",
    tpiScope: "Witness",
    result: "Satisfactory",
    remarks: "PMI test performed via XRF Analyzer on plates & nozzles. Cr: 17.2%, Ni: 12.1%, Mo: 2.2%.",
  },
  {
    id: "act-2",
    slNo: 2,
    activity: "Shell & Jacket Hydrostatic Pressure Testing",
    referenceClause: "ASME Sec VIII Div 1 & QAP Cl 5.2",
    tpiScope: "Hold",
    result: "Satisfactory",
    remarks: "Shell held at 9.0 bar for 45 mins. DM water chloride 12 ppm. Zero pressure drop observed.",
  },
  {
    id: "act-3",
    slNo: 3,
    activity: "Orbital Weld Visual & Video Borescope Examination",
    referenceClause: "ASME BPE 2024 Table MJ-8-1",
    tpiScope: "Witness",
    result: "Non-Compliant",
    remarks: "4 joints on Spools SP-BPE-18 to 21 showed root concavity >0.3mm. Punch item raised.",
  },
  {
    id: "act-4",
    slNo: 4,
    activity: "Electropolish Surface Roughness (Ra) Measurement",
    referenceClause: "ASME BPE Table SF-2.4-1",
    tpiScope: "Verify",
    result: "Satisfactory",
    remarks: "Mitutoyo Surftest SJ-210 measured average 0.28µm Ra across 10 random internal locations.",
  },
];

const INITIAL_FINDINGS: InspectionFinding[] = [
  {
    id: "find-1",
    slNo: 1,
    finding: "Shell and tube plate thickness measured 6.2mm against nominal 6.0mm. Corrosion allowance satisfied.",
    reference: "Drawing GA-GIL-HE-3101 Rev 02",
    evidenceDocNo: "DIM-REP-2026-089",
    status: "Compliant",
  },
  {
    id: "find-2",
    slNo: 2,
    finding: "Demineralized test water laboratory report confirms chloride content of 11.4 ppm (< 25 ppm limit).",
    reference: "QAP Clause 5.2.1",
    evidenceDocNo: "WATER-TEST-GIL-44",
    status: "Compliant",
  },
  {
    id: "find-3",
    slNo: 3,
    finding: "Orbital weld root concavity on spools SP-BPE-18 to 21 exceeds ASME BPE allowance.",
    reference: "ASME BPE Table MJ-8-1",
    evidenceDocNo: "NCR-GIL-2026-004",
    status: "Observation",
  },
];

const INITIAL_PUNCH: PunchItem[] = [
  {
    id: "punch-1",
    slNo: 1,
    observation: "Borescope root concavity detected on orbital joints W-14, W-15, W-18 of spools SP-BPE-18 to 21.",
    reference: "ASME BPE MJ-8-1 & NCR-GIL-2026-004",
    supplierAction: "Supplier to cut weld joint, re-prep weld bevel and execute orbital weld with internal backing purge.",
    status: "Open",
  },
  {
    id: "punch-2",
    slNo: 2,
    observation: "Digital Caliper (MIT-4401) calibration certificate due for expiration within 5 days.",
    reference: "ITP Cl 6.2 / QMS Standard",
    supplierAction: "Send instrument for NABL recalibration prior to final release inspection.",
    status: "Closed",
  },
];

const INITIAL_CALIBRATIONS: CalibrationItem[] = [
  {
    id: "cal-1",
    equipment: "Master Pressure Gauge (0-25 Bar)",
    manufacturer: "Baumer India",
    model: "MEX5-D40",
    serialNo: "PG-2024-8891",
    range: "0 - 25 bar",
    accuracy: "±0.5% F.S. (Class 0.5)",
    certNo: "NABL/CAL/2026/0992",
    dueDate: "2027-03-15",
    status: "Valid",
  },
  {
    id: "cal-2",
    equipment: "Digital Surface Roughness Tester",
    manufacturer: "Mitutoyo",
    model: "Surftest SJ-210",
    serialNo: "ST-MIT-7712",
    range: "0.01 - 100 µm Ra",
    accuracy: "±0.02 µm",
    certNo: "NABL/MIT/2026/4102",
    dueDate: "2026-12-10",
    status: "Valid",
  },
  {
    id: "cal-3",
    equipment: "Portable XRF Alloy Analyzer (PMI)",
    manufacturer: "Olympus Innov-X",
    model: "Delta Classic",
    serialNo: "XRF-OLY-3309",
    range: "Full Alloy Library (SS/Ni/Ti)",
    accuracy: "±0.1% elemental",
    certNo: "NABL/XRF/2026/1883",
    dueDate: "2027-01-20",
    status: "Valid",
  },
];

const INITIAL_ATTACHMENTS: AttachmentItem[] = [
  {
    id: "att-1",
    slNo: 1,
    description: "Hydrostatic Pressure Test Chart & Calibration Certificate",
    referencePages: "HTC-HE3101-01 (3 Pages)",
    remarks: "Chart signed by IQE and Supplier QA.",
  },
  {
    id: "att-2",
    slNo: 2,
    description: "Positive Material Identification (PMI) Test Reports",
    referencePages: "PMI-2026-089 (4 Pages)",
    remarks: "XRF spectrometer printouts attached.",
  },
  {
    id: "att-3",
    slNo: 3,
    description: "Surface Roughness (Ra) Test Records",
    referencePages: "RA-SURF-089 (2 Pages)",
    remarks: "10-point electropolish scan sheets.",
  },
  {
    id: "att-4",
    slNo: 4,
    description: "Non-Conformance Report (NCR-GIL-2026-004)",
    referencePages: "NCR-004 (2 Pages)",
    remarks: "Borescope root concavity on 4 spools.",
  },
];

export default function InspectionVisitReportPage() {
  const [selectedClient, setSelectedClient] = useState<string>("Granules India Limited - Gagillapur");
  const clientMeta = useMemo(() => CLIENT_DETAILS_MAP[selectedClient] || CLIENT_DETAILS_MAP["Granules India Limited - Gagillapur"], [selectedClient]);

  const [reportNo, setReportNo] = useState<string>("IQE-TP-03-2026-0042");
  const [inspectionDate, setInspectionDate] = useState<string>("2026-09-29");
  const [reportDate, setReportDate] = useState<string>("2026-09-29");
  const [inspectionStage, setInspectionStage] = useState<"Stage" | "Final" | "Re-inspection">("Stage");

  const [inspectionStatus, setInspectionStatus] = useState<
    "ACCEPTED" | "ACCEPTED WITH COMMENTS" | "PARTIALLY ACCEPTED" | "NOT ACCEPTED" | "HOLD / RE-INSPECTION REQUIRED"
  >("ACCEPTED WITH COMMENTS");

  const [conclusionSummary, setConclusionSummary] = useState<string>(
    "Inspection carried out in accordance with approved QAP and technical specifications. Condenser HE-3101 and Sampling Coolers SC-901 passed hydrostatic pressure testing, dimensional inspection, and PMI material identification without non-conformities. Sanitary piping spools SP-BPE-01 to 20 accepted; spools SP-BPE-21 to 24 held under NCR-GIL-2026-004 for orbital weld root concavity rectification. Inspection Release Note (IRN IQE-TP-04) may be issued for accepted items once punch items are formally acknowledged."
  );

  const [supplierComments, setSupplierComments] = useState<string>(
    "Supplier accepts findings. Rectification of orbital joints for spools SP-BPE-21 to 24 will be completed within 3 days and offered for re-inspection."
  );

  const [items, setItems] = useState<InspectedItem[]>(INITIAL_ITEMS);
  const [docs, setDocs] = useState<DocumentReview[]>(INITIAL_DOCS);
  const [activities, setActivities] = useState<InspectionActivity[]>(INITIAL_ACTIVITIES);
  const [findings, setFindings] = useState<InspectionFinding[]>(INITIAL_FINDINGS);
  const [punchList, setPunchList] = useState<PunchItem[]>(INITIAL_PUNCH);
  const [calibrations, setCalibrations] = useState<CalibrationItem[]>(INITIAL_CALIBRATIONS);
  const [attachments, setAttachments] = useState<AttachmentItem[]>(INITIAL_ATTACHMENTS);

  const [search, setSearch] = useState<string>("");
  const [isInlineEditMode, setIsInlineEditMode] = useState<boolean>(false);
  const [isInlineEditPunch, setIsInlineEditPunch] = useState<boolean>(false);
  const [isInlineEditCalibrations, setIsInlineEditCalibrations] = useState<boolean>(false);
  const [isInlineEditDocs, setIsInlineEditDocs] = useState<boolean>(false);
  const [isInlineEditAttachments, setIsInlineEditAttachments] = useState<boolean>(false);
  const [isInlineEditPhotos, setIsInlineEditPhotos] = useState<boolean>(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([
    { id: "ph-1", title: "Photo 1", desc: "Hydrostatic Test at 9.0 Bar with Calibrated Master Gauge", tag: "HE-3101 Shell" },
    { id: "ph-2", title: "Photo 2", desc: "Digital Surface Electropolish Ra Measurement Scan", tag: "Ra = 0.28 µm" },
    { id: "ph-3", title: "Photo 3", desc: "Borescope Inspection Video Output of Orbital Weld W-14", tag: "Root Concavity Flagged" },
    { id: "ph-4", title: "Photo 4", desc: "Material Heat Stamping & Nameplate Verification", tag: "Heat #H-8821 Riveted" },
  ]);
  const [editingItem, setEditingItem] = useState<InspectedItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InspectedItem | null>(null);
  const [isTabSwitching, setIsTabSwitching] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showMetaEditModal, setShowMetaEditModal] = useState<boolean>(false);
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);

  const triggerSaveToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2800);
  };

  const handleAddDoc = () => {
    const newDoc: DocumentReview = {
      id: `doc-${Date.now()}`,
      slNo: docs.length + 1,
      docType: "Engineering Drawing / Fabrication Drawing",
      docNo: `DWG-${Date.now().toString().slice(-4)}`,
      rev: "R0",
      status: "Approved",
      approvalStatus: "Code 1 Approved by Client",
      remarks: "Reviewed at site during inspection",
    };
    setDocs([...docs, newDoc]);
    triggerSaveToast();
  };

  const handleAddAttachment = () => {
    const newAtt: AttachmentItem = {
      id: `att-${Date.now()}`,
      slNo: attachments.length + 1,
      description: "Inspection Certificate / Quality Record",
      referencePages: `TC-IQE-${Date.now().toString().slice(-4)} (2 Pages)`,
      remarks: "Verified and attached to dossier",
    };
    setAttachments([...attachments, newAtt]);
    triggerSaveToast();
  };

  const handleAddPhoto = () => {
    const newPh: PhotoItem = {
      id: `ph-${Date.now()}`,
      title: `Photo ${photos.length + 1}`,
      desc: "Physical Inspection Verification Record",
      tag: "Site Inspection Finding",
    };
    setPhotos([...photos, newPh]);
    triggerSaveToast();
  };

  const handleAddPunch = () => {
    const newP: PunchItem = {
      id: `punch-${Date.now()}`,
      slNo: punchList.length + 1,
      observation: "New punch observation noted during physical walk-through",
      reference: "Drawing GA-01 Note 4",
      supplierAction: "Supplier to rectify prior to final punch clearance",
      status: "Open",
    };
    setPunchList([...punchList, newP]);
    triggerSaveToast();
  };

  const handleAddCalibration = () => {
    const newC: CalibrationItem = {
      id: `cal-${Date.now()}`,
      equipment: "Digital Vernier Caliper (0-300mm)",
      manufacturer: "Mitutoyo",
      model: "CD-6 CSX",
      serialNo: `VC-${Date.now().toString().slice(-4)}`,
      range: "0 - 300 mm",
      accuracy: "±0.02 mm",
      certNo: "NABL/CAL/2026/102",
      dueDate: "2027-04-30",
      status: "Valid",
    };
    setCalibrations([...calibrations, newC]);
    triggerSaveToast();
  };

  const handleToggleLockItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isLocked: !it.isLocked } : it))
    );
  };

  const handleExportSingleRowCSV = (item: InspectedItem) => {
    const headers = ["Sl No", "Description", "Tag / Serial No", "PO Qty", "Offered", "Inspected", "Accepted", "Rejected", "Remarks"];
    const row = [item.slNo, `"${(item.description || "").replace(/"/g, '""')}"`, `"${item.tagNo || ""}"`, item.poQty, item.offeredQty, item.inspectedQty, item.acceptedQty, item.rejectedQty, `"${(item.remarks || "").replace(/"/g, '""')}"`];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), row.join(",")].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `IVR_Item_${item.tagNo || item.slNo}.csv`);
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
    const totalRejected = items.reduce((acc, i) => acc + i.rejectedQty, 0);
    const openPunchCount = punchList.filter((p) => p.status === "Open").length;
    return { totalOffered, totalInspected, totalAccepted, totalRejected, openPunchCount };
  }, [items, punchList]);

  const handleExportCSV = () => {
    const headers = [
      "Sl. No.",
      "Item Description",
      "Tag / Serial No.",
      "PO Qty",
      "Offered Qty",
      "Inspected Qty",
      "Accepted Qty",
      "Rejected Qty",
      "Remarks",
    ];
    const rows = items.map((i) => [
      i.slNo,
      `"${i.description.replace(/"/g, '""')}"`,
      `"${i.tagNo}"`,
      i.poQty,
      i.offeredQty,
      i.inspectedQty,
      i.acceptedQty,
      i.rejectedQty,
      `"${i.remarks.replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportNo}_Quantities.csv`);
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
          <span>Inspection Visit Report Saved</span>
        </div>
      )}

      {/* Main Clean UI Document Container following Word Document Flow */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
        {/* Header Strip & Document Title (Bill Verification Standard) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#003366] dark:text-sky-300 tracking-tight font-heading flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-[#003366] dark:text-sky-300" />
              <span>Inspection Visit Report</span>
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

            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
              <span className="text-slate-500 text-[11px] font-bold">Stage:</span>
              <span className="text-[#003366] dark:text-sky-300 font-extrabold uppercase">{inspectionStage}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 text-[11px] font-bold">Ref:</span>
              <span className="text-slate-800 font-mono font-bold">{clientMeta.rfiRef}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowMetaEditModal(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer"
              title="Edit Details"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={() => setShowPdfPreview(true)}
              className="px-3 py-1.5 bg-[#0084bf] hover:bg-[#0073a8] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Preview Live PDF"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Live PDF</span>
            </button>

            <button
              onClick={async () => {
                await downloadPdfFile(
                  `${API_BASE}/api/tpi/preview/TP03.pdf`,
                  `IVR_Report_${clientMeta.rfiRef || "IQE-TP-03"}.pdf`,
                  "/sample-pdfs/TP03.pdf"
                );
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Download PDF Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button aria-label="Save Visit Report"
              onClick={triggerSaveToast}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition-all shadow-sm cursor-pointer"
              title="Save Visit Report"
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

        {/* Section Jump Links for Quick Navigation (Sticky so inspector can use anytime while scrolling) */}
        <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          {isTabSwitching && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center gap-2 z-10 text-xs font-bold text-[#0084bf]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Navigating to section...</span>
            </div>
          )}
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Jump to:</span>
          {[
            { id: "sec-1", label: "1.0 Details" },
            { id: "sec-2", label: "2.0 Material Offered" },
            { id: "sec-3", label: "3.0 Documents" },
            { id: "sec-4", label: "4.0 Scope & Activities" },
            { id: "sec-5", label: "5.0 Findings" },
            { id: "sec-6", label: "6.0 NCR / Punch" },
            { id: "sec-7", label: "7.0 Calibration" },
            { id: "sec-8", label: "8.0 Conclusion" },
            { id: "sec-9", label: "9.0 Attachments" },
            { id: "sec-10", label: "10.0 Photos" },
            { id: "sec-11", label: "11.0 Signatures" },
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

        {/* Controlled Document Running Header (matches IQE-TP-03 PDF as is) */}
        <div className="keep-light border border-slate-200 rounded-xl p-4 bg-slate-50 text-slate-900 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-200 pb-3 gap-2">
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 uppercase tracking-tight">
                IDEAL QUALITY ENGINEERS (I) PVT. LTD.
              </h2>
              <p className="text-xs text-slate-500 font-semibold">Third Party Inspection Services</p>
            </div>
            <div className="text-right font-mono text-xs space-y-0.5 sm:self-auto">
              <div className="font-extrabold text-slate-800">FORM NO.: IQE-TP-03</div>
              <div className="text-slate-500 text-[11px]">REVISION: 00</div>
              <div className="font-bold text-[#003366]">REPORT NO.: {reportNo}</div>
            </div>
          </div>

          <div className="text-center py-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-[#003366] uppercase tracking-tight">
              INSPECTION VISIT REPORT
            </h3>
            <p className="text-xs italic text-slate-500">Issued by Ideal Quality Engineers (I) Pvt. Ltd.</p>
          </div>

          {/* Top KV Document Metadata Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
            <table className="w-full text-xs">
              <colgroup>
                <col className="w-1/4 bg-slate-50 border-r border-slate-200 font-semibold text-slate-600" />
                <col className="w-1/4 border-r border-slate-200 font-bold text-slate-900" />
                <col className="w-1/4 bg-slate-50 border-r border-slate-200 font-semibold text-slate-600" />
                <col className="w-1/4 font-bold text-slate-900" />
              </colgroup>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5">Report No.</td>
                  <td className="p-2.5 font-mono">{reportNo}</td>
                  <td className="p-2.5">Inspection Date</td>
                  <td className="p-2.5 font-mono">{inspectionDate}</td>
                </tr>
                <tr>
                  <td className="p-2.5">RFI No. &amp; Date</td>
                  <td className="p-2.5 font-mono">{clientMeta.rfiRef} &bull; {clientMeta.rfiDate}</td>
                  <td className="p-2.5">Inspection Stage</td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-3">
                      {(["Stage", "Final", "Re-inspection"] as const).map((st) => (
                        <label key={st} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="inspectionStageDoc"
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
                <tr>
                  <td className="p-2.5">Report Date</td>
                  <td className="p-2.5 font-mono">{reportDate}</td>
                  <td className="p-2.5">Inspection Location</td>
                  <td className="p-2.5">{clientMeta.projectLocation}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1.0 INSPECTION & PROJECT DETAILS (As is from IQE-TP-03)          */}
        {/* ========================================================================= */}
        <div id="sec-1" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
            <span className="uppercase tracking-wider">1.0 INSPECTION &amp; PROJECT DETAILS</span>
            <span className="font-mono text-[11px] text-sky-200">IQE-TP-03 Clause 1.0</span>
          </div>

          <div className="overflow-x-auto bg-white">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[11px]">
                  <th className="p-2.5 w-1/4 border-r border-slate-200 text-left">Particular</th>
                  <th className="p-2.5 w-1/4 border-r border-slate-200 text-left">Details</th>
                  <th className="p-2.5 w-1/4 border-r border-slate-200 text-left">Particular</th>
                  <th className="p-2.5 w-1/4 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-medium text-slate-600 border-r border-slate-200 bg-slate-50/50">Customer</td>
                  <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{clientMeta.customer}</td>
                  <td className="p-2.5 font-medium text-slate-600 border-r border-slate-200 bg-slate-50/50">Project</td>
                  <td className="p-2.5 font-bold text-slate-900">{clientMeta.projectName}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-600 border-r border-slate-200 bg-slate-50/50">Supplier</td>
                  <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{clientMeta.supplier}</td>
                  <td className="p-2.5 font-medium text-slate-600 border-r border-slate-200 bg-slate-50/50">Sub-Supplier / Manufacturer</td>
                  <td className="p-2.5 font-bold text-slate-900">{clientMeta.subSupplier}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-600 border-r border-slate-200 bg-slate-50/50">Supplier PO No. &amp; Date</td>
                  <td className="p-2.5 font-mono font-bold text-slate-900 border-r border-slate-200">{clientMeta.poNumber} &bull; {clientMeta.poDate}</td>
                  <td className="p-2.5 font-medium text-slate-600 border-r border-slate-200 bg-slate-50/50">Location</td>
                  <td className="p-2.5 font-bold text-slate-900">{clientMeta.projectLocation}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-600 border-r border-slate-200 bg-slate-50/50">RFI Reference &amp; Date</td>
                  <td className="p-2.5 font-mono font-bold text-slate-900 border-r border-slate-200">{clientMeta.rfiRef} &bull; {clientMeta.rfiDate}</td>
                  <td className="p-2.5 font-medium text-slate-600 border-r border-slate-200 bg-slate-50/50">IQE Inspector</td>
                  <td className="p-2.5 font-bold text-[#003366] dark:text-sky-300">{clientMeta.inspector}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-600 border-r border-slate-200 bg-slate-50/50">Applicable QAP / ITP</td>
                  <td className="p-2.5 font-mono font-bold text-[#003366] dark:text-sky-300 border-r border-slate-200">{clientMeta.applicableQAP}</td>
                  <td className="p-2.5 font-medium text-slate-600 border-r border-slate-200 bg-slate-50/50">Applicable Specification</td>
                  <td className="p-2.5 font-mono font-bold text-slate-900">{clientMeta.applicableSpec}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2.0 MATERIAL / EQUIPMENT OFFERED FOR INSPECTION (Table 2)         */}
        {/* ========================================================================= */}
        <div id="sec-2" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider">2.0 MATERIAL / EQUIPMENT OFFERED FOR INSPECTION</span>
              <span className="px-2 py-0.2 rounded-full bg-white/20 text-white font-mono text-[11px]">
                {filteredItems.length} items
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
                  <th className="py-2.5 px-3 w-12 text-center">Sl. No.</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Item Description</th>
                  <th className="py-2.5 px-3 w-32 font-mono">Tag / Serial No.</th>
                  <th className="py-2.5 px-3 w-16 text-right">PO Qty</th>
                  <th className="py-2.5 px-3 w-16 text-right">Offered</th>
                  <th className="py-2.5 px-3 w-16 text-right">Inspected</th>
                  <th className="py-2.5 px-3 w-16 text-right">Accepted</th>
                  <th className="py-2.5 px-3 w-16 text-right">Rejected</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Remarks</th>
                  <th className="py-2.5 px-3 min-w-[210px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">
                      {isInlineEditMode ? (
                        <input aria-label="Sl. No."
                          type="number"
                          value={item.slNo}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setItems(items.map((i) => (i.id === item.id ? { ...i, slNo: val } : i)));
                          }}
                          className="w-12 p-1 text-center font-mono bg-amber-50 border border-amber-300 rounded text-xs font-bold"
                        />
                      ) : (
                        item.slNo
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
                          className="w-14 p-1 text-right font-mono bg-amber-50 border border-amber-300 rounded font-bold"
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
                          className="w-14 p-1 text-right font-mono bg-amber-50 border border-amber-300 rounded font-bold"
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
                          className="w-14 p-1 text-right font-mono bg-amber-50 border border-amber-300 rounded font-bold"
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
                          className="w-14 p-1 text-right font-mono bg-amber-50 border border-amber-300 rounded font-bold"
                        />
                      ) : (
                        item.acceptedQty
                      )}
                    </td>

                    <td className="py-2 px-3 text-right font-mono text-rose-700 font-bold">
                      {isInlineEditMode ? (
                        <input aria-label="Rejected Qty"
                          type="number"
                          value={item.rejectedQty}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setItems(items.map((i) => (i.id === item.id ? { ...i, rejectedQty: val } : i)));
                          }}
                          className="w-14 p-1 text-right font-mono bg-amber-50 border border-amber-300 rounded font-bold"
                        />
                      ) : (
                        item.rejectedQty
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
                          onClick={() => downloadPdfFile(`${API_BASE}/api/tpi/preview/TP03.pdf`, `IVR_Report_Item_${item.tagNo || item.slNo}.pdf`, "/sample-pdfs/TP03.pdf")}
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
        {/* SECTION 3.0 DOCUMENTS & REFERENCES REVIEWED (Word Document Table 3)        */}
        {/* ========================================================================= */}
        <div id="sec-3" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider">3.0 DOCUMENTS &amp; REFERENCES REVIEWED</span>
              <span className="px-2 py-0.2 rounded-full bg-white/20 text-white font-mono text-[11px]">
                {docs.length} docs
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsInlineEditDocs(!isInlineEditDocs)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isInlineEditDocs ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>{isInlineEditDocs ? "Exit Inline Edit" : "Inline Edit"}</span>
              </button>

              <button
                type="button"
                onClick={handleAddDoc}
                className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Document</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3 w-14 text-center">Sl. No.</th>
                  <th className="py-2.5 px-3 w-48">Document / Reference</th>
                  <th className="py-2.5 px-3 w-48 font-mono">Document No.</th>
                  <th className="py-2.5 px-3 w-16 text-center">Rev.</th>
                  <th className="py-2.5 px-3 w-36">Status</th>
                  <th className="py-2.5 px-3 w-36">Approval Status</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Remarks</th>
                  {isInlineEditDocs && <th className="py-2.5 px-3 w-16 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">{doc.slNo}</td>
                    <td className="py-2 px-3 font-bold text-slate-800">
                      {isInlineEditDocs ? (
                        <input aria-label="Doc type"
                          type="text"
                          value={doc.docType}
                          onChange={(e) => setDocs(docs.map((d) => (d.id === doc.id ? { ...d, docType: e.target.value } : d)))}
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-bold"
                        />
                      ) : (
                        doc.docType
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-[#003366] dark:text-sky-300">
                      {isInlineEditDocs ? (
                        <input aria-label="Doc No."
                          type="text"
                          value={doc.docNo}
                          onChange={(e) => setDocs(docs.map((d) => (d.id === doc.id ? { ...d, docNo: e.target.value } : d)))}
                          className="w-full p-1 font-mono bg-amber-50 border border-amber-300 rounded text-xs font-bold text-[#003366] dark:text-sky-300"
                        />
                      ) : (
                        doc.docNo
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600">
                      {isInlineEditDocs ? (
                        <input aria-label="Rev."
                          type="text"
                          value={doc.rev}
                          onChange={(e) => setDocs(docs.map((d) => (d.id === doc.id ? { ...d, rev: e.target.value } : d)))}
                          className="w-12 p-1 text-center font-mono bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        doc.rev
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {isInlineEditDocs ? (
                        <input aria-label="Status"
                          type="text"
                          value={doc.status}
                          onChange={(e) => setDocs(docs.map((d) => (d.id === doc.id ? { ...d, status: e.target.value } : d)))}
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {doc.status}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      {isInlineEditDocs ? (
                        <input aria-label="Approval status"
                          type="text"
                          value={doc.approvalStatus}
                          onChange={(e) => setDocs(docs.map((d) => (d.id === doc.id ? { ...d, approvalStatus: e.target.value } : d)))}
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        doc.approvalStatus
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px]">
                      {isInlineEditDocs ? (
                        <input aria-label="Remarks"
                          type="text"
                          value={doc.remarks}
                          onChange={(e) => setDocs(docs.map((d) => (d.id === doc.id ? { ...d, remarks: e.target.value } : d)))}
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        doc.remarks
                      )}
                    </td>
                    {isInlineEditDocs && (
                      <td className="py-2 px-3 text-center">
                        <button aria-label="Delete Document"
                          type="button"
                          onClick={() => setDocs(docs.filter((d) => d.id !== doc.id))}
                          className="p-1 rounded text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4.0 INSPECTION SCOPE & ACTIVITIES (Word Document Table 4)         */}
        {/* ========================================================================= */}
        <div id="sec-4" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
            <span className="uppercase tracking-wider">4.0 INSPECTION SCOPE &amp; ACTIVITIES</span>
            <span className="font-mono text-[11px] text-sky-200">IQE-TP-03 Clause 4.0</span>
          </div>

          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 italic">
            Inspection was carried out with reference to the applicable Purchase Order, approved QAP/ITP, drawings, specifications and inspection requirements made available at the time of inspection.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3 w-14 text-center">Sl. No.</th>
                  <th className="py-2.5 px-3 min-w-[240px]">Inspection Activity / Description</th>
                  <th className="py-2.5 px-3 w-56">Reference (QAP/Clause/Spec)</th>
                  <th className="py-2.5 px-3 w-28 text-center">TPI Scope</th>
                  <th className="py-2.5 px-3 w-28 text-center">Result / Status</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">{act.slNo}</td>
                    <td className="py-2 px-3 font-medium text-slate-900">{act.activity}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{act.referenceClause}</td>
                    <td className="py-2 px-3 text-center font-bold font-mono text-[#003366] dark:text-sky-300">{act.tpiScope}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          act.result === "Satisfactory"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {act.result}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px]">{act.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5.0 INSPECTION FINDINGS (Word Document Table 5)                   */}
        {/* ========================================================================= */}
        <div id="sec-5" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
            <span className="uppercase tracking-wider">5.0 INSPECTION FINDINGS</span>
            <span className="font-mono text-[11px] text-sky-200">IQE-TP-03 Clause 5.0</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3 w-14 text-center">Sl. No.</th>
                  <th className="py-2.5 px-3 min-w-[260px]">Finding / Observation</th>
                  <th className="py-2.5 px-3 w-48">Reference</th>
                  <th className="py-2.5 px-3 w-48 font-mono">Evidence / Document No.</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {findings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">{f.slNo}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{f.finding}</td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">{f.reference}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{f.evidenceDocNo}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 6.0 NON-CONFORMITIES / AREAS OF CONCERN (Word Document Table 6)   */}
        {/* ========================================================================= */}
        <div id="sec-6" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider">6.0 NON-CONFORMITIES / AREAS OF CONCERN</span>
              <span className="px-2 py-0.2 rounded-full bg-white/20 text-white font-mono text-[11px]">
                {punchList.length} NCRs
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsInlineEditPunch(!isInlineEditPunch)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isInlineEditPunch ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>{isInlineEditPunch ? "Exit Inline Edit" : "Inline Edit"}</span>
              </button>

              <button
                onClick={handleAddPunch}
                className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add NCR</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3 w-14 text-center">Sl. No.</th>
                  <th className="py-2.5 px-3 min-w-[260px]">Observation / Non-Conformity</th>
                  <th className="py-2.5 px-3 w-48">Reference</th>
                  <th className="py-2.5 px-3 min-w-[240px]">Supplier Response / Action</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {punchList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">{p.slNo}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {isInlineEditPunch ? (
                        <input aria-label="Observation"
                          type="text"
                          value={p.observation}
                          onChange={(e) =>
                            setPunchList(punchList.map((x) => (x.id === p.id ? { ...x, observation: e.target.value } : x)))
                          }
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        p.observation
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {isInlineEditPunch ? (
                        <input aria-label="Reference"
                          type="text"
                          value={p.reference}
                          onChange={(e) =>
                            setPunchList(punchList.map((x) => (x.id === p.id ? { ...x, reference: e.target.value } : x)))
                          }
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        p.reference
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {isInlineEditPunch ? (
                        <input aria-label="Supplier action"
                          type="text"
                          value={p.supplierAction}
                          onChange={(e) =>
                            setPunchList(punchList.map((x) => (x.id === p.id ? { ...x, supplierAction: e.target.value } : x)))
                          }
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        p.supplierAction
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isInlineEditPunch ? (
                        <select aria-label="Status"
                          value={p.status}
                          onChange={(e) =>
                            setPunchList(punchList.map((x) => (x.id === p.id ? { ...x, status: e.target.value as any } : x)))
                          }
                          className="p-1 font-bold text-[11px] bg-white border border-slate-300 rounded"
                        >
                          <option value="Open">Open</option>
                          <option value="Closed">Closed</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            p.status === "Open"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {p.status}
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
        {/* SECTION 7.0 INSTRUMENTS / CALIBRATION DETAILS (Word Document Table 7)      */}
        {/* ========================================================================= */}
        <div id="sec-7" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider">7.0 INSTRUMENTS / CALIBRATION DETAILS</span>
              <span className="px-2 py-0.2 rounded-full bg-white/20 text-white font-mono text-[11px]">
                {calibrations.length} instruments
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsInlineEditCalibrations(!isInlineEditCalibrations)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isInlineEditCalibrations ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>{isInlineEditCalibrations ? "Exit Inline Edit" : "Inline Edit"}</span>
              </button>

              <button
                onClick={handleAddCalibration}
                className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Equipment</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3 min-w-[200px]">Instrument / Equipment</th>
                  <th className="py-2.5 px-3 w-32">Manufacturer</th>
                  <th className="py-2.5 px-3 w-28">Model</th>
                  <th className="py-2.5 px-3 w-32 font-mono">Serial No.</th>
                  <th className="py-2.5 px-3 w-28">Range</th>
                  <th className="py-2.5 px-3 w-28">Accuracy</th>
                  <th className="py-2.5 px-3 w-40 font-mono">Calibration Cert. No.</th>
                  <th className="py-2.5 px-3 w-28 font-mono text-center">Calibration Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {calibrations.map((cal) => (
                  <tr key={cal.id} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {isInlineEditCalibrations ? (
                        <input aria-label="Equipment"
                          type="text"
                          value={cal.equipment}
                          onChange={(e) =>
                            setCalibrations(calibrations.map((x) => (x.id === cal.id ? { ...x, equipment: e.target.value } : x)))
                          }
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-bold"
                        />
                      ) : (
                        cal.equipment
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      {isInlineEditCalibrations ? (
                        <input aria-label="Manufacturer"
                          type="text"
                          value={cal.manufacturer}
                          onChange={(e) =>
                            setCalibrations(calibrations.map((x) => (x.id === cal.id ? { ...x, manufacturer: e.target.value } : x)))
                          }
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        cal.manufacturer
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      {isInlineEditCalibrations ? (
                        <input aria-label="Model"
                          type="text"
                          value={cal.model}
                          onChange={(e) =>
                            setCalibrations(calibrations.map((x) => (x.id === cal.id ? { ...x, model: e.target.value } : x)))
                          }
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        cal.model
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-[#003366] dark:text-sky-300">
                      {isInlineEditCalibrations ? (
                        <input aria-label="Serial No."
                          type="text"
                          value={cal.serialNo}
                          onChange={(e) =>
                            setCalibrations(calibrations.map((x) => (x.id === cal.id ? { ...x, serialNo: e.target.value } : x)))
                          }
                          className="w-full p-1 font-mono bg-amber-50 border border-amber-300 rounded text-xs font-bold"
                        />
                      ) : (
                        cal.serialNo
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {isInlineEditCalibrations ? (
                        <input aria-label="Range"
                          type="text"
                          value={cal.range}
                          onChange={(e) =>
                            setCalibrations(calibrations.map((x) => (x.id === cal.id ? { ...x, range: e.target.value } : x)))
                          }
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        cal.range
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{cal.accuracy}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{cal.certNo}</td>
                    <td className="py-2 px-3 font-mono font-bold text-center text-emerald-700">
                      {isInlineEditCalibrations ? (
                        <input aria-label="Due date"
                          type="date"
                          value={cal.dueDate}
                          onChange={(e) =>
                            setCalibrations(calibrations.map((x) => (x.id === cal.id ? { ...x, dueDate: e.target.value } : x)))
                          }
                          className="p-1 font-mono text-xs bg-amber-50 border border-amber-300 rounded"
                        />
                      ) : (
                        cal.dueDate
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 8.0 INSPECTION RESULT / CONCLUSION (Word Document Section 8.0)    */}
        {/* ========================================================================= */}
        <div id="sec-8" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
            <span className="uppercase tracking-wider">8.0 INSPECTION RESULT / CONCLUSION</span>
            <span className="font-mono text-[11px] text-sky-200">IQE-TP-03 Clause 8.0</span>
          </div>

          <div className="p-4 bg-white space-y-4 text-xs">
            <div>
              <span className="text-slate-500 font-bold block mb-2 uppercase text-[11px]">
                INSPECTION STATUS:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    "ACCEPTED",
                    "ACCEPTED WITH COMMENTS",
                    "PARTIALLY ACCEPTED",
                    "NOT ACCEPTED",
                    "HOLD / RE-INSPECTION REQUIRED",
                  ] as const
                ).map((st) => (
                  <label
                    key={st}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer font-bold transition-all ${
                      inspectionStatus === st
                        ? "bg-sky-50 border-[#003366] text-[#003366] dark:text-sky-300"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="inspectionStatus"
                      checked={inspectionStatus === st}
                      onChange={() => setInspectionStatus(st)}
                      className="text-[#003366]"
                    />
                    <span>{st}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-bold block mb-1">Conclusion / summary of inspection:</span>
              <textarea aria-label="Conclusion summary"
                rows={3}
                value={conclusionSummary}
                onChange={(e) => setConclusionSummary(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-slate-800 leading-relaxed font-sans"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 9.0 ATTACHMENTS (Word Document Table 9.0)                         */}
        {/* ========================================================================= */}
        <div id="sec-9" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider">9.0 ATTACHMENTS</span>
              <span className="px-2 py-0.2 rounded-full bg-white/20 text-white font-mono text-[11px]">
                {attachments.length} items
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsInlineEditAttachments(!isInlineEditAttachments)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isInlineEditAttachments ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>{isInlineEditAttachments ? "Exit Inline Edit" : "Inline Edit"}</span>
              </button>

              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Attachment</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3 w-14 text-center">Sl. No.</th>
                  <th className="py-2.5 px-3 min-w-[260px]">Attachment Description</th>
                  <th className="py-2.5 px-3 w-56 font-mono">Reference / No. of Pages</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Remarks</th>
                  {isInlineEditAttachments && <th className="py-2.5 px-3 w-16 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {attachments.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">{att.slNo}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {isInlineEditAttachments ? (
                        <input aria-label="Description"
                          type="text"
                          value={att.description}
                          onChange={(e) => setAttachments(attachments.map((a) => (a.id === att.id ? { ...a, description: e.target.value } : a)))}
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                          <span>{att.description}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 font-bold">
                      {isInlineEditAttachments ? (
                        <input aria-label="Reference pages"
                          type="text"
                          value={att.referencePages}
                          onChange={(e) => setAttachments(attachments.map((a) => (a.id === att.id ? { ...a, referencePages: e.target.value } : a)))}
                          className="w-full p-1 font-mono bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        att.referencePages
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {isInlineEditAttachments ? (
                        <input aria-label="Remarks"
                          type="text"
                          value={att.remarks}
                          onChange={(e) => setAttachments(attachments.map((a) => (a.id === att.id ? { ...a, remarks: e.target.value } : a)))}
                          className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        att.remarks
                      )}
                    </td>
                    {isInlineEditAttachments && (
                      <td className="py-2.5 px-3 text-center">
                        <button aria-label="Delete Attachment"
                          type="button"
                          onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))}
                          className="p-1 rounded text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Attachment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 10.0 PHOTOGRAPHS (Word Document Section 10.0)                     */}
        {/* ========================================================================= */}
        <div id="sec-10" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider">10.0 PHOTOGRAPHS</span>
              <span className="px-2 py-0.2 rounded-full bg-white/20 text-white font-mono text-[11px]">
                {photos.length} photos
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsInlineEditPhotos(!isInlineEditPhotos)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isInlineEditPhotos ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>{isInlineEditPhotos ? "Exit Inline Edit" : "Inline Edit"}</span>
              </button>

              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Photo</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-white space-y-3 text-xs">
            <p className="text-[11px] text-slate-500">
              Photographs are taken with prior permission from the supplier/vendor. Photographs shall be included as applicable.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {photos.map((ph, idx) => (
                <div key={ph.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 flex flex-col justify-between relative group">
                  {isInlineEditPhotos && (
                    <button aria-label="Delete Photo"
                      type="button"
                      onClick={() => setPhotos(photos.filter((p) => p.id !== ph.id))}
                      className="absolute top-2 right-2 p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 shadow-sm cursor-pointer z-10"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <div className="h-28 rounded-lg bg-slate-200 border border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-1">
                    <Camera className="w-6 h-6 text-slate-400" />
                    <span className="text-[11px] font-mono">[Photograph {idx + 1}]</span>
                  </div>
                  <div className="space-y-1">
                    {isInlineEditPhotos ? (
                      <>
                        <input aria-label="Photo title"
                          type="text"
                          value={ph.title}
                          onChange={(e) => setPhotos(photos.map((p) => (p.id === ph.id ? { ...p, title: e.target.value } : p)))}
                          className="w-full p-1 font-mono text-[11px] font-extrabold text-[#003366] dark:text-sky-300 bg-amber-50 border border-amber-300 rounded"
                          placeholder="Photo title"
                        />
                        <input aria-label="Photo description"
                          type="text"
                          value={ph.desc}
                          onChange={(e) => setPhotos(photos.map((p) => (p.id === ph.id ? { ...p, desc: e.target.value } : p)))}
                          className="w-full p-1 text-[11px] font-bold text-slate-800 bg-amber-50 border border-amber-300 rounded"
                          placeholder="Description"
                        />
                        <input aria-label="Photo tag"
                          type="text"
                          value={ph.tag}
                          onChange={(e) => setPhotos(photos.map((p) => (p.id === ph.id ? { ...p, tag: e.target.value } : p)))}
                          className="w-full p-1 text-[11px] font-mono text-slate-500 bg-amber-50 border border-amber-300 rounded"
                          placeholder="Tag / Finding"
                        />
                      </>
                    ) : (
                      <>
                        <span className="font-mono text-[11px] font-extrabold text-[#003366] dark:text-sky-300 block">{ph.title}</span>
                        <p className="font-bold text-slate-800 text-[11px] mt-0.5">{ph.desc}</p>
                        <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{ph.tag}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 11.0 ACKNOWLEDGEMENT & SIGNATURES (Word Document Section 11.0)    */}
        {/* ========================================================================= */}
        <div id="sec-11" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
            <span className="uppercase tracking-wider">11.0 ACKNOWLEDGEMENT &amp; SIGNATURES</span>
            <span className="font-mono text-[11px] text-sky-200">IQE-TP-03 Clause 11.0</span>
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
                <span className="text-slate-500 font-medium block">IQE Inspector:</span>
                <p className="font-bold text-slate-900 text-sm">{clientMeta.inspector}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium block">IQE Stamp &amp; Endorsement:</span>
                <p className="font-bold text-slate-800">Third Party Inspection Agency Seal</p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-blue-700 font-bold font-mono">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Digitally Certified via IQE Platform &bull; {reportDate}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50/50 text-xs space-y-1">
            <span className="text-slate-500 font-bold block">Supplier&apos;s Representative Comments (if any):</span>
            <textarea aria-label="Supplier comments"
              rows={2}
              value={supplierComments}
              onChange={(e) => setSupplierComments(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-800"
            />
          </div>
        </div>

        {/* DISCLAIMER & FORMAL END OF REPORT */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
          <strong className="text-slate-700 uppercase">DISCLAIMER:</strong> The inspection report is issued without prejudice to the contractual obligations of the supplier and does not relieve the supplier/manufacturer from the responsibilities and obligations set forth in the Purchase Order and other approved documents. This report reflects the observations made during the inspection at the time and location stated herein and is based on the documents, items and information made available to IQE during the inspection. The report does not relieve the manufacturer/supplier of its contractual, statutory or regulatory responsibilities.
          <div className="text-center font-mono font-bold text-slate-400 mt-2 tracking-widest text-[11px]">
            — END OF REPORT —
          </div>
        </div>

      </div>

      {/* VIEW ITEM DETAILS MODAL */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#0084bf]" />
                <h3 className="text-base font-extrabold text-slate-900 font-heading">
                  Visit Inspection Item Dossier &bull; {viewingItem.tagNo}
                </h3>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setViewingItem(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-500 uppercase font-bold">Scope / Description</span>
                <p className="font-semibold text-slate-900">{viewingItem.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block">Tag / Serial No</span>
                  <span className="font-mono font-bold text-[#003366] dark:text-sky-300">{viewingItem.tagNo}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block">Sl No</span>
                  <span className="font-mono font-bold text-slate-800">#{viewingItem.slNo}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[11px] text-blue-700 uppercase font-bold block">PO Qty</span>
                  <span className="font-mono font-extrabold text-blue-900 text-sm">{viewingItem.poQty}</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] text-amber-700 uppercase font-bold block">Offered</span>
                  <span className="font-mono font-extrabold text-amber-900 text-sm">{viewingItem.offeredQty}</span>
                </div>
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-[11px] text-purple-700 uppercase font-bold block">Inspected</span>
                  <span className="font-mono font-extrabold text-purple-900 text-sm">{viewingItem.inspectedQty}</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 uppercase font-bold block">Accepted</span>
                  <span className="font-mono font-extrabold text-emerald-900 text-sm">{viewingItem.acceptedQty}</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[11px] text-rose-700 uppercase font-bold block">Rejected</span>
                  <span className="font-mono font-extrabold text-rose-900 text-sm">{viewingItem.rejectedQty}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-500 uppercase font-bold">Inspector Observations &amp; Verification Remarks</span>
                <p className="text-slate-700">{viewingItem.remarks || "Witnessed & verified conforming to purchase order specifications."}</p>
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

      {/* EDIT ROW MODAL */}
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

              <div className="grid grid-cols-5 gap-2">
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
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Rejected</label>
                  <input aria-label="Rejected"
                    type="number"
                    value={editingItem.rejectedQty}
                    onChange={(e) => setEditingItem({ ...editingItem, rejectedQty: parseFloat(e.target.value) || 0 })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Remarks</label>
                <textarea aria-label="Remarks"
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
                const newItem: InspectedItem = {
                  id: `item-${Date.now()}`,
                  slNo: items.length + 1,
                  description: form.desc.value,
                  tagNo: form.tag.value,
                  poQty: parseFloat(form.poQty.value) || 0,
                  offeredQty: parseFloat(form.offeredQty.value) || 0,
                  inspectedQty: parseFloat(form.inspectedQty.value) || 0,
                  acceptedQty: parseFloat(form.acceptedQty.value) || 0,
                  rejectedQty: parseFloat(form.rejectedQty.value) || 0,
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

              <div className="grid grid-cols-5 gap-2">
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
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Rejected</label>
                  <input aria-label="Rejected"
                    name="rejectedQty"
                    type="number"
                    defaultValue="0"
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Remarks</label>
                <textarea aria-label="Remarks"
                  name="remarks"
                  rows={2}
                  placeholder="Dimensional and hydrostatic test witnessed..."
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
                Edit 1.0 Inspection &amp; Project Details
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
                  <label className="block text-slate-700 font-bold mb-1">Inspection Date</label>
                  <input aria-label="Inspection Date"
                    type="date"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
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
                  Save Details
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
        formCode="TP03"
        payload={{
          report_no: reportNo,
          inspection_date: inspectionDate,
          report_date: reportDate,
          location: clientMeta.projectLocation,
          rfi_ref_and_date: `${clientMeta.rfiRef} & ${clientMeta.rfiDate}`.trim(),
          inspection_stage: inspectionStage,
          customer: clientMeta.customer,
          project: clientMeta.projectName,
          supplier: clientMeta.supplier,
          sub_supplier: clientMeta.subSupplier,
          po_no_and_date: `${clientMeta.poNumber} & ${clientMeta.poDate}`.trim(),
          inspector: clientMeta.inspector,
          applicable_qap: clientMeta.applicableQAP,
          applicable_spec: clientMeta.applicableSpec,
          items: items.map((i) => ({
            sl_no: i.slNo,
            description: i.description,
            tag_no: i.tagNo,
            po_qty: i.poQty,
            offered_qty: i.offeredQty,
            inspected_qty: i.inspectedQty,
            accepted_qty: i.acceptedQty,
            rejected_qty: i.rejectedQty,
            remarks: i.remarks,
          })),
          documents: docs.map((d) => ({
            doc_name: d.docType,
            doc_no: d.docNo,
            rev: d.rev,
            status: d.status,
            approval_status: d.approvalStatus,
            remarks: d.remarks,
          })),
          activities: activities.map((a) => ({
            sl_no: a.slNo,
            activity: a.activity,
            reference: a.referenceClause,
            tpi_scope: a.tpiScope,
            result: a.result,
            remarks: a.remarks,
          })),
          findings: findings.map((f) => ({
            sl_no: f.slNo,
            finding: f.finding,
            reference: f.reference,
            evidence: f.evidenceDocNo,
            status: f.status,
          })),
          punch_list: punchList.map((p) => ({
            sl_no: p.slNo,
            observation: p.observation,
            reference: p.reference,
            action: p.supplierAction,
            status: p.status,
          })),
          calibrations: calibrations.map((c) => ({
            instrument: c.equipment,
            manufacturer: c.manufacturer,
            model: c.model,
            serial_no: c.serialNo,
            range: c.range,
            accuracy: c.accuracy,
            cert_no: c.certNo,
            due_date: c.dueDate,
          })),
          status: inspectionStatus,
          conclusion: conclusionSummary,
          attachments: attachments.map((att) => ({
            sl_no: att.slNo,
            description: att.description,
            reference_pages: att.referencePages,
            remarks: att.remarks,
          })),
          supplier_comments: supplierComments,
        }}
        pdfUrl={`${API_BASE}/api/tpi/preview/TP03.pdf`}
        title="IQE-TP-03 Inspection Visit Report"
        reportNo={reportNo}
      />
    </div>
  );
}
