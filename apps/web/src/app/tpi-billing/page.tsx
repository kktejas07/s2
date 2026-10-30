"use client";

import { API_BASE } from "@/lib/config";
import { useState, useMemo, useEffect } from "react";
import { trackButtonClick, trackPageView } from "@/lib/analytics";
import { downloadPdfFile } from "@/lib/downloadPdf";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";
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
  Upload,
  History,
  FileSignature,
  ShieldAlert,
  Columns,
  Lock,
  Unlock,
  Trash2,
  Calculator,
  Bot,
  Paperclip,
  ArrowRight,
  UserCheck,
  RefreshCw,
  FileCheck,
  FilePlus,
  Check,
  SlidersHorizontal,
  Rows,
  FileCheck2,
  FileEdit,
  DollarSign,
  Briefcase,
  Layers3,
  Users,
  Handshake,
  Landmark,
  Loader2,
} from "@/components/icons";

import type { TpiInspectionMode, BillItem, AuditLog } from "./types";
import {
  UNIT_OPTIONS,
  VARIATION_OPTIONS,
  HIDDEN_WORK_OPTIONS,
  MEASUREMENT_TYPE_OPTIONS,
  CLOSURE_STATUS_OPTIONS,
  CLIENT_OPTIONS,
  CLIENT_DETAILS_MAP,
  CLIENT_VENDOR_MAP,
  VENDOR_OPTIONS,
} from "./data";
import { GRANULES_DATA, CLIENT_ITEMS_MAP } from "./sampleData";
import TooltipCell from "./components/TooltipCell";

