"use client";

import { useEffect, useState } from "react";
import {
  Search, Plus, RefreshCw, X, Clock, CheckCircle2,
  Award, AlertTriangle, Eye, Star,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

type Tab = "appraisals" | "witnessed";

function statusPill(s: string) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700", self_review: "bg-yellow-100 text-yellow-800",
    manager_review: "bg-blue-100 text-blue-800", completed: "bg-green-100 text-green-800",
    scheduled: "bg-blue-100 text-blue-800", passed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-700", pending: "bg-yellow-100 text-yellow-800",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[s] || "bg-gray-100 text-gray-600"}`}>{s?.replace(/_/g, " ")}</span>;
}

export default function AppraisalsMonitoringPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("appraisals");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ person_id: "", review_period: "", reviewer_id: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, [activeTab, search]);

  async function loadData() {
    setLoading(true);
    try {
      let res: any;
      if (activeTab === "appraisals") res = await api.listAppraisals({ search });
      else res = await api.listWitnessedInspections({ search });
      setItems(res?.items || res || []);
    } catch { toast.error("Failed to load data"); }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createAppraisal(form);
      toast.success("Appraisal created");
      setShowModal(false);
      loadData();
    } catch { toast.error("Failed to create appraisal"); }
    setSubmitting(false);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "appraisals", label: "Appraisals" },
    { key: "witnessed", label: "Witnessed Inspections" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award size={28} /> Appraisals &amp; Competence Monitoring
          </h1>
          <p className="text-sm text-gray-500 mt-1">Annual performance reviews and witnessed inspection assessments</p>
        </div>
        {activeTab === "appraisals" && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} /> New Appraisal
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800" />
        </div>
        <button onClick={loadData} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"><RefreshCw size={16} /></button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400"><Clock size={24} className="animate-spin mr-2" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No records found</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {activeTab === "appraisals" ? (
                <tr><th className="px-4 py-3 text-left">Person</th><th className="px-4 py-3 text-left">Period</th><th className="px-4 py-3 text-left">Reviewer</th><th className="px-4 py-3 text-left">Overall</th><th className="px-4 py-3 text-left">Recommend Auth</th><th className="px-4 py-3 text-left">Status</th></tr>
              ) : (
                <tr><th className="px-4 py-3 text-left">Inspector</th><th className="px-4 py-3 text-left">Witnessed By</th><th className="px-4 py-3 text-left">Job</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Score</th><th className="px-4 py-3 text-left">Result</th></tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item: any, i: number) => (
                <tr key={item._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {activeTab === "appraisals" ? (<>
                    <td className="px-4 py-3">{item.person_id}</td>
                    <td className="px-4 py-3">{item.review_period}</td>
                    <td className="px-4 py-3">{item.reviewer_id || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {item.overall_score != null && <><Star size={14} className="text-yellow-500" /> {item.overall_score}/5</>}
                        {item.overall_score == null && "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">{item.recommend_authorization ? <CheckCircle2 size={16} className="text-green-600" /> : "—"}</td>
                    <td className="px-4 py-3">{statusPill(item.status)}</td>
                  </>) : (<>
                    <td className="px-4 py-3">{item.person_id}</td>
                    <td className="px-4 py-3">{item.witnessed_by || "—"}</td>
                    <td className="px-4 py-3">{item.job_id || "—"}</td>
                    <td className="px-4 py-3">{item.assessment_date?.slice(0, 10) || "—"}</td>
                    <td className="px-4 py-3">{item.score ?? "—"}/10</td>
                    <td className="px-4 py-3">{statusPill(item.result || item.status)}</td>
                  </>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">New Appraisal</h2>
              <button type="button" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium mb-1">Person ID</label><input required value={form.person_id} onChange={e => setForm({ ...form, person_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-xs font-medium mb-1">Review Period</label><input required value={form.review_period} onChange={e => setForm({ ...form, review_period: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="FY 2026-27" /></div>
              <div><label className="block text-xs font-medium mb-1">Reviewer Person ID</label><input value={form.reviewer_id} onChange={e => setForm({ ...form, reviewer_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{submitting ? "Creating..." : "Create"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
