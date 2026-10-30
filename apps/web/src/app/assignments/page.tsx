"use client";

import { useCallback, useEffect, useState } from "react";
import {
  UserCheck, RefreshCw, X, ShieldCheck, AlertTriangle, CheckCircle2, Search, Sparkles,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatDate } from "@/lib/workPackageLifecycle";

type Unassigned = {
  work_package_id: string;
  title: string;
  work_type_code: string;
  job_id: string;
  location?: string | null;
  planned_start?: string | null;
  planned_finish?: string | null;
  discipline?: string | null;
};

type Recommendation = {
  person_id: string;
  full_name: string;
  score: number;
  breakdown: {
    skill_depth: number; proximity: number; availability: number;
    workload: number; past_performance: number; total: number;
    narrative?: string | null;
  };
  base_location?: string | null;
  inspection_types: string[];
  authorization_valid_until?: string | null;
  engagement_type: string;
};

const FACTOR_LABEL: Record<string, string> = {
  skill_depth: "Skill depth",
  proximity: "Distance",
  availability: "Free in the window",
  workload: "Current load",
  past_performance: "Past work",
};

/** Mirrors backend WEIGHTS — shown so the ranking is not a black box. */
const FACTOR_WEIGHT: Record<string, number> = {
  skill_depth: 0.4, proximity: 0.25, availability: 0.2,
  workload: 0.1, past_performance: 0.05,
};

