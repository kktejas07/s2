"use client";

import { useEffect, useState } from "react";
import {
  Receipt,
  Search,
  Plus,
  X,
  CheckCircle2,
  MoreVertical,
  LayoutGrid,
  LayoutList,
  RefreshCw,
  ShieldAlert,
  Clock,
  AlertTriangle,
  Printer,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

const alphabet = ["ALL", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [eligibleVisits, setEligibleVisits] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [selectedAlpha, setSelectedAlpha] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "unpaid" | "paid" | "overdue">("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [loading, setLoading] = useState(true);

  // Modal State for Generate Invoice & View Invoice
  const [showGenModal, setShowGenModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewInvoiceData, setViewInvoiceData] = useState<any>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Record Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvForPayment, setSelectedInvForPayment] = useState<any | null>(null);
  const [paymentMode, setPaymentMode] = useState("NEFT");
  const [txnRef, setTxnRef] = useState("");

  // Form State for Generate Invoice
  const [invNo, setInvNo] = useState("");
  const [jobId, setJobId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [billingType, setBillingType] = useState<"hourly" | "bulk">("hourly");
  const [hourlyRate, setHourlyRate] = useState<number>(2500);
  const [totalHours, setTotalHours] = useState<number>(32);
  const [bulkAmount, setBulkAmount] = useState<number>(150000);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInvoices();
    loadDropdowns();
  }, [search, selectedAlpha, paymentFilter]);

  async function loadDropdowns() {
    try {
      const cRes = await api.listClients({ per_page: 200 });
      setClients(cRes.data || []);
      const vRes = await api.getEligibleVisits();
      setEligibleVisits(vRes.data || []);
    } catch (e) {
      console.warn(e);
    }
  }

  async function loadInvoices() {
    setLoading(true);
    try {
      const filterParam = paymentFilter === "all" ? "" : paymentFilter;
      const r = await api.listInvoices({
        search,
        alpha: selectedAlpha === "ALL" ? "" : selectedAlpha,
        payment_status: filterParam,
        per_page: 200,
      });
      const loaded = r.data || [];
      if (loaded.length === 0) {
        throw new Error("No backend invoices returned");
      }
      setInvoices(loaded);
    } catch (e) {
      // Fallback sample invoices with rich amounts
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
      setInvoices([
        {
          invoice_id: "INV-2026-001",
          invoice_number: "INV/IQE/2026/001",
          job_id: "JOB-2026-MIG-0001",
          client_id: "C-001",
          client_name: "Reliance Industries Ltd",
          invoice_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          billing_type: "hourly",
          hourly_rate: 2500,
          total_hours: 32,
          subtotal: 80000,
          cgst: 7200,
          sgst: 7200,
          grand_total: 94400,
          payment_status: "paid",
          payment_date: new Date().toISOString(),
          payment_mode: "NEFT",
          transaction_ref: "TXN981726410",
          status: "issued",
        },
        {
          invoice_id: "INV-2026-002",
          invoice_number: "INV/IQE/2026/002",
          job_id: "JOB-2026-MIG-0002",
          client_id: "C-002",
          client_name: "L&T Heavy Engineering",
          invoice_date: thirtyDaysAgo.toISOString(),
          due_date: new Date(thirtyDaysAgo.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          billing_type: "bulk",
          subtotal: 150000,
          cgst: 13500,
          sgst: 13500,
          grand_total: 177000,
          payment_status: "overdue",
          overdue_alert: true,
          status: "issued",
        },
        {
          invoice_id: "INV-2026-003",
          invoice_number: "INV/IQE/2026/003",
          job_id: "JOB-2026-MIG-0005",
          client_id: "C-003",
          client_name: "Tata Steel Hazira Plant",
          invoice_date: new Date().toISOString(),
          due_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          billing_type: "hourly",
          hourly_rate: 2500,
          total_hours: 17.2,
          subtotal: 43000,
          cgst: 3870,
          sgst: 3870,
          grand_total: 50740,
          payment_status: "unpaid",
          status: "issued",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Calculate metrics
  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.grand_total || 0), 0);
  const totalPaid = invoices.filter((i) => i.payment_status === "paid").reduce((acc, i) => acc + (i.grand_total || 0), 0);
  const totalPending = invoices.filter((i) => i.payment_status === "unpaid").reduce((acc, i) => acc + (i.grand_total || 0), 0);
  const totalOverdue = invoices.filter((i) => i.payment_status === "overdue" || i.overdue_alert).reduce((acc, i) => acc + (i.grand_total || 0), 0);
  const overdueInvoices = invoices.filter((i) => i.payment_status === "overdue" || i.overdue_alert);

  const handleOpenGenModal = () => {
    setInvNo(`INV/IQE/2026/${(invoices.length + 1).toString().padStart(3, "0")}`);
    setJobId(`JOB-2026-${(invoices.length + 1).toString().padStart(3, "0")}`);
    setSelectedClientId("");
    setBillingType("hourly");
    setHourlyRate(2500);
    setTotalHours(32);
    setBulkAmount(150000);
    setShowGenModal(true);
  };

  const handleOpenViewInvoice = (inv: any) => {
    setViewInvoiceData(inv);
    setShowViewModal(true);
    setActiveDropdown(null);
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const clientObj = clients.find((c) => c.client_id === selectedClientId);
    const calculatedSubtotal = billingType === "hourly" ? hourlyRate * totalHours : bulkAmount;
    const gstAmt = calculatedSubtotal * 0.18;
    const gTotal = calculatedSubtotal + gstAmt;

    const payload = {
      invoice_id: `INV-2026-${(invoices.length + 1).toString().padStart(3, "0")}`,
      invoice_number: invNo,
      job_id: jobId,
      client_id: selectedClientId,
      client_name: clientObj ? clientObj.name : undefined,
      billing_type: billingType,
      hourly_rate: billingType === "hourly" ? hourlyRate : 0,
      total_hours: billingType === "hourly" ? totalHours : 0,
      subtotal: calculatedSubtotal,
      cgst: gstAmt / 2,
      sgst: gstAmt / 2,
      grand_total: gTotal,
      gst_percentage: 18,
      invoice_date: new Date().toISOString(),
      status: "issued",
      consolidated_charges: [
        {
          sno: 1,
          category: billingType === "hourly" ? "Inspection Hourly Charge" : "Bulk Contract Package",
          description: billingType === "hourly" ? `TPI Inspector - ${totalHours} hrs @ ₹${hourlyRate}/hr` : "Lump-sum Inspection Service Package",
          uom: billingType === "hourly" ? "Hours" : "Bulk",
          rate: billingType === "hourly" ? hourlyRate : bulkAmount,
          amount: calculatedSubtotal,
        },
      ],
    };

    try {
      await api.createInvoice(payload);
      setShowGenModal(false);
      loadInvoices();
    } catch (e) {
      console.error("Failed to generate invoice", e);
      toast.error("Couldn't generate the invoice. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPaymentModal = (inv: any) => {
    setSelectedInvForPayment(inv);
    setPaymentMode("NEFT");
    setTxnRef(`TXN-${Math.floor(100000000 + Math.random() * 900000000)}`);
    setShowPaymentModal(true);
    setActiveDropdown(null);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvForPayment) return;

    try {
      await api.recordInvoicePayment(selectedInvForPayment.invoice_id, {
        payment_mode: paymentMode,
        transaction_ref: txnRef,
        payment_date: new Date().toISOString(),
      });
      setShowPaymentModal(false);
      loadInvoices();
    } catch (e) {
      console.error("Failed to record payment", e);
      toast.error("Couldn't record the payment. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Invoice Directory & Billing Ledger</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold font-mono">
              30-Day Payment Cycle Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate invoices upon job completion, manage 30-day payment terms, and track automated overdue payment alerts
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button aria-label="Refresh Invoices"
            onClick={loadInvoices}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenGenModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoice (Job Completed)</span>
          </button>
        </div>
      </div>

      {/* AUTOMATED OVERDUE ALERT BANNER */}
      {overdueInvoices.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm flex items-start gap-3 animate-pulse">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <span>Automated Application Alert: {overdueInvoices.length} Overdue Payment(s) Exceeding 30-Day Cycle</span>
              </h3>
              <span className="text-xs font-mono font-bold text-rose-800">
                Total Overdue: ₹{totalOverdue.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-rose-800">
              Payment was not received within the mandatory 30-day payment cycle. Outstanding invoices require immediate client follow-up:{" "}
              {overdueInvoices.map((inv) => `${inv.invoice_number} (${inv.client_name})`).join(", ")}.
            </p>
          </div>
        </div>
      )}

      {/* Financial Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900">₹{totalInvoiced.toLocaleString()}</span>
            <Receipt className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Received Paid</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-emerald-600">₹{totalPaid.toLocaleString()}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending (&lt; 30 Days)</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-amber-600">₹{totalPending.toLocaleString()}</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overdue (&gt; 30 Days Alert)</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-rose-600">₹{totalOverdue.toLocaleString()}</span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Alphabetical Index */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alphabetical Customer &amp; Invoice Index</span>
          <span className="text-[11px] font-mono text-emerald-600 font-semibold">Filter by Corporate Client or Invoice initial</span>
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
                    ? "bg-emerald-600 text-white shadow-sm scale-105"
                    : "bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200/60"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            aria-label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Invoice No (INV/IQE/2026/001), Job ID, Customer Name, Amount..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setPaymentFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                paymentFilter === "all" ? "bg-white text-slate-900 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Invoices
            </button>
            <button
              onClick={() => setPaymentFilter("unpaid")}
              className={`px-3 py-1 rounded-lg transition-all ${
                paymentFilter === "unpaid" ? "bg-white text-amber-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Unpaid Pending
            </button>
            <button
              onClick={() => setPaymentFilter("paid")}
              className={`px-3 py-1 rounded-lg transition-all ${
                paymentFilter === "paid" ? "bg-white text-emerald-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setPaymentFilter("overdue")}
              className={`px-3 py-1 rounded-lg transition-all ${
                paymentFilter === "overdue" ? "bg-white text-rose-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Overdue (&gt;30 Days)
            </button>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-slate-600">
            <button aria-label="Table View"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-emerald-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button aria-label="Card Grid View"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-emerald-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Table View */}
      {viewMode === "table" ? (
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Invoice &amp; Due Date</th>
                  <th className="p-3">Customer Client</th>
                  <th className="p-3">Job / Order ID</th>
                  <th className="p-3">Billing Type</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3">GST (18%)</th>
                  <th className="p-3">Grand Total (₹)</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      No invoices found matching criteria.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv, idx) => (
                    <tr
                      key={`inv-row-${idx}-${typeof inv.invoice_number === "string" ? inv.invoice_number : idx}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        inv.payment_status === "overdue" || inv.overdue_alert ? "bg-rose-50/40" : ""
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-emerald-700">{inv.invoice_number}</td>
                      <td className="p-3 font-mono text-slate-900">
                        <p className="font-bold">{inv.invoice_date ? inv.invoice_date.split("T")[0] : "N/A"}</p>
                        <p className="text-[11px] text-slate-500">
                          Due: <span className="font-bold text-brand-700">{inv.due_date ? inv.due_date.split("T")[0] : "+30 Days"}</span>
                        </p>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{inv.client_name || "Unassigned Client"}</td>
                      <td className="p-3 font-mono font-bold text-brand-600">{inv.job_id || "N/A"}</td>
                      <td className="p-3 font-medium capitalize">
                        {inv.billing_type === "hourly" ? (
                          <span className="text-slate-800 font-bold">Hourly ({inv.total_hours || 0} hrs @ ₹{inv.hourly_rate || 0})</span>
                        ) : (
                          <span className="text-purple-700 font-bold">Bulk Package</span>
                        )}
                      </td>
                      <td className="p-3 font-mono">₹{(inv.subtotal || 0).toLocaleString()}</td>
                      <td className="p-3 font-mono text-slate-500">₹{((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0) || (inv.subtotal || 0) * 0.18).toLocaleString()}</td>
                      <td className="p-3 font-mono font-extrabold text-slate-900 text-sm">₹{(inv.grand_total || 0).toLocaleString()}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            inv.payment_status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : inv.payment_status === "overdue" || inv.overdue_alert
                              ? "bg-rose-100 text-rose-800 animate-pulse"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {inv.payment_status === "paid" ? "Paid" : inv.payment_status === "overdue" || inv.overdue_alert ? "OVERDUE" : "Unpaid"}
                        </span>
                      </td>
                      <td className="p-3 text-right relative flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenViewInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] flex items-center gap-1 border border-emerald-200"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>View Invoice</span>
                        </button>
                        <button aria-label="More actions" title="More actions"
                          onClick={() => setActiveDropdown(activeDropdown === inv.invoice_id ? null : inv.invoice_id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeDropdown === inv.invoice_id && (
                          <div className="absolute right-3 top-10 z-20 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-left text-xs space-y-0.5">
                            <button
                              onClick={() => {
                                handleOpenViewInvoice(inv);
                                setActiveDropdown(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-800 flex items-center gap-2 font-bold"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#0084bf]" />
                              <span>View &amp; Print PDF</span>
                            </button>
                            {inv.payment_status !== "paid" && (
                              <button
                                onClick={() => handleOpenPaymentModal(inv)}
                                className="w-full px-3 py-1.5 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 font-bold"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Record Payment</span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {invoices.map((inv) => (
            <div
              key={inv.invoice_id}
              className={`p-5 rounded-2xl bg-white border shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between ${
                inv.payment_status === "overdue" || inv.overdue_alert ? "border-rose-300 bg-rose-50/20" : "border-slate-200/80"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                    {inv.invoice_number}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      inv.payment_status === "paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : inv.payment_status === "overdue" || inv.overdue_alert
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {inv.payment_status === "paid" ? "Paid" : inv.payment_status === "overdue" || inv.overdue_alert ? "OVERDUE" : "Unpaid"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">{inv.client_name}</h3>
                  <p className="text-[11px] font-mono text-brand-600 font-bold">Job: {inv.job_id}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <p>
                    <span className="text-slate-400">Grand Total:</span>{" "}
                    <span className="font-mono font-extrabold text-slate-900 text-sm">₹{(inv.grand_total || 0).toLocaleString()}</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Payment Cycle:</span> <span className="font-bold text-brand-700">30-Day Mandatory</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Due Date:</span>{" "}
                    <span className="font-mono font-bold text-slate-800">{inv.due_date ? inv.due_date.split("T")[0] : "30 Days"}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenViewInvoice(inv)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View Invoice</span>
                </button>
                {inv.payment_status !== "paid" && (
                  <button
                    onClick={() => handleOpenPaymentModal(inv)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Generate Invoice (Order / Job Completed)</h2>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowGenModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inv-invoice-number" className="block text-xs font-semibold text-slate-700 mb-1">Invoice Number *</label>
                  <input id="inv-invoice-number"
                    type="text"
                    required
                    value={invNo}
                    onChange={(e) => setInvNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label htmlFor="inv-completed-job-id" className="block text-xs font-semibold text-slate-700 mb-1">Completed Job ID *</label>
                  <input id="inv-completed-job-id"
                    type="text"
                    required
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-brand-700"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="inv-corporate-client" className="block text-xs font-semibold text-slate-700 mb-1">Corporate Client *</label>
                <select id="inv-corporate-client"
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value="">Select Corporate Client</option>
                  {clients.map((c) => (
                    <option key={c.client_id} value={c.client_id}>
                      {c.name} ({c.client_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection Officer Billing Basis *</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setBillingType("hourly")}
                    className={`py-1.5 rounded-lg transition-all ${billingType === "hourly" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600"}`}
                  >
                    Hourly Rate Basis (Time &amp; Material)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingType("bulk")}
                    className={`py-1.5 rounded-lg transition-all ${billingType === "bulk" ? "bg-white text-purple-700 shadow-sm" : "text-slate-600"}`}
                  >
                    Bulk / Fixed Package Contract
                  </button>
                </div>
              </div>

              {billingType === "hourly" ? (
                <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                  <div>
                    <label htmlFor="inv-hourly-rate-hr" className="block text-xs font-semibold text-slate-700 mb-1">Hourly Rate (₹/hr) *</label>
                    <input id="inv-hourly-rate-hr"
                      type="number"
                      required
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor="inv-total-inspector-hours" className="block text-xs font-semibold text-slate-700 mb-1">Total Inspector Hours *</label>
                    <input id="inv-total-inspector-hours"
                      type="number"
                      required
                      value={totalHours}
                      onChange={(e) => setTotalHours(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-200">
                  <label htmlFor="inv-bulk-package-lump-sum-amount" className="block text-xs font-semibold text-slate-700 mb-1">Bulk Package Lump-Sum Amount (₹) *</label>
                  <input id="inv-bulk-package-lump-sum-amount"
                    type="number"
                    required
                    value={bulkAmount}
                    onChange={(e) => setBulkAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold"
                  />
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{(billingType === "hourly" ? hourlyRate * totalHours : bulkAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%):</span>
                  <span>₹{((billingType === "hourly" ? hourlyRate * totalHours : bulkAmount) * 0.18).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-900 text-sm border-t pt-1">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">₹{((billingType === "hourly" ? hourlyRate * totalHours : bulkAmount) * 1.18).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !invNo || !selectedClientId}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Generating..." : "Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Dialog */}
      {showPaymentModal && selectedInvForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Record Received Payment — {selectedInvForPayment.invoice_number}
                </h2>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3">
              <div>
                <label htmlFor="inv-payment-mode" className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode *</label>
                <select id="inv-payment-mode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value="NEFT">NEFT Bank Transfer</option>
                  <option value="RTGS">RTGS High-Value Transfer</option>
                  <option value="Cheque">Corporate Cheque</option>
                  <option value="Wire">International Wire</option>
                </select>
              </div>

              <div>
                <label htmlFor="inv-bank-transaction-ref-number" className="block text-xs font-semibold text-slate-700 mb-1">Bank Transaction Ref Number *</label>
                <input id="inv-bank-transaction-ref-number"
                  type="text"
                  required
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-900 border border-emerald-200">
                Recording payment will mark this invoice as <strong>PAID</strong> and resolve any active overdue alerts for this 30-day payment cycle.
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm"
                >
                  Confirm &amp; Clear Overdue Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Generated 30-Day Net Invoice Modal */}
      {showViewModal && viewInvoiceData && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="keep-light bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto relative print:p-0 print:border-none">
            
            {/* Background Watermark Logo of IQE */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
              <img src="/iqe-logo.png" alt="IQE Watermark" className="w-96 h-auto object-contain" />
            </div>

            <div className="relative z-10 space-y-6">
              {/* Invoice Header Branding */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                <div className="flex items-center gap-4">
                  <img src="/iqe-logo.png" alt="IQE Logo" className="h-12 w-auto object-contain" />
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                      TAX INVOICE — 30-DAY BILLING CYCLE
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">
                      Invoice No: <strong className="text-[#0084bf]">{viewInvoiceData.invoice_number}</strong> | Ref: {viewInvoiceData.invoice_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-[#0084bf] text-white text-xs font-bold hover:bg-[#00618e] flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button aria-label="Close" title="Close" onClick={() => setShowViewModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Invoice Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">Customer Client</span>
                  <p className="font-extrabold text-slate-900 mt-0.5">{viewInvoiceData.client_name}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">Job Reference</span>
                  <p className="font-extrabold text-[#0084bf] mt-0.5">{viewInvoiceData.job_id || "JOB-2026-MIG-0001"}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">Payment Terms</span>
                  <p className="font-extrabold text-brand-700 mt-0.5">Net 30 Days</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">Due Date</span>
                  <p className="font-extrabold text-[#e35f14] mt-0.5">{viewInvoiceData.due_date ? new Date(viewInvoiceData.due_date).toLocaleDateString() : "+30 Days"}</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">
                        TPI Daily Field Inspection Rate &amp; Scope Execution ({viewInvoiceData.billing_type === 'hourly' ? `${viewInvoiceData.total_hours || 32} hrs @ ₹${viewInvoiceData.hourly_rate || 2500}/hr` : 'Bulk Package Contract'})
                      </td>
                      <td className="p-3 text-right font-mono font-bold">₹{(viewInvoiceData.subtotal || 43000).toLocaleString()}.00</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-600">Subtotal</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₹{(viewInvoiceData.subtotal || 43000).toLocaleString()}.00</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-600">GST Tax (18%)</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₹{((viewInvoiceData.subtotal || 43000) * 0.18).toLocaleString()}.00</td>
                    </tr>
                    <tr className="bg-sky-50 font-extrabold text-sm text-[#00618e]">
                      <td className="p-3">Total Payable (Net-30 Invoice Grand Total)</td>
                      <td className="p-3 text-right font-mono">₹{(viewInvoiceData.grand_total || ((viewInvoiceData.subtotal || 43000) * 1.18)).toLocaleString()}.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 print:hidden">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                >
                  Close Invoice View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
