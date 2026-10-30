"use client";

import { useCallback, useEffect, useState } from "react";
import { Scale, RefreshCw, Plus, X, Users, ChevronRight } from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatDate } from "@/lib/workPackageLifecycle";
import {
  Card, EmptyState, Metric, PageHeader, SkeletonRows, StatusPill, Tone,
  buttonPrimary, buttonSecondary, humanise, inputClass,
} from "@/components/ui";

/**
 * Appeals against an inspection decision (ISO/IEC 17020 cl. 7.6).
 *
 * Distinct from a complaint, which concerns service. An appeal says the
 * technical conclusion was wrong, and must be decided by people who were not
 * party to it — so the page shows who made the contested decision alongside
 * the panel, which is the comparison a reviewer actually needs to make.
 */

type Appeal = {
  appeal_id: string;
  entity_type: string;
  entity_id: string;
  job_id?: string | null;
  appellant_name: string;
  appellant_organisation?: string | null;
  grounds: string;
  statement: string;
  received_date: string;
  original_decision_by: string[];
  status: string;
  reviewers: string[];
  outcome?: string | null;
  decided_by?: string | null;
  decided_at?: string | null;
  remedy_reference?: string | null;
};

const STATUS_TONE: Record<string, Tone> = {
  RECEIVED: "warn",
  UNDER_REVIEW: "info",
  UPHELD: "ok",
  PARTIALLY_UPHELD: "ok",
  REJECTED: "idle",
  WITHDRAWN: "idle",
};

const CLOSED = ["UPHELD", "PARTIALLY_UPHELD", "REJECTED", "WITHDRAWN"];

