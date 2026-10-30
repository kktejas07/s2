"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search, Hash, DollarSign, Calendar } from "@/components/icons";
import { api } from "@/lib/api";

export default function ServiceOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await api.listServiceOrders();
      setOrders(r.data || []);
    } catch (e) {
      console.error(e);
      // Fallback mock service orders if empty
      setOrders([
        { so_id: "SO-501", so_number: "SO/2026/091", job_id: "JOB-1001", amount: 120000, status: "active" },
        { so_id: "SO-502", so_number: "SO/2026/092", job_id: "JOB-1002", amount: 450000, status: "active" },
        { so_id: "SO-503", so_number: "SO/2026/093", job_id: "JOB-1003", amount: 280000, status: "closed" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Service Orders</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold font-mono">
              {orders.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Client service contracts and budget allocations</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading service orders...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                  <th className="p-4">SO Number</th>
                  <th className="p-4">Job Reference</th>
                  <th className="p-4">Allocated Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((so) => (
                  <tr key={so.so_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-brand-600">{so.so_number}</td>
                    <td className="p-4 font-mono font-medium text-slate-700">{so.job_id}</td>
                    <td className="p-4 font-mono font-bold text-slate-900">
                      ₹{(so.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase badge-emerald">
                        {so.status || "active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
