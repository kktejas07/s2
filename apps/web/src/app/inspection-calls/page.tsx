"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PhoneCall, RefreshCw, Plus, X, AlertTriangle, CheckCircle2, Clock,
  UserCheck, Sparkles, ShieldAlert,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatDate } from "@/lib/workPackageLifecycle";
import {
  Card, EmptyState, Metric, PageHeader, SkeletonRows, StatusPill, Tone,
  buttonPrimary, buttonSecondary, inputClass,
} from "@/components/ui";

/**
 * Inspection calls — the contractor telling IQE an ITP point is ready.
 *
 * The screen is built around one asymmetry. A missed witness point costs IQE
 * an attendance. A missed hold point stops the contractor's work and leaves
 * something uninspected that the certificate will later claim was inspected.
 * So hold points are never averaged in with the rest: they are counted
 * separately, listed first, and the actions available against them are
 * narrower.
 *
 * In particular IQE cannot waive its own hold point. That is the client's
 * call, and a system that let a coordinator clear one to save an attendance
 * would have turned a hold point into a reminder.
 */

const STATUS_TONE: Record<string, Tone> = {
  RAISED: "warn",
  CONFIRMED: "info",
  ATTENDED: "ok",
  WAIVED: "idle",
  DECLINED: "idle",
  MISSED: "bad",
  CANCELLED: "idle",
};

const STATUS_LABEL: Record<string, string> = {
  RAISED: "Awaiting inspector",
  CONFIRMED: "Inspector assigned",
  ATTENDED: "Attended",
  WAIVED: "Waived by client",
  DECLINED: "Declined",
  MISSED: "Nobody attended",
  CANCELLED: "Cancelled",
};

const OUTCOME_TONE: Record<string, Tone> = {
  ACCEPTED: "ok", ACCEPTED_WITH_COMMENT: "warn", REJECTED: "bad",
  NOT_READY: "warn",
};

const OUTCOME_LABEL: Record<string, string> = {
  ACCEPTED: "Accepted",
  ACCEPTED_WITH_COMMENT: "Accepted with comment",
  REJECTED: "Rejected",
  NOT_READY: "Work was not ready",
};

const OUTCOMES = [
  { code: "ACCEPTED", label: "Accepted" },
  { code: "ACCEPTED_WITH_COMMENT", label: "Accepted with comment" },
  { code: "REJECTED", label: "Rejected" },
  { code: "NOT_READY", label: "Work was not ready" },
];

/** How soon, in words. "-2 days" reads as a number; "2 days overdue" reads. */
function whenLabel(days: number | null | undefined): string {
  if (days === null || days === undefined) return "";
  if (days < -1) return `${Math.abs(Math.round(days))} days overdue`;
  if (days < 0) return "overdue";
  if (days < 1) return "today";
  if (days < 2) return "tomorrow";
  return `in ${Math.round(days)} days`;
}

