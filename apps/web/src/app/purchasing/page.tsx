"use client";

import { useEffect, useState } from "react";
import {
  Search, Plus, RefreshCw, X, Clock, CheckCircle2,
  ShoppingCart, AlertTriangle, DollarSign,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

type Tab = "requisitions" | "vendor_payments" | "msme_alerts";

function statusPill(s: string) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700", pending_approval: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-700",
    ordered: "bg-blue-100 text-blue-800", received: "bg-green-100 text-green-800",
    pending_tm_approval: "bg-yellow-100 text-yellow-800", tm_approved: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800", overdue: "bg-red-100 text-red-700",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[s] || "bg-gray-100 text-gray-600"}`}>{s?.replace(/_/g, " ")}</span>;
}

export default function PurchasingPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("requisitions");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ description: "", vendor_name: "", amount: 0, is_msme: false, urgency: "normal" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, [activeTab, search]);

  async function loadData() {
    setLoading(true);
    try {
      let res: any;
      if (activeTab === "requisitions") res = await api.listRequisitions({ search });
      else if (activeTab === "vendor_payments") res = await api.listVendorPayments({ search });
      else res = await api.msmeAlerts();
      setItems(res?.items || res || []);
    } catch { toast.error("Failed to load data"); }
    setLoading(false);
  }

  async function handleApprove(id: string, endpoint: string) {
    try {
      if (endpoint === "requisitions") await api.approveRequisition(id);
      else await api.approveVendorPayment(id);
      toast.success("Approved");
      loadData();
    } catch { toast.error("Approval failed"); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createRequisition(form);
      toast.success("Requisition created");
      setShowModal(false);
      loadData();
    } catch { toast.error("Failed to create requisition"); }
    setSubmitting(false);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "requisitions", label: "Requisitions" },
    { key: "vendor_payments", label: "Vendor Payments" },
    { key: "msme_alerts", label: "MSME Alerts" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart size={28} /> Purchasing &amp; Vendor Payments
          </h1>
          <p className="text-sm text-gray-500 mt-1">Purchase requisitions, vendor payments with TM approval, MSME compliance</p>
        </div>
        {activeTab === "requisitions" && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} /> New Requisition
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
            {t.key === "msme_alerts" && items.length > 0 && activeTab === "msme_alerts" && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">{items.length}</span>
            )}
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
              {activeTab === "requisitions" && (
                <tr><th className="px-4 py-3 text-left">ID</th><th className="px-4 py-3 text-left">Description</th><th className="px-4 py-3 text-left">Vendor</th><th className="px-4 py-3 text-left">Amount</th><th className="px-4 py-3 text-left">MSME</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Actions</th></tr>
              )}
              {activeTab === "vendor_payments" && (
                <tr><th className="px-4 py-3 text-left">ID</th><th className="px-4 py-3 text-left">Vendor</th><th className="px-4 py-3 text-left">Invoice</th><th className="px-4 py-3 text-left">Amount</th><th className="px-4 py-3 text-left">Due Date</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Actions</th></tr>
              )}
              {activeTab === "msme_alerts" && (
                <tr><th className="px-4 py-3 text-left">Vendor</th><th className="px-4 py-3 text-left">Invoice</th><th className="px-4 py-3 text-left">Amount</th><th className="px-4 py-3 text-left">Due Date</th><th className="px-4 py-3 text-left">Overdue Days</th><th className="px-4 py-3 text-left">Urgency</th></tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item: any, i: number) => (
                <tr key={item._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {activeTab === "requisitions" && (<>
                    <td className="px-4 py-3 font-mono text-xs">{item.requisition_id}</td>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3">{item.vendor_name || "—"}</td>
                    <td className="px-4 py-3 font-mono">₹{(item.total_amount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{item.is_msme ? <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">MSME</span> : "—"}</td>
                    <td className="px-4 py-3">{statusPill(item.status)}</td>
                    <td className="px-4 py-3">
                      {item.status === "pending_approval" && (
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(item.requisition_id || item._id, "requisitions")} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Approve</button>
                        </div>
                      )}
                    </td>
                  </>)}
                  {activeTab === "vendor_payments" && (<>
                    <td className="px-4 py-3 font-mono text-xs">{item.payment_id}</td>
                    <td className="px-4 py-3">{item.vendor_name}</td>
                    <td className="px-4 py-3">{item.invoice_ref || "—"}</td>
                    <td className="px-4 py-3 font-mono">₹{(item.amount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{item.due_date?.slice(0, 10) || "—"}</td>
                    <td className="px-4 py-3">{statusPill(item.status)}</td>
                    <td className="px-4 py-3">
                      {item.status === "pending_tm_approval" && (
                        <button onClick={() => handleApprove(item.payment_id || item._id, "vendor-payments")} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">TM Approve</button>
                      )}
                    </td>
                  </>)}
                  {activeTab === "msme_alerts" && (<>
                    <td className="px-4 py-3 font-semibold">{item.vendor_name}</td>
                    <td className="px-4 py-3">{item.invoice_ref}</td>
                    <td className="px-4 py-3 font-mono">₹{(item.amount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{item.due_date?.slice(0, 10)}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{item.overdue_days}d</td>
                    <td className="px-4 py-3">
                      {item.overdue_days > 30 ? <AlertTriangle size={16} className="text-red-500" /> : <Clock size={16} className="text-yellow-500" />}
                    </td>
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
              <h2 className="text-lg font-bold">New Purchase Requisition</h2>
              <button type="button" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-xs font-medium mb-1">Description</label><input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-xs font-medium mb-1">Vendor Name</label><input value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-xs font-medium mb-1">Amount (₹)</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: +e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="msme" checked={form.is_msme} onChange={e => setForm({ ...form, is_msme: e.target.checked })} />
                <label htmlFor="msme" className="text-xs font-medium">MSME Vendor</label>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Urgency</label>
                <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="normal">Normal</option><option value="urgent">Urgent</option>
                </select>
              </div>
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
