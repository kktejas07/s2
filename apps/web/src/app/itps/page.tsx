"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Layers, RefreshCw, Plus, X, CheckCircle2, AlertTriangle, Sparkles,
  FileText, ShieldCheck, Eye,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatDate } from "@/lib/workPackageLifecycle";
import {
  Card, EmptyState, Metric, PageHeader, SkeletonRows, StatusPill, Tone,
  buttonPrimary, buttonSecondary, inputClass,
} from "@/components/ui";

/**
 * Inspection and Test Plans.
 *
 * An ITP is the contract for what gets inspected: every row says what the
 * activity is, what it is measured against, and who has to be there. The one
 * distinction the screen exists to make visible is H against W — a hold point
 * stops the contractor's work until IQE attends, a witness point does not.
 * Everything here is arranged so that distinction is never ambiguous.
 *
 * Approval is a one-way door. After it the points are fixed, because changing
 * an approved ITP silently changes what both parties agreed to inspect.
 */

const INTERVENTIONS = [
  { code: "H", label: "Hold", help: "Work stops until IQE attends" },
  { code: "W", label: "Witness", help: "IQE attends; work continues either way" },
  { code: "R", label: "Review", help: "Records reviewed, no attendance" },
  { code: "M", label: "Monitor", help: "Surveillance only" },
];

const INTERVENTION_TONE: Record<string, Tone> = {
  H: "bad", W: "warn", R: "idle", M: "idle",
};

const INTERVENTION_LABEL: Record<string, string> = {
  H: "Hold", W: "Witness", R: "Review", M: "Monitor",
};

const STATUS_TONE: Record<string, Tone> = {
  DRAFT: "warn", APPROVED: "ok", SUPERSEDED: "idle", CLOSED: "idle",
};

/** A point as the create/extract form holds it before it is saved. */
interface DraftPoint {
  point_id: string;
  activity: string;
  discipline?: string | null;
  intervention: string;
  reference_document?: string | null;
  reference_revision?: string | null;
  acceptance_criteria?: string | null;
  uncertain?: string[];
}

const BLANK_POINT: DraftPoint = {
  point_id: "", activity: "", discipline: "", intervention: "W",
  reference_document: "", reference_revision: "", acceptance_criteria: "",
};

