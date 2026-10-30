"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Download,
  Eye,
  Sliders,
  Sparkles,
  ChevronRight,
  BookOpen,
  ArrowRight,
  AlertCircle,
  X,
} from "@/components/icons";

interface SOPItem {
  id: string;
  code: string;
  title: string;
  category: "Inspection" | "Governance" | "Mobilization" | "Review";
  sla: string;
  rev: string;
  effectiveDate: string;
  summary: string;
  steps: string[];
}

const SOPS: SOPItem[] = [
  {
    id: "sop-01",
    code: "SOP-IQE-01",
    title: "TPI Call Request & Acknowledgment Protocol",
    category: "Inspection",
    sla: "< 4 Hours",
    rev: "Rev 4.1",
    effectiveDate: "2024-01-15",
    summary: "Receipt of Request for Inspection (RFI) from client/vendor, document readiness verification, job allocation, and formal acknowledgment within 4 hours.",
    steps: [
      "Receive RFI with approved PO, QAP, and drawing revisions.",
      "Check vendor readiness declaration and material physical availability.",
      "Log control number and issue formal email acknowledgment within 4 hours.",
      "Assign certified Level-II / Lead Inspector matching competency matrix."
    ]
  },
  {
    id: "sop-02",
    code: "SOP-IQE-02",
    title: "Inspector Deputation & Global Mobilization",
    category: "Mobilization",
    sla: "24h PAN India / 1 Wk Global",
    rev: "Rev 3.0",
    effectiveDate: "2024-03-01",
    summary: "Mobilization protocol for deploying qualified inspection engineers to vendor works, fabrication yards, and construction project sites.",
    steps: [
      "Review client site safety induction and PPE requirements.",
      "Issue Official Deputation Order (ODO) with authorized scope.",
      "Mobilize within 24 hours across PAN-India or 1 week for overseas sites.",
      "Conduct opening meeting with Manufacturer QA Head upon arrival."
    ]
  },
  {
    id: "sop-03",
    code: "SOP-IQE-03",
    title: "TPI Process Flow & Stage-wise Quality Audit",
    category: "Inspection",
    sla: "Stage-wise (Hold/Witness)",
    rev: "Rev 5.0 (IQE-PFC-03)",
    effectiveDate: "2024-05-10",
    summary: "Standard 8-stage TPI process flow: Document Review, Raw Material, In-process, Final Dimension, NDT Witness, Hydro/Pneumatic, Painting, and Release.",
    steps: [
      "Witness physical testing per approved ITP hold and witness points.",
      "Verify calibration validity of all measuring instruments and gauges.",
      "Capture date-stamped and geotagged photographic evidence.",
      "Sign daily logsheet jointly with Manufacturer and Contractor."
    ]
  },
  {
    id: "sop-04",
    code: "SOP-IQE-04",
    title: "Non-Conformance (NCR) & Quarantine Governance",
    category: "Governance",
    sla: "Immediate / < 12 Hours",
    rev: "Rev 2.2",
    effectiveDate: "2024-02-20",
    summary: "Identification, physical quarantine tagging, root cause analysis (RCA), and disposition approval for out-of-spec materials.",
    steps: [
      "Tag non-conforming items with physical Red Hold Sticker.",
      "Draft formal NCR with photographic proof and specification deviation.",
      "Transmit NCR to client and vendor within 12 hours.",
      "Review Corrective and Preventive Action (CAPA) before close-out."
    ]
  },
  {
    id: "sop-05",
    code: "SOP-IQE-05",
    title: "Technical Manager (TM) Review & Dispatch",
    category: "Review",
    sla: "< 24 Hours",
    rev: "Rev 4.0",
    effectiveDate: "2024-06-01",
    summary: "Independent peer review by authorized Technical Manager, QR code sealing, and electronic dispatch of final Inspection Release Note (IRN).",
    steps: [
      "Inspectors submit field draft report within 12 hours of visit.",
      "Technical Manager performs technical consistency and BOQ check.",
      "Affix cryptographic QR code and digital seal to inspection certificate.",
      "Transmit final signed PDF to client and manufacturer within 24 hours."
    ]
  },
  {
    id: "sop-06",
    code: "SOP-IQE-06",
    title: "Calibration & Instrument Traceability SOP",
    category: "Governance",
    sla: "Quarterly Audit",
    rev: "Rev 2.0",
    effectiveDate: "2024-04-12",
    summary: "Verification that all ultrasonic thickness gauges, DFM gauges, pressure test gauges, and temperature probes maintain NABL traceable calibration.",
    steps: [
      "Inspect master calibration certificate before starting inspection.",
      "Check calibration seal integrity and expiration date.",
      "Record gauge serial number on official inspection logsheet.",
      "Reject any inspection conducted with uncalibrated tools."
    ]
  },
];

