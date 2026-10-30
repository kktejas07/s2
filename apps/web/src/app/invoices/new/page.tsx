"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Plus } from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("job_id") || "";

  const [jobId, setJobId] = useState(initialJobId);
  const [clientName, setClientName] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceType, setInvoiceType] = useState("standard");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.createInvoice({
        invoice_id: `INV-${Date.now().toString().slice(-6)}`,
        invoice_number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        job_id: jobId,
        client_name: clientName,
        grand_total: parseFloat(amount) || 0,
        invoice_type: invoiceType,
        status: "initiated",
      });
      router.push("/invoices");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't generate the invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003366] dark:text-sky-400 hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Invoices Ledger</span>
      </Link>

      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 font-heading">Generate Inspection Invoice</h1>
            <p className="text-xs text-slate-500">Create billing statement for completed job visits</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="invnew-job-reference-id" className="block text-xs font-semibold text-slate-700 mb-1">Job Reference ID</label>
            <input id="invnew-job-reference-id"
              type="text"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="e.g. JOB-1001"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-mono"
            />
          </div>

          <div>
            <label htmlFor="invnew-client-name" className="block text-xs font-semibold text-slate-700 mb-1">Client Name *</label>
            <input id="invnew-client-name"
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Reliance Petrochemical Industries"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="invnew-grand-total-amount" className="block text-xs font-semibold text-slate-700 mb-1">Grand Total Amount (₹) *</label>
              <input id="invnew-grand-total-amount"
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 75000"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label htmlFor="invnew-invoice-billing-type" className="block text-xs font-semibold text-slate-700 mb-1">Invoice Billing Type</label>
              <select id="invnew-invoice-billing-type"
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              >
                <option value="standard">Standard Inspection</option>
                <option value="milestone">Milestone Billing</option>
                <option value="expedited">Expedited QC Audit</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              href="/invoices"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-purple-600 text-white font-semibold text-xs shadow-lg hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? "Generating..." : "Generate Invoice"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
      <NewInvoiceForm />
    </Suspense>
  );
}
