"use client";

import { API_BASE } from "@/lib/config";
import { downloadPdfFile } from "@/lib/downloadPdf";
import { useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  ShieldCheck,
  Pill,
  Search,
  ExternalLink,
  Download,
  Filter,
  CheckCircle2,
  FileText,
  Clock,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
  Compass,
  Eye,
} from "@/components/icons";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";

interface FormatItem {
  id: string;
  code: string;
  title: string;
  category: "Billing" | "Quality" | "Pharma EPC" | "TPI Inspection" | "Expediting";
  description: string;
  href: string;
  rev: string;
  fieldsCount: number;
  badgeColor: string;
  icon: any;
  formCode?: string;
  pdfUrl?: string;
}

const FORMATS: FormatItem[] = [
  {
    id: "f-tp-02",
    code: "IQE-TP-02",
    title: "Flash Inspection Report",
    category: "TPI Inspection",
    description: "Preliminary communication of inspection outcome and key observations issued within 24 hours of inspection visit.",
    href: "/flash-inspection-report",
    rev: "Rev 00",
    fieldsCount: 30,
    badgeColor: "bg-blue-100 text-[#0084bf] dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
    icon: FileText,
    formCode: "TP02",
    pdfUrl: `${API_BASE}/api/tpi/preview/TP02.pdf`,
  },
  {
    id: "f-tp-03",
    code: "IQE-TP-03",
    title: "Inspection Visit Report",
    category: "TPI Inspection",
    description: "Comprehensive formal inspection report recording documents reviewed, activities witnessed, findings, punch points, and instruments.",
    href: "/inspection-visit-report",
    rev: "Rev 00",
    fieldsCount: 45,
    badgeColor: "bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border-brand-200 dark:border-brand-800/40",
    icon: ShieldCheck,
    formCode: "TP03",
    pdfUrl: `${API_BASE}/api/tpi/preview/TP03.pdf`,
  },
  {
    id: "f-tp-04",
    code: "IQE-TP-04",
    title: "Inspection Release Note (IRN)",
    category: "TPI Inspection",
    description: "Formal release authorization of inspected equipment/materials for dispatch, tracking balance quantities and preservation instructions.",
    href: "/inspection-release-note",
    rev: "Rev 00",
    fieldsCount: 38,
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
    icon: CheckCircle2,
    formCode: "TP04",
    pdfUrl: `${API_BASE}/api/tpi/preview/TP04.pdf`,
  },
  {
    id: "f-expediting-05",
    code: "IQE-TP-05",
    title: "Expediting Visit Report",
    category: "Expediting",
    description: "Supplier shop progress, fabrication milestones, raw materials in stock, delivery schedule audit, and vendor action items follow-up.",
    href: "/expediting-visit-report",
    rev: "Rev 00",
    fieldsCount: 42,
    badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800/40",
    icon: Compass,
    formCode: "TP05",
    pdfUrl: `${API_BASE}/api/tpi/preview/TP05.pdf`,
  },
  {
    id: "f-billing-01",
    code: "F-BILL-01",
    title: "Bill Verification (RA Bills & TPI Billing)",
    category: "Billing",
    description: "Line-item contractor bill audit, BOQ quantity reconciliation, over-claim deductions, and Clause 12.3 certificate generation.",
    href: "/tpi-billing",
    rev: "Rev 2.4",
    fieldsCount: 28,
    badgeColor: "bg-sky-100 text-[#0084bf] dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800/40",
    icon: FileSpreadsheet,
    pdfUrl: `${API_BASE}/api/v1/reports/pdf/tpi-billing`,
  },
  {
    id: "f-boq-01",
    code: "F-BOQ-01",
    title: "BOQ Reconciliation (Material & Quantity Audit)",
    category: "Billing",
    description: "Joint physical measurement audit, sanctioned BOQ cap control, theoretical material consumption, and excess wastage recovery.",
    href: "/boq-reconciliation",
    rev: "Rev 2.0",
    fieldsCount: 32,
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800/40",
    icon: Layers,
    pdfUrl: `${API_BASE}/api/v1/reports/pdf/boq-reconciliation`,
  },
  {
    id: "f-quality-01",
    code: "F-QUAL-01",
    title: "Quality Verification (Concealed Work & Quality Audit)",
    category: "Quality",
    description: "Pre-pour concealed works, rebar & MEP layout inspection, QA/QC non-destructive testing, and technical audit sign-offs.",
    href: "/quality-bill-verification",
    rev: "Rev 3.0",
    fieldsCount: 36,
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
    icon: ShieldCheck,
    pdfUrl: `${API_BASE}/api/v1/reports/pdf/quality-bill-verification`,
  },
  {
    id: "f-pharma-01",
    code: "F-01 - F-14",
    title: "Mpharma EPC",
    category: "Pharma EPC",
    description: "Revised 2024 Schedule M cleanroom qualification, HVAC HEPA leak testing, URS traceability, and statutory GMP audit checklist.",
    href: "/schedule-m-pharma-epc",
    rev: "Rev 1.0 (2024)",
    fieldsCount: 200,
    badgeColor: "bg-amber-100 text-[#e35f14] dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
    icon: Pill,
    pdfUrl: `${API_BASE}/api/v1/reports/pdf/schedule-m-pharma-epc`,
  },
];

