"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FileCheck, Search, RefreshCw, X, AlertTriangle, CheckCircle2, ChevronRight,
  ShieldCheck, ArrowUpRight,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { StatusPill } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/workPackageLifecycle";

type Certification = {
  certification_id: string;
  work_package_id: string;
  job_id: string;
  revision_no: number;
  supersedes_certification_id?: string | null;
  reference_bill_no?: string | null;
  claimed_value: number;
  certified_value: number;
  deduction_value: number;
  retention_value: number;
  net_payable_value: number;
  currency: string;
  status: "draft" | "issued" | "disputed" | "superseded";
  certified_at?: string | null;
  billed_invoice_id?: string | null;
  line_items: any[];
  dispute_note?: string | null;
};

const STATUS_TONE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  issued: "bg-iqeOrange-50 text-iqeOrange-800 ring-iqeOrange-300 dark:bg-iqeOrange-950/60 dark:text-iqeOrange-200 dark:ring-iqeOrange-800/60",
  disputed: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:ring-rose-800/60",
  superseded: "bg-slate-200 text-slate-500 ring-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  issued: "Issued",
  disputed: "Disputed",
  superseded: "Superseded",
};

export default function CertificationsPage() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [unbilledOnly, setUnbilledOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [qrModalCert, setQrModalCert] = useState<Certification | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        api.getCertifications({
          status: statusFilter || undefined,
          unbilled_only: unbilledOnly || undefined,
          per_page: 200,
        }),
        api.getCertificationSummary(),
      ]);
      setCerts(list?.data ?? []);
      setSummary(sum ?? null);
    } catch {
      toast.error("Could not load certifications. Check the API connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, unbilledOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = certs.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.certification_id.toLowerCase().includes(q) ||
      c.work_package_id.toLowerCase().includes(q) ||
      c.job_id.toLowerCase().includes(q) ||
      (c.reference_bill_no ?? "").toLowerCase().includes(q)
    );
  });

  const unbilledValue = summary?.certified_not_billed_value ?? 0;
  const unbilledCount = summary?.certified_not_billed_count ?? 0;
  const deductionPct = summary?.deduction_pct ?? 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#0084bf] to-[#00618e] text-white shadow-glow-blue">
            <FileCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Certifications
            </h1>
            <p className="mt-0.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              What a contractor claimed, what IQE verified, and what is payable as a result.
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

      {/* The claimed → certified → payable flow, shown as the subtraction it is */}
      {summary && summary.issued > 0 && (
        <section
          aria-label="Certified value position"
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
            <Figure
              label="Claimed"
              value={formatCurrency(summary.claimed_value)}
              sub={`across ${summary.issued} issued`}
            />
            <Operator symbol="−" />
            <Figure
              label="Deducted"
              value={formatCurrency(summary.deduction_value)}
              sub={deductionPct ? `${deductionPct}% of claim` : undefined}
              tone="rose"
            />
            <Operator symbol="=" />
            <Figure
              label="Certified"
              value={formatCurrency(summary.certified_value)}
              emphasis
            />
            {summary.retention_held > 0 && (
              <>
                <Operator symbol="−" />
                <Figure
                  label="Retention held"
                  value={formatCurrency(summary.retention_held)}
                />
              </>
            )}
          </div>
        </section>
      )}

      {/* Certified but unbilled: the revenue-leakage number */}
      {unbilledCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-iqeOrange-200 bg-iqeOrange-50/70 px-4 py-3 dark:border-iqeOrange-900/50 dark:bg-iqeOrange-950/30">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[#e35f14]" />
          <p className="text-sm text-iqeOrange-900 dark:text-iqeOrange-200">
            <strong className="font-semibold">
              {formatCurrency(unbilledValue)} certified and not yet invoiced
            </strong>{" "}
            across {unbilledCount} certification{unbilledCount === 1 ? "" : "s"}.
          </p>
          <button
            onClick={() => {
              setUnbilledOnly(true);
              setStatusFilter("");
            }}
            className="ml-auto shrink-0 rounded-lg border border-iqeOrange-300 px-2.5 py-1 text-xs font-semibold text-iqeOrange-800 hover:bg-iqeOrange-100 dark:border-iqeOrange-800 dark:text-iqeOrange-200"
          >
            Show them
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by certification, package, job or bill reference"
            className={inputClass + " pl-9 pr-9"}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setUnbilledOnly(false);
          }}
          className={inputClass + " sm:w-44"}
        >
          <option value="">Any status</option>
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="disputed">Disputed</option>
          <option value="superseded">Superseded</option>
        </select>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <input
            type="checkbox"
            checked={unbilledOnly}
            onChange={(e) => {
              setUnbilledOnly(e.target.checked);
              if (e.target.checked) setStatusFilter("");
            }}
            className="h-3.5 w-3.5 accent-[#e35f14]"
          />
          Unbilled only
        </label>
      </div>

      {/* List */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-4">
                <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <FileCheck className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              {search || statusFilter || unbilledOnly
                ? "Nothing matches these filters."
                : "No certifications yet."}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {search || statusFilter || unbilledOnly
                ? "Clear the filters to see everything."
                : "A certification records what was claimed against what was verified. Raise one from a work package once its quantities have been measured."}
            </p>
            {(search || statusFilter || unbilledOnly) && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setUnbilledOnly(false);
                }}
                className="mt-3 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-800/95">
                <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">Certification</th>
                  <th className="px-4 py-3">Against</th>
                  <th className="px-4 py-3 text-right">Claimed</th>
                  <th className="px-4 py-3 text-right">Certified</th>
                  <th className="px-4 py-3 text-right">Deducted</th>
                  <th className="px-4 py-3 text-right">Net payable</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visible.map((c) => {
                  const open = expanded === c.certification_id;
                  const pct = c.claimed_value
                    ? Math.round((c.certified_value / c.claimed_value) * 100)
                    : 100;
                  return (
                    <Fragment key={c.certification_id}>
                      <tr
                        onClick={() => setExpanded(open ? null : c.certification_id)}
                        className="cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <ChevronRight
                              className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
                            />
                            <span className="font-mono text-[13px] font-semibold text-[#0084bf]">
                              {c.certification_id}
                            </span>
                            {c.revision_no > 0 && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800">
                                Rev {c.revision_no}
                              </span>
                            )}
                          </div>
                          {c.reference_bill_no && (
                            <div className="ml-5 mt-0.5 text-xs text-slate-400">
                              Bill {c.reference_bill_no}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs text-slate-600 dark:text-slate-300">
                            {c.work_package_id}
                          </div>
                          <div className="text-xs text-slate-400">{c.job_id}</div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                          {formatCurrency(c.claimed_value, c.currency)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-semibold tabular-nums text-slate-900 dark:text-white">
                            {formatCurrency(c.certified_value, c.currency)}
                          </div>
                          <div className="text-xs text-slate-400">{pct}% of claim</div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {c.deduction_value > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              −{formatCurrency(c.deduction_value, c.currency)}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                          {formatCurrency(c.net_payable_value, c.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block"
                          >
                            <StatusPill status={c.status}>{STATUS_LABEL[c.status]}</StatusPill>
                          </span>
                          {c.billed_invoice_id && (
                            <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                              on {c.billed_invoice_id}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQrModalCert(c);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-[#0084bf] hover:text-white text-[#0084bf] dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800 transition-colors shadow-2xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>QR Seal</span>
                          </button>
                        </td>
                      </tr>

                      {open && (
                        <tr className="bg-slate-50/60 dark:bg-slate-800/30">
                          <td colSpan={8} className="px-4 py-4">
                            {c.dispute_note && (
                              <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                                Disputed: {c.dispute_note}
                              </p>
                            )}
                            {c.supersedes_certification_id && (
                              <p className="mb-3 text-xs text-slate-500">
                                Supersedes {c.supersedes_certification_id}
                              </p>
                            )}
                            {c.line_items.length === 0 ? (
                              <p className="text-sm text-slate-500">No measured lines on this certification.</p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-left text-slate-400">
                                    <th className="py-1.5 pr-3 font-medium">Item</th>
                                    <th className="py-1.5 pr-3 font-medium">Unit</th>
                                    <th className="py-1.5 pr-3 text-right font-medium">Rate</th>
                                    <th className="py-1.5 pr-3 text-right font-medium">Claimed</th>
                                    <th className="py-1.5 pr-3 text-right font-medium">Certified</th>
                                    <th className="py-1.5 text-right font-medium">Value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/50">
                                  {c.line_items.map((li: any) => {
                                    const short = li.certified_quantity < li.claimed_quantity;
                                    return (
                                      <tr key={li.line_id}>
                                        <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-200">
                                          {li.description}
                                          {li.boq_item_ref && (
                                            <span className="ml-1.5 font-mono text-slate-400">
                                              {li.boq_item_ref}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-1.5 pr-3 text-slate-500">{li.uom ?? "—"}</td>
                                        <td className="py-1.5 pr-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                                          {li.rate?.toLocaleString("en-IN")}
                                        </td>
                                        <td className="py-1.5 pr-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                                          {li.claimed_quantity?.toLocaleString("en-IN")}
                                        </td>
                                        <td
                                          className={`py-1.5 pr-3 text-right tabular-nums ${
                                            short
                                              ? "font-semibold text-rose-600 dark:text-rose-400"
                                              : "text-slate-700 dark:text-slate-200"
                                          }`}
                                        >
                                          {li.certified_quantity?.toLocaleString("en-IN")}
                                        </td>
                                        <td className="py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-200">
                                          {formatCurrency(
                                            (li.certified_quantity ?? 0) * (li.rate ?? 0),
                                            c.currency
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                            {c.certified_at && (
                              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Certified {formatDate(c.certified_at)}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!loading && visible.length > 0 && (
        <p className="px-1 text-xs text-slate-400">
          Showing {visible.length} of {certs.length}. Select a row to see the measured lines
          behind the figures.
        </p>
      )}

      {/* Cryptographic Digital QR Verification Modal */}
      {qrModalCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#001a2c] text-white border border-[#0084bf]/50 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-heading font-bold text-base text-white">Cryptographic Certificate Seal</h3>
              </div>
              <button
                onClick={() => setQrModalCert(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center space-y-3 py-2">
              <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    typeof window !== "undefined"
                      ? `${window.location.origin}/verify?ref=${qrModalCert.certification_id}`
                      : `http://localhost:3000/verify?ref=${qrModalCert.certification_id}`
                  )}`}
                  alt="QR Verification Seal"
                  className="w-44 h-44"
                />
              </div>
              <div className="text-center">
                <span className="font-mono font-black text-sm text-sky-300 block">
                  {qrModalCert.certification_id}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Scan to verify document validity &amp; ISO/IEC 17020 compliance
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs rounded-2xl bg-white/5 p-3.5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Net Certified:</span>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(qrModalCert.net_payable_value, qrModalCert.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Work Package:</span>
                <span className="font-mono text-slate-200">{qrModalCert.work_package_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-emerald-400 uppercase">{qrModalCert.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Issuing Authority:</span>
                <span className="text-slate-200">Ideal Quality Engineers</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/verify?ref=${qrModalCert.certification_id}`}
                target="_blank"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0084bf] to-[#00618e] hover:from-[#0075ab] hover:to-[#00527a] text-white text-xs font-bold transition-all shadow-glow-blue flex items-center justify-center gap-1.5"
              >
                <span>Open Public Verification Page</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Figure({
  label, value, sub, emphasis, tone,
}: {
  label: string; value: string; sub?: string;
  emphasis?: boolean; tone?: "rose";
}) {
  return (
    <div className="min-w-[8.5rem]">
      <div className="text-xs text-slate-400">{label}</div>
      <div
        className={`font-heading text-xl font-bold tabular-nums ${
          tone === "rose"
            ? "text-rose-600 dark:text-rose-400"
            : emphasis
            ? "text-[#0084bf]"
            : "text-slate-800 dark:text-slate-200"
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

function Operator({ symbol }: { symbol: string }) {
  return (
    <span aria-hidden className="px-1 text-lg font-light text-slate-300 dark:text-slate-600">
      {symbol}
    </span>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0084bf] focus:outline-none focus:ring-2 focus:ring-[#0084bf]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
