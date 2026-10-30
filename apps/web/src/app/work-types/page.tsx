"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Boxes, Search, RefreshCw, CheckCircle2, Power, Wrench, ClipboardCheck, X,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { RATE_BASIS_LABEL } from "@/lib/workPackageLifecycle";

type WorkType = {
  work_type_code: string;
  name: string;
  description?: string | null;
  discipline_tags: string[];
  applicable_codes: string[];
  required_authorization_types: string[];
  required_qualifications: string[];
  min_experience_years: number;
  requires_photos: boolean;
  requires_measurements: boolean;
  measurement_uom?: string | null;
  measurement_method?: string | null;
  default_rate_basis: string;
  certification_required_before_billing: boolean;
  report_format_code?: string | null;
  ai_assists: string[];
  auto_assign_threshold?: number | null;
  is_active: boolean;
};

const AI_LABEL: Record<string, string> = {
  DOC_EXTRACT: "Reads documents",
  CHECKLIST_GEN: "Builds checklists",
  REPORT_DRAFT: "Drafts reports",
  VALIDATION: "Checks before submission",
  PHOTO_TAG: "Tags photos",
  ANOMALY: "Flags outliers",
};

export default function WorkTypesPage() {
  const [types, setTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.getWorkTypes({
        search: search || undefined,
        is_active: showInactive ? undefined : true,
      });
      setTypes(r?.data ?? []);
    } catch {
      toast.error("Could not load work types.");
    } finally {
      setLoading(false);
    }
  }, [search, showInactive]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function seed() {
    try {
      const r = await api.seedWorkTypes();
      toast.success(
        r.created?.length
          ? `Added ${r.created.length} work types.`
          : "Catalogue is already complete."
      );
      load();
    } catch {
      toast.error("Could not load the catalogue.");
    }
  }

  async function toggle(t: WorkType) {
    try {
      await api.setWorkTypeStatus(t.work_type_code, !t.is_active);
      toast.success(`${t.name} ${t.is_active ? "retired" : "reactivated"}.`);
      load();
    } catch {
      toast.error("Could not change that work type.");
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#0084bf] to-[#00618e] text-white shadow-glow-blue">
            <Boxes className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Work types
            </h1>
            <p className="mt-0.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Each type decides what a package captures, who is allowed to do it, how it is measured
              and how it bills. Change one here and every package of that type follows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#0084bf]"
            />
            Include retired
          </label>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, code or discipline"
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

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : types.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Wrench className="mx-auto h-7 w-7 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            {search ? "Nothing matches that search." : "The catalogue is empty."}
          </p>
          {!search && (
            <>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Load the standard set — code inspection, BOQ reconciliation, bill verification, GMP
                compliance, vendor audit, expediting, site acceptance tests and deputation. You can
                edit any of them afterwards.
              </p>
              <button
                onClick={seed}
                className="mt-4 rounded-xl bg-[#0084bf] px-4 py-2 text-sm font-semibold text-white shadow-glow-blue hover:bg-[#0075ab]"
              >
                Load standard catalogue
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {types.map((t) => {
            const open = expanded === t.work_type_code;
            return (
              <article
                key={t.work_type_code}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition-colors dark:bg-slate-900 ${
                  t.is_active
                    ? "border-slate-200/80 dark:border-slate-800"
                    : "border-dashed border-slate-300 opacity-70 dark:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-iqe-50 px-2 py-0.5 font-mono text-xs font-semibold text-[#00618e] dark:bg-iqe-950/60 dark:text-iqe-200">
                        {t.work_type_code}
                      </span>
                      {!t.is_active && (
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">
                          Retired
                        </span>
                      )}
                    </div>
                    <h2 className="mt-1.5 font-heading text-base font-bold text-slate-900 dark:text-white">
                      {t.name}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {t.description}
                    </p>
                  </div>
                  <button
                    onClick={() => toggle(t)}
                    title={t.is_active ? "Retire this work type" : "Bring it back"}
                    className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-[#0084bf] hover:text-[#0084bf] dark:border-slate-700"
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                  <div>
                    <dt className="text-xs text-slate-400">Bills</dt>
                    <dd className="text-slate-700 dark:text-slate-200">
                      {RATE_BASIS_LABEL[t.default_rate_basis] ?? t.default_rate_basis}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Measured in</dt>
                    <dd className="text-slate-700 dark:text-slate-200">{t.measurement_uom ?? "—"}</dd>
                  </div>
                </dl>

                {t.certification_required_before_billing && (
                  <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-iqeOrange-50 px-2 py-1 text-xs font-medium text-iqeOrange-800 dark:bg-iqeOrange-950/40 dark:text-iqeOrange-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Quantities must be certified before billing
                  </p>
                )}

                <button
                  onClick={() => setExpanded(open ? null : t.work_type_code)}
                  aria-expanded={open}
                  className="mt-3 text-xs font-semibold text-[#0084bf] hover:underline"
                >
                  {open ? "Hide detail" : "Show detail"}
                </button>

                {open && (
                  <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                    <Detail label="Codes applied" values={t.applicable_codes} />
                    <Detail label="Disciplines" values={t.discipline_tags} />
                    <Detail
                      label="Who may perform it"
                      values={[
                        ...t.required_authorization_types.map((a) => `Authorized for ${a}`),
                        ...t.required_qualifications,
                        t.min_experience_years
                          ? `${t.min_experience_years}+ years experience`
                          : "",
                      ].filter(Boolean)}
                      empty="Open to any deployable person"
                    />
                    <Detail
                      label="AI help enabled"
                      values={t.ai_assists.map((a) => AI_LABEL[a] ?? a)}
                      empty="None"
                    />
                    <div>
                      <span className="text-xs text-slate-400">Assignment</span>
                      <p className="mt-0.5 flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                        <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" />
                        {t.auto_assign_threshold == null
                          ? "Suggests officers, a person decides"
                          : `Assigns automatically above ${t.auto_assign_threshold}`}
                      </p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({
  label, values, empty = "—",
}: {
  label: string; values: string[]; empty?: string;
}) {
  return (
    <div>
      <span className="text-xs text-slate-400">{label}</span>
      {values.length === 0 ? (
        <p className="mt-0.5 text-slate-500 dark:text-slate-400">{empty}</p>
      ) : (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