export default function SOPSPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSOP, setSelectedSOP] = useState<SOPItem | null>(null);

  const filteredSOPs = SOPS.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#001a2c] via-[#002b48] to-[#001a2c] border border-sky-800/40 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Standard Operating Procedures (SOP) &bull; TPI Quality Standards
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading text-white">
              SOP&apos;s &bull; Standard Operating Procedures
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
              Controlled standard operating procedures governing the entire lifecycle of inspection calls, mobilization, field execution, and technical sign-offs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/tpi-process-flow"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0084bf] to-[#e35f14] text-white text-xs font-bold shadow-md glow-iqe-blue transition-all flex items-center gap-2"
            >
              <Sliders className="w-4 h-4" />
              <span>Live TPI Process Flow (PFC-03)</span>
            </Link>
          </div>
        </div>

        {/* Sub-module Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/60">
          <Link
            href="/pms-formats"
            className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-3 hover:bg-slate-800/80 transition-all"
          >
            <BookOpen className="w-5 h-5 text-sky-400" />
            <div>
              <div className="text-xs font-bold text-white">Formats</div>
              <div className="text-[11px] text-slate-400">Audit &amp; Formats</div>
            </div>
          </Link>
          <Link
            href="/sops"
            className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center gap-3 hover:bg-emerald-500/30 transition-all"
          >
            <FileText className="w-5 h-5 text-emerald-300" />
            <div>
              <div className="text-xs font-bold text-white">SOP&apos;s</div>
              <div className="text-[11px] text-emerald-200">Active SOP Library</div>
            </div>
          </Link>
          <Link
            href="/work-instructions"
            className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-3 hover:bg-slate-800/80 transition-all"
          >
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs font-bold text-white">Work Instructions</div>
              <div className="text-[11px] text-slate-400">Technical Protocols</div>
            </div>
          </Link>
          <Link
            href="/itps"
            className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-3 hover:bg-slate-800/80 transition-all"
          >
            <Sliders className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-xs font-bold text-white">ITP&apos;s</div>
              <div className="text-[11px] text-slate-400">Quality Plans</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            aria-label="Search"
            placeholder="Search SOP title, code, or SLA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0084bf]"
          />
        </div>
        <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
          Showing {filteredSOPs.length} Controlled Procedures
        </div>
      </div>

      {/* SOPs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSOPs.map((sop) => (
          <div
            key={sop.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-extrabold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {sop.code}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {sop.rev}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                {sop.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {sop.summary}
              </p>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#e35f14]" />
                  <span>Mandatory SLA:</span>
                  <span className="text-slate-700 dark:text-slate-200 font-extrabold normal-case ml-1">{sop.sla}</span>
                </div>
                <div className="space-y-1">
                  {sop.steps.slice(0, 2).map((st, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="truncate">{st}</span>
                    </div>
                  ))}
                  {sop.steps.length > 2 && (
                    <div className="text-[11px] text-sky-600 dark:text-sky-400 font-bold pl-4">
                      + {sop.steps.length - 2} more procedural steps
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setSelectedSOP(sop)}
                className="py-2 px-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 text-[#0084bf] dark:text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Procedure</span>
              </button>
              <span className="text-[11px] font-mono text-slate-400">{sop.effectiveDate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal View for Selected SOP */}
      {selectedSOP && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedSOP.code} &bull; {selectedSOP.rev}</span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading mt-1">{selectedSOP.title}</h2>
              </div>
              <button aria-label="Close"
                onClick={() => setSelectedSOP(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-bold text-[#0084bf]">Scope &amp; Objective:</span> {selectedSOP.summary}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                Procedural Execution Flow (Step-by-Step)
              </h4>
              <div className="space-y-2">
                {selectedSOP.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 dark:text-slate-200 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Mandatory Turnaround SLA: <strong className="text-[#e35f14]">{selectedSOP.sla}</strong>
              </div>
              <button
                onClick={() => setSelectedSOP(null)}
                className="px-5 py-2 rounded-xl bg-[#0084bf] hover:bg-[#00618e] text-white text-xs font-bold transition-colors"
              >
                Close Procedure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
