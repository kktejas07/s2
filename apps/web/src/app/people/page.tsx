"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users, Search, RefreshCw, X, ShieldCheck, AlertTriangle, CheckCircle2,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatDate } from "@/lib/workPackageLifecycle";

type Person = {
  person_id: string;
  full_name: string;
  employee_code?: string | null;
  inspector_code?: string | null;
  category: string;
  engagement_type: string;
  designation?: string | null;
  prof_qualification?: string | null;
  city_name?: string | null;
  base_location?: string | null;
  email?: string | null;
  phone?: string | null;
  employment_status: string;
  deployable: boolean;
  deployability_reason?: string | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  TECHNICAL_INSPECTION: "Inspection",
  TECHNICAL_ENGINEERING: "Engineering",
  SITE_LABOUR: "Site labour",
  ADMIN_SUPPORT: "Admin",
  CORPORATE_FUNCTION: "Corporate",
};

const ENGAGEMENT_LABEL: Record<string, string> = {
  PERMANENT: "Permanent",
  CONTRACT: "Contract",
  ASSOCIATE: "Associate",
  SECONDMENT: "Seconded",
  DAILY_WAGE: "Daily wage",
  TRAINEE: "Trainee",
  CONSULTANT: "Consultant",
};

const STATUS_LABEL: Record<string, string> = {
  onboarding: "Onboarding",
  active: "Active",
  on_bench: "On bench",
  deployed: "Deployed",
  on_leave: "On leave",
  suspended: "Suspended",
  exited: "Exited",
};

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [expiring, setExpiring] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [deployableOnly, setDeployableOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sum, exp] = await Promise.all([
        api.getPeople({
          search: search || undefined,
          category: category || undefined,
          deployable: deployableOnly ? true : undefined,
          per_page: 200,
        }),
        api.getPeopleSummary(),
        api.getExpiringCredentials(60),
      ]);
      setPeople(list?.data ?? []);
      setSummary(sum ?? null);
      setExpiring(exp ?? null);
    } catch {
      toast.error("Could not load people. Check the API connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [search, category, deployableOnly]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const deployable = summary?.deployable ?? 0;
  const total = summary?.total ?? 0;
  const notDeployable = summary?.not_deployable ?? 0;
  const legacyGrants = summary?.unverified_legacy_grants ?? 0;
  const expiringCount = expiring?.total ?? 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#0084bf] to-[#00618e] text-white shadow-glow-blue">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              People
            </h1>
            <p className="mt-0.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Who works here, and who is authorized to be assigned inspection work.
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

      {/* Deployable vs headcount — the distinction the gate exists to make */}
      {summary && total > 0 && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <div className="font-heading text-3xl font-bold tabular-nums text-[#0084bf]">
                {deployable}
                <span className="ml-1 text-lg font-medium text-slate-400">of {total}</span>
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                authorized and current, so assignable today
              </div>
            </div>

            {notDeployable > 0 && (
              <div>
                <div className="font-heading text-xl font-bold tabular-nums text-slate-400">
                  {notDeployable}
                </div>
                <div className="text-xs text-slate-400">not yet through the gate</div>
              </div>
            )}

            {summary.authorizations_pending > 0 && (
              <div>
                <div className="font-heading text-xl font-bold tabular-nums text-violet-600 dark:text-violet-400">
                  {summary.authorizations_pending}
                </div>
                <div className="text-xs text-slate-400">awaiting a decision</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Two things that become audit findings if ignored */}
      {legacyGrants > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900 dark:text-amber-200">
            <strong className="font-semibold">
              {legacyGrants} authorization{legacyGrants === 1 ? "" : "s"} carried over from the old
              system with no evidence behind{legacyGrants === 1 ? " it" : " them"}.
            </strong>{" "}
            Re-evidence before relying on{legacyGrants === 1 ? " it" : " them"} at an audit.
          </p>
        </div>
      )}

      {expiringCount > 0 && (
        <section className="rounded-2xl border border-iqeOrange-200 bg-iqeOrange-50/60 p-4 dark:border-iqeOrange-900/50 dark:bg-iqeOrange-950/25">
          <h2 className="text-sm font-semibold text-iqeOrange-900 dark:text-iqeOrange-200">
            Lapsing within 60 days
          </h2>
          <ul className="mt-2 space-y-1">
            {expiring.data.slice(0, 5).map((e: any, i: number) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-mono text-xs text-iqeOrange-800/70 dark:text-iqeOrange-300/70">
                  {e.person_id}
                </span>
                <span className="text-iqeOrange-900 dark:text-iqeOrange-200">{e.name}</span>
                <span className="text-xs text-iqeOrange-800/70 dark:text-iqeOrange-300/70">
                  {e.days_remaining} day{e.days_remaining === 1 ? "" : "s"} left ·{" "}
                  {formatDate(e.expires_on)}
                </span>
              </li>
            ))}
          </ul>
          {expiringCount > 5 && (
            <p className="mt-2 text-xs text-iqeOrange-800/70 dark:text-iqeOrange-300/70">
              and {expiringCount - 5} more
            </p>
          )}
        </section>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, employee code, stamp number or city"
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
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass + " sm:w-48"}
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <input
            type="checkbox"
            checked={deployableOnly}
            onChange={(e) => setDeployableOnly(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#0084bf]"
          />
          Assignable only
        </label>
      </div>

      {/* Directory */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-4">
                <div className="h-9 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : people.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Users className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              {search || category || deployableOnly
                ? "Nobody matches these filters."
                : "No people on record yet."}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {search || category || deployableOnly
                ? "Clear the filters to see everyone."
                : "Bring the existing staff across from the old system by running scripts/migrate_legacy_people.py from a machine that can reach the SQL Server."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-800/95">
                <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">Person</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Engagement</th>
                  <th className="px-4 py-3">Discipline</th>
                  <th className="px-4 py-3">Based</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assignable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {people.map((p) => (
                  <tr key={p.person_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{p.full_name}</div>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-slate-400">
                        <span className="font-mono">{p.person_id}</span>
                        {p.employee_code && <span>{p.employee_code}</span>}
                        {p.inspector_code && (
                          <span className="text-[#0084bf]">stamp {p.inspector_code}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {CATEGORY_LABEL[p.category] ?? p.category}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {ENGAGEMENT_LABEL[p.engagement_type] ?? p.engagement_type}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {p.prof_qualification ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {p.base_location ?? p.city_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {STATUS_LABEL[p.employment_status] ?? p.employment_status}
                    </td>
                    <td className="px-4 py-3">
                      {p.deployable ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800/60">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Yes
                        </span>
                      ) : (
                        <span
                          title={p.deployability_reason ?? undefined}
                          className="inline-block rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700"
                        >
                          {p.deployability_reason ?? "No"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!loading && people.length > 0 && (
        <p className="flex items-start gap-1.5 px-1 text-xs text-slate-400">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Assignable is derived, not set by hand: it needs a current authorization covering the
          work, no lapsed certificate, and an employment status that allows deployment.
        </p>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0084bf] focus:outline-none focus:ring-2 focus:ring-[#0084bf]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
