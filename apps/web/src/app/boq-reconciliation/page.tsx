"use client";

import { API_BASE } from "@/lib/config";
import { downloadPdfFile } from "@/lib/downloadPdf";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";
import { confirmDialog } from "@/components/feedback";
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
  Calculator,
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
  SlidersHorizontal,
  DollarSign,
  Users,
  Handshake,
  Loader2,
  Camera,
  Upload,
} from "@/components/icons";

export interface BOQItem {
  id: string;
  itemNo: string;
  description: string;
  discipline: "Civil" | "Structural" | "Piping" | "Electrical" | "HVAC";
  unit: string;
  tenderQty: number;
  approvedVariationQty: number;
  prevCertifiedQty: number;
  currentClaimedQty: number;
  currentVerifiedQty: number;
  contractRate: number;
  jmrRef: string;
  drawingRef?: string;
  status: "APPROVED" | "OVER_CLAIM" | "VARIATION_PENDING" | "DISALLOWED";
  remarks?: string;
  isLocked?: boolean;
}

export interface MaterialReconciliationItem {
  id: string;
  materialName: string;
  gradeSpec: string;
  unit: string;
  theoreticalNormPerUnit: string;
  totalWorkExecutedQty: number;
  theoreticalConsumption: number;
  actualIssuedQty: number;
  actualConsumedQty: number;
  permissibleWastagePercent: number;
  actualWastageQty: number;
  actualWastagePercent: number;
  status: "NORMAL" | "EXCESS_WASTAGE" | "SAVING";
  recoveryRatePerUnit: number;
  excessRecoveryAmount: number;
}

export interface VariationItem {
  id: string;
  coNumber: string;
  status: string;
  title: string;
  description: string;
  qtyVariation: string;
  value: string;
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
  epcContractor: string;
  supplierVendor: string;
  endClient: string;
  contractRef: string;
  poNumber: string;
  raBillNo: string;
  period: string;
  jmrBatchNo: string;
}

const CLIENT_DETAILS_MAP: Record<string, ClientDetails> = {
  "Granules India Limited - Gagillapur": {
    projectName: "Granules Gagillapur Maintenance & Expansion",
    projectLocation: "Gagillapur Plant, Hyderabad, Telangana",
    epcContractor: "Devi Sri Civil & Painting",
    supplierVendor: "JB Fabricator / Devi Sri Civil",
    endClient: "Granules India Limited (Asset Owner)",
    contractRef: "GIL/GAG/2025/TPI-1710",
    poNumber: "WO-3400077675/18.08.25",
    raBillNo: "RA-04",
    period: "September 2026",
    jmrBatchNo: "JMR-BATCH-09-2026",
  },
  "Atom Project (New Atom Project)": {
    projectName: "New Atom Process Heavy Fabrication Pkg 01",
    projectLocation: "Atom Site Industrial Zone, India",
    epcContractor: "Larsen & Toubro Ltd - Infra Div",
    supplierVendor: "Apex Heavy Engg Corp",
    endClient: "Atom Process Energy Asset Owner",
    contractRef: "ATOM/PKG01/2026/TPI-9901",
    poNumber: "PO-ATOM-2026-88120",
    raBillNo: "RA-06",
    period: "September 2026",
    jmrBatchNo: "JMR-ATOM-006",
  },
  "Suven Pharmaceuticals Ltd (Chonce Life Science)": {
    projectName: "Suven Cleanroom Tank Civil & Structural Works",
    projectLocation: "Chonce Life Science Plant, Suryapet, TS",
    epcContractor: "SVS CONSTRUCTIONS",
    supplierVendor: "SV Enterprises",
    endClient: "Suven Pharmaceuticals Ltd (Asset Owner)",
    contractRef: "SUVEN/CIVIL/2025/TPI-4443",
    poNumber: "PO-SUVEN-50054",
    raBillNo: "RA-03",
    period: "August 2026",
    jmrBatchNo: "JMR-SUV-103",
  },
  "MCGM (Greater Mumbai Corp)": {
    projectName: "Mumbai Coastal Road Pkg 03 - Retaining Wall",
    projectLocation: "Worli-Nariman Corridor, Mumbai, MH",
    epcContractor: "Larsen & Toubro Ltd - Infra Div",
    supplierVendor: "Shapoorji Pallonji Engineering",
    endClient: "Municipal Corporation of Greater Mumbai",
    contractRef: "MCGM/CWD/2024/TPI-8892",
    poNumber: "PO-MCGM-2024-99812",
    raBillNo: "RA-12",
    period: "September 2026",
    jmrBatchNo: "JMR-MCGM-112",
  },
  "S2 / Standard Client": {
    projectName: "Standard Industrial Facility Phase 2",
    projectLocation: "Industrial Zone Phase 2, India",
    epcContractor: "Tata Projects Infrastructure",
    supplierVendor: "Apex Heavy Engg Corp",
    endClient: "S2 Standard Asset Owner",
    contractRef: "S2/STD/2024/TPI-1010",
    poNumber: "PO-S2-2024-10100",
    raBillNo: "RA-05",
    period: "September 2026",
    jmrBatchNo: "JMR-S2-005",
  },
};

const INITIAL_BOQ_ITEMS: BOQItem[] = [
  {
    id: "boq-001",
    itemNo: "CIV-01.1",
    description: "Earthwork excavation in all kinds of soil for foundation trenches up to 3m depth including shoring and dewatering",
    discipline: "Civil",
    unit: "Cum",
    tenderQty: 4500,
    approvedVariationQty: 300,
    prevCertifiedQty: 3800,
    currentClaimedQty: 850,
    currentVerifiedQty: 720,
    contractRate: 340,
    jmrRef: "JMR-CIV-042/P.14",
    drawingRef: "GFC-CIV-FOUND-01",
    status: "OVER_CLAIM",
    remarks: "130 Cum over-claim disallowed due to over-excavation beyond pay lines",
    isLocked: false,
  },
  {
    id: "boq-002",
    itemNo: "CIV-02.4",
    description: "Design Mix Concrete M-30 in sub-structure footings, raft, and plinth beams with 20mm graded aggregate (IS 456)",
    discipline: "Civil",
    unit: "Cum",
    tenderQty: 2800,
    approvedVariationQty: 0,
    prevCertifiedQty: 1950,
    currentClaimedQty: 480,
    currentVerifiedQty: 480,
    contractRate: 5850,
    jmrRef: "JMR-CONC-088/P.06",
    drawingRef: "GFC-CIV-RAFT-03",
    status: "APPROVED",
    remarks: "Pour cards signed; 7 & 28 days cube compressive test reports verified",
    isLocked: false,
  },
  {
    id: "boq-003",
    itemNo: "STR-01.2",
    description: "Supplying, fabricating & erecting structural steel sections (IS 2062 Grade E250) including welding, primer & Sa 2.5 blast cleaning",
    discipline: "Structural",
    unit: "MT",
    tenderQty: 650,
    approvedVariationQty: 85,
    prevCertifiedQty: 480,
    currentClaimedQty: 180,
    currentVerifiedQty: 165,
    contractRate: 88500,
    jmrRef: "JMR-STR-104/P.21",
    drawingRef: "GFC-STR-FRAM-08",
    status: "APPROVED",
    remarks: "Weighbridge slips and mill test certs reconciled; 15 MT rejected for paint touch-up",
    isLocked: false,
  },
  {
    id: "boq-004",
    itemNo: "CIV-03.1",
    description: "Thermo-Mechanically Treated (TMT) Fe 550D reinforcement steel bars cutting, bending, binding in position at all levels (IS 1786)",
    discipline: "Civil",
    unit: "MT",
    tenderQty: 380,
    approvedVariationQty: 25,
    prevCertifiedQty: 290,
    currentClaimedQty: 95,
    currentVerifiedQty: 85,
    contractRate: 64200,
    jmrRef: "JMR-STEEL-091/P.18",
    drawingRef: "GFC-BBS-REINF-12",
    status: "APPROVED",
    remarks: "Rolling margin factor (1.018) deducted per bar bending schedule audit",
    isLocked: false,
  },
  {
    id: "boq-005",
    itemNo: "PIP-04.3",
    description: "SS 316L Seamless process piping 2 inch NB schedule 40 with orbital TIG welding, argon purge, pickling & passivation",
    discipline: "Piping",
    unit: "Mtrs",
    tenderQty: 1200,
    approvedVariationQty: 150,
    prevCertifiedQty: 850,
    currentClaimedQty: 420,
    currentVerifiedQty: 310,
    contractRate: 2450,
    jmrRef: "JMR-PIP-033/P.09",
    drawingRef: "GFC-PIP-ISOM-22",
    status: "OVER_CLAIM",
    remarks: "Claim exceeded revised limit; 110 Mtrs pending hydrostatic test witness",
    isLocked: false,
  },
  {
    id: "boq-006",
    itemNo: "HVAC-01.5",
    description: "GI ducting Class B 22 gauge with fire dampers, acoustic insulation and factory-tested leakage compliance per SMACNA",
    discipline: "HVAC",
    unit: "Sqm",
    tenderQty: 3500,
    approvedVariationQty: 400,
    prevCertifiedQty: 2400,
    currentClaimedQty: 800,
    currentVerifiedQty: 800,
    contractRate: 1420,
    jmrRef: "JMR-HVAC-019/P.04",
    drawingRef: "GFC-HVAC-DUCT-05",
    status: "APPROVED",
    remarks: "Duct leakage test passed within Class 6 permissible leakage",
    isLocked: false,
  },
  {
    id: "boq-007",
    itemNo: "ELE-02.2",
    description: "11 kV, 3C x 300 Sq.mm XLPE insulated, armored aluminum conductor HT cable laying in ground with sand cushioning & protection tiles",
    discipline: "Electrical",
    unit: "Mtrs",
    tenderQty: 2200,
    approvedVariationQty: 0,
    prevCertifiedQty: 1600,
    currentClaimedQty: 500,
    currentVerifiedQty: 500,
    contractRate: 1850,
    jmrRef: "JMR-ELE-055/P.12",
    drawingRef: "GFC-ELE-ROUT-14",
    status: "APPROVED",
    remarks: "Megger & Hi-Pot insulation resistance test witnessed & approved",
    isLocked: false,
  },
  {
    id: "boq-008",
    itemNo: "CIV-EXT-01",
    description: "Extra Item: Self-leveling epoxy flooring 3mm thickness in Cleanroom corridors including primer and PU topcoat",
    discipline: "Civil",
    unit: "Sqm",
    tenderQty: 0,
    approvedVariationQty: 600,
    prevCertifiedQty: 200,
    currentClaimedQty: 350,
    currentVerifiedQty: 300,
    contractRate: 1150,
    jmrRef: "JMR-EXP-002/P.01",
    drawingRef: "GFC-CIV-FIN-09",
    status: "VARIATION_PENDING",
    remarks: "Rate analysis approved by PMC; 50 Sqm rejected due to uneven curing",
    isLocked: false,
  },
];