export default function TPIBillingPage() {
  const [selectedClient, setSelectedClient] = useState<string>("Granules India Limited - Gagillapur");
  const [items, setItems] = useState<BillItem[]>(GRANULES_DATA);
  const [activeTab, setActiveTab] = useState<"ledger" | "ai" | "files" | "deliverables" | "audit" | "concealed">("ledger");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [quickFilter, setQuickFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"horizontal" | "cards">("horizontal");
  const [isInlineEditMode, setIsInlineEditMode] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<"TPI Engineer" | "Super Admin" | "Tenant PM" | "Contractor">("TPI Engineer");
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string>(`${API_BASE}/api/v1/reports/pdf/tpi-billing`);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>("TPI Bill Verification Master Report");
  const [previewReportNo, setPreviewReportNo] = useState<string>("F-BILL-01");

  const [tpiMode, setTpiMode] = useState<TpiInspectionMode>("epc_sponsored");
  const [isSwitchingMode, setIsSwitchingMode] = useState<boolean>(false);

  const handleSwitchMode = (mode: TpiInspectionMode) => {
    if (mode === tpiMode) return;
    setIsSwitchingMode(true);
    setTpiMode(mode);
    setTimeout(() => setIsSwitchingMode(false), 220);
  };

  const initialDetails = CLIENT_DETAILS_MAP["Granules India Limited - Gagillapur"];
  const [selectedVendor, setSelectedVendor] = useState<string>(initialDetails.vendor);
  const [contractRef, setContractRef] = useState<string>(initialDetails.contractRef);
  const [projectName, setProjectName] = useState<string>(initialDetails.projectName);
  const [projectLocation, setProjectLocation] = useState<string>(initialDetails.projectLocation);
  const [poNumber, setPoNumber] = useState<string>(initialDetails.poNumber);
  const [poDate, setPoDate] = useState<string>(initialDetails.poDate);
  const [endClient, setEndClient] = useState<string>(initialDetails.endClient);
  const [epcContractor, setEpcContractor] = useState<string>(initialDetails.epcContractor);
  const [supplierVendor, setSupplierVendor] = useState<string>(initialDetails.supplierVendor);

  const handleClientChange = (client: string) => {
    if (client === selectedClient) return;
    setIsSwitchingMode(true);
    setSelectedClient(client);
    setTimeout(() => setIsSwitchingMode(false), 220);
    const details = CLIENT_DETAILS_MAP[client] || {
      projectName: `${client} Project`,
      projectLocation: "Industrial Site, India",
      vendor: CLIENT_VENDOR_MAP[client]?.[0] || VENDOR_OPTIONS[0],
      contractRef: `CON-${client.slice(0, 4).toUpperCase()}-2025-001`,
      poNumber: `PO-${client.slice(0, 4).toUpperCase()}-2025-9901`,
      poDate: "2025-10-17",
      endClient: `${client} (Asset Owner)`,
      epcContractor: CLIENT_VENDOR_MAP[client]?.[0] || VENDOR_OPTIONS[0],
      supplierVendor: "General Sub-Vendor",
    };
    setSelectedVendor(details.vendor);
    setProjectName(details.projectName);
    setProjectLocation(details.projectLocation);
    setContractRef(details.contractRef);
    setPoNumber(details.poNumber);
    setPoDate(details.poDate);
    setEndClient(details.endClient);
    setEpcContractor(details.epcContractor);
    setSupplierVendor(details.supplierVendor);

    const newItems = CLIENT_ITEMS_MAP[client] || [];
    setItems(newItems);
  };

  const [editingItem, setEditingItem] = useState<BillItem | null>(null);
  const [viewingItemDetail, setViewingItemDetail] = useState<any>(null);
  const [attachmentModalItem, setAttachmentModalItem] = useState<BillItem | null>(null);
  const [newFileName, setNewFileName] = useState<string>("");
  const [newFileCategory, setNewFileCategory] = useState<string>("Joint Measurement Report");
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<string>("Payment Recommendation Note");
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [dateVersionFilter, setDateVersionFilter] = useState<"ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH">("ALL");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [showSubModuleDropdown, setShowSubModuleDropdown] = useState(false);
  const [selectedSubModule, setSelectedSubModule] = useState<string>("boq_ledger");

  const subModuleLabels: Record<string, string> = {
    boq_ledger: "1. BOQ Measurement Ledger",
    savings_audit: "2. Over-Claim Savings & Variance",
    iso_compliance: "3. Inspection Certificates",
    attachments_docs: "4. Drawings & Document Attachments",
    audit_trail: "5. Audit Trail & History",
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const verifyBoq = urlParams.get("verify_boq");
      if (verifyBoq) {
        const found = items.find((i) => i.boqItem === verifyBoq || i.boqItem.startsWith(verifyBoq));
        if (found) {
          setDetailsItem(found);
          setShowDetailsRowModal(true);
        }
      }
    }
  }, [items]);

  const availableVendorsForClient = useMemo(() => {
    return CLIENT_VENDOR_MAP[selectedClient] || VENDOR_OPTIONS;
  }, [selectedClient]);

  const processedItems = useMemo(() => {
    return items.map((item) => {
      const balanceQty = item.boqQty - item.prevCertifiedQty;
      const diffQty = item.contractorClaimedQty - item.tpiVerifiedQty;
      const claimedAmt = item.contractorClaimedQty * item.unitRate;
      const recommendedAmt = item.tpiVerifiedQty * item.unitRate;
      let status: "Accepted" | "Over Claimed" | "Under Claimed" = "Accepted";
      if (diffQty > 0) status = "Over Claimed";
      else if (diffQty < 0) status = "Under Claimed";

      return {
        ...item,
        balanceQty,
        diffQty,
        claimedAmt,
        recommendedAmt,
        status,
      };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    return processedItems.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACCEPTED" && item.status === "Accepted") ||
        (statusFilter === "OVER_CLAIMED" && item.status === "Over Claimed") ||
        (statusFilter === "UNDER_CLAIMED" && item.status === "Under Claimed");

      let matchesQuick = true;
      if (quickFilter === "OVER_CLAIMED") matchesQuick = item.status === "Over Claimed";
      if (quickFilter === "PENDING_CERT") matchesQuick = item.closureStatus.includes("Pending") || item.closureStatus.includes("Open");
      if (quickFilter === "HIGH_VALUE") matchesQuick = item.claimedAmt >= 10000;
      if (quickFilter === "HIDDEN_WORK") matchesQuick = item.isHiddenWork === "Y";

      const matchesSearch =
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.boqItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.gfcDrawingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendor.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesQuick && matchesSearch;
    });
  }, [processedItems, statusFilter, quickFilter, searchQuery]);

  const totalClaimedAmount = useMemo(() => processedItems.reduce((acc, curr) => acc + curr.claimedAmt, 0), [processedItems]);
  const totalRecommendedAmount = useMemo(() => processedItems.reduce((acc, curr) => acc + curr.recommendedAmt, 0), [processedItems]);
  const totalSavingsVariance = totalClaimedAmount - totalRecommendedAmount;
  const overClaimedCount = processedItems.filter((i) => i.status === "Over Claimed").length;
  const hiddenWorkCount = processedItems.filter((i) => i.isHiddenWork === "Y").length;
  const totalAttachmentsCount = processedItems.reduce((acc, curr) => acc + curr.attachments.length, 0);

  const handleCellChange = (id: number, field: keyof BillItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Modals & Row Management State
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [showEditRowModal, setShowEditRowModal] = useState(false);
  const [showDetailsRowModal, setShowDetailsRowModal] = useState(false);
  const [rowEditingItem, setRowEditingItem] = useState<BillItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<BillItem | null>(null);

  // Form State for Add / Edit Row (All 27 Fields)
  const [rowBoqItem, setRowBoqItem] = useState("1.01"); // Field 1
  const [rowRaBill, setRowRaBill] = useState("RA-001"); // Field 2
  const [rowDate, setRowDate] = useState(new Date().toISOString().split("T")[0]); // Field 3
  const [rowClient, setRowClient] = useState(""); // Field 4
  const [rowVendor, setRowVendor] = useState(VENDOR_OPTIONS[0]); // Field 5
  const [rowDescription, setRowDescription] = useState(""); // Field 6
  const [rowUnit, setRowUnit] = useState("LS"); // Field 7
  const [rowGfcRef, setRowGfcRef] = useState("GFC-REF-001"); // Field 8
  const [rowBoqQty, setRowBoqQty] = useState<number>(100); // Field 9
  const [rowPrevCertifiedQty, setRowPrevCertifiedQty] = useState<number>(0); // Field 10
  const [rowClaimedQty, setRowClaimedQty] = useState<number>(100); // Field 11
  const [rowTpiQty, setRowTpiQty] = useState<number>(95); // Field 12
  const [rowUnitRate, setRowUnitRate] = useState<number>(50000); // Field 14
  const [rowIsVariation, setRowIsVariation] = useState<"Y" | "N">("N"); // Field 18
  const [rowVariationRef, setRowVariationRef] = useState("VO-001"); // Field 19
  const [rowContractClause, setRowContractClause] = useState("Clause 12.3 (Bill Verification & Audit)"); // Field 20
  const [rowIsHiddenWork, setRowIsHiddenWork] = useState<"Y" | "N">("N"); // Field 21
  const [rowMeasurementType, setRowMeasurementType] = useState(MEASUREMENT_TYPE_OPTIONS[0]); // Field 22
  const [rowObservation, setRowObservation] = useState("Joint Physical Verification Completed"); // Field 23
  const [rowActionRequired, setRowActionRequired] = useState("Variance Deducted & Corrected"); // Field 24
  const [rowTargetDate, setRowTargetDate] = useState("2026-12-31"); // Field 25
  const [rowClosureStatus, setRowClosureStatus] = useState<"Closed" | "Open / Pending Correction" | "In Progress" | "Approved for Payment">("Closed"); // Field 26
  const [rowIsLocked, setRowIsLocked] = useState<boolean>(false); // Field 27

  // Live Auto Calculations for Financials & Variance
  const rowDiffQty = useMemo(() => Number(rowClaimedQty || 0) - Number(rowTpiQty || 0), [rowClaimedQty, rowTpiQty]); // Field 13
  const rowClaimedAmt = useMemo(() => Number(rowClaimedQty || 0) * Number(rowUnitRate || 0), [rowClaimedQty, rowUnitRate]); // Field 15
  const rowRecommendedAmt = useMemo(() => Number(rowTpiQty || 0) * Number(rowUnitRate || 0), [rowTpiQty, rowUnitRate]); // Field 16
  const rowSavingsAmt = useMemo(() => rowDiffQty * Number(rowUnitRate || 0), [rowDiffQty, rowUnitRate]); // Field 17

  const handleOpenAddRowModal = () => {
    setRowEditingItem(null);
    const sl = items.length + 1;
    const availableVendors = CLIENT_VENDOR_MAP[selectedClient] || VENDOR_OPTIONS;

    setRowBoqItem(`${sl}.01`); // #1
    setRowRaBill(`RA-${sl.toString().padStart(3, "0")}`); // #2
    setRowDate(new Date().toISOString().split("T")[0]); // #3
    setRowClient(selectedClient); // #4
    setRowVendor(availableVendors[0] || VENDOR_OPTIONS[0]); // #5
    setRowDescription(`[${selectedClient.substring(0, 18)}] TPI Measurement & Bill Verification Item`); // #6
    setRowUnit("LS"); // #7
    setRowGfcRef(`GFC-${selectedClient.substring(0, 3).toUpperCase()}-${sl.toString().padStart(3, "0")}`); // #8
    setRowBoqQty(100); // #9
    setRowPrevCertifiedQty(0); // #10
    setRowClaimedQty(100); // #11
    setRowTpiQty(95); // #12
    setRowUnitRate(50000); // #14
    setRowIsVariation("N"); // #18
    setRowVariationRef(`VO-RA-${sl.toString().padStart(3, "0")}`); // #19
    setRowContractClause("Clause 12.3 (Bill Verification & Audit)"); // #20
    setRowIsHiddenWork("N"); // #21
    setRowMeasurementType(MEASUREMENT_TYPE_OPTIONS[0]); // #22
    setRowObservation("Joint Physical Verification Completed & Audit Recommended"); // #23
    setRowActionRequired("Variance Deducted & Corrected"); // #24
    setRowTargetDate("2026-12-31"); // #25
    setRowClosureStatus("Closed"); // #26
    setRowIsLocked(false); // #27

    setShowAddRowModal(true);
  };

  const handleOpenEditRowModal = (item: BillItem) => {
    setRowEditingItem(item);
    setRowBoqItem(item.boqItem); // #1
    setRowRaBill(item.raBill); // #2
    setRowDate(item.date); // #3
    setRowClient(selectedClient); // #4
    setRowVendor(item.vendor); // #5
    setRowDescription(item.description); // #6
    setRowUnit(item.unit); // #7
    setRowGfcRef(item.gfcDrawingRef); // #8
    setRowBoqQty(item.boqQty); // #9
    setRowPrevCertifiedQty(item.prevCertifiedQty || 0); // #10
    setRowClaimedQty(item.contractorClaimedQty); // #11
    setRowTpiQty(item.tpiVerifiedQty); // #12
    setRowUnitRate(item.unitRate); // #14
    setRowIsVariation(item.isVariation || (item.contractorClaimedQty !== item.tpiVerifiedQty ? "Y" : "N")); // #18
    setRowVariationRef(item.variationRef || `VO-${item.raBill}`); // #19
    setRowContractClause(item.contractClause || "Clause 12.3 (Bill Verification & Audit)"); // #20
    setRowIsHiddenWork(item.isHiddenWork || "N"); // #21
    setRowMeasurementType(item.measurementType || MEASUREMENT_TYPE_OPTIONS[0]); // #22
    setRowObservation(item.observation); // #23
    setRowActionRequired(item.actionRequired || (item.contractorClaimedQty !== item.tpiVerifiedQty ? "Variance Deducted & Corrected" : "Verified & Recommended for Payment")); // #24
    setRowTargetDate(item.targetDate || "2026-12-31"); // #25
    setRowClosureStatus(item.closureStatus); // #26
    setRowIsLocked(!!item.isLocked); // #27

    setShowEditRowModal(true);
  };

  const handleOpenDetailsRowModal = (item: BillItem) => {
    setDetailsItem(item);
    setShowDetailsRowModal(true);
  };

  const handleSaveAddRow = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: BillItem = {
      id: Date.now(),
      slNo: items.length + 1,
      boqItem: rowBoqItem, // #1
      raBill: rowRaBill, // #2
      date: rowDate, // #3
      vendor: rowVendor, // #5
      description: rowDescription, // #6
      unit: rowUnit, // #7
      gfcDrawingRef: rowGfcRef, // #8
      boqQty: Number(rowBoqQty), // #9
      prevCertifiedQty: Number(rowPrevCertifiedQty), // #10
      contractorClaimedQty: Number(rowClaimedQty), // #11
      tpiVerifiedQty: Number(rowTpiQty), // #12
      unitRate: Number(rowUnitRate), // #14
      isVariation: rowIsVariation, // #18
      variationRef: rowVariationRef, // #19
      contractClause: rowContractClause, // #20
      isHiddenWork: rowIsHiddenWork, // #21
      measurementType: rowMeasurementType, // #22
      observation: rowObservation, // #23
      actionRequired: rowActionRequired, // #24
      targetDate: rowTargetDate, // #25
      closureStatus: rowClosureStatus, // #26
      attachments: ["Invoice_Attachment.pdf", "TPI_Verification_Sheet.pdf"],
      isLocked: rowIsLocked, // #27
    };

    setItems((prev) => [newItem, ...prev]);
    setShowAddRowModal(false);
  };

  const handleSaveEditRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rowEditingItem) return;
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === rowEditingItem.id) {
          return {
            ...i,
            boqItem: rowBoqItem,
            raBill: rowRaBill,
            date: rowDate,
            vendor: rowVendor,
            description: rowDescription,
            unit: rowUnit,
            gfcDrawingRef: rowGfcRef,
            boqQty: Number(rowBoqQty),
            prevCertifiedQty: Number(rowPrevCertifiedQty),
            contractorClaimedQty: Number(rowClaimedQty),
            tpiVerifiedQty: Number(rowTpiQty),
            unitRate: Number(rowUnitRate),
            isVariation: rowIsVariation,
            variationRef: rowVariationRef,
            contractClause: rowContractClause,
            isHiddenWork: rowIsHiddenWork,
            measurementType: rowMeasurementType,
            observation: rowObservation,
            actionRequired: rowActionRequired,
            targetDate: rowTargetDate,
            closureStatus: rowClosureStatus,
            isLocked: rowIsLocked,
          };
        }
        return i;
      })
    );
    setShowEditRowModal(false);
  };

  const handleExportSingleRowCSV = (item: BillItem) => {
    const claimedAmt = item.contractorClaimedQty * item.unitRate;
    const recommendedAmt = item.tpiVerifiedQty * item.unitRate;
    const diffQty = item.contractorClaimedQty - item.tpiVerifiedQty;
    const status = diffQty > 0 ? "Over Claimed" : "Verified OK";

    const data = [
      ["BOQ Item", item.boqItem],
      ["RA Bill", item.raBill],
      ["Date", item.date],
      ["Contractor / Vendor", item.vendor],
      ["Description / Invoice", item.description],
      ["Unit", item.unit],
      ["Drawing / Ref", item.gfcDrawingRef],
      ["BOQ Qty", item.boqQty],
      ["Contractor Claimed Qty", item.contractorClaimedQty],
      ["TPI Verified Qty", item.tpiVerifiedQty],
      ["Diff Qty / Variance", diffQty],
      ["Unit Rate (INR)", item.unitRate],
      ["Claimed Amount (INR)", claimedAmt],
      ["Recommended Amount (INR)", recommendedAmt],
      ["Over Claim Savings (INR)", claimedAmt - recommendedAmt],
      ["TPI Engineer Observations", item.observation],
      ["Closure Status", item.closureStatus],
      ["Audit Status", status],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + data.map((e) => `"${e[0]}","${(e[1] + "").replace(/"/g, '""')}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BOQ_Item_${item.boqItem.replace(/\./g, "_")}_Single_Row_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadSingleRowPDF = async (item: BillItem) => {
    trackButtonClick("btn_download_tpi_item_pdf", "pdf_download", `Download BOQ Item ${item.boqItem} PDF Report`, "reports");
    const params = new URLSearchParams({
      boq_item: item.boqItem,
      ra_bill: item.raBill,
      vendor: item.vendor,
      client: selectedClient,
      description: item.description,
      unit: item.unit,
      drawing_ref: item.gfcDrawingRef,
      boq_qty: item.boqQty.toString(),
      claimed_qty: item.contractorClaimedQty.toString(),
      verified_qty: item.tpiVerifiedQty.toString(),
      unit_rate: item.unitRate.toString(),
      observation: item.observation,
      closure_status: item.closureStatus,
      is_locked: item.isLocked ? "true" : "false",
    });
    const url = `${API_BASE}/api/v1/reports/pdf/tpi-billing-item?${params.toString()}`;
    const filename = `BOQ_Item_${item.boqItem.replace(/[^a-zA-Z0-9]/g, "_")}_Certificate.pdf`;
    const success = await downloadPdfFile(url, filename, "/sample-pdfs/BOQ.pdf");
    if (!success) {
      handlePreviewSingleRowPDF(item);
    }
  };

  const handleExportMasterPDF = async () => {
    setIsExportingPdf(true);
    trackButtonClick("btn_download_tpi_all_pdf", "pdf_download", "Download All Items TPI Billing PDF Report", "reports");
    const directUrl = `${API_BASE}/api/v1/reports/pdf/tpi-billing`;
    const fallbackStatic = `/sample-pdfs/F-BILL-01.pdf`;
    const safeClient = selectedClient.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `IQE_TPI_Billing_Master_Report_${safeClient}.pdf`;

    const success = await downloadPdfFile(directUrl, filename, fallbackStatic);
    if (!success) {
      setPreviewPdfUrl(directUrl);
      setPreviewPdfTitle("TPI Bill Verification Master Report");
      setPreviewReportNo("F-BILL-01");
      setShowPdfPreview(true);
    }
    setIsExportingPdf(false);
  };

  const handlePreviewSingleRowPDF = (item: BillItem) => {
    trackButtonClick("btn_preview_tpi_item_pdf", "pdf_preview", `Preview BOQ Item ${item.boqItem} PDF Report`, "reports");
    const params = new URLSearchParams({
      boq_item: item.boqItem,
      ra_bill: item.raBill,
      vendor: item.vendor,
      client: selectedClient,
      description: item.description,
      unit: item.unit,
      drawing_ref: item.gfcDrawingRef,
      boq_qty: item.boqQty.toString(),
      claimed_qty: item.contractorClaimedQty.toString(),
      verified_qty: item.tpiVerifiedQty.toString(),
      unit_rate: item.unitRate.toString(),
      observation: item.observation,
      closure_status: item.closureStatus,
      is_locked: item.isLocked ? "true" : "false",
    });
    setPreviewPdfUrl(`${API_BASE}/api/v1/reports/pdf/tpi-billing-item?${params.toString()}`);
    setPreviewPdfTitle(`BOQ Item ${item.boqItem} Verification Certificate`);
    setPreviewReportNo(item.boqItem);
    setShowPdfPreview(true);
  };

  const handleToggleLockItem = (id: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, isLocked: !item.isLocked };
        }
        return item;
      })
    );
  };

  const handleExportCSV = () => {
    trackButtonClick("btn_export_csv", "csv_export", "Export TPI Billing CSV Data", "reports");
    const headers = [
      "Sl No",
      "RA Bill",
      "Date",
      "Contractor Vendor",
      "BOQ Item",
      "Description",
      "Unit",
      "Drawing Ref",
      "BOQ Qty",
      "Prev Cert Qty",
      "Contractor Claimed Qty",
      "TPI Verified Qty",
      "Diff Qty",
      "Unit Rate (INR)",
      "Claimed Amount (INR)",
      "Recommended Amount (INR)",
      "Observations",
      "Closure Status",
      "Status",
    ];

    const csvRows = processedItems.map((item, idx) => [
      idx + 1,
      item.raBill,
      item.date,
      `"${item.vendor.replace(/"/g, '""')}"`,
      item.boqItem,
      `"${item.description.replace(/"/g, '""')}"`,
      item.unit,
      item.gfcDrawingRef,
      item.boqQty,
      item.prevCertifiedQty,
      item.contractorClaimedQty,
      item.tpiVerifiedQty,
      item.diffQty,
      item.unitRate,
      item.claimedAmt,
      item.recommendedAmt,
      `"${(item.observation || "").replace(/"/g, '""')}"`,
      item.closureStatus,
      item.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TPI_Billing_Verification_Full_${items.length}_Items_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-16">
      <div className="bg-white text-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#003366] dark:text-sky-300 font-heading tracking-tight flex items-center gap-2">
              <span>Bill Verification Platform</span>
            </h1>

            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs min-w-0 max-w-full">
              <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-slate-600 font-extrabold shrink-0">Select Client:</span>
              <select
                aria-label="Select client"
                value={selectedClient}
                onChange={(e) => handleClientChange(e.target.value)}
                className="bg-white text-slate-900 font-extrabold border border-slate-300 rounded-lg text-xs p-1 focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-0 max-w-full"
              >
                {CLIENT_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold max-w-full">
              <span className="px-2 text-slate-500 text-[11px] font-bold flex items-center gap-1">
                <Handshake className="w-3.5 h-3.5 text-brand-500" /> TPI:
              </span>
              {(
                [
                  { id: "epc_sponsored", label: "EPC", icon: Building2, tooltip: "Verification commissioned by EPC Contractor" },
                  { id: "end_client_direct", label: "End Client", icon: Landmark, tooltip: "Verification commissioned directly by Project Owner / End Client" },
                  { id: "tripartite", label: "Tripartite", icon: Handshake, tooltip: "Joint 3-party verification agreement between EPC Contractor, End Client, and TPI (Third Party Inspection)" },
                ] as const
              ).map((m) => {
                const IconComp = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSwitchMode(m.id)}
                    title={m.tooltip}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      tpiMode === m.id
                        ? "bg-[#003366] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5 shrink-0" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSavedSuccess(true);
                setTimeout(() => setSavedSuccess(false), 3000);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition-all shadow-sm cursor-pointer"
              aria-label="Save ledger"
              title="Save ledger"
            >
              <Save className="w-4 h-4 text-sky-400" />
            </button>

            <button
              onClick={handleExportCSV}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm cursor-pointer"
              aria-label="Export ledger as CSV"
              title="Export ledger as CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                trackButtonClick("btn_live_preview_tpi_pdf", "pdf_preview", "Live Preview TPI Billing PDF", "reports");
                setPreviewPdfUrl(`${API_BASE}/api/v1/reports/pdf/tpi-billing`);
                setPreviewPdfTitle("TPI Bill Verification Master Report");
                setPreviewReportNo("F-BILL-01");
                setShowPdfPreview(true);
              }}
              className="px-3 py-2 rounded-xl bg-[#0084bf] hover:bg-[#0073a8] text-white transition-all shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Live PDF Preview of TPI Billing Report"
            >
              <Eye className="w-4 h-4 text-white" />
              <span>Live Preview</span>
            </button>

            <button
              onClick={handleExportMasterPDF}
              disabled={isExportingPdf}
              className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Download Master PDF File"
              aria-label="Download PDF file"
            >
              <FileText className={`w-4 h-4 ${isExportingPdf ? "animate-pulse" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* TPI BILLING LEDGER TRANSITION LOADER */}
      {isSwitchingMode ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs animate-in fade-in duration-200">
          <Loader2 className="w-8 h-8 animate-spin text-[#0084bf]" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono tracking-wide">Loading Billing Ledger...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-brand-600" />
            <span>27-Column Excel Measurement &amp; Bill Verification Ledger ({filteredItems.length} items)</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              aria-label="Search bill items"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor, description, WO..."
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <select
              aria-label="Filter by closure status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              title="Filter by Verification Status"
            >
              <option value="ALL">All Statuses ({items.length})</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="OVER_CLAIMED">Over Claimed</option>
              <option value="UNDER_CLAIMED">Under Claimed</option>
            </select>
            <select
              aria-label="Filter by category"
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              title="Filter by Audit Scope"
            >
              <option value="ALL">All Categories</option>
              <option value="OVER_CLAIMED">Over-Claim Variance</option>
              <option value="PENDING_CERT">Pending Certification</option>
              <option value="HIGH_VALUE">High Value (₹10,000+)</option>
              <option value="HIDDEN_WORK">Concealed / Hidden Works</option>
            </select>
            <button
              onClick={() => setIsInlineEditMode(!isInlineEditMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs cursor-pointer ${
                isInlineEditMode
                  ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-amber-500/20"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              }`}
              title="Toggle Inline Cell Editing Mode"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isInlineEditMode ? "Exit Inline Edit" : "Enable Inline Edit"}</span>
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
              onClick={() => {
                trackButtonClick("btn_live_preview_tpi_table_pdf", "pdf_preview", "Live Preview TPI Billing Ledger PDF", "reports");
                setPreviewPdfUrl(`${API_BASE}/api/v1/reports/pdf/tpi-billing`);
                setPreviewPdfTitle("TPI Bill Verification Master Report");
                setPreviewReportNo("F-BILL-01");
                setShowPdfPreview(true);
              }}
              className="px-3.5 py-1.5 bg-[#0084bf] hover:bg-[#0073a8] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Live PDF Preview of TPI Billing Master Report"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview ({items.length})</span>
            </button>

            <button
              onClick={handleExportMasterPDF}
              disabled={isExportingPdf}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
              title="Export All Items to Master 27-Column PDF Report with IQE Watermark & QR Code"
            >
              <FileText className={`w-3.5 h-3.5 ${isExportingPdf ? "animate-pulse" : ""}`} />
              <span>{isExportingPdf ? "Exporting PDF..." : `Export PDF (${items.length})`}</span>
            </button>
            <button
              onClick={handleOpenAddRowModal}
              className="px-3.5 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add BOQ Item #{items.length + 1}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse min-w-[2500px]">
            <thead className="sticky top-0 bg-slate-100 text-slate-800 font-bold border-b border-slate-300 z-10 select-none shadow-xs">
              <tr>
                <th className="p-3 text-center border-r border-slate-200 w-12">Sl No</th>
                <th className="p-3 border-r border-slate-200">RA Bill</th>
                <th className="p-3 border-r border-slate-200">Date</th>
                <th className="p-3 border-r border-slate-200 min-w-[180px]">Contractor / Vendor</th>
                <th className="p-3 border-r border-slate-200">BOQ Item</th>
                <th className="p-3 border-r border-slate-200 min-w-[260px]">Work Description / Invoice</th>
                <th className="p-3 border-r border-slate-200 text-center">Unit</th>
                <th className="p-3 border-r border-slate-200">Drawing / Ref</th>
                <th className="p-3 border-r border-slate-200 text-right">BOQ Qty</th>
                <th className="p-3 border-r border-slate-200 text-right bg-amber-100 text-amber-900 font-extrabold min-w-[120px]">Claimed Qty / Val (₹)</th>
                <th className="p-3 border-r border-slate-200 text-right bg-emerald-100 text-emerald-900 font-extrabold min-w-[120px]">TPI Verified Qty / Val (₹)</th>
                <th className="p-3 border-r border-slate-200 text-right bg-rose-100 text-rose-900 font-extrabold min-w-[130px]">Amount Diff (₹)</th>
                <th className="p-3 border-r border-slate-200 text-right">Unit Rate (₹)</th>
                <th className="p-3 border-r border-slate-200 text-right bg-amber-100 text-amber-900 font-extrabold">Claimed Amount (₹)</th>
                <th className="p-3 border-r border-slate-200 text-right bg-emerald-100 text-emerald-900 font-extrabold">Recommended Amount (₹)</th>
                <th className="p-3 border-r border-slate-200 min-w-[240px]">TPI Engineer Correction Remarks</th>
                <th className="p-3 border-r border-slate-200 text-center">Closure Status</th>
                <th className="p-3 border-r border-slate-200 text-center">Status</th>
                <th className="p-3 text-center min-w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredItems.map((item, idx) => {
                const isOver = item.status === "Over Claimed";
                const isUnder = item.status === "Under Claimed";
                const amountDiff = item.diffQty * item.unitRate;
                return (
                  <tr key={item.id} className={`hover:bg-brand-50/40 dark:hover:bg-white/5 transition-colors ${isOver ? "bg-rose-50/30 dark:bg-rose-950/30" : isUnder ? "bg-amber-50/30 dark:bg-amber-950/30" : ""}`}>
                    <td className="p-3 text-center font-mono font-bold text-slate-700 bg-slate-50 border-r border-slate-100">#{idx + 1}</td>
                    <td className="p-3 font-mono border-r border-slate-100">
                      {isInlineEditMode && !item.isLocked ? (
                        <input
                          type="text"
                          aria-label={`RA bill for item ${item.boqItem}`}
                          value={item.raBill}
                          onChange={(e) => handleCellChange(item.id, "raBill", e.target.value)}
                          className="w-16 p-1 font-mono text-xs bg-white border border-slate-300 rounded"
                        />
                      ) : (
                        item.raBill
                      )}
                    </td>
                    <td className="p-3 border-r border-slate-100">
                      {isInlineEditMode && !item.isLocked ? (
                        <input
                          type="date"
                          aria-label={`Bill date for item ${item.boqItem}`}
                          value={item.date}
                          onChange={(e) => handleCellChange(item.id, "date", e.target.value)}
                          className="p-1 font-mono text-xs bg-white border border-slate-300 rounded"
                        />
                      ) : (
                        item.date
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 border-r border-slate-100">
                      {isInlineEditMode && !item.isLocked ? (
                        <input
                          type="text"
                          aria-label={`Contractor or vendor for item ${item.boqItem}`}
                          value={item.vendor}
                          onChange={(e) => handleCellChange(item.id, "vendor", e.target.value)}
                          className="w-full min-w-[120px] p-1 text-xs bg-white border border-slate-300 rounded"
                        />
                      ) : (
                        item.vendor
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-brand-600 border-r border-slate-100">
                      {isInlineEditMode && !item.isLocked ? (
                        <input
                          type="text"
                          aria-label={`BOQ item code for item ${item.boqItem}`}
                          value={item.boqItem}
                          onChange={(e) => handleCellChange(item.id, "boqItem", e.target.value)}
                          className="w-24 p-1 font-mono font-bold text-brand-600 bg-white border border-brand-300 rounded text-xs"
                        />
                      ) : (
                        item.boqItem
                      )}
                    </td>
                    <td className="p-3 border-r border-slate-100 font-medium">
                      {isInlineEditMode && !item.isLocked ? (
                        <input
                          type="text"
                          aria-label={`Work description for item ${item.boqItem}`}
                          value={item.description}
                          onChange={(e) => handleCellChange(item.id, "description", e.target.value)}
                          className="w-full min-w-[180px] p-1 text-xs bg-white border border-slate-300 rounded"
                        />
                      ) : (
                        <TooltipCell text={item.description} maxLength={36} />
                      )}
                    </td>
                    <td className="p-3 text-center font-mono border-r border-slate-100">
                      {isInlineEditMode && !item.isLocked ? (
                        <input
                          type="text"
                          aria-label={`Unit for item ${item.boqItem}`}
                          value={item.unit}
                          onChange={(e) => handleCellChange(item.id, "unit", e.target.value)}
                          className="w-14 p-1 text-center font-mono text-xs bg-white border border-slate-300 rounded"
                        />
                      ) : (
                        item.unit
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-600 border-r border-slate-100">
                      {isInlineEditMode && !item.isLocked ? (
                        <input
                          type="text"
                          aria-label={`Drawing reference for item ${item.boqItem}`}
                          value={item.gfcDrawingRef}
                          onChange={(e) => handleCellChange(item.id, "gfcDrawingRef", e.target.value)}
                          className="w-24 p-1 font-mono text-xs bg-white border border-slate-300 rounded"
                        />
                      ) : (
                        item.gfcDrawingRef
                      )}
                    </td>
                    <td className="p-3 text-right font-mono border-r border-slate-100">
                      {isInlineEditMode && !item.isLocked ? (
                        <input
                          type="number"
                          step="any"
                          aria-label={`BOQ quantity for item ${item.boqItem}`}
                          value={item.boqQty}
                          onChange={(e) => handleCellChange(item.id, "boqQty", parseFloat(e.target.value) || 0)}
                          className="w-16 p-1 text-right font-mono text-xs bg-white border border-slate-300 rounded"
                        />
                      ) : (
                        Number(item.boqQty).toFixed(2)
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-amber-800 bg-amber-50/40 dark:bg-amber-950/30 border-r border-slate-100">
                      {isInlineEditMode && !item.isLocked ? (
                        <input
                          type="number"
                          step="any"
                          aria-label={`Contractor claimed quantity for item ${item.boqItem}`}
                          value={item.contractorClaimedQty}
                          onChange={(e) => handleCellChange(item.id, "contractorClaimedQty", parseFloat(e.target.value) || 0)}
                          className="w-20 p-1 text-right font-mono font-bold text-amber-900 bg-white border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                        />
                      ) : (
                        Number(item.contractorClaimedQty).toFixed(2)
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/30 border-r border-slate-100">
                      {isInlineEditMode && !item.isLocked ? (
                        <input
                          type="number"
                          step="any"
                          aria-label={`TPI verified quantity for item ${item.boqItem}`}
                          value={item.tpiVerifiedQty}
                          onChange={(e) => handleCellChange(item.id, "tpiVerifiedQty", parseFloat(e.target.value) || 0)}
                          className="w-20 p-1 text-right font-mono font-bold text-emerald-900 bg-white border border-emerald-400 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                        />
                      ) : (
                        Number(item.tpiVerifiedQty).toFixed(2)
                      )}
                    </td>
                    <td className={`p-3 text-right font-mono font-bold border-r border-slate-100 ${isOver ? "text-rose-600 bg-rose-100/50 dark:bg-rose-950/40" : "text-slate-500"}`}>
                      ₹{amountDiff.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono border-r border-slate-100">
                      {isInlineEditMode && !item.isLocked ? (
                        <input
                          type="number"
                          step="any"
                          aria-label={`Unit rate for item ${item.boqItem}`}
                          value={item.unitRate}
                          onChange={(e) => handleCellChange(item.id, "unitRate", parseFloat(e.target.value) || 0)}
                          className="w-24 p-1 text-right font-mono text-slate-900 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        `₹${Number(item.unitRate).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold border-r border-slate-100">₹{Number(item.claimedAmt).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-3 border-r border-slate-100 text-[11px] leading-tight text-slate-700">
                      {isInlineEditMode && !item.isLocked ? (
                        <input
                          type="text"
                          aria-label={`Observation for item ${item.boqItem}`}
                          value={item.observation}
                          onChange={(e) => handleCellChange(item.id, "observation", e.target.value)}
                          className="w-full min-w-[160px] p-1 text-xs bg-white border border-slate-300 rounded"
                        />
                      ) : (
                        <TooltipCell text={item.observation} maxLength={40} />
                      )}
                    </td>
                    <td className="p-3 text-center border-r border-slate-100">
                      {isInlineEditMode && !item.isLocked ? (
                        <select
                          aria-label={`Closure status for item ${item.boqItem}`}
                          value={item.closureStatus}
                          onChange={(e) => handleCellChange(item.id, "closureStatus", e.target.value)}
                          className="p-1 rounded text-[11px] font-bold bg-white border border-slate-300"
                        >
                          <option value="Open">Open</option>
                          <option value="Closed">Closed</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${item.closureStatus === "Closed" ? "bg-emerald-100 text-emerald-800" : "bg-brand-100 text-brand-800"}`}>
                          {item.closureStatus}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center border-r border-slate-100">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${isOver ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleToggleLockItem(item.id)}
                          aria-label={item.isLocked ? "Unlock row" : "Lock row"}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${item.isLocked ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-slate-100 hover:bg-slate-200 text-slate-500"}`}
                          title={item.isLocked ? "Locked — Click to Unlock Row" : "Unlocked — Click to Lock Row"}
                        >
                          {item.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-700" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />}
                        </button>

                        <button
                          onClick={() => handleOpenDetailsRowModal(item)}
                          aria-label="View row details"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-100 text-slate-700 hover:text-brand-700 transition-colors cursor-pointer"
                          title="View 27-Column Row Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => !item.isLocked && handleOpenEditRowModal(item)}
                          aria-label="Edit row"
                          disabled={item.isLocked}
                          className={`p-1.5 rounded-lg transition-colors ${item.isLocked ? "bg-slate-100 text-slate-300 cursor-not-allowed" : "bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 cursor-pointer"}`}
                          title={item.isLocked ? "Item Locked — Cannot edit verified bill row" : "Edit Row Values"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleExportSingleRowCSV(item)}
                          aria-label="Download row as CSV"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="Download Single Row CSV"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handlePreviewSingleRowPDF(item)}
                          aria-label="Preview row PDF"
                          className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0084bf] transition-colors cursor-pointer border border-sky-200/60"
                          title="Live Preview Single Item PDF Certificate"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDownloadSingleRowPDF(item)}
                          aria-label="Download row PDF"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer border border-rose-200/60"
                          title="Download 27-Column PDF Report with IQE Watermark & Scannable QR Code"
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
      </div>
      )}

      {/* Add New BOQ Item Row Modal (All 27 Columns / Parameters) */}
      {showAddRowModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
                  <FilePlus className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Add New BOQ Item #{items.length + 1}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 font-bold text-[11px]">
                      All 27 Parameter Fields Required
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    Client: <strong className="text-slate-700">{selectedClient}</strong> | Auto Sl No #{items.length + 1}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRowModal(false)}
                aria-label="Close"
                title="Close"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddRow} className="space-y-6 text-xs">
              {/* SECTION 1: Item Identification (#1 to #5) */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h3 className="font-extrabold text-brand-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>1. Basic Identification Parameters (#1 – #5)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Core BOQ &amp; Vendor Identification</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="tpi-add-boq-item" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#1</span>
                      BOQ Item Code *
                    </label>
                    <input
                      id="tpi-add-boq-item"
                      type="text"
                      required
                      value={rowBoqItem}
                      onChange={(e) => setRowBoqItem(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono font-bold text-brand-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                      placeholder="e.g. 85.01"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-add-ra-bill" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#2</span>
                      RA Bill Ref *
                    </label>
                    <input
                      id="tpi-add-ra-bill"
                      type="text"
                      required
                      value={rowRaBill}
                      onChange={(e) => setRowRaBill(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                      placeholder="e.g. RA-085"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-add-date" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#3</span>
                      Bill Date *
                    </label>
                    <input
                      id="tpi-add-date"
                      type="date"
                      required
                      value={rowDate}
                      onChange={(e) => setRowDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="tpi-add-selected-client" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#4</span>
                      Primary Client / Sponsor
                    </label>
                    <input
                      id="tpi-add-selected-client"
                      type="text"
                      readOnly
                      value={selectedClient}
                      className="w-full px-3 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold cursor-not-allowed shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-add-vendor" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#5</span>
                      Contractor / Vendor *
                    </label>
                    <select
                      id="tpi-add-vendor"
                      value={rowVendor}
                      onChange={(e) => setRowVendor(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    >
                      {(CLIENT_VENDOR_MAP[selectedClient] || VENDOR_OPTIONS).map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Description, Drawings & Specifications (#6–#8, #18–#22) */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h3 className="font-extrabold text-brand-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>2. Specifications, Drawings &amp; Contractual Governance (#6–#8, #18–#22)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Drawing &amp; Contract References</span>
                </div>

                <div>
                  <label htmlFor="tpi-add-description" className="block text-slate-800 font-bold mb-1">
                    <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#6</span>
                    Work Description / Invoice Line *
                  </label>
                  <input
                      id="tpi-add-description"
                    type="text"
                    required
                    value={rowDescription}
                    onChange={(e) => setRowDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    placeholder="Provide full description of item or invoice reference"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="tpi-add-unit" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#7</span>
                      Unit of Measurement (UOM)
                    </label>
                    <select
                      id="tpi-add-unit"
                      value={rowUnit}
                      onChange={(e) => setRowUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="tpi-add-gfc-ref" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#8</span>
                      GFC Drawing / Ref *
                    </label>
                    <input
                      id="tpi-add-gfc-ref"
                      type="text"
                      required
                      value={rowGfcRef}
                      onChange={(e) => setRowGfcRef(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-add-is-variation" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#18</span>
                      Variation Order Flag (Y/N)
                    </label>
                    <select
                      id="tpi-add-is-variation"
                      value={rowIsVariation}
                      onChange={(e) => setRowIsVariation(e.target.value as "Y" | "N")}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    >
                      {VARIATION_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="tpi-add-variation-ref" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#19</span>
                      Variation Order Ref Number
                    </label>
                    <input
                      id="tpi-add-variation-ref"
                      type="text"
                      value={rowVariationRef}
                      onChange={(e) => setRowVariationRef(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-add-contract-clause" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#20</span>
                      Contract Governance Clause
                    </label>
                    <input
                      id="tpi-add-contract-clause"
                      type="text"
                      value={rowContractClause}
                      onChange={(e) => setRowContractClause(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-add-is-hidden-work" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#21</span>
                      Is Concealed / Hidden Work
                    </label>
                    <select
                      id="tpi-add-is-hidden-work"
                      value={rowIsHiddenWork}
                      onChange={(e) => setRowIsHiddenWork(e.target.value as "Y" | "N")}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    >
                      {HIDDEN_WORK_OPTIONS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="tpi-add-measurement-type" className="block text-slate-800 font-bold mb-1">
                    <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#22</span>
                    Measurement Protocol Type
                  </label>
                  <select
                      id="tpi-add-measurement-type"
                    value={rowMeasurementType}
                    onChange={(e) => setRowMeasurementType(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                  >
                    {MEASUREMENT_TYPE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION 3: Quantities, Rates & Financials (#9–#17) */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h3 className="font-extrabold text-brand-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>3. Quantities, Unit Rates &amp; Live Financial Audit (#9–#17)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Automatic Amount &amp; Variance Recalculations</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label htmlFor="tpi-add-boq-qty" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#9</span>
                      Contract BOQ Qty
                    </label>
                    <input
                      id="tpi-add-boq-qty"
                      type="number"
                      step="any"
                      value={rowBoqQty}
                      onChange={(e) => setRowBoqQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-add-prev-certified-qty" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#10</span>
                      Prev Certified Qty
                    </label>
                    <input
                      id="tpi-add-prev-certified-qty"
                      type="number"
                      step="any"
                      value={rowPrevCertifiedQty}
                      onChange={(e) => setRowPrevCertifiedQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-add-claimed-qty" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-mono text-[11px] mr-1">#11</span>
                      Contractor Claimed Qty *
                    </label>
                    <input
                      id="tpi-add-claimed-qty"
                      type="number"
                      step="any"
                      required
                      value={rowClaimedQty}
                      onChange={(e) => setRowClaimedQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-amber-50 text-amber-950 border border-amber-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:bg-amber-50 shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-add-tpi-qty" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-mono text-[11px] mr-1">#12</span>
                      TPI Verified Qty *
                    </label>
                    <input
                      id="tpi-add-tpi-qty"
                      type="number"
                      step="any"
                      required
                      value={rowTpiQty}
                      onChange={(e) => setRowTpiQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-emerald-50 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 font-mono text-[11px] mr-1">#13</span>
                      Variance Qty (Diff = Billed - Verified)
                    </label>
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 flex items-center justify-between">
                      <span>{rowDiffQty.toFixed(2)} {rowUnit}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-sans uppercase font-extrabold ${rowDiffQty > 0 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {rowDiffQty > 0 ? "Over Claimed" : "Verified OK"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="tpi-add-unit-rate" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#14</span>
                      Unit Rate (₹) *
                    </label>
                    <input
                      id="tpi-add-unit-rate"
                      type="number"
                      required
                      value={rowUnitRate}
                      onChange={(e) => setRowUnitRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono font-bold text-brand-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    />
                  </div>
                </div>

                {/* Live Auto Calculations Display (#15, #16, #17) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl">
                    <span className="text-[11px] uppercase font-bold text-amber-900 block">
                      #15 Claimed Amount (INR ₹)
                    </span>
                    <p className="text-base font-extrabold font-mono text-amber-950 mt-0.5">
                      ₹{rowClaimedAmt.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl">
                    <span className="text-[11px] uppercase font-bold text-emerald-900 block">
                      #16 TPI Recommended Amount (INR ₹)
                    </span>
                    <p className="text-base font-extrabold font-mono text-emerald-950 mt-0.5">
                      ₹{rowRecommendedAmt.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl">
                    <span className="text-[11px] uppercase font-bold text-rose-900 block">
                      #17 Over-Claim Savings Variance (INR ₹)
                    </span>
                    <p className="text-base font-extrabold font-mono text-rose-950 mt-0.5">
                      ₹{rowSavingsAmt.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Remarks, Actions & Lock Security (#23–#27) */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h3 className="font-extrabold text-brand-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>4. Audit Remarks, Action Summary &amp; Security Lock (#23–#27)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Verification &amp; Final Certification</span>
                </div>

                <div>
                  <label htmlFor="tpi-add-observation" className="block text-slate-800 font-bold mb-1">
                    <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#23</span>
                    TPI Engineer Correction Remarks / Observation *
                  </label>
                  <textarea
                      id="tpi-add-observation"
                    required
                    rows={2}
                    value={rowObservation}
                    onChange={(e) => setRowObservation(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-medium text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    placeholder="Detailed observation notes from physical measurement"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="tpi-add-action-required" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#24</span>
                      Action Required / Summary
                    </label>
                    <input
                      id="tpi-add-action-required"
                      type="text"
                      value={rowActionRequired}
                      onChange={(e) => setRowActionRequired(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-medium text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-add-target-date" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#25</span>
                      Target Closure Date
                    </label>
                    <input
                      id="tpi-add-target-date"
                      type="date"
                      value={rowTargetDate}
                      onChange={(e) => setRowTargetDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="tpi-add-closure-status" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#26</span>
                      Verification Closure Status
                    </label>
                    <select
                      id="tpi-add-closure-status"
                      value={rowClosureStatus}
                      onChange={(e) => setRowClosureStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white shadow-xs"
                    >
                      {CLOSURE_STATUS_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 font-mono text-[11px] mr-1">#27</span>
                      Lock &amp; Security Audit Status
                    </label>
                    <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={rowIsLocked}
                        onChange={(e) => setRowIsLocked(e.target.checked)}
                        className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                      />
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        {rowIsLocked ? <Lock className="w-4 h-4 text-rose-600" /> : <Unlock className="w-4 h-4 text-emerald-600" />}
                        {rowIsLocked ? "Locked (Certified & Sealed)" : "Unlocked (Draft Record)"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddRowModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-extrabold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>Add New BOQ Item (#{items.length + 1}) &amp; Save All 27 Fields</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit BOQ Item Row Modal (All 27 Columns / Parameters) */}
      {showEditRowModal && rowEditingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Edit BOQ Item #{rowEditingItem.slNo} — {rowEditingItem.boqItem}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                      27-Field Full Audit Form
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    Client: <strong className="text-slate-700">{selectedClient}</strong> | Vendor: <strong className="text-slate-700">{rowEditingItem.vendor}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditRowModal(false)}
                aria-label="Close"
                title="Close"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRow} className="space-y-6 text-xs">
              {/* SECTION 1: Item Identification (#1 to #5) */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h3 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>1. Basic Identification Parameters (#1 – #5)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="tpi-edit-boq-item" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#1</span>
                      BOQ Item Code *
                    </label>
                    <input
                      id="tpi-edit-boq-item"
                      type="text"
                      required
                      value={rowBoqItem}
                      onChange={(e) => setRowBoqItem(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-edit-ra-bill" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#2</span>
                      RA Bill Ref *
                    </label>
                    <input
                      id="tpi-edit-ra-bill"
                      type="text"
                      required
                      value={rowRaBill}
                      onChange={(e) => setRowRaBill(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-edit-date" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#3</span>
                      Bill Date *
                    </label>
                    <input
                      id="tpi-edit-date"
                      type="date"
                      required
                      value={rowDate}
                      onChange={(e) => setRowDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="tpi-edit-selected-client" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#4</span>
                      Primary Client / Sponsor
                    </label>
                    <input
                      id="tpi-edit-selected-client"
                      type="text"
                      readOnly
                      value={selectedClient}
                      className="w-full px-3 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold cursor-not-allowed shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-edit-vendor" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#5</span>
                      Contractor / Vendor *
                    </label>
                    <select
                      id="tpi-edit-vendor"
                      value={rowVendor}
                      onChange={(e) => setRowVendor(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    >
                      {(CLIENT_VENDOR_MAP[selectedClient] || VENDOR_OPTIONS).map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Description, Drawings & Specifications (#6–#8, #18–#22) */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h3 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>2. Specifications, Drawings &amp; Contractual Governance (#6–#8, #18–#22)</span>
                  </h3>
                </div>

                <div>
                  <label htmlFor="tpi-edit-description" className="block text-slate-800 font-bold mb-1">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#6</span>
                    Work Description / Invoice Line *
                  </label>
                  <input
                      id="tpi-edit-description"
                    type="text"
                    required
                    value={rowDescription}
                    onChange={(e) => setRowDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="tpi-edit-unit" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#7</span>
                      Unit of Measurement (UOM)
                    </label>
                    <select
                      id="tpi-edit-unit"
                      value={rowUnit}
                      onChange={(e) => setRowUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="tpi-edit-gfc-ref" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#8</span>
                      GFC Drawing / Ref *
                    </label>
                    <input
                      id="tpi-edit-gfc-ref"
                      type="text"
                      required
                      value={rowGfcRef}
                      onChange={(e) => setRowGfcRef(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-edit-is-variation" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#18</span>
                      Variation Order Flag (Y/N)
                    </label>
                    <select
                      id="tpi-edit-is-variation"
                      value={rowIsVariation}
                      onChange={(e) => setRowIsVariation(e.target.value as "Y" | "N")}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    >
                      {VARIATION_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="tpi-edit-variation-ref" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#19</span>
                      Variation Order Ref Number
                    </label>
                    <input
                      id="tpi-edit-variation-ref"
                      type="text"
                      value={rowVariationRef}
                      onChange={(e) => setRowVariationRef(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-edit-contract-clause" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#20</span>
                      Contract Governance Clause
                    </label>
                    <input
                      id="tpi-edit-contract-clause"
                      type="text"
                      value={rowContractClause}
                      onChange={(e) => setRowContractClause(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-edit-is-hidden-work" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#21</span>
                      Is Concealed / Hidden Work
                    </label>
                    <select
                      id="tpi-edit-is-hidden-work"
                      value={rowIsHiddenWork}
                      onChange={(e) => setRowIsHiddenWork(e.target.value as "Y" | "N")}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    >
                      {HIDDEN_WORK_OPTIONS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="tpi-edit-measurement-type" className="block text-slate-800 font-bold mb-1">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#22</span>
                    Measurement Protocol Type
                  </label>
                  <select
                      id="tpi-edit-measurement-type"
                    value={rowMeasurementType}
                    onChange={(e) => setRowMeasurementType(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                  >
                    {MEASUREMENT_TYPE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION 3: Quantities, Rates & Financials (#9–#17) */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h3 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>3. Quantities, Unit Rates &amp; Live Financial Audit (#9–#17)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label htmlFor="tpi-edit-boq-qty" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#9</span>
                      Contract BOQ Qty
                    </label>
                    <input
                      id="tpi-edit-boq-qty"
                      type="number"
                      step="any"
                      value={rowBoqQty}
                      onChange={(e) => setRowBoqQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-edit-prev-certified-qty" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#10</span>
                      Prev Certified Qty
                    </label>
                    <input
                      id="tpi-edit-prev-certified-qty"
                      type="number"
                      step="any"
                      value={rowPrevCertifiedQty}
                      onChange={(e) => setRowPrevCertifiedQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-edit-claimed-qty" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-mono text-[11px] mr-1">#11</span>
                      Contractor Claimed Qty *
                    </label>
                    <input
                      id="tpi-edit-claimed-qty"
                      type="number"
                      step="any"
                      required
                      value={rowClaimedQty}
                      onChange={(e) => setRowClaimedQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-amber-50 text-amber-950 border border-amber-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:bg-amber-50 shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-edit-tpi-qty" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-mono text-[11px] mr-1">#12</span>
                      TPI Verified Qty *
                    </label>
                    <input
                      id="tpi-edit-tpi-qty"
                      type="number"
                      step="any"
                      required
                      value={rowTpiQty}
                      onChange={(e) => setRowTpiQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-emerald-50 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 font-mono text-[11px] mr-1">#13</span>
                      Variance Qty (Diff = Billed - Verified)
                    </label>
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 flex items-center justify-between">
                      <span>{rowDiffQty.toFixed(2)} {rowUnit}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-sans uppercase font-extrabold ${rowDiffQty > 0 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {rowDiffQty > 0 ? "Over Claimed" : "Verified OK"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="tpi-edit-unit-rate" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#14</span>
                      Unit Rate (₹) *
                    </label>
                    <input
                      id="tpi-edit-unit-rate"
                      type="number"
                      required
                      value={rowUnitRate}
                      onChange={(e) => setRowUnitRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    />
                  </div>
                </div>

                {/* Live Auto Calculations Display (#15, #16, #17) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl">
                    <span className="text-[11px] uppercase font-bold text-amber-900 block">
                      #15 Claimed Amount (INR ₹)
                    </span>
                    <p className="text-base font-extrabold font-mono text-amber-950 mt-0.5">
                      ₹{rowClaimedAmt.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl">
                    <span className="text-[11px] uppercase font-bold text-emerald-900 block">
                      #16 TPI Recommended Amount (INR ₹)
                    </span>
                    <p className="text-base font-extrabold font-mono text-emerald-950 mt-0.5">
                      ₹{rowRecommendedAmt.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl">
                    <span className="text-[11px] uppercase font-bold text-rose-900 block">
                      #17 Over-Claim Savings Variance (INR ₹)
                    </span>
                    <p className="text-base font-extrabold font-mono text-rose-950 mt-0.5">
                      ₹{rowSavingsAmt.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Remarks, Actions & Lock Security (#23–#27) */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h3 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>4. Audit Remarks, Action Summary &amp; Security Lock (#23–#27)</span>
                  </h3>
                </div>

                <div>
                  <label htmlFor="tpi-edit-observation" className="block text-slate-800 font-bold mb-1">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#23</span>
                    TPI Engineer Correction Remarks / Observation *
                  </label>
                  <textarea
                      id="tpi-edit-observation"
                    required
                    rows={2}
                    value={rowObservation}
                    onChange={(e) => setRowObservation(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-medium text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="tpi-edit-action-required" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#24</span>
                      Action Required / Summary
                    </label>
                    <input
                      id="tpi-edit-action-required"
                      type="text"
                      value={rowActionRequired}
                      onChange={(e) => setRowActionRequired(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-medium text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="tpi-edit-target-date" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#25</span>
                      Target Closure Date
                    </label>
                    <input
                      id="tpi-edit-target-date"
                      type="date"
                      value={rowTargetDate}
                      onChange={(e) => setRowTargetDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="tpi-edit-closure-status" className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#26</span>
                      Verification Closure Status
                    </label>
                    <select
                      id="tpi-edit-closure-status"
                      value={rowClosureStatus}
                      onChange={(e) => setRowClosureStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white shadow-xs"
                    >
                      {CLOSURE_STATUS_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] mr-1">#27</span>
                      Lock &amp; Security Audit Status
                    </label>
                    <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={rowIsLocked}
                        onChange={(e) => setRowIsLocked(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        {rowIsLocked ? <Lock className="w-4 h-4 text-rose-600" /> : <Unlock className="w-4 h-4 text-emerald-600" />}
                        {rowIsLocked ? "Locked (Certified & Sealed)" : "Unlocked (Draft Record)"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditRowModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Row Changes (All 27 Fields)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View 27-Column BOQ Item Details Modal */}
      {showDetailsRowModal && detailsItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    27-Column BOQ Item Audit Details — #{detailsItem.slNo} ({detailsItem.boqItem})
                  </h2>
                  <p className="text-xs font-medium text-slate-500">Client: <strong className="text-slate-700">{selectedClient}</strong> | Vendor: <strong className="text-slate-700">{detailsItem.vendor}</strong></p>
                </div>
              </div>
              <button type="button" aria-label="Close" title="Close" onClick={() => setShowDetailsRowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-brand-50/80 dark:bg-brand-950/30 border border-brand-200 rounded-2xl space-y-2">
                <p className="font-extrabold text-slate-900 text-sm">{detailsItem.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-medium">
                  <span><strong className="text-slate-600">#2 RA Bill:</strong> {detailsItem.raBill}</span>
                  <span><strong className="text-slate-600">#3 Date:</strong> {detailsItem.date}</span>
                  <span><strong className="text-slate-600">#8 Drawing Ref:</strong> {detailsItem.gfcDrawingRef}</span>
                </div>
              </div>

              {/* 27 Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500 block">#9 BOQ Contract Qty</span>
                  <p className="font-bold text-slate-900 text-sm font-mono">{detailsItem.boqQty} {detailsItem.unit}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-amber-800 block">#11 Claimed Qty</span>
                  <p className="font-bold text-amber-900 text-sm font-mono">{detailsItem.contractorClaimedQty} {detailsItem.unit}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-emerald-800 block">#12 TPI Verified Qty</span>
                  <p className="font-bold text-emerald-900 text-sm font-mono">{detailsItem.tpiVerifiedQty} {detailsItem.unit}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500 block">#14 Unit Rate (₹)</span>
                  <p className="font-bold text-slate-900 text-sm font-mono">₹{detailsItem.unitRate.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-amber-800 block">#15 Billed Claimed Amount</span>
                  <p className="font-mono font-extrabold text-amber-950">₹{(detailsItem.contractorClaimedQty * detailsItem.unitRate).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-emerald-800 block">#16 TPI Recommended</span>
                  <p className="font-mono font-extrabold text-emerald-950">₹{(detailsItem.tpiVerifiedQty * detailsItem.unitRate).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-rose-800 block">#17 Over-Claim Savings</span>
                  <p className="font-mono font-extrabold text-rose-950">₹{((detailsItem.contractorClaimedQty - detailsItem.tpiVerifiedQty) * detailsItem.unitRate).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500 block">#18 Variation Flag</span>
                  <p className="font-bold text-slate-900">{detailsItem.isVariation || "N"}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500 block">#26 Closure Status</span>
                  <p className="font-bold text-brand-700">{detailsItem.closureStatus}</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-800">#23 TPI Inspection Remarks &amp; Action (#24):</span>
                <p className="text-slate-900 font-medium">{detailsItem.observation}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportSingleRowCSV(detailsItem)}
                  className="px-3.5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Row CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePreviewSingleRowPDF(detailsItem)}
                  className="px-3.5 py-2 text-xs font-bold bg-[#0084bf] hover:bg-[#0073a8] text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Live Preview Item PDF"
                >
                  <Eye className="w-4 h-4" />
                  <span>Live Preview PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadSingleRowPDF(detailsItem)}
                  className="px-3.5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download 27-Field Precision PDF (IQE Logo &amp; QR)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailsRowModal(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standardized Live PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        formCode="FBILL01"
        payload={{
          report_no: previewReportNo || "F-BILL-01",
          date: new Date().toISOString().split("T")[0],
          customer: selectedClient || "MCGM (Greater Mumbai Corp)",
          project: `${projectName || "Mumbai Coastal Road Pkg 03"} - ${projectLocation || "Worli Corridor"}`,
          supplier: epcContractor || selectedVendor || "Larsen & Toubro Ltd - Infra Div",
          contract_ref: contractRef || "MCGM/CWD/2024/TPI-8892",
          ra_bill_no: "RA-001 (Period: Current Cycle)",
          inspector: "Er. Rajesh Sharma (Lead TPI Surveyor)",
          items: items.map((i, idx) => ({
            sl: idx + 1,
            boq_item: i.boqItem,
            description: i.description,
            unit: i.unit,
            scope_qty: i.boqQty,
            claimed_qty: i.contractorClaimedQty,
            verified_qty: i.tpiVerifiedQty,
            diff_qty: Math.max(0, i.contractorClaimedQty - i.tpiVerifiedQty),
            unit_rate: i.unitRate,
            claimed_amt: i.contractorClaimedQty * i.unitRate,
            verified_amt: i.tpiVerifiedQty * i.unitRate,
            status: i.closureStatus || "Verified",
          })),
          total_scope_qty: items.reduce((acc, i) => acc + (i.boqQty || 0), 0),
          total_claimed_qty: items.reduce((acc, i) => acc + (i.contractorClaimedQty || 0), 0),
          total_verified_qty: items.reduce((acc, i) => acc + (i.tpiVerifiedQty || 0), 0),
          total_diff_qty: items.reduce((acc, i) => acc + Math.max(0, (i.contractorClaimedQty || 0) - (i.tpiVerifiedQty || 0)), 0),
          total_claimed_amt: items.reduce((acc, i) => acc + ((i.contractorClaimedQty || 0) * (i.unitRate || 0)), 0),
          total_verified_amt: items.reduce((acc, i) => acc + ((i.tpiVerifiedQty || 0) * (i.unitRate || 0)), 0),
        }}
        pdfUrl={previewPdfUrl}
        title={previewPdfTitle}
        reportNo={previewReportNo}
      />
    </div>
  );
}