export default function AssignmentsPage() {
  const [packages, setPackages] = useState<Unassigned[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Unassigned | null>(null);
  const [rec, setRec] = useState<any>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.getWorkPackages({ status: "planned", per_page: 200 });
      setPackages(r?.data ?? []);
    } catch {
      toast.error("Could not load work packages. Check the API connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function openRecommendations(wp: Unassigned) {
    setActive(wp);
    setRec(null);
    setRecLoading(true);
    try {
      setRec(await api.recommendOfficers(wp.work_package_id, 5));
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not work out who is eligible.");
      setActive(null);
    } finally {
      setRecLoading(false);
    }
  }

  async function assign(personId: string, method = "ai_recommended") {
    if (!active) return;
    setAssigning(personId);
    try {
      await api.assignOfficer({
        work_package_id: active.work_package_id,
        person_id: personId,
        method,
      });
      toast.success("Officer assigned.");
      setActive(null);
      setRec(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "That assignment was rejected.");
    } finally {
      setAssigning(null);
    }
  }

  const visible = packages.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.work_package_id.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.job_id.toLowerCase().includes(q) ||
      (p.location ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#0084bf] to-[#00618e] text-white shadow-glow-blue">
            <UserCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Assignments
            </h1>
            <p className="mt-0.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Work waiting for an inspection officer, and who is qualified to take it.
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

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search unassigned work by package, title, job or location"
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

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-4">
                <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-400" />
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              {search ? "Nothing matches that search." : "Every work package has an officer."}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {search
                ? "Clear the search to see all unassigned work."
                : "New packages appear here as soon as they are created."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.map((wp) => (
              <div
                key={wp.work_package_id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold text-[#0084bf]">
                      {wp.work_package_id}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {wp.work_type_code}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-slate-800 dark:text-slate-200">
                    {wp.title}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-400">
                    <span>{wp.job_id}</span>
                    {wp.location && <span>{wp.location}</span>}
                    {wp.planned_start && (
                      <span>
                        {formatDate(wp.planned_start)} – {formatDate(wp.planned_finish)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      setAssigning(wp.work_package_id);
                      try {
                        const recs = await api.recommendOfficers(wp.work_package_id, 1);
                        if (recs?.recommendations?.[0]) {
                          const best = recs.recommendations[0];
                          await api.assignOfficer({
                            work_package_id: wp.work_package_id,
                            person_id: best.person_id,
                            method: "ai_recommended",
                          });
                          toast.success(`⚡ Smart Dispatched ${best.full_name} (${Math.round(best.score * 100)}% fit, ISO 17020 impartial)`);
                          load();
                        } else {
                          toast.error("No eligible impartial inspector found.");
                        }
                      } catch (err: any) {
                        toast.error(err?.response?.data?.detail || "Dispatch failed");
                      } finally {
                        setAssigning(null);
                      }
                    }}
                    disabled={assigning === wp.work_package_id}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs px-3 py-2 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>Auto-Dispatch</span>
                  </button>

                  <button
                    onClick={() => openRecommendations(wp)}
                    className="shrink-0 rounded-xl bg-[#0084bf] px-3.5 py-2 text-sm font-semibold text-white shadow-glow-blue hover:bg-[#0075ab]"
                  >
                    Find officers
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {active && (
        <RecommendationPanel
          wp={active}
          rec={rec}
          loading={recLoading}
          assigning={assigning}
          onAssign={assign}
          onClose={() => {
            setActive(null);
            setRec(null);
          }}
        />
      )}
    </div>
  );
}

function RecommendationPanel({
  wp, rec, loading, assigning, onAssign, onClose,
}: {
  wp: Unassigned;
  rec: any;
  loading: boolean;
  assigning: string | null;
  onAssign: (personId: string) => void;
  onClose: () => void;
}) {
  const [showExcluded, setShowExcluded] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rec-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lift dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="rec-title" className="font-heading text-lg font-bold text-slate-900 dark:text-white">
              Who can take {wp.work_package_id}
            </h2>
            <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
              {wp.title}
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

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : !rec ? null : (
          <>
            {/* The ISO 17020 gate, stated plainly */}
            <div className="mb-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 p-3 text-xs text-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-[#0084bf] dark:text-sky-300">
                <ShieldCheck className="h-4 w-4" />
                <span>ISO/IEC 17020:2026 Impartiality &amp; Competency Gate</span>
              </div>
              <p className="leading-relaxed">
                {rec.eligible_count} of {rec.pool_size} inspectors satisfy criteria.
                {rec.required_authorization_types?.length > 0 && (
                  <> Requires active authorization for <strong>{rec.required_authorization_types.join(", ")}</strong>.</>
                )}{" "}
                Inspectors with supplier affiliations, active conflict declarations (Clause 4.1), or schedule overlaps are strictly excluded.
              </p>
            </div>

            {rec.recommendations.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-6 text-center dark:border-amber-900/50 dark:bg-amber-950/30">
                <AlertTriangle className="mx-auto h-6 w-6 text-amber-600" />
                <p className="mt-2 text-sm font-medium text-amber-900 dark:text-amber-200">
                  Nobody is eligible for this work.
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-amber-800/80 dark:text-amber-300/80">
                  Authorize someone for the required inspection types, or raise a manpower
                  requisition.
                </p>
              </div>
            ) : (
              <ol className="space-y-2.5">
                {rec.recommendations.map((r: Recommendation, i: number) => (
                  <li
                    key={r.person_id}
                    className={`rounded-xl border p-3.5 ${
                      i === 0
                        ? "border-[#0084bf] bg-iqe-50/50 dark:border-[#0084bf] dark:bg-iqe-950/30"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {r.full_name}
                          </span>
                          <span className="font-mono text-xs text-slate-400">{r.person_id}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            ISO 17020 Impartial
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                          {r.base_location && <span>{r.base_location}</span>}
                          <span>{r.engagement_type.toLowerCase().replace("_", " ")}</span>
                          {r.authorization_valid_until && (
                            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                              <ShieldCheck className="h-3 w-3 text-emerald-600" />
                              valid to {formatDate(r.authorization_valid_until)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <div className="font-heading text-lg font-bold tabular-nums text-[#0084bf]">
                            {Math.round(r.score * 100)}
                          </div>
                          <div className="text-[11px] text-slate-400">fit</div>
                        </div>
                        <button
                          onClick={() => onAssign(r.person_id)}
                          disabled={assigning === r.person_id}
                          className="rounded-xl bg-[#0084bf] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0075ab] disabled:opacity-50"
                        >
                          {assigning === r.person_id ? "Assigning…" : "Assign"}
                        </button>
                      </div>
                    </div>

                    {/* Score breakdown — the ranking should not be a black box */}
                    <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                      {Object.entries(FACTOR_LABEL).map(([key, label]) => {
                        const earned = (r.breakdown as any)[key] ?? 0;
                        const max = FACTOR_WEIGHT[key];
                        const pct = max ? Math.round((earned / max) * 100) : 0;
                        return (
                          <span key={key} className="text-[11px] text-slate-500 dark:text-slate-400">
                            {label}{" "}
                            <span className="font-medium tabular-nums text-slate-700 dark:text-slate-200">
                              {pct}%
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {rec.excluded_count > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowExcluded(!showExcluded)}
                  aria-expanded={showExcluded}
                  className="text-xs font-semibold text-[#0084bf] hover:underline"
                >
                  {showExcluded ? "Hide" : "Show"} the {rec.excluded_count} who cannot
                </button>
                {showExcluded && (
                  <ul className="mt-2 space-y-1">
                    {rec.excluded.map((e: any) => (
                      <li
                        key={e.person_id}
                        className="flex flex-wrap items-baseline gap-x-2 text-xs text-slate-500 dark:text-slate-400"
                      >
                        <span className="text-slate-700 dark:text-slate-300">{e.full_name}</span>
                        <span className="font-mono text-slate-400">{e.person_id}</span>
                        <span>— {e.reason}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {!rec.auto_assign_allowed && rec.recommendations.length > 0 && (
              <p className="mt-4 text-xs text-slate-400">{rec.auto_assign_reason}.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
