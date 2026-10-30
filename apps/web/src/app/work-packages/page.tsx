"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Layers, Search, Plus, RefreshCw, X, CheckCircle2, AlertTriangle,
  ChevronRight, Box, FileCheck,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { StatusPill } from "@/components/ui";
import {
  ASIDE_STATES, LIFECYCLE, RATE_BASIS_LABEL, STATUS_LABEL, STATUS_MEANING,
  STATUS_TONE, formatCurrency, formatDate, nextStates,
  type WorkPackageStatus,
} from "@/lib/workPackageLifecycle";

type WorkPackage = {
  work_package_id: string;
  job_id: string;
  work_type_code: string;
  title: string;
  description?: string | null;
  discipline?: string | null;
  client_name?: string | null;
  manufacturer_name?: string | null;
  location?: string | null;
  planned_start?: string | null;
  planned_finish?: string | null;
  planned_quantity: number;
  planned_uom?: string | null;
  rate_basis?: string | null;
  rate: number;
  currency: string;
  status: WorkPackageStatus;
  percent_complete: number;
};

export default function WorkPackagesPage() {
  const [packages, setPackages] = useState<WorkPackage[]>([]);
  const [workTypes, setWorkTypes] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<WorkPackageStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [moving, setMoving] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sum, types] = await Promise.all([
        api.getWorkPackages({
          search: search || undefined,
          status: stage === "all" ? undefined : stage,
          work_type_code: typeFilter || undefined,
          per_page: 200,
        }),
        api.getWorkPackageSummary(),
        api.getWorkTypes({ is_active: true }),
      ]);
      setPackages(list?.data ?? []);
      setSummary(sum ?? null);
      setWorkTypes(types?.data ?? []);
    } catch {
      toast.error("Could not load work packages. Check the API connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [search, stage, typeFilter]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const counts: Record<string, number> = summary?.by_status ?? {};
  const total: number = summary?.total ?? 0;

  const certifiedUnbilled = counts["certified"] ?? 0;
  const unassigned = counts["planned"] ?? 0;

  const asideCount = useMemo(
    () => ASIDE_STATES.reduce((n, s) => n + (counts[s] ?? 0), 0),
    [counts]
  );

  async function move(pkg: WorkPackage, to: WorkPackageStatus) {
    setMoving(pkg.work_package_id);
    try {
      await api.transitionWorkPackage(pkg.work_package_id, to);
      toast.success(`${pkg.work_package_id} moved to ${STATUS_LABEL[to].toLowerCase()}`);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "That move was rejected. Reload and try again.");
    } finally {
      setMoving(null);
    }
  }

  async function seedCatalogue() {
    try {
      const r = await api.seedWorkTypes();
      toast.success(
        r.created?.length
          ? `Added ${r.created.length} work types to the catalogue.`
          : "Catalogue is already complete."
      );
      load();
    } catch {
      toast.error("Could not seed the catalogue.");
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#0084bf] to-[#00618e] text-white shadow-glow-blue">
            <Layers className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Work packages
            </h1>
            <p className="mt-0.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Every piece of scope on a job, from planning through certification to billing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0084bf] px-3.5 py-2 text-sm font-semibold text-white shadow-glow-blue hover:bg-[#0075ab]"
          >
            <Plus className="h-4 w-4" />
            New package
          </button>
        </div>
      </header>

      {/* Lifecycle rail — the stages are a real sequence, so they are drawn as one */}
      <section
        aria-label="Lifecycle"
        className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
          <StageButton
            label="All"
            meaning={`${total} package${total === 1 ? "" : "s"}`}
            count={total}
            active={stage === "all"}
            onClick={() => setStage("all")}
          />
          {LIFECYCLE.map((s, i) => (
            <div key={s} className="flex items-stretch gap-1.5">
              <ChevronRight
                className={`h-4 w-4 shrink-0 self-center ${
                  s === "billed" ? "text-iqeOrange-400" : "text-slate-300 dark:text-slate-700"
                }`}
                aria-hidden
              />
              <StageButton
                label={STATUS_LABEL[s]}
                meaning={STATUS_MEANING[s]}
                count={counts[s] ?? 0}
                active={stage === s}
                emphasis={s === "certified"}
                onClick={() => setStage(stage === s ? "all" : s)}
              />
            </div>
          ))}
        </div>

        {asideCount > 0 && (
          <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
            <span className="text-xs text-slate-400">Outside the flow</span>
            {ASIDE_STATES.map((s) =>
              (counts[s] ?? 0) > 0 ? (
                <button
                  key={s}
                  onClick={() => setStage(stage === s ? "all" : s)}
                  className={`rounded-lg px-2 py-1 text-xs font-medium ring-1 ${STATUS_TONE[s]} ${
                    stage === s ? "ring-2" : ""
                  }`}
                >
                  {STATUS_LABEL[s]}
                  <span className="ml-1.5 rounded bg-black/5 px-1 tabular-nums dark:bg-white/10">
                    {counts[s]}
                  </span>
                </button>
              ) : null
            )}
          </div>
        )}
      </section>

      {/* The one number that matters most, surfaced only when it is non-zero */}
      {certifiedUnbilled > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-iqeOrange-200 bg-iqeOrange-50/70 px-4 py-3 dark:border-iqeOrange-900/50 dark:bg-iqeOrange-950/30">
          <FileCheck className="h-5 w-5 shrink-0 text-[#e35f14]" />
          <p className="text-sm text-iqeOrange-900 dark:text-iqeOrange-200">
            <strong className="font-semibold">
              {certifiedUnbilled} package{certifiedUnbilled === 1 ? "" : "s"} certified but not billed.
            </strong>{" "}
            Work is verified and invoiceable.
          </p>
          <button
            onClick={() => setStage("certified")}
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
            placeholder="Search by package ID, title, client, vendor or location"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0084bf] focus:outline-none focus:ring-2 focus:ring-[#0084bf]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[#0084bf] focus:outline-none focus:ring-2 focus:ring-[#0084bf]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value="">All work types</option>
          {workTypes.map((t) => (
            <option key={t.work_type_code} value={t.work_type_code}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <TableSkeleton />
        ) : packages.length === 0 ? (
          <EmptyState
            hasFilters={Boolean(search || typeFilter || stage !== "all")}
            noWorkTypes={workTypes.length === 0}
            onClear={() => {
              setSearch("");
              setTypeFilter("");
              setStage("all");
            }}
            onSeed={seedCatalogue}
            onCreate={() => setShowCreate(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-800/95">
                <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Counterparty</th>
                  <th className="px-4 py-3">Planned</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3 text-right">Move to</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {packages.map((p) => (
                  <tr key={p.work_package_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-mono text-[13px] font-semibold text-[#0084bf]">
                        {p.work_package_id}
                      </div>
                      <div className="mt-0.5 max-w-xs truncate text-slate-800 dark:text-slate-200" title={p.title}>
                        {p.title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {p.job_id}
                        {p.location ? <span className="ml-2">{p.location}</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {p.work_type_code}
                      </span>
                      {p.discipline && (
                        <div className="mt-1 text-xs text-slate-400">{p.discipline}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <div className="max-w-[12rem] truncate">{p.client_name ?? "—"}</div>
                      {p.manufacturer_name && (
                        <div className="max-w-[12rem] truncate text-xs text-slate-400">
                          at {p.manufacturer_name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <div>{formatDate(p.planned_start)}</div>
                      <div className="text-xs text-slate-400">to {formatDate(p.planned_finish)}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                      {p.planned_quantity ? (
                        <>
                          {p.planned_quantity.toLocaleString("en-IN")}
                          <span className="ml-1 text-xs text-slate-400">{p.planned_uom}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-slate-700 dark:text-slate-200">
                        {formatCurrency(p.rate, p.currency)}
                      </div>
                      {p.rate_basis && (
                        <div className="text-xs text-slate-400">
                          {RATE_BASIS_LABEL[p.rate_basis] ?? p.rate_basis}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block"
                      >
                        <StatusPill status={p.status}>{STATUS_LABEL[p.status]}</StatusPill>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        {nextStates(p.status).length === 0 ? (
                          <span className="text-xs text-slate-400">No further moves</span>
                        ) : (
                          nextStates(p.status).map((to) => (
                            <button
                              key={to}
                              disabled={moving === p.work_package_id}
                              onClick={() => move(p, to)}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:border-[#0084bf] hover:text-[#0084bf] disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                            >
                              {STATUS_LABEL[to]}
                            </button>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!loading && packages.length > 0 && (
        <p className="px-1 text-xs text-slate-400">
          Showing {packages.length} of {total}. Only moves the system allows are offered —
          a package cannot be billed before it is certified.
        </p>
      )}

      {showCreate && (
        <CreatePackageDialog
          workTypes={workTypes}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function StageButton({
  label, meaning, count, active, emphasis, onClick,
}: {
  label: string; meaning: string; count: number;
  active: boolean; emphasis?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={meaning}
      aria-pressed={active}
      className={`min-w-[7.5rem] shrink-0 rounded-xl border px-3 py-2.5 text-left transition-colors ${
        active
          ? "border-[#0084bf] bg-iqe-50 dark:border-[#0084bf] dark:bg-iqe-950/50"
          : emphasis
          ? "border-iqeOrange-200 bg-iqeOrange-50/50 hover:border-iqeOrange-300 dark:border-iqeOrange-900/50 dark:bg-iqeOrange-950/20"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
      }`}
    >
      <div
        className={`font-heading text-xl font-bold tabular-nums ${
          emphasis ? "text-[#e35f14]" : active ? "text-[#0084bf]" : "text-slate-800 dark:text-slate-200"
        }`}
      >
        {count}
      </div>
      <div className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">{label}</div>
    </button>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <div className="h-9 flex-1 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters, noWorkTypes, onClear, onSeed, onCreate,
}: {
  hasFilters: boolean; noWorkTypes: boolean;
  onClear: () => void; onSeed: () => void; onCreate: () => void;
}) {
  if (hasFilters) {
    return (
      <div className="px-6 py-14 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          No work packages match these filters.
        </p>
        <button
          onClick={onClear}
          className="mt-3 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
        >
          Clear filters
        </button>
      </div>
    );
  }

  if (noWorkTypes) {
    return (
      <div className="px-6 py-14 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-amber-500" />
        <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
          No work types are set up yet.
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Every package needs a work type, which decides how it is measured, who may do it and how
          it bills. Load the standard catalogue to start.
        </p>
        <button
          onClick={onSeed}
          className="mt-4 rounded-xl bg-[#0084bf] px-4 py-2 text-sm font-semibold text-white shadow-glow-blue hover:bg-[#0075ab]"
        >
          Load standard catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-14 text-center">
      <Box className="mx-auto h-7 w-7 text-slate-300" />
      <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
        No work packages yet.
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Break a job's scope into packages so each piece can be assigned, certified and billed on its
        own terms.
      </p>
      <button
        onClick={onCreate}
        className="mt-4 rounded-xl bg-[#0084bf] px-4 py-2 text-sm font-semibold text-white shadow-glow-blue hover:bg-[#0075ab]"
      >
        Create the first package
      </button>
    </div>
  );
}

function CreatePackageDialog({
  workTypes, onClose, onCreated,
}: {
  workTypes: any[]; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({
    job_id: "", work_type_code: "", title: "", discipline: "", location: "",
    planned_start: "", planned_finish: "", planned_quantity: "", rate: "",
  });
  const [saving, setSaving] = useState(false);

  const chosen = workTypes.find((t) => t.work_type_code === form.work_type_code);
  const valid = form.job_id.trim() && form.work_type_code && form.title.trim();

  async function submit() {
    if (!valid) return;
    setSaving(true);
    try {
      await api.createWorkPackage({
        job_id: form.job_id.trim(),
        work_type_code: form.work_type_code,
        title: form.title.trim(),
        discipline: form.discipline || undefined,
        location: form.location || undefined,
        planned_start: form.planned_start || undefined,
        planned_finish: form.planned_finish || undefined,
        planned_quantity: form.planned_quantity ? Number(form.planned_quantity) : 0,
        rate: form.rate ? Number(form.rate) : 0,
      });
      toast.success("Work package created.");
      onCreated();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not create the package.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-wp-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lift dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="create-wp-title" className="font-heading text-lg font-bold text-slate-900 dark:text-white">
              New work package
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              The work type sets how this package is measured and billed.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          <Field label="Job" hint="The job this scope belongs to, e.g. JOB-2026-0001">
            <input
              value={form.job_id}
              onChange={(e) => setForm({ ...form, job_id: e.target.value })}
              placeholder="JOB-2026-0001"
              className={inputClass}
            />
          </Field>

          <Field label="Work type">
            <select
              value={form.work_type_code}
              onChange={(e) => setForm({ ...form, work_type_code: e.target.value })}
              className={inputClass}
            >
              <option value="">Choose a work type</option>
              {workTypes.map((t) => (
                <option key={t.work_type_code} value={t.work_type_code}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>

          {chosen && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <span>
                Bills {RATE_BASIS_LABEL[chosen.default_rate_basis]?.toLowerCase() ?? chosen.default_rate_basis}
              </span>
              {chosen.measurement_uom && <span>Measured in {chosen.measurement_uom}</span>}
              {chosen.certification_required_before_billing && (
                <span className="inline-flex items-center gap-1 text-[#e35f14]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Needs certification before billing
                </span>
              )}
            </div>
          )}

          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Penstock fabrication — stage inspection"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Discipline">
              <input
                value={form.discipline}
                onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                placeholder="Mechanical"
                className={inputClass}
              />
            </Field>
            <Field label="Location">
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Bhootpur, Telangana"
                className={inputClass}
              />
            </Field>
            <Field label="Planned start">
              <input
                type="date"
                value={form.planned_start}
                onChange={(e) => setForm({ ...form, planned_start: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Planned finish">
              <input
                type="date"
                value={form.planned_finish}
                onChange={(e) => setForm({ ...form, planned_finish: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label={`Planned quantity${chosen?.measurement_uom ? ` (${chosen.measurement_uom})` : ""}`}>
              <input
                type="number"
                min="0"
                value={form.planned_quantity}
                onChange={(e) => setForm({ ...form, planned_quantity: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Rate">
              <input
                type="number"
                min="0"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid || saving}
            className="rounded-xl bg-[#0084bf] px-4 py-2 text-sm font-semibold text-white shadow-glow-blue hover:bg-[#0075ab] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create package"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0084bf] focus:outline-none focus:ring-2 focus:ring-[#0084bf]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

function Field({
  label, hint, children,
}: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
