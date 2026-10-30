"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, Plus, CheckCircle2 } from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

function NewVisitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("job_id") || "";

  const [jobId, setJobId] = useState(initialJobId);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [manufacturerName, setManufacturerName] = useState("");
  const [inspectorName, setInspectorName] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [plantLocation, setPlantLocation] = useState("");
  const [protocolStandard, setProtocolStandard] = useState("ISO 9001:2026 & ISO/IEC 17020:2026 & ASME Section VIII Division 1 Code");
  const [environmentalCondition, setEnvironmentalCondition] = useState("Normal (Safety & Heat stress audited per ISO 9001:2026 Cl. 4.1)");
  const [impartialityDeclared, setImpartialityDeclared] = useState(true);
  const [inspectionScope, setInspectionScope] = useState("");
  const [sowChecklists, setSowChecklists] = useState<any[]>([]);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (jobId) {
      handleJobSelected(jobId);
    }
  }, [jobId]);

  async function loadJobs() {
    try {
      const res = await api.listJobs({ per_page: 50 });
      setAvailableJobs(res.data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleJobSelected(selectedId: string) {
    if (!selectedId) return;
    try {
      const job = await api.getJob(selectedId);
      if (job) {
        setCustomerName(job.client_name || "");
        setManufacturerName(job.manufacturer_name || "");
        setInspectorName(job.assigned_inspector_name || "");
        setPlantLocation(job.location_address || "");
        setInspectionScope(job.title ? `${job.title} — ${job.description || ""}` : "");
        if (job.scope_of_work && job.scope_of_work.length > 0) {
          setSowChecklists(job.scope_of_work);
        }
        setAutoPopulated(true);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.createVisit({
        visit_id: `VST-2026-${Date.now().toString().slice(-4)}`,
        job_id: jobId,
        customer_name: customerName,
        manufacturer_name: manufacturerName,
        inspector_name: inspectorName,
        planned_date: plannedDate || null,
        plant_location: plantLocation,
        protocol_standard: protocolStandard,
        environmental_condition: environmentalCondition,
        impartiality_declared: impartialityDeclared,
        inspection_scope: inspectionScope,
        status: "scheduled",
      });
      router.push(`/visits/${res.visit_id || ""}`);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't schedule the visit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link
          href="/visits"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0084bf] dark:text-sky-400 hover:underline transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Field Visits Directory</span>
        </Link>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0084bf] to-[#e35f14] flex items-center justify-center text-white shadow-md glow-iqe-blue">
              <CalendarCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-heading">Schedule Inspector Field Visit</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                Auto-populates client, manufacturer, inspector assignment, and SOW checklists from approved Job orders
              </p>
            </div>
          </div>

          {autoPopulated && (
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5 self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auto-populated from Job {jobId}</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="visit-job" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Select Approved Job Reference *
              </label>
              <select
                id="visit-job"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                required
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0084bf] font-mono font-bold text-slate-900 dark:text-slate-100"
              >
                <option value="">-- Select Job Order --</option>
                {availableJobs.map((j) => (
                  <option key={j.job_id} value={j.job_id}>
                    {j.job_id} — {j.title} ({j.client_name || "Client"})
                  </option>
                ))}
                <option value="JOB-2026-MIG-0001">JOB-2026-MIG-0001 — Reliance High Pressure Piping</option>
                <option value="JOB-2026-MIG-0002">JOB-2026-MIG-0002 — L&T Jamnagar Valve Audit</option>
              </select>
            </div>

            <div>
              <label htmlFor="visit-inspector" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">Assigned Inspector Name *</label>
              <input
                id="visit-inspector"
                type="text"
                required
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                placeholder="e.g. Alok Gupta (Senior TPI Engineer)"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0084bf] font-semibold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="visit-date" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">Planned Site Visit Date *</label>
              <input
                id="visit-date"
                type="date"
                required
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0084bf] font-semibold text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="visit-customer" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">Customer / Client</label>
              <input
                id="visit-customer"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Reliance Industries Ltd"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0084bf] font-medium text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="visit-manufacturer" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">Manufacturer Plant / Works Site</label>
              <input
                id="visit-manufacturer"
                type="text"
                value={manufacturerName}
                onChange={(e) => setManufacturerName(e.target.value)}
                placeholder="e.g. BHEL Trichy Heavy Boilers"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0084bf] font-medium text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="visit-protocol" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">TPI Standard Protocol *</label>
              <select
                id="visit-protocol"
                value={protocolStandard}
                onChange={(e) => setProtocolStandard(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0084bf] font-semibold text-slate-900 dark:text-slate-100"
              >
                <option value="ISO 9001:2026 & ISO/IEC 17020:2026 & ASME Section VIII Division 1 Code">ISO 9001:2026 &amp; ISO/IEC 17020:2026 &amp; ASME Section VIII Div 1</option>
                <option value="ISO 9001:2026 & ISO/IEC 17020:2026 Quality Inspection Protocol">ISO 9001:2026 &amp; ISO/IEC 17020:2026 Quality Inspection Protocol</option>
                <option value="API 6D Valve & Flow Control Inspection Standard">API 6D Valve &amp; Flow Control Standard</option>
                <option value="DIN EN 10204 3.1 Material Certificate Protocol">DIN EN 10204 3.1 Material Certification</option>
                <option value="AWS D1.1 Structural Fabrication Code">AWS D1.1 Structural Fabrication Code</option>
                <option value="TPI Quality Management System & Inspection Plan">TPI Quality Management System &amp; Inspection Plan</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="visit-location" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">Inspection Location & Address</label>
            <input
              id="visit-location"
              type="text"
              value={plantLocation}
              onChange={(e) => setPlantLocation(e.target.value)}
              placeholder="e.g. Plot 12, Hazira Industrial Zone, Surat, Gujarat"
              className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0084bf] font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="visit-environment" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Environmental & Site Safety Condition (ISO 9001:2026 Cl. 4.1 / 7.1.4)
              </label>
              <input
                id="visit-environment"
                type="text"
                value={environmentalCondition}
                onChange={(e) => setEnvironmentalCondition(e.target.value)}
                placeholder="e.g. Normal (Heat stress & ventilation audited)"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0084bf] font-medium text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={impartialityDeclared}
                  onChange={(e) => setImpartialityDeclared(e.target.checked)}
                  className="w-4 h-4 text-[#0084bf] rounded border-slate-300 focus:ring-[#0084bf]"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <strong>Impartiality Declared:</strong> Conflict of interest cleared per ISO/IEC 17020:2026 &amp; IQE-MS-10
                </span>
              </label>
            </div>
          </div>

          {/* SOW Checklist Preview */}
          {sowChecklists.length > 0 && (
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2">
              <span className="text-[11px] font-extrabold uppercase text-[#00618e] tracking-wider block">
                Scope of Work Checklists to Auto-Import ({sowChecklists.length} Criteria)
              </span>
              <div className="space-y-1">
                {sowChecklists.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0084bf]" />
                    <span>{s.description || s.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="visit-scope" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">Scope of Physical Verification / Remarks</label>
            <textarea
              id="visit-scope"
              rows={3}
              value={inspectionScope}
              onChange={(e) => setInspectionScope(e.target.value)}
              placeholder="e.g. Joint dimensional check, ultrasonic thickness measurement, hydrotest witness, and DFT coating inspection."
              className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0084bf] font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              href="/visits"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0084bf] to-[#e35f14] text-white font-extrabold text-xs shadow-md glow-iqe-blue hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>{loading ? "Scheduling Visit..." : "Schedule Inspector Visit"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewVisitPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
      <NewVisitForm />
    </Suspense>
  );
}