export default function ITPsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, any>>({});

  const [adding, setAdding] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listITPs();
      setPlans(res?.data ?? []);
    } catch {
      toast.error("Could not load the plans");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const expand = async (itpId: string) => {
    if (open === itpId) {
      setOpen(null);
      return;
    }
    setOpen(itpId);
    if (!detail[itpId]) {
      try {
        const d = await api.getITP(itpId);
        setDetail((prev) => ({ ...prev, [itpId]: d }));
      } catch {
        toast.error(`Could not load ${itpId}`);
      }
    }
  };

  const approve = async (itpId: string) => {
    try {
      await api.approveITP(itpId);
      toast.success(`${itpId} approved. The points are now fixed.`);
      setDetail((prev) => ({ ...prev, [itpId]: undefined }));
      load();
    } catch (e: any) {
      // The refusals here are the point of the module, so they are shown in
      // full rather than reduced to "failed".
      toast.error(e?.response?.data?.detail ?? "Could not approve the plan");
    }
  };

  const confirmExtraction = async (itpId: string) => {
    try {
      await api.confirmITPExtraction(itpId);
      toast.success("Extraction confirmed. The plan can now be approved.");
      setDetail((prev) => ({ ...prev, [itpId]: undefined }));
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not confirm");
    }
  };

  const holdTotal = plans.reduce((n, p) => n + (p.hold_point_count ?? 0), 0);
  const unconfirmed = plans.filter(
    (p) => p.extracted_from_document && !p.extraction_confirmed_by,
  ).length;
  const drafts = plans.filter((p) => p.status === "DRAFT").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={Layers}
        title="Inspection & Test Plans"
        description="What gets inspected, what it is measured against, and who has to be there"
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={load} className={buttonSecondary}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={() => setExtracting(true)} className={buttonSecondary}>
              <Sparkles className="w-4 h-4" /> Read from document
            </button>
            <button onClick={() => setAdding(true)} className={buttonPrimary}>
              <Plus className="w-4 h-4" /> New plan
            </button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <Metric value={plans.length} label="Plans" />
          <Metric value={drafts} label="In draft" tone={drafts ? "warn" : undefined} />
          <Metric
            value={holdTotal}
            label="Hold points"
            sub="Work stops at each until IQE attends"
            tone={holdTotal ? "bad" : undefined}
          />
          <Metric
            value={unconfirmed}
            label="Awaiting confirmation"
            sub="Read from a document, not yet checked"
            tone={unconfirmed ? "warn" : "ok"}
          />
        </div>
      </Card>

      {unconfirmed > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-900">
            {unconfirmed === 1
              ? "One plan was read out of a client document and nobody has checked it against the original yet."
              : `${unconfirmed} plans were read out of client documents and nobody has checked them against the originals yet.`}{" "}
            An ITP is contractual, so these cannot be approved until someone
            confirms the reading.
          </p>
        </div>
      )}

      {loading ? (
        <SkeletonRows rows={4} />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No inspection and test plans yet"
          description="A plan can be keyed in by hand, or read out of the ITP the client issued and then checked against it."
        />
      ) : (
        <div className="space-y-3">
          {plans.map((p) => {
            const needsConfirming =
              p.extracted_from_document && !p.extraction_confirmed_by;
            const d = detail[p.itp_id];
            return (
              <Card key={p.itp_id} className="overflow-hidden">
                <button
                  onClick={() => expand(p.itp_id)}
                  className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
                >
                  {/* Stacked below sm. Side by side at phone width left the
                      title about 130px and truncated it to "Block …", and the
                      title is the thing someone is scanning for. */}
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-4">
                    <div className="min-w-0 sm:flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">
                          {p.itp_id}
                        </span>
                        <StatusPill tone={STATUS_TONE[p.status] ?? "idle"}>{p.status === "DRAFT" ? "Draft" : "Approved"}</StatusPill>
                        {p.revision && (
                          <span className="text-xs text-slate-500">{p.revision}</span>
                        )}
                        {needsConfirming && (
                          <StatusPill tone="warn">{"Unconfirmed reading"}</StatusPill>
                        )}
                      </div>
                      <h3 className="mt-1.5 font-semibold text-slate-900">
                        {p.title}
                      </h3>
                      <p className="text-sm text-slate-500 break-words">
                        {p.job_id}
                        {p.client_reference ? ` · ${p.client_reference}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:shrink-0">
                      <span className="text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {p.point_count ?? 0}
                        </span>{" "}
                        {p.point_count === 1 ? "point" : "points"}
                      </span>
                      {(p.hold_point_count ?? 0) > 0 && (
                        <StatusPill tone="bad">{`${p.hold_point_count} hold`}</StatusPill>
                      )}
                      {(p.witness_point_count ?? 0) > 0 && (
                        <StatusPill tone="warn">{`${p.witness_point_count} witness`}</StatusPill>
                      )}
                    </div>
                  </div>
                </button>

                {open === p.itp_id && (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-4 space-y-4">
                    {p.extracted_from_document && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                        <Sparkles className="w-4 h-4 text-[#0084bf] shrink-0" />
                        <p className="text-sm text-slate-600 flex-1">
                          Read out of{" "}
                          <span className="font-medium text-slate-900">
                            {p.extracted_from_document}
                          </span>
                          {p.extraction_confirmed_by
                            ? ` · confirmed by ${p.extraction_confirmed_by}`
                            : " · not yet checked against the original"}
                        </p>
                        {needsConfirming && (
                          <button
                            onClick={() => confirmExtraction(p.itp_id)}
                            className={buttonSecondary}
                          >
                            <Eye className="w-4 h-4" /> I have checked it
                          </button>
                        )}
                      </div>
                    )}

                    {!d ? (
                      <SkeletonRows rows={3} />
                    ) : (
                      <PointsTable points={d.points ?? []} />
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      {p.status === "DRAFT" ? (
                        <>
                          <button
                            onClick={() => approve(p.itp_id)}
                            disabled={needsConfirming}
                            className={`${buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <ShieldCheck className="w-4 h-4" /> Approve plan
                          </button>
                          <p className="text-xs text-slate-500 max-w-md">
                            {needsConfirming
                              ? "Someone has to check these points against the original document first — approving a machine's reading unread would make that reading the contractual one."
                              : "After approval the points are fixed — changing them would change what both parties agreed to inspect."}
                          </p>
                        </>
                      ) : (
                        <p className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Approved by {p.approved_by} on{" "}
                          {formatDate(p.approved_on)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {adding && (
        <PlanForm
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}
      {extracting && (
        <ExtractForm
          onClose={() => setExtracting(false)}
          onSaved={() => {
            setExtracting(false);
            load();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ points */

function PointsTable({ points }: { points: any[] }) {
  if (points.length === 0) {
    return (
      <p className="text-sm text-slate-500">This plan has no points yet.</p>
    );
  }
  return (
    <>
      {/* Below sm the five columns collapse to one word per line and the
          criteria run off the side, so the same rows are laid out as cards.
          A squeezed table is not a smaller table, it is an unreadable one. */}
      <div className="space-y-2 sm:hidden">
        {points.map((pt) => (
          <div
            key={pt.point_id}
            className="rounded-lg border border-slate-200 bg-white p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs text-slate-500">
                {pt.point_id}
              </span>
              <StatusPill tone={INTERVENTION_TONE[pt.intervention] ?? "idle"}>
                {INTERVENTION_LABEL[pt.intervention] ?? pt.intervention}
              </StatusPill>
            </div>
            <p className="mt-1.5 font-medium text-slate-900">{pt.activity}</p>
            {pt.discipline && (
              <p className="text-xs text-slate-500">{pt.discipline}</p>
            )}
            {pt.reference_document && (
              <p className="mt-2 text-sm text-slate-600">
                {pt.reference_document}
                {pt.reference_revision ? ` · ${pt.reference_revision}` : ""}
              </p>
            )}
            {pt.acceptance_criteria && (
              <p className="mt-2 border-t border-slate-100 pt-2 text-sm text-slate-600">
                {pt.acceptance_criteria}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 font-medium">Point</th>
            <th className="px-3 py-2 font-medium">Activity</th>
            <th className="px-3 py-2 font-medium">Reference</th>
            <th className="px-3 py-2 font-medium">Acceptance criteria</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">IQE</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {points.map((pt) => (
            <tr key={pt.point_id} className="align-top">
              <td className="px-3 py-2 font-mono text-xs text-slate-500 whitespace-nowrap">
                {pt.point_id}
              </td>
              <td className="px-3 py-2">
                <p className="text-slate-900">{pt.activity}</p>
                {pt.discipline && (
                  <p className="text-xs text-slate-500">{pt.discipline}</p>
                )}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {pt.reference_document ? (
                  <>
                    <span className="block">{pt.reference_document}</span>
                    {pt.reference_revision && (
                      <span className="text-xs text-slate-500">
                        {pt.reference_revision}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-slate-600 max-w-xs">
                {pt.acceptance_criteria || (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <StatusPill tone={INTERVENTION_TONE[pt.intervention] ?? "idle"}>{INTERVENTION_LABEL[pt.intervention] ?? pt.intervention}</StatusPill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}

/* -------------------------------------------------------------- point editor */

function PointRows({
  points,
  setPoints,
}: {
  points: DraftPoint[];
  setPoints: (p: DraftPoint[]) => void;
}) {
  const update = (i: number, patch: Partial<DraftPoint>) =>
    setPoints(points.map((p, n) => (n === i ? { ...p, ...patch } : p)));

  return (
    <div className="space-y-3">
      {points.map((pt, i) => {
        const needsCriteria = pt.intervention === "H" && !pt.acceptance_criteria;
        return (
          <div
            key={i}
            className="rounded-lg border border-slate-200 p-3 space-y-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={pt.point_id}
                onChange={(e) => update(i, { point_id: e.target.value })}
                placeholder="4.3.2"
                className={`${inputClass} w-24 font-mono`}
              />
              <input
                value={pt.activity}
                onChange={(e) => update(i, { activity: e.target.value })}
                placeholder="Activity"
                className={`${inputClass} flex-1 min-w-[12rem]`}
              />
              {points.length > 1 && (
                <button
                  onClick={() => setPoints(points.filter((_, n) => n !== i))}
                  className="p-2 text-slate-400 hover:text-red-600"
                  aria-label="Remove point"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {INTERVENTIONS.map((iv) => (
                <button
                  key={iv.code}
                  onClick={() => update(i, { intervention: iv.code })}
                  title={iv.help}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    pt.intervention === iv.code
                      ? iv.code === "H"
                        ? "bg-red-50 border-red-300 text-red-800"
                        : "bg-[#0084bf]/10 border-[#0084bf] text-[#005f8a]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {iv.code} · {iv.label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-2">
              <input
                value={pt.discipline ?? ""}
                onChange={(e) => update(i, { discipline: e.target.value })}
                placeholder="Discipline"
                className={inputClass}
              />
              <input
                value={pt.reference_document ?? ""}
                onChange={(e) => update(i, { reference_document: e.target.value })}
                placeholder="Drawing / spec"
                className={inputClass}
              />
              <input
                value={pt.reference_revision ?? ""}
                onChange={(e) => update(i, { reference_revision: e.target.value })}
                placeholder="Revision"
                className={inputClass}
              />
            </div>

            <textarea
              value={pt.acceptance_criteria ?? ""}
              onChange={(e) => update(i, { acceptance_criteria: e.target.value })}
              placeholder="Acceptance criteria — what releases this point"
              rows={2}
              className={inputClass}
            />
            {needsCriteria && (
              <p className="flex items-start gap-2 text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Work stops at a hold point, so what releases it has to be
                written down.
              </p>
            )}
            {pt.uncertain && pt.uncertain.length > 0 && (
              <p className="text-xs text-amber-700">
                Read uncertainly: {pt.uncertain.join(", ")} — check against the
                original.
              </p>
            )}
          </div>
        );
      })}
      <button
        onClick={() => setPoints([...points, { ...BLANK_POINT }])}
        className={buttonSecondary}
      >
        <Plus className="w-4 h-4" /> Add point
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- new plan */

function PlanForm({
  onClose,
  onSaved,
  initial,
  source,
}: {
  onClose: () => void;
  onSaved: () => void;
  initial?: DraftPoint[];
  source?: string;
}) {
  const [jobId, setJobId] = useState("");
  const [title, setTitle] = useState("");
  const [clientRef, setClientRef] = useState("");
  const [revision, setRevision] = useState("");
  const [points, setPoints] = useState<DraftPoint[]>(
    initial && initial.length ? initial : [{ ...BLANK_POINT }],
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.createITP({
        job_id: jobId,
        title,
        client_reference: clientRef || null,
        revision: revision || null,
        extracted_from_document: source || null,
        points: points.map((p) => ({
          ...p,
          discipline: p.discipline || null,
          reference_document: p.reference_document || null,
          reference_revision: p.reference_revision || null,
          acceptance_criteria: p.acceptance_criteria || null,
        })),
      });
      toast.success("Plan saved as a draft");
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not save the plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={source ? "Check and save the plan" : "New inspection & test plan"}
      onClose={onClose}
    >
      {source && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          These points were read out of {source}. Check them against the
          original before saving — the acceptance criteria is what a contractor
          is held to.
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          placeholder="Job reference *"
          className={inputClass}
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Plan title *"
          className={inputClass}
        />
        <input
          value={clientRef}
          onChange={(e) => setClientRef(e.target.value)}
          placeholder="Client's reference"
          className={inputClass}
        />
        <input
          value={revision}
          onChange={(e) => setRevision(e.target.value)}
          placeholder="Revision"
          className={inputClass}
        />
      </div>

      <PointRows points={points} setPoints={setPoints} />

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button onClick={onClose} className={buttonSecondary}>
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving || !jobId || !title}
          className={`${buttonPrimary} disabled:opacity-50`}
        >
          {saving ? "Saving…" : "Save as draft"}
        </button>
      </div>
    </Modal>
  );
}

/* ----------------------------------------------------------------- extract */

function ExtractForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<any>(null);

  const run = async () => {
    setBusy(true);
    try {
      const out = await api.extractITP({
        document_text: text,
        source: source || undefined,
      });
      setDraft(out);
      if (!out.ok) toast.error(out.note);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not read the document");
    } finally {
      setBusy(false);
    }
  };

  if (draft?.ok) {
    return (
      <PlanForm
        onClose={onClose}
        onSaved={onSaved}
        initial={draft.points}
        source={source || "a client document"}
      />
    );
  }

  return (
    <Modal title="Read a plan out of a document" onClose={onClose}>
      <p className="text-sm text-slate-600">
        Paste the ITP table from the client&apos;s document. What comes back is
        a draft for you to check — nothing is saved until you do, and the plan
        cannot be approved until someone confirms the reading.
      </p>
      <input
        value={source}
        onChange={(e) => setSource(e.target.value)}
        placeholder="Document reference, e.g. SHMIC/ITP/07 Rev C"
        className={inputClass}
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder="Paste the table here…"
        className={`${inputClass} font-mono text-xs`}
      />
      {draft && !draft.ok && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {draft.note}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button onClick={onClose} className={buttonSecondary}>
          Cancel
        </button>
        <button
          onClick={run}
          disabled={busy || !text.trim()}
          className={`${buttonPrimary} disabled:opacity-50`}
        >
          {busy ? "Reading…" : "Read the table"}
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------- modal */

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4">
      <div className="w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
          <h2 className="font-semibold text-slate-900">{title}</h2>
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
