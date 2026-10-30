"use client";
import { useEffect, useState } from "react";
import { Search, Plus, RefreshCw, CheckCircle2, Clock, Calendar, X } from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

function statusPill(s: string) {
  const colors: Record<string, string> = {
    open: "bg-blue-100 text-blue-800", scheduled: "bg-purple-100 text-purple-800",
    inspected: "bg-yellow-100 text-yellow-800", closed: "bg-gray-100 text-gray-600",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[s] || "bg-gray-100 text-gray-600"}`}>{s.replace(/_/g, " ")}</span>;
}

export default function RFIsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [turnaround, setTurnaround] = useState<any>(null);
  const [form, setForm] = useState({ job_id: "", description: "", requested_date: "", discipline: "" });

  useEffect(() => { loadData(); }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await api.listRFIs(params);
      setItems(res.items || res.data || res || []);
    } catch { toast.error("Failed to load RFIs"); }
    setLoading(false);
  }

  async function loadTurnaround() {
    try {
      const res = await api.rfiTurnaround();
      setTurnaround(res);
    } catch { /* ignore */ }
  }

  useEffect(() => { loadTurnaround(); }, []);

  async function handleCreate() {
    try {
      await api.createRFI(form);
      toast.success("RFI created");
      setShowModal(false);
      setForm({ job_id: "", description: "", requested_date: "", discipline: "" });
      loadData();
    } catch { toast.error("Failed to create RFI"); }
  }

  async function handleSchedule(id: string) {
    const date = prompt("Enter scheduled date (YYYY-MM-DD):");
    if (!date) return;
    try {
      await api.scheduleRFI(id, { scheduled_date: date });
      toast.success("RFI scheduled");
      loadData();
    } catch { toast.error("Failed to schedule"); }
  }

  const filtered = items.filter((i: any) =>
    (i.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.rfi_id || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.job_id || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requests for Inspection</h1>
          <p className="text-sm text-gray-500 mt-1">Manage RFIs raised by contractors</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New RFI
        </button>
      </div>

      {turnaround && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">Avg Turnaround</p>
            <p className="text-2xl font-bold text-gray-900">{turnaround.avg_turnaround_hours?.toFixed(1) || "—"}h</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">Open RFIs</p>
            <p className="text-2xl font-bold text-blue-600">{turnaround.open_count || 0}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{turnaround.overdue_count || 0}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search RFIs..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="scheduled">Scheduled</option>
          <option value="inspected">Inspected</option>
          <option value="closed">Closed</option>
        </select>
        <button onClick={loadData} className="p-2 border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">RFI ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Job</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Discipline</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Requested</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No RFIs found</td></tr>
            ) : filtered.map((item: any) => (
              <tr key={item.rfi_id || item._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{item.rfi_id}</td>
                <td className="px-4 py-3">{item.job_id}</td>
                <td className="px-4 py-3 max-w-xs truncate">{item.description}</td>
                <td className="px-4 py-3">{item.discipline || "—"}</td>
                <td className="px-4 py-3">{item.requested_date ? new Date(item.requested_date).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">{statusPill(item.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {item.status === "open" && (
                      <button onClick={() => handleSchedule(item.rfi_id)} className="text-xs text-purple-600 hover:underline flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Schedule
                      </button>
                    )}
                    {item.status === "scheduled" && (
                      <button onClick={async () => { try { await api.recordRFIResult(item.rfi_id, { result: "pass" }); toast.success("Marked inspected"); loadData(); } catch { toast.error("Failed"); }}} className="text-xs text-green-600 hover:underline flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Complete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Request for Inspection</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job ID</label>
                <input value={form.job_id} onChange={e => setForm({ ...form, job_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
                <input value={form.discipline} onChange={e => setForm({ ...form, discipline: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requested Date</label>
                <input type="date" value={form.requested_date} onChange={e => setForm({ ...form, requested_date: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create RFI</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
