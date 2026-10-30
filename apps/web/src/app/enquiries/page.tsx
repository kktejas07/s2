"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase, RefreshCw, Plus, ArrowRight, AlertTriangle, CheckCircle2, X, Sparkles,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatDate } from "@/lib/workPackageLifecycle";
import {
  Card, EmptyState, PageHeader, SkeletonRows, StatusPill, Tone,
  buttonPrimary, buttonSecondary, formatINR, humanise, inputClass,
} from "@/components/ui";

/**
 * Enquiries: the gated funnel from first contact to work order.
 *
 * The screen is organised around the two gates rather than around the record,
 * because what someone needs here is not "what does this enquiry contain" but
 * "what is the next decision and who makes it".
 */

const STATUS_TONE: Record<string, Tone> = {
  draft: "idle",
  qualifying: "idle",
  pending_decision: "warn",
  go: "ok",
  estimating: "info",
  proposal_draft: "info",
  submitted: "info",
  under_clarification: "warn",
  won: "ok",
  converted: "ok",
  no_go: "warn",
  remediation: "info",
  closed_no_bid: "idle",
  lost: "bad",
  revived: "info",
  closed_lost: "idle",
};

const STATUS_LABEL: Record<string, string> = {
  pending_decision: "Awaiting bid decision",
  go: "Bid approved",
  no_go: "Declined",
  closed_no_bid: "Closed — no bid",
  closed_lost: "Closed — lost",
  under_clarification: "In clarification",
  proposal_draft: "Proposal drafted",
  converted: "Converted to job",
};

function label(status: string): string {
  return STATUS_LABEL[status] ?? humanise(status);
}