const INITIAL_MATERIALS: MaterialReconciliationItem[] = [
  {
    id: "mat-01",
    materialName: "TMT Reinforcement Steel (Fe 550D)",
    gradeSpec: "IS 1786 (Primary Producer - TATA / JSW)",
    unit: "MT",
    theoreticalNormPerUnit: "As per Approved BBS drawings",
    totalWorkExecutedQty: 375,
    theoreticalConsumption: 375.0,
    actualIssuedQty: 395.0,
    actualConsumedQty: 388.5,
    permissibleWastagePercent: 3.0,
    actualWastageQty: 13.5,
    actualWastagePercent: 3.6,
    status: "EXCESS_WASTAGE",
    recoveryRatePerUnit: 64200,
    excessRecoveryAmount: 144450,
  },
  {
    id: "mat-02",
    materialName: "Portland Pozzolana Cement (PPC)",
    gradeSpec: "IS 1489 Part-1 (UltraTech / ACC)",
    unit: "Bags",
    theoreticalNormPerUnit: "7.6 Bags/Cum for M30 concrete",
    totalWorkExecutedQty: 2430,
    theoreticalConsumption: 18468,
    actualIssuedQty: 19100,
    actualConsumedQty: 18800,
    permissibleWastagePercent: 2.0,
    actualWastageQty: 332,
    actualWastagePercent: 1.8,
    status: "NORMAL",
    recoveryRatePerUnit: 380,
    excessRecoveryAmount: 0,
  },
  {
    id: "mat-03",
    materialName: "Structural Steel Sections (IS 2062)",
    gradeSpec: "Grade E250BR / SAIL / Jindal",
    unit: "MT",
    theoreticalNormPerUnit: "Net fabrication weight per drawing",
    totalWorkExecutedQty: 645,
    theoreticalConsumption: 645.0,
    actualIssuedQty: 680.0,
    actualConsumedQty: 668.0,
    permissibleWastagePercent: 4.0,
    actualWastageQty: 23.0,
    actualWastagePercent: 3.56,
    status: "NORMAL",
    recoveryRatePerUnit: 88500,
    excessRecoveryAmount: 0,
  },
  {
    id: "mat-04",
    materialName: "11 kV XLPE Power Cable 3Cx300",
    gradeSpec: "IS 7098 Part-2 (Polycab / Havells)",
    unit: "Mtrs",
    theoreticalNormPerUnit: "Trench route + 3% loop allowance",
    totalWorkExecutedQty: 2100,
    theoreticalConsumption: 2163,
    actualIssuedQty: 2200,
    actualConsumedQty: 2175,
    permissibleWastagePercent: 1.5,
    actualWastageQty: 12,
    actualWastagePercent: 0.55,
    status: "SAVING",
    recoveryRatePerUnit: 1850,
    excessRecoveryAmount: 0,
  },
];

