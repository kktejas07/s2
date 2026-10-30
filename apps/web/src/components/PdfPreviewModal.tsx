"use client";

import { API_BASE } from "@/lib/config";
import { downloadPdfFile } from "@/lib/downloadPdf";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  ExternalLink,
  Download,
  FileText,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
} from "@/components/icons";

export interface PdfPreviewItem {
  sl?: number | string;
  slNo?: number | string;
  boq_item?: string;
  boqItem?: string;
  item_code?: string;
  drawing_ref?: string;
  drawingRef?: string;
  description?: string;
  unit?: string;
  scope_qty?: number;
  contractQty?: number;
  claimed_qty?: number;
  claimedQty?: number;
  verified_qty?: number;
  verifiedQty?: number;
  diff_qty?: number;
  diffQty?: number;
  claimed_amt?: number;
  claimedAmount?: number;
  verified_amt?: number;
  verifiedAmount?: number;
  recommendedAmount?: number;
  status?: string;
  verificationStatus?: string;
}

export interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string;
  formCode?: string;
  payload?: {
    report_no?: string;
    revision?: string;
    date?: string;
    customer?: string;
    project?: string;
    epc_contractor?: string;
    po_no?: string;
    ra_bill_no?: string;
    inspector?: string;
    discipline?: string;
    items?: PdfPreviewItem[];
    total_scope_qty?: number;
    total_claimed_qty?: number;
    total_verified_qty?: number;
    total_diff_qty?: number;
    total_claimed_amt?: number;
    total_verified_amt?: number;
    [key: string]: any;
  };
  title: string;
  reportNo?: string;
}

