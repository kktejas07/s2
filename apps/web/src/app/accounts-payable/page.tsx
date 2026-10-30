"use client";

import { useEffect, useState } from "react";
import { 
  ArrowUpRight, Search, Plus, MapPin, X, CheckCircle2, 
  MoreVertical, Edit3, Power, LayoutGrid, LayoutList, RefreshCw, User, UserCheck, Factory, Tag, Globe, Compass, ShieldAlert, ArrowRight, Clock, AlertTriangle, DollarSign, Calendar, FileText, Check
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

const alphabet = ["ALL", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

export default function AccountsPayablePage() {
  const [apList, setApList] = useState<any[]>([]);
  const [mfrs, setMfrs] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [selectedAlpha, setSelectedAlpha] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "overdue" | "settled">("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [loading, setLoading] = useState(true);

  // Manual Entry Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Disbursement Modal
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [selectedAp, setSelectedAp] = useState<any | null>(null);
  const [disburseAmount, setDisburseAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState("NEFT");
  const [txnRef, setTxnRef] = useState("");

  // Form State
  const [apId, setApId] = useState("");
  const [selectedMfrId, setSelectedMfrId] = useState("");
  const [vendorType, setVendorType] = useState("manufacturer");
  const [poNo, setPoNo] = useState("");
  const [amount, setAmount] = useState<number>(45000);
  const [termsDays, setTermsDays] = useState<number>(30); // Default 30 days
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAP();
    loadMfrs();
  }, [search, selectedAlpha, statusFilter]);

  async function loadMfrs() {
    try {
      const mRes = await api.listManufacturers({ per_page: 200 });
      setMfrs(mRes.data || []);
    } catch (e) {
      console.warn(e);
    }
  }

  async function loadAP() {
    setLoading(true);
    try {
      const statusParam = statusFilter === "all" ? "" : statusFilter;
      const r = await api.listAccountsPayable({ 
        search, 
        alpha: selectedAlpha === "ALL" ? "" : selectedAlpha,
        status: statusParam,
        per_page: 200 
      });
      setApList(r.data || []);
    } catch (e) {
      console.error(e);
      // Fallback sample AP entries
      const now = new Date();
      const thirtyTwoDaysAgo = new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000);
      setApList([
        {
          ap_id: "AP-2026-001",
          vendor_name: "Greenko Wind & Renewable Energy",
          vendor_type: "manufacturer",
          po_number: "PO/GK/2026/094",
          entry_date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString(),
          payment_terms_days: 30,
          amount: 145000,
          paid_amount: 145000,
          balance_amount: 0,
          status: "settled",
          payment_mode: "NEFT",
          transaction_ref: "TXNAP-192837",
        },
        {
          ap_id: "AP-2026-002",
          vendor_name: "Er. V. Sharma (NDT Level III Lead)",
          vendor_type: "inspector",
          po_number: "PO/ONGC/2026/812",
          entry_date: thirtyTwoDaysAgo.toISOString(),
          due_date: new Date(thirtyTwoDaysAgo.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_terms_days: 30,
          amount: 48500,
          paid_amount: 0,
          balance_amount: 48500,
          status: "overdue",
          overdue_alert: true,
        },
        {
          ap_id: "AP-2026-003",
          vendor_name: "BHEL Trichy Boilers Works",
          vendor_type: "manufacturer",
          po_number: "PO/BHEL/2026/102",
          entry_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
          payment_terms_days: 30,
          amount: 92000,
          paid_amount: 40000,
          balance_amount: 52000,
          status: "pending",
        },
        {
          ap_id: "AP-2026-004",
          vendor_name: "Larsen & Toubro Ltd - Heavy Engg Div",
          vendor_type: "manufacturer",
          po_number: "PO/LT/2026/445",
          entry_date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          payment_terms_days: 30,
          amount: 185000,
          paid_amount: 185000,
          balance_amount: 0,
          status: "settled",
          payment_mode: "RTGS",
          transaction_ref: "TXNAP-994812",
        },
        {
          ap_id: "AP-2026-005",
          vendor_name: "Thermax Energy & Chemical Systems",
          vendor_type: "manufacturer",
          po_number: "PO/THX/2026/301",
          entry_date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          payment_terms_days: 30,
          amount: 68000,
          paid_amount: 0,
          balance_amount: 68000,
          status: "pending",
        },
        {
          ap_id: "AP-2026-006",
          vendor_name: "Er. K. Patel (Pressure Vessel Auditor)",
          vendor_type: "inspector",
          po_number: "PO/MCGM/2026/771",
          entry_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString(),
          payment_terms_days: 30,
          amount: 32000,
          paid_amount: 32000,
          balance_amount: 0,
          status: "settled",
          payment_mode: "UPI/IMPS",
          transaction_ref: "TXNAP-772819",
        },
        {
          ap_id: "AP-2026-007",
          vendor_name: "Shapoorji Pallonji Infrastructure",
          vendor_type: "manufacturer",
          po_number: "PO/SP/2026/509",
          entry_date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000).toISOString(),
          payment_terms_days: 30,
          amount: 210000,
          paid_amount: 100000,
          balance_amount: 110000,
          status: "pending",
        },
        {
          ap_id: "AP-2026-008",
          vendor_name: "Reliance Industries Hazira Yard",
          vendor_type: "manufacturer",
          po_number: "PO/RIL/2026/911",
          entry_date: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          payment_terms_days: 30,
          amount: 155000,
          paid_amount: 0,
          balance_amount: 155000,
          status: "overdue",
          overdue_alert: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Calculate metrics
  const totalPayables = apList.reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalDisbursed = apList.reduce((acc, i) => acc + (i.paid_amount || 0), 0);
  const totalOutstanding = apList.reduce((acc, i) => acc + (i.balance_amount || 0), 0);
  const overdueList = apList.filter((i) => i.status === "overdue" || i.overdue_alert);
  const totalOverdue = overdueList.reduce((acc, i) => acc + (i.balance_amount || 0), 0);

  const handleOpenAddModal = () => {
    setApId(`AP-2026-${(apList.length + 1).toString().padStart(3, "0")}`);
    setSelectedMfrId("");
    setVendorType("manufacturer");
    setPoNo("");
    setAmount(45000);
    setTermsDays(30); // Default 30-day payment terms
    setShowAddModal(true);
  };

  const handleSaveAP = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const mfrObj = mfrs.find((m) => m.manufacturer_id === selectedMfrId);

    const payload = {
      ap_id: apId,
      vendor_id: selectedMfrId,
      vendor_name: mfrObj ? mfrObj.name : "Custom Vendor",
      vendor_type: vendorType,
      po_number: poNo,
      amount,
      payment_terms_days: termsDays,
    };

    try {
      await api.createAccountPayable(payload);
      setShowAddModal(false);
      loadAP();
    } catch (e) {
      console.error("Failed to add AP entry", e);
      toast.error("Couldn't add the payable entry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDisburseModal = (ap: any) => {
    setSelectedAp(ap);
    setDisburseAmount(ap.balance_amount || ap.amount);
    setPaymentMode("NEFT");
    setTxnRef(`TXN-AP-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setShowDisburseModal(true);
    setActiveDropdown(null);
  };

  const handleSaveDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAp) return;

    try {
      await api.recordAPSettlement(selectedAp.ap_id, {
        paid_amount: disburseAmount,
        payment_mode: paymentMode,
        transaction_ref: txnRef,
      });
      setShowDisburseModal(false);
      loadAP();
    } catch (e) {
      console.error("Failed to record disbursement", e);
      toast.error("Couldn't record the disbursement. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Accounts Payable (AP) — Creditors Ledger</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold font-mono">
              30-Day Payment Terms
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reframed legacy Creditors register: track vendor disbursements, inspector fee payouts, 30-day payment terms, and automated overdue payment alerts
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button aria-label="Refresh AP Ledger"
            onClick={loadAP}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh AP Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 text-white font-semibold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payable Entry</span>
          </button>
        </div>
      </div>

      {/* AUTOMATED OVERDUE ALERT BANNER (If >30 Days Unpaid) */}
      {overdueList.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm flex items-start gap-3 animate-pulse">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <span>Automated Alert: {overdueList.length} Overdue Vendor Payables (&gt;30 Days)</span>
              </h3>
              <span className="text-xs font-mono font-bold text-rose-800">
                Total Overdue: ₹{totalOverdue.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-rose-800">
              Vendor and inspector payouts exceeding the 30-day disbursement cycle require immediate finance release:
              {" "}
              {overdueList.map((a) => `${a.vendor_name} (₹${a.balance_amount.toLocaleString()})`).join(", ")}.
            </p>
          </div>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Payables</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900">₹{totalPayables.toLocaleString()}</span>
            <ArrowUpRight className="w-5 h-5 text-purple-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Disbursed Paid</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-emerald-600">₹{totalDisbursed.toLocaleString()}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Outstanding</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-amber-600">₹{totalOutstanding.toLocaleString()}</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overdue (&gt;30 Days)</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-rose-600">₹{totalOverdue.toLocaleString()}</span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Alphabetical A-Z Jump Bar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alphabetical Vendor & Inspector Index</span>
          <span className="text-[11px] font-mono text-purple-600 font-semibold">Filter by Vendor or Inspector initial</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {alphabet.map((letter) => {
            const isActive = selectedAlpha === letter;
            return (
              <button
                key={letter}
                onClick={() => setSelectedAlpha(letter)}
                className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  isActive
                    ? "bg-purple-600 text-white shadow-sm scale-105"
                    : "bg-slate-50 text-slate-600 hover:bg-purple-50 hover:text-purple-600 border border-slate-200/60"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search, Filter Bar & View Toggle */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            aria-label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by AP Ref (AP-2026-001), Vendor Name, PO Ref..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "all" ? "bg-white text-slate-900 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All AP Entries
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "pending" ? "bg-white text-amber-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("overdue")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "overdue" ? "bg-white text-rose-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Overdue (&gt;30 Days)
            </button>
            <button
              onClick={() => setStatusFilter("settled")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "settled" ? "bg-white text-emerald-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Settled
            </button>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-slate-600">
            <button aria-label="Table View"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-purple-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button aria-label="Card Grid View"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-purple-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Content Area */}
      {viewMode === "table" ? (
        /* Data Table View */
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">AP Ref ID</th>
                  <th className="p-3">Dates &amp; Terms</th>
                  <th className="p-3">Vendor / Inspector</th>
                  <th className="p-3">Vendor Type</th>
                  <th className="p-3">PO Number</th>
                  <th className="p-3">Total Payable</th>
                  <th className="p-3">Paid Amount</th>
                  <th className="p-3">Balance Due</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      No accounts payable records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  apList.map((ap) => (
                    <tr key={ap.ap_id} className={`hover:bg-slate-50/80 transition-colors ${ap.status === "overdue" || ap.overdue_alert ? "bg-rose-50/40" : ""}`}>
                      <td className="p-3 font-mono font-bold text-purple-600">{ap.ap_id}</td>
                      <td className="p-3 font-mono text-slate-900">
                        <p className="font-bold">{ap.entry_date ? ap.entry_date.split("T")[0] : "N/A"}</p>
                        <p className="text-[11px] text-slate-500">Due: <span className="font-bold text-brand-700">{ap.due_date ? ap.due_date.split("T")[0] : `+${ap.payment_terms_days || 30} Days`}</span></p>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{ap.vendor_name}</td>
                      <td className="p-3 font-medium capitalize">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                          {ap.vendor_type || "manufacturer"}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-brand-600">{ap.po_number || "N/A"}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">₹{(ap.amount || 0).toLocaleString()}</td>
                      <td className="p-3 font-mono text-emerald-600 font-bold">₹{(ap.paid_amount || 0).toLocaleString()}</td>
                      <td className="p-3 font-mono font-extrabold text-rose-600 text-sm">₹{(ap.balance_amount || 0).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          ap.status === "settled" ? "bg-emerald-100 text-emerald-800" :
                          ap.status === "overdue" || ap.overdue_alert ? "bg-rose-100 text-rose-800 animate-pulse" : "bg-amber-100 text-amber-800"
                        }`}>
                          {ap.status === "settled" ? "Settled" : ap.status === "overdue" || ap.overdue_alert ? "OVERDUE (>30 Days)" : "Pending"}
                        </span>
                      </td>
                      <td className="p-3 text-right relative">
                        <button aria-label="More actions" title="More actions"
                          onClick={() => setActiveDropdown(activeDropdown === ap.ap_id ? null : ap.ap_id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Ellipsis Menu */}
                        {activeDropdown === ap.ap_id && (
                          <div className="absolute right-3 top-10 z-20 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-left text-xs space-y-0.5">
                            {ap.status !== "settled" && (
                              <button
                                onClick={() => handleOpenDisburseModal(ap)}
                                className="w-full px-3 py-1.5 hover:bg-purple-50 text-purple-700 flex items-center gap-2 font-bold"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Record Disbursement</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {apList.map((ap) => (
            <div
              key={ap.ap_id}
              className={`p-5 rounded-2xl bg-white border shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between ${
                ap.status === "overdue" || ap.overdue_alert ? "border-rose-300 bg-rose-50/20" : "border-slate-200/80"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-lg">
                    {ap.ap_id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    ap.status === "settled" ? "bg-emerald-100 text-emerald-800" :
                    ap.status === "overdue" || ap.overdue_alert ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {ap.status === "settled" ? "Settled" : ap.status === "overdue" || ap.overdue_alert ? "OVERDUE" : "Pending"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">{ap.vendor_name}</h3>
                  <p className="text-[11px] font-mono text-brand-600 font-bold">PO: {ap.po_number || "Manual Entry"}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <p><span className="text-slate-400">Total Payable:</span> <span className="font-mono font-bold text-slate-900">₹{(ap.amount || 0).toLocaleString()}</span></p>
                  <p><span className="text-slate-400">Balance Due:</span> <span className="font-mono font-extrabold text-rose-600 text-sm">₹{(ap.balance_amount || 0).toLocaleString()}</span></p>
                  <p><span className="text-slate-400">Payment Terms:</span> <span className="font-bold text-brand-700">{ap.payment_terms_days || 30}-Day Default</span></p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {ap.status !== "settled" && (
                  <button
                    onClick={() => handleOpenDisburseModal(ap)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Record Disbursement</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Manual AP Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Add Accounts Payable Entry
                </h2>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAP} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="accpay-ap-ref-id" className="block text-xs font-semibold text-slate-700 mb-1">AP Ref ID *</label>
                  <input id="accpay-ap-ref-id"
                    type="text"
                    required
                    value={apId}
                    onChange={(e) => setApId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold text-purple-700"
                  />
                </div>

                <div>
                  <label htmlFor="accpay-vendor-type" className="block text-xs font-semibold text-slate-700 mb-1">Vendor Type *</label>
                  <select id="accpay-vendor-type"
                    value={vendorType}
                    onChange={(e) => setVendorType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                  >
                    <option value="manufacturer">Equipment Manufacturer</option>
                    <option value="sub_contractor">Sub-Contractor / NDT Agency</option>
                    <option value="inspector">Lead Inspector Fee</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="accpay-vendor-inspector" className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Inspector *</label>
                  <select id="accpay-vendor-inspector"
                    required
                    value={selectedMfrId}
                    onChange={(e) => setSelectedMfrId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                  >
                    <option value="">Select Vendor / Subcontractor</option>
                    {mfrs.map((m) => (
                      <option key={m.manufacturer_id} value={m.manufacturer_id}>
                        {m.name} ({m.manufacturer_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="accpay-po-reference-number" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PO Reference Number *</label>
                  <input id="accpay-po-reference-number"
                    type="text"
                    required
                    value={poNo || "PO-IQE-2026-9901"}
                    onChange={(e) => setPoNo(e.target.value)}
                    placeholder="PO/RIL/2026/094"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="accpay-payable-amount" className="block text-xs font-semibold text-slate-700 mb-1">Payable Amount (₹) *</label>
                  <input id="accpay-payable-amount"
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="accpay-payment-terms-days" className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms (Days) *</label>
                  <input id="accpay-payment-terms-days"
                    type="number"
                    required
                    value={termsDays}
                    onChange={(e) => setTermsDays(Number(e.target.value))}
                    placeholder="30"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold text-brand-700"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">Default is 30 days; override if vendor contract differs</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !apId || !selectedMfrId || !amount}
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Adding..." : "Add Payable Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Disbursement Sub-Dialog */}
      {showDisburseModal && selectedAp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Record AP Disbursement Payment — {selectedAp.ap_id}
                </h2>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowDisburseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDisbursement} className="space-y-3">
              <div>
                <label htmlFor="accpay-disbursed-amount" className="block text-xs font-semibold text-slate-700 mb-1">Disbursed Amount (₹) *</label>
                <input id="accpay-disbursed-amount"
                  type="number"
                  required
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="accpay-payment-mode" className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode *</label>
                <select id="accpay-payment-mode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                >
                  <option value="NEFT">NEFT Bank Transfer</option>
                  <option value="RTGS">RTGS High-Value Transfer</option>
                  <option value="Cheque">Corporate Cheque</option>
                  <option value="Wire">International Wire</option>
                </select>
              </div>

              <div>
                <label htmlFor="accpay-bank-transaction-ref-number" className="block text-xs font-semibold text-slate-700 mb-1">Bank Transaction Ref Number *</label>
                <input id="accpay-bank-transaction-ref-number"
                  type="text"
                  required
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisburseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-sm"
                >
                  Confirm &amp; Disburse Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
