"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Shield, RefreshCw, AlertTriangle, Users, Building2, ArrowRight,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import {
  Card, EmptyState, Metric, PageHeader, SkeletonRows, StatusPill, Tone,
  buttonPrimary, buttonSecondary, formatINR,
} from "@/components/ui";

/**
 * Impartiality exposure, computed from the work rather than declared.
 *
 * The register holds whatever someone thought to write down. What it cannot
 * hold is the condition that actually creates the risk, because no single
 * screen could show it: how much of the body's revenue comes from one client,
 * and which inspectors spend most of their time working for that client.
 *
 * The two are kept apart on purpose, and the layout is the argument:
 *
 *   financial dependence   a client the body cannot afford to fail
 *   personal familiarity   an inspector who works for nobody else
 *
 * A body can be well diversified overall and still have someone who has
 * worked for one client for three years. Summing them into a single
 * "impartiality score" would hide exactly that case. The intersection gets
 * its own section because it is the one an assessor opens with.
 *
 * Nothing here is a finding, and the page says so. These are conditions that
 * call for a treatment — rotation, a second reviewer, a declared risk.
 */

const WINDOWS = [
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
  { days: 730, label: "24 months" },
];

function shareTone(pct: number, threshold: number): Tone {
  if (pct >= threshold * 1.6) return "bad";
  if (pct >= threshold) return "warn";
  return "ok";
}