export default function EnquiriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getEnquiries(
        statusFilter ? { status: statusFilter, per_page: 100 } : { per_page: 100 },
      );
      setItems(res?.data ?? []);
    } catch {
      toast.error("Could not load enquiries.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Briefcase}
        title="Enquiries"
        description="Every enquiry passes two gates: ours, on whether to bid, and the client's, on whether to award."
        actions={
          <>
            <button onClick={() => setCreating(true)} className={buttonPrimary}>
              <Plus className="h-4 w-4" />
              Record an enquiry
            </button>
            <button onClick={load} className={buttonSecondary}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </>
        }
      />

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className={inputClass + " sm:w-64"}
      >
        <option value="">Any stage</option>
        {Object.keys(STATUS_TONE).map((s) => (
          <option key={s} value={s}>{label(s)}</option>
        ))}
      </select>

      {loading ? (
        <SkeletonRows rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No enquiries"
          description="Record one to start the funnel. It is scored at the bid gate before any quotation is drawn up."
        />
      ) : (
        <div className="space-y-2.5">
          {items.map((e) => (
            <Card key={e.enquiry_id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{e.enquiry_id}</span>
                    <StatusPill tone={STATUS_TONE[e.status] ?? "idle"}>
                      {label(e.status)}
                    </StatusPill>
                    {e.won_job_id && (
                      <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                        {e.won_job_id}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>{e.client_id}</span>
                    <span>{humanise(e.source ?? "")}</span>
                    {e.enquiry_date && <span>{formatDate(e.enquiry_date)}</span>}
                    {e.pipeline_value > 0 && (
                      <span>
                        {formatINR(e.pipeline_value)}
                        {e.probability_pct > 0 && ` at ${e.probability_pct}%`}
                      </span>
                    )}
                    {e.current_proposal_id && (
                      <span className="font-mono">
                        {e.current_proposal_id} Rev {e.current_revision_no}
                      </span>
                    )}
                  </div>
                  {e.outcome_reason_codes?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {e.outcome_reason_codes.map((c: string) => (
                        <span
                          key={c}
                          className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {e.status === "won" && (
                    <button
                      onClick={async (ev) => {
                        ev.stopPropagation();
                        try {
                          const res = await api.convertEnquiry(e.enquiry_id, {});
                          toast.success(`⚡ Converted ${e.enquiry_id} to ${res.job_id} & SO ${res.service_order_id}!`);
                          load();
                        } catch (err: any) {
                          toast.error(err?.response?.data?.detail || "Conversion failed");
                        }
                      }}
                      className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs px-3 py-1.5 shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      Auto-Convert SOW
                    </button>
                  )}
                  {e.status === "converted" && e.won_job_id && (
                    <Link
                      href={`/jobs`}
                      className="rounded-xl bg-sky-50 dark:bg-sky-950/40 text-[#0084bf] dark:text-sky-300 font-bold text-xs px-2.5 py-1.5 border border-sky-200 dark:border-sky-800 flex items-center gap-1 hover:bg-sky-100"
                    >
                      <span>View Job {e.won_job_id}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                  <button
                    onClick={() => setOpen(e.enquiry_id)}
                    className={buttonSecondary + " shrink-0 !px-2.5 !py-1.5 text-xs"}
                  >
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {open && (
        <EnquiryDrawer
          enquiryId={open}
          onClose={() => setOpen(null)}
          onChanged={load}
        />
      )}
      {creating && (
        <CreateDialog onClose={() => setCreating(false)} onSaved={load} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ drawer */

function EnquiryDrawer({
  enquiryId, onClose, onChanged,
}: {
  enquiryId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api.getEnquiry(enquiryId));
    } catch {
      toast.error(`Could not open ${enquiryId}.`);
      onClose();
    }
  }, [enquiryId, onClose]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<any>, success: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(success);
      await load();
      onChanged();
    } catch (e: any) {
      // The backend's refusals explain themselves and say what is allowed
      // instead; passing them through beats a generic failure message.
      toast.error(e?.response?.data?.detail || "That did not work.");
    } finally {
      setBusy(false);
    }
  };

  const eq = data?.enquiry;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-white">
              {enquiryId}
            </h2>
            {eq && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusPill tone={STATUS_TONE[eq.status] ?? "idle"}>
                  {label(eq.status)}
                </StatusPill>
                <span className="text-xs text-slate-400">{eq.client_id}</span>
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
          <div className="mt-4">
            <SkeletonRows rows={3} />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <NextStep eq={eq} data={data} busy={busy} act={act} />

            {data.decisions?.length > 0 && (
              <Card className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Bid decisions
                </h3>
                <div className="mt-2 space-y-3">
                  {data.decisions.map((d: any) => (
                    <div key={d.decision_id} className="text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={d.decision === "go" ? "ok" : "warn"}>
                          {d.decision === "go" ? "Bid" : "No bid"}
                        </StatusPill>
                        <span className="font-mono text-xs text-slate-400">
                          {d.decision_id}
                        </span>
                        <span className="text-xs text-slate-500">
                          {d.weighted_score} / {d.max_score}
                        </span>
                        {/* When the human disagreed with the score, that is the
                            most important thing on the record. */}
                        {d.decision !== d.recommendation && (
                          <StatusPill tone="warn">
                            Overrode a &ldquo;{d.recommendation === "go" ? "bid" : "no bid"}&rdquo; score
                          </StatusPill>
                        )}
                      </div>
                      {d.override_reason && (
                        <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                          {d.override_reason}
                        </p>
                      )}
                      {d.reason_codes?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {d.reason_codes.map((c: string) => (
                            <span key={c} className="font-mono text-[11px] text-slate-500">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                      {d.remediation_plan && (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          Remedy: {d.remediation_plan}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {data.revisions?.length > 0 && (
              <Card className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Proposal revisions
                </h3>
                <table className="mt-2 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400">
                      <th className="pb-1 font-medium">Rev</th>
                      <th className="pb-1 font-medium">Value</th>
                      <th className="pb-1 font-medium">Status</th>
                      <th className="pb-1 font-medium">Issued</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.revisions.map((r: any) => (
                      <tr key={r.revision_no}>
                        <td className="py-1.5 font-mono text-xs">Rev {r.revision_no}</td>
                        <td className="py-1.5 tabular-nums">{formatINR(r.total_value)}</td>
                        <td className="py-1.5">
                          <StatusPill
                            tone={
                              r.status === "issued" ? "ok"
                                : r.status === "superseded" ? "idle" : "info"
                            }
                          >
                            {humanise(r.status)}
                          </StatusPill>
                        </td>
                        <td className="py-1.5 text-xs text-slate-500">
                          {r.issued_at ? formatDate(r.issued_at) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.revisions.some((r: any) => r.change_summary) && (
                  <ul className="mt-2 space-y-1">
                    {data.revisions
                      .filter((r: any) => r.change_summary)
                      .map((r: any) => (
                        <li key={r.revision_no} className="text-xs text-slate-500">
                          <span className="font-mono">Rev {r.revision_no}</span>
                          {" — "}
                          {r.change_summary}
                        </li>
                      ))}
                  </ul>
                )}
              </Card>
            )}

            <Card className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                How it got here
              </h3>
              <ol className="mt-2 space-y-1">
                {(eq.status_history ?? []).map((t: any, i: number) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400">{formatDate(t.at)}</span>
                    {t.from_status && (
                      <>
                        <span className="text-slate-400">{label(t.from_status)}</span>
                        <ArrowRight className="h-3 w-3 text-slate-300" />
                      </>
                    )}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {label(t.to_status)}
                    </span>
                    {t.note && <span className="text-slate-500">— {t.note}</span>}
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------- what happens next here */

function NextStep({
  eq, data, busy, act,
}: {
  eq: any;
  data: any;
  busy: boolean;
  act: (fn: () => Promise<any>, msg: string) => Promise<void>;
}) {
  const [scorecard, setScorecard] = useState<any>(null);
  const status = eq.status;

  if (["closed_no_bid", "closed_lost", "converted"].includes(status)) {
    return (
      <Card className="p-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {status === "converted"
            ? `Won and converted to ${eq.won_job_id}. Nothing further happens here.`
            : "Closed. The record stays for the reason-code rollup."}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Next step
      </h3>

      {["draft", "qualifying", "pending_decision", "remediation"].includes(status) && (
        <div className="mt-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Gate 1: score the enquiry and decide whether to bid.
          </p>
          {!scorecard ? (
            <button
              onClick={async () => {
                try {
                  setScorecard(await api.buildScorecard(eq.enquiry_id));
                } catch (e: any) {
                  toast.error(e?.response?.data?.detail || "Could not build the scorecard.");
                }
              }}
              className={buttonPrimary + " mt-2"}
            >
              Open the scorecard
            </button>
          ) : (
            <Scorecard
              enquiryId={eq.enquiry_id}
              scorecard={scorecard}
              busy={busy}
              act={act}
            />
          )}
        </div>
      )}

      {status === "no_go" && (
        <RemediateForm enquiryId={eq.enquiry_id} busy={busy} act={act} />
      )}

      {["go", "estimating"].includes(status) && (
        <ProposalForm enquiryId={eq.enquiry_id} busy={busy} act={act} />
      )}

      {["proposal_draft", "under_clarification", "revived"].includes(status) && (
        <IssueForm eq={eq} data={data} busy={busy} act={act} />
      )}

      {status === "submitted" && (
        <OutcomeForm enquiryId={eq.enquiry_id} busy={busy} act={act} />
      )}

      {status === "lost" && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => act(() => api.reviveEnquiry(eq.enquiry_id), "Revived.")}
            disabled={busy}
            className={buttonPrimary}
          >
            Client has re-opened it
          </button>
          <button
            onClick={() => act(() => api.closeEnquiry(eq.enquiry_id), "Closed.")}
            disabled={busy}
            className={buttonSecondary}
          >
            Close it
          </button>
        </div>
      )}

      {status === "won" && (
        <div className="mt-3 space-y-3">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
            <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Bid Won by Client Award
            </div>
            <p className="leading-relaxed">
              Converting will autonomously create the live <strong>Job</strong>, apply the discipline-matching <strong>SOW Template</strong> with 4 mandatory ITP hold points, bind the <strong>Service Order (SO)</strong>, and initialize the initial <strong>Work Package</strong>.
            </p>
          </div>
          <button
            onClick={() =>
              act(
                () => api.convertEnquiry(eq.enquiry_id, {}),
                "⚡ Won bid successfully converted into Job, Service Order & SOW checkpoints!",
              )
            }
            disabled={busy}
            className="w-full justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 py-2.5 px-4 text-xs font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-600 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            Autonomous Convert to Job &amp; SOW Checkpoints
          </button>
        </div>
      )}
    </Card>
  );
}

function Scorecard({
  enquiryId, scorecard, busy, act,
}: {
  enquiryId: string;
  scorecard: any;
  busy: boolean;
  act: (fn: () => Promise<any>, msg: string) => Promise<void>;
}) {
  const [criteria, setCriteria] = useState<any[]>(
    // Start from the auto-score where there is one: it is a suggestion, and
    // leaving the field blank would make the reviewer retype it.
    (scorecard.criteria ?? []).map((c: any) => ({ ...c, score: c.auto_score ?? null })),
  );
  const [codes, setCodes] = useState("");
  const [override, setOverride] = useState("");

  const total = criteria.reduce((s, c) => s + c.weight * (c.score ?? 0), 0);
  const pct = scorecard.max_score ? (total / scorecard.max_score) * 100 : 0;
  const recommends = pct >= (scorecard.go_threshold_pct ?? 60) ? "go" : "no_go";

  const decide = (decision: string) =>
    act(
      () =>
        api.decideEnquiry(enquiryId, {
          decision,
          criteria,
          reason_codes: codes.split(",").map((c) => c.trim()).filter(Boolean),
          override_reason: override.trim() || undefined,
        }),
      decision === "go" ? "Bid approved." : "Declined, with the reason recorded.",
    );

  return (
    <div className="mt-3 space-y-2">
      {criteria.map((c, i) => (
        <div key={c.code} className="flex flex-wrap items-center gap-2">
          <span className="w-56 shrink-0 text-sm text-slate-700 dark:text-slate-300">
            {c.label}
            <span className="ml-1 text-xs text-slate-400">×{c.weight}</span>
          </span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() =>
                  setCriteria((prev) =>
                    prev.map((x, j) => (j === i ? { ...x, score: n } : x)),
                  )
                }
                className={`h-7 w-7 rounded-md text-xs font-medium transition ${
                  c.score === n
                    ? "bg-[#0084bf] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {c.auto_rationale && (
            <span className="text-xs text-slate-400">{c.auto_rationale}</span>
          )}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {total.toFixed(1)} / {scorecard.max_score} ({pct.toFixed(0)}%)
        </span>
        <StatusPill tone={recommends === "go" ? "ok" : "warn"}>
          Score says {recommends === "go" ? "bid" : "no bid"}
        </StatusPill>
      </div>

      <input
        value={codes}
        onChange={(e) => setCodes(e.target.value)}
        placeholder="Reason codes if declining, e.g. NO_COMPETENT_INSPECTOR"
        className={inputClass}
      />
      <input
        value={override}
        onChange={(e) => setOverride(e.target.value)}
        placeholder="Reason, if you are going against the score"
        className={inputClass}
      />

      <div className="flex gap-2">
        <button onClick={() => decide("go")} disabled={busy} className={buttonPrimary}>
          Bid
        </button>
        <button
          onClick={() => decide("no_go")}
          disabled={busy}
          className="rounded-xl border border-amber-300 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
        >
          Do not bid
        </button>
      </div>
      <p className="text-xs text-slate-400">{scorecard.note}</p>
    </div>
  );
}

function RemediateForm({ enquiryId, busy, act }: any) {
  const [plan, setPlan] = useState("");
  return (
    <div className="mt-2">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Declined. A no-go is a constraint to fix, not an ending — say what will change
        and the enquiry goes back to the gate.
      </p>
      <textarea
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
        rows={2}
        placeholder="What will be fixed, and by when"
        className={inputClass + " mt-2"}
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={() =>
            act(
              () => api.remediateEnquiry(enquiryId, { remediation_plan: plan }),
              "Remedy recorded; it can be re-decided.",
            )
          }
          disabled={busy || !plan.trim()}
          className={buttonPrimary}
        >
          Open the remedy loop
        </button>
        <button
          onClick={() => act(() => api.closeEnquiry(enquiryId), "Closed.")}
          disabled={busy}
          className={buttonSecondary}
        >
          Close it instead
        </button>
      </div>
    </div>
  );
}

function ProposalForm({ enquiryId, busy, act }: any) {
  const [f, setF] = useState({
    inspector_cost: "", travel_cost: "", overhead_pct: "", margin_pct: "",
    estimated_mandays: "", validity_days: "30",
  });
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const num = (v: string) => (v === "" ? 0 : Number(v));

  return (
    <div className="mt-2">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Gate 1 passed. Draw up Rev 0 — the total is computed from these figures, not
        entered.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[
          ["inspector_cost", "Inspector cost"],
          ["travel_cost", "Travel cost"],
          ["overhead_pct", "Overhead %"],
          ["margin_pct", "Margin %"],
          ["estimated_mandays", "Estimated mandays"],
          ["validity_days", "Valid for (days)"],
        ].map(([k, lbl]) => (
          <label key={k} className="text-xs text-slate-500">
            {lbl}
            <input
              type="number"
              value={(f as any)[k]}
              onChange={set(k)}
              className={inputClass + " mt-0.5"}
            />
          </label>
        ))}
      </div>
      <button
        onClick={() =>
          act(
            () =>
              api.createProposal(enquiryId, {
                inspector_cost: num(f.inspector_cost),
                travel_cost: num(f.travel_cost),
                overhead_pct: num(f.overhead_pct),
                margin_pct: num(f.margin_pct),
                estimated_mandays: num(f.estimated_mandays),
                validity_days: num(f.validity_days) || 30,
              }),
            "Rev 0 drafted.",
          )
        }
        disabled={busy}
        className={buttonPrimary + " mt-2"}
      >
        Draft Rev 0
      </button>
    </div>
  );
}

function IssueForm({ eq, data, busy, act }: any) {
  const [summary, setSummary] = useState("");
  const [cost, setCost] = useState("");
  const latest = data.revisions?.[data.revisions.length - 1];
  if (!latest) return null;

  return (
    <div className="mt-2 space-y-3">
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Rev {latest.revision_no} is drafted at {formatINR(latest.total_value)}. Issuing
          freezes it — after that a change means a new revision, not an edit.
        </p>
        <button
          onClick={() =>
            act(
              () => api.issueProposalRevision(eq.current_proposal_id, latest.revision_no),
              `Rev ${latest.revision_no} issued.`,
            )
          }
          disabled={busy || latest.status !== "draft"}
          className={buttonPrimary + " mt-2"}
        >
          Issue Rev {latest.revision_no}
        </button>
      </div>

      <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Or supersede it with the next revision.
        </p>
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="What changed, and why"
          className={inputClass + " mt-2"}
        />
        <input
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="Revised inspector cost (blank keeps the current figure)"
          className={inputClass + " mt-2"}
        />
        <button
          onClick={() =>
            act(
              () =>
                api.addProposalRevision(eq.current_proposal_id, {
                  change_summary: summary,
                  ...(cost ? { inspector_cost: Number(cost) } : {}),
                }),
              `Rev ${latest.revision_no + 1} created.`,
            )
          }
          disabled={busy || !summary.trim()}
          className={buttonSecondary + " mt-2"}
        >
          Create Rev {latest.revision_no + 1}
        </button>
      </div>
    </div>
  );
}

function OutcomeForm({ enquiryId, busy, act }: any) {
  const [codes, setCodes] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [award, setAward] = useState("");

  return (
    <div className="mt-2 space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Gate 2: the client&rsquo;s decision.
      </p>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          If IQE won it
        </p>
        <input
          value={award}
          onChange={(e) => setAward(e.target.value)}
          placeholder="Award reference (LOI or PO number)"
          className={inputClass}
        />
        <button
          onClick={() =>
            act(
              () =>
                api.recordEnquiryOutcome(enquiryId, {
                  outcome: "won",
                  award_reference: award.trim() || undefined,
                }),
              "Recorded as won.",
            )
          }
          disabled={busy}
          className={buttonPrimary + " mt-2"}
        >
          <CheckCircle2 className="h-4 w-4" />
          Won
        </button>
      </div>

      <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          If the client placed it elsewhere
        </p>
        <input
          value={codes}
          onChange={(e) => setCodes(e.target.value)}
          placeholder="Reason codes, e.g. UNDERCUT_BY_COMPETITOR"
          className={inputClass}
        />
        <input
          value={competitors}
          onChange={(e) => setCompetitors(e.target.value)}
          placeholder="Who won it, if known"
          className={inputClass + " mt-2"}
        />
        <button
          onClick={() =>
            act(
              () =>
                api.recordEnquiryOutcome(enquiryId, {
                  outcome: "lost",
                  reason_codes: codes.split(",").map((c) => c.trim()).filter(Boolean),
                  competitor_names: competitors
                    .split(",").map((c) => c.trim()).filter(Boolean),
                }),
              "Recorded as lost, with the reason.",
            )
          }
          disabled={busy || !codes.trim()}
          className="mt-2 inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
        >
          <AlertTriangle className="h-4 w-4" />
          Lost
        </button>
      </div>
    </div>
  );
}

function CreateDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    client_id: "", category: "", source: "direct",
    pipeline_value: "", probability_pct: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setSaving(true);
    try {
      await api.createEnquiry({
        client_id: f.client_id.trim(),
        category: f.category.trim() || undefined,
        source: f.source,
        pipeline_value: f.pipeline_value ? Number(f.pipeline_value) : 0,
        probability_pct: f.probability_pct ? Number(f.probability_pct) : 0,
      });
      toast.success("Enquiry recorded.");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Could not record it.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-5">
        <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white">
          Record an enquiry
        </h2>
        <div className="mt-3 space-y-2">
          <input
            value={f.client_id}
            onChange={set("client_id")}
            placeholder="Client ID"
            className={inputClass}
          />
          <input
            value={f.category}
            onChange={set("category")}
            placeholder="What it is for"
            className={inputClass}
          />
          <select value={f.source} onChange={set("source")} className={inputClass}>
            {["direct", "tender_portal", "repeat_client", "referral", "other"].map((s) => (
              <option key={s} value={s}>{humanise(s)}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={f.pipeline_value}
              onChange={set("pipeline_value")}
              placeholder="Estimated value"
              className={inputClass}
            />
            <input
              type="number"
              value={f.probability_pct}
              onChange={set("probability_pct")}
              placeholder="Probability %"
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button
            onClick={save}
            disabled={saving || !f.client_id.trim()}
            className={buttonPrimary}
          >
            {saving ? "Saving…" : "Record it"}
          </button>
        </div>
      </Card>
    </div>
  );
}
