"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  FileText,
  DollarSign,
  ChevronRight,
  Sparkles,
  Plus,
  ArrowLeft,
  SlidersHorizontal,
  CheckSquare,
  AlertCircle,
  Mail,
  Send,
  Download,
} from "@/components/icons";
import { IQELoader } from "@/components/IQELoader";

interface AuditComponent {
  id: string;
  name: string;
  category: string;
  selected: boolean;
}

const AUDIT_COMPONENTS_PRESETS: AuditComponent[] = [
  { id: "comp-1", name: "Joint Dimensional Check & Bevel Inspection", category: "Fabrication", selected: true },
  { id: "comp-2", name: "Hydrostatic Pressure Test Witnessing (ASME Sec VIII)", category: "Pressure Test", selected: true },
  { id: "comp-3", name: "Ultrasonic Thickness & DFT Gauge Verification", category: "NDT & Coating", selected: true },
  { id: "comp-4", name: "Positive Material Identification (PMI) Spectro Test", category: "Metallurgy", selected: false },
  { id: "comp-5", name: "Radiographic Film Interpretation & RT Sign-off", category: "NDT Radiography", selected: true },
  { id: "comp-6", name: "Magnetic Particle Inspection (MPI / Flaw Detection)", category: "NDT Testing", selected: false },
  { id: "comp-7", name: "Transformer Oil DGA & High Voltage Relay Audit", category: "Electrical Substation", selected: false },
  { id: "comp-8", name: "Mill Certificate Audit & Heat Number Traceability", category: "Material Cert", selected: true },
];

