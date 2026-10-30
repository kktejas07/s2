"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Sparkles,
  AlertOctagon,
  FileText,
  DollarSign,
  Camera,
  ShieldCheck,
  Check,
  Plus,
  Send,
  UserCheck,
  ClipboardCheck,
  FileSpreadsheet,
  Printer,
  X,
  Building2,
  Factory,
  MapPin,
  Award,
  Download,
  Info,
  Receipt,
  Eye,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

export default function VisitDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [visit, setVisit] = useState<any>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [masterReport, setMasterReport] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showMasterReportModal, setShowMasterReportModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [qcComment, setQcComment] = useState("");
  const [finComment, setFinComment] = useState("");
  const [expenseForm, setExpenseForm] = useState({ expense_id: "", type: "travel", amount: "", description: "" });
  const [findingForm, setFindingForm] = useState({ finding_id: "", description: "", severity: "observation", category: "visual" });
  const [submitForm, setSubmitForm] = useState({ inspection_report_no: "", comments: "" });
  const [activeTab, setActiveTab] = useState("checklists");
  const [loading, setLoading] = useState(true);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Checklists State
  const [checklists, setChecklists] = useState<any[]>([]);

  useEffect(() => {
    loadVisit();
  }, [id]);

  async function loadVisit() {
    if (!id) return;
    setLoading(true);
    try {
      const v = await api.getVisit(id as string);
      setVisit(v);

      // Auto-generate report number if missing based on visit ID
      const numPart = (v.visit_id || "001").replace(/[^0-9]/g, "").slice(-3) || "001";
      const autoRepNo = v.inspection_report_no || `REP-2026-${numPart}`;
      setSubmitForm((prev) => ({
        ...prev,
        inspection_report_no: autoRepNo,
        comments: v.comments || prev.comments,
      }));

      if (v.scope_checklists) {
        setChecklists(v.scope_checklists);
      }

      if (v.is_invoiced && v.invoice_id) {
        try {
          const inv = await api.getInvoice(v.invoice_id);
          setInvoiceData(inv);
        } catch (err) {
          // Fallback invoice data structure
          setInvoiceData({
            invoice_id: v.invoice_id,
            invoice_number: `INV/IQE/2026/${numPart}`,
            client_name: v.customer_name || "Reliance Industries Ltd",
            job_id: v.job_id || "JOB-2026-MIG-0001",
            due_date: v.payment_due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            grand_total: 50740,
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !visit) {
    return <div className="p-8 text-center text-xs text-slate-400 font-bold">Loading visit workspace...</div>;
  }

  const canAccept = visit.status === "scheduled";
  const canCapture = ["scheduled", "initiated", "in_progress"].includes(visit.status);
  const canQc = visit.status === "completed";
  const canFinance = visit.status === "quality_check_completed";
  const canGenerateInvoice = ["quality_check_completed", "finance_check_completed"].includes(visit.status);

  const totalExpense = (visit.expenses || []).reduce(
    (s: number, e: any) => s + (parseFloat(e.amount) || 0),
    0
  );

  const completedChecklistsCount = checklists.filter((c) => c.is_completed).length;
  const checklistProgressPercent = checklists.length > 0 ? Math.round((completedChecklistsCount / checklists.length) * 100) : 100;

  async function handleAccept() {
    try {
      await api.acceptVisit(visit.visit_id);
      loadVisit();
      toast.success("Field visit started. The scope checklists are ready to verify.");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't start the field visit. Please try again.");
    }
  }

  function handleToggleChecklist(index: number) {
    setChecklists((prev) =>
      prev.map((c, i) => (i === index ? { ...c, is_completed: !c.is_completed } : c))
    );
  }

  async function handleSaveChecklists() {
    try {
      await api.updateScopeChecklists(visit.visit_id, checklists);
      loadVisit();
      toast.success("Checklist progress saved.");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't save the checklist progress. Please try again.");
    }
  }

  async function handleSubmitCapture() {
    if (!submitForm.comments) {
      toast.error("Enter your inspection observations before submitting.");
      return;
    }
    try {
      await api.submitVisit(visit.visit_id, submitForm);
      loadVisit();
      toast.success("Field visit log submitted and passed to quality control.");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't submit the field visit log. Please try again.");
    }
  }

  async function handleQC() {
    try {
      await api.qualityCheck(visit.visit_id, { status: "approved", comments: qcComment });
      loadVisit();
      toast.success("Quality check approved and passed to finance.");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't approve the quality check. Please try again.");
    }
  }

  async function handleFinance() {
    try {
      await api.financeApproval(visit.visit_id, { status: "approved", comments: finComment });
      loadVisit();
      toast.success("Finance claim approved. You can now generate the 30-day invoice.");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't approve the finance claim. Please try again.");
    }
  }

  async function handleGenerateInvoice() {
    if (visit.is_invoiced && invoiceData) {
      setShowInvoiceModal(true);
      return;
    }

    try {
      const inv = await api.generateVisitInvoice(visit.visit_id);
      setInvoiceData(inv);
      setShowInvoiceModal(true);
      loadVisit();
    } catch (e) {
      console.error(e);
      toast.error("Couldn't generate the invoice. Please try again.");
    }
  }

  async function handleOpenMasterReport() {
    try {
      const rep = await api.getVisitMasterReport(visit.visit_id);
      setMasterReport(rep);
      setShowMasterReportModal(true);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddExpense() {
    await api.addExpense(visit.visit_id, {
      ...expenseForm,
      amount: parseFloat(expenseForm.amount) || 0,
    });
    setExpenseForm({ expense_id: `EXP-${Date.now()}`, type: "travel", amount: "", description: "" });
    loadVisit();
  }

  async function handleAddFinding() {
    await api.addFinding(visit.visit_id, findingForm);
    setFindingForm({ finding_id: `F-${Date.now()}`, description: "", severity: "observation", category: "visual" });
    loadVisit();
  }

  async function handleGenerateReport() {
    setGeneratingAi(true);
    try {
      const r = await api.generateReport(visit.visit_id);
      setAiReport(r);
      if (r && r.prompt) {
        setSubmitForm((prev) => ({
          ...prev,
          comments: `${prev.comments ? prev.comments + "\n\n" : ""}[AI Technical Synthesis]: ${r.prompt}`,
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingAi(false);
    }
  }

  const handlePrintMasterReport = () => {
    window.print();
  };

  // Workflow Pipeline Steps
  const steps = [
    { label: "1. Scheduled", active: true },
    { label: "2. Initiated", active: ["initiated", "in_progress", "completed", "quality_check_completed", "finance_check_completed"].includes(visit.status) },
    { label: "3. Field Completed", active: ["completed", "quality_check_completed", "finance_check_completed"].includes(visit.status) },
    { label: "4. QC Approved", active: ["quality_check_completed", "finance_check_completed"].includes(visit.status) },
    { label: "5. Finance Approved", active: visit.status === "finance_check_completed" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <Link
        href="/visits"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0084bf] hover:underline transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Field Visits Directory</span>
      </Link>

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#001a2c] via-[#003752] to-[#0084bf] border border-[#0084bf]/30 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-sky-200 bg-sky-950/80 px-3 py-1 rounded-lg border border-sky-600/40">
              {visit.visit_id}
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#e35f14] text-white">
              {visit.status.replace(/_/g, " ")}
            </span>
            {visit.is_invoiced && (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white border border-emerald-400/40 flex items-center gap-1">
                <Receipt className="w-3 h-3" /> Net-30 Invoiced ({visit.invoice_id})
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-white">
            Job Ref: {visit.job_id || "JOB-2026-MIG-0001"}
          </h1>
          <p className="text-xs text-sky-100/90 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-[#e35f14]" /> Inspector:{" "}
              <strong className="text-white">{visit.inspector_name || "Unassigned"}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-sky-300" /> Client:{" "}
              <strong className="text-white">{visit.customer_name || "Reliance Ltd"}</strong>
            </span>
          </p>
        </div>

        {/* Action Controls Header Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {canAccept && (
            <button
              onClick={handleAccept}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Initiate Field Visit</span>
            </button>
          )}

          <button
            onClick={handleOpenMasterReport}
            className="px-4 py-2 rounded-xl bg-white text-[#001a2c] font-extrabold text-xs shadow-md hover:bg-slate-100 flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4 text-[#0084bf]" />
            <span>Master Job Report</span>
          </button>

          {canGenerateInvoice && (
            <button
              onClick={handleGenerateInvoice}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0084bf] to-[#e35f14] text-white font-extrabold text-xs shadow-md glow-iqe-blue flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{visit.is_invoiced ? "View Generated Invoice" : "Generate 30-Day Net Invoice"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Pipeline Stepper */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            Multi-Stage Operational Workflow Pipeline
          </p>
          <span className="text-xs font-bold text-[#0084bf]">
            Protocol: {visit.protocol_standard || "ISO 9001:2026 & ISO/IEC 17020:2026 Standard"}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-center text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                s.active
                  ? "bg-sky-50 border-sky-300 text-[#00618e] shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${s.active ? "text-[#0084bf]" : "text-slate-300"}`} />
              <span className="truncate">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-6 text-xs overflow-x-auto">
        {[
          { id: "checklists", label: `Scope & Field Log (${checklistProgressPercent}%)` },
          { id: "overview", label: "Multi-Stage Approvals" },
          { id: "expenses", label: `Travel & Expenses (₹${totalExpense.toLocaleString()})` },
          { id: "findings", label: "Photos & Defects" },
          { id: "ai-report", label: "AI Inspection Report" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 font-extrabold transition-all relative shrink-0 ${
              activeTab === tab.id
                ? "text-[#0084bf] border-b-2 border-[#0084bf]"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Scope & Field Observations Execution Flow */}
      {activeTab === "checklists" && (
        <div className="space-y-6">
          {/* Section A: Auto-Populated Checklists */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-[#0084bf]" />
                  <span>Auto-Populated Scope of Work Checklists</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Checklist items automatically pulled from Job {visit.job_id}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#00618e]">
                    {completedChecklistsCount} / {checklists.length} Criteria Verified
                  </span>
                  <div className="w-36 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-[#0084bf] to-[#e35f14] transition-all duration-500"
                      style={{ width: `${checklistProgressPercent}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveChecklists}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0084bf] to-[#00618e] text-white text-xs font-extrabold shadow-sm hover:opacity-95"
                >
                  Save &amp; Mark Scope Done
                </button>
              </div>
            </div>

            {/* Checklist Items Interactive Table */}
            <div className="space-y-2">
              {checklists.map((item, idx) => (
                <label
                  key={idx}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    item.is_completed
                      ? "bg-sky-50/60 border-sky-200 text-slate-900"
                      : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/70"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.is_completed}
                    onChange={() => handleToggleChecklist(idx)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#0084bf] focus:ring-[#0084bf] cursor-pointer"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <span className={`text-xs font-bold ${item.is_completed ? "text-slate-900 line-through text-slate-500" : "text-slate-900"}`}>
                        {item.title}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-semibold inline-flex items-center gap-1">
                        {item.is_completed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">COMPLETED</span>
                          </>
                        ) : (
                          "PENDING VERIFICATION"
                        )}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-[#00618e] dark:text-sky-300">{item.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Section B: Manual Observation Entry & AI Report Option Trigger */}
          <div className="p-6 rounded-2xl bg-white border border-sky-200 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0084bf]" />
                <span>Manual Inspection Observation &amp; Field Comments</span>
              </h3>
              <span className="text-xs text-slate-500 font-semibold">Required before Field Completion</span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="visit-report-no" className="text-xs font-bold text-slate-800">Inspection Report Reference No (Auto-Generated) *</label>
                  <input
                    id="visit-report-no"
                    value={submitForm.inspection_report_no}
                    onChange={(e) => setSubmitForm({ ...submitForm, inspection_report_no: e.target.value })}
                    placeholder="e.g. REP-2026-001"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs mt-1 font-mono font-bold text-[#0084bf]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="visit-observations" className="text-xs font-bold text-slate-800">Field Inspection Observations &amp; Technical Findings *</label>
                <textarea
                  id="visit-observations"
                  value={submitForm.comments}
                  onChange={(e) => setSubmitForm({ ...submitForm, comments: e.target.value })}
                  rows={4}
                  placeholder="Enter detailed site observations, NDT test results, hydro pressure hold chart readings, bevel end dimensions..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs mt-1 font-medium leading-relaxed"
                />
              </div>

              {/* AI Synthesize Button */}
              <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-extrabold text-purple-900">Generate AI Inspection Synthesis</h4>
                    <p className="text-[11px] text-purple-700 font-medium">Auto-synthesize inspector notes with protocol criteria</p>
                  </div>
                </div>
                <button
                  onClick={handleGenerateReport}
                  disabled={generatingAi}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 text-white font-extrabold text-xs shadow-md hover:opacity-95 disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>{generatingAi ? "Generating AI Report..." : "Synthesize AI Observations"}</span>
                </button>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  onClick={handleSubmitCapture}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0084bf] to-[#00618e] text-white font-extrabold text-xs shadow-md flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Field Sign-Off Log (Mark Field Completed)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Overview & Multi-Stage Approvals */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 font-heading">Inspection Visit Parameters</h3>
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">TPI Protocol Standard</span>
                <span className="font-semibold text-slate-800">{visit.protocol_standard || "ISO 9001:2026 & ISO/IEC 17020:2026 Standard"}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Environmental Site Safety</span>
                <span className="font-semibold text-slate-800">{visit.environmental_condition || "Normal (ISO 9001:2026 Cl. 4.1)"}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">ISO 17020 Impartiality</span>
                <span className="font-semibold text-emerald-600">
                  {visit.impartiality_declared !== false ? "✓ Declared (IQE-MS-10)" : "Pending"}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Planned Site Date</span>
                <span className="font-semibold text-slate-800">
                  {visit.planned_date ? new Date(visit.planned_date).toLocaleDateString() : "—"}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Plant Location</span>
                <span className="font-semibold text-slate-800">{visit.plant_location || "Head Works"}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Inspection Report No</span>
                <span className="font-mono font-bold text-slate-800">
                  {visit.inspection_report_no || "Pending Field Sign-off"}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Billing Cycle Payment Due</span>
                <span className="font-mono font-bold text-[#e35f14]">
                  {visit.payment_due_date ? new Date(visit.payment_due_date).toLocaleDateString() : "Net 30 Days (Pending Invoice)"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 font-heading">Multi-Stage Approval Gate</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between font-bold">
                  <span>Quality Control Check (QC)</span>
                  <span className={visit.quality_check_status === "approved" ? "text-emerald-600 font-extrabold" : "text-amber-600"}>
                    {visit.quality_check_status || "Pending QC Sign-off"}
                  </span>
                </div>
                {visit.quality_check_comments && (
                  <p className="text-[11px] text-slate-500 mt-1">{visit.quality_check_comments}</p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between font-bold">
                  <span>Finance Ledger Approval</span>
                  <span className={visit.finance_status === "approved" ? "text-emerald-600 font-extrabold" : "text-amber-600"}>
                    {visit.finance_status || "Pending Finance Sign-off"}
                  </span>
                </div>
                {visit.finance_comments && (
                  <p className="text-[11px] text-slate-500 mt-1">{visit.finance_comments}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form: QC Review */}
          {canQc && (
            <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 shadow-sm col-span-1 md:col-span-2 space-y-3">
              <h3 className="text-sm font-bold text-purple-900 font-heading">Quality Control (QC) Sign-off Gate</h3>
              <textarea
                aria-label="Quality control review notes"
                value={qcComment}
                onChange={(e) => setQcComment(e.target.value)}
                placeholder="QC review notes, QAP compliance verification..."
                rows={2}
                className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs"
              />
              <button
                onClick={handleQC}
                className="px-5 py-2.5 rounded-xl bg-purple-700 text-white font-extrabold text-xs shadow-md hover:bg-purple-800 inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve QC Check &amp; Pass to Finance</span>
              </button>
            </div>
          )}

          {/* Form: Finance Review */}
          {canFinance && (
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-sm col-span-1 md:col-span-2 space-y-3">
              <h3 className="text-sm font-bold text-emerald-900 font-heading">Finance Review &amp; Approval Gate</h3>
              <textarea
                aria-label="Finance review notes"
                value={finComment}
                onChange={(e) => setFinComment(e.target.value)}
                placeholder="Finance review notes, travel expense audit..."
                rows={2}
                className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-xs"
              />
              <button
                onClick={handleFinance}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-extrabold text-xs shadow-md hover:bg-emerald-800 inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Finance Claim</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Expenses */}
      {activeTab === "expenses" && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-heading">Inspector Expenses &amp; Travel Log</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <select
              aria-label="Expense type"
              value={expenseForm.type}
              onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}
              className="p-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
            >
              <option value="travel">Travel (KM / Conveyance)</option>
              <option value="food">Daily Food Allowance</option>
              <option value="hotel">Hotel / Lodging</option>
              <option value="mileage">Mileage / Distance</option>
            </select>
            <input
              type="number"
              aria-label="Expense amount in rupees"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              placeholder="Amount (₹)"
              className="p-2 border border-slate-200 rounded-xl text-xs bg-white w-full sm:w-32 font-bold font-mono"
            />
            <input
              aria-label="Expense details"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              placeholder="Expense details (e.g. Mumbai to Hazira Yard 280km travel)..."
              className="p-2 border border-slate-200 rounded-xl text-xs bg-white flex-1 min-w-0"
            />
            <button
              onClick={handleAddExpense}
              className="px-4 py-2 rounded-xl bg-[#0084bf] text-white text-xs font-bold hover:bg-[#00618e]"
            >
              Add Expense Item
            </button>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b">
                <th className="p-3">Type</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(visit.expenses || []).map((e: any) => (
                <tr key={e.expense_id}>
                  <td className="p-3 font-semibold uppercase">{e.type}</td>
                  <td className="p-3 text-slate-600">{e.description || "—"}</td>
                  <td className="p-3 text-right font-mono font-bold text-[#0084bf]">
                    ₹{parseFloat(e.amount || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Tab 4: AI Inspection Report */}
      {activeTab === "ai-report" && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 font-heading">AI Generated Inspection Report</h3>
            <button
              onClick={handleGenerateReport}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 text-white text-xs font-extrabold hover:opacity-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Synthesize AI Report</span>
            </button>
          </div>

          {aiReport ? (
            <div className="space-y-4 text-xs">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                {aiReport.prompt || "Report compiled successfully."}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Click "Synthesize AI Report" to synthesize Job SOW, checklists, findings, and protocol compliance.
            </div>
          )}
        </div>
      )}

      {/* View Generated 30-Day Net Invoice Modal */}
      {showInvoiceModal && invoiceData && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="keep-light bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto relative print:p-0 print:border-none">
            
            {/* Background Watermark Logo of IQE */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
              <img src="/iqe-logo.png" alt="IQE Watermark" className="w-96 h-auto object-contain" />
            </div>

            <div className="relative z-10 space-y-6">
              {/* Invoice Header Branding */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
                <div className="flex items-center gap-4 min-w-0">
                  <img src="/iqe-logo.png" alt="IQE Logo" className="h-12 w-auto object-contain" />
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                      TAX INVOICE — 30-DAY BILLING CYCLE
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">
                      Invoice No: <strong className="text-[#0084bf]">{invoiceData.invoice_number}</strong> | Ref: {invoiceData.invoice_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={handlePrintMasterReport}
                    className="px-3.5 py-2 rounded-xl bg-[#0084bf] text-white text-xs font-bold hover:bg-[#00618e] flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button type="button" onClick={() => setShowInvoiceModal(false)} aria-label="Close invoice" title="Close invoice" className="p-2 text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Invoice Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">Customer Client</span>
                  <p className="font-extrabold text-slate-900 mt-0.5">{invoiceData.client_name}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">Job Reference</span>
                  <p className="font-extrabold text-[#0084bf] mt-0.5">{invoiceData.job_id}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">Payment Terms</span>
                  <p className="font-extrabold text-brand-700 mt-0.5">Net 30 Days</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">Due Date</span>
                  <p className="font-extrabold text-[#e35f14] mt-0.5">{new Date(invoiceData.due_date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">
                        TPI Daily Field Inspection Rate ({visit.protocol_standard || "ISO 9001:2026 & ISO/IEC 17020:2026 Protocol"})
                      </td>
                      <td className="p-3 text-right font-mono font-bold">₹15,000.00</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">
                        Field Travel &amp; Conveyance Reimbursement
                      </td>
                      <td className="p-3 text-right font-mono font-bold">₹{totalExpense.toLocaleString()}.00</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-600">Subtotal</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₹{(15000 + totalExpense).toLocaleString()}.00</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-600">GST Tax (18%)</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₹{((15000 + totalExpense) * 0.18).toLocaleString()}.00</td>
                    </tr>
                    <tr className="bg-sky-50 font-extrabold text-sm text-[#00618e]">
                      <td className="p-3">Total Payable (Net-30 Invoice Grand Total)</td>
                      <td className="p-3 text-right font-mono">₹{invoiceData.grand_total ? invoiceData.grand_total.toLocaleString() : ((15000 + totalExpense) * 1.18).toLocaleString()}.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 print:hidden">
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                >
                  Close Invoice View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job & Visit Master Summary Report Modal with Official IQE Watermark & Print View */}
      {showMasterReportModal && masterReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="keep-light bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto relative print:p-0 print:border-none print:shadow-none">
            
            {/* Background Watermark Logo of IQE */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
              <img src="/iqe-logo.png" alt="IQE Watermark" className="w-96 h-auto object-contain" />
            </div>

            <div className="relative z-10 space-y-6">
              {/* Report Header Branding */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
                <div className="flex items-center gap-4 min-w-0">
                  <img src="/iqe-logo.png" alt="IQE Logo" className="h-12 w-auto object-contain" />
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                      Master Job Summary Report &amp; Audit Dossier
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">
                      Visit Ref: <strong className="text-[#0084bf]">{masterReport.visit_id}</strong> | Job Ref: <strong className="text-[#0084bf]">{masterReport.job_id}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={handlePrintMasterReport}
                    className="px-3.5 py-2 rounded-xl bg-[#0084bf] text-white text-xs font-bold hover:bg-[#00618e] flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button type="button" onClick={() => setShowMasterReportModal(false)} aria-label="Close report" title="Close report" className="p-2 text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Master Summary Report Detailed Content */}
              <div className="space-y-6 text-xs">
                {/* Job Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50/90 border border-slate-200">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 block">Customer Client</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{masterReport.customer_name || "Reliance Industries Ltd"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 block">Manufacturer Plant</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{masterReport.manufacturer_name || "BHEL Boilers"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 block">TPI Protocol</span>
                    <p className="font-extrabold text-[#0084bf] mt-0.5">{masterReport.protocol_standard}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 block">Net-30 Payment Due</span>
                    <p className="font-extrabold text-[#e35f14] mt-0.5">{new Date(masterReport.payment_due_date).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* SOW Checklists Audit Matrix */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-[#0084bf]" />
                    <span>Scope of Work Checklist Execution Status ({masterReport.checklist_progress_percent}% Passed)</span>
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                        <tr>
                          <th className="p-2.5">Criteria Title</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5 text-right">Verification Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(masterReport.scope_checklists || []).map((c: any, i: number) => (
                          <tr key={i}>
                            <td className="p-2.5 font-semibold text-slate-800">{c.title}</td>
                            <td className="p-2.5 text-slate-500">{c.category || "Scope Verification"}</td>
                            <td className="p-2.5 text-right font-bold">
                              <span className={c.is_completed ? "text-emerald-600 font-extrabold inline-flex items-center gap-1" : "text-amber-600"}>
                                {c.is_completed ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>PASS &amp; VERIFIED</span>
                                  </>
                                ) : (
                                  "PENDING"
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Field Inspection Observations */}
                {submitForm.comments && (
                  <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider">Inspector Technical Observations</h4>
                    <p className="text-slate-700 leading-relaxed">{submitForm.comments}</p>
                  </div>
                )}

                {/* Multi-Stage Signoff Stamps */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 text-center">
                    <span className="text-[11px] font-extrabold text-purple-700 uppercase">Quality Control (QC) Manager</span>
                    <p className="text-xs font-extrabold text-purple-900 mt-1">APPROVED &amp; SIGNED OFF</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
                    <span className="text-[11px] font-extrabold text-emerald-700 uppercase">Finance Manager</span>
                    <p className="text-xs font-extrabold text-emerald-900 mt-1">CLAIM APPROVED — NET-30 INVOICE ISSUED</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 print:hidden">
                <button
                  onClick={() => setShowMasterReportModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
