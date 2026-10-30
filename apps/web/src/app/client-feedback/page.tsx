"use client";
import { useEffect, useState } from "react";
import { Search, Plus, RefreshCw, AlertTriangle, Star, X } from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

function categoryTag(cat: string) {
  const colors: Record<string, string> = {
    quality: "bg-blue-100 text-blue-800", delivery: "bg-purple-100 text-purple-800",
    safety: "bg-red-100 text-red-800", communication: "bg-green-100 text-green-800",
    competence: "bg-yellow-100 text-yellow-800",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[cat] || "bg-gray-100 text-gray-600"}`}>{cat}</span>;
}

export default function ClientFeedbackPage() {
  const [items, setItems] = useState<any[]>([]);
  const [mrmItems, setMrmItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("feedback");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    job_id: "", client_id: "", client_name: "",
    quality_rating: 4, timeliness_rating: 4, communication_rating: 4, competence_rating: 4, safety_rating: 4,
    comments: "",
  });

  useEffect(() => { loadData(); }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === "feedback") {
        const res = await api.listFeedback();
        setItems(res.items || res.data || res || []);
      } else {
        const res = await api.listMRM();
        setMrmItems(res.items || res.data || res || []);
      }
    } catch { toast.error("Failed to load"); }
    setLoading(false);
  }

  async function handleCreate() {
    try {
      await api.createFeedback(form);
      toast.success("Feedback recorded");
      setShowModal(false);
      loadData();
    } catch { toast.error("Failed to create"); }
  }

  const avgRating = (item: any) => {
    const vals = [item.quality_rating, item.timeliness_rating, item.communication_rating, item.competence_rating, item.safety_rating].filter(Boolean);
    return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : "—";
  };

  const filteredFeedback = items.filter((i: any) =>
    (i.client_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.job_id || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredMrm = mrmItems.filter((i: any) =>
    (i.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Feedback & MRM</h1>
          <p className="text-sm text-gray-500 mt-1">Client satisfaction tracking and management review</p>
        </div>
        {activeTab === "feedback" && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Record Feedback
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {["feedback", "mrm"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
            {tab === "feedback" ? "Client Feedback" : "MRM Agenda"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${activeTab}...`} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <button onClick={loadData} className="p-2 border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {activeTab === "feedback" ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Job</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Avg Rating</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Quality</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Timeliness</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Communication</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : filteredFeedback.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No feedback records</td></tr>
              ) : filteredFeedback.map((item: any) => (
                <tr key={item.feedback_id || item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.client_name}</td>
                  <td className="px-4 py-3">{item.job_id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{avgRating(item)}</span>
                      <StarRating rating={Math.round(Number(avgRating(item)))} />
                    </div>
                  </td>
                  <td className="px-4 py-3"><StarRating rating={item.quality_rating} /></td>
                  <td className="px-4 py-3"><StarRating rating={item.timeliness_rating} /></td>
                  <td className="px-4 py-3"><StarRating rating={item.communication_rating} /></td>
                  <td className="px-4 py-3">{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3">
                    {item.requires_escalation && (
                      <span className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="w-3 h-3" /> Escalated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Meeting Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : filteredMrm.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No MRM agenda items</td></tr>
              ) : filteredMrm.map((item: any) => (
                <tr key={item.mrm_id || item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3">{categoryTag(item.category)}</td>
                  <td className="px-4 py-3 text-gray-600">{item.source_type || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === "closed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.meeting_date ? new Date(item.meeting_date).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Record Client Feedback</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job ID</label>
                  <input value={form.job_id} onChange={e => setForm({ ...form, job_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              {["quality", "timeliness", "communication", "competence", "safety"].map(dim => (
                <div key={dim}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{dim} Rating</label>
                  <select value={(form as any)[`${dim}_rating`]} onChange={e => setForm({ ...form, [`${dim}_rating`]: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2">
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} — {["Poor", "Below Average", "Average", "Good", "Excellent"][n - 1]}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} rows={3} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Submit Feedback</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
