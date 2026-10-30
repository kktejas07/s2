"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Receipt, RefreshCw, AlertTriangle, CheckCircle2, X, ChevronRight,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatCurrency, formatDate } from "@/lib/workPackageLifecycle";

type QueuedCert = {
  certification_id: string;
  work_package_id: string;
  reference_bill_no?: string | null;
  certified_value: number;
  net_payable_value: number;
  certified_at?: string | null;
};

type QueuedJob = {
  job_id: string;
  certification_count: number;
  billable_value: number;
  currency: string;
  certifications: QueuedCert[];
};

const BUCKET_LABEL: Record<string, string> = {
  current: "Not yet due",
  "1_30": "1–30 days late",
  "31_60": "31–60 days late",
  "61_90": "61–90 days late",
  "90_plus": "Over 90 days late",
  no_due_date: "No due date set",
  paid: "Paid",
};

/** Lateness is the signal here, so the scale runs from calm to urgent. */
const BUCKET_TONE: Record<string, string> = {
  current: "text-slate-700 dark:text-slate-200",
  "1_30": "text-amber-600 dark:text-amber-400",
  "31_60": "text-[#e35f14]",
  "61_90": "text-rose-600 dark:text-rose-400",
  "90_plus": "text-rose-700 dark:text-rose-300",
  no_due_date: "text-slate-400",
  paid: "text-emerald-600 dark:text-emerald-400",
};

