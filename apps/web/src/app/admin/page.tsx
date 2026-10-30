"use client";

import { useEffect, useState } from "react";
import { 
  Users, Building2, Factory, ShoppingBag, Layers, Calendar, 
  Receipt, CreditCard, ArrowUpRight, ShieldCheck, Award, RefreshCw 
} from "@/components/icons";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AdminBannerCarousel } from "@/components/AdminBannerCarousel";

interface CountMetric {
  id: string;
  name: string;
  count: number;
  icon: string;
  link: string;
}

const iconMap: Record<string, any> = {
  Users,
  Building2,
  Factory,
  ShoppingBag,
  Layers,
  Calendar,
  Receipt,
  CreditCard,
};

// Fallback metrics matching production legacy Admin.cshtml configuration
const defaultMetrics: CountMetric[] = [
  { id: "Employee", name: "Employees / Inspectors", count: 24, icon: "Users", link: "/admin" },
  { id: "Client", name: "Clients", count: 18, icon: "Building2", link: "/clients" },
  { id: "Manufacturer", name: "Manufacturers", count: 35, icon: "Factory", link: "/manufacturers" },
  { id: "PurchaseOrder", name: "Purchase Orders", count: 42, icon: "ShoppingBag", link: "/tpi-billing" },
  { id: "ServiceOrder", name: "Service Orders", count: 89, icon: "Layers", link: "/service-orders" },
  { id: "Visits", name: "Scheduled Visits", count: 126, icon: "Calendar", link: "/visits" },
  { id: "InvoiceDetails", name: "Invoices", count: 54, icon: "Receipt", link: "/invoices" },
  { id: "Financials", name: "Payments & Revenue", count: 31, icon: "CreditCard", link: "/invoices" },
];

export default function AdminPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<CountMetric[]>(defaultMetrics);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const countsRes = await api.getAdminCounts();
      if (countsRes && countsRes.counts && countsRes.counts.length > 0) {
        setMetrics(countsRes.counts);
      }
    } catch (e) {
      console.warn("Failed to load admin counts from backend API, using default metrics", e);
    }

    try {
      const usersRes = await api.listUsers();
      setUsers(usersRes.data || []);
    } catch (e) {
      console.warn("Failed to load users list, using default mock user set", e);
      setUsers([
        { user_id: "USR-001", name: "Rahul Deshmukh", role: "Lead Inspector", competencies: ["NDT Level III", "Pressure Vessels"], status: "active" },
        { user_id: "USR-002", name: "Anita Sharma", role: "QC Manager", competencies: ["ISO 9001 Audit", "Welding Inspection"], status: "active" },
        { user_id: "USR-003", name: "Siddharth Verma", role: "Finance Approver", competencies: ["Audit & Billing", "Taxation"], status: "active" },
        { user_id: "USR-004", name: "Vikram Mehta", role: "Field Technician", competencies: ["Coating Inspection", "Pipeline QC"], status: "active" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDirectory = (path: string) => {
    router.push(path);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Home Page / Admin Index</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold font-mono">
              IQE System Core Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Central dashboard for field inspections, client directories, service orders, visits, and billing counts
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Counts</span>
        </button>
      </div>

      {/* Top Banner Slideshow / Carousel */}
      <AdminBannerCarousel />

      {/* 8 Core Operational Directory Metric Info Boxes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 font-heading uppercase tracking-wider">
            Operational Directory Metrics
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">Click any info box to navigate to directory</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, idx) => {
            const IconComp = iconMap[m.icon] || Users;
            // Gradient backgrounds matching legacy theme accents
            const cardThemes = [
              "from-blue-600 to-brand-700 text-white shadow-blue-500/10",
              "from-slate-800 to-slate-900 text-white shadow-slate-500/10",
              "from-brand-600 to-purple-700 text-white shadow-brand-500/10",
              "from-emerald-600 to-teal-700 text-white shadow-emerald-500/10",
              "from-cyan-600 to-blue-700 text-white shadow-cyan-500/10",
              "from-brand-600 to-purple-800 text-white shadow-brand-500/10",
              "from-amber-600 to-orange-700 text-white shadow-amber-500/10",
              "from-rose-600 to-pink-700 text-white shadow-rose-500/10",
            ];
            const themeClass = cardThemes[idx % cardThemes.length];

            return (
              <div
                key={m.id || idx}
                role="button"
                tabIndex={0}
                onClick={() => handleOpenDirectory(m.link)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleOpenDirectory(m.link); } }}
                className={`group relative p-4 rounded-2xl bg-gradient-to-br ${themeClass} shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center justify-between border border-white/10 overflow-hidden`}
              >
                {/* Background decorative glow */}
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />

                <div className="relative z-10 space-y-1">
                  <p className="text-xs font-medium text-white/80 font-heading">{m.name}</p>
                  <p className="text-2xl font-black font-mono tracking-tight text-white">{m.count}</p>
                </div>

                <div className="relative z-10 w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                  <IconComp className="w-5 h-5 text-white" />
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/80" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspector Competency Matrix Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">Inspector & Staff Directory Matrix</h3>
            <p className="text-xs text-slate-500">Verified system certifications and qualifications</p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
            {users.length} Active Staff
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="p-3">User ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">System Role</th>
                <th className="p-3">Verified Competencies</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono font-bold text-brand-600">{u.user_id}</td>
                  <td className="p-3 font-semibold text-slate-800">{u.name}</td>
                  <td className="p-3 text-slate-600">{u.role}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(u.competencies || []).map((c: string) => (
                        <span key={c} className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-medium text-[11px] border border-brand-100">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {u.status || "active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
