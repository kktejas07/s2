"use client";

import { useEffect, useState } from "react";
import {
  Search, Plus, RefreshCw, X, Clock, CheckCircle2,
  UserX, AlertTriangle, ListChecks,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

function statusPill(s: string) {
  const colors: Record<string, string> = {
    initiated: "bg-yellow-100 text-yellow-800", in_progress: "bg-blue-100 text-blue-800",
    authorization_withdrawn: "bg-orange-100 text-orange-800", settled: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800", cancelled: "bg-gray-100 text-gray-600",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[s] || "bg-gray-100 text-gray-600"}`}>{s?.replace(/_/g, " ")}</span>;
}

export default function ExitManagementPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ person_id: "", exit_type: "resignation", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, [search]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.listExits({ search });
      setItems(res?.items || res || []);
    } catch { toast.error("Failed to load exits"); }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.initiateExit(form);
      toast.success("Exit process initiated");
      setShowModal(false);
      setForm({ person_id: "", exit_type: "resignation", reason: "" });
      loadData();
    } catch { toast.error("Failed to initiate exit"); }
    setSubmitting(false);
  }

  async function handleAction(exitId: string, action: string) {
    try {
      if (action === "withdraw-authorization") await api.withdrawExitAuthorization(exitId);
      else if (action === "settle") await api.settleExit(exitId, {});
      else if (action === "complete") await api.completeExit(exitId);
      toast.success(`Exit ${action} completed`);
      loadData();
    } catch { toast.error(`Failed to ${action}`); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserX size={28} /> Exit Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Employee exit process, checklist, and authorization withdrawal</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={16} /> Initiate Exit
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by person..." className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800" />
        </div>
        <button onClick={loadData} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"><RefreshCw size={16} /></button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400"><Clock size={24} className="animate-spin mr-2" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No exit processes found</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left">Person</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Initiated</th>
                <th className="px-4 py-3 text-left">Last Working Day</th>
                <th className="px-4 py-3 text-left">Checklist</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item: any, i: number) => {
                const done = item.checklist?.filter((c: any) => c.completed).length || 0;
                const total = item.checklist?.length || 12;
                const pct = Math.round((done / total) * 100);
                return (
                  <tr key={item._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-semibold">{item.person_id}</td>
                    <td className="px-4 py-3 capitalize">{item.exit_type?.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">{item.initiated_on?.slice(0, 10) || "—"}</td>
                    <td className="px-4 py-3">{item.last_working_day?.slice(0, 10) || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{done}/{total}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{statusPill(item.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {item.status === "initiated" && <button onClick={() => handleAction(item.exit_id || item._id, "withdraw-authorization")} className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200">Withdraw Auth</button>}
                        {item.status === "authorization_withdrawn" && <button onClick={() => handleAction(item.exit_id || item._id, "settle")} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200">Settle</button>}
                        {item.status === "settled" && <button onClick={() => handleAction(item.exit_id || item._id, "complete")} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Complete</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Initiate Exit Process</h2>
              <button type="button" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium mb-1">Person ID</label><input required value={form.person_id} onChange={e => setForm({ ...form, person_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="EMP-XXXXX" /></div>
              <div>
                <label className="block text-xs font-medium mb-1">Exit Type</label>
                <select value={form.exit_type} onChange={e => setForm({ ...form, exit_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="resignation">Resignation</option><option value="termination">Termination</option><option value="retirement">Retirement</option><option value="contract_end">Contract End</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium mb-1">Reason</label><textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{submitting ? "Initiating..." : "Initiate"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
