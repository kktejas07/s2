"use client";

import { API_BASE } from "@/lib/config";
import { useState, useEffect } from "react";
import { downloadPdfFile } from "@/lib/downloadPdf";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";
import {
  Building2,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  Truck,
  Layers,
  HardHat,
  Scale,
  RefreshCw,
  Search,
  Check,
  Award,
  TrendingDown,
  Info,
  Box,
  Eye,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  Columns,
  Table as TableIcon,
  Save,
  Lock,
  Unlock,
  CheckSquare,
  Loader2,
  Plus,
} from "@/components/icons";

// Guaranteed Initial 100-Item Dataset for instant client rendering
const RAW_MATERIALS = [
  ['Cement Supply & Testing (OPC 53 Grade UltraTech)', 'Bags', 380.0, 500.0, 490.0],
  ['Cement PPC Grade KCP Brand Supply', 'Bags', 365.0, 600.0, 590.0],
  ['River Sand Supply - Zone II Fine Aggregates', 'Mt', 1200.0, 187.09, 183.0],
  ['Manufactured Sand (M-Sand) Supply for Concrete', 'Mt', 950.0, 250.0, 245.0],
  ['Quarry Dust Supply for Sub-base & PCC Bed Filling', 'Mt', 650.0, 120.0, 118.0],
  ['10mm Coarse Aggregate Stone Chips', 'Mt', 1150.0, 85.0, 84.0],
  ['20mm Coarse Aggregate Blue Metal Chips', 'Mt', 1250.0, 160.0, 157.0],
  ['40mm Coarse Aggregate for PCC Base Bed', 'Mt', 1050.0, 95.0, 93.0],
  ['8mm Fe 550D TMT Steel Rebar (Suguna Metals)', 'Mt', 64000.0, 5.86, 5.80],
  ['10mm Fe 550D TMT Steel Rebar (Suguna Metals)', 'Mt', 63500.0, 8.50, 8.35],
  ['12mm Fe 550D TMT Steel Rebar (Suguna Metals)', 'Mt', 62500.0, 12.00, 11.80],
  ['16mm Fe 550D TMT Steel Rebar (Suguna Metals)', 'Mt', 62000.0, 15.50, 15.20],
  ['20mm Fe 550D TMT Steel Rebar (Suguna Metals)', 'Mt', 61500.0, 10.00, 9.80],
  ['25mm Fe 550D TMT Steel Rebar (Suguna Metals)', 'Mt', 61000.0, 7.50, 7.40],
  ['Black Annealed G.I. Binding Wire (18 Gauge)', 'Kg', 85.0, 500.0, 490.0],
  ['PCC 1:4:8 Plain Cement Concrete Bedding', 'Cum', 4500.0, 69.17, 68.50],
  ['M 20 Grade Reinforced Concrete Foundations', 'Cum', 5800.0, 120.0, 118.0],
  ['M 25 Grade RCC Columns, Beams & Slabs', 'Cum', 6800.0, 349.57, 345.00],
  ['M 30 Grade High Strength RCC Retaining Wall', 'Cum', 7400.0, 85.0, 84.0],
  ['AAC Block Masonry 200mm Walls in 1:6 Mortar', 'Cum', 3800.0, 140.0, 138.0],
  ['Red Wire Cut Brick Masonry 230mm Outer Walls', 'Nos', 12.50, 15000.0, 14800.0],
  ['Flyash Brick Masonry 115mm Partition Walls', 'Nos', 8.50, 22000.0, 21700.0],
  ['Formwork & Centering Plywood Shuttering for Slab', 'Sqm', 320.0, 1250.0, 1240.0],
  ['Column Steel Prop Shuttering & Bracing', 'Sqm', 380.0, 450.0, 445.0],
  ['Iron Workers & Skilled Steel Bar Bending Labor', 'Mt', 6500.0, 32.21, 31.50],
  ['Masonry & Concrete Placement Skilled Labor', 'Cum', 450.0, 349.57, 345.00],
  ['12mm Thick Internal Cement Plastering 1:4 Mortar', 'Sqm', 180.0, 1850.0, 1830.0],
  ['20mm Thick External Double Coat Sand Face Plaster', 'Sqm', 240.0, 1400.0, 1380.0],
  ['Polymer Modified Waterproofing Coating Roof Slab', 'Sqm', 480.0, 320.0, 320.0],
  ['Anti-Termite Treatment Soil Injection Base Bed', 'Sqm', 65.0, 2500.0, 2480.0],
];

const INITIAL_100_ITEMS = Array.from({ length: 100 }, (_, idx) => {
  const i = idx + 1;
  const m = RAW_MATERIALS[(i - 1) % RAW_MATERIALS.length];
  const item_code = `BOQ-CIV-${String(i).padStart(3, "0")}`;
  const desc = `${m[0]} - Phase ${Math.floor((i - 1) / RAW_MATERIALS.length) + 1}`;
  const uom = m[1] as string;
  const rate = m[2] as number;
  const claimed_qty = Number(( (m[3] as number) * (1 + (i % 5) * 0.05) ).toFixed(2));
  const verified_qty = Number(( (m[4] as number) * (1 + (i % 5) * 0.048) ).toFixed(2));
  const diff_qty = Number((claimed_qty - verified_qty).toFixed(2));
  const claimed_amt = Number((claimed_qty * rate).toFixed(2));
  const recommended_amt = Number((verified_qty * rate).toFixed(2));
  const savings_amt = Number((claimed_amt - recommended_amt).toFixed(2));

  return {
    slNo: i,
    sl_no: String(i),
    boqItem: item_code,
    item_code: item_code,
    raBillNo: "RA-CBV-2026-004",
    billDate: "2026-08-14",
    client: "State Health Medical Infrastructure Corp / MCGM",
    contractor: "Suguna Metals & Civil Contractors Ltd.",
    description: desc,
    unit: uom,
    drawingRef: `GIL/GAG/CIV-${String((i % 15) + 1).padStart(3, "0")} R2`,
    contractQty: Number((claimed_qty * 1.2).toFixed(2)),
    prevCertifiedQty: Number((claimed_qty * 0.3).toFixed(2)),
    claimedQty: claimed_qty,
    total_consumed: claimed_qty,
    verifiedQty: verified_qty,
    theoretical_consumed: verified_qty,
    diffQty: diff_qty,
    unitRate: rate,
    unit_rate: rate,
    claimedAmount: claimed_amt,
    claimed_amount: claimed_amt,
    recommendedAmount: recommended_amt,
    verified_payable_amount: recommended_amt,
    savingsAmount: savings_amt,
    variationOrder: diff_qty > 0 ? "Y" : "N",
    voRefNo: diff_qty > 0 ? `VO-RA-004-${String(i).padStart(3, "0")}` : "N/A",
    governanceClause: "Clause 12.3 (Bill Verification & Audit)",
    isConcealedWork: desc.includes("PCC") || desc.includes("Rebar") || desc.includes("Foundation") ? "Y" : "N",
    measurementProtocol: "Joint Physical Measurement & Test Audit",
    engineerRemarks: diff_qty <= 0 ? "Lab test & strength verified" : "Variance deducted per IS 1200",
    actionRequired: diff_qty <= 0 ? "Verified & Approved" : "Variance Deducted & Corrected",
    closureStatus: diff_qty <= 0 ? "Verified & Approved" : "Discrepancy Flagged",
    lockStatus: "LOCKED - CERTIFIED & SEALED"
  };
});

