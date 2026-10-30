"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText, Search, RefreshCw, X, ChevronRight, Printer, Signature,
  Paperclip, Layers, Users, Receipt, Sparkles, AlertTriangle,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatDate } from "@/lib/workPackageLifecycle";
import {
  Card, EmptyState, LifecycleBar, Metric, PageHeader, SkeletonRows, StatusPill,
  buttonPrimary, buttonSecondary, formatINR, humanise, inputClass,
} from "@/components/ui";

type ReportFormat = {
  format_code: string;
  name: string;
  kind: "VISIT" | "CERTIFICATE" | "MEASUREMENT" | "REGISTER" | "COMPOSED";
  description?: string | null;
  work_type_codes: string[];
  template_path?: string | null;
  sections: string[];
  requires_signatures: string[];
  annexures: string[];
  is_client_specific: boolean;
  revision: string;
  is_active: boolean;
};

const KIND_TONE: Record<string, string> = {
  VISIT:
    "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:ring-sky-800/60",
  CERTIFICATE:
    "bg-iqeOrange-50 text-iqeOrange-800 ring-iqeOrange-300 dark:bg-iqeOrange-950/60 dark:text-iqeOrange-200 dark:ring-iqeOrange-800/60",
  MEASUREMENT:
    "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/60 dark:text-violet-200 dark:ring-violet-800/60",
  REGISTER:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800/60",
  COMPOSED:
    "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-200 dark:ring-indigo-800/60",
};

const KIND_LABEL: Record<string, string> = {
  VISIT: "Visit",
  CERTIFICATE: "Certificate",
  MEASUREMENT: "Measurement",
  REGISTER: "Register",
  COMPOSED: "Composed",
};

const KIND_MEANING: Record<string, string> = {
  VISIT: "One inspection event, reported as it happened.",
  CERTIFICATE: "An assurance IQE signs — needs a second signatory.",
  MEASUREMENT: "Quantities, and the evidence behind them.",
  REGISTER: "A running list kept across a job.",
  COMPOSED: "Built from records already captured, not filled in by hand.",
};

/** Opens a fetched PDF in a new tab, revoking the object URL once the browser
 *  has had a chance to load it. A blob is needed rather than a direct link
 *  because the API is bearer-authenticated. */
function openPdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    // Pop-up blocked: fall back to a download instead of failing silently.
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function ReportsPage() {
  const [formats, setFormats] = useState<ReportFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const [jobId, setJobId] = useState("");
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getReportFormats(
        kindFilter ? { kind: kindFilter } : undefined,
      );
      setFormats(res?.data ?? []);
    } catch {
      toast.error("Could not load report formats. Check the API connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [kindFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const seed = async () => {
    try {
      const res = await api.seedReportFormats();
      const created = res?.created?.length ?? 0;
      toast.success(
        created
          ? `Loaded ${created} format${created === 1 ? "" : "s"} into the registry.`
          : "Registry already holds every standard format.",
      );
      load();
    } catch {
      toast.error("Could not load the standard formats.");
    }
  };

  const openFormatPdf = async (code: string) => {
    setPdfBusy(code);
    try {
      openPdfBlob(await api.getReportFormatPdf(code, { blank: true }), `${code}.pdf`);
    } catch {
      toast.error(`Could not render ${code}. Check the API connection and try again.`);
    } finally {
      setPdfBusy(null);
    }
  };

  const openProjectReportPdf = async () => {
    const id = jobId.trim();
    if (!id) return;
    setPdfBusy("PROJECT_REPORT");
    try {
      openPdfBlob(await api.getProjectReportPdf(id), `project-report-${id}.pdf`);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || `Could not render a PDF for ${id}.`);
    } finally {
      setPdfBusy(null);
    }
  };

  const runProjectReport = async () => {
    const id = jobId.trim();
    if (!id) return;
    setReportLoading(true);
    setReport(null);
    try {
      setReport(await api.getProjectReport(id));
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      toast.error(detail || `Could not compose a report for ${id}.`);
    } finally {
      setReportLoading(false);
    }
  };

  const visible = formats.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.format_code.toLowerCase().includes(q) ||
      f.name.toLowerCase().includes(q) ||
      (f.description ?? "").toLowerCase().includes(q) ||
      f.work_type_codes.some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      <PageHeader
        icon={FileText}
        title="Reports"
        description="Which deliverable each kind of work produces, and the end-to-end project position composed from what has actually been certified."
        actions={
          <>
            <button onClick={seed} className={buttonSecondary}>
              <Sparkles className="h-4 w-4" />
              Load standard formats
            </button>
            <button onClick={load} className={buttonSecondary}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </>
        }
      />

      {/* ------------------------------------------- composed project report */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white">
              End-to-end project report
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Composed live from work packages, certifications, deployment and billing —
              nothing is typed in twice.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runProjectReport()}
              placeholder="JOB-2026-0001"
              className={inputClass + " sm:w-48"}
            />
            <button
              onClick={runProjectReport}
              disabled={!jobId.trim() || reportLoading}
              className={`shrink-0 ${buttonPrimary}`}
            >
              {reportLoading ? "Composing…" : "Compose"}
            </button>
          </div>
        </div>

        {report && (
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                  {report.project_header?.title}
                </div>
                <dl className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <div>
                    <dt className="sr-only">Client</dt>
                    <dd className="text-slate-700 dark:text-slate-300">
                      {report.project_header?.client_name}
                    </dd>
                  </div>
                  {report.project_header?.location && (
                    <div>
                      <dt className="sr-only">Location</dt>
                      <dd className="text-slate-500 dark:text-slate-400">
                        {report.project_header.location}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="sr-only">Job</dt>
                    <dd className="font-mono text-xs text-slate-400">
                      {report.project_header?.job_id}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  Composed {formatDate(report.generated_at)}
                </span>
                <button
                  onClick={openProjectReportPdf}
                  disabled={pdfBusy === "PROJECT_REPORT"}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Server-rendered PDF on IQE letterhead"
                >
                  <Printer className="h-3.5 w-3.5" />
                  {pdfBusy === "PROJECT_REPORT" ? "Rendering…" : "PDF"}
                </button>
              </div>
            </div>

            {report.work_packages?.total > 0 && (
              <div>
                <h3 className="font-heading text-sm font-semibold text-slate-900 dark:text-white">
                  Where the scope stands
                </h3>
                <LifecycleBar
                  counts={report.work_packages.by_status ?? {}}
                  total={report.work_packages.total}
                  className="mt-2"
                />
              </div>
            )}

            {/* the claimed → certified subtraction, same shape as the certifications page */}
            <div className="flex flex-wrap items-start gap-x-3 gap-y-4">
              <Metric
                value={formatINR(report.certified_position?.claimed_value)}
                label="Claimed"
                sub={`${report.certified_position?.certifications_issued ?? 0} certifications issued`}
              />
              <Operator symbol="−" />
              <Metric
                value={formatINR(report.certified_position?.deduction_value)}
                label="Deducted"
                sub={
                  report.certified_position?.deduction_pct
                    ? `${report.certified_position.deduction_pct}% of the claim`
                    : undefined
                }
                tone="bad"
              />
              <Operator symbol="=" />
              <Metric
                value={formatINR(report.certified_position?.certified_value)}
                label="Certified"
                tone="info"
                size="lg"
              />
              {(report.certified_position?.retention_held ?? 0) > 0 && (
                <>
                  <Operator symbol="−" />
                  <Metric
                    value={formatINR(report.certified_position.retention_held)}
                    label="Retention held"
                    tone="warn"
                  />
                </>
              )}
            </div>

            {(report.billing_position?.certified_not_billed_value ?? 0) > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-iqeOrange-200 bg-iqeOrange-50/70 px-4 py-3 dark:border-iqeOrange-900/50 dark:bg-iqeOrange-950/30">
                <AlertTriangle className="h-5 w-5 shrink-0 text-[#e35f14]" />
                <p className="text-sm text-iqeOrange-900 dark:text-iqeOrange-200">
                  <strong className="font-semibold">
                    {formatINR(report.billing_position.certified_not_billed_value)}
                  </strong>{" "}
                  certified on this job and not yet invoiced.
                </p>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              <Panel icon={Layers} title="Work packages">
                <div className="font-heading text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {report.work_packages?.total ?? 0}
                </div>
                <dl className="mt-2 space-y-1">
                  {Object.entries(report.work_packages?.by_status ?? {}).map(([s, n]) => (
                    <div key={s} className="flex justify-between text-xs">
                      <dt className="text-slate-500 dark:text-slate-400">
                        {humanise(s)}
                      </dt>
                      <dd className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                        {n as number}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Panel>

              <Panel icon={Users} title="People deployed">
                <div className="font-heading text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {report.people_deployed?.count ?? 0}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {report.people_deployed?.total_days ?? 0} planned man-days
                </p>
                <ul className="mt-2 space-y-1">
                  {(report.people_deployed?.detail ?? []).slice(0, 5).map((p: any) => (
                    <li key={p.person_id} className="flex justify-between gap-2 text-xs">
                      <span className="truncate text-slate-600 dark:text-slate-300">
                        {p.person_name || p.person_id}
                      </span>
                      <span className="shrink-0 tabular-nums text-slate-400">{p.days}d</span>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel icon={Receipt} title="Billing position">
                <div className="font-heading text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatINR(report.billing_position?.invoiced_value)}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  across {report.billing_position?.invoices_raised ?? 0} invoice
                  {report.billing_position?.invoices_raised === 1 ? "" : "s"}
                </p>
                <dl className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500 dark:text-slate-400">Paid</dt>
                    <dd className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatINR(report.billing_position?.paid_value)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-xs">
                    <dt className="text-slate-500 dark:text-slate-400">Outstanding</dt>
                    <dd className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                      {formatINR(report.billing_position?.outstanding_value)}
                    </dd>
                  </div>
                </dl>
              </Panel>
            </div>

            {Object.keys(report.deductions_by_reason ?? {}).length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                <h3 className="font-heading text-sm font-semibold text-slate-900 dark:text-white">
                  Why value was deducted
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  The breakdown a contractor will ask for before accepting the certified figure.
                </p>
                <ul className="mt-3 space-y-1.5">
                  {Object.entries(report.deductions_by_reason)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([reason, value]) => (
                      <li key={reason} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-600 dark:text-slate-300">
                          {humanise(reason)}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                          {formatINR(value as number)}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {Object.keys(report.work_packages?.by_discipline ?? {}).length > 0 && (
              <div className="space-y-3">
                {Object.entries(report.work_packages.by_discipline).map(([disc, packages]) => (
                  <div
                    key={disc}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between bg-slate-50 px-4 py-2 dark:bg-slate-800/50">
                      <span className="font-heading text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {disc}
                      </span>
                      <span className="text-xs text-slate-400">
                        {(packages as any[]).length} package
                        {(packages as any[]).length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(packages as any[]).map((p) => (
                          <tr key={p.work_package_id}>
                            <td className="px-4 py-2 font-mono text-xs text-slate-400">
                              {p.work_package_id}
                            </td>
                            <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                              {p.title}
                            </td>
                            <td className="px-4 py-2 text-xs text-slate-400">
                              {p.work_type_code}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <StatusPill status={p.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ------------------------------------------------- format registry */}
      <section className="space-y-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search formats by code, name or work type"
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
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className={inputClass + " sm:w-52"}
          >
            <option value="">All kinds</option>
            {Object.entries(KIND_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {kindFilter && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {KIND_MEANING[kindFilter]}
          </p>
        )}

        {loading ? (
          <SkeletonRows rows={4} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={formats.length === 0 ? "No report formats yet" : "No format matches that search"}
            description={
              formats.length === 0
                ? "Load the standard registry to get the thirteen formats IQE issues, each ready to render as a blank pro forma."
                : "Try a different code, name or work type."
            }
            action={
              formats.length === 0 ? (
                <button onClick={seed} className={buttonPrimary}>
                  Load the standard formats
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {visible.map((f) => {
              const open = expanded === f.format_code;
              return (
                <article
                  key={f.format_code}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-sm font-semibold text-slate-900 dark:text-white">
                          {f.name}
                        </h3>
                        <span className="font-mono text-xs text-slate-400">{f.format_code}</span>
                      </div>
                      {f.description && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {f.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                        KIND_TONE[f.kind] ?? KIND_TONE.VISIT
                      }`}
                    >
                      {KIND_LABEL[f.kind] ?? f.kind}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {f.work_type_codes.length === 0 ? (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        every work type
                      </span>
                    ) : (
                      f.work_type_codes.map((c) => (
                        <span
                          key={c}
                          className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {c}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Signature className="h-3.5 w-3.5" />
                      {f.requires_signatures.length}{" "}
                      {f.requires_signatures.length === 1 ? "signatory" : "signatories"}
                    </span>
                    {f.annexures.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5" />
                        {f.annexures.length} annexure
                        {f.annexures.length === 1 ? "" : "s"}
                      </span>
                    )}
                    <span>{f.revision}</span>
                    <button
                      onClick={() => openFormatPdf(f.format_code)}
                      disabled={pdfBusy === f.format_code}
                      className="ml-auto inline-flex items-center gap-1 font-medium text-slate-500 hover:text-[#0084bf] hover:underline disabled:opacity-50 dark:text-slate-400"
                      title="Blank pro forma on IQE letterhead"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      {pdfBusy === f.format_code ? "Rendering…" : "PDF"}
                    </button>
                    <button
                      onClick={() => setExpanded(open ? null : f.format_code)}
                      className="inline-flex items-center gap-0.5 font-medium text-[#0084bf] hover:underline"
                    >
                      {open ? "Hide" : "Structure"}
                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`}
                      />
                    </button>
                  </div>

                  {open && (
                    <dl className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                      <Row label="Sections" values={f.sections.map((s) => s.replace(/_/g, " "))} />
                      <Row label="Signed by" values={f.requires_signatures.map((s) => s.replace(/_/g, " "))} />
                      {f.annexures.length > 0 && <Row label="Annexures" values={f.annexures} />}
                      {f.template_path && (
                        <div className="flex gap-2">
                          <dt className="w-20 shrink-0 text-slate-400">Template</dt>
                          <dd className="font-mono text-slate-600 dark:text-slate-300">
                            {f.template_path}
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-slate-400">{label}</dt>
      <dd className="flex flex-wrap gap-1">
        {values.map((v) => (
          <span
            key={v}
            className="rounded-md bg-slate-100 px-1.5 py-0.5 capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            {v}
          </span>
        ))}
      </dd>
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** Sits on the figures' baseline so the row reads as one subtraction rather
 *  than four unrelated statistics. */
function Operator({ symbol }: { symbol: string }) {
  return (
    <span
      aria-hidden
      className="select-none pt-0.5 text-2xl font-light leading-9 text-slate-300 dark:text-slate-600"
    >
      {symbol}
    </span>
  );
}

