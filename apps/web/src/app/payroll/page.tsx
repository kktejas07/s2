"use client";

import { useEffect, useState } from "react";
import {
  Search, Plus, RefreshCw, X, Clock, CheckCircle2,
  Calculator, DollarSign, AlertTriangle, Play,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

function statusPill(s: string) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700", processing: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800", disbursed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-700",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[s] || "bg-gray-100 text-gray-600"}`}>{s?.replace(/_/g, " ")}</span>;
}

export default function PayrollPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ month: "", year: new Date().getFullYear(), region_code: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadRuns(); }, [search]);

  async function loadRuns() {
    setLoading(true);
    try {
      const res = await api.listPayrollRuns({ search });
      setRuns(res?.items || res || []);
    } catch { toast.error("Failed to load payroll runs"); }
    setLoading(false);
  }

  async function loadPayslips(runId: string) {
    try {
      const res = await api.listPayslips({ run_id: runId });
      setPayslips(res?.items || res || []);
    } catch { toast.error("Failed to load payslips"); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createPayrollRun(form);
      toast.success("Payroll run created");
      setShowCreate(false);
      loadRuns();
    } catch { toast.error("Failed to create run"); }
    setSubmitting(false);
  }

  async function handleAction(runId: string, action: string) {
    try {
      if (action === "process") await api.processPayrollRun(runId);
      else if (action === "approve") await api.approvePayrollRun(runId);
      else if (action === "disburse") await api.disbursePayrollRun(runId);
      toast.success(`Payroll ${action}ed`);
      loadRuns();
    } catch { toast.error(`Failed to ${action}`); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calculator size={28} /> Payroll
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monthly payroll runs with PF, ESI, PT, TDS deductions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={16} /> New Run
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search runs..." className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800" />
        </div>
        <button onClick={loadRuns} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"><RefreshCw size={16} /></button>
      </div>

      {selectedRun ? (
        <div className="space-y-4">
          <button onClick={() => { setSelectedRun(null); setPayslips([]); }} className="text-sm text-blue-600 hover:underline">&larr; Back to runs</button>
          <h2 className="text-lg font-semibold">Payslips for {selectedRun.month}/{selectedRun.year} — {selectedRun.region_code || "All Regions"}</h2>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <tr><th className="px-4 py-3 text-left">Person</th><th className="px-4 py-3 text-left">Basic</th><th className="px-4 py-3 text-left">Gross</th><th className="px-4 py-3 text-left">PF</th><th className="px-4 py-3 text-left">ESI</th><th className="px-4 py-3 text-left">TDS</th><th className="px-4 py-3 text-left">Net</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {payslips.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">{p.person_id}</td>
                    <td className="px-4 py-3 font-mono">₹{(p.basic_pay || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono">₹{(p.gross_pay || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono">₹{(p.pf_employee || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono">₹{(p.esi_employee || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono">₹{(p.tds || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono font-semibold">₹{(p.net_pay || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
                {payslips.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No payslips</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400"><Clock size={24} className="animate-spin mr-2" /> Loading...</div>
      ) : runs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No payroll runs found</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <tr><th className="px-4 py-3 text-left">Run ID</th><th className="px-4 py-3 text-left">Month/Year</th><th className="px-4 py-3 text-left">Region</th><th className="px-4 py-3 text-left">Headcount</th><th className="px-4 py-3 text-left">Total Net</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {runs.map((run: any, i: number) => (
                <tr key={run._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono text-xs">{run.run_id}</td>
                  <td className="px-4 py-3">{run.month}/{run.year}</td>
                  <td className="px-4 py-3">{run.region_code || "All"}</td>
                  <td className="px-4 py-3">{run.head_count ?? "—"}</td>
                  <td className="px-4 py-3 font-mono">₹{(run.total_net || 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">{statusPill(run.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedRun(run); loadPayslips(run.run_id || run._id); }} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">View Slips</button>
                      {run.status === "draft" && <button onClick={() => handleAction(run.run_id || run._id, "process")} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">Process</button>}
                      {run.status === "processing" && <button onClick={() => handleAction(run.run_id || run._id, "approve")} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Approve</button>}
                      {run.status === "approved" && <button onClick={() => handleAction(run.run_id || run._id, "disburse")} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Disburse</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">New Payroll Run</h2>
              <button type="button" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Month</label>
                <select required value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select</option>
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Year</label>
                <input type="number" required value={form.year} onChange={e => setForm({ ...form, year: +e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Region (blank = all)</label>
                <select value={form.region_code} onChange={e => setForm({ ...form, region_code: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">All Regions</option>
                  <option value="N">North</option><option value="S">South</option><option value="E">East</option><option value="W">West</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{submitting ? "Creating..." : "Create"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