export default function ProposedAssignmentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Job Title & Components
  const [jobTitle, setJobTitle] = useState("High Pressure Steam Boiler & Subsea Vessel Audit");
  const [auditType, setAuditType] = useState("Boiler & Pressure Vessel Audit (ASME)");
  const [components, setComponents] = useState<AuditComponent[]>(AUDIT_COMPONENTS_PRESETS);

  // Step 2: Client & Inspector Assignment
  const [clientName, setClientName] = useState("Greenko Wind & Renewable Energy");
  const [inspectorName, setInspectorName] = useState("Er. V. Sharma (NDT Level III)");
  const [clientApprovalState, setClientApprovalState] = useState<"pending" | "approved" | "rejected">("pending");
  const [reassignReason, setReassignReason] = useState("");

  // Step 3: Budget, Rates & Scope
  const [rateType, setRateType] = useState<"manday" | "hourly" | "fixed">("manday");
  const [contractAmount, setContractAmount] = useState("250000");
  const [hourlyRate, setHourlyRate] = useState("3500");
  const [plannedDays, setPlannedDays] = useState("5");
  const [location, setLocation] = useState("HYD - Hyderabad / Kurnool Wind Farm Site");
  const [scopeDetails, setScopeDetails] = useState(
    "Perform 100% joint visual check, hydrotest witness, ultrasonic thickness verification, and DFT coating audit per approved QAP rev 02."
  );

  const toggleComponent = (id: string) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)));
  };

  const handleSimulateClientApproval = (approved: boolean) => {
    if (approved) {
      setClientApprovalState("approved");
    } else {
      setClientApprovalState("rejected");
      setReassignReason("Client requested inspector with specialized Offshore Subsea Certification");
    }
  };

  const handleCompleteAssignment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/jobs");
    }, 800);
  };

  if (loading) {
    return <IQELoader message="Generating Proposed Assignment &amp; Invoice Link..." />;
  }

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003366] dark:text-sky-400 hover:text-blue-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Assignments Directory</span>
          </Link>
          <h1 className="text-xl font-extrabold text-[#003366] dark:text-sky-400 font-heading tracking-tight">
            Proposed New Assignment &amp; Client Approval Workflow
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
            Audit Component Selection • Inspector Assignment • Simulated Client Approval • Budget &amp; Scope Formalization
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#003366] dark:text-sky-300 border border-blue-200 dark:border-blue-800 font-extrabold">
            Status: {clientApprovalState === "approved" ? "APPROVED BY CLIENT" : clientApprovalState === "rejected" ? "REASSIGNMENT REQUIRED" : "PENDING CLIENT APPROVAL"}
          </span>
        </div>
      </div>

      {/* Stepper Navigation Header Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          aria-current={currentStep === 1 ? "step" : undefined}
          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 text-left w-full ${
            currentStep === 1
              ? "bg-[#003366] text-white border-[#003366] shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800"
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold font-mono text-xs ${currentStep === 1 ? "bg-[#ffffff] text-[#003366]" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
            1
          </div>
          <div>
            <h3 className="font-extrabold text-xs">Step 1: Audit &amp; Components</h3>
            <p className="text-[11px] opacity-80 font-medium">Select audit job components</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          aria-current={currentStep === 2 ? "step" : undefined}
          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 text-left w-full ${
            currentStep === 2
              ? "bg-[#003366] text-white border-[#003366] shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800"
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold font-mono text-xs ${currentStep === 2 ? "bg-[#ffffff] text-[#003366]" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
            2
          </div>
          <div>
            <h3 className="font-extrabold text-xs">Step 2: Client Inspector Sign-off</h3>
            <p className="text-[11px] opacity-80 font-medium">Client approval email workflow</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          disabled={clientApprovalState !== "approved"}
          aria-current={currentStep === 3 ? "step" : undefined}
          className={`p-4 rounded-2xl border transition-all flex items-center gap-3 text-left w-full ${
            clientApprovalState !== "approved"
              ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"
              : currentStep === 3
              ? "bg-[#003366] text-white border-[#003366] shadow-md cursor-pointer"
              : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 cursor-pointer"
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold font-mono text-xs ${currentStep === 3 ? "bg-[#ffffff] text-[#003366]" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
            3
          </div>
          <div>
            <h3 className="font-extrabold text-xs">Step 3: Budget &amp; Scope Completion</h3>
            <p className="text-[11px] opacity-80 font-medium">Rate options &amp; contract scope</p>
          </div>
        </button>
      </div>

      {/* STEP 1: AUDIT & TECHNICAL COMPONENTS */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-heading">
              Step 1: Audit Assessment Title &amp; Quality Inspection Components
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">
              Select the audit type preset and check the required quality inspection components for this assignment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="pa-title" className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">Proposed Job Title / Scope *</label>
              <input id="pa-title"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="pa-audit-type" className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">Industry Audit Category</label>
              <select id="pa-audit-type"
                value={auditType}
                onChange={(e) => setAuditType(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 dark:text-slate-100"
              >
                <option value="Boiler & Pressure Vessel Audit (ASME)">Boiler &amp; Pressure Vessel Audit (ASME Sec VIII)</option>
                <option value="Subsea Offshore Pipeline Inspection">Subsea Offshore Pipeline Inspection (API 5L)</option>
                <option value="Wind Turbine & Substation Relay Test">Wind Turbine &amp; Substation Relay Test (IEEE)</option>
                <option value="Chemical Reactor Vessel Quality Check">Chemical Reactor Vessel Quality Check (ISO 9001)</option>
              </select>
            </div>
          </div>

          <div>
            <p id="pa-components-label" className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-2">
              Multi-Select Required Quality Inspection Components (Tick All That Apply)
            </p>
            <div role="group" aria-labelledby="pa-components-label" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {components.map((comp) => (
                <label
                  key={comp.id}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    comp.selected
                      ? "bg-blue-50/80 dark:bg-slate-800 border-[#003366] dark:border-sky-400 ring-1 ring-[#003366]"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={comp.selected}
                    onChange={() => toggleComponent(comp.id)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 block">{comp.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono font-semibold">{comp.category}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 rounded-xl bg-[#003366] hover:bg-[#002855] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <span>Next Step: Inspector &amp; Client Sign-off</span>
              <ChevronRight className="w-4 h-4 text-sky-300" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CLIENT INSPECTOR SIGN-OFF WORKFLOW */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-heading">
              Step 2: Assign Inspector &amp; Send for Client Approval
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">
              Select the client and assigned inspector. The client receives an email approval link to confirm or reject the inspector.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="pa-client" className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">Selected Client / Corporate Partner</label>
              <select id="pa-client"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 dark:text-slate-100"
              >
                <option value="Greenko Wind & Renewable Energy">Greenko Wind &amp; Renewable Energy (Kurnool)</option>
                <option value="Larsen & Toubro Ltd - Heavy Engg">Larsen &amp; Toubro Ltd (Worli / Hazira)</option>
                <option value="MCGM (Greater Mumbai Corp)">MCGM (Greater Mumbai Corp)</option>
                <option value="BHEL Trichy Boilers">BHEL Trichy Boilers</option>
                <option value="Thermax Energy Systems">Thermax Energy Systems</option>
                <option value="Indian Oil Corporation (IOCL)">Indian Oil Corporation (IOCL)</option>
              </select>
            </div>

            <div>
              <label htmlFor="pa-inspector" className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">Assign Lead TPI Inspector *</label>
              <select id="pa-inspector"
                value={inspectorName}
                onChange={(e) => {
                  setInspectorName(e.target.value);
                  setClientApprovalState("pending");
                }}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 dark:text-slate-100"
              >
                <option value="Er. V. Sharma (NDT Level III)">Er. V. Sharma (NDT Level III / Senior Inspector)</option>
                <option value="Er. K. Patel (ASME Specialist)">Er. K. Patel (ASME Sec VIII / Pressure Vessel)</option>
                <option value="Er. V. Swaminathan (Metallurgy)">Er. V. Swaminathan (Metallurgy &amp; Spectro Audit)</option>
                <option value="Er. Rao (High Voltage Specialist)">Er. Rao (High Voltage &amp; Grid Specialist)</option>
              </select>
            </div>
          </div>

          {/* Interactive Client Email Approval Simulation Panel */}
          <div className="p-6 rounded-3xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#003366] text-white text-[11px] font-extrabold uppercase">
                  Simulated Client Approval Portal
                </span>
                <h3 className="font-extrabold text-sm text-[#003366] dark:text-sky-300 mt-1">
                  Client ({clientName}) Inspector Approval Request
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateClientApproval(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate Client Approval</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateClientApproval(false)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Simulate Client Rejection</span>
                </button>
              </div>
            </div>

            {/* Approval Result Status Box */}
            {clientApprovalState === "approved" && (
              <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-extrabold text-sm">Inspector Approved by Client!</p>
                  <p className="text-[11px] opacity-90">
                    {clientName} has digitally verified and accepted {inspectorName}. You can now proceed to Step 3 for budget and scope completion.
                  </p>
                </div>
              </div>
            )}

            {clientApprovalState === "rejected" && (
              <div className="p-4 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-semibold space-y-1">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <p className="font-extrabold text-sm">Inspector Rejected by Client - Reassignment Required</p>
                </div>
                <p className="text-[11px] pl-7">Reason: {reassignReason}</p>
                <p className="text-[11px] pl-7 text-rose-800 font-bold">Please reselect a different inspector above to resubmit for client approval.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              Back to Step 1
            </button>

            <button
              disabled={clientApprovalState !== "approved"}
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 rounded-xl bg-[#003366] hover:bg-[#002855] text-white font-extrabold text-xs shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <span>Next Step: Budget &amp; Scope Completion</span>
              <ChevronRight className="w-4 h-4 text-sky-300" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: BUDGET, RATE & SCOPE COMPLETION */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-heading">
              Step 3: Budget Rates, Scope &amp; Automated Invoice Setup
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">
              Finalize contract amount, hourly/man-day billing options, location, and detailed scope of work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="pa-rate-type" className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">Billing Rate Structure</label>
              <select id="pa-rate-type"
                value={rateType}
                onChange={(e) => setRateType(e.target.value as any)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 dark:text-slate-100"
              >
                <option value="manday">Man-Day Rate Basis (8 Hrs/Shift)</option>
                <option value="hourly">Hourly Rate Basis</option>
                <option value="fixed">Fixed Lump-Sum Package</option>
              </select>
            </div>

            <div>
              <label htmlFor="pa-amount" className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">Total Budget Amount (Rs.)</label>
              <input id="pa-amount"
                type="number"
                value={contractAmount}
                onChange={(e) => setContractAmount(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="pa-days" className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">Planned Duration (Days)</label>
              <input id="pa-days"
                type="number"
                value={plannedDays}
                onChange={(e) => setPlannedDays(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="pa-location" className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">Inspection Plant Location &amp; Yard</label>
            <input id="pa-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="pa-scope" className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">Detailed Scope of Work &amp; Inspection Protocol</label>
            <textarea id="pa-scope"
              rows={3}
              value={scopeDetails}
              onChange={(e) => setScopeDetails(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              Back to Step 2
            </button>

            <button
              onClick={handleCompleteAssignment}
              className="px-6 py-2.5 rounded-xl bg-[#003366] hover:bg-[#002855] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-sky-300" />
              <span>Formalize Assignment &amp; Send Invoice Draft</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