export default function InspectionCallsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openOnly, setOpenOnly] = useState(true);
  const [acting, setActing] = useState<{ call: any; mode: string } | null>(null);
  const [raising, setRaising] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, fc] = await Promise.all([
        api.listInspectionCalls(openOnly ? { open_only: true } : undefined),
        api.inspectionCallForecast(14).catch(() => null),
      ]);
      setCalls(list?.data ?? []);
      setForecast(fc);
    } catch {
      toast.error("Could not load the calls");
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, [openOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const sweep = async () => {
    try {
      const out = await api.sweepInspectionCalls();
      const blocking = out?.blocking_progress?.length ?? 0;
      if ((out?.missed?.length ?? 0) === 0) {
        toast.success("Nothing has lapsed.");
      } else if (blocking > 0) {
        toast.error(
          `${out.missed.length} call${out.missed.length === 1 ? "" : "s"} lapsed, ` +
            `${blocking} of them hold point${blocking === 1 ? "" : "s"} now blocking work.`,
        );
      } else {
        toast.success(
          `${out.missed.length} witness call${out.missed.length === 1 ? "" : "s"} lapsed. No work is blocked.`,
        );
      }
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not run the sweep");
    }
  };

  const blocking = calls.filter((c) => c.blocks_progress);
  const overdue = calls.filter((c) => (c.days_until ?? 0) < 0 && c.blocks_progress);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={PhoneCall}
        title="Inspection Calls"
        description="Contractors calling IQE out against a point in an approved plan"
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={load} className={buttonSecondary}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={sweep} className={buttonSecondary}>
              <Clock className="w-4 h-4" /> Check for lapsed
            </button>
            <button onClick={() => setRaising(true)} className={buttonPrimary}>
              <Plus className="w-4 h-4" /> Raise a call
            </button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <Metric value={calls.length} label={openOnly ? "Open calls" : "All calls"} />
          <Metric
            value={blocking.length}
            label="Hold points open"
            sub="Contractor's work is stopped at each"
            tone={blocking.length ? "bad" : "ok"}
          />
          <Metric
            value={forecast?.calls_due ?? "—"}
            label="Due in 14 days"
            sub={
              forecast?.deployable_people === null ||
              forecast?.deployable_people === undefined
                ? "No capacity figure available"
                : `${forecast.unassigned} unassigned · ${forecast.deployable_people} deployable`
            }
          />
          <Metric
            value={forecast?.calls_per_person ?? "—"}
            label="Calls per person"
            tone={
              forecast?.calls_per_person != null && forecast.calls_per_person > 2
                ? "warn"
                : undefined
            }
          />
        </div>
      </Card>

      {overdue.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm text-rose-900">
            {overdue.length === 1
              ? "A hold point is past its requested date with nobody assigned."
              : `${overdue.length} hold points are past their requested dates with nobody assigned.`}{" "}
            The contractor is either stopped or has proceeded without
            inspection — neither can be certified without resolving it.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setOpenOnly(true)}
          className={openOnly ? buttonPrimary : buttonSecondary}
        >
          Open only
        </button>
        <button
          onClick={() => setOpenOnly(false)}
          className={!openOnly ? buttonPrimary : buttonSecondary}
        >
          Everything
        </button>
      </div>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : calls.length === 0 ? (
        <EmptyState
          icon={PhoneCall}
          title={openOnly ? "No open calls" : "No calls raised yet"}
          description="A call is raised against a point in an approved inspection and test plan."
        />
      ) : (
        <div className="space-y-3">
          {calls.map((c) => (
            <CallRow
              key={c.call_id}
              call={c}
              onAct={(mode) => setActing({ call: c, mode })}
            />
          ))}
        </div>
      )}

      {acting && (
        <ActionModal
          call={acting.call}
          mode={acting.mode}
          onClose={() => setActing(null)}
          onDone={() => {
            setActing(null);
            load();
          }}
        />
      )}
      {raising && (
        <RaiseForm
          onClose={() => setRaising(false)}
          onDone={() => {
            setRaising(false);
            load();
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- row */

function CallRow({
  call,
  onAct,
}: {
  call: any;
  onAct: (mode: string) => void;
}) {
  const isHold = call.intervention === "H";
  const open = ["RAISED", "CONFIRMED"].includes(call.status);
  const late = (call.days_until ?? 0) < 0;

  return (
    <Card
      className={`p-4 ${
        call.blocks_progress ? "border-l-4 border-l-rose-500" : ""
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-500">{call.call_id}</span>
            <StatusPill tone={isHold ? "bad" : "warn"}>{isHold ? "Hold point" : "Witness point"}</StatusPill>
            <StatusPill tone={STATUS_TONE[call.status] ?? "idle"}>{STATUS_LABEL[call.status] ?? call.status}</StatusPill>
            {call.short_notice && (
              <StatusPill tone="warn">{`Short notice: ${call.notice_given_days}d of ${call.notice_required_days}`}</StatusPill>
            )}
            {call.outcome && (
              <StatusPill tone={OUTCOME_TONE[call.outcome] ?? "idle"}>
                {OUTCOME_LABEL[call.outcome] ?? call.outcome}
              </StatusPill>
            )}
          </div>

          <h3 className="mt-1.5 font-semibold text-slate-900">{call.activity}</h3>
          <p className="text-sm text-slate-500">
            {call.itp_id} point {call.point_id}
            {call.discipline ? ` · ${call.discipline}` : ""}
            {call.job_id ? ` · ${call.job_id}` : ""}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className={late && open ? "text-rose-600 font-medium" : "text-slate-600"}>
              {formatDate(call.requested_date)}
              {open && ` — ${whenLabel(call.days_until)}`}
            </span>
            {call.raised_by && (
              <span className="text-slate-500">raised by {call.raised_by}</span>
            )}
            {call.assigned_person_id && (
              <span className="flex items-center gap-1.5 text-slate-600">
                <UserCheck className="w-3.5 h-3.5" />
                {call.assigned_person_id}
              </span>
            )}
            {call.visit_id && (
              <span className="font-mono text-xs text-slate-500">
                {call.visit_id}
              </span>
            )}
          </div>

          {call.outcome_note && (
            <p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700">
              {call.outcome_note}
            </p>
          )}
          {call.status === "WAIVED" && (
            <p className="mt-2 text-sm text-slate-600">
              Waived by {call.waived_by}
              {call.waiver_authority ? ` under ${call.waiver_authority}` : ""}
              {call.waiver_reason ? ` — ${call.waiver_reason}` : ""}
            </p>
          )}
          {call.ncr_refs?.length > 0 && (
            <p className="mt-1.5 text-sm text-rose-700">
              NCR: {call.ncr_refs.join(", ")}
            </p>
          )}
        </div>

        {open && (
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={() => onAct("assign")} className={buttonSecondary}>
              <UserCheck className="w-4 h-4" /> Assign
            </button>
            <button onClick={() => onAct("attend")} className={buttonPrimary}>
              <CheckCircle2 className="w-4 h-4" /> Record outcome
            </button>
            <button onClick={() => onAct("waive")} className={buttonSecondary}>
              Waive
            </button>
            {!isHold && (
              <button onClick={() => onAct("decline")} className={buttonSecondary}>
                Decline
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ----------------------------------------------------------------- actions */

function ActionModal({
  call,
  mode,
  onClose,
  onDone,
}: {
  call: any;
  mode: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const isHold = call.intervention === "H";
  const [busy, setBusy] = useState(false);

  // assign
  const [personId, setPersonId] = useState(call.assigned_person_id ?? "");
  const [suggestion, setSuggestion] = useState<any>(null);
  const [suggesting, setSuggesting] = useState(false);

  // attend
  const [outcome, setOutcome] = useState("ACCEPTED");
  const [note, setNote] = useState("");
  const [ncr, setNcr] = useState("");

  // waive / decline
  const [reason, setReason] = useState("");
  const [waivedBy, setWaivedBy] = useState("");
  const [authority, setAuthority] = useState("");

  const suggest = async () => {
    setSuggesting(true);
    try {
      const out = await api.suggestInspectorForCall(call.call_id);
      setSuggestion(out);
      if (out?.candidates?.length) setPersonId(out.candidates[0].person_id);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not get a suggestion");
    } finally {
      setSuggesting(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "assign") {
        const out = await api.assignInspectionCall(call.call_id, personId);
        if (out?.visit_warning) {
          // Reported, not swallowed: without a visit the inspector will not
          // see this where they actually look.
          toast.error(out.visit_warning);
        } else {
          toast.success(
            `${personId} assigned${out?.visit_id ? ` · visit ${out.visit_id}` : ""}`,
          );
        }
      } else if (mode === "attend") {
        await api.attendInspectionCall(call.call_id, {
          outcome,
          outcome_note: note || undefined,
          ncr_refs: ncr
            ? ncr.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        });
        toast.success("Outcome recorded");
      } else if (mode === "waive") {
        await api.waiveInspectionCall(call.call_id, {
          reason,
          waived_by: waivedBy || undefined,
          waiver_authority: authority || undefined,
        });
        toast.success("Call waived");
      } else {
        await api.declineInspectionCall(call.call_id, { reason });
        toast.success("Call declined");
      }
      onDone();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "That did not go through");
    } finally {
      setBusy(false);
    }
  };

  const titles: Record<string, string> = {
    assign: "Assign an inspector",
    attend: "Record what was found",
    waive: isHold ? "Waive a hold point" : "Waive this call",
    decline: "Decline to attend",
  };

  const ready =
    mode === "assign"
      ? !!personId
      : mode === "attend"
      ? outcome === "ACCEPTED" || !!note.trim()
      : mode === "waive"
      ? !!reason.trim() && (!isHold || (!!waivedBy.trim() && !!authority.trim()))
      : !!reason.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">{titles[mode]}</h2>
            <p className="text-xs text-slate-500">
              {call.call_id} · {call.activity}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {mode === "assign" && (
            <>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  placeholder="Inspector reference, e.g. EMP-00006"
                  className={`${inputClass} flex-1`}
                />
                <button
                  onClick={suggest}
                  disabled={suggesting}
                  className={buttonSecondary}
                >
                  <Sparkles className="w-4 h-4" />
                  {suggesting ? "Looking…" : "Suggest"}
                </button>
              </div>
              {suggestion && (
                <div className="space-y-2">
                  {suggestion.candidates?.length > 0 ? (
                    suggestion.candidates.map((cand: any) => (
                      <button
                        key={cand.person_id}
                        onClick={() => setPersonId(cand.person_id)}
                        className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                          personId === cand.person_id
                            ? "border-[#0084bf] bg-[#0084bf]/5"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-medium text-slate-900">
                          {cand.full_name ?? cand.person_id}
                        </span>
                        {cand.reason && (
                          <span className="mt-0.5 block text-slate-500">
                            {cand.reason}
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      {suggestion.note}
                    </p>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-500">
                Assigning puts a visit on the inspector&apos;s list, so this
                appears where they already look for work.
              </p>
            </>
          )}

          {mode === "attend" && (
            <>
              <div className="flex flex-wrap gap-2">
                {OUTCOMES.map((o) => (
                  <button
                    key={o.code}
                    onClick={() => setOutcome(o.code)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      outcome === o.code
                        ? "border-[#0084bf] bg-[#0084bf]/10 text-[#005f8a]"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder={
                  outcome === "ACCEPTED"
                    ? "Notes (optional)"
                    : "What was found — the contractor acts on this *"
                }
                className={inputClass}
              />
              {outcome !== "ACCEPTED" && !note.trim() && (
                <p className="text-xs text-amber-700">
                  Anything other than a clean acceptance needs a note saying
                  what was found.
                </p>
              )}
              <input
                value={ncr}
                onChange={(e) => setNcr(e.target.value)}
                placeholder="NCR references, comma separated"
                className={inputClass}
              />
            </>
          )}

          {mode === "waive" && (
            <>
              {isHold && (
                <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900">
                    A hold point belongs to the client, not to IQE. Releasing
                    one needs who authorised it and their written reference —
                    IQE waiving its own hold point would make it a reminder
                    rather than a hold point.
                  </p>
                </div>
              )}
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Reason *"
                className={inputClass}
              />
              {isHold && (
                <>
                  <input
                    value={waivedBy}
                    onChange={(e) => setWaivedBy(e.target.value)}
                    placeholder="Who authorised it, e.g. K. Ramesh, SHMIC *"
                    className={inputClass}
                  />
                  <input
                    value={authority}
                    onChange={(e) => setAuthority(e.target.value)}
                    placeholder="Their written reference, e.g. SHMIC/LTR/2026/221 *"
                    className={inputClass}
                  />
                </>
              )}
            </>
          )}

          {mode === "decline" && (
            <>
              <p className="text-sm text-slate-600">
                IQE will not attend. Available for a witness point because work
                continues either way.
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Reason *"
                className={inputClass}
              />
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button onClick={onClose} className={buttonSecondary}>
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={busy || !ready}
              className={`${buttonPrimary} disabled:opacity-50`}
            >
              {busy ? "Working…" : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- raise */

function RaiseForm({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [plans, setPlans] = useState<any[]>([]);
  const [itpId, setItpId] = useState("");
  const [points, setPoints] = useState<any[]>([]);
  const [pointId, setPointId] = useState("");
  const [date, setDate] = useState("");
  const [raisedBy, setRaisedBy] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .listITPs()
      .then((r) => setPlans((r?.data ?? []).filter((p: any) => p.status === "APPROVED")))
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    if (!itpId) {
      setPoints([]);
      return;
    }
    api
      .getITP(itpId)
      .then((d) => setPoints(d?.points ?? []))
      .catch(() => setPoints([]));
  }, [itpId]);

  const chosen = points.find((p) => p.point_id === pointId);

  const submit = async () => {
    setBusy(true);
    try {
      const out = await api.raiseInspectionCall({
        itp_id: itpId,
        point_id: pointId,
        requested_date: new Date(date).toISOString(),
        raised_by: raisedBy || undefined,
        location: location || undefined,
      });
      // Short notice is recorded rather than refused — a contractor who cannot
      // raise a short-notice call raises none and carries on uninspected.
      if (out?.warning) toast.error(out.warning);
      else toast.success(`${out.call_id} raised`);
      onDone();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not raise the call");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
          <h2 className="font-semibold text-slate-900">Raise an inspection call</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          {plans.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              No approved plans. A call can only be raised against an approved
              plan — against a draft nobody has agreed what the point requires.
            </p>
          ) : (
            <>
              <select
                value={itpId}
                onChange={(e) => {
                  setItpId(e.target.value);
                  setPointId("");
                }}
                className={inputClass}
              >
                <option value="">Select a plan…</option>
                {plans.map((p) => (
                  <option key={p.itp_id} value={p.itp_id}>
                    {p.itp_id} — {p.title}
                  </option>
                ))}
              </select>

              <select
                value={pointId}
                onChange={(e) => setPointId(e.target.value)}
                disabled={!itpId}
                className={`${inputClass} disabled:opacity-50`}
              >
                <option value="">Select a point…</option>
                {points.map((pt) => (
                  <option key={pt.point_id} value={pt.point_id}>
                    {pt.point_id} · {pt.intervention} — {pt.activity}
                  </option>
                ))}
              </select>

              {chosen && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={chosen.intervention === "H" ? "bad" : "warn"}>{chosen.intervention === "H" ? "Hold point" : "Witness point"}</StatusPill>
                    <span className="text-slate-500">
                      {chosen.notice_days} days&apos; notice expected
                    </span>
                  </div>
                  {chosen.acceptance_criteria && (
                    <p className="mt-2 text-slate-600">
                      {chosen.acceptance_criteria}
                    </p>
                  )}
                </div>
              )}

              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
              <input
                value={raisedBy}
                onChange={(e) => setRaisedBy(e.target.value)}
                placeholder="Who raised it, e.g. Suguna site office"
                className={inputClass}
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where"
                className={inputClass}
              />

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button onClick={onClose} className={buttonSecondary}>
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={busy || !itpId || !pointId || !date}
                  className={`${buttonPrimary} disabled:opacity-50`}
                >
                  {busy ? "Raising…" : "Raise the call"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
