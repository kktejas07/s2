"use client";

import { API_BASE } from "@/lib/config";
import { downloadPdfFile } from "@/lib/downloadPdf";
import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  Calendar,
  Building2,
  Factory,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
  Save,
  Printer,
  Search,
  Filter,
  Camera,
  Layers,
  Check,
  UserCheck,
  Shield,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Percent,
  FileCheck2,
  Users,
  Compass,
  FileSpreadsheet,
  Trash2,
  Eye,
  Download,
  Edit3,
  X,
  Loader2,
  Lock,
  Unlock,
} from "@/components/icons";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";

interface ExpeditingItem {
  id: string;
  itemNo: number;
  description: string;
  poQty: number;
  tagNo: string;
  promisedDelivery: string;
  currentExpectedDelivery: string;
  qtyProduced: number;
  status: "On Schedule" | "At Risk" | "Delayed" | "Completed";
  remarks: string;
  isLocked?: boolean;
}

interface Personnel {
  id: string;
  name: string;
  designation: string;
  company: string;
  role: string;
}

interface DocDetail {
  id: string;
  docTitle: string;
  docNo: string;
  rev: string;
  status: string;
  approvalStatus: "Approved" | "Pending" | "Under Review";
  remarks: string;
}

interface SubOrderMaterial {
  id: string;
  component: string;
  supplier: string;
  orderRef: string;
  qtyOrdered: string;
  qtyReceived: string;
  expectedBalance: string;
  status: string;
}

interface ManufacturingActivity {
  id: string;
  activity: string;
  plannedFinish: string;
  actualExpectedFinish: string;
  percentComplete: number;
  status: "In Progress" | "Completed" | "Pending" | "Delayed";
  remarks: string;
}

interface InspectionTestActivity {
  id: string;
  activity: string;
  plannedDate: string;
  actualDate: string;
  status: "Passed" | "Scheduled" | "Pending NCR" | "Witnessed";
  rfiRef: string;
  remarks: string;
}

interface ActionFollowUp {
  id: string;
  action: string;
  responsibility: string;
  targetDate: string;
  status: "Open" | "Closed";
  remarks: string;
}

const CLIENT_OPTIONS = [
  "Granules India Limited - Gagillapur",
  "Atom Project (New Atom Project)",
  "Suven Pharmaceuticals Ltd (Chonce Life Science)",
  "MCGM (Greater Mumbai Corp)",
  "S2 / Standard Client",
];

interface ClientExpeditingMeta {
  reportNo: string;
  date: string;
  callRef: string;
  previousVisit: string;
  nextPlannedVisit: string;
  location: string;
  customer: string;
  supplier: string;
  project: string;
  subSupplier: string;
  supplierPONo: string;
  iqeExpeditor: string;
}

const CLIENT_METADATA_MAP: Record<string, ClientExpeditingMeta> = {
  "Granules India Limited - Gagillapur": {
    reportNo: "EXP-2026-IQE-042",
    date: "2026-09-29",
    callRef: "CALL-GIL-EXP-088 (26-Sep-2026)",
    previousVisit: "2026-08-15 (Visit #02)",
    nextPlannedVisit: "2026-10-15 (Visit #04)",
    location: "BHEL Heavy Fabrication Works, Trichy, Tamil Nadu",
    customer: "Granules India Limited (Bio-Pharma Div)",
    supplier: "L&T Heavy Engineering Ltd.",
    project: "Biopharma Manufacturing Facility Expansion - Block C",
    subSupplier: "BHEL Trichy Boilers & Heavy Vessels",
    supplierPONo: "PO/GIL/2026/094 Dt. 12-May-2026",
    iqeExpeditor: "Alok Gupta (Senior Lead Expeditor & TPI Engineer)",
  },
  "Atom Project (New Atom Project)": {
    reportNo: "EXP-2026-IQE-043",
    date: "2026-09-29",
    callRef: "CALL-ATM-EXP-012 (25-Sep-2026)",
    previousVisit: "2026-08-20 (Visit #01)",
    nextPlannedVisit: "2026-10-20 (Visit #03)",
    location: "Godrej Heavy Equipment Plant, Vikhroli, Mumbai",
    customer: "Atom Life Sciences Pvt. Ltd.",
    supplier: "Godrej & Boyce Heavy Engineering",
    project: "Atom Active Pharmaceutical Ingredient Block-2",
    subSupplier: "Midwest Forgings & Alloy Fittings",
    supplierPONo: "PO/ATM/2026/118 Dt. 20-Jun-2026",
    iqeExpeditor: "Ramesh Sharma (Senior QA/QC Expeditor)",
  },
  "Suven Pharmaceuticals Ltd (Chonce Life Science)": {
    reportNo: "EXP-2026-IQE-044",
    date: "2026-09-29",
    callRef: "CALL-SUV-EXP-033 (27-Sep-2026)",
    previousVisit: "2026-08-10 (Visit #03)",
    nextPlannedVisit: "2026-10-12 (Visit #05)",
    location: "Fabtech Cleanroom & Modular Works, Umbergaon, Gujarat",
    customer: "Suven Pharmaceuticals Ltd",
    supplier: "Fabtech Technologies International Ltd.",
    project: "Suven OSD & Sterile Formulation Unit",
    subSupplier: "Apex Clean Air Systems Pvt. Ltd.",
    supplierPONo: "PO/SUV/2026/055 Dt. 04-Apr-2026",
    iqeExpeditor: "K. V. Rao (Lead Process & HVAC Expeditor)",
  },
  "MCGM (Greater Mumbai Corp)": {
    reportNo: "EXP-2026-IQE-045",
    date: "2026-09-29",
    callRef: "CALL-MCGM-EXP-109 (22-Sep-2026)",
    previousVisit: "2026-08-05 (Visit #01)",
    nextPlannedVisit: "2026-10-18 (Visit #03)",
    location: "Kirloskar Pump & Valve Works, Kirloskarvadi, Maharashtra",
    customer: "Municipal Corporation of Greater Mumbai",
    supplier: "Kirloskar Brothers Limited",
    project: "MCGM Water Treatment Plant Pumping Station Phase-II",
    subSupplier: "Pioneer Foundry & Alloy Castings",
    supplierPONo: "PO/MCGM/2026/782 Dt. 11-Jan-2026",
    iqeExpeditor: "M. S. Patil (Senior Mechanical Auditor)",
  },
  "S2 / Standard Client": {
    reportNo: "EXP-2026-IQE-046",
    date: "2026-09-29",
    callRef: "CALL-S2-EXP-004 (28-Sep-2026)",
    previousVisit: "2026-08-25 (Visit #02)",
    nextPlannedVisit: "2026-10-22 (Visit #04)",
    location: "Isgec Pressure Vessel Works, Yamunanagar, Haryana",
    customer: "S2 Engineering Industry Ltd.",
    supplier: "Isgec Heavy Engineering Ltd.",
    project: "Standard Industrial Process Skid Package",
    subSupplier: "Bharat Forgings & Special Alloys",
    supplierPONo: "PO/S2/2026/301 Dt. 15-Feb-2026",
    iqeExpeditor: "Sunil Verma (Lead TPI Expeditor)",
  },
};

