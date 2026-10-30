"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Shield, RefreshCw, Plus, AlertTriangle, X, ArrowRight, ClipboardList,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatDate } from "@/lib/workPackageLifecycle";
import {
  Card, EmptyState, Metric, PageHeader, SkeletonRows, StatusPill, Tone,
  buttonPrimary, buttonSecondary, humanise, inputClass,
} from "@/components/ui";

/**
 * Risk and opportunity register (ISO/IEC 17020:2026), and the audit plan that
 * falls out of it.
 *
 * The register and the plan are on one screen because they are one thing: the
 * revision made auditing risk-based, so the plan is not a separate artefact —
 * it is what the register says to do next.
 */

const CATEGORIES = [
  "IMPARTIALITY", "COMPETENCE", "EQUIPMENT", "METHOD", "DATA_SECURITY",
  "SUBCONTRACTING", "COMMERCIAL", "LEGAL", "OPERATIONAL", "OPPORTUNITY",
];

const TREATMENTS = ["MITIGATE", "ACCEPT", "TRANSFER", "AVOID", "PURSUE"];

const STATUS_TONE: Record<string, Tone> = {
  OPEN: "warn", TREATED: "ok", ACCEPTED: "idle", CLOSED: "idle",
};

/** 1–25. Banded rather than continuous: a reviewer acts on the band. */
function scoreTone(score: number): Tone {
  if (score >= 15) return "bad";
  if (score >= 9) return "warn";
  return "ok";
}