export default function BillingPage() {
  const [queue, setQueue] = useState<{ total_billable_value: number; total_certifications: number; jobs: QueuedJob[] } | null>(null);
  const [receivables, setReceivables] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openJob, setOpenJob] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [raising, setRaising] = useState(false);
  const [result, setResult] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [q, r] = await Promise.all([api.getBillingQueue(), api.getReceivables()]);
      setQueue(q ?? null);
      setReceivables(r ?? null);
    } catch {
      toast.error("Could not load billing data. Check the API connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const jobs = queue?.jobs ?? [];

  // Selection is confined to one job, since an invoice belongs to one job.
  const selectedJob = useMemo(() => {
    if (selected.size === 0) return null;
    return jobs.find((j) => j.certifications.some((c) => selected.has(c.certification_id))) ?? null;
  }, [selected, jobs]);

  const selectedValue = useMemo(() => {
    if (!selectedJob) return 0;
    return selectedJob.certifications
      .filter((c) => selected.has(c.certification_id))
      .reduce((n, c) => n + c.net_payable_value, 0);
  }, [selected, selectedJob]);

  function toggle(cert: QueuedCert, job: QueuedJob) {
    const next = new Set(selected);
    if (next.has(cert.certification_id)) {
      next.delete(cert.certification_id);
    } else {
      // Starting a selection on a different job clears the previous one.
      if (selectedJob && selectedJob.job_id !== job.job_id) next.clear();
      next.add(cert.certification_id);
    }
    setSelected(next);
  }

  function selectWholeJob(job: QueuedJob) {
    const ids = job.certifications.map((c) => c.certification_id);
    const allOn = ids.every((id) => selected.has(id));
    setSelected(allOn ? new Set() : new Set(ids));
  }

  async function raise() {
    if (selected.size === 0) return;
    setRaising(true);
    try {
      const r = await api.raiseInvoiceFromCertifications(Array.from(selected));
      setResult(r);
      setSelected(new Set());
      toast.success(`Invoice ${r.invoice_id} raised.`);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not raise the invoice.");
    } finally {
      setRaising(false);
    }
  }

  const billable = queue?.total_billable_value ?? 0;
  const overdue = receivables?.overdue_value ?? 0;
  const outstanding = receivables?.outstanding_value ?? 0;

  return (
    <div className="space-y-5 pb-24">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#0084bf] to-[#00618e] text-white shadow-glow-blue">
            <Receipt className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Billing
            </h1>
            <p className="mt-0.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Certified work waiting to be invoiced, and what clients still owe.
            </p>
          </div>
        </div>

        <button
          onClick={load}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {/* Two numbers that drive finance: what can be billed, what is late */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-iqeOrange-200 bg-iqeOrange-50/60 p-4 dark:border-iqeOrange-900/50 dark:bg-iqeOrange-950/25">
          <div className="text-xs text-iqeOrange-800/70 dark:text-iqeOrange-300/70">
            Certified, not yet invoiced
          </div>
          <div className="mt-1 font-heading text-3xl font-bold tabular-nums text-[#e35f14]">
            {formatCurrency(billable)}
          </div>
          <div className="mt-0.5 text-xs text-iqeOrange-800/70 dark:text-iqeOrange-300/70">
            {queue?.total_certifications ?? 0} certification
            {(queue?.total_certifications ?? 0) === 1 ? "" : "s"} across {jobs.length} job
            {jobs.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-400">Outstanding from clients</div>
          <div className="mt-1 font-heading text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {formatCurrency(outstanding)}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">
            {overdue > 0 ? (
              <span className="text-rose-600 dark:text-rose-400">
                {formatCurrency(overdue)} of it is past due
              </span>
            ) : (
              "Nothing past due"
            )}
          </div>
        </div>
      </div>

      {/* Ageing */}
      {receivables?.buckets?.length > 0 && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            How late the money is
          </h2>
          <div className="flex flex-wrap gap-x-7 gap-y-3">
            {receivables.buckets.map((b: any) => (
              <div key={b.bucket}>
                <div className={`font-heading text-lg font-bold tabular-nums ${BUCKET_TONE[b.bucket] ?? ""}`}>
                  {formatCurrency(b.value)}
                </div>
                <div className="text-xs text-slate-400">
                  {BUCKET_LABEL[b.bucket] ?? b.bucket} · {b.count}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Result of the last invoice raised */}
      {result && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Invoice {result.invoice_id} raised for {formatCurrency(result.grand_total)}
              </p>
              <p className="mt-0.5 text-sm text-emerald-800/80 dark:text-emerald-300/80">
                {result.line_count} line{result.line_count === 1 ? "" : "s"} · due{" "}
                {formatDate(result.due_date)} on {result.payment_terms_code?.replace("_", " ").toLowerCase()}
              </p>
              <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-emerald-900/80 dark:text-emerald-300/80">
                <span>Subtotal {formatCurrency(result.subtotal)}</span>
                {result.cgst > 0 && <span>CGST {formatCurrency(result.cgst)}</span>}
                {result.sgst > 0 && <span>SGST {formatCurrency(result.sgst)}</span>}
                {result.igst > 0 && <span>IGST {formatCurrency(result.igst)}</span>}
                {result.tds > 0 && <span>less TDS {formatCurrency(result.tds)}</span>}
              </dl>
            </div>
            <button
              onClick={() => setResult(null)}
              aria-label="Dismiss"
              className="rounded-lg p-1 text-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Billable queue */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Ready to invoice
          </h2>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-4 py-4">
                <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-400" />
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              Everything certified has been invoiced.
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Certifications appear here as soon as they are issued, so verified work does not sit
              unbilled.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {jobs.map((job) => {
              const open = openJob === job.job_id;
              const allOn = job.certifications.every((c) => selected.has(c.certification_id));
              return (
                <div key={job.job_id}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => setOpenJob(open ? null : job.job_id)}
                      aria-expanded={open}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
                      />
                      <span className="font-mono text-[13px] font-semibold text-[#0084bf]">
                        {job.job_id}
                      </span>
                      <span className="text-xs text-slate-400">
                        {job.certification_count} certification
                        {job.certification_count === 1 ? "" : "s"}
                      </span>
                    </button>

                    <span className="shrink-0 font-heading text-base font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatCurrency(job.billable_value, job.currency)}
                    </span>

                    <button
                      onClick={() => selectWholeJob(job)}
                      className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-[#0084bf] hover:text-[#0084bf] dark:border-slate-700 dark:text-slate-300"
                    >
                      {allOn ? "Clear" : "Select all"}
                    </button>
                  </div>

                  {open && (
                    <div className="bg-slate-50/60 px-4 pb-3 dark:bg-slate-800/30">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-400">
                            <th className="py-1.5 pr-3 font-medium">Certification</th>
                            <th className="py-1.5 pr-3 font-medium">Package</th>
                            <th className="py-1.5 pr-3 font-medium">Certified</th>
                            <th className="py-1.5 text-right font-medium">Net payable</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/50">
                          {job.certifications.map((c) => (
                            <tr key={c.certification_id}>
                              <td className="py-2 pr-3">
                                <label className="flex cursor-pointer items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selected.has(c.certification_id)}
                                    onChange={() => toggle(c, job)}
                                    className="h-3.5 w-3.5 accent-[#0084bf]"
                                  />
                                  <span className="font-mono text-slate-700 dark:text-slate-200">
                                    {c.certification_id}
                                  </span>
                                  {c.reference_bill_no && (
                                    <span className="text-slate-400">· {c.reference_bill_no}</span>
                                  )}
                                </label>
                              </td>
                              <td className="py-2 pr-3 font-mono text-slate-500">
                                {c.work_package_id}
                              </td>
                              <td className="py-2 pr-3 text-slate-500">
                                {formatDate(c.certified_at)}
                              </td>
                              <td className="py-2 text-right tabular-nums text-slate-700 dark:text-slate-200">
                                {formatCurrency(c.net_payable_value, job.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {jobs.length > 0 && (
        <p className="px-1 text-xs text-slate-400">
          An invoice covers one job, so selecting certifications from another job starts a fresh
          selection.
        </p>
      )}

      {/* Action bar appears only once something is selected */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
            <div className="min-w-0">
              <div className="font-heading text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(selectedValue, selectedJob?.currency)}
              </div>
              <div className="text-xs text-slate-500">
                {selected.size} certification{selected.size === 1 ? "" : "s"} on{" "}
                {selectedJob?.job_id} · before tax
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set())}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Clear
              </button>
              <button
                onClick={raise}
                disabled={raising}
                className="rounded-xl bg-[#0084bf] px-4 py-2 text-sm font-semibold text-white shadow-glow-blue hover:bg-[#0075ab] disabled:opacity-50"
              >
                {raising ? "Raising…" : "Raise invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && billable === 0 && overdue > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/30">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
          <p className="text-sm text-rose-900 dark:text-rose-200">
            Nothing to invoice, but {formatCurrency(overdue)} is past due from clients.
          </p>
        </div>
      )}
    </div>
  );
}
