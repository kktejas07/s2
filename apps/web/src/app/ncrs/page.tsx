"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, RefreshCw, Plus, X, CheckCircle2, Clock, ShieldAlert,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatDate } from "@/lib/workPackageLifecycle";
import {
  Card, EmptyState, Metric, PageHeader, SkeletonRows, StatusPill, Tone,
  buttonPrimary, buttonSecondary, inputClass,
} from "@/components/ui";

/**
 * Nonconformities raised by IQE against the work.
 *
 * Two rules shape this screen, and both are versions of rules that hold
 * elsewhere in the system:
 *
 *   use-as-is is the client's call  — a concession against their own
 *     specification is theirs to grant, not the contractor's and not IQE's
 *   the raiser does not close it    — the contractor says it is fixed;
 *     somebody else checks
 *
 * So the disposition form asks for the client's authority when the
 * disposition is a concession, and the verification form is a separate act
 * from submitting the correction. The server refuses either way; the screen
 * says why before you get there.
 */

const SEVERITY_TONE: Record<string, Tone> = {
  CRITICAL: "bad", MAJOR: "bad", MINOR: "warn", OBSERVATION: "idle",
};

const SEVERITY_LABEL: Record<string, string> = {
  CRITICAL: "Critical", MAJOR: "Major", MINOR: "Minor",
  OBSERVATION: "Observation",
};

const SEVERITIES = [
  { code: "CRITICAL", label: "Critical", help: "Safety, or uncorrectable once work proceeds — 24h" },
  { code: "MAJOR", label: "Major", help: "Fails the specification — 72h" },
  { code: "MINOR", label: "Minor", help: "Departs without affecting fitness — 30 days" },
  { code: "OBSERVATION", label: "Observation", help: "A note, not a finding" },
];

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  DISPOSITION_PROPOSED: "Disposition proposed",
  IN_CORRECTION: "Being corrected",
  AWAITING_VERIFICATION: "Awaiting verification",
  CLOSED: "Closed",
  VOID: "Void",
};

const STATUS_TONE: Record<string, Tone> = {
  OPEN: "bad",
  DISPOSITION_PROPOSED: "warn",
  IN_CORRECTION: "warn",
  AWAITING_VERIFICATION: "info",
  CLOSED: "ok",
  VOID: "idle",
};

const DISPOSITIONS = [
  { code: "REWORK", label: "Rework", help: "Bring it back to specification" },
  { code: "REPAIR", label: "Repair", help: "Fit for purpose, short of specification — a concession" },
  { code: "USE_AS_IS", label: "Use as is", help: "Leave it — a concession" },
  { code: "SCRAP", label: "Scrap", help: "Remove it" },
  { code: "REJECT_FINDING", label: "Finding was wrong", help: "Withdraw it, with a reason" },
];

const CONCESSIONS = new Set(["USE_AS_IS", "REPAIR"]);