const GROUNDS = [
  "TECHNICAL_JUDGEMENT",
  "MEASUREMENT_DISPUTE",
  "CODE_INTERPRETATION",
  "DEDUCTION_DISPUTE",
  "SCOPE_DISPUTE",
  "PROCEDURAL",
  "OTHER",
];

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [raising, setRaising] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        api.getAppeals(statusFilter ? { status: statusFilter } : undefined),
        api.getAppealSummary(),
      ]);
      setAppeals(list?.data ?? []);
      setSummary(sum ?? null);
    } catch {
      toast.error("Could not load appeals. Check the API connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const assignPanel = async (appeal: Appeal) => {
    const entered = window.prompt(
      `Who will review ${appeal.appeal_id}? Enter person IDs separated by commas.\n\n` +
        `Anyone who took part in the original decision will be refused: ` +
        `${appeal.original_decision_by.join(", ") || "nobody recorded"}.`,
    );
    if (!entered?.trim()) return;
    const ids = entered.split(",").map((s) => s.trim()).filter(Boolean);
    try {
      await api.assignAppealReviewers(appeal.appeal_id, ids);
      toast.success("Independent panel assigned.");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Could not assign those reviewers.");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Scale}
        title="Appeals"
        description="Challenges to an inspection decision itself, decided by people who were not party to it. Complaints about service are handled separately."
        actions={
          <>
            <button onClick={() => setRaising(true)} className={buttonPrimary}>
              <Plus className="h-4 w-4" />
              Record an appeal
            </button>
            <button onClick={load} className={buttonSecondary}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </>
        }
      />

      {summary && summary.total > 0 && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-8">
            <Metric value={summary.open} label="Open" tone={summary.open ? "warn" : "ok"} />
            <Metric value={summary.total} label="Received in total" />
            <Metric
              value={`${summary.upheld_rate_pct}%`}
              label="Upheld or partly upheld"
              sub="How often the original decision was changed"
              tone={summary.upheld_rate_pct > 25 ? "warn" : undefined}
            />
            <Metric
              value={summary.average_days_to_decide ?? "—"}
              label="Average days to decide"
            />
          </div>
        </Card>
      )}

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className={inputClass + " sm:w-64"}
      >
        <option value="">Any status</option>
        {Object.keys(STATUS_TONE).map((s) => (
          <option key={s} value={s}>
            {humanise(s)}
          </option>
        ))}
      </select>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : appeals.length === 0 ? (
        <EmptyState
          icon={Scale}
          title={statusFilter ? "No appeals in that state" : "No appeals recorded"}
          description="An appeal contests a technical decision — a rejected weld, a deducted quantity. Recording one starts the independent review the standard requires."
          action={
            !statusFilter ? (
              <button onClick={() => setRaising(true)} className={buttonPrimary}>
                Record an appeal
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2.5">
          {appeals.map((a) => {
            const open = expanded === a.appeal_id;
            const closed = CLOSED.includes(a.status);
            return (
              <Card key={a.appeal_id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">{a.appeal_id}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {a.appellant_name}
                      </span>
                      {a.appellant_organisation && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {a.appellant_organisation}
                        </span>
                      )}
                      <StatusPill tone={STATUS_TONE[a.status] ?? "idle"}>
                        {humanise(a.status)}
                      </StatusPill>
                    </div>

                    <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">
                      {a.statement}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>{humanise(a.grounds)}</span>
                      <span>
                        Contests {humanise(a.entity_type)}{" "}
                        <span className="font-mono">{a.entity_id}</span>
                      </span>
                      <span>Received {formatDate(a.received_date)}</span>
                    </div>

                    {/* The comparison a reviewer needs: who decided, versus who is reviewing. */}
                    <div className="mt-2.5 flex flex-wrap gap-4 text-xs">
                      <div>
                        <span className="text-slate-400">Original decision by</span>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {a.original_decision_by?.length ? (
                            a.original_decision_by!.map((p) => (
                              <span
                                key={p}
                                className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">not recorded</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Independent panel</span>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {a.reviewers?.length ? (
                            a.reviewers!.map((p) => (
                              <span
                                key={p}
                                className="rounded-md bg-sky-50 px-1.5 py-0.5 font-mono text-sky-800 ring-1 ring-inset ring-sky-600/20 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-400/20"
                              >
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400">
                              none assigned yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {!closed && (
                      <>
                        <button
                          onClick={() => assignPanel(a)}
                          className={buttonSecondary + " !px-2.5 !py-1.5 text-xs"}
                        >
                          <Users className="h-3.5 w-3.5" />
                          {a.reviewers?.length ? "Change panel" : "Assign panel"}
                        </button>
                        {(a.reviewers?.length ?? 0) > 0 && (
                          <button
                            onClick={() => setExpanded(open ? null : a.appeal_id)}
                            className="inline-flex items-center gap-0.5 text-xs font-medium text-[#0084bf] hover:underline"
                          >
                            Record the decision
                            <ChevronRight
                              className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`}
                            />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {a.outcome && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{a.outcome}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Decided by {a.decided_by} on {formatDate(a.decided_at)}
                      {a.remedy_reference && ` · remedy ${a.remedy_reference}`}
                    </p>
                  </div>
                )}

                {open && !closed && (
                  <DecisionForm appeal={a} onDone={() => { setExpanded(null); load(); }} />
                )}
              </Card>
            );
          })}
        </div>
      )}

      {raising && <RaiseDialog onClose={() => setRaising(false)} onSaved={load} />}
    </div>
  );
}

function DecisionForm({ appeal, onDone }: { appeal: Appeal; onDone: () => void }) {
  const [status, setStatus] = useState("REJECTED");
  const [outcome, setOutcome] = useState("");
  const [decidedBy, setDecidedBy] = useState(appeal.reviewers[0] ?? "");
  const [remedy, setRemedy] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!outcome.trim()) {
      toast.error("The decision needs its reasoning — the appellant is entitled to know why.");
      return;
    }
    setSaving(true);
    try {
      await api.decideAppeal(appeal.appeal_id, status, outcome.trim(), decidedBy, remedy || undefined);
      toast.success(`${appeal.appeal_id} ${status.toLowerCase().replace("_", " ")}.`);
      onDone();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Could not record the decision.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Outcome</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="REJECTED">Rejected — the original decision stands</option>
            <option value="PARTIALLY_UPHELD">Partially upheld</option>
            <option value="UPHELD">Upheld — the decision changes</option>
            <option value="WITHDRAWN">Withdrawn by the appellant</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Decided by</span>
          <select value={decidedBy} onChange={(e) => setDecidedBy(e.target.value)} className={inputClass}>
            {(appeal.reviewers ?? []).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
            Remedy reference
          </span>
          <input
            value={remedy}
            onChange={(e) => setRemedy(e.target.value)}
            placeholder="CERT-2026-0004"
            className={inputClass}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
          Reasoning
        </span>
        <textarea
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          rows={3}
          placeholder="What the panel found, and why."
          className={inputClass}
        />
      </label>
      <div className="flex justify-end">
        <button onClick={submit} disabled={saving} className={buttonPrimary}>
          {saving ? "Recording…" : "Record the decision"}
        </button>
      </div>
    </div>
  );
}

function RaiseDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    entity_type: "certification",
    entity_id: "",
    appellant_name: "",
    appellant_organisation: "",
    appellant_contact: "",
    grounds: "TECHNICAL_JUDGEMENT",
    statement: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    if (!form.entity_id.trim() || !form.appellant_name.trim() || !form.statement.trim()) {
      toast.error("An appeal needs the record it contests, a named appellant and a statement.");
      return;
    }
    setSaving(true);
    try {
      await api.raiseAppeal(form);
      toast.success("Appeal recorded. Assign an independent panel next.");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Could not record the appeal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-white">
              Record an appeal
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              For a certification, whoever prepared and certified it is captured automatically —
              that is what lets the system refuse a non-independent panel later.
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

        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Contests</span>
              <select value={form.entity_type} onChange={set("entity_type")} className={inputClass}>
                <option value="certification">A certification</option>
                <option value="work_package">A work package</option>
                <option value="visit">A visit</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
                Record reference
              </span>
              <input
                value={form.entity_id}
                onChange={set("entity_id")}
                placeholder="CERT-2026-0001"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Appellant</span>
              <input value={form.appellant_name} onChange={set("appellant_name")} className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
                Organisation
              </span>
              <input
                value={form.appellant_organisation}
                onChange={set("appellant_organisation")}
                className={inputClass}
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Grounds</span>
            <select value={form.grounds} onChange={set("grounds")} className={inputClass}>
              {GROUNDS.map((g) => (
                <option key={g} value={g}>{humanise(g)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
              What is contested, and why
            </span>
            <textarea
              value={form.statement}
              onChange={set("statement")}
              rows={3}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button onClick={save} disabled={saving} className={buttonPrimary}>
            {saving ? "Recording…" : "Record appeal"}
          </button>
        </div>
      </Card>
    </div>
  );
}
