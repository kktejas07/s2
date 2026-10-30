"use client";
import { useEffect, useState } from "react";
import { Search, Plus, RefreshCw, CheckCircle2, AlertTriangle, Shield, X } from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

function statusPill(s: string) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700", preconditions_checked: "bg-blue-100 text-blue-800",
    recommended: "bg-yellow-100 text-yellow-800", approved: "bg-green-100 text-green-800",
    released: "bg-green-200 text-green-900",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[s] || "bg-gray-100 text-gray-600"}`}>{s.replace(/_/g, " ")}</span>;
}

export default function ReleaseNotesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [preconditions, setPreconditions] = useState<any>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [form, setForm] = useState({ job_id: "", title: "", scope_description: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.listReleaseNotes();
      setItems(res.items || res.data || res || []);
    } catch { toast.error("Failed to load release notes"); }
    setLoading(false);
  }

  async function handleCreate() {
    try {
      await api.createReleaseNote(form);
      toast.success("Release note created");
      setShowModal(false);
      setForm({ job_id: "", title: "", scope_description: "" });
      loadData();
    } catch { toast.error("Failed to create"); }
  }

  async function checkPreconditions(id: string) {
    setCheckingId(id);
    try {
      const res = await api.checkReleaseNotePreconditions(id);
      setPreconditions(res);
    } catch { toast.error("Failed to check preconditions"); }
  }

  async function handleAction(id: string, action: string) {
    try {
      if (action === "recommend") await api.recommendReleaseNote(id, {});
      else if (action === "approve") await api.approveReleaseNote(id, {});
      else if (action === "release") await api.issueReleaseNote(id);
      toast.success(`Release note ${action}d`);
      loadData();
    } catch { toast.error(`Failed to ${action}`); }
  }

  const filtered = items.filter((i: any) =>
    (i.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.release_note_id || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.job_id || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspection Release Notes</h1>
          <p className="text-sm text-gray-500 mt-1">Manage release workflow: draft → check → recommend → approve → release</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Release Note
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search release notes..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <button onClick={loadData} className="p-2 border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {preconditions && checkingId && (
        <div className="bg-white border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Preconditions Check — {checkingId}</h3>
            <button onClick={() => { setPreconditions(null); setCheckingId(null); }}><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className={`flex items-center gap-2 p-3 rounded-lg ${preconditions.hold_points_signed ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              {preconditions.hold_points_signed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span className="text-sm">Hold Points Signed</span>
            </div>
            <div className={`flex items-center gap-2 p-3 rounded-lg ${preconditions.ncrs_closed ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              {preconditions.ncrs_closed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span className="text-sm">NCRs Closed ({preconditions.open_ncrs || 0} open)</span>
            </div>
            <div className={`flex items-center gap-2 p-3 rounded-lg ${preconditions.cat_a_punch_closed ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              {preconditions.cat_a_punch_closed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span className="text-sm">Cat A Punch Closed ({preconditions.open_cat_a || 0} open)</span>
            </div>
          </div>
          {preconditions.all_clear && <p className="mt-3 text-sm text-green-700 font-medium">All preconditions met — ready to recommend</p>}
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Job</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No release notes found</td></tr>
            ) : filtered.map((item: any) => (
              <tr key={item.release_note_id || item._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{item.release_note_id}</td>
                <td className="px-4 py-3">{item.job_id}</td>
                <td className="px-4 py-3">{item.title}</td>
                <td className="px-4 py-3">{statusPill(item.status)}</td>
                <td className="px-4 py-3">{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {item.status === "draft" && (
                      <button onClick={() => checkPreconditions(item.release_note_id)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Check
                      </button>
                    )}
                    {item.status === "preconditions_checked" && (
                      <button onClick={() => handleAction(item.release_note_id, "recommend")} className="text-xs text-yellow-600 hover:underline">Recommend</button>
                    )}
                    {item.status === "recommended" && (
                      <button onClick={() => handleAction(item.release_note_id, "approve")} className="text-xs text-green-600 hover:underline">Approve</button>
                    )}
                    {item.status === "approved" && (
                      <button onClick={() => handleAction(item.release_note_id, "release")} className="text-xs text-green-700 hover:underline font-medium">Release</button>
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
              <h2 className="text-lg font-semibold">New Inspection Release Note</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job ID</label>
                <input value={form.job_id} onChange={e => setForm({ ...form, job_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scope Description</label>
                <textarea value={form.scope_description} onChange={e => setForm({ ...form, scope_description: e.target.value })} rows={4} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
