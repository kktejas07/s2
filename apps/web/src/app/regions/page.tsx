"use client";

import { useEffect, useState } from "react";
import {
  Search, Plus, RefreshCw, MapPin, Building2, X, Clock, CheckCircle2,
  Users, Globe, Edit3, AlertTriangle,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

type Tab = "regions" | "offices" | "settlements" | "loans" | "deputies";

function statusPill(s: string) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800", inactive: "bg-gray-100 text-gray-600",
    pending: "bg-yellow-100 text-yellow-800", settled: "bg-blue-100 text-blue-800",
    open: "bg-yellow-100 text-yellow-800", closed: "bg-green-100 text-green-800",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[s] || "bg-gray-100 text-gray-600"}`}>{s?.replace(/_/g, " ")}</span>;
}

export default function RegionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("regions");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ region_code: "", name: "", rh_person_id: "", tm_person_id: "" });

  useEffect(() => { loadData(); }, [activeTab, search]);

  async function loadData() {
    setLoading(true);
    try {
      let res: any;
      if (activeTab === "regions") res = await api.listRegions();
      else if (activeTab === "offices") res = await api.listRegions();
      else if (activeTab === "settlements") res = await api.listSettlements();
      else if (activeTab === "loans") res = await api.listLoans();
      else res = await api.listDeputies();
      setItems(res?.items || res || []);
    } catch { toast.error("Failed to load data"); }
    setLoading(false);
  }

  async function handleCreateRegion(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createRegion(form);
      toast.success("Region created");
      setShowModal(false);
      setForm({ region_code: "", name: "", rh_person_id: "", tm_person_id: "" });
      loadData();
    } catch { toast.error("Failed to create region"); }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "regions", label: "Regions" },
    { key: "offices", label: "Offices" },
    { key: "settlements", label: "Settlements" },
    { key: "loans", label: "Inspector Loans" },
    { key: "deputies", label: "Deputy Coverage" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe size={28} /> Region Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Multi-region offices, settlements, and inspector loans</p>
        </div>
        {activeTab === "regions" && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Add Region
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
        <button onClick={loadData} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400"><Clock size={24} className="animate-spin mr-2" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No {activeTab} found</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {activeTab === "regions" && (
                <tr><th className="px-4 py-3 text-left">Code</th><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Regional Head</th><th className="px-4 py-3 text-left">Technical Manager</th><th className="px-4 py-3 text-left">Status</th></tr>
              )}
              {activeTab === "offices" && (
                <tr><th className="px-4 py-3 text-left">Office</th><th className="px-4 py-3 text-left">Region</th><th className="px-4 py-3 text-left">Location</th><th className="px-4 py-3 text-left">Head Count</th></tr>
              )}
              {activeTab === "settlements" && (
                <tr><th className="px-4 py-3 text-left">ID</th><th className="px-4 py-3 text-left">From Region</th><th className="px-4 py-3 text-left">To Region</th><th className="px-4 py-3 text-left">Amount</th><th className="px-4 py-3 text-left">Status</th></tr>
              )}
              {activeTab === "loans" && (
                <tr><th className="px-4 py-3 text-left">Inspector</th><th className="px-4 py-3 text-left">Home Region</th><th className="px-4 py-3 text-left">Host Region</th><th className="px-4 py-3 text-left">From</th><th className="px-4 py-3 text-left">Until</th></tr>
              )}
              {activeTab === "deputies" && (
                <tr><th className="px-4 py-3 text-left">Region</th><th className="px-4 py-3 text-left">Absent Role</th><th className="px-4 py-3 text-left">Deputy</th><th className="px-4 py-3 text-left">From</th><th className="px-4 py-3 text-left">Until</th></tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item: any, i: number) => (
                <tr key={item._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {activeTab === "regions" && (<>
                    <td className="px-4 py-3 font-mono font-semibold">{item.region_code}</td>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.rh_person_id || "—"}</td>
                    <td className="px-4 py-3">{item.tm_person_id || "—"}</td>
                    <td className="px-4 py-3">{statusPill(item.status || "active")}</td>
                  </>)}
                  {activeTab === "offices" && (<>
                    <td className="px-4 py-3 font-semibold">{item.name}</td>
                    <td className="px-4 py-3">{item.region_code}</td>
                    <td className="px-4 py-3">{item.city || "—"}</td>
                    <td className="px-4 py-3">{item.head_count ?? "—"}</td>
                  </>)}
                  {activeTab === "settlements" && (<>
                    <td className="px-4 py-3 font-mono text-xs">{item.settlement_id}</td>
                    <td className="px-4 py-3">{item.from_region}</td>
                    <td className="px-4 py-3">{item.to_region}</td>
                    <td className="px-4 py-3 font-mono">₹{(item.amount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{statusPill(item.status)}</td>
                  </>)}
                  {activeTab === "loans" && (<>
                    <td className="px-4 py-3">{item.person_id}</td>
                    <td className="px-4 py-3">{item.home_region}</td>
                    <td className="px-4 py-3">{item.host_region}</td>
                    <td className="px-4 py-3">{item.from_date?.slice(0, 10) || "—"}</td>
                    <td className="px-4 py-3">{item.until_date?.slice(0, 10) || "—"}</td>
                  </>)}
                  {activeTab === "deputies" && (<>
                    <td className="px-4 py-3">{item.region_code}</td>
                    <td className="px-4 py-3">{item.absent_role}</td>
                    <td className="px-4 py-3">{item.deputy_person_id}</td>
                    <td className="px-4 py-3">{item.from_date?.slice(0, 10) || "—"}</td>
                    <td className="px-4 py-3">{item.until_date?.slice(0, 10) || "—"}</td>
                  </>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={handleCreateRegion} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Add Region</h2>
              <button type="button" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Region Code</label>
                <input required value={form.region_code} onChange={e => setForm({ ...form, region_code: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="S" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Name</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="South" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Regional Head (Person ID)</label>
                <input value={form.rh_person_id} onChange={e => setForm({ ...form, rh_person_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Technical Manager (Person ID)</label>
                <input value={form.tm_person_id} onChange={e => setForm({ ...form, tm_person_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