export default function BOQReconciliationPage() {
  const [activeTab, setActiveTab] = useState<"matrix" | "materials" | "variations" | "signoff" | "is1200">("matrix");
  const [isTabSwitching, setIsTabSwitching] = useState<boolean>(false);
  const [is1200Audit, setIs1200Audit] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);

  const loadIS1200Audit = async () => {
    setLoadingAudit(true);
    try {
      const res = await api.getConstructionReconciliationAudit();
      setIs1200Audit(res);
    } catch (err) {
      console.error("Failed to fetch IS 1200 audit", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadIS1200Audit();
  }, []);

  const handleTabSwitch = (tab: "matrix" | "materials" | "variations" | "signoff" | "is1200") => {
    if (tab === activeTab) return;
    setIsTabSwitching(true);
    setActiveTab(tab);
    setTimeout(() => setIsTabSwitching(false), 220);
  };

  const [items, setItems] = useState<BOQItem[]>(INITIAL_BOQ_ITEMS);
  const [materials, setMaterials] = useState<MaterialReconciliationItem[]>(INITIAL_MATERIALS);
  const [selectedClient, setSelectedClient] = useState<string>("Granules India Limited - Gagillapur");

  // Edit mode controls
  const [isInlineEditMode, setIsInlineEditMode] = useState<boolean>(false);
  const [isInlineEditMaterials, setIsInlineEditMaterials] = useState<boolean>(false);
  const [isInlineEditVariations, setIsInlineEditVariations] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<BOQItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<BOQItem | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  // OCR Waybill Scanner State (Top 1 Feature)
  const [selectedSlipType, setSelectedSlipType] = useState<string>("steel_tmt");
  const [parsedSlip, setParsedSlip] = useState<any>(null);
  const [parsingWaybill, setParsingWaybill] = useState<boolean>(false);
  const [waybillLedgerAppended, setWaybillLedgerAppended] = useState<boolean>(false);

  const handleParseWaybill = async (slipType: string) => {
    setSelectedSlipType(slipType);
    setParsingWaybill(true);
    setWaybillLedgerAppended(false);
    try {
      const data = await api.parseConstructionWaybill(slipType);
      setParsedSlip(data);
    } catch (e) {
      console.error("Failed to parse weighbridge slip:", e);
    } finally {
      setParsingWaybill(false);
    }
  };

  const handleAppendSlipToLedger = () => {
    if (!parsedSlip) return;
    setWaybillLedgerAppended(true);
    if (is1200Audit) {
      setIs1200Audit((prev: any) => ({
        ...prev,
        waybills_summary: {
          ...prev?.waybills_summary,
          verified_valid: (prev?.waybills_summary?.verified_valid || 119) + 1,
        },
      }));
    }
  };
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);

  const [variations, setVariations] = useState<VariationItem[]>([
    {
      id: "co-1",
      coNumber: "Change Order CO-01",
      status: "Client Approved",
      title: "Structural Steel Framing Augmentation for HVAC AHU Floor",
      description: "Additional 85 MT of IS 2062 Grade E250 heavy I-beams required due to increased equipment loads of 45,000 CFM air handling units.",
      qtyVariation: "+85 MT",
      value: "₹75,22,500",
    },
    {
      id: "co-2",
      coNumber: "Change Order CO-02",
      status: "Pending Rate Analysis",
      title: "Self-Leveling 3mm Epoxy Cleanroom Grade Flooring",
      description: "Substituted Kota stone tiles with seamless antibacterial epoxy flooring to achieve Revised Schedule M cleanroom classification.",
      qtyVariation: "+600 Sqm",
      value: "₹6,90,000",
    },
  ]);

  const handleAddMaterial = () => {
    const newM: MaterialReconciliationItem = {
      id: `mat-${Date.now()}`,
      materialName: "TMT Rebars Fe500D (IS 1786)",
      gradeSpec: "Fe500D Primary Producer",
      unit: "MT",
      theoreticalNormPerUnit: "Design Drawing Schedule",
      totalWorkExecutedQty: 100,
      theoreticalConsumption: 100,
      actualIssuedQty: 102,
      actualConsumedQty: 102,
      permissibleWastagePercent: 3.0,
      actualWastageQty: 2,
      actualWastagePercent: 2.0,
      status: "NORMAL",
      recoveryRatePerUnit: 65000,
      excessRecoveryAmount: 0,
    };
    setMaterials([...materials, newM]);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  const handleAddVariation = () => {
    const newV: VariationItem = {
      id: `var-${Date.now()}`,
      coNumber: `Change Order CO-0${variations.length + 1}`,
      status: "Under Review",
      title: "New Extra Item / Scope Deviation",
      description: "Scope change or specification deviation requiring technical verification and rate analysis.",
      qtyVariation: "+100 Units",
      value: "₹1,50,000",
    };
    setVariations([...variations, newV]);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  // Filters & search
  const [search, setSearch] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [isFilterSwitching, setIsFilterSwitching] = useState<boolean>(false);

  const handleSwitchDiscipline = (d: string) => {
    if (d === selectedDiscipline) return;
    setIsFilterSwitching(true);
    setSelectedDiscipline(d);
    setTimeout(() => setIsFilterSwitching(false), 220);
  };

  const handleSwitchStatus = (s: string) => {
    if (s === selectedStatus) return;
    setIsFilterSwitching(true);
    setSelectedStatus(s);
    setTimeout(() => setIsFilterSwitching(false), 220);
  };

  // Project Info initialized from client map
  const initialClient = CLIENT_DETAILS_MAP["Granules India Limited - Gagillapur"];
  const [projectInfo, setProjectInfo] = useState({
    projectName: initialClient.projectName,
    projectLocation: initialClient.projectLocation,
    epcContractor: initialClient.epcContractor,
    supplierVendor: initialClient.supplierVendor,
    endClient: initialClient.endClient,
    contractRef: initialClient.contractRef,
    poNumber: initialClient.poNumber,
    raBillNo: initialClient.raBillNo,
    period: initialClient.period,
    jmrBatchNo: initialClient.jmrBatchNo,
    leadInspector: "Alok Gupta (Senior TPI Lead Auditor)",
  });

  // Client Selection Handler
  const handleClientChange = (clientName: string) => {
    setSelectedClient(clientName);
    const d = CLIENT_DETAILS_MAP[clientName];
    if (d) {
      setProjectInfo({
        projectName: d.projectName,
        projectLocation: d.projectLocation,
        epcContractor: d.epcContractor,
        supplierVendor: d.supplierVendor,
        endClient: d.endClient,
        contractRef: d.contractRef,
        poNumber: d.poNumber,
        raBillNo: d.raBillNo,
        period: d.period,
        jmrBatchNo: d.jmrBatchNo,
        leadInspector: "Alok Gupta (Senior TPI Lead Auditor)",
      });
    }
  };

  // Inline Cell Update Handler
  const handleInlineChange = (id: string, field: keyof BOQItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const updated = { ...it, [field]: value };
          if (field === "currentClaimedQty" || field === "currentVerifiedQty") {
            const claimed = field === "currentClaimedQty" ? Number(value) : it.currentClaimedQty;
            const verified = field === "currentVerifiedQty" ? Number(value) : it.currentVerifiedQty;
            if (claimed > verified) {
              updated.status = "OVER_CLAIM";
            } else if (updated.status === "OVER_CLAIM") {
              updated.status = "APPROVED";
            }
          }
          return updated;
        }
        return it;
      })
    );
  };

  const handleToggleLockItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, isLocked: !item.isLocked };
        }
        return item;
      })
    );
  };

  // Delete Row Handler
  const handleDeleteItem = async (id: string) => {
    if (
      !(await confirmDialog({
        title: "Remove this BOQ item?",
        message: "The item will be removed from the reconciliation audit.",
        confirmLabel: "Remove",
        danger: true,
      }))
    )
      return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Duplicate Row Handler
  const handleDuplicateItem = (item: BOQItem) => {
    const copy: BOQItem = {
      ...item,
      id: `boq-${Date.now()}`,
      itemNo: `${item.itemNo}-COPY`,
      description: `${item.description} (Copy)`,
      isLocked: false,
    };
    setItems((prev) => [...prev, copy]);
    triggerSaveToast();
  };

  // Modal Edit Save Handler
  const handleSaveEditModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setItems((prev) => prev.map((it) => (it.id === editingItem.id ? editingItem : it)));
    setEditingItem(null);
    triggerSaveToast();
  };

  const triggerSaveToast = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Sl No",
      "Item Code",
      "Description",
      "Discipline",
      "Unit",
      "Tender Qty",
      "Approved Variation",
      "Revised Cap",
      "Prev Certified",
      "Claimed Qty",
      "Verified Qty",
      "Cumulative Qty",
      "Balance Qty",
      "Rate (INR)",
      "Claimed Amount (INR)",
      "Verified Amount (INR)",
      "Disallowed Amount (INR)",
      "JMR Ref",
      "Drawing Ref",
      "Status",
    ];

    const rows = filteredItems.map((it, idx) => {
      const revisedCap = it.tenderQty + it.approvedVariationQty;
      const cumulative = it.prevCertifiedQty + it.currentVerifiedQty;
      const balance = Math.max(0, revisedCap - cumulative);
      const claimedVal = it.currentClaimedQty * it.contractRate;
      const verifiedVal = it.currentVerifiedQty * it.contractRate;
      const disallowedVal = Math.max(0, it.currentClaimedQty - it.currentVerifiedQty) * it.contractRate;

      return [
        idx + 1,
        `"${it.itemNo}"`,
        `"${it.description.replace(/"/g, '""')}"`,
        `"${it.discipline}"`,
        `"${it.unit}"`,
        it.tenderQty,
        it.approvedVariationQty,
        revisedCap,
        it.prevCertifiedQty,
        it.currentClaimedQty,
        it.currentVerifiedQty,
        cumulative,
        balance,
        it.contractRate,
        claimedVal,
        verifiedVal,
        disallowedVal,
        `"${it.jmrRef}"`,
        `"${it.drawingRef || ""}"`,
        `"${it.status}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BOQ_Reconciliation_${projectInfo.raBillNo}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSingleRowCSV = (item: BOQItem) => {
    const revisedCap = item.tenderQty + item.approvedVariationQty;
    const cumulative = item.prevCertifiedQty + item.currentVerifiedQty;
    const balance = Math.max(0, revisedCap - cumulative);
    const claimedAmt = item.currentClaimedQty * item.contractRate;
    const verifiedAmt = item.currentVerifiedQty * item.contractRate;
    const disallowedAmt = Math.max(0, item.currentClaimedQty - item.currentVerifiedQty) * item.contractRate;

    const data = [
      ["BOQ Item Code", item.itemNo],
      ["Discipline", item.discipline],
      ["Description", item.description],
      ["Unit", item.unit],
      ["Tender Qty", item.tenderQty],
      ["Approved Variation", item.approvedVariationQty],
      ["Revised Cap", revisedCap],
      ["Prev Certified Qty", item.prevCertifiedQty],
      ["Current Claimed Qty", item.currentClaimedQty],
      ["TPI Verified Qty", item.currentVerifiedQty],
      ["Cumulative Qty", cumulative],
      ["Balance Qty", balance],
      ["Contract Rate (INR)", item.contractRate],
      ["Claimed Value (INR)", claimedAmt],
      ["Verified Value (INR)", verifiedAmt],
      ["Disallowed Variance (INR)", disallowedAmt],
      ["JMR Ref", item.jmrRef],
      ["Drawing Ref", item.drawingRef || "-"],
      ["Engineering Remarks", item.remarks || "-"],
      ["Status", item.status],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + data.map((e) => `"${e[0]}","${(e[1] + "").replace(/"/g, '""')}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BOQ_Item_${item.itemNo}_Reconciliation_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.itemNo.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.jmrRef.toLowerCase().includes(search.toLowerCase());
      const matchesDiscipline = selectedDiscipline === "All" || item.discipline === selectedDiscipline;
      const matchesStatus = selectedStatus === "All" || item.status === selectedStatus;
      return matchesSearch && matchesDiscipline && matchesStatus;
    });
  }, [items, search, selectedDiscipline, selectedStatus]);

  // Calculations
  const kpis = useMemo(() => {
    let totalSanctionedTenderVal = 0;
    let totalApprovedVariationVal = 0;
    let totalPrevCertifiedVal = 0;
    let totalCurrentClaimedVal = 0;
    let totalCurrentVerifiedVal = 0;
    let totalCumulativeVerifiedVal = 0;
    let totalDisallowedVal = 0;
    let overClaimCount = 0;

    items.forEach((item) => {
      totalSanctionedTenderVal += item.tenderQty * item.contractRate;
      totalApprovedVariationVal += item.approvedVariationQty * item.contractRate;
      totalPrevCertifiedVal += item.prevCertifiedQty * item.contractRate;
      totalCurrentClaimedVal += item.currentClaimedQty * item.contractRate;
      totalCurrentVerifiedVal += item.currentVerifiedQty * item.contractRate;
      totalCumulativeVerifiedVal += (item.prevCertifiedQty + item.currentVerifiedQty) * item.contractRate;

      const diff = Math.max(0, item.currentClaimedQty - item.currentVerifiedQty);
      totalDisallowedVal += diff * item.contractRate;

      if (item.currentClaimedQty > item.currentVerifiedQty || item.status === "OVER_CLAIM") {
        overClaimCount++;
      }
    });

    const totalRevisedSanctionedVal = totalSanctionedTenderVal + totalApprovedVariationVal;
    const balanceContractVal = Math.max(0, totalRevisedSanctionedVal - totalCumulativeVerifiedVal);
    const totalMaterialExcessRecovery = materials.reduce((acc, m) => acc + m.excessRecoveryAmount, 0);

    return {
      totalSanctionedTenderVal,
      totalApprovedVariationVal,
      totalRevisedSanctionedVal,
      totalPrevCertifiedVal,
      totalCurrentClaimedVal,
      totalCurrentVerifiedVal,
      totalCumulativeVerifiedVal,
      balanceContractVal,
      totalDisallowedVal,
      overClaimCount,
      totalMaterialExcessRecovery,
    };
  }, [items, materials]);

  return (
    <div className="space-y-4 pb-16">
      {/* Toast Alert */}
      {showSavedToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>BOQ Reconciliation audit ledger saved successfully!</span>
        </div>
      )}

      {/* TOP HEADER CONTAINER (Identical to Bill Verification Format Shell) */}
      <div className="bg-white text-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#003366] dark:text-sky-300 font-heading tracking-tight flex items-center gap-2">
              <span>BOQ Reconciliation &amp; Material Audit</span>
            </h1>

            {/* Select Client Asset Dropdown */}
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs max-w-full min-w-0">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-600 font-extrabold shrink-0">Select Client:</span>
              <select aria-label="Select client"
                value={selectedClient}
                onChange={(e) => handleClientChange(e.target.value)}
                className="min-w-0 max-w-full bg-white text-slate-900 font-extrabold border border-slate-300 rounded-lg text-xs p-1 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {CLIENT_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => handleTabSwitch("signoff")}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Go to TPI Sign-Off Certificate"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Sign-Off Certificate</span>
            </button>

            <button
              onClick={() => setShowPdfPreview(true)}
              className="px-3 py-1.5 rounded-xl bg-[#0084bf] hover:bg-[#0073a8] text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Live Preview PDF"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Live PDF</span>
            </button>

            <button
              onClick={async () => {
                await downloadPdfFile(
                  `${API_BASE}/api/tpi/preview/BOQ.pdf`,
                  `BOQ_Reconciliation_Ledger.pdf`,
                  "/sample-pdfs/BOQ.pdf"
                );
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Download PDF Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button aria-label="Save BOQ Audit Ledger"
              onClick={triggerSaveToast}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition-all shadow-sm cursor-pointer"
              title="Save BOQ Audit Ledger"
            >
              <Save className="w-4 h-4 text-sky-400" />
            </button>

            <button aria-label="Export Full BOQ Ledger to CSV"
              onClick={handleExportCSV}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all shadow-2xs cursor-pointer"
              title="Export Full BOQ Ledger to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            </button>

            <button aria-label="Print BOQ Audit Dossier"
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all shadow-sm cursor-pointer"
              title="Print BOQ Audit Dossier"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SUB-MODULE TABS STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => handleTabSwitch("matrix")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "matrix"
                ? "bg-[#003366] text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>1. BOQ Quantity Ledger</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${activeTab === "matrix" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
              {items.length}
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch("materials")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "materials"
                ? "bg-[#003366] text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>2. Material Consumption Audit</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${activeTab === "materials" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
              {materials.length}
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch("variations")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "variations"
                ? "bg-[#003366] text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <BadgeAlert className="w-3.5 h-3.5" />
            <span>3. Variations &amp; Extra Items</span>
          </button>

          <button
            onClick={() => handleTabSwitch("signoff")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "signoff"
                ? "bg-[#003366] text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>4. TPI Sign-Off Certificate</span>
          </button>

          <button
            onClick={() => {
              handleTabSwitch("is1200");
              if (!is1200Audit) loadIS1200Audit();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "is1200"
                ? "bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md ring-2 ring-blue-400/50"
                : "bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>5. ⚡ IS 1200 Reconciler</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500 text-white font-bold">
              ₹19.23L SAVED
            </span>
          </button>
        </div>

        <Link
          href="/tpi-billing"
          className="inline-flex items-center gap-1.5 text-xs text-[#003366] dark:text-sky-300 hover:underline font-bold"
        >
          <span>Open Bill Verification (F-BILL-01)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* SUB-MODULE TABS BODY WITH TRANSITION LOADER */}
      {isTabSwitching ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs animate-in fade-in duration-200">
          <Loader2 className="w-8 h-8 animate-spin text-[#0084bf]" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono tracking-wide">Switching Module View...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: BOQ QUANTITY LEDGER */}
          {activeTab === "matrix" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-3">
          {/* Main Table Toolbar (Identical to Bill Verification) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-600" />
              <span>BOQ Measurement Ledger &amp; Reconciliation Matrix ({filteredItems.length} items)</span>
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <input aria-label="Search BOQ items"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item code, description, JMR..."
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              {/* Inline Edit Toggle Button */}
              <button
                onClick={() => setIsInlineEditMode(!isInlineEditMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs cursor-pointer ${
                  isInlineEditMode
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-amber-500/20"
                    : "bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 border-slate-300"
                }`}
                title="Toggle Inline Cell Editing Mode"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isInlineEditMode ? "Exit Inline Edit" : "Inline Edit"}</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                title="Add New Line Item"
              >
                <Plus className="w-3.5 h-3.5 text-sky-300" />
                <span>Add Item</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                title="Export All Items to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV ({items.length})</span>
              </button>

              <button
                onClick={() => setShowPdfPreview(true)}
                className="px-3.5 py-1.5 bg-[#0084bf] hover:bg-[#0073a8] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Live PDF Preview of BOQ Reconciliation Report"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>

              <a
                href={`${API_BASE}/api/v1/reports/pdf/boq-reconciliation`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                title="Download BOQ Reconciliation Audit PDF"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </a>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add BOQ Item #{items.length + 1}</span>
              </button>
            </div>
          </div>

          {/* Discipline and Status Pill Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Discipline:
            </span>
            {["All", "Civil", "Structural", "Piping", "Electrical", "HVAC"].map((d) => (
              <button
                key={d}
                onClick={() => handleSwitchDiscipline(d)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDiscipline === d
                    ? "bg-[#003366] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {d}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            <span className="text-slate-500 font-bold">Status:</span>
            {["All", "APPROVED", "OVER_CLAIM", "VARIATION_PENDING"].map((s) => (
              <button
                key={s}
                onClick={() => handleSwitchStatus(s)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedStatus === s
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* TAB SWITCHING LOADER EFFECT */}
          {isFilterSwitching ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-2xs animate-in fade-in duration-200">
              <Loader2 className="w-8 h-8 animate-spin text-[#0084bf]" />
              <p className="text-xs font-bold text-slate-600 font-mono tracking-wide">Filtering BOQ records...</p>
            </div>
          ) : (
            /* Main 20-Column Table (Identical Layout to Bill Verification) */
            <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs border-collapse min-w-[2400px]">
              <thead className="sticky top-0 bg-slate-100 text-slate-800 font-bold border-b border-slate-300 z-10 select-none shadow-xs">
                <tr>
                  <th className="p-3 text-center border-r border-slate-200 w-12">Sl No</th>
                  <th className="p-3 border-r border-slate-200">BOQ Item</th>
                  <th className="p-3 border-r border-slate-200 min-w-[260px]">Work Description &amp; Scope</th>
                  <th className="p-3 border-r border-slate-200 text-center">Unit</th>
                  <th className="p-3 border-r border-slate-200 text-right">Tender Qty</th>
                  <th className="p-3 border-r border-slate-200 text-right">Appr. Var.</th>
                  <th className="p-3 border-r border-slate-200 text-right font-extrabold text-blue-900">Revised Cap</th>
                  <th className="p-3 border-r border-slate-200 text-right">Prev Cert</th>
                  <th className="p-3 border-r border-slate-200 text-right bg-amber-100 text-amber-900 font-extrabold min-w-[120px]">
                    Claimed Qty (₹)
                  </th>
                  <th className="p-3 border-r border-slate-200 text-right bg-emerald-100 text-emerald-900 font-extrabold min-w-[120px]">
                    TPI Verified Qty (₹)
                  </th>
                  <th className="p-3 border-r border-slate-200 text-right bg-rose-100 text-rose-900 font-extrabold min-w-[120px]">
                    Disallowed Qty
                  </th>
                  <th className="p-3 border-r border-slate-200 text-right">Cumulative</th>
                  <th className="p-3 border-r border-slate-200 text-right">Balance Qty</th>
                  <th className="p-3 border-r border-slate-200 text-right">Unit Rate (₹)</th>
                  <th className="p-3 border-r border-slate-200 text-right bg-amber-100 text-amber-900 font-extrabold">Claimed Value (₹)</th>
                  <th className="p-3 border-r border-slate-200 text-right bg-emerald-100 text-emerald-900 font-extrabold">Verified Value (₹)</th>
                  <th className="p-3 border-r border-slate-200 text-right bg-rose-100 text-rose-900 font-extrabold">Disallowed Savings (₹)</th>
                  <th className="p-3 border-r border-slate-200 min-w-[220px]">TPI Engineering Remarks</th>
                  <th className="p-3 border-r border-slate-200 text-center">Status</th>
                  <th className="p-3 text-center min-w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredItems.map((item, idx) => {
                  const revisedCap = item.tenderQty + item.approvedVariationQty;
                  const cumulative = item.prevCertifiedQty + item.currentVerifiedQty;
                  const balance = Math.max(0, revisedCap - cumulative);
                  const claimedVal = item.currentClaimedQty * item.contractRate;
                  const verifiedVal = item.currentVerifiedQty * item.contractRate;
                  const disallowedQty = Math.max(0, item.currentClaimedQty - item.currentVerifiedQty);
                  const disallowedVal = disallowedQty * item.contractRate;
                  const isOver = item.status === "OVER_CLAIM" || disallowedQty > 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-brand-50/40 transition-colors ${isOver ? "bg-rose-50/30" : ""}`}
                    >
                      <td className="p-3 text-center font-mono font-bold text-slate-700 bg-slate-50 border-r border-slate-100">
                        #{idx + 1}
                      </td>
                      <td className="p-3 font-mono font-bold text-brand-600 border-r border-slate-100 whitespace-nowrap">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Item code for ${item.itemNo}`}
                            type="text"
                            value={item.itemNo}
                            onChange={(e) => handleInlineChange(item.id, "itemNo", e.target.value)}
                            className="w-24 p-1 font-mono font-bold text-brand-600 bg-white border border-brand-300 rounded text-xs"
                          />
                        ) : (
                          item.itemNo
                        )}
                      </td>
                      <td className="p-3 border-r border-slate-100 font-medium">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Description for ${item.itemNo}`}
                            type="text"
                            value={item.description}
                            onChange={(e) => handleInlineChange(item.id, "description", e.target.value)}
                            className="w-full min-w-[200px] p-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900"
                          />
                        ) : (
                          <>
                            <div className="font-semibold text-slate-900">{item.description}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                              <span className="text-blue-600 font-bold">[{item.discipline}]</span>
                              <span>&bull;</span>
                              <span>JMR: {item.jmrRef}</span>
                              {item.drawingRef && (
                                <>
                                  <span>&bull;</span>
                                  <span>Dwg: {item.drawingRef}</span>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono border-r border-slate-100 font-semibold">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Unit for ${item.itemNo}`}
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleInlineChange(item.id, "unit", e.target.value)}
                            className="w-14 p-1 text-center font-mono bg-white border border-slate-300 rounded text-xs"
                          />
                        ) : (
                          item.unit
                        )}
                      </td>
                      <td className="p-3 text-right font-mono border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Tender quantity for ${item.itemNo}`}
                            type="number"
                            step="any"
                            value={item.tenderQty}
                            onChange={(e) => handleInlineChange(item.id, "tenderQty", parseFloat(e.target.value) || 0)}
                            className="w-20 p-1 text-right font-mono bg-white border border-slate-300 rounded text-xs"
                          />
                        ) : (
                          item.tenderQty.toLocaleString()
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-purple-600 border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Approved variation quantity for ${item.itemNo}`}
                            type="number"
                            step="any"
                            value={item.approvedVariationQty}
                            onChange={(e) => handleInlineChange(item.id, "approvedVariationQty", parseFloat(e.target.value) || 0)}
                            className="w-16 p-1 text-right font-mono text-purple-600 bg-white border border-purple-300 rounded text-xs font-bold"
                          />
                        ) : (
                          item.approvedVariationQty ? `+${item.approvedVariationQty}` : "-"
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-blue-900 border-r border-slate-100">
                        {revisedCap.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono border-r border-slate-100 text-slate-500">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Previously certified quantity for ${item.itemNo}`}
                            type="number"
                            step="any"
                            value={item.prevCertifiedQty}
                            onChange={(e) => handleInlineChange(item.id, "prevCertifiedQty", parseFloat(e.target.value) || 0)}
                            className="w-16 p-1 text-right font-mono bg-white border border-slate-300 rounded text-xs"
                          />
                        ) : (
                          item.prevCertifiedQty.toLocaleString()
                        )}
                      </td>

                      {/* Claimed Qty Cell (Supports Dual Edit: Inline vs Static) */}
                      <td className="p-3 text-right font-mono font-bold text-amber-800 bg-amber-50/40 border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Claimed quantity for ${item.itemNo}`}
                            type="number"
                            step="any"
                            value={item.currentClaimedQty}
                            onChange={(e) => handleInlineChange(item.id, "currentClaimedQty", parseFloat(e.target.value) || 0)}
                            className="w-20 p-1 text-right font-mono font-bold text-amber-900 bg-white border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        ) : (
                          item.currentClaimedQty.toLocaleString()
                        )}
                      </td>

                      {/* Verified Qty Cell (Supports Dual Edit: Inline vs Static) */}
                      <td className="p-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40 border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Verified quantity for ${item.itemNo}`}
                            type="number"
                            step="any"
                            value={item.currentVerifiedQty}
                            onChange={(e) => handleInlineChange(item.id, "currentVerifiedQty", parseFloat(e.target.value) || 0)}
                            className="w-20 p-1 text-right font-mono font-bold text-emerald-900 bg-white border border-emerald-400 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                          />
                        ) : (
                          item.currentVerifiedQty.toLocaleString()
                        )}
                      </td>

                      <td className={`p-3 text-right font-mono font-bold border-r border-slate-100 ${disallowedQty > 0 ? "text-rose-600 bg-rose-100/50" : "text-slate-400"}`}>
                        {disallowedQty > 0 ? disallowedQty.toLocaleString() : "-"}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-emerald-700 border-r border-slate-100">
                        {cumulative.toLocaleString()}
                      </td>

                      <td className="p-3 text-right font-mono text-slate-500 border-r border-slate-100">
                        {balance.toLocaleString()}
                      </td>

                      {/* Unit Rate Cell */}
                      <td className="p-3 text-right font-mono border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Contract rate for ${item.itemNo}`}
                            type="number"
                            step="any"
                            value={item.contractRate}
                            onChange={(e) => handleInlineChange(item.id, "contractRate", parseFloat(e.target.value) || 0)}
                            className="w-20 p-1 text-right font-mono text-slate-900 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          `₹${item.contractRate.toLocaleString()}`
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-semibold border-r border-slate-100">
                        ₹{claimedVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/50 border-r border-slate-100">
                        ₹{verifiedVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className={`p-3 text-right font-mono font-bold border-r border-slate-100 ${disallowedVal > 0 ? "text-rose-600 bg-rose-100/50" : "text-slate-400"}`}>
                        {disallowedVal > 0 ? `₹${disallowedVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                      </td>

                      <td className="p-3 border-r border-slate-100 text-[11px] leading-tight text-slate-700">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Remarks for ${item.itemNo}`}
                            type="text"
                            value={item.remarks || ""}
                            onChange={(e) => handleInlineChange(item.id, "remarks", e.target.value)}
                            className="w-full p-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                            placeholder="Engineering observation..."
                          />
                        ) : (
                          item.remarks || "-"
                        )}
                      </td>

                      <td className="p-3 text-center border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <select aria-label={`Status for ${item.itemNo}`}
                            value={item.status}
                            onChange={(e) => handleInlineChange(item.id, "status", e.target.value as any)}
                            className="p-1 rounded text-[11px] font-bold bg-white border border-slate-300"
                          >
                            <option value="APPROVED">APPROVED</option>
                            <option value="OVER_CLAIM">OVER_CLAIM</option>
                            <option value="VARIATION_PENDING">VARIATION_PENDING</option>
                            <option value="DISALLOWED">DISALLOWED</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                              item.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.status === "OVER_CLAIM"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        )}
                      </td>

                      {/* Row Action Buttons (Identical to Bill Verification) */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button aria-label={item.isLocked ? "Locked — Click to Unlock Row" : "Unlocked — Click to Lock Row"}
                            onClick={() => handleToggleLockItem(item.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              item.isLocked
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                            }`}
                            title={item.isLocked ? "Locked — Click to Unlock Row" : "Unlocked — Click to Lock Row"}
                          >
                            {item.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-700" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />}
                          </button>

                          <button aria-label="View Full Item Audit Dossier"
                            onClick={() => setDetailsItem(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-100 text-slate-700 hover:text-brand-700 transition-colors cursor-pointer"
                            title="View Full Item Audit Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button aria-label={item.isLocked ? "Item Locked" : "Edit Item in Full Modal Form"}
                            onClick={() => !item.isLocked && setEditingItem({ ...item })}
                            disabled={item.isLocked}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.isLocked
                                ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                : "bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 cursor-pointer"
                            }`}
                            title={item.isLocked ? "Item Locked" : "Edit Item in Full Modal Form"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button aria-label="Download Single Row CSV"
                            onClick={() => handleExportSingleRowCSV(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Download Single Row CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button aria-label="Live Preview Single Item PDF Certificate"
                            onClick={() => {
                              setShowPdfPreview(true);
                            }}
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0084bf] transition-colors cursor-pointer border border-sky-200/60"
                            title="Live Preview Single Item PDF Certificate"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button aria-label="Download Single PDF Report"
                            onClick={() => {
                              downloadPdfFile(`${API_BASE}/api/tpi/preview/BOQ.pdf`, `BOQ_Item_${item.itemNo}_Reconciliation.pdf`, "/sample-pdfs/BOQ.pdf");
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer border border-rose-200/60"
                            title="Download Single PDF Report"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button aria-label="Duplicate BOQ Item"
                            onClick={() => handleDuplicateItem(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 transition-colors cursor-pointer"
                            title="Duplicate BOQ Item"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button aria-label="Remove Line Item"
                            onClick={() => !item.isLocked && handleDeleteItem(item.id)}
                            disabled={item.isLocked}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.isLocked
                                ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                : "bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 cursor-pointer"
                            }`}
                            title="Remove Line Item"
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
        )}

          {/* Matrix Footer Totals */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2 text-slate-500">
              <span>Showing {filteredItems.length} of {items.length} BOQ line items</span>
              {isInlineEditMode && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold">
                  Inline Edit Mode Active
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-slate-400 text-[11px] uppercase block">Current Verified Total:</span>
                <span className="text-sm font-extrabold text-emerald-600 font-mono">
                  ₹{kpis.totalCurrentVerifiedVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] uppercase block">Disallowed Over-Claims:</span>
                <span className="text-sm font-extrabold text-rose-600 font-mono">
                  ₹{kpis.totalDisallowedVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] uppercase block">Cumulative Value To-Date:</span>
                <span className="text-sm font-extrabold text-[#003366] dark:text-sky-300 font-mono">
                  ₹{kpis.totalCumulativeVerifiedVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATERIAL CONSUMPTION AUDIT */}
      {activeTab === "materials" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#003366] dark:text-sky-300" />
              <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                Material Consumption &amp; Reconciliation Protocol ({materials.length} Materials)
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsInlineEditMaterials(!isInlineEditMaterials)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isInlineEditMaterials ? "bg-amber-400 text-slate-950 font-black shadow-sm" : "bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 border border-slate-200"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isInlineEditMaterials ? "Exit Inline Edit" : "Inline Edit"}</span>
              </button>

              <button
                type="button"
                onClick={handleAddMaterial}
                className="px-3 py-1.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Material</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <Scale className="w-5 h-5 shrink-0 text-[#e35f14] mt-0.5" />
            <div>
              <span className="font-extrabold">Material Reconciliation Protocol:</span> Reconciles theoretical consumption per design drawings against actual stock issued and incorporated in permanent works. If actual wastage exceeds permissible limits (IS code / tender clause 42), the excess material is deducted from the contractor&apos;s RA bill at penal recovery rates.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-3 pl-4">Material &amp; Specification</th>
                  <th className="p-3">Consumption Norm</th>
                  <th className="p-3 text-center">UOM</th>
                  <th className="p-3 text-right">Work Executed</th>
                  <th className="p-3 text-right">Theoretical Qty</th>
                  <th className="p-3 text-right">Actual Issued</th>
                  <th className="p-3 text-right font-extrabold text-slate-900">Actual Consumed</th>
                  <th className="p-3 text-right">Permissible %</th>
                  <th className="p-3 text-right font-bold">Actual Wastage %</th>
                  <th className="p-3 text-center">Audit Status</th>
                  <th className="p-3 text-right">Penal Rate (₹)</th>
                  <th className="p-3 text-right font-bold text-rose-600">Recovery Amount (₹)</th>
                  {isInlineEditMaterials && <th className="p-3 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 pl-4">
                      {isInlineEditMaterials ? (
                        <div className="space-y-1">
                          <input aria-label="Material name"
                            type="text"
                            value={m.materialName}
                            onChange={(e) => setMaterials(materials.map((x) => (x.id === m.id ? { ...x, materialName: e.target.value } : x)))}
                            className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-bold"
                          />
                          <input aria-label="Grade specification"
                            type="text"
                            value={m.gradeSpec}
                            onChange={(e) => setMaterials(materials.map((x) => (x.id === m.id ? { ...x, gradeSpec: e.target.value } : x)))}
                            className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-[11px] font-mono"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="font-bold text-slate-900">{m.materialName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{m.gradeSpec}</div>
                        </>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">{m.theoreticalNormPerUnit}</td>
                    <td className="p-3 text-center font-mono font-semibold">
                      {isInlineEditMaterials ? (
                        <input aria-label={`Unit for ${m.materialName}`}
                          type="text"
                          value={m.unit}
                          onChange={(e) => setMaterials(materials.map((x) => (x.id === m.id ? { ...x, unit: e.target.value } : x)))}
                          className="w-12 text-center p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                        />
                      ) : (
                        m.unit
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">{m.totalWorkExecutedQty.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {isInlineEditMaterials ? (
                        <input aria-label={`Theoretical consumption for ${m.materialName}`}
                          type="number"
                          value={m.theoreticalConsumption}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setMaterials(materials.map((x) => (x.id === m.id ? { ...x, theoreticalConsumption: val } : x)));
                          }}
                          className="w-20 text-right p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono"
                        />
                      ) : (
                        m.theoreticalConsumption.toLocaleString()
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-sky-600">
                      {isInlineEditMaterials ? (
                        <input aria-label={`Actual issued quantity for ${m.materialName}`}
                          type="number"
                          value={m.actualIssuedQty}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setMaterials(materials.map((x) => (x.id === m.id ? { ...x, actualIssuedQty: val } : x)));
                          }}
                          className="w-20 text-right p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono"
                        />
                      ) : (
                        m.actualIssuedQty.toLocaleString()
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {isInlineEditMaterials ? (
                        <input aria-label={`Actual consumed quantity for ${m.materialName}`}
                          type="number"
                          value={m.actualConsumedQty}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setMaterials(materials.map((x) => (x.id === m.id ? { ...x, actualConsumedQty: val } : x)));
                          }}
                          className="w-20 text-right p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono font-bold"
                        />
                      ) : (
                        m.actualConsumedQty.toLocaleString()
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {isInlineEditMaterials ? (
                        <input aria-label={`Permissible wastage percent for ${m.materialName}`}
                          type="number"
                          value={m.permissibleWastagePercent}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setMaterials(materials.map((x) => (x.id === m.id ? { ...x, permissibleWastagePercent: val } : x)));
                          }}
                          className="w-16 text-right p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono"
                        />
                      ) : (
                        `${m.permissibleWastagePercent}%`
                      )}
                    </td>
                    <td className={`p-3 text-right font-mono font-extrabold ${m.actualWastagePercent > m.permissibleWastagePercent ? "text-rose-600" : "text-emerald-600"}`}>
                      {m.actualWastagePercent}%
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {m.status === "NORMAL" && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Within Tolerance
                        </span>
                      )}
                      {m.status === "EXCESS_WASTAGE" && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Excess Wastage
                        </span>
                      )}
                      {m.status === "SAVING" && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                          Material Saving
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {isInlineEditMaterials ? (
                        <input aria-label={`Recovery rate per unit for ${m.materialName}`}
                          type="number"
                          value={m.recoveryRatePerUnit}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setMaterials(materials.map((x) => (x.id === m.id ? { ...x, recoveryRatePerUnit: val } : x)));
                          }}
                          className="w-20 text-right p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono"
                        />
                      ) : (
                        `₹${m.recoveryRatePerUnit.toLocaleString()}`
                      )}
                    </td>
                    <td className={`p-3 text-right font-mono font-extrabold whitespace-nowrap ${m.excessRecoveryAmount > 0 ? "text-rose-600" : "text-slate-400"}`}>
                      {m.excessRecoveryAmount > 0 ? `₹${m.excessRecoveryAmount.toLocaleString()}` : "Nil"}
                    </td>
                    {isInlineEditMaterials && (
                      <td className="p-3 text-center">
                        <button aria-label="Delete Material Row"
                          type="button"
                          onClick={() => setMaterials(materials.filter((x) => x.id !== m.id))}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Material Row"
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

          <div className="p-3 bg-slate-50 border-t border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Material audit governed per CPWD Specification 2021 &amp; Contract Clause 42</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-[11px] uppercase">Total Excess Material Recovery:</span>
              <span className="text-sm font-extrabold text-rose-600 font-mono">
                ₹{kpis.totalMaterialExcessRecovery.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VARIATIONS & EXTRA ITEMS */}
      {activeTab === "variations" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <BadgeAlert className="w-5 h-5 text-purple-600" />
              <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                Variations, Deviations &amp; Extra Items ({variations.length} Change Orders)
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsInlineEditVariations(!isInlineEditVariations)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isInlineEditVariations ? "bg-amber-400 text-slate-950 font-black shadow-sm" : "bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 border border-slate-200"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isInlineEditVariations ? "Exit Inline Edit" : "Inline Edit"}</span>
              </button>

              <button
                type="button"
                onClick={handleAddVariation}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Change Order</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-start gap-3">
            <BadgeAlert className="w-5 h-5 shrink-0 text-purple-600 mt-0.5" />
            <div>
              <span className="font-extrabold">Deviation &amp; Extra Item Governance:</span> Items where physical execution exceeds sanctioned contract limits or new items necessitated by site engineering changes. Rate analysis must be verified per market rates + 15% contractor profit before certifying.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variations.map((v) => (
              <div key={v.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 relative group">
                {isInlineEditVariations && (
                  <button aria-label="Delete Change Order"
                    type="button"
                    onClick={() => setVariations(variations.filter((x) => x.id !== v.id))}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-sm cursor-pointer z-10"
                    title="Delete Change Order"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="flex items-center justify-between pr-8">
                  {isInlineEditVariations ? (
                    <input aria-label="Change order number"
                      type="text"
                      value={v.coNumber}
                      onChange={(e) => setVariations(variations.map((x) => (x.id === v.id ? { ...x, coNumber: e.target.value } : x)))}
                      className="font-bold text-xs uppercase text-slate-700 p-1 bg-amber-50 border border-amber-300 rounded"
                    />
                  ) : (
                    <span className="font-bold text-xs uppercase text-slate-500">{v.coNumber}</span>
                  )}
                  {isInlineEditVariations ? (
                    <input aria-label="Change order status"
                      type="text"
                      value={v.status}
                      onChange={(e) => setVariations(variations.map((x) => (x.id === v.id ? { ...x, status: e.target.value } : x)))}
                      className="text-[11px] font-bold p-1 bg-amber-50 border border-amber-300 rounded"
                    />
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${v.status === "Client Approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {v.status}
                    </span>
                  )}
                </div>

                {isInlineEditVariations ? (
                  <input aria-label="Change order title"
                    type="text"
                    value={v.title}
                    onChange={(e) => setVariations(variations.map((x) => (x.id === v.id ? { ...x, title: e.target.value } : x)))}
                    className="font-extrabold text-sm text-slate-900 w-full p-1 bg-amber-50 border border-amber-300 rounded"
                  />
                ) : (
                  <h3 className="font-extrabold text-sm text-slate-900">{v.title}</h3>
                )}

                {isInlineEditVariations ? (
                  <textarea aria-label="Change order description"
                    rows={2}
                    value={v.description}
                    onChange={(e) => setVariations(variations.map((x) => (x.id === v.id ? { ...x, description: e.target.value } : x)))}
                    className="text-xs text-slate-600 leading-relaxed w-full p-1 bg-amber-50 border border-amber-300 rounded"
                  />
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed">{v.description}</p>
                )}

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  {isInlineEditVariations ? (
                    <input aria-label="Quantity variation"
                      type="text"
                      value={v.qtyVariation}
                      onChange={(e) => setVariations(variations.map((x) => (x.id === v.id ? { ...x, qtyVariation: e.target.value } : x)))}
                      className="text-slate-700 p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                      placeholder="Qty variation"
                    />
                  ) : (
                    <span className="text-slate-500">Qty Variation: {v.qtyVariation}</span>
                  )}
                  {isInlineEditVariations ? (
                    <input aria-label="Variation value"
                      type="text"
                      value={v.value}
                      onChange={(e) => setVariations(variations.map((x) => (x.id === v.id ? { ...x, value: e.target.value } : x)))}
                      className="font-bold text-purple-600 font-mono p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                      placeholder="Value"
                    />
                  ) : (
                    <span className="font-bold text-purple-600 font-mono">Value: {v.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TPI AUDIT SIGN-OFF CERTIFICATE */}
      {activeTab === "signoff" && (
        <div className="keep-light bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 font-heading">
                  TPI BOQ Audit &amp; Technical Recommendation Certificate
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#003366] text-white font-mono text-[11px] font-bold">
                  CERT-IQE-BOQ-2026-089
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pursuant to Joint Site Physical Measurements &amp; General Conditions of Contract (GCC).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPdfPreview(true)}
                className="px-3 py-1.5 rounded-xl bg-[#0084bf] hover:bg-[#0073a8] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Preview Certificate"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview / Print</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await downloadPdfFile(
                    `${API_BASE}/api/tpi/preview/BOQ.pdf`,
                    "CERT-IQE-BOQ-2026-089.pdf",
                    "/sample-pdfs/BOQ.pdf"
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Download PDF Certificate"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Certificate</span>
              </button>

              <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs font-bold">
                PASSED FOR BILL VERIFICATION
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-500 uppercase block">1. Gross Work Certified</span>
              <div className="text-xl font-extrabold text-slate-900 font-mono">
                ₹{kpis.totalCurrentVerifiedVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500">
                Verified against Joint Measurement Sheets and approved drawings.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-500 uppercase block">2. Total Technical Deductions</span>
              <div className="text-xl font-extrabold text-rose-600 font-mono">
                ₹{(kpis.totalDisallowedVal + kpis.totalMaterialExcessRecovery).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500">
                Over-claim (₹{kpis.totalDisallowedVal.toLocaleString()}) + Material recovery (₹{kpis.totalMaterialExcessRecovery.toLocaleString()}).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-500 uppercase block">3. Net Certified for RA Billing</span>
              <div className="text-xl font-extrabold text-emerald-600 font-mono">
                ₹{(kpis.totalCurrentVerifiedVal - kpis.totalMaterialExcessRecovery).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500">
                Recommended to commercial team for Clause 12.3 bill verification.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-4 rounded-xl border border-dashed border-slate-300 space-y-3">
              <div className="text-slate-400 uppercase text-[11px]">TPI Lead Inspection Engineer</div>
              <div className="font-bold text-sm text-slate-900">Alok Gupta, PE</div>
              <div className="text-[11px] text-slate-500">Emp ID: IQE-TPI-8821 &bull; Certified Date: 2026-09-29</div>
              <div className="pt-1 text-emerald-600 font-mono text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Digitally Verified via IQE Engine
              </div>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-slate-300 space-y-3">
              <div className="text-slate-400 uppercase text-[11px]">Contractor Project Manager</div>
              <div className="font-bold text-sm text-slate-900">{projectInfo.epcContractor}</div>
              <div className="text-[11px] text-slate-500">Acceptance: Endorsed without objections</div>
              <div className="pt-1 text-slate-500 font-mono text-[11px] font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Physical MB Endorsed
              </div>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-slate-300 space-y-3">
              <div className="text-slate-400 uppercase text-[11px]">Employer / Client Quality Lead</div>
              <div className="font-bold text-sm text-slate-900">{selectedClient}</div>
              <div className="text-[11px] text-slate-500">Concurrence: Approved for Billing Payment</div>
              <div className="pt-1 text-blue-600 font-mono text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Forwarded to Accounts
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ⚡ IS 1200 AUTONOMOUS RECONCILER & DEDUCTION MEMO */}
      {activeTab === "is1200" && (
        <div className="space-y-6">
          {/* Executive Header */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-sky-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  IS 1200 Part 1–28 &amp; IS 1786 Algorithmic Reconciliation Engine
                </div>
                <h2 className="text-2xl font-bold font-heading text-white">
                  Autonomous Civil BOQ &amp; Waybill Reconciler
                </h2>
                <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                  Automated rebar theoretical weight computation (D²/162 × L × 1.03), 3% permissible rolling margin limits, transit loss capping, and automated deduction memo dispatch.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={loadIS1200Audit}
                  disabled={loadingAudit}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? "animate-spin" : ""}`} />
                  <span>{loadingAudit ? "Re-Auditing..." : "Re-Run IS 1200 Audit"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Memo</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 BENTO KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Steel */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Scale className="w-5 h-5" />
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                  IS 1200 Part 8
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xs text-slate-500 font-medium">Excess Steel Scrap Deduction</div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                  ₹{((is1200Audit?.steel_reconciliation?.excess_recovery_inr || 1190000) / 100000).toFixed(2)} Lakhs
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Theoretical (Design):</span>
                  <span className="font-mono font-bold">{is1200Audit?.steel_reconciliation?.total_theoretical_mt || 1284.52} MT</span>
                </div>
                <div className="flex justify-between">
                  <span>Waybills Received:</span>
                  <span className="font-mono font-bold">{is1200Audit?.steel_reconciliation?.total_waybill_received_mt || 1342.1} MT</span>
                </div>
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Excess Wastage:</span>
                  <span className="font-mono font-bold">+{is1200Audit?.steel_reconciliation?.excess_scrap_mt || 19.04} MT</span>
                </div>
              </div>
            </div>

            {/* Card 2: Concrete */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <Layers className="w-5 h-5" />
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                  IS 1200 Part 2
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xs text-slate-500 font-medium">Concrete Transit Disallowance</div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                  ₹{((is1200Audit?.concrete_audit?.disallowed_inr || 314960) / 100000).toFixed(2)} Lakhs
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Designed Quantity:</span>
                  <span className="font-mono font-bold">{is1200Audit?.concrete_audit?.designed_cum || 8420} Cum</span>
                </div>
                <div className="flex justify-between">
                  <span>Contractor Claim:</span>
                  <span className="font-mono font-bold">{is1200Audit?.concrete_audit?.claimed_cum || 8555} Cum</span>
                </div>
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Disallowed Transit:</span>
                  <span className="font-mono font-bold">-{is1200Audit?.concrete_audit?.disallowed_cum || 50.8} Cum</span>
                </div>
              </div>
            </div>

            {/* Card 3: Waybills */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800">
                  124 Waybills
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xs text-slate-500 font-medium">Disputed Waybill Slips</div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                  ₹4.19 Lakhs
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Verified Valid:</span>
                  <span className="font-mono font-bold text-emerald-600">{is1200Audit?.waybills_summary?.verified_valid || 119}</span>
                </div>
                <div className="flex justify-between">
                  <span>Missing Slips:</span>
                  <span className="font-mono font-bold text-rose-600">{is1200Audit?.waybills_summary?.missing_weighbridge_slip || 5}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Disputed Weight:</span>
                  <span className="font-mono font-bold">{is1200Audit?.waybills_summary?.disputed_qty_mt || 14.8} MT</span>
                </div>
              </div>
            </div>

            {/* Card 4: Total Savings */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-white/20 text-white">
                  <Coins className="w-5 h-5" />
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white">
                  Direct Recovery
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xs text-emerald-100 font-medium">Total Discrepancy Savings</div>
                <div className="text-2xl font-black font-mono mt-0.5">
                  ₹{((is1200Audit?.total_discrepancy_savings_inr || 1923480) / 100000).toFixed(2)} Lakhs
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/20 space-y-1 text-xs text-emerald-50">
                <div className="flex justify-between">
                  <span>Items Audited:</span>
                  <span className="font-mono font-bold">{is1200Audit?.total_items_audited || 100} Items</span>
                </div>
                <div className="flex justify-between">
                  <span>Deduction Memo:</span>
                  <span className="font-mono font-bold">Generated &amp; Enforceable</span>
                </div>
              </div>
            </div>
          </div>

          {/* DEDUCTION MEMO DOSSIER */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 font-heading">
                    Formal Technical Deduction Memo
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono text-[11px] font-bold">
                    {is1200Audit?.deduction_memo?.memo_ref || "MEMO/IQE/MUDIGONDA/2026/044"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory disallowance instrument issued pursuant to IS 1200 Part 1–28 &amp; GCC Clause 44.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Legally Binding TPI Audit
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-slate-500 font-medium uppercase text-[11px]">Contractor &amp; Project</div>
                <div className="font-bold text-sm text-slate-900">{is1200Audit?.deduction_memo?.contractor || "Apex Infra Projects Ltd"}</div>
                <div className="text-slate-600">{is1200Audit?.project_name || "Mudigonda 220kV Substation Civil & Structural Works"}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-slate-500 font-medium uppercase text-[11px]">Financial Summary</div>
                <div className="flex justify-between text-slate-700">
                  <span>Gross Claimed:</span>
                  <span className="font-mono font-bold">₹{((is1200Audit?.deduction_memo?.gross_claimed_inr || 79640000) / 100000).toFixed(2)} Lakhs</span>
                </div>
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Total Deductions:</span>
                  <span className="font-mono font-bold">-₹{((is1200Audit?.total_discrepancy_savings_inr || 1923480) / 100000).toFixed(2)} Lakhs</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                  <span>Net Recommended:</span>
                  <span className="font-mono">₹{((is1200Audit?.deduction_memo?.net_recommended_inr || 77716520) / 100000).toFixed(2)} Lakhs</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-slate-500 font-medium uppercase text-[11px]">Itemized Disallowances</div>
                <div className="flex justify-between text-slate-700">
                  <span>Steel Scrap Excess:</span>
                  <span className="font-mono font-bold text-amber-700">₹11.90 Lakhs</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Concrete Transit:</span>
                  <span className="font-mono font-bold text-blue-700">₹3.15 Lakhs</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Unsupported Waybills:</span>
                  <span className="font-mono font-bold text-purple-700">₹4.19 Lakhs</span>
                </div>
              </div>
            </div>
          </div>

          {/* AUDITED TOP VARIANCES TABLE */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Audited Line Items &amp; Physical Variances (Top Discrepancies)
                </h3>
                <p className="text-xs text-slate-500">
                  Physical site laser measurement vs contractor RA bill claim.
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-800 font-mono text-xs font-bold border border-blue-200">
                {is1200Audit?.top_variances?.length || 10} Items Flagged
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item Code</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Tender Qty</th>
                    <th className="py-2.5 px-3 text-right">Claimed Qty</th>
                    <th className="py-2.5 px-3 text-right">Verified Qty</th>
                    <th className="py-2.5 px-3 text-right">Discrepancy</th>
                    <th className="py-2.5 px-3 text-right">Deducted (₹)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(is1200Audit?.top_variances || []).slice(0, 10).map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{item.item_code}</td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-slate-800" title={item.description}>
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{item.tender_qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600">{item.claimed_qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600">{item.verified_qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                        -{(item.claimed_qty - item.verified_qty).toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">
                        ₹{(item.discrepancy_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI VISION & OCR WEIGHBRIDGE SCANNER (TOP 1) */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 font-heading">
                    AI Vision &amp; OCR Weighbridge Slip Scanner
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold">
                    IS 1200 Part 8 &bull; 99.4% OCR Confidence
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Extract gross, tare, net certified tonnage, calibration certificate, and vehicle registration from thermal weighbridge slips.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleParseWaybill("steel_tmt")}
                  disabled={parsingWaybill}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    selectedSlipType === "steel_tmt"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Tata Steel TMT (28.45 MT)
                </button>
                <button
                  type="button"
                  onClick={() => handleParseWaybill("concrete_rmc")}
                  disabled={parsingWaybill}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    selectedSlipType === "concrete_rmc"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  UltraTech RMC (8.00 Cum)
                </button>
                <button
                  type="button"
                  onClick={() => handleParseWaybill("steel_plates")}
                  disabled={parsingWaybill}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    selectedSlipType === "steel_plates"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  SAIL Plates (24.20 MT)
                </button>
              </div>
            </div>

            {/* OCR Dropzone & Scanner View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Interactive Dropzone / Scanner Action */}
              <div className="lg:col-span-5 p-5 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Thermal Waybill Ticket Input
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      Vision OCR Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Select a preset weighbridge receipt above or simulate live OCR image capture to verify weight against contractor tender billing caps.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-blue-200 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      {parsingWaybill ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {parsingWaybill ? "Processing OCR Neural Pipeline..." : "Scan or Upload Weighbridge Slip"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Supports Scanned JPG, PNG, PDF Weighbridge Slips
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleParseWaybill(selectedSlipType)}
                    disabled={parsingWaybill}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {parsingWaybill ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Extracting Coordinates &amp; Tonnage...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5" />
                        <span>Run Live AI OCR Extraction</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Stamping calibrated per Legal Metrology (Weights &amp; Measures) Act.</span>
                </div>
              </div>

              {/* Right Column: OCR Extraction Results Card */}
              <div className="lg:col-span-7 p-5 rounded-xl bg-slate-900 text-white shadow-md relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                      OCR Extracted Waybill Docket
                    </span>
                  </div>
                  {parsedSlip && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold">
                      Confidence: {parsedSlip.confidence_score}%
                    </span>
                  )}
                </div>

                {parsedSlip ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                        <div className="text-[10px] text-slate-400 uppercase">Docket Slip No</div>
                        <div className="font-mono font-bold text-amber-300 text-sm mt-0.5">{parsedSlip.slip_no}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                        <div className="text-[10px] text-slate-400 uppercase">Vehicle Reg</div>
                        <div className="font-mono font-bold text-white text-xs mt-0.5 truncate" title={parsedSlip.vehicle_number}>
                          {parsedSlip.vehicle_number.split(" ")[0]}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                        <div className="text-[10px] text-slate-400 uppercase">Gross Weight</div>
                        <div className="font-mono font-bold text-slate-200 text-sm mt-0.5">{parsedSlip.gross_weight_mt} MT</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                        <div className="text-[10px] text-slate-400 uppercase">Tare Weight</div>
                        <div className="font-mono font-bold text-slate-400 text-sm mt-0.5">{parsedSlip.tare_weight_mt} MT</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-blue-950/80 border border-blue-800">
                        <div className="text-[10px] text-sky-400 uppercase font-bold">Net Certified Tonnage</div>
                        <div className="font-mono font-extrabold text-emerald-400 text-base mt-0.5">{parsedSlip.net_weight_mt} MT</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                        <div className="text-[10px] text-slate-400 uppercase">Calibration Certificate</div>
                        <div className="font-mono font-bold text-slate-300 text-[11px] mt-0.5 truncate" title={parsedSlip.calibration_cert}>
                          {parsedSlip.calibration_cert.split(" ")[0]}
                        </div>
                      </div>
                    </div>

                    {/* Extracted OCR Neural Tags */}
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-300">
                        Material &amp; Supplier Validation
                      </div>
                      <div className="text-xs text-slate-200">
                        <strong className="text-white">{parsedSlip.material}</strong> &bull; {parsedSlip.supplier}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(parsedSlip.extracted_fields || []).map((field: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-700/80 text-[10px] text-slate-300 border border-slate-600 font-mono"
                          >
                            {field.label}: <strong className="text-sky-300">{field.value}</strong> ({field.confidence}%)
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions and Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {parsedSlip.tamper_seal} &bull; {parsedSlip.is_1200_status}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAppendSlipToLedger}
                        disabled={waybillLedgerAppended}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                          waybillLedgerAppended
                            ? "bg-emerald-600 text-white cursor-default"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>{waybillLedgerAppended ? "Appended to Active Ledger ✓" : "Append to Active Ledger & Reconcile"}</span>
                      </button>
                    </div>

                    {waybillLedgerAppended && (
                      <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          <strong>Success:</strong> Docket <strong>{parsedSlip.slip_no}</strong> ({parsedSlip.net_weight_mt} MT) successfully appended to IS 1200 Material Reconciliation Ledger.
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-10 text-center space-y-2">
                    <Scale className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-sm font-semibold text-slate-300">
                      No Waybill Slip Selected
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Click &ldquo;Run Live AI OCR Extraction&rdquo; or pick one of the sample slips above to scan and parse gross/tare tonnages.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* COMPREHENSIVE EDIT MODAL (Identical Multi-Section Layout to Bill Verification) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Edit BOQ Item &bull; {editingItem.itemNo}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                      Full Audit Parameter Form
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    Client: <strong className="text-slate-700">{selectedClient}</strong> | Contractor: <strong className="text-slate-700">{projectInfo.epcContractor}</strong>
                  </p>
                </div>
              </div>
              <button aria-label="Close" title="Close"
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="space-y-5 text-xs">
              {/* SECTION 1: Item Identification */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <h3 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider">
                  1. Item Identification &amp; Technical Classification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="boq-item-code" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#1</span>
                      Item Code *
                    </label>
                    <input id="boq-item-code"
                      type="text"
                      required
                      value={editingItem.itemNo}
                      onChange={(e) => setEditingItem({ ...editingItem, itemNo: e.target.value })}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="boq-discipline" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#2</span>
                      Discipline *
                    </label>
                    <select id="boq-discipline"
                      value={editingItem.discipline}
                      onChange={(e) => setEditingItem({ ...editingItem, discipline: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold"
                    >
                      <option value="Civil">Civil</option>
                      <option value="Structural">Structural</option>
                      <option value="Piping">Piping</option>
                      <option value="Electrical">Electrical</option>
                      <option value="HVAC">HVAC</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="boq-unit-of-measure-uom" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#3</span>
                      Unit of Measure (UOM) *
                    </label>
                    <input id="boq-unit-of-measure-uom"
                      type="text"
                      required
                      value={editingItem.unit}
                      onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label htmlFor="boq-work-description-and-scope-specification" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#4</span>
                      Work Description &amp; Scope Specification *
                    </label>
                    <textarea id="boq-work-description-and-scope-specification"
                      required
                      rows={2}
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Contractual Quantities & Revised Cap */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <h3 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider">
                  2. Contractual Quantities &amp; Ceiling Cap
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label htmlFor="boq-tender-qty" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#5</span>
                      Tender Qty
                    </label>
                    <input id="boq-tender-qty"
                      type="number"
                      step="any"
                      min={0}
                      value={editingItem.tenderQty}
                      onChange={(e) => setEditingItem({ ...editingItem, tenderQty: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white font-mono font-bold text-slate-900 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label htmlFor="boq-approved-variation" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#6</span>
                      Approved Variation
                    </label>
                    <input id="boq-approved-variation"
                      type="number"
                      step="any"
                      value={editingItem.approvedVariationQty}
                      onChange={(e) => setEditingItem({ ...editingItem, approvedVariationQty: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white font-mono font-bold text-purple-700 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#7</span>
                      Revised Ceiling Cap
                    </label>
                    <div className="px-3 py-2 bg-blue-50/80 font-mono font-extrabold text-blue-900 border border-blue-200 rounded-xl">
                      {(editingItem.tenderQty + editingItem.approvedVariationQty).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="boq-contract-unit-rate" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#8</span>
                      Contract Unit Rate (₹) *
                    </label>
                    <input id="boq-contract-unit-rate"
                      type="number"
                      step="any"
                      min={0}
                      value={editingItem.contractRate}
                      onChange={(e) => setEditingItem({ ...editingItem, contractRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white font-mono font-bold text-slate-900 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Current Measurement & Verification */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <h3 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider">
                  3. Measurements &amp; Physical Verification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label htmlFor="boq-previously-certified-qty" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#9</span>
                      Previously Certified Qty
                    </label>
                    <input id="boq-previously-certified-qty"
                      type="number"
                      step="any"
                      min={0}
                      value={editingItem.prevCertifiedQty}
                      onChange={(e) => setEditingItem({ ...editingItem, prevCertifiedQty: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white font-mono font-bold text-slate-900 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label htmlFor="boq-contractor-claimed-qty" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[11px] mr-1">#10</span>
                      Contractor Claimed Qty
                    </label>
                    <input id="boq-contractor-claimed-qty"
                      type="number"
                      step="any"
                      min={0}
                      value={editingItem.currentClaimedQty}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditingItem({
                          ...editingItem,
                          currentClaimedQty: val,
                          status: val > editingItem.currentVerifiedQty ? "OVER_CLAIM" : "APPROVED",
                        });
                      }}
                      className="w-full px-3 py-2 bg-amber-50 font-mono font-bold text-amber-900 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="boq-tpi-verified-qty" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[11px] mr-1">#11</span>
                      TPI Verified Qty
                    </label>
                    <input id="boq-tpi-verified-qty"
                      type="number"
                      step="any"
                      min={0}
                      value={editingItem.currentVerifiedQty}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditingItem({
                          ...editingItem,
                          currentVerifiedQty: val,
                          status: editingItem.currentClaimedQty > val ? "OVER_CLAIM" : "APPROVED",
                        });
                      }}
                      className="w-full px-3 py-2 bg-emerald-50 font-mono font-bold text-emerald-900 border border-emerald-400 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono text-[11px] mr-1">#12</span>
                      Disallowed Over-Claim Qty
                    </label>
                    <div className={`px-3 py-2 font-mono font-extrabold rounded-xl border ${
                      editingItem.currentClaimedQty > editingItem.currentVerifiedQty
                        ? "bg-rose-50 text-rose-700 border-rose-300"
                        : "bg-slate-100 text-slate-400 border-slate-200"
                    }`}>
                      {Math.max(0, editingItem.currentClaimedQty - editingItem.currentVerifiedQty).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Engineering Remarks & Quality Audit */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <h3 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider">
                  4. References &amp; Engineering Quality Audit
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="boq-jmr-sheet-mb-page-ref" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#13</span>
                      JMR Sheet / MB Page Ref
                    </label>
                    <input id="boq-jmr-sheet-mb-page-ref"
                      type="text"
                      value={editingItem.jmrRef}
                      onChange={(e) => setEditingItem({ ...editingItem, jmrRef: e.target.value })}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label htmlFor="boq-gfc-drawing-ref" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#14</span>
                      GFC Drawing Ref
                    </label>
                    <input id="boq-gfc-drawing-ref"
                      type="text"
                      value={editingItem.drawingRef || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, drawingRef: e.target.value })}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono"
                      placeholder="e.g. GFC-CIV-FOUND-01"
                    />
                  </div>

                  <div>
                    <label htmlFor="boq-audit-status" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#15</span>
                      Audit Status
                    </label>
                    <select id="boq-audit-status"
                      value={editingItem.status}
                      onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold"
                    >
                      <option value="APPROVED">APPROVED</option>
                      <option value="OVER_CLAIM">OVER_CLAIM</option>
                      <option value="VARIATION_PENDING">VARIATION_PENDING</option>
                      <option value="DISALLOWED">DISALLOWED</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label htmlFor="boq-tpi-technical-observation-and-non" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#16</span>
                      TPI Technical Observation &amp; Non-Conformance Remarks
                    </label>
                    <input id="boq-tpi-technical-observation-and-non"
                      type="text"
                      value={editingItem.remarks || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, remarks: e.target.value })}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl"
                      placeholder="e.g. Disallowed 130 Cum beyond tender pay-line limits per clause 4.2"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save BOQ Line Item Updates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ITEM DOSSIER MODAL (Eye Icon Click) */}
      {detailsItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-900 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-mono font-bold">
                  {detailsItem.itemNo}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    BOQ Line Item Technical Audit Dossier
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Discipline: <strong>{detailsItem.discipline}</strong> | Ref: <strong>{detailsItem.jmrRef}</strong>
                  </p>
                </div>
              </div>
              <button aria-label="Close" title="Close"
                onClick={() => setDetailsItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">Description</span>
                <p className="font-semibold text-slate-900 mt-1 leading-relaxed">{detailsItem.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-mono">Tender Qty</span>
                  <span className="font-extrabold font-mono text-sm text-slate-900">{detailsItem.tenderQty.toLocaleString()} {detailsItem.unit}</span>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-[11px] text-purple-700 block font-mono">Variation Qty</span>
                  <span className="font-extrabold font-mono text-sm text-purple-700">+{detailsItem.approvedVariationQty} {detailsItem.unit}</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[11px] text-blue-700 block font-mono">Revised Cap</span>
                  <span className="font-extrabold font-mono text-sm text-blue-900">{(detailsItem.tenderQty + detailsItem.approvedVariationQty).toLocaleString()} {detailsItem.unit}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-mono">Unit Rate</span>
                  <span className="font-extrabold font-mono text-sm text-slate-900">₹{detailsItem.contractRate.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] text-amber-800 font-bold block uppercase">Contractor Claimed</span>
                  <span className="font-extrabold font-mono text-lg text-amber-900">
                    {detailsItem.currentClaimedQty.toLocaleString()} {detailsItem.unit}
                  </span>
                  <p className="text-[11px] text-amber-800 font-mono mt-0.5">
                    = ₹{(detailsItem.currentClaimedQty * detailsItem.contractRate).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-bold block uppercase">TPI Verified Value</span>
                  <span className="font-extrabold font-mono text-lg text-emerald-900">
                    {detailsItem.currentVerifiedQty.toLocaleString()} {detailsItem.unit}
                  </span>
                  <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                    = ₹{(detailsItem.currentVerifiedQty * detailsItem.contractRate).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[11px] text-rose-800 font-bold block uppercase">Disallowed Over-Claim</span>
                  <span className="font-extrabold font-mono text-lg text-rose-900">
                    {Math.max(0, detailsItem.currentClaimedQty - detailsItem.currentVerifiedQty).toLocaleString()} {detailsItem.unit}
                  </span>
                  <p className="text-[11px] text-rose-800 font-mono mt-0.5">
                    = ₹{(Math.max(0, detailsItem.currentClaimedQty - detailsItem.currentVerifiedQty) * detailsItem.contractRate).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {detailsItem.remarks && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Auditor Observation</span>
                  <p className="font-medium text-slate-800 mt-1">{detailsItem.remarks}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setDetailsItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-slate-900 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                Add New BOQ Line Item #{items.length + 1}
              </h3>
              <button aria-label="Close" title="Close"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                const created: BOQItem = {
                  id: `boq-${Date.now()}`,
                  itemNo: (fd.get("itemNo") as string) || `CIV-${items.length + 1}`,
                  description: (fd.get("description") as string) || "General Work Description",
                  discipline: (fd.get("discipline") as any) || "Civil",
                  unit: (fd.get("unit") as string) || "Cum",
                  tenderQty: parseFloat(fd.get("tenderQty") as string) || 0,
                  approvedVariationQty: parseFloat(fd.get("approvedVariationQty") as string) || 0,
                  prevCertifiedQty: parseFloat(fd.get("prevCertifiedQty") as string) || 0,
                  currentClaimedQty: parseFloat(fd.get("currentClaimedQty") as string) || 0,
                  currentVerifiedQty: parseFloat(fd.get("currentVerifiedQty") as string) || 0,
                  contractRate: parseFloat(fd.get("contractRate") as string) || 0,
                  jmrRef: (fd.get("jmrRef") as string) || "JMR-SITE/01",
                  drawingRef: (fd.get("drawingRef") as string) || "GFC-DWG-01",
                  status: (fd.get("status") as any) || "APPROVED",
                  remarks: (fd.get("remarks") as string) || "",
                  isLocked: false,
                };
                setItems((prev) => [...prev, created]);
                setShowAddModal(false);
                triggerSaveToast();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="boq-item-code-2" className="block text-slate-700 font-bold mb-1">Item Code *</label>
                  <input id="boq-item-code-2"
                    type="text"
                    name="itemNo"
                    required
                    placeholder="e.g. CIV-04.2"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="boq-discipline-2" className="block text-slate-700 font-bold mb-1">Discipline *</label>
                  <select id="boq-discipline-2" name="discipline" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold">
                    <option value="Civil">Civil</option>
                    <option value="Structural">Structural</option>
                    <option value="Piping">Piping</option>
                    <option value="Electrical">Electrical</option>
                    <option value="HVAC">HVAC</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="boq-description" className="block text-slate-700 font-bold mb-1">Description *</label>
                <textarea id="boq-description"
                  name="description"
                  required
                  rows={2}
                  placeholder="Detailed work description..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="boq-uom" className="block text-slate-700 font-bold mb-1">UOM *</label>
                  <input id="boq-uom"
                    type="text"
                    name="unit"
                    required
                    defaultValue="Cum"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="boq-tender-qty-2" className="block text-slate-700 font-bold mb-1">Tender Qty *</label>
                  <input id="boq-tender-qty-2"
                    type="number"
                    name="tenderQty"
                    step="any"
                    required
                    defaultValue={100}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="boq-approved-var" className="block text-slate-700 font-bold mb-1">Approved Var</label>
                  <input id="boq-approved-var"
                    type="number"
                    name="approvedVariationQty"
                    step="any"
                    defaultValue={0}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="boq-claimed-qty" className="block text-slate-700 font-bold mb-1">Claimed Qty *</label>
                  <input id="boq-claimed-qty"
                    type="number"
                    name="currentClaimedQty"
                    step="any"
                    required
                    defaultValue={20}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-amber-800 font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="boq-verified-qty" className="block text-slate-700 font-bold mb-1">Verified Qty *</label>
                  <input id="boq-verified-qty"
                    type="number"
                    name="currentVerifiedQty"
                    step="any"
                    required
                    defaultValue={20}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-emerald-800 font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="boq-rate" className="block text-slate-700 font-bold mb-1">Rate (₹) *</label>
                  <input id="boq-rate"
                    type="number"
                    name="contractRate"
                    step="any"
                    required
                    defaultValue={1200}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="boq-jmr-reference" className="block text-slate-700 font-bold mb-1">JMR Reference</label>
                  <input id="boq-jmr-reference"
                    type="text"
                    name="jmrRef"
                    defaultValue="JMR-SITE/01"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="boq-status" className="block text-slate-700 font-bold mb-1">Status</label>
                  <select id="boq-status" name="status" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold">
                    <option value="APPROVED">APPROVED</option>
                    <option value="OVER_CLAIM">OVER_CLAIM</option>
                    <option value="VARIATION_PENDING">VARIATION_PENDING</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="boq-engineering-remarks" className="block text-slate-700 font-bold mb-1">Engineering Remarks</label>
                <input id="boq-engineering-remarks"
                  type="text"
                  name="remarks"
                  placeholder="Verification observations..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Line Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standardized Live PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        formCode="FBOQ01"
        payload={{
          report_no: "IQE/BOQ-REC/2026/012",
          revision: "00",
          date: new Date().toISOString().split("T")[0],
          customer: projectInfo.endClient || selectedClient,
          project: `${projectInfo.projectName} (${projectInfo.projectLocation})`,
          supplier: projectInfo.epcContractor,
          epc_contractor: projectInfo.epcContractor,
          contract_ref: projectInfo.contractRef,
          reconciliation_period: projectInfo.period,
          inspector: projectInfo.leadInspector,
          total_tender_amt: kpis.totalSanctionedTenderVal,
          total_variation_amt: kpis.totalApprovedVariationVal,
          total_verified_amt: kpis.totalCurrentVerifiedVal,
          total_variance_amt: kpis.totalDisallowedVal,
          items: items.map((i, idx) => ({
            sl: idx + 1,
            item_no: i.itemNo,
            description: i.description,
            discipline: i.discipline,
            unit: i.unit,
            tender_qty: i.tenderQty,
            approved_var: i.approvedVariationQty,
            prev_cert: i.prevCertifiedQty,
            claimed_qty: i.currentClaimedQty,
            verified_qty: i.currentVerifiedQty,
            contract_rate: i.contractRate,
            status: i.status,
          })),
          total_tender_qty: items.reduce((acc, i) => acc + (i.tenderQty || 0), 0),
          total_variation_qty: items.reduce((acc, i) => acc + (i.approvedVariationQty || 0), 0),
          total_prev_cert_qty: items.reduce((acc, i) => acc + (i.prevCertifiedQty || 0), 0),
          total_claimed_qty: items.reduce((acc, i) => acc + (i.currentClaimedQty || 0), 0),
          total_verified_qty: items.reduce((acc, i) => acc + (i.currentVerifiedQty || 0), 0),
          materials: materials.map((m, idx) => ({
            sl: idx + 1,
            material_name: `${m.materialName} (${m.gradeSpec})`,
            unit: m.unit,
            theoretical: m.theoreticalConsumption,
            issued: m.actualIssuedQty,
            consumed: m.actualConsumedQty,
            wastage_pct: m.actualWastagePercent,
            status: m.status,
            recovery: m.excessRecoveryAmount,
          })),
          remarks: "Joint physical measurements and level books reconciled against approved GFC drawings, bar bending schedules (BBS), and tender specifications per IS 1200 / CPWD guidelines. Items verified within contractual scope caps have been approved for progressive billing.",
        }}
        title="BOQ Reconciliation & Material Audit Report"
        reportNo="F-BOQ-01"
        pdfUrl={`${API_BASE}/api/v1/reports/pdf/boq-reconciliation`}
      />
    </div>
  );
}