export default function RisksPage() {
  const [items, setItems] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, od, ap] = await Promise.all([
        api.getRisks(category ? { category } : undefined),
        api.getOverdueRisks().catch(() => null),
        api.getAuditPlan(4).catch(() => null),
      ]);
      setItems(list?.data ?? []);
      setOverdue(od);
      setPlan(ap);
    } catch (e: any) {
      if (e?.response?.status === 403) {
        toast.error("Your role may not read the risk register.");
      } else {
        toast.error("Could not load the register.");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const material = items.filter((r) => r.material);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Shield}
        title="Risk register"
        description="What could go wrong, what is being done about it, and what that says to audit next."
        actions={
          <>
            <button onClick={() => setAdding(true)} className={buttonPrimary}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Raise a risk</span>
              <span className="sm:hidden">Raise</span>
            </button>
            <button onClick={load} className={buttonSecondary}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </>
        }
      />

      {overdue?.overdue_review?.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {overdue.overdue_review.length} risk
                {overdue.overdue_review.length === 1 ? " is" : "s are"} overdue for review
              </p>
              <p className="mt-0.5 text-sm text-amber-800/90 dark:text-amber-300/90">
                A register nobody revisits records the position as it was, not as it is.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <Metric value={items.length} label="On the register" />
          <Metric
            value={material.length}
            label="Material"
            tone={material.length ? "warn" : "ok"}
          />
          <Metric
            value={overdue?.material_never_audited?.length ?? 0}
            label="Material, never audited"
            tone={overdue?.material_never_audited?.length ? "bad" : "ok"}
          />
        </div>
      </Card>

      {/* The plan is the register's output, so it sits with it rather than on
          a page of its own. */}
      {plan?.proposed?.length > 0 && (
        <Card className="p-4">
          <div className="flex items-start gap-2">
            <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-sm font-semibold text-slate-900 dark:text-white">
                What to audit next
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {plan.note}
              </p>
              <ol className="mt-3 space-y-2">
                {plan.proposed.map((p: any, i: number) => (
                  <li
                    key={p.category}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
                  >
                    <span className="font-mono text-xs text-slate-400">{i + 1}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {humanise(p.category)}
                    </span>
                    {p.never_audited && <StatusPill tone="warn">Never audited</StatusPill>}
                    <span className="text-xs text-slate-500">{p.why}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Card>
      )}

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className={inputClass + " sm:w-64"}
      >
        <option value="">Any category</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{humanise(c)}</option>
        ))}
      </select>

      {loading ? (
        <SkeletonRows rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Nothing on the register"
          description="An empty register cannot drive an audit plan — a plan built without one is a tour of the quality manual."
        />
      ) : (
        <div className="space-y-2.5">
          {items.map((r) => (
            <Card key={r.risk_id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={scoreTone(r.residual_score)}>
                      {r.residual_score}
                    </StatusPill>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {r.title}
                    </span>
                    <StatusPill tone={STATUS_TONE[r.status] ?? "idle"}>
                      {humanise(r.status)}
                    </StatusPill>
                  </div>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {r.description}
                  </p>

                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>{humanise(r.category)}</span>
                    <span>{humanise(r.treatment)}</span>
                    <span>Owner {r.owner}</span>
                    {/* Both numbers, because the residual alone loses the
                        reason the controls exist. */}
                    <span>
                      {r.inherent_score} before controls, {r.residual_score} after
                    </span>
                    {r.review?.review_due_on && (
                      <span
                        className={
                          r.review.current ? "" : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        Review {formatDate(r.review.review_due_on)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setOpen(r.risk_id)}
                  className={buttonSecondary + " shrink-0 !px-2.5 !py-1.5 text-xs"}
                >
                  Open
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {open && (
        <RiskDrawer riskId={open} onClose={() => setOpen(null)} onChanged={load} />
      )}
      {adding && <RaiseDialog onClose={() => setAdding(false)} onSaved={load} />}
    </div>
  );
}

function RiskDrawer({
  riskId, onClose, onChanged,
}: {
  riskId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ note: "", likelihood: "", impact: "", status: "" });

  const load = useCallback(async () => {
    try {
      const d = await api.getRisk(riskId);
      setData(d);
      setF((prev) => ({
        ...prev,
        likelihood: String(d.risk.residual_likelihood),
        impact: String(d.risk.residual_impact),
        status: d.risk.status,
      }));
    } catch {
      toast.error(`Could not open ${riskId}.`);
      onClose();
    }
  }, [riskId, onClose]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async () => {
    setBusy(true);
    try {
      await api.reviewRisk(riskId, {
        note: f.note,
        residual_likelihood: Number(f.likelihood),
        residual_impact: Number(f.impact),
        status: f.status,
      });
      toast.success("Review recorded.");
      setF({ ...f, note: "" });
      await load();
      onChanged();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "That did not work.");
    } finally {
      setBusy(false);
    }
  };

  const r = data?.risk;
  const projected = Number(f.likelihood || 0) * Number(f.impact || 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white p-4 shadow-2xl sm:p-5 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-white">
              {r?.title ?? riskId}
            </h2>
            {r && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-slate-400">{r.risk_id}</span>
                <StatusPill tone={scoreTone(r.residual_score)}>
                  {r.residual_score}
                </StatusPill>
                <span className="text-xs text-slate-400">{humanise(r.category)}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!data ? (
          <div className="mt-4"><SkeletonRows rows={3} /></div>
        ) : (
          <div className="mt-4 space-y-4">
            <Card className="p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300">{r.description}</p>
              {r.controls?.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {r.controls.map((c: any, i: number) => (
                    <li key={i} className="text-sm">
                      <span className="text-slate-700 dark:text-slate-300">
                        {c.description}
                      </span>
                      {c.evidence && (
                        <span className="ml-2 text-xs text-slate-400">
                          Evidence: {c.evidence}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {r.acceptance_rationale && (
                <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-amber-700 dark:border-slate-800 dark:text-amber-400">
                  Accepted by {r.accepted_by}: {r.acceptance_rationale}
                </p>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Review it
              </h3>
              <div className="mt-3 space-y-2">
                <textarea
                  value={f.note}
                  onChange={(e) => setF({ ...f, note: e.target.value })}
                  rows={2}
                  placeholder="What changed, and why"
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-2">
                  {(["likelihood", "impact"] as const).map((k) => (
                    <label key={k} className="text-xs text-slate-500">
                      Residual {k} (1–5)
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={(f as any)[k]}
                        onChange={(e) => setF({ ...f, [k]: e.target.value })}
                        className={inputClass + " mt-0.5"}
                      />
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Residual would be
                  </span>
                  <StatusPill tone={scoreTone(projected)}>{projected}</StatusPill>
                  <span className="text-xs text-slate-400">
                    against {r.inherent_score} before controls
                  </span>
                </div>
                <select
                  value={f.status}
                  onChange={(e) => setF({ ...f, status: e.target.value })}
                  className={inputClass}
                >
                  {["OPEN", "TREATED", "ACCEPTED", "CLOSED"].map((s) => (
                    <option key={s} value={s}>{humanise(s)}</option>
                  ))}
                </select>
                <button
                  onClick={review}
                  disabled={busy || !f.note.trim()}
                  className={buttonPrimary + " w-full sm:w-auto"}
                >
                  Record the review
                </button>
              </div>
            </Card>

            {data.reviews?.length > 0 && (
              <Card className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Review history
                </h3>
                <ul className="mt-2 space-y-2">
                  {data.reviews.map((v: any) => (
                    <li key={v.review_id} className="text-sm">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>{formatDate(v.reviewed_on)}</span>
                        <span>{v.reviewed_by}</span>
                        {v.residual_likelihood && v.residual_impact && (
                          <StatusPill
                            tone={scoreTone(v.residual_likelihood * v.residual_impact)}
                          >
                            {v.residual_likelihood * v.residual_impact}
                          </StatusPill>
                        )}
                      </div>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-300">{v.note}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {data.audits?.length > 0 && (
              <Card className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Audits testing this
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {data.audits.map((a: any) => (
                    <li key={a.audit_id} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-mono text-xs text-slate-400">{a.audit_id}</span>
                      <span className="text-slate-700 dark:text-slate-300">{a.title}</span>
                      <StatusPill tone={a.status === "COMPLETED" ? "ok" : "idle"}>
                        {humanise(a.status)}
                      </StatusPill>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RaiseDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    title: "", description: "", category: "OPERATIONAL", owner: "",
    source: "", treatment: "MITIGATE",
    il: "3", ii: "3", rl: "3", ri: "3", rationale: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  const inherent = Number(f.il) * Number(f.ii);
  const residual = Number(f.rl) * Number(f.ri);
  // Mirrors the server rule, so the refusal is visible before submitting
  // rather than arriving as an error.
  const impartialityBlocked =
    f.category === "IMPARTIALITY" && f.treatment === "ACCEPT" && residual >= 6;

  const save = async () => {
    setSaving(true);
    try {
      await api.createRisk({
        title: f.title.trim(),
        description: f.description.trim(),
        category: f.category,
        owner: f.owner.trim(),
        source: f.source || undefined,
        treatment: f.treatment,
        inherent_likelihood: Number(f.il),
        inherent_impact: Number(f.ii),
        residual_likelihood: Number(f.rl),
        residual_impact: Number(f.ri),
        acceptance_rationale: f.rationale || undefined,
      });
      toast.success("Raised.");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Could not raise it.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-b-none p-5 sm:rounded-2xl">
        <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white">
          Raise a risk
        </h2>
        <div className="mt-3 space-y-2">
          <input value={f.title} onChange={set("title")} placeholder="Title" className={inputClass} />
          <textarea
            value={f.description}
            onChange={set("description")}
            rows={2}
            placeholder="What could happen, and what it would mean"
            className={inputClass}
          />
          <select value={f.category} onChange={set("category")} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{humanise(c)}</option>
            ))}
          </select>
          <input value={f.owner} onChange={set("owner")} placeholder="Owner" className={inputClass} />
          <input
            value={f.source}
            onChange={set("source")}
            placeholder="Where it came from (an audit finding, a complaint, a near miss)"
            className={inputClass}
          />
          <select value={f.treatment} onChange={set("treatment")} className={inputClass}>
            {TREATMENTS.map((t) => (
              <option key={t} value={t}>{humanise(t)}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
            {([["il", "Likelihood before"], ["ii", "Impact before"],
               ["rl", "Likelihood after"], ["ri", "Impact after"]] as const).map(
              ([k, label]) => (
                <label key={k} className="text-xs text-slate-500">
                  {label}
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={(f as any)[k]}
                    onChange={set(k)}
                    className={inputClass + " mt-0.5"}
                  />
                </label>
              ),
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-500">
              {inherent} before controls,
            </span>
            <StatusPill tone={scoreTone(residual)}>{residual} after</StatusPill>
          </div>

          {f.treatment === "ACCEPT" && residual >= 9 && (
            <input
              value={f.rationale}
              onChange={set("rationale")}
              placeholder="Why this is being accepted"
              className={inputClass}
            />
          )}
          {impartialityBlocked && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              An impartiality risk scoring {residual} cannot be accepted. The standard
              requires threats to impartiality to be eliminated or minimised — reduce
              it, transfer it, or avoid the work.
            </p>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button
            onClick={save}
            disabled={
              saving || !f.title.trim() || !f.description.trim() ||
              !f.owner.trim() || impartialityBlocked
            }
            className={buttonPrimary}
          >
            {saving ? "Raising…" : "Raise it"}
          </button>
        </div>
      </Card>
    </div>
  );
}