export default function ImpartialityPage() {
  const [data, setData] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowDays, setWindowDays] = useState(365);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [exposure, props] = await Promise.all([
        api.impartialityExposure(windowDays),
        api.impartialityProposals(windowDays).catch(() => null),
      ]);
      setData(exposure);
      setProposals(props?.proposals ?? []);
    } catch {
      toast.error("Could not compute the exposure");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [windowDays]);

  useEffect(() => {
    load();
  }, [load]);

  const clients = data?.clients ?? [];
  const concentrated = data?.concentrated_clients ?? [];
  const familiar = data?.familiar_inspectors ?? [];
  const compounded = data?.compounded ?? [];
  const threshold = data?.concentration_threshold_percent ?? 25;
  const famThreshold = data?.familiarity_threshold_percent ?? 70;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={Shield}
        title="Impartiality Exposure"
        description="Where the pressure sits — revenue concentration, and inspectors who work for one client"
        actions={
          <div className="flex flex-wrap gap-2">
            {WINDOWS.map((w) => (
              <button
                key={w.days}
                onClick={() => setWindowDays(w.days)}
                className={windowDays === w.days ? buttonPrimary : buttonSecondary}
              >
                {w.label}
              </button>
            ))}
            <button onClick={load} className={buttonSecondary}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        }
      />

      {loading ? (
        <SkeletonRows rows={6} />
      ) : !data?.measurable ? (
        <EmptyState
          icon={Shield}
          title="Concentration cannot be measured yet"
          description="No invoiced revenue in this window. That is not the same as no concentration — there is simply nothing to measure against."
        />
      ) : (
        <>
          <Card className="p-4">
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <Metric
                value={`${(data.top_client_share_percent ?? 0).toFixed(0)}%`}
                label="Largest client"
                sub={clients[0]?.client_name}
                tone={shareTone(data.top_client_share_percent ?? 0, threshold)}
              />
              <Metric
                value={concentrated.length}
                label={`Clients over ${threshold.toFixed(0)}%`}
                tone={concentrated.length ? "warn" : "ok"}
              />
              <Metric
                value={familiar.length}
                label="Inspectors tied to one client"
                sub={`${famThreshold.toFixed(0)}% or more of their work`}
                tone={familiar.length ? "warn" : "ok"}
              />
              <Metric
                value={compounded.length}
                label="Both at once"
                sub="Undeclared"
                tone={compounded.length ? "bad" : "ok"}
              />
            </div>
          </Card>

          {compounded.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-rose-900">
                    Both pressures at once
                  </h2>
                  <p className="text-sm text-rose-900/90 max-w-2xl">
                    These inspectors work almost entirely for a client that is
                    also a large share of revenue, with no conflict declared on
                    file. That intersection is the case an assessor opens with.
                  </p>
                </div>
              </div>
              {compounded.map((p: any) => (
                <Card
                  key={`${p.person_id}-${p.client_id}`}
                  className="p-4 border-l-4 border-l-rose-500"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {p.person_id}
                      </p>
                      <p className="text-sm text-slate-600 break-words">
                        {p.share_percent.toFixed(0)}% of their assignments (
                        {p.assignments} of {p.assignments_total}) are for{" "}
                        {p.client_name}, which is also a large share of revenue.
                      </p>
                    </div>
                    <StatusPill tone="bad">No declared conflict</StatusPill>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* The two exposures, side by side at desktop and stacked on a
              phone. Kept apart because they are different pressures and a
              single score would hide the case where only one is present. */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-[#0084bf] shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Financial dependence
                  </h2>
                  <p className="text-sm text-slate-500">
                    A client the body cannot afford to fail exerts pressure
                    whether or not anyone acts on it.
                  </p>
                </div>
              </div>
              <Card className="divide-y divide-slate-100">
                {clients.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">
                    No invoiced revenue in this window.
                  </p>
                ) : (
                  clients.slice(0, 8).map((c: any) => (
                    <div key={c.client_id} className="p-3.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span className="font-medium text-slate-900 min-w-0 break-words">
                          {c.client_name}
                        </span>
                        <span
                          className={`text-sm tabular-nums ${
                            c.above_threshold
                              ? "text-amber-700 font-semibold"
                              : "text-slate-500"
                          }`}
                        >
                          {c.share_percent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.share_percent >= threshold * 1.6
                              ? "bg-rose-500"
                              : c.above_threshold
                              ? "bg-amber-500"
                              : "bg-[#0084bf]"
                          }`}
                          style={{ width: `${Math.max(2, c.share_percent)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatINR(c.invoiced)} invoiced
                      </p>
                    </div>
                  ))
                )}
              </Card>
            </section>

            <section className="space-y-3">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-[#0084bf] shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Personal familiarity
                  </h2>
                  <p className="text-sm text-slate-500">
                    Anyone with six assignments or fewer is left out — a high
                    share there means they are new, not captured.
                  </p>
                </div>
              </div>
              <Card className="divide-y divide-slate-100">
                {familiar.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">
                    No inspector sends {famThreshold.toFixed(0)}% or more of
                    their assignments to a single client.
                  </p>
                ) : (
                  familiar.map((p: any) => (
                    <div key={`${p.person_id}-${p.client_id}`} className="p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="font-medium text-slate-900">
                          {p.person_id}
                        </span>
                        <div className="flex items-center gap-2">
                          {p.already_declared && (
                            <StatusPill tone="idle">Declared</StatusPill>
                          )}
                          <span className="text-sm tabular-nums text-amber-700 font-semibold">
                            {p.share_percent.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600 break-words">
                        {p.assignments} of {p.assignments_total} assignments for{" "}
                        {p.client_name}
                      </p>
                    </div>
                  ))
                )}
              </Card>
            </section>
          </div>

          {proposals.length > 0 && (
            <section className="space-y-3">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Suggested register entries
                </h2>
                <p className="text-sm text-slate-500 max-w-2xl">
                  Nothing here has been written. A risk that appeared on the
                  register without anyone deciding it was one has not been
                  identified in any sense an assessor would accept — raise the
                  ones that are real.
                </p>
              </div>
              {proposals.map((p: any, i: number) => (
                <Card key={i} className="p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 lg:flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone="warn">Impartiality</StatusPill>
                        <span className="text-xs text-slate-500">
                          Suggested score{" "}
                          {p.inherent_likelihood * p.inherent_impact}
                        </span>
                        {p.above_tolerance && (
                          <StatusPill tone="bad">Above tolerance</StatusPill>
                        )}
                      </div>
                      <h3 className="mt-1.5 font-semibold text-slate-900 break-words">
                        {p.title}
                      </h3>
                      <p className="text-sm text-slate-600 break-words">
                        {p.description}
                      </p>
                    </div>
                    <a
                      href="/risks"
                      className={`${buttonSecondary} shrink-0 no-underline`}
                    >
                      Raise on the register <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </Card>
              ))}
            </section>
          )}

          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {data.note}
          </p>
        </>
      )}
    </div>
  );
}
