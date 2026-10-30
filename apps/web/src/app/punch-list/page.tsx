"use client";
import { useEffect, useState } from "react";
import { Search, Plus, RefreshCw, CheckCircle2, AlertTriangle, X } from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

function categoryBadge(cat: string) {
  const colors: Record<string, string> = {
    A: "bg-red-100 text-red-800", B: "bg-yellow-100 text-yellow-800", C: "bg-green-100 text-green-800",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[cat] || "bg-gray-100 text-gray-600"}`}>Cat {cat}</span>;
}

function statusPill(s: string) {
  const colors: Record<string, string> = {
    open: "bg-blue-100 text-blue-800", corrected: "bg-yellow-100 text-yellow-800",
    reinspected: "bg-purple-100 text-purple-800", closed: "bg-green-100 text-green-800",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[s] || "bg-gray-100 text-gray-600"}`}>{s}</span>;
}

export default function PunchListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [jobId, setJobId] = useState("");
  const [form, setForm] = useState({ job_id: "", description: "", category: "B", location: "", discipline: "" });

  useEffect(() => { loadData(); }, [catFilter, statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params: any = {};
      if (catFilter !== "all") params.category = catFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await api.listPunchItems(params);
      setItems(res.items || res.data || res || []);
    } catch { toast.error("Failed to load punch list"); }
    setLoading(false);
  }

  async function loadSummary() {
    if (!jobId) return;
    try {
      const res = await api.punchListSummary(jobId);
      setSummary(res);
    } catch { toast.error("Failed to load summary"); }
  }

  async function handleCreate() {
    try {
      await api.createPunchItem(form);
      toast.success("Punch item created");
      setShowModal(false);
      setForm({ job_id: "", description: "", category: "B", location: "", discipline: "" });
      loadData();
    } catch { toast.error("Failed to create"); }
  }

  async function handleAction(id: string, action: string) {
    try {
      if (action === "correct") await api.correctPunchItem(id, {});
      else if (action === "re-inspect") await api.reInspectPunchItem(id, {});
      else if (action === "close") await api.closePunchItem(id);
      else await api.correctPunchItem(id, { status: action });
      toast.success(`Item ${action}`);
      loadData();
    } catch { toast.error("Action failed"); }
  }

  const filtered = items.filter((i: any) =>
    (i.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.punch_id || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Punch List</h1>
          <p className="text-sm text-gray-500 mt-1">Track and resolve inspection deficiencies</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Item
        </button>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <input value={jobId} onChange={e => setJobId(e.target.value)} placeholder="Enter Job ID for summary..." className="flex-1 border rounded-lg px-3 py-2" />
          <button onClick={loadSummary} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium">Get Summary</button>
        </div>
        {summary && (
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">Cat A (Critical)</p>
              <p className="text-xl font-bold text-red-600">{summary.category_A || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Cat B (Major)</p>
              <p className="text-xl font-bold text-yellow-600">{summary.category_B || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Cat C (Minor)</p>
              <p className="text-xl font-bold text-green-600">{summary.category_C || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Total Open</p>
              <p className="text-xl font-bold text-gray-900">{summary.total_open || 0}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search punch items..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="all">All Categories</option>
          <option value="A">Category A</option>
          <option value="B">Category B</option>
          <option value="C">Category C</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="corrected">Corrected</option>
          <option value="reinspected">Re-inspected</option>
          <option value="closed">Closed</option>
        </select>
        <button onClick={loadData} className="p-2 border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Job</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No punch items found</td></tr>
            ) : filtered.map((item: any) => (
              <tr key={item.punch_id || item._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{item.punch_id}</td>
                <td className="px-4 py-3">{item.job_id}</td>
                <td className="px-4 py-3">{categoryBadge(item.category)}</td>
                <td className="px-4 py-3 max-w-xs truncate">{item.description}</td>
                <td className="px-4 py-3">{item.location || "—"}</td>
                <td className="px-4 py-3">{statusPill(item.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {item.status === "open" && (
                      <button onClick={() => handleAction(item.punch_id, "corrected")} className="text-xs text-yellow-600 hover:underline">Correct</button>
                    )}
                    {item.status === "corrected" && (
                      <button onClick={() => handleAction(item.punch_id, "reinspected")} className="text-xs text-purple-600 hover:underline">Re-inspect</button>
                    )}
                    {item.status === "reinspected" && (
                      <button onClick={() => handleAction(item.punch_id, "closed")} className="text-xs text-green-600 hover:underline">Close</button>
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
              <h2 className="text-lg font-semibold">New Punch Item</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job ID</label>
                <input value={form.job_id} onChange={e => setForm({ ...form, job_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="A">A - Critical (blocks release)</option>
                  <option value="B">B - Major</option>
                  <option value="C">C - Minor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
                <input value={form.discipline} onChange={e => setForm({ ...form, discipline: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