const INITIAL_ABSTRACT = {
  site_id: "SITE-MUDIGONDA-01",
  site_name: "Mudigonda CHC Construction Site",
  report_ref: "IQE/CBV/2026/088",
  contractor: "Suguna Metals & Civil Contractors Ltd.",
  client: "State Health Medical Infrastructure Corp",
  ra_bill_no: "RA-CBV-2026-004",
  audit_period: "April 2026 - August 2026",
  total_claimed_amount: INITIAL_100_ITEMS.reduce((sum, item) => sum + item.claimedAmount, 0),
  total_verified_amount: INITIAL_100_ITEMS.reduce((sum, item) => sum + item.recommendedAmount, 0),
  total_discrepancy_savings: INITIAL_100_ITEMS.reduce((sum, item) => sum + item.savingsAmount, 0),
  overall_status: "VERIFIED & PASSED",
  abstract_items: INITIAL_100_ITEMS
};

export default function ConstructionBillVerificationPage() {
  const [activeTab, setActiveTab] = useState<"abstract" | "steel" | "dailylogs" | "waybills" | "export">("abstract");
  const [isTabSwitching, setIsTabSwitching] = useState(false);

  const handleTabSwitch = (tab: "abstract" | "steel" | "dailylogs" | "waybills" | "export") => {
    setIsTabSwitching(true);
    setActiveTab(tab);
    setTimeout(() => setIsTabSwitching(false), 220);
  };

  const handleToggleLock = (slNo: number) => {
    setAbstractData((prev: any) => ({
      ...prev,
      abstract_items: prev.abstract_items.map((it: any) => {
        const itemSl = it.slNo ?? it.sl_no;
        if (itemSl === slNo) {
          const isCurrentlyLocked = it.lockStatus?.includes("LOCKED") || it.isLocked;
          return {
            ...it,
            isLocked: !isCurrentlyLocked,
            lockStatus: isCurrentlyLocked ? "UNLOCKED - DRAFT" : "LOCKED - SEALED"
          };
        }
        return it;
      })
    }));
  };

  const handleExportSingleRowCSV = (item: any) => {
    const sl = item.slNo || item.sl_no || 1;
    const boq = item.boqItem || item.item_code || `BOQ-${sl}`;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "SL No,BOQ Item,Description,Unit,Contract Qty,Claimed Qty,Verified Qty,Unit Rate,Claimed Amount,Verified Amount,Savings Amount,Status,Lock Status",
        `${sl},"${boq}","${(item.description || "").replace(/"/g, '""')}","${item.unit || ""}",${item.contractQty || 0},${item.claimedQty || 0},${item.verifiedQty || 0},${item.unitRate || 0},${item.claimedAmount || 0},${item.recommendedAmount || 0},${item.savingsAmount || 0},"${item.closureStatus || item.verification_status || ""}","${item.lockStatus || ""}"`,
      ].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `CBV_Item_${sl}_${boq}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isInlineEditMode, setIsInlineEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    boqItem: "",
    description: "",
    unit: "Cum",
    contractQty: 100,
    claimedQty: 10,
    verifiedQty: 10,
    unitRate: 1500,
    remarks: "Joint site measurement verified",
  });

  const handleInlineItemChange = (slNo: number, field: string, value: any) => {
    setAbstractData((prev: any) => {
      const updated = prev.abstract_items.map((it: any) => {
        const itemSl = it.slNo ?? it.sl_no;
        if (itemSl === slNo) {
          const claimed = field === "claimedQty" ? Number(value) : (it.claimedQty ?? it.total_consumed ?? 0);
          const verified = field === "verifiedQty" ? Number(value) : (it.verifiedQty ?? it.theoretical_consumed ?? 0);
          const rate = field === "unitRate" ? Number(value) : (it.unitRate ?? it.unit_rate ?? 0);
          const diff = Number((claimed - verified).toFixed(2));
          const claimedAmt = Number((claimed * rate).toFixed(2));
          const recAmt = Number((verified * rate).toFixed(2));
          const savings = Number((claimedAmt - recAmt).toFixed(2));
          return {
            ...it,
            [field]: value,
            claimedQty: claimed,
            verifiedQty: verified,
            unitRate: rate,
            diffQty: diff,
            claimedAmount: claimedAmt,
            recommendedAmount: recAmt,
            savingsAmount: savings,
          };
        }
        return it;
      });
      const newClaimed = updated.reduce((s: number, i: any) => s + (i.claimedAmount || 0), 0);
      const newVerified = updated.reduce((s: number, i: any) => s + (i.recommendedAmount || 0), 0);
      return {
        ...prev,
        total_claimed_amount: newClaimed,
        total_verified_amount: newVerified,
        total_discrepancy_savings: newClaimed - newVerified,
        abstract_items: updated,
      };
    });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const sl = (abstractData.abstract_items?.length || 0) + 1;
    const claimedAmt = Number(newItem.claimedQty) * Number(newItem.unitRate);
    const verifiedAmt = Number(newItem.verifiedQty) * Number(newItem.unitRate);
    const itemToAdd = {
      slNo: sl,
      boqItem: newItem.boqItem || `BOQ-CIV-${String(sl).padStart(3, "0")}`,
      raBillNo: "RA-CBV-2026-004",
      billDate: new Date().toISOString().split("T")[0],
      client: "State Health Corp",
      contractor: "Suguna Metals Ltd",
      description: newItem.description || `Civil Construction Item #${sl}`,
      unit: newItem.unit,
      drawingRef: "GIL/GAG/CIV-001 R2",
      contractQty: Number(newItem.contractQty),
      prevCertifiedQty: 0,
      claimedQty: Number(newItem.claimedQty),
      verifiedQty: Number(newItem.verifiedQty),
      diffQty: Number((Number(newItem.claimedQty) - Number(newItem.verifiedQty)).toFixed(2)),
      unitRate: Number(newItem.unitRate),
      claimedAmount: claimedAmt,
      recommendedAmount: verifiedAmt,
      savingsAmount: claimedAmt - verifiedAmt,
      variationOrder: Number(newItem.claimedQty) > Number(newItem.verifiedQty) ? "Y" : "N",
      voRefNo: "N/A",
      governanceClause: "Clause 12.3",
      isConcealedWork: "N",
      measurementProtocol: "Joint Physical Verification",
      remarks: newItem.remarks || "Verified & Approved",
      actionRequired: "Approved for billing",
      closureStatus: "Verified & Approved",
      lockStatus: "UNLOCKED - DRAFT",
      isLocked: false,
    };
    setAbstractData((prev: any) => {
      const updated = [itemToAdd, ...(prev.abstract_items || [])];
      return {
        ...prev,
        total_claimed_amount: (prev.total_claimed_amount || 0) + claimedAmt,
        total_verified_amount: (prev.total_verified_amount || 0) + verifiedAmt,
        total_discrepancy_savings: (prev.total_discrepancy_savings || 0) + (claimedAmt - verifiedAmt),
        abstract_items: updated,
      };
    });
    setShowAddModal(false);
    setNewItem({
      boqItem: "",
      description: "",
      unit: "Cum",
      contractQty: 100,
      claimedQty: 10,
      verifiedQty: 10,
      unitRate: 1500,
      remarks: "Joint site measurement verified",
    });
  };

  const [abstractData, setAbstractData] = useState<any>(INITIAL_ABSTRACT);
  const [steelLedger, setSteelLedger] = useState<any[]>([
    { diameter: "8mm Steel", unit: "Mt", opening_balance: 0.47, received_qty: 5.86, details_of_purchase: "Suguna Metals Ltd.", issued_for_consumption: 6.33, details_of_consumption: "Column Stirrups & Beam Ties", closing_balance: 0.00 },
    { diameter: "10mm Steel", unit: "Mt", opening_balance: 0.00, received_qty: 1.01, details_of_purchase: "Suguna Metals Ltd.", issued_for_consumption: 0.00, details_of_consumption: "Slab Top Extra Bars", closing_balance: 1.01 },
    { diameter: "12mm Steel", unit: "Mt", opening_balance: 0.40, received_qty: 5.04, details_of_purchase: "Suguna Metals Ltd.", issued_for_consumption: 0.00, details_of_consumption: "Slab Main Reinforcement", closing_balance: 5.44 },
    { diameter: "16mm Steel", unit: "Mt", opening_balance: 0.00, received_qty: 10.21, details_of_purchase: "Suguna Metals Ltd.", issued_for_consumption: 0.00, details_of_consumption: "Beam Main Longitudinal Bars", closing_balance: 10.21 },
    { diameter: "20mm Steel", unit: "Mt", opening_balance: 0.00, received_qty: 5.04, details_of_purchase: "Suguna Metals Ltd.", issued_for_consumption: 0.00, details_of_consumption: "Heavy Column Vertical Bars", closing_balance: 5.04 },
    { diameter: "25mm Steel", unit: "Mt", opening_balance: 1.19, received_qty: 4.85, details_of_purchase: "Suguna Metals Ltd.", issued_for_consumption: 0.00, details_of_consumption: "Foundation Mat Rebar", closing_balance: 6.04 },
    { diameter: "B Binding Wire", unit: "Mt", opening_balance: 0.50, received_qty: 0.20, details_of_purchase: "Local Hardware Vendor", issued_for_consumption: 0.20, details_of_consumption: "Rebar Tying & Fixing", closing_balance: 0.50 }
  ]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([
    { date: "01.04.2026", material: "Cement", unit: "Bags", opening: 767.0, received: 0.0, supplier: "UltraTech Cement Ltd.", vehicle_no: "AP 29 T 1092", consumed: 0.0, purpose: "Stock Balance Check", closing: 767.0 },
    { date: "02.04.2026", material: "Cement", unit: "Bags", opening: 767.0, received: 0.0, supplier: "UltraTech Cement Ltd.", vehicle_no: "AP 29 T 1092", consumed: 3.0, purpose: "Columns Starter Purpose", closing: 764.0 },
    { date: "03.04.2026", material: "Cement", unit: "Bags", opening: 764.0, received: 500.0, supplier: "KCP Cement Ltd.", vehicle_no: "TG 04 U 8812", consumed: 120.0, purpose: "First Floor Beam & Slab Concrete", closing: 1144.0 },
    { date: "21.04.2026", material: "Sand", unit: "Mt", opening: 144.18, received: 105.64, supplier: "Y. Mahesh Sand Quarry", vehicle_no: "TG 28 T 4139 / TG 28 T 4239", consumed: 25.0, purpose: "Structural Concrete M25", closing: 224.82 },
    { date: "24.04.2026", material: "Sand", unit: "Mt", opening: 224.82, received: 81.45, supplier: "Y. Mahesh Sand Quarry", vehicle_no: "TG 28 T 3159 / TG 28 T 5526", consumed: 40.0, purpose: "Brickwork Mortar & PCC Bed", closing: 266.27 }
  ]);
  const [waybills, setWaybills] = useState<any[]>([
    { sl_no: 1, date: "21.04.2026", supplier_name: "Y.Mahesh", vehicle_no: "TG 28 T 4139", material_type: "Sand", received_qty_mt: 34.94, remarks: "Waybill verified at entry gate", verification_status: "Verified" },
    { sl_no: 2, date: "21.04.2026", supplier_name: "Y.Mahesh", vehicle_no: "TG 28 T 4239", material_type: "Sand", received_qty_mt: 34.74, remarks: "Weighbridge slip attached", verification_status: "Verified" },
    { sl_no: 3, date: "21.04.2026", supplier_name: "Y.Mahesh", vehicle_no: "TG 28 T 3159", material_type: "Sand", received_qty_mt: 35.96, remarks: "Silt check passed", verification_status: "Verified" }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSteelDia, setSelectedSteelDia] = useState<string>("All");
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [viewMode27Col, setViewMode27Col] = useState<boolean>(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Action Modals State (View Item, Edit Item)
  const [selectedViewItem, setSelectedViewItem] = useState<any | null>(null);
  const [selectedEditItem, setSelectedEditItem] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [absRes, steelRes, dailyRes, waybillRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/construction-bill-verification/abstract`),
        fetch(`${API_BASE}/api/v1/construction-bill-verification/steel`),
        fetch(`${API_BASE}/api/v1/construction-bill-verification/daily-logs`),
        fetch(`${API_BASE}/api/v1/construction-bill-verification/waybills`),
      ]);

      if (absRes.ok) setAbstractData(await absRes.json());
      if (steelRes.ok) setSteelLedger(await steelRes.json());
      if (dailyRes.ok) setDailyLogs(await dailyRes.json());
      if (waybillRes.ok) setWaybills(await waybillRes.json());
    } catch (err) {
      console.warn("Using built-in 100-item dataset (backend offline or loading)", err);
    }
  };

  const handleExport = async (type: "pdf" | "excel" | "docx") => {
    if (type === "pdf") {
      const url = `${API_BASE}/api/v1/construction-bill-verification/export/pdf`;
      const fallback = `/sample-pdfs/F-BILL-01.pdf`;
      const filename = `Construction_Bill_Verification_${new Date().toISOString().split("T")[0]}.pdf`;
      const ok = await downloadPdfFile(url, filename, fallback);
      if (!ok) {
        setShowPdfModal(true);
      }
      return;
    }
    const url = `${API_BASE}/api/v1/construction-bill-verification/export/${type}`;
    window.open(url, "_blank");
  };

  const handleSingleItemPdf = async (item: any) => {
    const boq = item.boqItem || item.item_code || "1.01";
    const ra = item.raBillNo || "RA-001";
    const vendor = item.contractor || "Suguna Metals Ltd";
    const client = item.client || "State Health Corp";
    const desc = item.description || "Work Item";
    const uom = item.unit || "Cum";
    const dwg = item.drawingRef || "GFC-001";
    const claimed = item.claimedQty || item.total_consumed || 1;
    const verified = item.verifiedQty || item.theoretical_consumed || 1;
    const rate = item.unitRate || item.unit_rate || 1000;
    const status = item.closureStatus || item.verification_status || "Approved";

    const url = `${API_BASE}/api/v1/reports/pdf/tpi-billing-item?boq_item=${encodeURIComponent(boq)}&ra_bill=${encodeURIComponent(ra)}&vendor=${encodeURIComponent(vendor)}&client=${encodeURIComponent(client)}&description=${encodeURIComponent(desc)}&unit=${encodeURIComponent(uom)}&drawing_ref=${encodeURIComponent(dwg)}&claimed_qty=${claimed}&verified_qty=${verified}&unit_rate=${rate}&closure_status=${encodeURIComponent(status)}`;
    await downloadPdfFile(url, `Item_${boq}_Verification_Certificate.pdf`, "/sample-pdfs/F-BILL-01.pdf");
  };

  const handleSaveEditItem = () => {
    if (!selectedEditItem) return;
    const updatedItems = abstractData.abstract_items.map((item: any) => {
      if (item.slNo === selectedEditItem.slNo || item.item_code === selectedEditItem.item_code) {
        const verified = Number(selectedEditItem.verifiedQty);
        const rate = Number(selectedEditItem.unitRate);
        const claimed = Number(selectedEditItem.claimedQty);
        const diff = Number((claimed - verified).toFixed(2));
        const recAmt = Number((verified * rate).toFixed(2));
        const claimedAmt = Number((claimed * rate).toFixed(2));
        const savings = Number((claimedAmt - recAmt).toFixed(2));

        return {
          ...item,
          verifiedQty: verified,
          theoretical_consumed: verified,
          unitRate: rate,
          unit_rate: rate,
          diffQty: diff,
          wastage_qty: diff,
          recommendedAmount: recAmt,
          verified_payable_amount: recAmt,
          savingsAmount: savings,
          remarks: selectedEditItem.remarks,
          engineerRemarks: selectedEditItem.remarks,
          closureStatus: selectedEditItem.closureStatus,
          verification_status: selectedEditItem.closureStatus
        };
      }
      return item;
    });

    const newClaimed = updatedItems.reduce((sum: number, i: any) => sum + (i.claimedAmount || i.claimed_amount || 0), 0);
    const newVerified = updatedItems.reduce((sum: number, i: any) => sum + (i.recommendedAmount || i.verified_payable_amount || 0), 0);
    const newSavings = newClaimed - newVerified;

    setAbstractData({
      ...abstractData,
      total_claimed_amount: newClaimed,
      total_verified_amount: newVerified,
      total_discrepancy_savings: newSavings,
      abstract_items: updatedItems
    });

    setSelectedEditItem(null);
  };

  const allItems = abstractData?.abstract_items || INITIAL_100_ITEMS;

  const filteredItems = allItems.filter((item: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (item.item_code || "").toLowerCase().includes(q) ||
      (item.boqItem || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q) ||
      (item.drawingRef || "").toLowerCase().includes(q) ||
      (item.client || "").toLowerCase().includes(q) ||
      (item.contractor || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const filteredSteel = steelLedger.filter((s) => {
    if (selectedSteelDia !== "All" && !s.diameter.includes(selectedSteelDia)) return false;
    if (searchQuery && !s.diameter.toLowerCase().includes(searchQuery.toLowerCase()) && !s.details_of_consumption.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredDailyLogs = dailyLogs.filter((d) => {
    if (selectedMaterialFilter !== "All" && !d.material.toLowerCase().includes(selectedMaterialFilter.toLowerCase())) return false;
    if (searchQuery && !d.material.toLowerCase().includes(searchQuery.toLowerCase()) && !d.purpose.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredWaybills = waybills.filter((w) => {
    if (!searchQuery) return true;
    return (
      w.vehicle_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.material_type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 space-y-8 font-sans">
      {/* Light Theme Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> 27-Column Precision Inspection Format
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Award className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Site: Mudigonda CHC Site ({allItems.length} Supply Items)
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <Building2 className="w-8 h-8 mr-3 text-emerald-600" /> Construction Company Bill Verification
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            27-Column Master Verification Ledger, Client Material Supply Tracking, Multi-Diameter Steel Registers & Interactive PDF Report Audit.
          </p>
        </div>

        {/* Action Export & View Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all"
          >
            <Eye className="w-4 h-4 mr-2 text-emerald-400" /> View Master PDF
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <Download className="w-4 h-4 mr-2" /> PDF Certificate
          </button>
          <button
            onClick={() => handleExport("excel")}
            className="flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
          </button>
          <button
            onClick={() => handleExport("docx")}
            className="flex items-center px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-all"
          >
            <FileText className="w-4 h-4 mr-2" /> Word (.docx)
          </button>
        </div>
      </div>

      {/* KPI Overview Cards - Light Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Contractor Claimed Bill</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{abstractData?.total_claimed_amount?.toLocaleString("en-IN") || "0"}
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-600 font-medium">
            <span>RA Bill Ref: <strong className="text-slate-800">{abstractData?.ra_bill_no}</strong> ({allItems.length} Items)</span>
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-slate-400" />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>TPI Verified Payable</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            ₹{abstractData?.total_verified_amount?.toLocaleString("en-IN") || "0"}
          </div>
          <div className="mt-3 flex items-center text-xs text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Authorized for Payment Release
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500" />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Discrepancy & Wastage Savings</span>
            <TrendingDown className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600">
            ₹{abstractData?.total_discrepancy_savings?.toLocaleString("en-IN") || "0"}
          </div>
          <div className="mt-3 flex items-center text-xs text-blue-700 font-medium">
            <Scale className="w-3.5 h-3.5 mr-1 text-blue-600" /> Audit Deducted Over-Claims
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500" />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Reconciliation Status</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
            {abstractData?.overall_status || "VERIFIED"}
          </div>
          <div className="mt-3 flex items-center text-xs text-purple-700 font-medium">
            <span>Digital Seal Authenticated</span>
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-500" />
        </div>
      </div>

      {/* Tabs Header - Light Theme */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex flex-wrap items-center justify-between gap-4 relative">
        {isTabSwitching && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center gap-2 z-20 text-xs font-bold text-emerald-700 rounded-xl">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Switching module view...</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => handleTabSwitch("abstract")}
            className={`flex items-center px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "abstract"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Columns className="w-4 h-4 mr-2" /> 27-Column Master Ledger ({allItems.length})
          </button>

          <button
            onClick={() => handleTabSwitch("steel")}
            className={`flex items-center px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "steel"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <HardHat className="w-4 h-4 mr-2" /> Steel Diameter Ledger (8mm - 25mm)
          </button>

          <button
            onClick={() => handleTabSwitch("dailylogs")}
            className={`flex items-center px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "dailylogs"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Box className="w-4 h-4 mr-2" /> Daily Material Registers
          </button>

          <button
            onClick={() => handleTabSwitch("waybills")}
            className={`flex items-center px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "waybills"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Truck className="w-4 h-4 mr-2" /> Gate Pass & Waybills ({waybills.length})
          </button>

          <button
            onClick={() => handleTabSwitch("export")}
            className={`flex items-center px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "export"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Audit & Exports
          </button>
        </div>

        {/* Search Input */}
        <div className="relative pr-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input aria-label="Search bill items"
            type="text"
            placeholder="Search 100 items, code, dwg #..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-64"
          />
        </div>
      </div>

      {/* MODULE TABS BODY WITH TRANSITION LOADER */}
      {isTabSwitching ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-2xs animate-in fade-in duration-200">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-600 font-mono tracking-wide">Switching Module View...</p>
        </div>
      ) : (
        <>
          {/* Tab 1: 27-Column Precision Master Ledger */}
          {activeTab === "abstract" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-4">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between bg-slate-50/50 gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Columns className="w-5 h-5 mr-2 text-emerald-600" /> 27-Column Precision Inspection & Measurement Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Displaying {allItems.length} client supply items with full 27-field verification parameters + Action Hub on right.
              </p>
            </div>

            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <button
                onClick={() => setIsInlineEditMode(!isInlineEditMode)}
                className={`flex items-center px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  isInlineEditMode
                    ? "bg-amber-400 text-slate-950 border-amber-500 font-extrabold shadow-amber-500/20"
                    : "bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 border-slate-300"
                }`}
                title="Toggle Inline Cell Editing"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" /> {isInlineEditMode ? "Exit Inline Edit" : "Inline Edit"}
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                title="Add New Bill Verification Item"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5 text-sky-300" /> Add Item
              </button>

              <button
                onClick={() => setViewMode27Col(!viewMode27Col)}
                className={`flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  viewMode27Col ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 mr-1.5" /> {viewMode27Col ? "27-Column Full View" : "Summary View"}
              </button>

              <button
                onClick={() => setShowPdfModal(true)}
                className="flex items-center px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Live PDF Preview
              </button>

              <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                <span>Page Size:</span>
                <select aria-label="Rows per page"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-100 border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 font-semibold focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[2600px]">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3 w-12 sticky left-0 bg-slate-100 z-10 border-r border-slate-200">1. Sl</th>
                  <th className="py-3 px-3 w-28 sticky left-12 bg-slate-100 z-10 border-r border-slate-200">2. BOQ Item</th>
                  <th className="py-3 px-3 w-24">3. RA Bill</th>
                  <th className="py-3 px-3 w-24">4. Date</th>
                  <th className="py-3 px-4 w-52">5. Client Name</th>
                  <th className="py-3 px-4 w-52">6. Contractor Name</th>
                  <th className="py-3 px-4 w-64">7. Description & Specs</th>
                  <th className="py-3 px-3 w-16">8. UOM</th>
                  <th className="py-3 px-3 w-36">9. GFC Dwg Ref</th>
                  <th className="py-3 px-3 text-right w-24">10. Contract Qty</th>
                  <th className="py-3 px-3 text-right w-24">11. Prev Certified</th>
                  <th className="py-3 px-3 text-right w-24">12. Claimed Qty</th>
                  <th className="py-3 px-3 text-right w-24">13. Verified Qty</th>
                  <th className="py-3 px-3 text-right w-24">14. Diff Qty</th>
                  <th className="py-3 px-3 text-right w-24">15. Unit Rate (₹)</th>
                  <th className="py-3 px-3 text-right w-28">16. Claimed (₹)</th>
                  <th className="py-3 px-3 text-right w-28">17. Recommended (₹)</th>
                  <th className="py-3 px-3 text-right w-28">18. Savings (₹)</th>
                  <th className="py-3 px-3 text-center w-16">19. VO (Y/N)</th>
                  <th className="py-3 px-3 w-28">20. VO Ref No</th>
                  <th className="py-3 px-4 w-44">21. Contract Clause</th>
                  <th className="py-3 px-3 text-center w-16">22. Concealed</th>
                  <th className="py-3 px-4 w-48">23. Measurement Protocol</th>
                  <th className="py-3 px-4 w-48">24. TPI Remarks</th>
                  <th className="py-3 px-4 w-44">25. Action Required</th>
                  <th className="py-3 px-3 text-center w-32">26. Closure Status</th>
                  <th className="py-3 px-3 text-center w-36">27. Lock Status</th>
                  <th className="py-3 px-4 text-center w-48 sticky right-0 bg-slate-100 z-10 border-l border-slate-200 font-extrabold text-emerald-800">
                    28. Quick Audit Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {paginatedItems.map((item: any, idx: number) => {
                  const sl = item.slNo || item.sl_no || (currentPage - 1) * pageSize + idx + 1;
                  const boq = item.boqItem || item.item_code || `BOQ-CIV-${String(sl).padStart(3, "0")}`;
                  const claimedQty = item.claimedQty ?? item.total_consumed ?? 0;
                  const verifiedQty = item.verifiedQty ?? item.theoretical_consumed ?? 0;
                  const diffQty = item.diffQty ?? item.wastage_qty ?? 0;
                  const unitRate = item.unitRate ?? item.unit_rate ?? 0;
                  const claimedAmt = item.claimedAmount ?? item.claimed_amount ?? 0;
                  const recAmt = item.recommendedAmount ?? item.verified_payable_amount ?? 0;
                  const savingsAmt = item.savingsAmount ?? (claimedAmt - recAmt);

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500 sticky left-0 bg-white z-10 border-r border-slate-200 font-semibold">{sl}</td>
                      <td className="py-3 px-3 font-bold text-emerald-700 font-mono sticky left-12 bg-white z-10 border-r border-slate-200">{boq}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{item.raBillNo || item.ra_bill_no || "RA-CBV-2026-004"}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{item.billDate || "2026-08-14"}</td>
                      <td className="py-3 px-4 font-medium text-slate-900 truncate max-w-[200px]" title={item.client}>{item.client || "State Health Corp"}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 truncate max-w-[200px]" title={item.contractor}>{item.contractor || "Suguna Metals Ltd"}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 truncate max-w-[250px]" title={item.description}>{item.description}</td>
                      <td className="py-3 px-3 text-slate-500 font-medium">{item.unit}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono">{item.drawingRef || "GIL/GAG/CIV-001 R2"}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">{(item.contractQty || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">{(item.prevCertifiedQty || 0).toLocaleString()}</td>
                      <td className="py-2 px-2 text-right border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Claimed quantity for item ${sl}`}
                            type="number"
                            value={claimedQty}
                            onChange={(e) => handleInlineItemChange(sl, "claimedQty", e.target.value)}
                            className="w-20 p-1 text-right font-mono bg-amber-50 border border-amber-300 rounded text-xs font-semibold"
                          />
                        ) : (
                          <span className="font-semibold text-slate-900 font-mono">{claimedQty.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Verified quantity for item ${sl}`}
                            type="number"
                            value={verifiedQty}
                            onChange={(e) => handleInlineItemChange(sl, "verifiedQty", e.target.value)}
                            className="w-20 p-1 text-right font-mono bg-amber-50 border border-amber-300 rounded text-xs font-bold text-emerald-800"
                          />
                        ) : (
                          <span className="font-bold text-emerald-700 font-mono">{verifiedQty.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-700 font-semibold">{diffQty > 0 ? `+${diffQty}` : "0.00"}</td>
                      <td className="py-2 px-2 text-right border-r border-slate-100">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Unit rate for item ${sl}`}
                            type="number"
                            value={unitRate}
                            onChange={(e) => handleInlineItemChange(sl, "unitRate", e.target.value)}
                            className="w-20 p-1 text-right font-mono bg-amber-50 border border-amber-300 rounded text-xs font-semibold"
                          />
                        ) : (
                          <span className="font-medium text-slate-800 font-mono">₹{unitRate.toLocaleString("en-IN")}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700">₹{claimedAmt.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">₹{recAmt.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-700">₹{savingsAmt > 0 ? savingsAmt.toLocaleString("en-IN") : "0"}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">{item.variationOrder || (diffQty > 0 ? "Y" : "N")}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{item.voRefNo || "N/A"}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{item.governanceClause || "Clause 12.3"}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">{item.isConcealedWork || "N"}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]">{item.measurementProtocol || "Joint Measurement"}</td>
                      <td className="py-2 px-2 text-slate-600 truncate max-w-[180px]">
                        {isInlineEditMode && !item.isLocked ? (
                          <input aria-label={`Remarks for item ${sl}`}
                            type="text"
                            value={item.remarks || item.engineerRemarks || ""}
                            onChange={(e) => handleInlineItemChange(sl, "remarks", e.target.value)}
                            className="w-full min-w-[140px] p-1 text-xs bg-amber-50 border border-amber-300 rounded"
                          />
                        ) : (
                          item.remarks || item.engineerRemarks || "Verified"
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{item.actionRequired || "Verified & Approved"}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          (item.closureStatus || item.verification_status) === "Verified & Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {item.closureStatus || item.verification_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50/50 rounded">
                        {item.lockStatus || "LOCKED - SEALED"}
                      </td>

                      {/* Rightmost Sticky Action Hub Column */}
                      <td className="py-2 px-3 text-center sticky right-0 bg-white z-10 border-l border-slate-200 shadow-sm whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          {/* 1. Lock/Unlock */}
                          <button aria-label={item.lockStatus?.includes("LOCKED") || item.isLocked ? "Locked — Click to Unlock Row" : "Unlocked — Click to Lock Row"}
                            onClick={() => handleToggleLock(sl)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              item.lockStatus?.includes("LOCKED") || item.isLocked
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                            }`}
                            title={item.lockStatus?.includes("LOCKED") || item.isLocked ? "Locked — Click to Unlock Row" : "Unlocked — Click to Lock Row"}
                          >
                            {item.lockStatus?.includes("LOCKED") || item.isLocked ? (
                              <Lock className="w-3.5 h-3.5 text-amber-700" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </button>

                          {/* 2. View Details Modal */}
                          <button aria-label="View Full Item Audit Details"
                            onClick={() => setSelectedViewItem(item)}
                            title="View Full Item Audit Details"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-100 text-slate-700 hover:text-brand-700 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Edit Quantity, Rate & Remarks */}
                          <button aria-label="Edit Quantity, Rate & Remarks"
                            onClick={() => setSelectedEditItem({ ...item })}
                            title="Edit Quantity, Rate & Remarks"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Single CSV */}
                          <button aria-label="Download Single Row CSV"
                            onClick={() => handleExportSingleRowCSV(item)}
                            title="Download Single Row CSV"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* 5. Live Preview Single Item PDF */}
                          <button aria-label="Live Preview PDF"
                            onClick={() => setShowPdfModal(true)}
                            title="Live Preview PDF"
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0084bf] transition-colors cursor-pointer border border-sky-200/60"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 6. Download Single Item PDF Certificate */}
                          <button aria-label="Download Single Item PDF Certificate"
                            onClick={() => handleSingleItemPdf(item)}
                            title="Download Single Item PDF Certificate"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer border border-rose-200/60"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-4">
            <div>
              Showing items <strong className="text-slate-900 font-mono">{filteredItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{" "}
              <strong className="text-slate-900 font-mono">{Math.min(currentPage * pageSize, filteredItems.length)}</strong> of{" "}
              <strong className="text-slate-900 font-mono">{filteredItems.length}</strong> verified supply items
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </button>

              <span className="font-semibold text-slate-800 px-2">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Steel Diameter Ledger (8mm - 25mm) */}
      {activeTab === "steel" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Filter Diameter:</span>
              {["All", "8mm", "10mm", "12mm", "16mm", "20mm", "25mm", "Binding Wire"].map((dia) => (
                <button
                  key={dia}
                  onClick={() => setSelectedSteelDia(dia)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedSteelDia === dia
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {dia}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-600 font-medium">
              Total Rebar Received: <span className="text-emerald-700 font-mono font-bold">32.21 Mt</span> | Stock Balance: <span className="text-blue-700 font-mono font-bold">27.74 Mt</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <HardHat className="w-5 h-5 mr-2 text-emerald-600" /> Multi-Diameter Steel & Rebar Stock Ledger
              </h2>
              <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                Suguna Metals Ltd. Verified Supplier
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-3.5 px-4">Steel Grade / Diameter</th>
                    <th className="py-3.5 px-4">UOM</th>
                    <th className="py-3.5 px-4 text-right">Opening Balance</th>
                    <th className="py-3.5 px-4 text-right">Received Quantity</th>
                    <th className="py-3.5 px-4">Details of Purchase</th>
                    <th className="py-3.5 px-4 text-right">Issued for Consumption</th>
                    <th className="py-3.5 px-4">Details of Structural Usage</th>
                    <th className="py-3.5 px-4 text-right">Closing Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {filteredSteel.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-emerald-700 font-mono">{item.diameter}</td>
                      <td className="py-3.5 px-4 text-slate-500">{item.unit}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">{item.opening_balance.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">{item.received_qty.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-slate-900 font-medium">{item.details_of_purchase}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">{item.issued_for_consumption.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-slate-700">{item.details_of_consumption}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{item.closing_balance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Daily Material Registers */}
      {activeTab === "dailylogs" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Filter Material:</span>
              {["All", "Cement", "Sand", "Quarry Dust", "Bricks", "10mm", "20mm", "40mm"].map((mat) => (
                <button
                  key={mat}
                  onClick={() => setSelectedMaterialFilter(mat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedMaterialFilter === mat
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {mat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Box className="w-5 h-5 mr-2 text-emerald-600" /> Cement, Aggregates & Raw Materials Daily Register
              </h2>
              <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                {filteredDailyLogs.length} Logged Entries
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Material Name</th>
                    <th className="py-3.5 px-4">UOM</th>
                    <th className="py-3.5 px-4 text-right">Opening Stock</th>
                    <th className="py-3.5 px-4 text-right">Received Qty</th>
                    <th className="py-3.5 px-4">Supplier / Vendor</th>
                    <th className="py-3.5 px-4">Vehicle No</th>
                    <th className="py-3.5 px-4 text-right">Consumed Qty</th>
                    <th className="py-3.5 px-4">Purpose / Structural Element</th>
                    <th className="py-3.5 px-4 text-right">Closing Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {filteredDailyLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{log.date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{log.material}</td>
                      <td className="py-3.5 px-4 text-slate-500">{log.unit}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">{log.opening.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">{log.received.toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{log.supplier}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{log.vehicle_no}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">{log.consumed.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-slate-700">{log.purpose}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{log.closing.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Gate Pass & Waybills */}
      {activeTab === "waybills" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-emerald-600" /> Gate Pass & Vehicle Transport Waybills
              </h2>
              <p className="text-xs text-slate-500">
                Verified delivery receipts, vehicle numbers, weighbridge net weights & gate entry logs.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              {filteredWaybills.length} Verified Vehicles
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4">Sl</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Vehicle Number</th>
                  <th className="py-3.5 px-4">Supplier / Transporter</th>
                  <th className="py-3.5 px-4">Material Description</th>
                  <th className="py-3.5 px-4 text-right">Received Qty (Mt)</th>
                  <th className="py-3.5 px-4">Challan & Gate Remarks</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredWaybills.map((w) => (
                  <tr key={w.sl_no} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500">{w.sl_no}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{w.date}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded inline-block my-2">{w.vehicle_no}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{w.supplier_name}</td>
                    <td className="py-3.5 px-4 text-slate-700">{w.material_type}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">{w.received_qty_mt.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-slate-500">{w.remarks}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3 mr-1 text-emerald-600" /> {w.verification_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Audit & Multi-Format Exports */}
      {activeTab === "export" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Enterprise PDF Verification Certificate</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Official Third-Party Inspection Certificate with embedded QR code, watermark, audit seals, and multi-diameter rebar reconciliation ledger.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setShowPdfModal(true)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center justify-center"
              >
                <Eye className="w-4 h-4 mr-2 text-emerald-400" /> Live View PDF Report
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" /> Download PDF File
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">16-Sheet Site Excel Workbook</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Complete Excel workbook structured exactly like the site Daily Report of Materials (ABSTRACT, Cement, Sand, Dust, Aggregates, 8mm-25mm Steel sheets).
              </p>
            </div>
            <button
              onClick={() => handleExport("excel")}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" /> Download Excel (.xlsx)
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Word (.docx) Executive Audit Document</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Editable Word document suitable for client presentation, containing executive summary, theoretical variance tables, and signature sign-offs.
              </p>
            </div>
            <button
              onClick={() => handleExport("docx")}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" /> Download Word (.docx)
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* View Item Detail Inspection Modal */}
      {selectedViewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Item Verification Details: {selectedViewItem.boqItem || selectedViewItem.item_code}</h3>
                  <p className="text-xs text-slate-400">Third Party Inspection Certificate Record</p>
                </div>
              </div>
              <button aria-label="Close" title="Close"
                onClick={() => setSelectedViewItem(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-800">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="font-bold text-slate-900 text-sm">{selectedViewItem.description}</div>
                <div className="text-slate-600 flex items-center space-x-4">
                  <span>BOQ Code: <strong className="font-mono text-emerald-700">{selectedViewItem.boqItem || selectedViewItem.item_code}</strong></span>
                  <span>UOM: <strong className="text-slate-900">{selectedViewItem.unit}</strong></span>
                  <span>Unit Rate: <strong className="text-slate-900 font-mono">₹{selectedViewItem.unitRate || selectedViewItem.unit_rate}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1">
                  <div className="text-slate-500 font-semibold">Claimed Quantity:</div>
                  <div className="text-lg font-bold text-slate-900 font-mono">{(selectedViewItem.claimedQty || selectedViewItem.total_consumed)?.toLocaleString()} {selectedViewItem.unit}</div>
                  <div className="text-slate-600">Claimed Amount: <strong className="font-mono text-slate-800">₹{(selectedViewItem.claimedAmount || selectedViewItem.claimed_amount)?.toLocaleString("en-IN")}</strong></div>
                </div>

                <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50/50 space-y-1">
                  <div className="text-emerald-700 font-semibold">TPI Verified Quantity:</div>
                  <div className="text-lg font-bold text-emerald-700 font-mono">{(selectedViewItem.verifiedQty || selectedViewItem.theoretical_consumed)?.toLocaleString()} {selectedViewItem.unit}</div>
                  <div className="text-emerald-800">Recommended Payable: <strong className="font-mono">₹{(selectedViewItem.recommendedAmount || selectedViewItem.verified_payable_amount)?.toLocaleString("en-IN")}</strong></div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white">
                <div className="font-bold text-slate-900 border-b pb-1">Additional Audit Parameters (27-Column Record):</div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>GFC Dwg Ref: <strong className="text-slate-800 font-mono">{selectedViewItem.drawingRef || "GIL/GAG/CIV-001"}</strong></div>
                  <div>RA Bill Ref: <strong className="text-slate-800 font-mono">{selectedViewItem.raBillNo || "RA-004"}</strong></div>
                  <div>Contract Clause: <strong className="text-slate-800">{selectedViewItem.governanceClause || "Clause 12.3"}</strong></div>
                  <div>Concealed Work: <strong className="text-slate-800">{selectedViewItem.isConcealedWork || "N"}</strong></div>
                  <div>TPI Remarks: <strong className="text-slate-800">{selectedViewItem.remarks || selectedViewItem.engineerRemarks || "Verified"}</strong></div>
                  <div>Audit Status: <strong className="text-emerald-700 font-bold">{selectedViewItem.closureStatus || "Approved"}</strong></div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => handleSingleItemPdf(selectedViewItem)}
                className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow transition-colors"
              >
                <Download className="w-4 h-4 mr-2" /> Download Item PDF Certificate
              </button>
              <button
                onClick={() => setSelectedViewItem(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Audit Modal */}
      {selectedEditItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Edit Bill Item Verification: {selectedEditItem.boqItem || selectedEditItem.item_code}</h3>
                  <p className="text-xs text-slate-400">Modify TPI Verified Quantity, Rate & Remarks</p>
                </div>
              </div>
              <button aria-label="Close" title="Close"
                onClick={() => setSelectedEditItem(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 font-medium">
                Item: <strong>{selectedEditItem.description}</strong> ({selectedEditItem.unit})
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="cbv-contractor-claimed-qty" className="font-bold text-slate-700">Contractor Claimed Qty:</label>
                  <input id="cbv-contractor-claimed-qty"
                    type="number"
                    value={selectedEditItem.claimedQty || selectedEditItem.total_consumed || 0}
                    onChange={(e) => setSelectedEditItem({ ...selectedEditItem, claimedQty: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="cbv-tpi-verified-qty" className="font-bold text-emerald-700">TPI Verified Qty:</label>
                  <input id="cbv-tpi-verified-qty"
                    type="number"
                    value={selectedEditItem.verifiedQty || selectedEditItem.theoretical_consumed || 0}
                    onChange={(e) => setSelectedEditItem({ ...selectedEditItem, verifiedQty: Number(e.target.value) })}
                    className="w-full p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl font-mono text-emerald-900 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="cbv-unit-rate-inr" className="font-bold text-slate-700">Unit Rate (INR ₹):</label>
                  <input id="cbv-unit-rate-inr"
                    type="number"
                    value={selectedEditItem.unitRate || selectedEditItem.unit_rate || 0}
                    onChange={(e) => setSelectedEditItem({ ...selectedEditItem, unitRate: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="cbv-verification-closure-status" className="font-bold text-slate-700">Verification Closure Status:</label>
                  <select id="cbv-verification-closure-status"
                    value={selectedEditItem.closureStatus || selectedEditItem.verification_status || "Verified & Approved"}
                    onChange={(e) => setSelectedEditItem({ ...selectedEditItem, closureStatus: e.target.value, verification_status: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="Verified & Approved">Verified & Approved</option>
                    <option value="Discrepancy Flagged">Discrepancy Flagged</option>
                    <option value="Partially Verified / Pending Evidence">Partially Verified / Pending Evidence</option>
                    <option value="Rejected / Non-Conforming">Rejected / Non-Conforming</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="cbv-tpi-inspection-remarks" className="font-bold text-slate-700">TPI Inspection Remarks:</label>
                <textarea id="cbv-tpi-inspection-remarks"
                  rows={3}
                  value={selectedEditItem.remarks || selectedEditItem.engineerRemarks || ""}
                  onChange={(e) => setSelectedEditItem({ ...selectedEditItem, remarks: e.target.value, engineerRemarks: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedEditItem(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditItem}
                className="flex items-center px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                <Save className="w-4 h-4 mr-2" /> Save Audit Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-heading">
                    Add New Construction Supply Item
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">27-Column Precision Ledger</p>
                </div>
              </div>
              <button aria-label="Close" title="Close"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cbv-boq-item-code" className="font-bold text-slate-700 uppercase text-[11px]">BOQ Item Code</label>
                    <input id="cbv-boq-item-code"
                      type="text"
                      placeholder="e.g. BOQ-CIV-101"
                      value={newItem.boqItem}
                      onChange={(e) => setNewItem({ ...newItem, boqItem: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="cbv-unit-of-measure" className="font-bold text-slate-700 uppercase text-[11px]">Unit of Measure</label>
                    <select id="cbv-unit-of-measure"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    >
                      <option value="Cum">Cum</option>
                      <option value="Mt">Mt</option>
                      <option value="Bags">Bags</option>
                      <option value="Sqm">Sqm</option>
                      <option value="Nos">Nos</option>
                      <option value="Rmt">Rmt</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="cbv-work-item-description" className="font-bold text-slate-700 uppercase text-[11px]">Work Item Description *</label>
                  <input id="cbv-work-item-description"
                    type="text"
                    required
                    placeholder="e.g. M 25 Grade Reinforced Concrete Beams & Slabs"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="cbv-contract-qty" className="font-bold text-slate-700 uppercase text-[11px]">Contract Qty</label>
                    <input id="cbv-contract-qty"
                      type="number"
                      min={0}
                      value={newItem.contractQty}
                      onChange={(e) => setNewItem({ ...newItem, contractQty: Number(e.target.value) || 0 })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor="cbv-claimed-qty" className="font-bold text-slate-700 uppercase text-[11px]">Claimed Qty</label>
                    <input id="cbv-claimed-qty"
                      type="number"
                      min={0}
                      value={newItem.claimedQty}
                      onChange={(e) => setNewItem({ ...newItem, claimedQty: Number(e.target.value) || 0 })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="cbv-verified-qty" className="font-bold text-emerald-800 uppercase text-[11px]">Verified Qty</label>
                    <input id="cbv-verified-qty"
                      type="number"
                      min={0}
                      value={newItem.verifiedQty}
                      onChange={(e) => setNewItem({ ...newItem, verifiedQty: Number(e.target.value) || 0 })}
                      className="w-full mt-1 p-2 bg-emerald-50 border border-emerald-300 rounded-xl font-mono font-bold text-emerald-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cbv-unit-rate" className="font-bold text-slate-700 uppercase text-[11px]">Unit Rate (₹)</label>
                    <input id="cbv-unit-rate"
                      type="number"
                      min={0}
                      value={newItem.unitRate}
                      onChange={(e) => setNewItem({ ...newItem, unitRate: Number(e.target.value) || 0 })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor="cbv-tpi-verification-remarks" className="font-bold text-slate-700 uppercase text-[11px]">TPI Verification Remarks</label>
                    <input id="cbv-tpi-verification-remarks"
                      type="text"
                      placeholder="e.g. Joint site physical survey completed"
                      value={newItem.remarks}
                      onChange={(e) => setNewItem({ ...newItem, remarks: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4 text-sky-300" />
                  <span>Add Line Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standardized Live PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        title="Construction Bill Verification Certificate & Ledger"
        reportNo="SITE-MUDIGONDA-01"
        formCode="F-BILL-01"
        pdfUrl={`${API_BASE}/api/v1/construction-bill-verification/export/pdf`}
        payload={{
          report_no: "SITE-MUDIGONDA-01",
          date: new Date().toISOString().split("T")[0],
          customer: "State Health Medical Infrastructure Corp / MCGM",
          project: "Civil & Infrastructure Construction - Package A",
          epc_contractor: "Suguna Metals & Civil Contractors Ltd.",
          po_no: "PO-MCGM-2026-891",
          ra_bill_no: "RA-CBV-2026-004",
          inspector: "Er. Ramesh V (Chief Resident Engineer)",
          discipline: "Civil & Structural Engineering",
          items: (abstractData?.items || []).slice(0, 100).map((m: any, idx: number) => ({
            sl: idx + 1,
            boq_item: m.item_code || m.boqItem || `CBV-${idx + 1}`,
            drawing_ref: m.drawingRef,
            description: m.description,
            unit: m.unit,
            scope_qty: m.contractQty,
            claimed_qty: m.claimedQty,
            verified_qty: m.verifiedQty,
            diff_qty: m.diffQty,
            claimed_amt: m.claimedAmount,
            verified_amt: m.recommendedAmount,
            status: m.actionRequired || "Verified & Approved",
          })),
          total_claimed_amt: (abstractData?.items || []).reduce((acc: number, m: any) => acc + (m.claimedAmount || 0), 0),
          total_verified_amt: (abstractData?.items || []).reduce((acc: number, m: any) => acc + (m.recommendedAmount || 0), 0),
        }}
      />
    </div>
  );
}