export default function ExpeditingVisitReportPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "items" | "progress" | "manufacturing" | "actions" | "signatures">("overview");
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const [viewingItem, setViewingItem] = useState<ExpeditingItem | null>(null);
  const [editingItem, setEditingItem] = useState<ExpeditingItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("Granules India Limited - Gagillapur");

  // 1.0 Header & Order Details
  const [meta, setMeta] = useState<ClientExpeditingMeta>(CLIENT_METADATA_MAP["Granules India Limited - Gagillapur"]);

  const handleToggleLock = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isLocked: !it.isLocked } : it))
    );
  };

  const handleExportSingleRowCSV = (item: ExpeditingItem) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Item No,Description,Tag No,PO Qty,Qty Produced,Promised Delivery,Expected Delivery,Status,Remarks",
        `${item.itemNo},"${item.description.replace(/"/g, '""')}","${item.tagNo}",${item.poQty},${item.qtyProduced},${item.promisedDelivery},${item.currentExpectedDelivery},${item.status},"${item.remarks.replace(/"/g, '""')}"`,
      ].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `EVR_Item_${item.itemNo}_${item.tagNo || "Row"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClientChange = (client: string) => {
    setSelectedClient(client);
    if (CLIENT_METADATA_MAP[client]) {
      setMeta(CLIENT_METADATA_MAP[client]);
    }
  };

  const handleExportCSV = () => {
    const csvRows = [
      ["Item No", "Description", "Tag No", "PO Qty", "Qty Produced", "Promised Delivery", "Expected Delivery", "Status", "Remarks"],
      ...items.map((it) => [
        it.itemNo,
        `"${it.description.replace(/"/g, '""')}"`,
        `"${it.tagNo}"`,
        it.poQty,
        it.qtyProduced,
        it.promisedDelivery,
        it.currentExpectedDelivery,
        it.status,
        `"${it.remarks.replace(/"/g, '""')}"`,
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Expediting_Report_${meta.reportNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2.0 Items / Order Details
  const [items, setItems] = useState<ExpeditingItem[]>([
    {
      id: "it-1",
      itemNo: 1,
      description: "SS 316L Multi-Column Distillation Plant Column Vessel 1500L (Design 6.0 Bar)",
      poQty: 2,
      tagNo: "V-101A / V-101B",
      promisedDelivery: "2026-10-10",
      currentExpectedDelivery: "2026-10-18",
      qtyProduced: 1,
      status: "At Risk",
      remarks: "Shell rolling complete; nozzle fit-up in progress; 8-day forecast delay due to forging flange receipt",
    },
    {
      id: "it-2",
      itemNo: 2,
      description: "Heat Exchanger Tube Bundle 316L (High Pressure Condenser Module)",
      poQty: 4,
      tagNo: "HE-201 to HE-204",
      promisedDelivery: "2026-09-30",
      currentExpectedDelivery: "2026-10-02",
      qtyProduced: 4,
      status: "On Schedule",
      remarks: "Tube-to-tubesheet orbital welding completed; ready for final pneumatic test",
    },
    {
      id: "it-3",
      itemNo: 3,
      description: "Purified Water Storage Tank 5000L with 0.2 Micron Hydrophobic Breather Filter",
      poQty: 1,
      tagNo: "TK-301",
      promisedDelivery: "2026-10-25",
      currentExpectedDelivery: "2026-10-25",
      qtyProduced: 1,
      status: "Completed",
      remarks: "Factory Acceptance Test (FAT) witnessed; mechanical completion achieved",
    },
    {
      id: "it-4",
      itemNo: 4,
      description: "Sanitary Diaphragm Valves & Clean Steam Traps skid assembly",
      poQty: 12,
      tagNo: "SKID-VAL-01",
      promisedDelivery: "2026-11-05",
      currentExpectedDelivery: "2026-11-05",
      qtyProduced: 6,
      status: "On Schedule",
      remarks: "Hydrostatic witness completed for first batch of 6 units",
    },
  ]);

  // 3.0 Progress Percentages
  const [progress, setProgress] = useState({
    orderStatus: "Partially Completed",
    engineeringDesign: 95,
    materialProcurement: 88,
    manufacturingFabrication: 74,
    inspectionTesting: 62,
    documentation: 70,
    overallCompletion: 76,
  });

  // 3.0 Summary Text
  const [summaryText, setSummaryText] = useState(
    "Expediting visit performed at BHEL Trichy works to evaluate progress of distillation column vessels and heat exchangers. Progress observed since previous visit includes shell welding completion and hydrostatic readiness for Heat Exchangers. Minor 8-day critical path delay noted on Item #1 due to imported SS316L forged flange delivery from sub-supplier. Mitigation plan submitted by vendor with double-shift assembly to recover lost time by 18-Oct-2026."
  );

  // 4.0 Personnel Present
  const [personnel, setPersonnel] = useState<Personnel[]>([
    { id: "p-1", name: "Alok Gupta", designation: "Senior Lead Auditor", company: "Ideal Quality Engineers (I) Pvt Ltd", role: "IQE Expeditor / TPI Lead" },
    { id: "p-2", name: "R. Sundararajan", designation: "General Manager (Production)", company: "BHEL Trichy", role: "Shop Floor In-Charge" },
    { id: "p-3", name: "D. Jayaprakash", designation: "Head QA/QC", company: "BHEL Trichy", role: "Quality Assurance Host" },
    { id: "p-4", name: "M. K. Verma", designation: "Project Manager (Main Contractor)", company: "L&T Heavy Engineering", role: "Main Contractor Lead" },
  ]);

  // 5.0 Documentation Details
  const [documents, setDocuments] = useState<DocDetail[]>([
    { id: "d-1", docTitle: "Approved General Arrangement Drawing", docNo: "GA-DWG-BHEL-001", rev: "Rev 03", status: "Approved", approvalStatus: "Approved", remarks: "All nozzle orientation comments resolved" },
    { id: "d-2", docTitle: "Welding Procedure Specification (WPS/PQR)", docNo: "WPS-SS316-GTAW-04", rev: "Rev 01", status: "Approved", approvalStatus: "Approved", remarks: "ASME Sec IX compliant; Charpy impact verified" },
    { id: "d-3", docTitle: "Quality Assurance Plan (QAP)", docNo: "QAP-IQE-GIL-2026-09", rev: "Rev 02", status: "Approved", approvalStatus: "Approved", remarks: "Hold points marked for IQE inspection" },
    { id: "d-4", docTitle: "Hydrostatic Test Procedure", docNo: "PROC-HYD-771", rev: "Rev 00", status: "Under Review", approvalStatus: "Under Review", remarks: "Submitted on 25-Sep; comments expected in 48h" },
  ]);

  // 6.0 Sub-Orders / Materials in Stock
  const [subOrders, setSubOrders] = useState<SubOrderMaterial[]>([
    { id: "m-1", component: "SS 316L Plates (12mm / 16mm)", supplier: "Jindal Stainless Ltd", orderRef: "SO-JSL-8841", qtyOrdered: "14.5 MT", qtyReceived: "14.5 MT", expectedBalance: "0 MT", status: "100% In Stock & Verified" },
    { id: "m-2", component: "Sanitary Forged Flanges #150", supplier: "Metal Forge Specialities", orderRef: "SO-MFS-219", qtyOrdered: "28 Nos", qtyReceived: "20 Nos", expectedBalance: "8 Nos", status: "Balance 8 Nos expected by 04-Oct" },
    { id: "m-3", component: "Seamless U-Tubes 19.05mm OD", supplier: "Sandvik Materials Tech", orderRef: "SO-SAN-774", qtyOrdered: "380 Mtrs", qtyReceived: "380 Mtrs", expectedBalance: "0 Mtrs", status: "100% Received & Eddy Current Tested" },
  ]);

  // 7.0 Manufacturing Status
  const [mfgActivities, setMfgActivities] = useState<ManufacturingActivity[]>([
    { id: "a-1", activity: "Plate Cutting, Edge Beveling & Rolling", plannedFinish: "2026-08-30", actualExpectedFinish: "2026-08-28", percentComplete: 100, status: "Completed", remarks: "100% complete with bevel angle visual sign-off" },
    { id: "a-2", activity: "Longitudinal & Circumferential Seam Welding", plannedFinish: "2026-09-15", actualExpectedFinish: "2026-09-18", percentComplete: 100, status: "Completed", remarks: "Radiography testing (RT) passed on all Category A joints" },
    { id: "a-3", activity: "Nozzle Stub Welding & Reinforcing Pads", plannedFinish: "2026-09-28", actualExpectedFinish: "2026-10-06", percentComplete: 65, status: "In Progress", remarks: "Awaiting final batch of 8 flanges; 2 welders assigned" },
    { id: "a-4", activity: "Internal Pickling, Passivation & Electro-polishing", plannedFinish: "2026-10-05", actualExpectedFinish: "2026-10-12", percentComplete: 0, status: "Pending", remarks: "Scheduled immediately post hydro-test" },
  ]);

  // 8.0 Inspection / Testing Status
  const [inspections, setInspections] = useState<InspectionTestActivity[]>([
    { id: "i-1", activity: "Raw Material Visual & Mill TC Verification", plannedDate: "2026-08-10", actualDate: "2026-08-10", status: "Passed", rfiRef: "RFI-EXP-01", remarks: "PMI test 100% confirmed SS 316L chemical composition" },
    { id: "i-2", activity: "100% Radiography Test (RT) on Long & Circ Welds", plannedDate: "2026-09-20", actualDate: "2026-09-21", status: "Witnessed", rfiRef: "RFI-EXP-07", remarks: "Radiographic films reviewed; ASME Sec VIII Div 1 UW-51 compliant" },
    { id: "i-3", activity: "Hydrostatic Pressure Test (1.5x Design Pressure = 9.0 Bar)", plannedDate: "2026-10-02", actualDate: "2026-10-10", status: "Scheduled", rfiRef: "RFI-EXP-11", remarks: "Calibrated pressure gauges #IQE-PG-04 verified" },
    { id: "i-4", activity: "Helium Leak Detection Test (1x10^-6 mbar.l/s)", plannedDate: "2026-10-08", actualDate: "2026-10-14", status: "Scheduled", rfiRef: "RFI-EXP-14", remarks: "Final acceptance test prior to packaging" },
  ]);

  // 9.0 Schedule & Delivery Assessment
  const [scheduleAssessment, setScheduleAssessment] = useState({
    deliveryAgainstPO: "At Risk",
    criticalPathItems: "Identified (Forged Flanges & Final Passivation)",
    recoveryPlanRequired: "Yes (Submitted & Approved in principle)",
    supplierCommitment: "Vendor has instituted extended 12-hour shifts to recover 8 days delay",
    iqeAssessment: "Concern",
  });

  // 10.0 Actions / Follow-Up
  const [actions, setActions] = useState<ActionFollowUp[]>([
    { id: "act-1", action: "Follow up with Metal Forge for dispatch of remaining 8 Nos sanitary flanges by air courier", responsibility: "BHEL Procurement (R. Sundararajan)", targetDate: "2026-10-04", status: "Open", remarks: "Daily tracking committed" },
    { id: "act-2", action: "Submit calibrated gauge certificate and water analysis report (<25 ppm chloride) for hydro test", responsibility: "BHEL QA (D. Jayaprakash)", targetDate: "2026-10-08", status: "Open", remarks: "Prerequisite for test witness" },
    { id: "act-3", action: "Provide revised detailed fabrication bar-chart showing catch-up milestones to client", responsibility: "L&T Main Contractor (M. K. Verma)", targetDate: "2026-10-01", status: "Closed", remarks: "Revised Rev-04 schedule submitted" },
  ]);

  // 11.0 Conclusion
  const [conclusionText, setConclusionText] = useState(
    "Overall workmanship and compliance with approved QAP standards are satisfactory. Quality of orbital TIG welding on heat exchangers is commendable. While an 8-day delay exists on Item #1, the supplier's recovery plan is feasible provided flange components arrive by 04-Oct-2026. Next expediting visit scheduled for 15-Oct-2026 to witness 9.0 Bar Hydrostatic test and final dimensional inspection."
  );

  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);
  const [isInlineEditMode, setIsInlineEditMode] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [isInlineEditPersonnel, setIsInlineEditPersonnel] = useState<boolean>(false);
  const [isInlineEditDocs, setIsInlineEditDocs] = useState<boolean>(false);
  const [isInlineEditSubOrders, setIsInlineEditSubOrders] = useState<boolean>(false);
  const [isInlineEditMfg, setIsInlineEditMfg] = useState<boolean>(false);
  const [isInlineEditInspections, setIsInlineEditInspections] = useState<boolean>(false);
  const [isInlineEditActions, setIsInlineEditActions] = useState<boolean>(false);

  const handleAddPersonnel = () => {
    const newId = `p-${Date.now()}`;
    const newP: Personnel = {
      id: newId,
      name: "New Attendee",
      designation: "Quality Inspector",
      company: "IQE / Client / Vendor",
      role: "Observer / Participant",
    };
    setPersonnel((prev) => [...prev, newP]);
    setIsInlineEditPersonnel(true);
  };

  const handleAddDocument = () => {
    const newId = `d-${Date.now()}`;
    const newD: DocDetail = {
      id: newId,
      docTitle: "Inspection / Engineering Procedure",
      docNo: `DOC-${Date.now().toString().slice(-4)}`,
      rev: "Rev 00",
      status: "Submitted",
      approvalStatus: "Under Review",
      remarks: "Submitted for engineering approval",
    };
    setDocuments((prev) => [...prev, newD]);
    setIsInlineEditDocs(true);
  };

  const handleAddSubOrder = () => {
    const newId = `m-${Date.now()}`;
    const newM: SubOrderMaterial = {
      id: newId,
      component: "Raw Material / Bought-Out Component",
      supplier: "Approved Sub-Vendor",
      orderRef: `SO-${Date.now().toString().slice(-4)}`,
      qtyOrdered: "10 Nos",
      qtyReceived: "0 Nos",
      expectedBalance: "10 Nos",
      status: "Order placed; awaiting dispatch",
    };
    setSubOrders((prev) => [...prev, newM]);
    setIsInlineEditSubOrders(true);
  };

  const handleAddMfgActivity = () => {
    const newId = `a-${Date.now()}`;
    const newA: ManufacturingActivity = {
      id: newId,
      activity: "Fabrication / Assembly Activity",
      plannedFinish: new Date().toISOString().split("T")[0],
      actualExpectedFinish: new Date().toISOString().split("T")[0],
      percentComplete: 0,
      status: "In Progress",
      remarks: "Fabrication commenced per approved drawings",
    };
    setMfgActivities((prev) => [...prev, newA]);
    setIsInlineEditMfg(true);
  };

  const handleAddInspection = () => {
    const newId = `i-${Date.now()}`;
    const newI: InspectionTestActivity = {
      id: newId,
      activity: "Stage Inspection / NDT / Pressure Test",
      plannedDate: new Date().toISOString().split("T")[0],
      actualDate: new Date().toISOString().split("T")[0],
      status: "Scheduled",
      rfiRef: `RFI-EXP-${inspections.length + 1}`,
      remarks: "Inspection hold point per QAP",
    };
    setInspections((prev) => [...prev, newI]);
    setIsInlineEditInspections(true);
  };

  const handleAddAction = () => {
    const newId = `act-${Date.now()}`;
    const newAct: ActionFollowUp = {
      id: newId,
      action: "Expediting mitigation action item",
      responsibility: "Vendor / Supplier Lead",
      targetDate: new Date().toISOString().split("T")[0],
      status: "Open",
      remarks: "Critical path action monitored by IQE expeditor",
    };
    setActions((prev) => [...prev, newAct]);
    setIsInlineEditActions(true);
  };

  const [newItem, setNewItem] = useState({
    description: "",
    poQty: 1,
    tagNo: "",
    promisedDelivery: new Date().toISOString().split("T")[0],
    currentExpectedDelivery: new Date().toISOString().split("T")[0],
    qtyProduced: 0,
    status: "On Schedule" as ExpeditingItem["status"],
    remarks: "Order placed, engineering drawing under approval",
  });

  const handleInlineItemChange = (id: string, field: keyof ExpeditingItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const created: ExpeditingItem = {
      id: `it-${Date.now()}`,
      itemNo: items.length + 1,
      description: newItem.description || `Expediting Item #${items.length + 1}`,
      poQty: Number(newItem.poQty) || 1,
      tagNo: newItem.tagNo || `TAG-EXP-${items.length + 1}`,
      promisedDelivery: newItem.promisedDelivery || "2026-10-15",
      currentExpectedDelivery: newItem.currentExpectedDelivery || "2026-10-15",
      qtyProduced: Number(newItem.qtyProduced) || 0,
      status: newItem.status,
      remarks: newItem.remarks || "Item tracked under progressive expediting protocol",
    };
    setItems((prev) => [...prev, created]);
    setShowAddModal(false);
    setNewItem({
      description: "",
      poQty: 1,
      tagNo: "",
      promisedDelivery: new Date().toISOString().split("T")[0],
      currentExpectedDelivery: new Date().toISOString().split("T")[0],
      qtyProduced: 0,
      status: "On Schedule",
      remarks: "Order placed, engineering drawing under approval",
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-[1920px] mx-auto pb-12 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* TOP HEADER CONTAINER (Identical to Bill Verification Format Shell) */}
      <div className="bg-white text-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#003366] dark:text-sky-300 font-heading tracking-tight flex items-center gap-2">
              <Compass className="w-6 h-6 text-[#0084bf]" />
              <span>Expediting Visit Report</span>
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

            {/* Quick Metadata Pill */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
              <span className="text-slate-500 text-[11px] font-bold">Report:</span>
              <span className="text-slate-800 font-extrabold font-mono">{meta.reportNo}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 text-[11px] font-bold">Date:</span>
              <span className="text-slate-800 font-bold">{meta.date}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
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
                  `${API_BASE}/api/tpi/preview/TP05.pdf`,
                  `EVR_${meta.reportNo || "IQE-TP-05"}.pdf`,
                  "/sample-pdfs/TP05.pdf"
                );
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Download PDF Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button aria-label="Save Report"
              onClick={handleSave}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition-all shadow-sm cursor-pointer"
              title="Save Report"
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

            <button aria-label="Print Formal Dossier"
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all shadow-sm cursor-pointer"
              title="Print Formal Dossier"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Progress Bar Strip */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0084bf]" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white font-heading">
              Order &amp; Manufacturing Milestones Progress Status
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-mono">Overall Progress:</span>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold font-mono text-sm border border-emerald-300">
              {progress.overallCompletion}% Complete
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Engineering &amp; Design</span>
              <span className="font-mono text-sky-600 dark:text-sky-400">{progress.engineeringDesign}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: `${progress.engineeringDesign}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Material Procurement</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{progress.materialProcurement}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress.materialProcurement}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Manufacturing &amp; Fab.</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">{progress.manufacturingFabrication}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progress.manufacturingFabrication}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Inspection &amp; Testing</span>
              <span className="font-mono text-purple-600 dark:text-purple-400">{progress.inspectionTesting}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${progress.inspectionTesting}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>QA Documentation</span>
              <span className="font-mono text-teal-600 dark:text-teal-400">{progress.documentation}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${progress.documentation}%` }} />
            </div>
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
          { id: "sec-1", label: "1.0 Items" },
          { id: "sec-2", label: "2.0 Progress" },
          { id: "sec-3", label: "3.0 Summary" },
          { id: "sec-4", label: "4.0 Personnel" },
          { id: "sec-5", label: "5.0 Docs" },
          { id: "sec-6", label: "6.0 Sub-Orders" },
          { id: "sec-7", label: "7.0 Manufacturing" },
          { id: "sec-8", label: "8.0 Testing" },
          { id: "sec-9", label: "9.0 Schedule" },
          { id: "sec-10", label: "10.0 Actions" },
          { id: "sec-11", label: "11.0 Conclusion" },
          { id: "sec-12", label: "12.0 Photos" },
          { id: "sec-13", label: "13.0 Sign-Off" },
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
            <p className="text-xs text-slate-500 font-semibold">Third Party Inspection &amp; Expediting Services</p>
          </div>
          <div className="text-right font-mono text-xs space-y-0.5 sm:self-auto">
            <div className="font-extrabold text-slate-800">FORM NO.: IQE-TP-05</div>
            <div className="text-slate-500 text-[11px]">REVISION: 00</div>
            <div className="font-bold text-[#003366]">REPORT NO.: {meta.reportNo}</div>
          </div>
        </div>

        <div className="text-center py-1">
          <h3 className="text-lg sm:text-xl font-extrabold text-[#003366] uppercase tracking-tight">
            EXPEDITING VISIT REPORT
          </h3>
          <p className="text-xs italic text-slate-500">Supplier progress, schedule, materials, manufacturing and action follow-up report</p>
        </div>
      </div>

      {/* Top Document Metadata Table (IQE-TP-05 Page 1 as is) */}
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
                <td className="p-2.5">Report No.</td>
                <td className="p-2.5 font-mono">{meta.reportNo}</td>
                <td className="p-2.5">Date</td>
                <td className="p-2.5 font-mono">{meta.date}</td>
              </tr>
              <tr>
                <td className="p-2.5">Call / Visit Reference &amp; Date</td>
                <td className="p-2.5 font-mono">{meta.callRef}</td>
                <td className="p-2.5">Previous Visit</td>
                <td className="p-2.5 font-mono">{meta.previousVisit}</td>
              </tr>
              <tr>
                <td className="p-2.5">Next Planned Visit</td>
                <td className="p-2.5 font-mono">{meta.nextPlannedVisit}</td>
                <td className="p-2.5">Location</td>
                <td className="p-2.5">{meta.location}</td>
              </tr>
              <tr>
                <td className="p-2.5">Customer</td>
                <td className="p-2.5">{meta.customer}</td>
                <td className="p-2.5">Supplier</td>
                <td className="p-2.5">{meta.supplier}</td>
              </tr>
              <tr>
                <td className="p-2.5">Project</td>
                <td className="p-2.5">{meta.project}</td>
                <td className="p-2.5">Sub-Supplier / Manufacturer</td>
                <td className="p-2.5">{meta.subSupplier}</td>
              </tr>
              <tr>
                <td className="p-2.5">Supplier PO No. &amp; Date</td>
                <td className="p-2.5 font-mono">{meta.supplierPONo}</td>
                <td className="p-2.5">IQE Expeditor</td>
                <td className="p-2.5">{meta.iqeExpeditor}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 1.0 ITEMS / ORDER DETAILS */}
      <div id="sec-1" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">1.0 ITEMS / ORDER DETAILS</span>
            <span className="font-mono text-[11px] text-sky-200">IQE-TP-05 Clause 1.0</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[11px]">
              {items.length} line items
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInlineEditMode(!isInlineEditMode)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isInlineEditMode ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title="Toggle Inline Editing Mode"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isInlineEditMode ? "Exit Inline Edit" : "Inline Edit"}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
              title="Add New Line Item"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>

            <button
              onClick={() => setShowPdfPreview(true)}
              className="px-2.5 py-1 rounded-lg bg-[#0084bf] hover:bg-[#0073a8] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Preview Live PDF"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Live PDF</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-center w-12 border-r border-slate-200">Item No.</th>
                <th className="p-2.5 border-r border-slate-200 min-w-[220px]">Item Description</th>
                <th className="p-2.5 border-r border-slate-200 text-center w-20">PO Qty</th>
                <th className="p-2.5 border-r border-slate-200 font-mono">Tag / Unique Serial No.</th>
                <th className="p-2.5 border-r border-slate-200 font-mono">Promised Delivery</th>
                <th className="p-2.5 border-r border-slate-200 font-mono font-bold">Current Expected Delivery</th>
                <th className="p-2.5 border-r border-slate-200 text-center w-24">Qty Available / Produced</th>
                <th className="p-2.5 border-r border-slate-200 text-center w-28">Status</th>
                <th className="p-2.5 border-r border-slate-200">Remarks</th>
                <th className="p-2.5 text-center min-w-[200px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-mono font-bold text-[#003366] dark:text-sky-300 border-r border-slate-100">
                    {isInlineEditMode ? (
                      <input aria-label="Item No."
                        type="number"
                        value={it.itemNo}
                        onChange={(e) => handleInlineItemChange(it.id, "itemNo", parseInt(e.target.value) || 0)}
                        className="w-12 p-1 text-center font-mono bg-amber-50 border border-amber-300 rounded text-xs font-bold"
                      />
                    ) : (
                      `#${it.itemNo}`
                    )}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 border-r border-slate-100">
                    {isInlineEditMode ? (
                      <input aria-label="Description"
                        type="text"
                        value={it.description}
                        onChange={(e) => handleInlineItemChange(it.id, "description", e.target.value)}
                        className="w-full min-w-[200px] p-1 font-semibold bg-amber-50 border border-amber-300 rounded text-xs"
                      />
                    ) : (
                      it.description
                    )}
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold border-r border-slate-100">
                    {isInlineEditMode ? (
                      <input aria-label="PO Qty"
                        type="number"
                        value={it.poQty}
                        onChange={(e) => handleInlineItemChange(it.id, "poQty", parseInt(e.target.value) || 0)}
                        className="w-16 p-1 text-center font-mono bg-amber-50 border border-amber-300 rounded text-xs font-bold"
                      />
                    ) : (
                      it.poQty
                    )}
                  </td>
                  <td className="p-2.5 font-mono text-purple-700 border-r border-slate-100">
                    {isInlineEditMode ? (
                      <input aria-label="Tag No."
                        type="text"
                        value={it.tagNo}
                        onChange={(e) => handleInlineItemChange(it.id, "tagNo", e.target.value)}
                        className="w-28 p-1 font-mono text-purple-700 bg-amber-50 border border-amber-300 rounded text-xs"
                      />
                    ) : (
                      it.tagNo
                    )}
                  </td>
                  <td className="p-2.5 font-mono text-slate-600 border-r border-slate-100">
                    {isInlineEditMode ? (
                      <input aria-label="Promised delivery"
                        type="date"
                        value={it.promisedDelivery}
                        onChange={(e) => handleInlineItemChange(it.id, "promisedDelivery", e.target.value)}
                        className="p-1 font-mono text-xs bg-amber-50 border border-amber-300 rounded"
                      />
                    ) : (
                      it.promisedDelivery
                    )}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-slate-900 border-r border-slate-100">
                    {isInlineEditMode ? (
                      <input aria-label="Current expected delivery"
                        type="date"
                        value={it.currentExpectedDelivery}
                        onChange={(e) => handleInlineItemChange(it.id, "currentExpectedDelivery", e.target.value)}
                        className="p-1 font-mono text-xs font-bold bg-amber-50 border border-amber-300 rounded"
                      />
                    ) : (
                      it.currentExpectedDelivery
                    )}
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-700 border-r border-slate-100">
                    {isInlineEditMode ? (
                      <input aria-label="Qty produced"
                        type="number"
                        value={it.qtyProduced}
                        onChange={(e) => handleInlineItemChange(it.id, "qtyProduced", parseInt(e.target.value) || 0)}
                        className="w-16 p-1 text-center font-mono font-bold text-emerald-800 bg-amber-50 border border-amber-300 rounded text-xs"
                      />
                    ) : (
                      it.qtyProduced
                    )}
                  </td>
                  <td className="p-2.5 text-center whitespace-nowrap border-r border-slate-100">
                    {isInlineEditMode ? (
                      <select aria-label="Status"
                        value={it.status}
                        onChange={(e) => handleInlineItemChange(it.id, "status", e.target.value as any)}
                        className="p-1 font-bold text-[11px] bg-white border border-slate-300 rounded"
                      >
                        <option value="On Schedule">On Schedule</option>
                        <option value="At Risk">At Risk</option>
                        <option value="Delayed">Delayed</option>
                        <option value="Completed">Completed</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        it.status === "On Schedule" || it.status === "Completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {it.status}
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-600 text-[11px] border-r border-slate-100">
                    {isInlineEditMode ? (
                      <input aria-label="Remarks"
                        type="text"
                        value={it.remarks}
                        onChange={(e) => handleInlineItemChange(it.id, "remarks", e.target.value)}
                        className="w-full min-w-[200px] p-1 bg-amber-50 border border-amber-300 rounded text-xs"
                      />
                    ) : (
                      it.remarks
                    )}
                  </td>
                  <td className="p-2.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {/* 1. Lock/Unlock */}
                      <button aria-label={it.isLocked ? "Locked — Click to Unlock Row" : "Unlocked — Click to Lock Row"}
                        onClick={() => handleToggleLock(it.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          it.isLocked
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                        }`}
                        title={it.isLocked ? "Locked — Click to Unlock Row" : "Unlocked — Click to Lock Row"}
                      >
                        {it.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-700" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />}
                      </button>

                      {/* 2. View Details Modal */}
                      <button aria-label="View Row Details"
                        onClick={() => setViewingItem(it)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-100 text-slate-700 hover:text-brand-700 transition-colors cursor-pointer"
                        title="View Row Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* 3. Edit Row Values */}
                      <button aria-label={it.isLocked ? "Item Locked" : "Edit Row Values"}
                        onClick={() => !it.isLocked && setEditingItem(it)}
                        disabled={it.isLocked}
                        className={`p-1.5 rounded-lg transition-colors ${
                          it.isLocked
                            ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                            : "bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 cursor-pointer"
                        }`}
                        title={it.isLocked ? "Item Locked" : "Edit Row Values"}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* 4. Single CSV */}
                      <button aria-label="Download Single Row CSV"
                        onClick={() => handleExportSingleRowCSV(it)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                        title="Download Single Row CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* 5. Live Preview Single Item PDF */}
                      <button aria-label="Live Preview Single Item PDF"
                        onClick={() => setShowPdfPreview(true)}
                        className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0084bf] transition-colors cursor-pointer border border-sky-200/60"
                        title="Live Preview Single Item PDF"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* 6. Download Single Item PDF */}
                      <button aria-label="Download Single PDF Report"
                        onClick={() => downloadPdfFile(`${API_BASE}/api/tpi/preview/TP05.pdf`, `EVR_Item_${it.itemNo}_Report.pdf`, "/sample-pdfs/TP05.pdf")}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer border border-rose-200/60"
                        title="Download Single PDF Report"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2.0 ORDER & PROGRESS STATUS */}
      <div id="sec-2" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider">2.0 ORDER &amp; PROGRESS STATUS</span>
          <span className="font-mono text-[11px] text-sky-200">IQE-TP-05 Clause 2.0</span>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-left border-r border-slate-200 w-1/3">Status / Progress</th>
                <th className="p-2.5 text-left border-r border-slate-200 w-1/3">Current Status / %</th>
                <th className="p-2.5 text-left w-1/3">Remarks / Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-2.5 border-r border-slate-100 font-semibold text-slate-800">Order Status</td>
                <td className="p-2.5 border-r border-slate-100">
                  <div className="flex items-center gap-3">
                    {["Complete", "Incomplete", "Partially Completed"].map((st) => (
                      <label key={st} className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="orderProgressStatus" defaultChecked={st === "Partially Completed"} className="text-[#003366]" />
                        <span className="text-[11px] font-semibold">{st}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className="p-2.5 text-slate-600">Material procured 92%; final assembly in progress</td>
              </tr>
              <tr>
                <td className="p-2.5 border-r border-slate-100 font-semibold text-slate-800">Engineering / Design</td>
                <td className="p-2.5 border-r border-slate-100 font-mono font-bold text-sky-700">{progress.engineeringDesign}%</td>
                <td className="p-2.5 text-slate-600">All fabrication GA drawings approved by client</td>
              </tr>
              <tr>
                <td className="p-2.5 border-r border-slate-100 font-semibold text-slate-800">Material Procurement / Availability</td>
                <td className="p-2.5 border-r border-slate-100 font-mono font-bold text-emerald-700">{progress.materialProcurement}%</td>
                <td className="p-2.5 text-slate-600">SS 316L plates &amp; tubes 100% in stock; flanges pending 8 pcs</td>
              </tr>
              <tr>
                <td className="p-2.5 border-r border-slate-100 font-semibold text-slate-800">Manufacturing / Fabrication</td>
                <td className="p-2.5 border-r border-slate-100 font-mono font-bold text-amber-700">{progress.manufacturingFabrication}%</td>
                <td className="p-2.5 text-slate-600">Shell rolling complete; nozzle fit-up in progress</td>
              </tr>
              <tr>
                <td className="p-2.5 border-r border-slate-100 font-semibold text-slate-800">Inspection / Testing</td>
                <td className="p-2.5 border-r border-slate-100 font-mono font-bold text-purple-700">{progress.inspectionTesting}%</td>
                <td className="p-2.5 text-slate-600">PMI &amp; RT completed; hydrotest scheduled next week</td>
              </tr>
              <tr>
                <td className="p-2.5 border-r border-slate-100 font-semibold text-slate-800">Documentation</td>
                <td className="p-2.5 border-r border-slate-100 font-mono font-bold text-teal-700">{progress.documentation}%</td>
                <td className="p-2.5 text-slate-600">WPS/PQR, MTR dossier 80% compiled</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="p-2.5 border-r border-slate-200 text-[#003366] dark:text-sky-300">Overall Completion</td>
                <td className="p-2.5 border-r border-slate-200 font-mono font-bold text-emerald-800">{progress.overallCompletion}%</td>
                <td className="p-2.5 text-slate-700">On schedule for target delivery post recovery plan</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3.0 SUMMARY */}
      <div id="sec-3" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider">3.0 SUMMARY</span>
          <span className="font-mono text-[11px] text-sky-200">IQE-TP-05 Clause 3.0</span>
        </div>
        <div className="p-4 bg-white space-y-2">
          <p className="text-xs text-slate-500 font-semibold">
            Overall status, progress since previous visit, key developments and significant concerns:
          </p>
          <textarea aria-label="Summary"
            rows={3}
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003366] text-slate-800 bg-slate-50/50"
          />
        </div>
      </div>

      {/* 4.0 PERSONNEL PRESENT */}
      <div id="sec-4" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">4.0 PERSONNEL PRESENT</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[11px]">
              {personnel.length} attendees
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInlineEditPersonnel(!isInlineEditPersonnel)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isInlineEditPersonnel ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>{isInlineEditPersonnel ? "Exit Inline Edit" : "Inline Edit"}</span>
            </button>
            <button
              onClick={handleAddPersonnel}
              className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Person</span>
            </button>
            <span className="font-mono text-[11px] text-sky-200 hidden md:inline ml-2">IQE-TP-05 Clause 4.0</span>
          </div>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-center w-12 border-r border-slate-200">Sl.</th>
                <th className="p-2.5 border-r border-slate-200">Name</th>
                <th className="p-2.5 border-r border-slate-200">Designation</th>
                <th className="p-2.5 border-r border-slate-200">Company</th>
                <th className="p-2.5 border-r border-slate-200">Role / Responsibility</th>
                <th className="p-2.5 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {personnel.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-mono font-bold text-slate-600 border-r border-slate-100">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditPersonnel ? (
                      <input aria-label="Name"
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPersonnel((prev) => prev.map((item) => (item.id === p.id ? { ...item, name: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-bold text-slate-900"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{p.name}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditPersonnel ? (
                      <input aria-label="Designation"
                        type="text"
                        value={p.designation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPersonnel((prev) => prev.map((item) => (item.id === p.id ? { ...item, designation: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs text-slate-700"
                      />
                    ) : (
                      <span className="text-slate-700">{p.designation}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditPersonnel ? (
                      <input aria-label="Company"
                        type="text"
                        value={p.company}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPersonnel((prev) => prev.map((item) => (item.id === p.id ? { ...item, company: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-semibold text-[#003366] dark:text-sky-300"
                      />
                    ) : (
                      <span className="font-semibold text-[#003366] dark:text-sky-300">{p.company}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditPersonnel ? (
                      <input aria-label="Role"
                        type="text"
                        value={p.role}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPersonnel((prev) => prev.map((item) => (item.id === p.id ? { ...item, role: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs text-slate-600"
                      />
                    ) : (
                      <span className="text-slate-600">{p.role}</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <button aria-label="Delete Attendee"
                      onClick={() => setPersonnel((prev) => prev.filter((item) => item.id !== p.id))}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Delete Attendee"
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

      {/* 5.0 DOCUMENTATION DETAILS */}
      <div id="sec-5" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">5.0 DOCUMENTATION DETAILS</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[11px]">
              {documents.length} documents
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInlineEditDocs(!isInlineEditDocs)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isInlineEditDocs ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>{isInlineEditDocs ? "Exit Inline Edit" : "Inline Edit"}</span>
            </button>
            <button
              onClick={handleAddDocument}
              className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Document</span>
            </button>
            <span className="font-mono text-[11px] text-sky-200 hidden md:inline ml-2">IQE-TP-05 Clause 5.0</span>
          </div>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-center w-12 border-r border-slate-200">Sl.</th>
                <th className="p-2.5 border-r border-slate-200 min-w-[220px]">Document / Drawing / Procedure</th>
                <th className="p-2.5 border-r border-slate-200 font-mono">Document No.</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Rev.</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Status</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Approval Status</th>
                <th className="p-2.5 border-r border-slate-200">Remarks</th>
                <th className="p-2.5 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((d, idx) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-mono font-bold text-slate-600 border-r border-slate-100">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditDocs ? (
                      <input aria-label="Doc title"
                        type="text"
                        value={d.docTitle}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDocuments((prev) => prev.map((item) => (item.id === d.id ? { ...item, docTitle: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-semibold text-slate-900"
                      />
                    ) : (
                      <span className="font-semibold text-slate-900">{d.docTitle}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditDocs ? (
                      <input aria-label="Doc No."
                        type="text"
                        value={d.docNo}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDocuments((prev) => prev.map((item) => (item.id === d.id ? { ...item, docNo: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono text-purple-700 font-bold"
                      />
                    ) : (
                      <span className="font-mono text-purple-700 font-bold">{d.docNo}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100 text-center">
                    {isInlineEditDocs ? (
                      <input aria-label="Rev."
                        type="text"
                        value={d.rev}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDocuments((prev) => prev.map((item) => (item.id === d.id ? { ...item, rev: val } : item)));
                        }}
                        className="w-16 p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono text-center"
                      />
                    ) : (
                      <span className="font-mono">{d.rev}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100 text-center">
                    {isInlineEditDocs ? (
                      <input aria-label="Status"
                        type="text"
                        value={d.status}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDocuments((prev) => prev.map((item) => (item.id === d.id ? { ...item, status: val } : item)));
                        }}
                        className="w-24 p-1 bg-amber-50 border border-amber-300 rounded text-xs text-center"
                      />
                    ) : (
                      <span>{d.status}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100 text-center">
                    {isInlineEditDocs ? (
                      <select aria-label="Approval status"
                        value={d.approvalStatus}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setDocuments((prev) => prev.map((item) => (item.id === d.id ? { ...item, approvalStatus: val } : item)));
                        }}
                        className="p-1 bg-amber-50 border border-amber-300 rounded text-xs font-bold text-slate-800"
                      >
                        <option value="Approved">Approved</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Comments Incorporated">Comments Incorporated</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {d.approvalStatus}
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditDocs ? (
                      <input aria-label="Remarks"
                        type="text"
                        value={d.remarks}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDocuments((prev) => prev.map((item) => (item.id === d.id ? { ...item, remarks: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs text-slate-600"
                      />
                    ) : (
                      <span className="text-slate-600 text-[11px]">{d.remarks}</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <button aria-label="Delete Document"
                      onClick={() => setDocuments((prev) => prev.filter((item) => item.id !== d.id))}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Delete Document"
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

      {/* 6.0 SUB-ORDERS / MATERIALS IN STOCK */}
      <div id="sec-6" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">6.0 SUB-ORDERS / MATERIALS IN STOCK</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[11px]">
              {subOrders.length} sub-orders
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInlineEditSubOrders(!isInlineEditSubOrders)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isInlineEditSubOrders ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>{isInlineEditSubOrders ? "Exit Inline Edit" : "Inline Edit"}</span>
            </button>
            <button
              onClick={handleAddSubOrder}
              className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Sub-Order</span>
            </button>
            <span className="font-mono text-[11px] text-sky-200 hidden md:inline ml-2">IQE-TP-05 Clause 6.0</span>
          </div>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-center w-12 border-r border-slate-200">Sl.</th>
                <th className="p-2.5 border-r border-slate-200 min-w-[200px]">Component / Material</th>
                <th className="p-2.5 border-r border-slate-200">Supplier / Sub-Supplier</th>
                <th className="p-2.5 border-r border-slate-200 font-mono">Order Ref.</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Qty Ordered</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Qty Received / In Stock</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Expected Balance</th>
                <th className="p-2.5 border-r border-slate-200">Status / Remarks</th>
                <th className="p-2.5 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subOrders.map((m, idx) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-mono font-bold text-slate-600 border-r border-slate-100">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditSubOrders ? (
                      <input aria-label="Component"
                        type="text"
                        value={m.component}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubOrders((prev) => prev.map((item) => (item.id === m.id ? { ...item, component: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-bold text-slate-900"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{m.component}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditSubOrders ? (
                      <input aria-label="Supplier"
                        type="text"
                        value={m.supplier}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubOrders((prev) => prev.map((item) => (item.id === m.id ? { ...item, supplier: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs text-slate-700"
                      />
                    ) : (
                      <span className="text-slate-700">{m.supplier}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditSubOrders ? (
                      <input aria-label="Order Ref."
                        type="text"
                        value={m.orderRef}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubOrders((prev) => prev.map((item) => (item.id === m.id ? { ...item, orderRef: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono text-purple-700 font-bold"
                      />
                    ) : (
                      <span className="font-mono text-purple-700 font-bold">{m.orderRef}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100 text-right">
                    {isInlineEditSubOrders ? (
                      <input aria-label="Qty ordered"
                        type="text"
                        value={m.qtyOrdered}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubOrders((prev) => prev.map((item) => (item.id === m.id ? { ...item, qtyOrdered: val } : item)));
                        }}
                        className="w-20 p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono text-right"
                      />
                    ) : (
                      <span className="font-mono">{m.qtyOrdered}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100 text-right">
                    {isInlineEditSubOrders ? (
                      <input aria-label="Qty received"
                        type="text"
                        value={m.qtyReceived}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubOrders((prev) => prev.map((item) => (item.id === m.id ? { ...item, qtyReceived: val } : item)));
                        }}
                        className="w-20 p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono font-bold text-emerald-700 text-right"
                      />
                    ) : (
                      <span className="font-mono font-bold text-emerald-700">{m.qtyReceived}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100 text-right">
                    {isInlineEditSubOrders ? (
                      <input aria-label="Expected balance"
                        type="text"
                        value={m.expectedBalance}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubOrders((prev) => prev.map((item) => (item.id === m.id ? { ...item, expectedBalance: val } : item)));
                        }}
                        className="w-20 p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono text-slate-500 text-right"
                      />
                    ) : (
                      <span className="font-mono text-slate-500">{m.expectedBalance}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditSubOrders ? (
                      <input aria-label="Status"
                        type="text"
                        value={m.status}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubOrders((prev) => prev.map((item) => (item.id === m.id ? { ...item, status: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs text-slate-600"
                      />
                    ) : (
                      <span className="text-slate-600 text-[11px]">{m.status}</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <button aria-label="Delete Sub-Order"
                      onClick={() => setSubOrders((prev) => prev.filter((item) => item.id !== m.id))}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Delete Sub-Order"
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

      {/* 7.0 MANUFACTURING STATUS */}
      <div id="sec-7" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">7.0 MANUFACTURING STATUS</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[11px]">
              {mfgActivities.length} activities
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInlineEditMfg(!isInlineEditMfg)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isInlineEditMfg ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>{isInlineEditMfg ? "Exit Inline Edit" : "Inline Edit"}</span>
            </button>
            <button
              onClick={handleAddMfgActivity}
              className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Activity</span>
            </button>
            <span className="font-mono text-[11px] text-sky-200 hidden md:inline ml-2">IQE-TP-05 Clause 7.0</span>
          </div>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-center w-12 border-r border-slate-200">Sl.</th>
                <th className="p-2.5 border-r border-slate-200 min-w-[240px]">Manufacturing Activity</th>
                <th className="p-2.5 border-r border-slate-200 font-mono">Planned Finish</th>
                <th className="p-2.5 border-r border-slate-200 font-mono font-bold">Actual / Expected Finish</th>
                <th className="p-2.5 border-r border-slate-200 text-right">% Complete</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Status</th>
                <th className="p-2.5 border-r border-slate-200">Remarks / Constraints</th>
                <th className="p-2.5 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mfgActivities.map((a, idx) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-mono font-bold text-slate-600 border-r border-slate-100">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditMfg ? (
                      <input aria-label="Activity"
                        type="text"
                        value={a.activity}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMfgActivities((prev) => prev.map((item) => (item.id === a.id ? { ...item, activity: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-bold text-slate-900"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{a.activity}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditMfg ? (
                      <input aria-label="Planned finish"
                        type="date"
                        value={a.plannedFinish}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMfgActivities((prev) => prev.map((item) => (item.id === a.id ? { ...item, plannedFinish: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono"
                      />
                    ) : (
                      <span className="font-mono text-slate-500">{a.plannedFinish}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditMfg ? (
                      <input aria-label="Actual expected finish"
                        type="date"
                        value={a.actualExpectedFinish}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMfgActivities((prev) => prev.map((item) => (item.id === a.id ? { ...item, actualExpectedFinish: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    ) : (
                      <span className="font-mono font-bold text-slate-900">{a.actualExpectedFinish}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100 text-right">
                    {isInlineEditMfg ? (
                      <input aria-label="Percent complete"
                        type="number"
                        min="0"
                        max="100"
                        value={a.percentComplete}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setMfgActivities((prev) => prev.map((item) => (item.id === a.id ? { ...item, percentComplete: val } : item)));
                        }}
                        className="w-16 p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono font-bold text-right text-[#003366] dark:text-sky-300"
                      />
                    ) : (
                      <span className="font-mono font-bold text-[#003366] dark:text-sky-300">{a.percentComplete}%</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100 text-center">
                    {isInlineEditMfg ? (
                      <select aria-label="Status"
                        value={a.status}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setMfgActivities((prev) => prev.map((item) => (item.id === a.id ? { ...item, status: val } : item)));
                        }}
                        className="p-1 bg-amber-50 border border-amber-300 rounded text-xs font-bold text-slate-800"
                      >
                        <option value="Completed">Completed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending">Pending</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        a.status === "Completed" ? "bg-emerald-100 text-emerald-800" :
                        a.status === "In Progress" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {a.status}
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditMfg ? (
                      <input aria-label="Remarks"
                        type="text"
                        value={a.remarks}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMfgActivities((prev) => prev.map((item) => (item.id === a.id ? { ...item, remarks: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs text-slate-600"
                      />
                    ) : (
                      <span className="text-slate-600 text-[11px]">{a.remarks}</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <button aria-label="Delete Activity"
                      onClick={() => setMfgActivities((prev) => prev.filter((item) => item.id !== a.id))}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Delete Activity"
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

      {/* 8.0 INSPECTION / TESTING STATUS */}
      <div id="sec-8" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">8.0 INSPECTION / TESTING STATUS</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[11px]">
              {inspections.length} tests
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInlineEditInspections(!isInlineEditInspections)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isInlineEditInspections ? "bg-amber-400 text-slate-950 font-black" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>{isInlineEditInspections ? "Exit Inline Edit" : "Inline Edit"}</span>
            </button>
            <button
              onClick={handleAddInspection}
              className="px-2.5 py-1 bg-white text-[#003366] dark:text-sky-300 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Inspection</span>
            </button>
            <span className="font-mono text-[11px] text-sky-200 hidden md:inline ml-2">IQE-TP-05 Clause 8.0</span>
          </div>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-center w-12 border-r border-slate-200">Sl.</th>
                <th className="p-2.5 border-r border-slate-200 min-w-[220px]">Inspection / Test Activity</th>
                <th className="p-2.5 border-r border-slate-200 font-mono">Planned Date</th>
                <th className="p-2.5 border-r border-slate-200 font-mono font-bold">Actual / Expected Date</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Status</th>
                <th className="p-2.5 border-r border-slate-200 font-mono">RFI / Report Ref.</th>
                <th className="p-2.5 border-r border-slate-200">Remarks</th>
                <th className="p-2.5 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inspections.map((i, idx) => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-mono font-bold text-slate-600 border-r border-slate-100">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditInspections ? (
                      <input aria-label="Activity"
                        type="text"
                        value={i.activity}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInspections((prev) => prev.map((item) => (item.id === i.id ? { ...item, activity: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-bold text-slate-900"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{i.activity}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditInspections ? (
                      <input aria-label="Planned date"
                        type="date"
                        value={i.plannedDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInspections((prev) => prev.map((item) => (item.id === i.id ? { ...item, plannedDate: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono"
                      />
                    ) : (
                      <span className="font-mono text-slate-500">{i.plannedDate}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditInspections ? (
                      <input aria-label="Actual date"
                        type="date"
                        value={i.actualDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInspections((prev) => prev.map((item) => (item.id === i.id ? { ...item, actualDate: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    ) : (
                      <span className="font-mono font-bold text-slate-900">{i.actualDate}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100 text-center">
                    {isInlineEditInspections ? (
                      <select aria-label="Status"
                        value={i.status}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setInspections((prev) => prev.map((item) => (item.id === i.id ? { ...item, status: val } : item)));
                        }}
                        className="p-1 bg-amber-50 border border-amber-300 rounded text-xs font-bold text-slate-800"
                      >
                        <option value="Passed">Passed</option>
                        <option value="Witnessed">Witnessed</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Hold">Hold</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                        {i.status}
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100 font-mono text-sky-700">
                    {isInlineEditInspections ? (
                      <input aria-label="RFI Ref."
                        type="text"
                        value={i.rfiRef}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInspections((prev) => prev.map((item) => (item.id === i.id ? { ...item, rfiRef: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono font-bold text-sky-700"
                      />
                    ) : (
                      <span>{i.rfiRef}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditInspections ? (
                      <input aria-label="Remarks"
                        type="text"
                        value={i.remarks}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInspections((prev) => prev.map((item) => (item.id === i.id ? { ...item, remarks: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs text-slate-600"
                      />
                    ) : (
                      <span className="text-slate-600 text-[11px]">{i.remarks}</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <button aria-label="Delete Inspection Activity"
                      onClick={() => setInspections((prev) => prev.filter((item) => item.id !== i.id))}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Delete Inspection Activity"
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

      {/* 9.0 SCHEDULE / DELIVERY ASSESSMENT */}
      <div id="sec-9" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider">9.0 SCHEDULE / DELIVERY ASSESSMENT</span>
          <span className="font-mono text-[11px] text-sky-200">IQE-TP-05 Clause 9.0</span>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-left border-r border-slate-200 w-1/4">Particular</th>
                <th className="p-2.5 text-left border-r border-slate-200 w-1/3">Status</th>
                <th className="p-2.5 text-left">Remarks / Recovery Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              <tr>
                <td className="p-2.5 border-r border-slate-100 font-semibold text-slate-800">Delivery against PO</td>
                <td className="p-2.5 border-r border-slate-100">
                  <div className="flex items-center gap-3">
                    {["On Schedule", "At Risk", "Delayed"].map((st) => (
                      <label key={st} className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="delAgainstPO" defaultChecked={st === "At Risk"} className="text-[#003366]" />
                        <span className="text-[11px] font-semibold">{st}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className="p-2.5 text-slate-600">8 days delay forecasted due to flange sub-order delivery</td>
              </tr>
              <tr>
                <td className="p-2.5 border-r border-slate-100 font-semibold text-slate-800">Critical Path Items</td>
                <td className="p-2.5 border-r border-slate-100">
                  <div className="flex items-center gap-3">
                    {["None", "Identified"].map((st) => (
                      <label key={st} className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="critPath" defaultChecked={st === "Identified"} className="text-[#003366]" />
                        <span className="text-[11px] font-semibold">{st}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className="p-2.5 text-slate-600">{scheduleAssessment.criticalPathItems}</td>
              </tr>
              <tr>
                <td className="p-2.5 border-r border-slate-100 font-semibold text-slate-800">Recovery Plan Required</td>
                <td className="p-2.5 border-r border-slate-100">
                  <div className="flex items-center gap-3">
                    {["No", "Yes"].map((st) => (
                      <label key={st} className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="recovPlan" defaultChecked={st === "Yes"} className="text-[#003366]" />
                        <span className="text-[11px] font-semibold">{st}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className="p-2.5 text-slate-600">Double shift implemented for welding and fit-up</td>
              </tr>
              <tr>
                <td className="p-2.5 border-r border-slate-100 font-semibold text-slate-800">Supplier Commitment</td>
                <td colSpan={2} className="p-2.5 text-slate-800 font-semibold">
                  {scheduleAssessment.supplierCommitment}
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="p-2.5 border-r border-slate-200 text-[#003366] dark:text-sky-300">IQE Assessment</td>
                <td colSpan={2} className="p-2.5">
                  <div className="flex items-center gap-4">
                    {["Satisfactory", "Concern", "Critical"].map((st) => (
                      <label key={st} className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="iqeAssessmentVal" defaultChecked={st === "Concern"} className="text-[#003366]" />
                        <span className={`text-[11px] font-bold ${
                          st === "Concern" ? "text-amber-700" : st === "Critical" ? "text-rose-700" : "text-emerald-700"
                        }`}>
                          {st}
                        </span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 10.0 ACTIONS / FOLLOW-UP */}
      <div id="sec-10" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">10.0 ACTIONS / FOLLOW-UP</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[11px]">
              {actions.length} action items
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
              <span>+ Add Action Item</span>
            </button>
            <span className="font-mono text-[11px] text-sky-200 hidden md:inline ml-2">IQE-TP-05 Clause 10.0</span>
          </div>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-center w-12 border-r border-slate-200">Sl.</th>
                <th className="p-2.5 border-r border-slate-200 min-w-[260px]">Action / Observation</th>
                <th className="p-2.5 border-r border-slate-200">Responsibility</th>
                <th className="p-2.5 border-r border-slate-200 font-mono">Target Date</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Status</th>
                <th className="p-2.5 border-r border-slate-200">Remarks</th>
                <th className="p-2.5 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {actions.map((act, idx) => (
                <tr key={act.id} className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-mono font-bold text-slate-600 border-r border-slate-100">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditActions ? (
                      <input aria-label="Action"
                        type="text"
                        value={act.action}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActions((prev) => prev.map((item) => (item.id === act.id ? { ...item, action: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-semibold text-slate-900"
                      />
                    ) : (
                      <span className="font-semibold text-slate-900">{act.action}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditActions ? (
                      <input aria-label="Responsibility"
                        type="text"
                        value={act.responsibility}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActions((prev) => prev.map((item) => (item.id === act.id ? { ...item, responsibility: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-bold text-sky-700"
                      />
                    ) : (
                      <span className="font-bold text-sky-700">{act.responsibility}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditActions ? (
                      <input aria-label="Target date"
                        type="date"
                        value={act.targetDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActions((prev) => prev.map((item) => (item.id === act.id ? { ...item, targetDate: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    ) : (
                      <span className="font-mono font-bold text-slate-900">{act.targetDate}</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100 text-center">
                    {isInlineEditActions ? (
                      <select aria-label="Status"
                        value={act.status}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setActions((prev) => prev.map((item) => (item.id === act.id ? { ...item, status: val } : item)));
                        }}
                        className="p-1 bg-amber-50 border border-amber-300 rounded text-xs font-bold text-slate-800"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Closed">Closed</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        act.status === "Closed" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {act.status}
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-slate-100">
                    {isInlineEditActions ? (
                      <input aria-label="Remarks"
                        type="text"
                        value={act.remarks}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActions((prev) => prev.map((item) => (item.id === act.id ? { ...item, remarks: val } : item)));
                        }}
                        className="w-full p-1 bg-amber-50 border border-amber-300 rounded text-xs text-slate-600"
                      />
                    ) : (
                      <span className="text-slate-600 text-[11px]">{act.remarks}</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <button aria-label="Delete Action Item"
                      onClick={() => setActions((prev) => prev.filter((item) => item.id !== act.id))}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Delete Action Item"
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

      {/* 11.0 CONCLUSION */}
      <div id="sec-11" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider">11.0 CONCLUSION</span>
          <span className="font-mono text-[11px] text-sky-200">IQE-TP-05 Clause 11.0</span>
        </div>
        <div className="p-4 bg-white space-y-2">
          <p className="text-xs text-slate-500 font-semibold">
            Expeditor&apos;s overall assessment and recommendation:
          </p>
          <textarea aria-label="Conclusion"
            rows={3}
            value={conclusionText}
            onChange={(e) => setConclusionText(e.target.value)}
            className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003366] text-slate-800 bg-slate-50/50"
          />
        </div>
      </div>

      {/* 12.0 PHOTOGRAPHS */}
      <div id="sec-12" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider">12.0 PHOTOGRAPHS</span>
          <span className="font-mono text-[11px] text-sky-200">IQE-TP-05 Clause 12.0</span>
        </div>
        <div className="p-4 bg-white space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-center">
              <span className="font-bold text-slate-700 block">Photo 1</span>
              <div className="h-32 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-mono text-[11px]">
                [Insert Photograph 1]
              </div>
              <div className="font-semibold text-slate-700 text-[11px]">
                Caption: V-101A Shell Rolling &amp; Seam Fit-Up
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-center">
              <span className="font-bold text-slate-700 block">Photo 2</span>
              <div className="h-32 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-mono text-[11px]">
                [Insert Photograph 2]
              </div>
              <div className="font-semibold text-slate-700 text-[11px]">
                Caption: HE-201 Tube-to-Tubesheet Orbital Welding
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-center">
              <span className="font-bold text-slate-700 block">Photo 3</span>
              <div className="h-32 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-mono text-[11px]">
                [Insert Photograph 3]
              </div>
              <div className="font-semibold text-slate-700 text-[11px]">
                Caption: Master Calibrated Pressure Gauge Check
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-center">
              <span className="font-bold text-slate-700 block">Photo 4</span>
              <div className="h-32 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-mono text-[11px]">
                [Insert Photograph 4]
              </div>
              <div className="font-semibold text-slate-700 text-[11px]">
                Caption: SS 316L Heat #HT-9884 Hard Punch Trace
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            Photographs are taken with prior permission from the supplier/vendor. Photographs shall be included as applicable.
          </p>
        </div>
      </div>

      {/* 13.0 ACKNOWLEDGEMENT & SIGNATURES */}
      <div id="sec-13" className="scroll-mt-32 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-[#003366] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider">13.0 ACKNOWLEDGEMENT &amp; SIGNATURES</span>
          <span className="font-mono text-[11px] text-sky-200">IQE-TP-05 Clause 13.0</span>
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
                  <span className="font-bold text-slate-800">R. Sundararajan</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Designation:</span>
                  <span className="font-bold text-slate-800">General Manager - Production</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Signature:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    [Digitally Signed - R. Sundararajan]
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Date:</span>
                  <span className="font-mono font-bold text-slate-800">{meta.date}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Company Stamp:</span>
                  <div className="mt-1 h-14 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-[11px]">
                    {meta.supplier} &bull; Works Division
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
                  <span className="font-bold text-slate-800">{meta.iqeExpeditor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">IQE Expeditor:</span>
                  <span className="font-bold text-slate-800">Senior Lead Auditor &amp; Expeditor</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Signature:</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    [Digitally Endorsed - Alok Gupta]
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Date:</span>
                  <span className="font-mono font-bold text-slate-800">{meta.date}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 block">IQE Stamp:</span>
                  <div className="mt-1 h-14 border border-dashed border-blue-300 bg-blue-50/40 rounded-lg flex items-center justify-center text-blue-800 font-bold text-[11px]">
                    IDEAL QUALITY ENGINEERS (I) PVT. LTD. &bull; EXPEDITING VERIFIED
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
              defaultValue="Manufacturer confirms commitment to expedited schedule and 12-hour dual shift working."
              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* DISCLAIMER & FOOTER */}
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/80 space-y-3 text-xs text-slate-600 leading-relaxed">
        <h4 className="font-extrabold text-[#003366] dark:text-sky-300 uppercase text-xs tracking-wider">
          DISCLAIMER
        </h4>
        <p>
          The report records observations and information made available to IQE during the expediting visit at the time and location stated herein. It does not relieve the supplier/manufacturer of its contractual, statutory or regulatory responsibilities or obligations under the Purchase Order and other approved documents.
        </p>
        <div className="pt-3 border-t border-slate-200 text-center font-extrabold text-slate-700 tracking-wider">
          &mdash; END OF REPORT &mdash;
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200 pt-2 font-mono">
          <span>IQE-TP-05 | Rev. 00 | Controlled Document</span>
          <span>Page 3 of 3</span>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Document:</span>
          <span className="text-xs font-extrabold text-[#003366] dark:text-sky-300 font-mono">IQE-TP-05 &bull; {meta.reportNo}</span>
          <span className="text-xs text-slate-300">|</span>
          <span className="text-xs font-semibold text-slate-600">{items.length} Expedited Items</span>
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
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
            title="Save Report"
          >
            <Save className="w-4 h-4 text-sky-400" />
            <span>Save Report</span>
          </button>
        </div>
      </div>

      {/* Save Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>Expediting Visit Report (IQE-TP-05) successfully saved!</span>
        </div>
      )}
      {/* Live Pixel-Matched PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        formCode="TP05"
        payload={{
          report_no: meta.reportNo,
          date: meta.date,
          visit_ref_and_date: meta.callRef,
          previous_visit: meta.previousVisit,
          next_planned_visit: meta.nextPlannedVisit,
          location: meta.location,
          customer: meta.customer,
          supplier: meta.supplier,
          project: meta.project,
          sub_supplier: meta.subSupplier,
          po_no_and_date: meta.supplierPONo,
          expeditor: meta.iqeExpeditor,
          items: items.map((i) => ({
            item_no: i.itemNo,
            description: i.description,
            po_qty: i.poQty,
            tag_no: i.tagNo,
            promised_delivery: i.promisedDelivery,
            expected_delivery: i.currentExpectedDelivery,
            qty_available: i.qtyProduced,
            status: i.status,
            remarks: i.remarks,
          })),
          order_status: progress.orderStatus,
          order_status_remarks: "Partially completed per milestone schedule.",
          engineering_pct: progress.engineeringDesign,
          engineering_remarks: "Engineering design 95% complete; 2 spool isometrics under client approval.",
          procurement_pct: progress.materialProcurement,
          procurement_remarks: "All forged flanges and raw pipes received in shop.",
          manufacturing_pct: progress.manufacturingFabrication,
          manufacturing_remarks: "Welding and fit-up in progress on 4 skids.",
          inspection_pct: progress.inspectionTesting,
          inspection_remarks: "Visual and hydro test scheduled next week.",
          documentation_pct: progress.documentation,
          documentation_remarks: "MTC compilation underway.",
          overall_completion_pct: progress.overallCompletion,
          overall_remarks: "Overall project on track per revised milestone schedule.",
          summary: summaryText,
          personnel: personnel.map((p, idx) => ({
            sl: idx + 1,
            name: p.name,
            designation: p.designation,
            company: p.company,
            role: p.role,
          })),
          doc_details: documents.map((d, idx) => ({
            sl: idx + 1,
            doc_name: d.docTitle,
            doc_no: d.docNo,
            rev: d.rev,
            status: d.status,
            approval_status: d.approvalStatus,
            remarks: d.remarks,
          })),
          sub_orders: subOrders.map((s, idx) => ({
            sl: idx + 1,
            component: s.component,
            sub_supplier: s.supplier,
            order_ref: s.orderRef,
            qty_ordered: s.qtyOrdered,
            qty_received: s.qtyReceived,
            expected_balance: s.expectedBalance,
            status_remarks: s.status,
          })),
          mfg_status: mfgActivities.map((m, idx) => ({
            sl: idx + 1,
            activity: m.activity,
            planned_finish: m.plannedFinish,
            actual_finish: m.actualExpectedFinish,
            pct: m.percentComplete,
            status: m.status,
            remarks: m.remarks,
          })),
          insp_testing: inspections.map((ins, idx) => ({
            sl: idx + 1,
            activity: ins.activity,
            planned_date: ins.plannedDate,
            actual_date: ins.actualDate,
            status: ins.status,
            ref: ins.rfiRef,
            remarks: ins.remarks,
          })),
          delivery_status: scheduleAssessment.deliveryAgainstPO,
          delivery_remarks: "Critical path monitored closely.",
          critical_path: scheduleAssessment.criticalPathItems,
          critical_path_remarks: "Sanitary flanges expedited.",
          recovery_plan: scheduleAssessment.recoveryPlanRequired,
          recovery_plan_remarks: "Catch-up schedule implemented.",
          supplier_commitment: scheduleAssessment.supplierCommitment,
          iqe_assessment: scheduleAssessment.iqeAssessment,
          iqe_assessment_remarks: "Concerns flagged to client.",
          actions: actions.map((a, idx) => ({
            sl: idx + 1,
            action: a.action,
            responsibility: a.responsibility,
            target_date: a.targetDate,
            status: a.status,
            remarks: a.remarks,
          })),
          conclusion: conclusionText,
        }}
        pdfUrl={`${API_BASE}/api/tpi/preview/TP05.pdf`}
        title="IQE-TP-05 Expediting Visit Report"
        reportNo={meta.reportNo}
      />
      {/* ADD NEW EXPEDITING ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#003366] flex items-center justify-center text-white">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Add New Expediting Line Item</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Create order tracking entry (Clause 1.0)</p>
                </div>
              </div>
              <button aria-label="Close" title="Close"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase text-[11px]">Item Description & Scope *</label>
                  <textarea aria-label="Item Description & Scope"
                    rows={2}
                    required
                    placeholder="e.g. Sanitary Shell & Tube Condenser 316L (500 LPH)..."
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[11px]">PO Qty *</label>
                    <input aria-label="PO Qty"
                      type="number"
                      required
                      min={1}
                      value={newItem.poQty}
                      onChange={(e) => setNewItem({ ...newItem, poQty: parseInt(e.target.value) || 1 })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[11px]">Tag / Serial No. *</label>
                    <input aria-label="Tag / Serial No."
                      type="text"
                      required
                      placeholder="e.g. V-101A / HE-201"
                      value={newItem.tagNo}
                      onChange={(e) => setNewItem({ ...newItem, tagNo: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[11px]">Promised Delivery Date</label>
                    <input aria-label="Promised Delivery Date"
                      type="date"
                      value={newItem.promisedDelivery}
                      onChange={(e) => setNewItem({ ...newItem, promisedDelivery: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[11px]">Expected Delivery Date</label>
                    <input aria-label="Expected Delivery Date"
                      type="date"
                      value={newItem.currentExpectedDelivery}
                      onChange={(e) => setNewItem({ ...newItem, currentExpectedDelivery: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-emerald-800 uppercase text-[11px]">Qty Available / Produced</label>
                    <input aria-label="Qty Available / Produced"
                      type="number"
                      min={0}
                      value={newItem.qtyProduced}
                      onChange={(e) => setNewItem({ ...newItem, qtyProduced: parseInt(e.target.value) || 0 })}
                      className="w-full mt-1 p-2 bg-emerald-50 border border-emerald-300 rounded-xl font-mono font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[11px]">Schedule Status</label>
                    <select aria-label="Schedule Status"
                      value={newItem.status}
                      onChange={(e) => setNewItem({ ...newItem, status: e.target.value as any })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="On Schedule">On Schedule</option>
                      <option value="At Risk">At Risk</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase text-[11px]">Expediting Remarks & Progress Notes</label>
                  <input aria-label="Expediting Remarks & Progress Notes"
                    type="text"
                    placeholder="e.g. Fabrication 80% complete, hydro test scheduled..."
                    value={newItem.remarks}
                    onChange={(e) => setNewItem({ ...newItem, remarks: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4 text-sky-300" />
                  <span>Add Line Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    Expediting Item Details &bull; Item #{viewingItem.itemNo}
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
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Description</span>
                <span className="font-semibold text-slate-800 text-xs">{viewingItem.description}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">PO Qty</span>
                <span className="font-mono font-bold text-slate-800">{viewingItem.poQty}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Qty Available / Produced</span>
                <span className="font-mono font-bold text-emerald-700">{viewingItem.qtyProduced}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Promised Delivery</span>
                <span className="font-mono text-slate-700">{viewingItem.promisedDelivery}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Current Expected Delivery</span>
                <span className="font-mono font-bold text-slate-900">{viewingItem.currentExpectedDelivery}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Schedule Status</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold mt-0.5 ${
                  viewingItem.status === "On Schedule" || viewingItem.status === "Completed"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {viewingItem.status}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Lock Status</span>
                <span className="font-mono font-bold text-slate-700">{viewingItem.isLocked ? "Locked" : "Unlocked"}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Expediting Remarks & Progress</span>
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
                Edit Item &bull; #{editingItem.itemNo} ({editingItem.tagNo})
              </h3>
              <button aria-label="Close" title="Close" onClick={() => setEditingItem(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setItems(items.map((i) => (i.id === editingItem.id ? editingItem : i)));
                setEditingItem(null);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
              }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase text-[11px]">Description</label>
                  <input aria-label="Description"
                    type="text"
                    required
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[11px]">PO Qty</label>
                    <input aria-label="PO Qty"
                      type="number"
                      min={1}
                      value={editingItem.poQty}
                      onChange={(e) => setEditingItem({ ...editingItem, poQty: parseInt(e.target.value) || 1 })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[11px]">Tag / Serial No.</label>
                    <input aria-label="Tag / Serial No."
                      type="text"
                      value={editingItem.tagNo}
                      onChange={(e) => setEditingItem({ ...editingItem, tagNo: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[11px]">Promised Delivery</label>
                    <input aria-label="Promised Delivery"
                      type="date"
                      value={editingItem.promisedDelivery}
                      onChange={(e) => setEditingItem({ ...editingItem, promisedDelivery: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[11px]">Current Expected Delivery</label>
                    <input aria-label="Current Expected Delivery"
                      type="date"
                      value={editingItem.currentExpectedDelivery}
                      onChange={(e) => setEditingItem({ ...editingItem, currentExpectedDelivery: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[11px]">Qty Available / Produced</label>
                    <input aria-label="Qty Available / Produced"
                      type="number"
                      min={0}
                      value={editingItem.qtyProduced}
                      onChange={(e) => setEditingItem({ ...editingItem, qtyProduced: parseInt(e.target.value) || 0 })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase text-[11px]">Status</label>
                    <select aria-label="Status"
                      value={editingItem.status}
                      onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    >
                      <option value="On Schedule">On Schedule</option>
                      <option value="At Risk">At Risk</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase text-[11px]">Remarks</label>
                  <input aria-label="Remarks"
                    type="text"
                    value={editingItem.remarks}
                    onChange={(e) => setEditingItem({ ...editingItem, remarks: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] font-bold text-white transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
