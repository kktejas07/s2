"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2, RefreshCw, Plus, AlertTriangle, ShieldCheck, X, ArrowRight,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatDate } from "@/lib/workPackageLifecycle";
import {
  Card, EmptyState, Metric, PageHeader, SkeletonRows, StatusPill, Tone,
  buttonPrimary, buttonSecondary, humanise, inputClass,
} from "@/components/ui";

/**
 * The external provider register (ISO/IEC 17020:2026).
 *
 * Leads with what cannot be relied on, for the same reason the equipment page
 * leads with lapsed calibration: an approval that expired and an accreditation
 * that lapsed are both silent, and both reach backwards into work already
 * certified.
 */

const STATUS_TONE: Record<string, Tone> = {
  APPROVED: "ok",
  CONDITIONAL: "warn",
  PENDING_EVALUATION: "idle",
  SUSPENDED: "bad",
  REMOVED: "idle",
};

const CATEGORIES = [
  "INSPECTION_SUBCONTRACT", "CALIBRATION_LAB", "TESTING_LAB", "NDT_SERVICE",
  "EQUIPMENT_HIRE", "TRAINING", "SOFTWARE_OR_DATA", "OTHER",
];

export default function ProvidersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [due, setDue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, review] = await Promise.all([
        api.getProviders(category ? { category } : undefined),
        api.getProviderReviewDue(60).catch(() => null),
      ]);
      setItems(list?.data ?? []);
      setDue(review);
    } catch (e: any) {
      if (e?.response?.status === 403) {
        toast.error("Your role may not read the provider register.");
      } else {
        toast.error("Could not load the provider register.");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const blocked = items.filter((p) => !p.usable && p.status !== "REMOVED");
  const lapsed = due?.lapsed_accreditation ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Building2}
        title="External providers"
        description="Subcontracted inspection, calibration laboratories and anything else an IQE result depends on."
        actions={
          <>
            <button onClick={() => setAdding(true)} className={buttonPrimary}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add a provider</span>
              <span className="sm:hidden">Add</span>
            </button>
            <button onClick={load} className={buttonSecondary}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </>
        }
      />

      {/* The traceability break comes first: a calibration lab whose own
          accreditation lapsed undermines measurements already certified. */}
      {lapsed.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                {lapsed.length} provider{lapsed.length === 1 ? "" : "s"} with lapsed
                accreditation
              </p>
              <p className="mt-0.5 text-sm text-rose-800/90 dark:text-rose-300/90">
                The traceability chain behind measurements IQE has certified runs
                through {lapsed.length === 1 ? "this one" : "these"}. Do not use{" "}
                {lapsed.length === 1 ? "it" : "them"} again until the accreditation is
                renewed, and check what has already been relied on.
              </p>
              <ul className="mt-2 space-y-1">
                {lapsed.slice(0, 6).map((p: any) => (
                  <li
                    key={p.provider_id}
                    className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm"
                  >
                    <span className="font-mono text-xs text-rose-700 dark:text-rose-300">
                      {p.provider_id}
                    </span>
                    <span className="text-rose-900 dark:text-rose-200">{p.name}</span>
                    <span className="text-xs text-rose-700/80 dark:text-rose-300/80">
                      {p.reason}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {due && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <Metric
              value={due.overdue_review?.length ?? 0}
              label="Approval overdue"
              tone={due.overdue_review?.length ? "bad" : "ok"}
            />
            <Metric
              value={due.due_within_horizon?.length ?? 0}
              label="Review due in 60 days"
              tone={due.due_within_horizon?.length ? "warn" : "ok"}
            />
            <Metric
              value={due.never_evaluated?.length ?? 0}
              label="Never evaluated"
              tone={due.never_evaluated?.length ? "warn" : "ok"}
            />
            <Metric value={items.length} label="On the register" />
          </div>
        </Card>
      )}

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className={inputClass + " sm:w-72"}
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
          icon={Building2}
          title="No providers registered"
          description="Anything an inspection result depends on belongs here — subcontracted inspectors, calibration laboratories, specialist NDT."
        />
      ) : (
        <div className="space-y-2.5">
          {items.map((p) => (
            <Card key={p.provider_id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">
                      {p.provider_id}
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {p.name}
                    </span>
                    <StatusPill tone={STATUS_TONE[p.status] ?? "idle"}>
                      {humanise(p.status)}
                    </StatusPill>
                    {!p.usable && p.status !== "SUSPENDED" && (
                      <StatusPill tone="bad">Cannot be used</StatusPill>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>{humanise(p.category)}</span>
                    {p.accreditation?.body && (
                      <span>
                        {p.accreditation.body}
                        {p.accreditation.valid_until &&
                          ` to ${formatDate(p.accreditation.valid_until)}`}
                      </span>
                    )}
                    {p.approval?.review_due_on && (
                      <span>Review {formatDate(p.approval.review_due_on)}</span>
                    )}
                  </div>

                  {/* The reason it cannot be used is the whole point of the
                      row; a status pill alone would not say which of the
                      three gates it failed. */}
                  {p.blocked_because && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-sm text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {p.blocked_because}
                    </p>
                  )}

                  {p.approved_services?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.approved_services.map((svc: string) => (
                        <span
                          key={svc}
                          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setOpen(p.provider_id)}
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
        <ProviderDrawer
          providerId={open}
          onClose={() => setOpen(null)}
          onChanged={load}
        />
      )}
      {adding && <RegisterDialog onClose={() => setAdding(false)} onSaved={load} />}
    </div>
  );
}

function ProviderDrawer({
  providerId, onClose, onChanged,
}: {
  providerId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"evaluate" | "observe">("evaluate");

  const load = useCallback(async () => {
    try {
      setData(await api.getProvider(providerId));
    } catch {
      toast.error(`Could not open ${providerId}.`);
      onClose();
    }
  }, [providerId, onClose]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<any>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      await load();
      onChanged();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "That did not work.");
    } finally {
      setBusy(false);
    }
  };

  const p = data?.provider;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white p-4 shadow-2xl sm:p-5 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-white">
              {p?.name ?? providerId}
            </h2>
            {p && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusPill tone={STATUS_TONE[p.status] ?? "idle"}>
                  {humanise(p.status)}
                </StatusPill>
                <span className="text-xs text-slate-400">{humanise(p.category)}</span>
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
            {data.blocked_because && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                {data.blocked_because}
              </div>
            )}

            <Card className="p-4">
              <div className="flex gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                {(["evaluate", "observe"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      tab === t
                        ? "bg-[#0084bf] text-white"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {t === "evaluate" ? "Evaluate" : "Record an observation"}
                  </button>
                ))}
              </div>
              {tab === "evaluate" ? (
                <EvaluateForm providerId={providerId} busy={busy} act={act} />
              ) : (
                <ObserveForm providerId={providerId} busy={busy} act={act} />
              )}
            </Card>

            {data.evaluations?.length > 0 && (
              <Card className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Evaluations
                </h3>
                <div className="mt-2 space-y-3">
                  {data.evaluations.map((e: any) => (
                    <div key={e.evaluation_id} className="text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill
                          tone={
                            e.outcome === "REJECTED" ? "bad"
                              : e.outcome === "APPROVED_WITH_CONDITIONS" ? "warn" : "ok"
                          }
                        >
                          {humanise(e.outcome)}
                        </StatusPill>
                        <span className="font-mono text-xs text-slate-400">
                          {e.evaluation_id}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDate(e.evaluated_on)}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-700 dark:text-slate-300">
                        {e.rationale}
                      </p>
                      {e.conditions && (
                        <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
                          Conditions: {e.conditions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {data.performance?.length > 0 && (
              <Card className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Observations
                </h3>
                <ul className="mt-2 space-y-2">
                  {data.performance.map((r: any) => (
                    <li key={r.record_id} className="text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={r.rating < 0 ? "bad" : r.rating > 0 ? "ok" : "idle"}>
                          {r.rating > 0 ? `+${r.rating}` : r.rating}
                        </StatusPill>
                        <span className="text-xs text-slate-500">
                          {formatDate(r.observed_on)}
                        </span>
                        {r.job_id && (
                          <span className="font-mono text-xs text-slate-400">{r.job_id}</span>
                        )}
                        {r.triggers_review && (
                          <StatusPill tone="warn">Brought the review forward</StatusPill>
                        )}
                      </div>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-300">{r.note}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {p?.status !== "SUSPENDED" && p?.status !== "REMOVED" && (
              <button
                onClick={() => {
                  const reason = window.prompt(
                    `Why is ${p.name} being suspended? Jobs they have been consented onto will be listed.`,
                  );
                  if (!reason?.trim()) return;
                  act(
                    () => api.setProviderStatus(providerId, "SUSPENDED", reason.trim()),
                    "Suspended.",
                  );
                }}
                disabled={busy}
                className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
              >
                Suspend this provider
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EvaluateForm({ providerId, busy, act }: any) {
  const [f, setF] = useState({
    outcome: "APPROVED", rationale: "", conditions: "", services: "", months: "12",
  });
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="mt-3 space-y-2">
      <select value={f.outcome} onChange={set("outcome")} className={inputClass}>
        <option value="APPROVED">Approved</option>
        <option value="APPROVED_WITH_CONDITIONS">Approved with conditions</option>
        <option value="REJECTED">Rejected</option>
      </select>
      <input
        value={f.services}
        onChange={set("services")}
        placeholder="Approved for (comma separated)"
        className={inputClass}
      />
      <textarea
        value={f.rationale}
        onChange={set("rationale")}
        rows={2}
        placeholder="What was checked, and what it showed"
        className={inputClass}
      />
      {f.outcome === "APPROVED_WITH_CONDITIONS" && (
        <input
          value={f.conditions}
          onChange={set("conditions")}
          placeholder="The conditions"
          className={inputClass}
        />
      )}
      <label className="block text-xs text-slate-500">
        Review again in (months)
        <input
          type="number"
          value={f.months}
          onChange={set("months")}
          className={inputClass + " mt-0.5"}
        />
      </label>
      <button
        onClick={() =>
          act(
            () =>
              api.evaluateProvider(providerId, {
                outcome: f.outcome,
                rationale: f.rationale,
                conditions: f.conditions || undefined,
                approved_services: f.services
                  .split(",").map((s) => s.trim()).filter(Boolean),
                review_months: Number(f.months) || 12,
              }),
            "Evaluation recorded.",
          )
        }
        disabled={busy || !f.rationale.trim()}
        className={buttonPrimary + " w-full sm:w-auto"}
      >
        <ShieldCheck className="h-4 w-4" />
        Record the evaluation
      </button>
    </div>
  );
}

function ObserveForm({ providerId, busy, act }: any) {
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(0);
  const [trigger, setTrigger] = useState(false);

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="What was observed, on which job"
        className={inputClass}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Rating</span>
        {[-2, -1, 0, 1, 2].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className={`h-8 w-9 rounded-md text-xs font-medium transition ${
              rating === n
                ? "bg-[#0084bf] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {n > 0 ? `+${n}` : n}
          </button>
        ))}
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
        <input
          type="checkbox"
          checked={trigger}
          onChange={(e) => setTrigger(e.target.checked)}
          className="mt-0.5 rounded border-slate-300 text-[#0084bf] focus:ring-[#0084bf]/30"
        />
        {/* Not a flag someone has to notice: it makes the provider unusable
            until the review is done. */}
        Serious enough to review now — this brings the review forward and the
        provider cannot be used until it is done
      </label>
      <button
        onClick={() =>
          act(
            () =>
              api.recordProviderPerformance(providerId, {
                note, rating, triggers_review: trigger,
              }),
            "Observation recorded.",
          )
        }
        disabled={busy || !note.trim()}
        className={buttonSecondary + " w-full sm:w-auto"}
      >
        Record it
      </button>
    </div>
  );
}

function RegisterDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: "", category: "INSPECTION_SUBCONTRACT", contact_person: "", email: "",
    acc_body: "", acc_number: "", acc_until: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setSaving(true);
    try {
      await api.registerProvider({
        name: f.name.trim(),
        category: f.category,
        contact_person: f.contact_person || undefined,
        email: f.email || undefined,
        accreditation: f.acc_body
          ? {
              body: f.acc_body,
              certificate_number: f.acc_number || undefined,
              valid_until: f.acc_until || undefined,
            }
          : undefined,
      });
      toast.success("Added, pending evaluation.");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Could not add it.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-b-none p-5 sm:rounded-2xl">
        <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white">
          Add a provider
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          They enter the register unusable and stay that way until someone evaluates them.
        </p>
        <div className="mt-3 space-y-2">
          <input value={f.name} onChange={set("name")} placeholder="Name" className={inputClass} />
          <select value={f.category} onChange={set("category")} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{humanise(c)}</option>
            ))}
          </select>
          <input
            value={f.contact_person}
            onChange={set("contact_person")}
            placeholder="Contact person"
            className={inputClass}
          />
          <input value={f.email} onChange={set("email")} placeholder="Email" className={inputClass} />
          <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Their accreditation, if they hold one
            </p>
            <div className="space-y-2">
              <input
                value={f.acc_body}
                onChange={set("acc_body")}
                placeholder="Body (NABL, UKAS…)"
                className={inputClass}
              />
              <input
                value={f.acc_number}
                onChange={set("acc_number")}
                placeholder="Certificate number"
                className={inputClass}
              />
              <label className="block text-xs text-slate-500">
                Valid until
                <input
                  type="date"
                  value={f.acc_until}
                  onChange={set("acc_until")}
                  className={inputClass + " mt-0.5"}
                />
              </label>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button
            onClick={save}
            disabled={saving || !f.name.trim()}
            className={buttonPrimary}
          >
            {saving ? "Adding…" : "Add"}
          </button>
        </div>
      </Card>
    </div>
  );
}