export default function PMSFormatesHubPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [previewFormat, setPreviewFormat] = useState<FormatItem | null>(null);

  const filteredFormats = FORMATS.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* TOP HEADER CONTAINER (Identical to Bill Verification Format Shell) */}
      <div className="bg-white text-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#003366] dark:text-sky-300 font-heading tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-[#0084bf]" />
              <span>PMS Formats Hub</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#003366] dark:text-sky-300 border border-blue-200 text-[11px] font-bold font-mono">
              TPI Quality Standards
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold font-mono">
              Controlled Quality Dossiers
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/sops"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>SOPs</span>
            </Link>
            <Link
              href="/work-instructions"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Work Instructions</span>
            </Link>
            <Link
              href="/itps"
              className="px-3.5 py-1.5 rounded-xl bg-[#0084bf] hover:bg-[#0073a8] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Quality Plans (ITP)</span>
            </Link>
          </div>
        </div>

        {/* Quick Nav Sub-Modules Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
          <Link
            href="/pms-formats"
            className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center gap-2.5 transition-all text-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-sky-600" />
            <div>
              <div className="font-extrabold text-sky-900">Formats</div>
              <div className="text-[11px] text-sky-700">Active Formats</div>
            </div>
          </Link>
          <Link
            href="/sops"
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 hover:bg-slate-100 transition-all text-xs"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="font-extrabold text-slate-800">SOPs</div>
              <div className="text-[11px] text-slate-400">Standard Operating</div>
            </div>
          </Link>
          <Link
            href="/work-instructions"
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 hover:bg-slate-100 transition-all text-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <div>
              <div className="font-extrabold text-slate-800">Work Instructions</div>
              <div className="text-[11px] text-slate-400">Field Protocols (WI)</div>
            </div>
          </Link>
          <Link
            href="/itps"
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 hover:bg-slate-100 transition-all text-xs"
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <div>
              <div className="font-extrabold text-slate-800">Quality Plans</div>
              <div className="text-[11px] text-slate-400">ITP Hold &amp; Witness Matrix</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            aria-label="Search"
            placeholder="Search formats, code, or clause..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0084bf]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["All", "TPI Inspection", "Billing", "Expediting", "Quality", "Pharma EPC"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-[#0084bf] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Formats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredFormats.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${item.badgeColor}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {item.rev}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-50 dark:bg-sky-950 text-[#0084bf] border border-sky-200 dark:border-sky-800">
                      {item.code}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading group-hover:text-[#0084bf] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {item.fieldsCount} Audit Parameters
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-slate-400">IQE Controlled</span>
                </div>
              </div>

              <div className="mt-6 pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewFormat(item)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs hover:border-[#0084bf]"
                  title={`Live PDF Preview for ${item.code}`}
                >
                  <Eye className="w-3.5 h-3.5 text-[#0084bf]" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (item.pdfUrl) {
                      const fallback = `/sample-pdfs/${item.id === "f-flash-02" ? "TP02.pdf" : item.id === "f-ivr-03" ? "TP03.pdf" : item.id === "f-irn-04" ? "TP04.pdf" : item.id === "f-evr-05" ? "TP05.pdf" : item.id === "f-boq-01" ? "BOQ.pdf" : item.id === "f-bill-01" ? "F-BILL-01.pdf" : item.id === "f-quality-01" ? "FQUAL01.pdf" : "default.pdf"}`;
                      await downloadPdfFile(item.pdfUrl, `${item.code}_Report.pdf`, fallback);
                    }
                  }}
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all cursor-pointer shadow-2xs"
                  title={`Direct Download PDF for ${item.code}`}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <Link
                  href={item.href}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0084bf] to-[#00618e] hover:from-[#00618e] hover:to-[#004b6e] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all group-hover:gap-2.5 text-center"
                >
                  <span>Open Format</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Standardized Live PDF Preview Modal for PMS Formats */}
      {previewFormat && (
        <PdfPreviewModal
          isOpen={!!previewFormat}
          onClose={() => setPreviewFormat(null)}
          title={previewFormat.title}
          reportNo={previewFormat.code}
          formCode={previewFormat.formCode}
          pdfUrl={previewFormat.pdfUrl}
        />
      )}
    </div>
  );
}
