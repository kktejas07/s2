"use client";

import { useEffect, useState } from "react";
import {
  Search, Plus, RefreshCw, Calendar, X, Clock, CheckCircle2,
  AlertTriangle, CalendarCheck,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

type Tab = "leave" | "attendance" | "timesheets";

function statusPill(s: string) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800", approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-700", cancelled: "bg-gray-100 text-gray-600",
    present: "bg-green-100 text-green-800", absent: "bg-red-100 text-red-700",
    half_day: "bg-yellow-100 text-yellow-800", on_leave: "bg-blue-100 text-blue-800",
    draft: "bg-gray-100 text-gray-700", submitted: "bg-blue-100 text-blue-800",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[s] || "bg-gray-100 text-gray-600"}`}>{s?.replace(/_/g, " ")}</span>;
}

export default function LeaveAttendancePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("leave");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ leave_type: "casual", from_date: "", to_date: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, [activeTab, search]);

  async function loadData() {
    setLoading(true);
    try {
      let res: any;
      if (activeTab === "leave") res = await api.listLeaves({ search });
      else if (activeTab === "attendance") res = await api.listAttendance({ search });
      else res = await api.listTimesheets({ search });
      setItems(res?.items || res || []);
    } catch { toast.error("Failed to load data"); }
    setLoading(false);
  }

  async function handleApprove(id: string) {
    try {
      await api.approveLeave(id);
      toast.success("Leave approved");
      loadData();
    } catch { toast.error("Failed to approve"); }
  }

  async function handleReject(id: string) {
    try {
      await api.rejectLeave(id);
      toast.success("Leave rejected");
      loadData();
    } catch { toast.error("Failed to reject"); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createLeave(form);
      toast.success("Leave request submitted");
      setShowModal(false);
      loadData();
    } catch { toast.error("Failed to submit leave"); }
    setSubmitting(false);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "leave", label: "Leave Requests" },
    { key: "attendance", label: "Attendance" },
    { key: "timesheets", label: "Timesheets" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarCheck size={28} /> Leave &amp; Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">Leave requests, daily attendance, and timesheets</p>
        </div>
        {activeTab === "leave" && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Apply Leave
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
              {activeTab === "leave" && (
                <tr><th className="px-4 py-3 text-left">Person</th><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-left">From</th><th className="px-4 py-3 text-left">To</th><th className="px-4 py-3 text-left">Days</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Actions</th></tr>
              )}
              {activeTab === "attendance" && (
                <tr><th className="px-4 py-3 text-left">Person</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Check In</th><th className="px-4 py-3 text-left">Check Out</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Region</th></tr>
              )}
              {activeTab === "timesheets" && (
                <tr><th className="px-4 py-3 text-left">Person</th><th className="px-4 py-3 text-left">Week</th><th className="px-4 py-3 text-left">Total Hrs</th><th className="px-4 py-3 text-left">Home Region</th><th className="px-4 py-3 text-left">Working Region</th><th className="px-4 py-3 text-left">Status</th></tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item: any, i: number) => (
                <tr key={item._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {activeTab === "leave" && (<>
                    <td className="px-4 py-3">{item.person_id}</td>
                    <td className="px-4 py-3 capitalize">{item.leave_type}</td>
                    <td className="px-4 py-3">{item.from_date?.slice(0, 10)}</td>
                    <td className="px-4 py-3">{item.to_date?.slice(0, 10)}</td>
                    <td className="px-4 py-3">{item.days || "—"}</td>
                    <td className="px-4 py-3">{statusPill(item.status)}</td>
                    <td className="px-4 py-3">
                      {item.status === "pending" && (
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(item.leave_id || item._id)} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Approve</button>
                          <button onClick={() => handleReject(item.leave_id || item._id)} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Reject</button>
                        </div>
                      )}
                    </td>
                  </>)}
                  {activeTab === "attendance" && (<>
                    <td className="px-4 py-3">{item.person_id}</td>
                    <td className="px-4 py-3">{item.date?.slice(0, 10)}</td>
                    <td className="px-4 py-3">{item.check_in || "—"}</td>
                    <td className="px-4 py-3">{item.check_out || "—"}</td>
                    <td className="px-4 py-3">{statusPill(item.status)}</td>
                    <td className="px-4 py-3">{item.region_code || "—"}</td>
                  </>)}
                  {activeTab === "timesheets" && (<>
                    <td className="px-4 py-3">{item.person_id}</td>
                    <td className="px-4 py-3">{item.week_start?.slice(0, 10)}</td>
                    <td className="px-4 py-3">{item.total_hours ?? "—"}</td>
                    <td className="px-4 py-3">{item.home_region || "—"}</td>
                    <td className="px-4 py-3">{item.working_region || "—"}</td>
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
              <h2 className="text-lg font-bold">Apply for Leave</h2>
              <button type="button" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Leave Type</label>
                <select value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="casual">Casual Leave</option><option value="sick">Sick Leave</option><option value="earned">Earned Leave</option><option value="comp_off">Comp Off</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium mb-1">From</label><input type="date" required value={form.from_date} onChange={e => setForm({ ...form, from_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-xs font-medium mb-1">To</label><input type="date" required value={form.to_date} onChange={e => setForm({ ...form, to_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="col-span-2"><label className="block text-xs font-medium mb-1">Reason</label><textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{submitting ? "Submitting..." : "Submit"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
