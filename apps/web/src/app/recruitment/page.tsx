"use client";

import { useEffect, useState } from "react";
import {
  Search, Plus, RefreshCw, Users, X, Clock, CheckCircle2,
  UserCheck, AlertTriangle, Briefcase, FileText, Calendar,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

type Tab = "requests" | "candidates" | "interviews" | "offers" | "induction";

function statusPill(s: string) {
  const colors: Record<string, string> = {
    pending_budget: "bg-yellow-100 text-yellow-800", budget_approved: "bg-blue-100 text-blue-800",
    sourcing: "bg-purple-100 text-purple-800", filled: "bg-green-100 text-green-800",
    shortlisted: "bg-blue-100 text-blue-800", rejected: "bg-red-100 text-red-700",
    hired: "bg-green-100 text-green-800", scheduled: "bg-blue-100 text-blue-800",
    passed: "bg-green-100 text-green-800", failed: "bg-red-100 text-red-700",
    draft: "bg-gray-100 text-gray-700", sent: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800", declined: "bg-red-100 text-red-700",
    in_progress: "bg-yellow-100 text-yellow-800", completed: "bg-green-100 text-green-800",
    new: "bg-gray-100 text-gray-700",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[s] || "bg-gray-100 text-gray-600"}`}>{s?.replace(/_/g, " ")}</span>;
}

export default function RecruitmentPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("requests");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ position_title: "", department: "", region_code: "", justification: "", count: 1 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, [activeTab, search]);

  async function loadData() {
    setLoading(true);
    try {
      let res: any;
      if (activeTab === "requests") res = await api.listManpowerRequests({ search });
      else if (activeTab === "candidates") res = await api.listCandidates({ search });
      else if (activeTab === "interviews") res = await api.listInterviews();
      else if (activeTab === "offers") res = await api.listOffers();
      else res = await api.listManpowerRequests();
      setItems(res?.items || res || []);
    } catch { toast.error("Failed to load data"); }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createManpowerRequest(form);
      toast.success("Manpower request created");
      setShowModal(false);
      loadData();
    } catch { toast.error("Failed to create request"); }
    setSubmitting(false);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "requests", label: "Manpower Requests" },
    { key: "candidates", label: "Candidates" },
    { key: "interviews", label: "Interviews" },
    { key: "offers", label: "Offers" },
    { key: "induction", label: "Induction" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={28} /> Recruitment Pipeline
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manpower requests, candidates, interviews, offers &amp; induction</p>
        </div>
        {activeTab === "requests" && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} /> New Request
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
              {activeTab === "requests" && (
                <tr><th className="px-4 py-3 text-left">ID</th><th className="px-4 py-3 text-left">Position</th><th className="px-4 py-3 text-left">Department</th><th className="px-4 py-3 text-left">Region</th><th className="px-4 py-3 text-left">Count</th><th className="px-4 py-3 text-left">Status</th></tr>
              )}
              {activeTab === "candidates" && (
                <tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Position</th><th className="px-4 py-3 text-left">Source</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Status</th></tr>
              )}
              {activeTab === "interviews" && (
                <tr><th className="px-4 py-3 text-left">Candidate</th><th className="px-4 py-3 text-left">Interviewer</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Overall</th><th className="px-4 py-3 text-left">Result</th></tr>
              )}
              {activeTab === "offers" && (
                <tr><th className="px-4 py-3 text-left">Candidate</th><th className="px-4 py-3 text-left">Form</th><th className="px-4 py-3 text-left">CTC</th><th className="px-4 py-3 text-left">Joining Date</th><th className="px-4 py-3 text-left">Status</th></tr>
              )}
              {activeTab === "induction" && (
                <tr><th className="px-4 py-3 text-left">Person</th><th className="px-4 py-3 text-left">Started</th><th className="px-4 py-3 text-left">Items Done</th><th className="px-4 py-3 text-left">Confidentiality Signed</th><th className="px-4 py-3 text-left">Status</th></tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item: any, i: number) => (
                <tr key={item._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {activeTab === "requests" && (<>
                    <td className="px-4 py-3 font-mono text-xs">{item.request_id}</td>
                    <td className="px-4 py-3 font-semibold">{item.position_title}</td>
                    <td className="px-4 py-3">{item.department || "—"}</td>
                    <td className="px-4 py-3">{item.region_code || "—"}</td>
                    <td className="px-4 py-3">{item.count}</td>
                    <td className="px-4 py-3">{statusPill(item.status)}</td>
                  </>)}
                  {activeTab === "candidates" && (<>
                    <td className="px-4 py-3 font-semibold">{item.full_name}</td>
                    <td className="px-4 py-3">{item.position_applied}</td>
                    <td className="px-4 py-3">{item.source || "—"}</td>
                    <td className="px-4 py-3">{item.email || "—"}</td>
                    <td className="px-4 py-3">{statusPill(item.status)}</td>
                  </>)}
                  {activeTab === "interviews" && (<>
                    <td className="px-4 py-3">{item.candidate_id}</td>
                    <td className="px-4 py-3">{item.interviewer_id}</td>
                    <td className="px-4 py-3">{item.interview_date?.slice(0, 10) || "—"}</td>
                    <td className="px-4 py-3">{item.overall_score ?? "—"}/10</td>
                    <td className="px-4 py-3">{statusPill(item.result || item.status)}</td>
                  </>)}
                  {activeTab === "offers" && (<>
                    <td className="px-4 py-3">{item.candidate_id}</td>
                    <td className="px-4 py-3">{item.form_type || "FL-01"}</td>
                    <td className="px-4 py-3 font-mono">₹{(item.ctc || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{item.joining_date?.slice(0, 10) || "—"}</td>
                    <td className="px-4 py-3">{statusPill(item.status)}</td>
                  </>)}
                  {activeTab === "induction" && (<>
                    <td className="px-4 py-3">{item.person_id}</td>
                    <td className="px-4 py-3">{item.started_on?.slice(0, 10) || "—"}</td>
                    <td className="px-4 py-3">{item.items?.filter((it: any) => it.completed).length || 0}/{item.items?.length || 0}</td>
                    <td className="px-4 py-3">{item.confidentiality_signed ? <CheckCircle2 size={16} className="text-green-600" /> : "—"}</td>
                    <td className="px-4 py-3">{statusPill(item.status)}</td>
                  </>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">New Manpower Request</h2>
              <button type="button" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Position Title</label>
                <input required value={form.position_title} onChange={e => setForm({ ...form, position_title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Department</label>
                <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Region</label>
                <select value={form.region_code} onChange={e => setForm({ ...form, region_code: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select</option>
                  <option value="N">North</option><option value="S">South</option><option value="E">East</option><option value="W">West</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Count</label>
                <input type="number" min={1} required value={form.count} onChange={e => setForm({ ...form, count: +e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Justification</label>
                <textarea value={form.justification} onChange={e => setForm({ ...form, justification: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {submitting ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