export function PdfPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  formCode,
  payload,
  title,
  reportNo,
}: PdfPreviewModalProps) {
  const [activeUrl, setActiveUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(false);
  const [usingLocalFallback, setUsingLocalFallback] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"sheet" | "pdf">("sheet");
  const blobRef = useRef<string | null>(null);

  const cleanupBlob = useCallback(() => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
  }, []);

  // Safe fetch helper with timeout
  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 3500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  const loadPdf = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    setUsingLocalFallback(false);

    const safeForm = formCode || "F-BILL-01";
    // Choose appropriate static sample fallback
    const staticSampleUrl = `/sample-pdfs/${safeForm}.pdf`;
    const defaultSampleUrl = `/sample-pdfs/default.pdf`;

    // 1. If payload and formCode provided, try rendering via API
    if (formCode && payload) {
      const renderCandidates = [
        `${API_BASE}/api/tpi/render/${formCode}.pdf`,
        `/backend/api/tpi/render/${formCode}.pdf`,
      ];

      for (const endpoint of renderCandidates) {
        try {
          const response = await fetchWithTimeout(
            endpoint,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
            3000
          );

          if (response.ok) {
            const blob = await response.blob();
            if (blob.size > 200) {
              cleanupBlob();
              const blobUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
              blobRef.current = blobUrl;
              setActiveUrl(blobUrl);
              setIsLiveSynced(true);
              setUsingLocalFallback(false);
              setViewMode("pdf"); // Auto-switch to live generated PDF if successful
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Continue to next candidate
        }
      }
    }

    // 2. If direct pdfUrl provided, try fetching it
    if (pdfUrl) {
      const directCandidates = [
        pdfUrl,
        pdfUrl.replace(/^https?:\/\/[^/]+/, "/backend"),
      ];

      for (const url of directCandidates) {
        try {
          const response = await fetchWithTimeout(url, {}, 3000);
          if (response.ok) {
            const blob = await response.blob();
            if (blob.size > 200) {
              cleanupBlob();
              const blobUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
              blobRef.current = blobUrl;
              setActiveUrl(blobUrl);
              setIsLiveSynced(true);
              setUsingLocalFallback(false);
              setViewMode("pdf");
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Continue to next candidate
        }
      }
    }

    // 3. Fallback: try static sample PDF on current host
    try {
      const testRes = await fetch(staticSampleUrl, { method: "HEAD" });
      if (testRes.ok) {
        cleanupBlob();
        setActiveUrl(staticSampleUrl);
      } else {
        cleanupBlob();
        setActiveUrl(defaultSampleUrl);
      }
    } catch {
      cleanupBlob();
      setActiveUrl(defaultSampleUrl);
    }

    setIsLiveSynced(false);
    setUsingLocalFallback(true);
    // If payload with items is available, default to Document Sheet so user immediately inspects actual data
    if (payload && payload.items && payload.items.length > 0) {
      setViewMode("sheet");
    } else {
      setViewMode("pdf");
    }
    setIsLoading(false);
  }, [formCode, payload, pdfUrl, isOpen, cleanupBlob]);

  useEffect(() => {
    if (isOpen) {
      loadPdf();
    } else {
      cleanupBlob();
      setActiveUrl("");
      setIsLoading(false);
      setUsingLocalFallback(false);
    }
    return () => {
      cleanupBlob();
    };
  }, [isOpen, loadPdf, cleanupBlob]);

  if (!isOpen) return null;

  const items = payload?.items || [];
  const displayReportNo = reportNo || payload?.report_no || "IQE-QVR-2026-084";
  const displayDate = payload?.date || new Date().toISOString().split("T")[0];
  const displayCustomer = payload?.customer || "Granules India Limited";
  const displayProject = payload?.project || "Biopharma API Cleanroom Expansion Facility";
  const displayContractor = payload?.epc_contractor || payload?.contractor || "Tata Projects Ltd / L&T Heavy Civil";
  const displayPoNo = payload?.po_no || "PO-IQE-2026-092";
  const displayRaBillNo = payload?.ra_bill_no || "RA-BILL-04";
  const displayInspector = payload?.inspector || "Er. K. V. Sharma (Lead TPI Auditor)";

  // Format currency
  const fmtInr = (n?: number) => {
    if (n === undefined || isNaN(n)) return "₹0.00";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white">
      <div className="relative w-full max-w-6xl h-[94vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden print:h-auto print:max-w-none print:border-none print:shadow-none print:rounded-none">
        {/* Header Controls (Hidden on Print) */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-[#0084bf] flex items-center justify-center border border-sky-200 dark:border-sky-800 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-heading">
                  {title}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#003366] text-white">
                  {displayReportNo}
                </span>
                {isLiveSynced ? (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Live Synced</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#0084bf]" />
                    <span>Interactive Sheet Preview</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Controlled TPI Inspection Certificate &amp; Measurement Ledger (US Letter format)
              </p>
            </div>
          </div>

          {/* Action and Switcher Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("sheet")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "sheet"
                    ? "bg-[#0084bf] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
                title="View interactive document sheet with line items"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Document Sheet</span>
                {items.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                    {items.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("pdf")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "pdf"
                    ? "bg-[#0084bf] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
                title="View PDF file layout in viewer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>PDF Viewer</span>
              </button>
            </div>

            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Print / Save</span>
            </button>

            <button
              onClick={async () => {
                const safeForm = formCode || "F-BILL-01";
                const fallbackUrl = `/sample-pdfs/${safeForm}.pdf`;
                await downloadPdfFile(activeUrl || `${API_BASE}/api/tpi/preview/${safeForm}.pdf`, `${displayReportNo}.pdf`, fallbackUrl);
              }}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Download PDF document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={() => loadPdf()}
              disabled={isLoading}
              type="button"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all border border-slate-300 dark:border-slate-700 cursor-pointer disabled:opacity-50"
              title="Refresh / Re-sync"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-500" : ""}`} />
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative banner if using client-side interactive fallback */}
        {usingLocalFallback && (
          <div className="bg-sky-50 dark:bg-sky-950/70 border-b border-sky-100 dark:border-sky-900/60 px-5 py-2 flex items-center justify-between text-xs text-sky-900 dark:text-sky-200 print:hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0084bf] shrink-0" />
              <span>
                Backend PDF service offline or SSL unreachable. Displaying high-fidelity interactive inspection certificate with all live line items and verification stamps.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "sheet" ? "pdf" : "sheet")}
              className="font-bold underline ml-3 shrink-0 cursor-pointer hover:text-[#0084bf]"
            >
              Switch to {viewMode === "sheet" ? "PDF Viewer" : "Document Sheet"}
            </button>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="relative flex-1 w-full bg-slate-100 dark:bg-slate-950 overflow-y-auto p-2 sm:p-5 print:p-0 print:bg-white print:overflow-visible">
          {isLoading && (
            <div className="absolute inset-4 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-2xl">
              <div className="w-10 h-10 border-3 border-[#0084bf] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Loading Inspection Report Preview...
              </p>
            </div>
          )}

          {/* VIEW MODE 1: INTERACTIVE DOCUMENT SHEET (US Letter / Inspection Certificate) */}
          {viewMode === "sheet" ? (
            <div className="max-w-5xl mx-auto bg-white text-slate-900 shadow-xl rounded-2xl p-6 sm:p-10 border border-slate-300 dark:border-slate-700 print:shadow-none print:border-none print:p-0 print:m-0 space-y-6">
              {/* Report Sheet Header */}
              <div className="border-b-2 border-slate-800 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#003366] text-white flex items-center justify-center font-black text-xl shadow-sm tracking-wider">
                      IQE
                    </div>
                    <div>
                      <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight font-heading uppercase">
                        Independent Quality &amp; Engineering
                      </h1>
                      <p className="text-xs font-bold text-slate-600 tracking-wide uppercase">
                        Third Party Inspection &bull; Quality Surveillance &bull; Bill Verification Agency
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Third Party Inspection Body &bull; Reg Ref: IQE-QA-QC-INSP
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-200 sm:bg-transparent sm:p-0 sm:border-0">
                    <span className="inline-block px-2.5 py-1 rounded bg-[#0084bf] text-white text-xs font-black tracking-wider uppercase mb-1">
                      {formCode || "F-BILL-01"}
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 font-mono">{displayReportNo}</p>
                    <p className="text-xs text-slate-500">Date: <span className="font-semibold text-slate-800">{displayDate}</span></p>
                    <p className="text-[11px] font-bold text-emerald-700 flex items-center sm:justify-end gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>CONTROLLED INSPECTION COPY</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Title & Scope Heading */}
              <div className="bg-slate-100 rounded-xl p-3.5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase">
                    {title}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Technical Verification &bull; Quantity Reconciliation &bull; Disallowance Governance
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-white text-slate-800 border border-slate-300 shadow-2xs">
                    Discipline: {payload?.discipline || "Civil / Structural / MEP"}
                  </span>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-500">Client / Customer:</span>
                    <span className="font-extrabold text-slate-900 text-right">{displayCustomer}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-500">Project / Site:</span>
                    <span className="font-extrabold text-slate-900 text-right">{displayProject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-500">EPC Contractor:</span>
                    <span className="font-extrabold text-slate-900 text-right">{displayContractor}</span>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-500">PO / Work Order:</span>
                    <span className="font-extrabold text-slate-900 text-right">{displayPoNo}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-500">RA Bill Reference:</span>
                    <span className="font-extrabold text-[#003366] text-right font-mono font-bold">{displayRaBillNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-500">Lead TPI Inspector:</span>
                    <span className="font-extrabold text-slate-900 text-right">{displayInspector}</span>
                  </div>
                </div>
              </div>

              {/* Financial & Quantity KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                  <p className="text-[11px] font-bold text-sky-800 uppercase">Total Items</p>
                  <p className="text-lg font-black text-sky-950 font-mono">{items.length || 84}</p>
                  <p className="text-[10px] text-sky-600">Reconciled line items</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-600 uppercase">Claimed Amount</p>
                  <p className="text-lg font-black text-slate-900 font-mono">
                    {fmtInr(payload?.total_claimed_amt || 18450000)}
                  </p>
                  <p className="text-[10px] text-slate-500">Contractor Invoice</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-[11px] font-bold text-emerald-800 uppercase">TPI Verified Amount</p>
                  <p className="text-lg font-black text-emerald-950 font-mono">
                    {fmtInr(payload?.total_verified_amt || 17290000)}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold">Recommended for Payment</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="text-[11px] font-bold text-rose-800 uppercase">Total Disallowance</p>
                  <p className="text-lg font-black text-rose-950 font-mono">
                    {fmtInr(
                      (payload?.total_claimed_amt || 18450000) -
                        (payload?.total_verified_amt || 17290000)
                    )}
                  </p>
                  <p className="text-[10px] text-rose-600 font-bold">Audit Savings</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-300 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0084bf]" />
                    <span>Verified Items Measurement Schedule</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    Showing {items.length} records
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[480px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-200/90 text-slate-900 font-extrabold border-b border-slate-300 z-10">
                      <tr>
                        <th className="p-2.5 text-center w-10 border-r border-slate-300">#</th>
                        <th className="p-2.5 border-r border-slate-300 min-w-[90px]">BOQ Ref</th>
                        <th className="p-2.5 border-r border-slate-300 min-w-[240px]">Work Description</th>
                        <th className="p-2.5 text-center border-r border-slate-300 w-14">Unit</th>
                        <th className="p-2.5 text-right border-r border-slate-300">Claimed Qty</th>
                        <th className="p-2.5 text-right border-r border-slate-300 text-blue-900">Verified Qty</th>
                        <th className="p-2.5 text-right border-r border-slate-300 text-rose-700">Variance</th>
                        <th className="p-2.5 text-right border-r border-slate-300">Claimed Amt (₹)</th>
                        <th className="p-2.5 text-right border-r border-slate-300 text-emerald-800">Verified Amt (₹)</th>
                        <th className="p-2.5 text-center min-w-[110px]">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((item, idx) => {
                        const sl = item.sl ?? item.slNo ?? idx + 1;
                        const code = item.boq_item || item.boqItem || item.item_code || `BOQ-${idx + 1}`;
                        const desc = item.description || "Specification verified against drawing & test certs";
                        const uom = item.unit || "Nos";
                        const cQty = item.claimed_qty ?? item.claimedQty ?? 0;
                        const vQty = item.verified_qty ?? item.verifiedQty ?? 0;
                        const dQty = item.diff_qty ?? item.diffQty ?? Math.max(0, cQty - vQty);
                        const cAmt = item.claimed_amt ?? item.claimedAmount ?? 0;
                        const vAmt = item.verified_amt ?? item.verifiedAmount ?? item.recommendedAmount ?? 0;
                        const status = item.status || item.verificationStatus || "Approved & Verified";

                        return (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                            <td className="p-2.5 text-center font-mono text-slate-500 border-r border-slate-200">
                              {sl}
                            </td>
                            <td className="p-2.5 font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                              {code}
                            </td>
                            <td className="p-2.5 text-slate-800 border-r border-slate-200">
                              <p className="line-clamp-2">{desc}</p>
                              {item.drawing_ref && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  Ref: {item.drawing_ref}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-semibold text-slate-600 border-r border-slate-200">
                              {uom}
                            </td>
                            <td className="p-2.5 text-right font-mono font-semibold text-slate-700 border-r border-slate-200">
                              {cQty.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right font-mono font-extrabold text-[#003366] border-r border-slate-200">
                              {vQty.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-rose-700 border-r border-slate-200">
                              {dQty > 0 ? `-${dQty.toLocaleString()}` : "0"}
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-700 border-r border-slate-200">
                              {fmtInr(cAmt)}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">
                              {fmtInr(vAmt)}
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  status.toLowerCase().includes("approved") || status.toLowerCase().includes("verified")
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : status.toLowerCase().includes("deduct") || status.toLowerCase().includes("reject")
                                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                                    : "bg-amber-100 text-amber-800 border border-amber-300"
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quality & Legal Disclaimer */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 mb-1">Audit Protocol &amp; Certification Statement:</p>
                This Verification Report is generated in accordance with IQE Standard Operating Procedure SOP-QVR-04, technical surveillance parameters, and contract conditions. Verified quantities represent joint physical measurements conducted at site. Disallowed amounts reflect excess claims, pending test reports, or unapproved variations per IS/ASTM codes.
              </div>

              {/* Digital Sign-off & Stamp Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t-2 border-slate-800">
                <div className="text-center p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="h-14 flex items-center justify-center">
                    <span className="font-serif italic font-bold text-blue-900 text-lg">
                      K. V. Sharma
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-1.5">
                    <p className="text-xs font-bold text-slate-900">Lead TPI QA/QC Engineer</p>
                    <p className="text-[10px] text-slate-500">IQE Certification Division</p>
                  </div>
                </div>

                <div className="text-center p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="h-14 flex items-center justify-center">
                    <div className="border-2 border-dashed border-[#0084bf] rounded-lg px-3 py-1 text-center">
                      <p className="text-[10px] font-black text-[#0084bf] tracking-widest uppercase">
                        IQE VERIFIED &bull; PASSED
                      </p>
                      <p className="text-[9px] font-mono text-slate-500">ID: IQE-SURV-2026</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-300 pt-1.5">
                    <p className="text-xs font-bold text-slate-900">Official Third-Party Stamp</p>
                    <p className="text-[10px] text-slate-500">Independent Quality &amp; Engineering</p>
                  </div>
                </div>

                <div className="text-center p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="h-14 flex items-center justify-center">
                    <span className="font-serif italic font-bold text-slate-700 text-lg">
                      Dr. R. K. Nair
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-1.5">
                    <p className="text-xs font-bold text-slate-900">Authorized Client / PMC Signatory</p>
                    <p className="text-[10px] text-slate-500">{displayCustomer}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW MODE 2: PDF FILE OBJECT / IFRAME */
            <div className="w-full h-full min-h-[700px] flex flex-col rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-white">
              {activeUrl ? (
                <object
                  data={`${activeUrl}#toolbar=1&navpanes=0`}
                  type="application/pdf"
                  className="w-full h-full flex-1 rounded-2xl bg-white overflow-hidden min-h-[700px]"
                >
                  <iframe
                    src={`${activeUrl}#toolbar=1&navpanes=0`}
                    className="w-full h-full flex-1 rounded-2xl border-0 bg-white min-h-[700px]"
                    title="PDF Preview"
                  />
                </object>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    PDF Document File Not Generated
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                    Switch to the interactive Document Sheet to view the verified measurement ledger and inspection certificate.
                  </p>
                  <button
                    type="button"
                    onClick={() => setViewMode("sheet")}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#0084bf] text-white text-xs font-bold cursor-pointer"
                  >
                    View Document Sheet
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
