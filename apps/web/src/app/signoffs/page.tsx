"use client";
import { useEffect, useState } from "react";
import { Search, RefreshCw, CheckCircle2, AlertTriangle, X, Clock } from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

function statusPill(s: string) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800", approved: "bg-green-100 text-green-800",
    rework: "bg-orange-100 text-orange-800", rejected: "bg-red-100 text-red-700",
    draft: "bg-gray-100 text-gray-700",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[s] || "bg-gray-100 text-gray-600"}`}>{s.replace(/_/g, " ")}</span>;
}

export default function SignoffsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => { loadData(); }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      const res = activeTab === "pending" ? await api.pendingSignoffs() : await api.listSignoffs();
      setItems(res.items || res.data || res || []);
    } catch { toast.error("Failed to load signoffs"); }
    setLoading(false);
  }

  async function handleReview() {
    if (!reviewModal || !reviewAction) return;
    try {
      await api.reviewSignoff(reviewModal.signoff_id, { action: reviewAction, notes: reviewNotes });
      toast.success(`Signoff ${reviewAction}${reviewAction === "approve" ? "d" : reviewAction === "reject" ? "ed" : " requested"}`);
      setReviewModal(null);
      setReviewAction("");
      setReviewNotes("");
      loadData();
    } catch { toast.error("Review action failed"); }
  }

  const filtered = items.filter((i: any) =>
    (i.report_id || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.signoff_id || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.job_id || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Sign-offs</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve inspection reports with deputy support</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {["pending", "all"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
            {tab === "pending" ? "Pending My Review" : "All Sign-offs"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search signoffs..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <button onClick={loadData} className="p-2 border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Signoff ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Report / Job</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Signatory</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Deputy</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Submitted</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">{activeTab === "pending" ? "No signoffs pending your review" : "No signoffs found"}</td></tr>
            ) : filtered.map((item: any) => (
              <tr key={item.signoff_id || item._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{item.signoff_id}</td>
                <td className="px-4 py-3">
                  <div>{item.report_id}</div>
                  <div className="text-xs text-gray-500">{item.job_id}</div>
                </td>
                <td className="px-4 py-3">{item.signatory_name || item.signatory_id || "—"}</td>
                <td className="px-4 py-3">
                  {item.is_deputy ? (
                    <span className="flex items-center gap-1 text-xs text-purple-600">
                      <Clock className="w-3 h-3" /> Deputy {item.cross_region_code ? `(${item.cross_region_code})` : ""}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3">{statusPill(item.status)}</td>
                <td className="px-4 py-3">{item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">
                  {item.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setReviewModal(item); setReviewAction("approve"); }} className="text-xs text-green-600 hover:underline flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Approve
                      </button>
                      <button onClick={() => { setReviewModal(item); setReviewAction("rework"); }} className="text-xs text-orange-600 hover:underline flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Rework
                      </button>
                      <button onClick={() => { setReviewModal(item); setReviewAction("reject"); }} className="text-xs text-red-600 hover:underline">Reject</button>
                    </div>
                  )}
                  {item.status === "rework" && (
                    <span className="text-xs text-gray-500 italic">MS-12 rework in progress</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold capitalize">{reviewAction} Sign-off</h2>
              <button onClick={() => { setReviewModal(null); setReviewAction(""); setReviewNotes(""); }}><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <p><strong>Signoff:</strong> {reviewModal.signoff_id}</p>
              <p><strong>Report:</strong> {reviewModal.report_id}</p>
              <p><strong>Job:</strong> {reviewModal.job_id}</p>
            </div>
            {reviewAction === "rework" && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-sm text-orange-800">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                This will return the report for corrections per MS-12 procedure.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={3} placeholder={reviewAction === "rework" ? "Describe required corrections..." : "Optional notes..."} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setReviewModal(null); setReviewAction(""); setReviewNotes(""); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleReview}
                className={`px-4 py-2 text-white rounded-lg ${
                  reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" :
                  reviewAction === "rework" ? "bg-orange-600 hover:bg-orange-700" :
                  "bg-red-600 hover:bg-red-700"
                }`}>
                Confirm {reviewAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