export default function NCRsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openOnly, setOpenOnly] = useState(true);
  const [raising, setRaising] = useState(false);
  const [acting, setActing] = useState<{ ncr: any; mode: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listNCRs(openOnly ? { open_only: true } : undefined);
      setRows(res?.data ?? []);
    } catch {
      toast.error("Could not load the nonconformities");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [openOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const blocking = rows.filter((r) => r.blocks_certification);
  const overdue = rows.filter((r) => r.overdue);
  const awaiting = rows.filter((r) => r.status === "AWAITING_VERIFICATION");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={AlertTriangle}
        title="Nonconformities"
        description="What IQE found wrong, and what was done about it"
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={load} className={buttonSecondary}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={() => setRaising(true)} className={buttonPrimary}>
              <Plus className="w-4 h-4" /> Raise an NCR
            </button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <Metric value={rows.length} label={openOnly ? "Open" : "All"} />
          <Metric
            value={blocking.length}
            label="Blocking certification"
            sub="Critical or major, still open"
            tone={blocking.length ? "bad" : "ok"}
          />
          <Metric
            value={overdue.length}
            label="Past their target"
            tone={overdue.length ? "bad" : "ok"}
          />
          <Metric
            value={awaiting.length}
            label="Awaiting verification"
            sub="Said to be fixed, not yet checked"
            tone={awaiting.length ? "warn" : undefined}
          />
        </div>
      </Card>

      {blocking.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm text-rose-900">
            {blocking.length === 1
              ? "One open nonconformity is blocking certification."
              : `${blocking.length} open nonconformities are blocking certification.`}{" "}
            A certificate issued over a critical or major finding would state
            that the work conformed while IQE&apos;s own record says it did
            not.
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
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={openOnly ? "Nothing open" : "No nonconformities raised"}
          description="An NCR records what was found against a stated requirement, and what was done about it."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <NCRRow
              key={r.ncr_id}
              ncr={r}
              onAct={(mode) => setActing({ ncr: r, mode })}
            />
          ))}
        </div>
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
      {acting && (
        <ActionForm
          ncr={acting.ncr}
          mode={acting.mode}
          onClose={() => setActing(null)}
          onDone={() => {
            setActing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- row */

function NCRRow({ ncr: r, onAct }: { ncr: any; onAct: (m: string) => void }) {
  const next: Record<string, { mode: string; label: string } | undefined> = {
    OPEN: { mode: "disposition", label: "Propose a disposition" },
    DISPOSITION_PROPOSED: { mode: "accept", label: "Record the decision" },
    IN_CORRECTION: { mode: "submit", label: "Mark as corrected" },
    AWAITING_VERIFICATION: { mode: "verify", label: "Verify" },
  };
  const action = next[r.status];

  return (
    <Card
      className={`p-4 ${
        r.blocks_certification ? "border-l-4 border-l-rose-500" : ""
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 lg:flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-500">{r.ncr_id}</span>
            <StatusPill tone={SEVERITY_TONE[r.severity] ?? "idle"}>
              {SEVERITY_LABEL[r.severity] ?? r.severity}
            </StatusPill>
            <StatusPill tone={STATUS_TONE[r.status] ?? "idle"}>
              {STATUS_LABEL[r.status] ?? r.status}
            </StatusPill>
            {r.overdue && <StatusPill tone="bad">Past target</StatusPill>}
            {r.concession_authority && (
              <StatusPill tone="idle">Client concession</StatusPill>
            )}
          </div>

          <h3 className="mt-1.5 font-semibold text-slate-900 break-words">
            {r.title}
          </h3>
          <p className="text-sm text-slate-600 break-words">{r.description}</p>

          {r.requirement_source && (
            <p className="mt-1.5 text-sm text-slate-500 break-words">
              Against {r.requirement_source}
              {r.requirement_revision ? ` ${r.requirement_revision}` : ""}
              {r.requirement_clause ? `, clause ${r.requirement_clause}` : ""}
            </p>
          )}
          {r.objective_evidence && (
            <p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700 break-words">
              {r.objective_evidence}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {r.work_package_id && <span>{r.work_package_id}</span>}
            {r.discipline && <span>{r.discipline}</span>}
            <span>Raised {formatDate(r.raised_on)}</span>
            {r.due_by && (
              <span className={r.overdue ? "text-rose-600 font-medium" : ""}>
                <Clock className="inline w-3.5 h-3.5 mr-1" />
                Target {formatDate(r.due_by)}
              </span>
            )}
          </div>

          {r.disposition && (
            <p className="mt-2 text-sm text-slate-600 break-words">
              <span className="font-medium">
                {DISPOSITIONS.find((d) => d.code === r.disposition)?.label ??
                  r.disposition}
              </span>
              {r.disposition_note ? ` — ${r.disposition_note}` : ""}
              {r.concession_approved_by
                ? ` · granted by ${r.concession_approved_by}${
                    r.concession_authority
                      ? ` under ${r.concession_authority}`
                      : ""
                  }`
                : ""}
            </p>
          )}
          {r.verification_note && (
            <p className="mt-2 text-sm text-emerald-800 break-words">
              Verified by {r.verified_by}: {r.verification_note}
            </p>
          )}
          {r.void_reason && (
            <p className="mt-2 text-sm text-slate-500 break-words">
              Void: {r.void_reason}
            </p>
          )}
        </div>

        {action && (
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={() => onAct(action.mode)} className={buttonPrimary}>
              {action.label}
            </button>
            {r.status === "OPEN" && (
              <button onClick={() => onAct("void")} className={buttonSecondary}>
                Void
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ raise */

function RaiseForm({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [severity, setSeverity] = useState("MAJOR");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState("");
  const [source, setSource] = useState("");
  const [revision, setRevision] = useState("");
  const [clause, setClause] = useState("");
  const [jobId, setJobId] = useState("");
  const [wpId, setWpId] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [busy, setBusy] = useState(false);

  const needsEvidence = severity === "CRITICAL" || severity === "MAJOR";

  const submit = async () => {
    setBusy(true);
    try {
      const out = await api.raiseNCR({
        severity, title, description,
        objective_evidence: evidence || undefined,
        requirement_source: source || undefined,
        requirement_revision: revision || undefined,
        requirement_clause: clause || undefined,
        job_id: jobId || undefined,
        work_package_id: wpId || undefined,
        discipline: discipline || undefined,
      });
      toast.success(
        `${out.ncr_id} raised` +
          (out.blocks_certification ? " — this blocks certification" : ""),
      );
      onDone();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not raise it");
    } finally {
      setBusy(false);
    }
  };

  const ready =
    !!title.trim() &&
    !!description.trim() &&
    (!needsEvidence || !!evidence.trim());

  return (
    <Modal title="Raise a nonconformity" onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        {SEVERITIES.map((s) => (
          <button
            key={s.code}
            onClick={() => setSeverity(s.code)}
            title={s.help}
            className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              severity === s.code
                ? s.code === "CRITICAL" || s.code === "MAJOR"
                  ? "bg-rose-50 border-rose-300 text-rose-800"
                  : "bg-[#0084bf]/10 border-[#0084bf] text-[#005f8a]"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        {SEVERITIES.find((s) => s.code === severity)?.help}
      </p>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What is wrong, in a line *"
        className={inputClass}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="Description *"
        className={inputClass}
      />

      <textarea
        value={evidence}
        onChange={(e) => setEvidence(e.target.value)}
        rows={3}
        placeholder={
          needsEvidence
            ? "Objective evidence — what was measured or observed *"
            : "Objective evidence (optional)"
        }
        className={inputClass}
      />
      {needsEvidence && (
        <p className="text-xs text-slate-500">
          What was actually measured, as distinct from the conclusion drawn
          from it. Without it the finding cannot be defended when the
          contractor disputes it.
        </p>
      )}

      <div className="grid sm:grid-cols-3 gap-2">
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Drawing / spec"
          className={inputClass}
        />
        <input
          value={revision}
          onChange={(e) => setRevision(e.target.value)}
          placeholder="Revision"
          className={inputClass}
        />
        <input
          value={clause}
          onChange={(e) => setClause(e.target.value)}
          placeholder="Clause"
          className={inputClass}
        />
      </div>
      <p className="text-xs text-slate-500">
        The revision matters: an NCR that does not name it cannot be argued
        either way.
      </p>

      <div className="grid sm:grid-cols-3 gap-2">
        <input
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          placeholder="Job"
          className={inputClass}
        />
        <input
          value={wpId}
          onChange={(e) => setWpId(e.target.value)}
          placeholder="Work package"
          className={inputClass}
        />
        <input
          value={discipline}
          onChange={(e) => setDiscipline(e.target.value)}
          placeholder="Discipline"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button onClick={onClose} className={buttonSecondary}>
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy || !ready}
          className={`${buttonPrimary} disabled:opacity-50`}
        >
          {busy ? "Raising…" : "Raise it"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------- actions */

function ActionForm({
  ncr: r,
  mode,
  onClose,
  onDone,
}: {
  ncr: any;
  mode: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [disposition, setDisposition] = useState("REWORK");
  const [note, setNote] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [corrective, setCorrective] = useState("");
  const [authority, setAuthority] = useState("");
  const [approver, setApprover] = useState("");
  const [accepted, setAccepted] = useState(true);
  const [busy, setBusy] = useState(false);

  const isConcession = CONCESSIONS.has(r.disposition ?? "");
  const isRejectFinding = r.disposition === "REJECT_FINDING";

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "disposition") {
        await api.proposeNCRDisposition(r.ncr_id, {
          disposition, note,
          root_cause: rootCause || undefined,
          corrective_action: corrective || undefined,
        });
        toast.success("Disposition proposed");
      } else if (mode === "accept") {
        await api.acceptNCRDisposition(r.ncr_id, {
          reason: isRejectFinding ? note : undefined,
          note: !isRejectFinding ? note || undefined : undefined,
          concession_authority: authority || undefined,
          concession_approved_by: approver || undefined,
        });
        toast.success("Recorded");
      } else if (mode === "submit") {
        await api.submitNCRForVerification(r.ncr_id, {
          note, corrective_action: corrective || undefined,
        });
        toast.success("Submitted for verification");
      } else if (mode === "verify") {
        await api.verifyNCR(r.ncr_id, { accepted, note });
        toast.success(accepted ? "Verified and closed" : "Sent back for correction");
      } else {
        await api.voidNCR(r.ncr_id, { reason: note });
        toast.success("Voided");
      }
      onDone();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "That did not go through");
    } finally {
      setBusy(false);
    }
  };

  const titles: Record<string, string> = {
    disposition: "What will be done about it",
    accept: "Record the decision",
    submit: "Mark as corrected",
    verify: "Verify the correction",
    void: "Void this NCR",
  };

  const ready =
    !!note.trim() &&
    (mode !== "accept" || !isConcession || (!!authority.trim() && !!approver.trim()));

  return (
    <Modal title={titles[mode]} subtitle={`${r.ncr_id} · ${r.title}`} onClose={onClose}>
      {mode === "disposition" && (
        <>
          <div className="flex flex-wrap gap-2">
            {DISPOSITIONS.map((d) => (
              <button
                key={d.code}
                onClick={() => setDisposition(d.code)}
                title={d.help}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                  disposition === d.code
                    ? "border-[#0084bf] bg-[#0084bf]/10 text-[#005f8a]"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500">
            {DISPOSITIONS.find((d) => d.code === disposition)?.help}
          </p>
          {CONCESSIONS.has(disposition) && (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                This is a concession against the client&apos;s own
                specification. Accepting it will need their named approver and
                written reference — IQE reports the deviation, it does not
                decide the client will live with it.
              </p>
            </div>
          )}
          <input
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            placeholder="Root cause"
            className={inputClass}
          />
          <input
            value={corrective}
            onChange={(e) => setCorrective(e.target.value)}
            placeholder="Corrective action"
            className={inputClass}
          />
        </>
      )}

      {mode === "accept" && (
        <>
          <p className="text-sm text-slate-600">
            Proposed:{" "}
            <span className="font-medium">
              {DISPOSITIONS.find((d) => d.code === r.disposition)?.label ??
                r.disposition}
            </span>
            {r.disposition_note ? ` — ${r.disposition_note}` : ""}
          </p>
          {isConcession && (
            <>
              <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  A concession against the client&apos;s specification is
                  theirs to grant. Neither the contractor nor IQE can.
                </p>
              </div>
              <input
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                placeholder="Who granted it, e.g. K. Ramesh, SHMIC *"
                className={inputClass}
              />
              <input
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                placeholder="Their written reference, e.g. SHMIC/CON/2026/09 *"
                className={inputClass}
              />
            </>
          )}
          {isRejectFinding && (
            <p className="text-sm text-slate-600">
              Withdrawing the finding needs a reason. One withdrawn without
              it is indistinguishable from one that was argued away.
            </p>
          )}
        </>
      )}

      {mode === "verify" && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAccepted(true)}
              className={accepted ? buttonPrimary : buttonSecondary}
            >
              Correction holds
            </button>
            <button
              onClick={() => setAccepted(false)}
              className={!accepted ? buttonPrimary : buttonSecondary}
            >
              Still not right
            </button>
          </div>
          <p className="text-sm text-slate-500">
            Whoever submitted this as corrected cannot verify it — verifying
            your own correction is an assertion repeated, not a check.
          </p>
        </>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder={
          mode === "verify"
            ? "What was checked *"
            : mode === "void"
            ? "Why it is being voided *"
            : mode === "submit"
            ? "What was done *"
            : "Note *"
        }
        className={inputClass}
      />
      {mode === "verify" && (
        <p className="text-xs text-slate-500">
          &ldquo;Closed&rdquo; with no record of what was looked at is an
          assertion, not a verification.
        </p>
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
    </Modal>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}
