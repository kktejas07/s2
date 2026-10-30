"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText, RefreshCw, X, AlertTriangle, Clock, TrendingUp, ShieldAlert, Plus,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatDate } from "@/lib/workPackageLifecycle";
import {
  Card, EmptyState, Metric, PageHeader, SkeletonRows, StatusPill, Tone,
  buttonPrimary, buttonSecondary, formatINR, inputClass,
} from "@/components/ui";

/**
 * Service orders as commercial envelopes, and the amendments to them.
 *
 * An order has two edges — an amount and a period — and the screen is built
 * so neither can be crossed without someone seeing it first. The four
 * situations it exists for:
 *
 *   renewal    a fixed-period order is closing and the work continues
 *   extension  the period is closing with the money unspent and work undone
 *   increase   work would take the order past its ceiling
 *   successor  new scope from the same client, so a new order
 *
 * The distinction worth keeping visible is the middle two: an underspent
 * order with work outstanding did not run out of money, it ran out of time,
 * and renewing it would answer the wrong question. They are listed
 * separately for that reason rather than totalled as "expiring".
 */

const AMENDMENT_TYPES = [
  { code: "VALUE_INCREASE", label: "Value increase", help: "More money, same scope" },
  { code: "PERIOD_EXTENSION", label: "Period extension", help: "More time, same money" },
  { code: "RENEWAL", label: "Renewal", help: "Into the next term" },
  { code: "SCOPE_CHANGE", label: "Scope change", help: "What is covered changes" },
  { code: "RATE_REVISION", label: "Rate revision", help: "The rate card moves" },
  { code: "CURTAILMENT", label: "Curtailment", help: "Closed early" },
];

const MOVES_CLIENT_COMMITMENT = new Set([
  "VALUE_INCREASE", "PERIOD_EXTENSION", "RENEWAL", "RATE_REVISION", "CURTAILMENT",
]);

const STATUS_TONE: Record<string, Tone> = {
  PROPOSED: "warn", APPROVED: "ok", REJECTED: "idle",
};

const TERM_LABEL: Record<string, string> = {
  FIXED_PERIOD: "Fixed period",
  PROJECT: "Until the work is done",
  OPEN_ENDED: "Open ended",
};

/** Banded, because a reader acts on the band rather than the number. */
function burnTone(pct: number, over: boolean): Tone {
  if (over) return "bad";
  if (pct >= 85) return "warn";
  return "ok";
}

export default function ContractsPage() {
  const [sweep, setSweep] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amending, setAmending] = useState<any>(null);
  const [deciding, setDeciding] = useState<any>(null);
  const [amendments, setAmendments] = useState<any[]>([]);
  const [framework, setFramework] = useState<any>(null);
  const [callingOff, setCallingOff] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        api.commercialSweep(),
        api.listAmendments().catch(() => null),
      ]);
      setSweep(s);
      setAmendments(a?.data ?? []);

      // Frameworks are listed in their own right rather than discovered
      // through the sweep. A healthy framework at 88% is exactly the one
      // worth seeing - the next call-off is the one that does not fit - and
      // walking only the flagged orders would mean it never appeared.
      try {
        const fws = await api.listFrameworks();
        const first = (fws?.data ?? [])[0];
        setFramework(first ? await api.frameworkView(first.so_id) : null);
      } catch {
        setFramework(null);
      }
    } catch {
      toast.error("Could not load the commercial position");
      setSweep(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const renewals = sweep?.renewals_due ?? [];
  const extensions = sweep?.extensions_indicated ?? [];
  const breaches = sweep?.ceiling_breaches ?? [];
  const atRisk = sweep?.unbilled_at_risk ?? [];
  const pending = amendments.filter((a) => a.status === "PROPOSED");

  const nothingToDo =
    !loading &&
    renewals.length === 0 &&
    extensions.length === 0 &&
    breaches.length === 0 &&
    atRisk.length === 0 &&
    pending.length === 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={FileText}
        title="Contracts & Amendments"
        description="What each order is worth, how long it runs, and what needs a decision"
        actions={
          <button onClick={load} className={buttonSecondary}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <Metric
            value={renewals.length}
            label="Renewals due"
            tone={renewals.length ? "warn" : undefined}
          />
          <Metric
            value={extensions.length}
            label="Extensions indicated"
            sub="Time ran out, not money"
            tone={extensions.length ? "warn" : undefined}
          />
          <Metric
            value={breaches.length}
            label="Over ceiling"
            sub="Work committed beyond what was agreed"
            tone={breaches.length ? "bad" : "ok"}
          />
          <Metric
            value={formatINR(sweep?.total_unbilled_at_risk ?? 0)}
            label="Unbilled, at risk"
            sub="Committed on orders that are closing"
            tone={sweep?.total_unbilled_at_risk ? "bad" : undefined}
          />
        </div>
      </Card>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : nothingToDo ? (
        <EmptyState
          icon={FileText}
          title="Nothing needs a decision"
          description="No order is near its end date, over its ceiling, or carrying work that has not been invoiced."
        />
      ) : (
        <div className="space-y-6">
          {breaches.length > 0 && (
            <Section
              icon={ShieldAlert}
              tone="bad"
              title="Over ceiling"
              blurb="Committed work exceeds what the client has agreed to pay for. No further package can be raised until a value increase is authorised."
              rows={breaches}
              action="VALUE_INCREASE"
              onAmend={setAmending}
            />
          )}

          {extensions.length > 0 && (
            <Section
              icon={Clock}
              tone="warn"
              title="Extensions indicated"
              blurb="The period is closing with most of the value unspent and work still outstanding. These did not run out of money — they ran out of time, so the question is an extension rather than a renewal."
              rows={extensions}
              action="PERIOD_EXTENSION"
              onAmend={setAmending}
            />
          )}

          {renewals.length > 0 && (
            <Section
              icon={RefreshCw}
              tone="warn"
              title="Renewals due"
              blurb="Fixed-period orders inside their renewal lead time. Renewal runs through the client's procurement, so it is raised now rather than at the end."
              rows={renewals}
              action="RENEWAL"
              onAmend={setAmending}
            />
          )}

          {atRisk.length > 0 && (
            <Section
              icon={TrendingUp}
              tone="bad"
              title="Committed but not invoiced"
              blurb="Work promised under an order that is closing. If the order lapses before the invoice is raised, this is the figure that goes missing."
              rows={atRisk}
              showUnbilled
              onAmend={setAmending}
            />
          )}

          {pending.length > 0 && (
            <div className="space-y-3">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Awaiting the client
                </h2>
                <p className="text-sm text-slate-500 max-w-2xl">
                  Proposed amendments change nothing until the client
                  authorises them. Until then the order&apos;s ceiling and end
                  date are where they were.
                </p>
              </div>
              {pending.map((a) => (
                <AmendmentRow
                  key={a.amendment_id}
                  amendment={a}
                  onDecide={setDeciding}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && amendments.filter((a) => a.status !== "PROPOSED").length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-900">Settled</h2>
          {amendments
            .filter((a) => a.status !== "PROPOSED")
            .map((a) => (
              <AmendmentRow key={a.amendment_id} amendment={a} />
            ))}
        </div>
      )}

      {framework && (
        <FrameworkSection
          data={framework}
          onCallOff={() => setCallingOff(true)}
        />
      )}

      {callingOff && framework && (
        <CallOffForm
          framework={framework.framework}
          onClose={() => setCallingOff(false)}
          onDone={() => {
            setCallingOff(false);
            load();
          }}
        />
      )}

      {amending && (
        <AmendForm
          order={amending.order}
          suggested={amending.type}
          onClose={() => setAmending(null)}
          onDone={() => {
            setAmending(null);
            load();
          }}
        />
      )}
      {deciding && (
        <DecideForm
          amendment={deciding}
          onClose={() => setDeciding(null)}
          onDone={() => {
            setDeciding(null);
            load();
          }}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- section */

function Section({
  icon: Icon,
  tone,
  title,
  blurb,
  rows,
  action,
  showUnbilled,
  onAmend,
}: {
  icon: any;
  tone: Tone;
  title: string;
  blurb: string;
  rows: any[];
  action?: string;
  showUnbilled?: boolean;
  onAmend: (v: any) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Icon
          className={`w-5 h-5 mt-0.5 shrink-0 ${
            tone === "bad" ? "text-rose-600" : "text-amber-600"
          }`}
        />
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500 max-w-2xl">{blurb}</p>
        </div>
      </div>
      {rows.map((r) => (
        <OrderRow
          key={r.so_id}
          row={r}
          tone={tone}
          action={action}
          showUnbilled={showUnbilled}
          onAmend={onAmend}
        />
      ))}
    </div>
  );
}

function OrderRow({
  row,
  tone,
  action,
  showUnbilled,
  onAmend,
}: {
  row: any;
  tone: Tone;
  action?: string;
  showUnbilled?: boolean;
  onAmend: (v: any) => void;
}) {
  const pct = Math.min(100, row.percent_consumed ?? 0);
  const over = (row.consumed ?? 0) > (row.effective_ceiling ?? 0);

  return (
    <Card
      className={`p-4 ${
        tone === "bad" ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-amber-400"
      }`}
    >
      {/* Stacked below sm: side by side at phone width squeezes the title
          and the bar into unreadable slivers. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 lg:flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-500">{row.so_id}</span>
            {row.so_number && (
              <span className="text-xs text-slate-500">{row.so_number}</span>
            )}
          </div>
          <h3 className="mt-1 font-semibold text-slate-900">
            {row.client_name ?? "Unnamed client"}
          </h3>
          <p className="text-sm text-slate-600 break-words">{row.why}</p>

          <div className="mt-3 max-w-md">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="text-slate-600">
                {formatINR(row.consumed)} of {formatINR(row.effective_ceiling)}
              </span>
              <span
                className={
                  over ? "text-rose-600 font-medium" : "text-slate-500"
                }
              >
                {(row.percent_consumed ?? 0).toFixed(0)}%
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  over
                    ? "bg-rose-500"
                    : pct >= 85
                    ? "bg-amber-500"
                    : "bg-[#0084bf]"
                }`}
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {row.valid_until && (
              <span>
                Runs to {formatDate(row.valid_until)}
                {row.days_remaining != null &&
                  ` — ${
                    row.days_remaining < 0
                      ? `lapsed ${Math.abs(row.days_remaining)} days ago`
                      : `${row.days_remaining} days left`
                  }`}
              </span>
            )}
            {showUnbilled && (
              <span className="text-rose-600 font-medium">
                {formatINR(row.unbilled)} not invoiced
              </span>
            )}
          </div>
        </div>

        {action && (
          <button
            onClick={() => onAmend({ order: row, type: action })}
            className={`${buttonPrimary} shrink-0`}
          >
            Raise{" "}
            {AMENDMENT_TYPES.find((t) => t.code === action)?.label.toLowerCase()}
          </button>
        )}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------- amendment */

function AmendmentRow({
  amendment: a,
  onDecide,
}: {
  amendment: any;
  onDecide?: (v: any) => void;
}) {
  const label =
    AMENDMENT_TYPES.find((t) => t.code === a.amendment_type)?.label ??
    a.amendment_type;

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 lg:flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-500">
              {a.amendment_id}
            </span>
            <StatusPill tone={STATUS_TONE[a.status] ?? "idle"}>
              {a.status === "PROPOSED"
                ? "Awaiting the client"
                : a.status === "APPROVED"
                ? "Authorised"
                : "Declined"}
            </StatusPill>
            <span className="text-xs text-slate-500">
              {a.so_id} · amendment {a.sequence}
            </span>
          </div>
          <h3 className="mt-1 font-semibold text-slate-900">{label}</h3>
          <p className="text-sm text-slate-600 break-words">{a.reason}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {!!a.value_delta && (
              <span
                className={
                  a.value_delta > 0 ? "text-slate-700" : "text-rose-600"
                }
              >
                {a.value_delta > 0 ? "+" : ""}
                {formatINR(a.value_delta)}
              </span>
            )}
            {a.new_valid_until && (
              <span>New end date {formatDate(a.new_valid_until)}</span>
            )}
            {a.approved_by_client && (
              <span>
                Authorised by {a.approved_by_client}
                {a.client_authority ? ` under ${a.client_authority}` : ""}
              </span>
            )}
          </div>
          {a.rejected_reason && (
            <p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700">
              Declined: {a.rejected_reason}
            </p>
          )}
        </div>

        {onDecide && a.status === "PROPOSED" && (
          <button
            onClick={() => onDecide(a)}
            className={`${buttonPrimary} shrink-0`}
          >
            Record the client&apos;s decision
          </button>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ raise a form */

function AmendForm({
  order,
  suggested,
  onClose,
  onDone,
}: {
  order: any;
  suggested?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [kind, setKind] = useState(suggested ?? "VALUE_INCREASE");
  const [value, setValue] = useState("");
  const [until, setUntil] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const movesValue = ["VALUE_INCREASE", "RATE_REVISION", "CURTAILMENT"].includes(kind);
  const movesPeriod = ["PERIOD_EXTENSION", "RENEWAL", "CURTAILMENT"].includes(kind);

  const submit = async () => {
    setBusy(true);
    try {
      const out = await api.proposeAmendment({
        so_id: order.so_id,
        amendment_type: kind,
        value_delta: movesValue ? Number(value || 0) : 0,
        new_valid_until: movesPeriod && until ? new Date(until).toISOString() : null,
        reason,
      });
      toast.success(`${out.amendment_id} raised — awaiting the client`);
      onDone();
    } catch (e: any) {
      // The refusals are the point of the module, so they are shown whole.
      toast.error(e?.response?.data?.detail ?? "Could not raise the amendment");
    } finally {
      setBusy(false);
    }
  };

  const ready =
    !!reason.trim() &&
    (!movesValue || Number(value) !== 0) &&
    (!movesPeriod || !!until);

  return (
    <Modal title={`Amend ${order.so_id}`} subtitle={order.client_name} onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        {AMENDMENT_TYPES.map((t) => (
          <button
            key={t.code}
            onClick={() => setKind(t.code)}
            title={t.help}
            className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              kind === t.code
                ? "border-[#0084bf] bg-[#0084bf]/10 text-[#005f8a]"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        {AMENDMENT_TYPES.find((t) => t.code === kind)?.help}
      </p>

      {movesValue && (
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            kind === "CURTAILMENT"
              ? "Reduction, as a negative number *"
              : "Additional value *"
          }
          className={inputClass}
        />
      )}
      {movesPeriod && (
        <input
          type="date"
          value={until}
          onChange={(e) => setUntil(e.target.value)}
          className={inputClass}
        />
      )}

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="Reason *"
        className={inputClass}
      />
      <p className="text-xs text-slate-500">
        Read back in two years, an amendment without a reason is
        indistinguishable from a mistake.
      </p>

      {MOVES_CLIENT_COMMITMENT.has(kind) && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            This changes what the client is committed to, so authorising it
            will need their named approver and written reference. Raising it
            here changes nothing yet.
          </p>
        </div>
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
          {busy ? "Raising…" : "Raise amendment"}
        </button>
      </div>
    </Modal>
  );
}

function DecideForm({
  amendment: a,
  onClose,
  onDone,
}: {
  amendment: any;
  onClose: () => void;
  onDone: () => void;
}) {
  const [approving, setApproving] = useState(true);
  const [approver, setApprover] = useState("");
  const [authority, setAuthority] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const needsAuthority = MOVES_CLIENT_COMMITMENT.has(a.amendment_type);

  const submit = async () => {
    setBusy(true);
    try {
      if (approving) {
        await api.approveAmendment(a.amendment_id, {
          approved_by_client: approver,
          client_authority: authority,
        });
        toast.success("Authorised — the order's envelope has moved");
      } else {
        await api.rejectAmendment(a.amendment_id, { reason });
        toast.success("Recorded as declined");
      }
      onDone();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "That did not go through");
    } finally {
      setBusy(false);
    }
  };

  const ready = approving
    ? !needsAuthority || (!!approver.trim() && !!authority.trim())
    : !!reason.trim();

  return (
    <Modal
      title="The client's decision"
      subtitle={`${a.amendment_id} · ${a.so_id}`}
      onClose={onClose}
    >
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setApproving(true)}
          className={approving ? buttonPrimary : buttonSecondary}
        >
          Authorised
        </button>
        <button
          onClick={() => setApproving(false)}
          className={!approving ? buttonPrimary : buttonSecondary}
        >
          Declined
        </button>
      </div>

      {approving ? (
        <>
          {needsAuthority && (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                An order is a bilateral agreement. IQE moving its own ceiling
                or end date is a unilateral change of terms, so this needs who
                authorised it and their written reference.
              </p>
            </div>
          )}
          <input
            value={approver}
            onChange={(e) => setApprover(e.target.value)}
            placeholder="Who authorised it, e.g. K. Ramesh, SHMIC *"
            className={inputClass}
          />
          <input
            value={authority}
            onChange={(e) => setAuthority(e.target.value)}
            placeholder="Their written reference, e.g. SHMIC/LTR/2026/318 *"
            className={inputClass}
          />
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            Kept rather than deleted. That the client declined an increase is
            exactly what someone needs to know when the work stops.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="What they said *"
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
          {busy ? "Recording…" : "Record"}
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

/* --------------------------------------------------- frameworks & call-offs */

/**
 * A framework and everything drawn against it.
 *
 * The point of showing them together is the thing neither shows alone: a
 * call-off can have room of its own while the framework above it has none,
 * and the framework is what binds. Listing call-offs on their own is how a
 * framework gets exhausted while every child still looks healthy.
 */
function FrameworkSection({
  data,
  onCallOff,
}: {
  data: any;
  onCallOff: () => void;
}) {
  const f = data.framework;
  const pct = Math.min(100, f.percent_consumed ?? 0);
  const exhausted = (f.remaining ?? 0) <= 0;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Framework</h2>
          <p className="text-sm text-slate-500 max-w-2xl">
            One agreement carrying the ceiling and the term, drawn against by
            call-offs. The framework&apos;s figure is what binds — a call-off
            with room of its own cannot spend what the framework no longer
            has.
          </p>
        </div>
        <button
          onClick={onCallOff}
          disabled={exhausted}
          className={`${buttonPrimary} shrink-0 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Plus className="w-4 h-4" /> New call-off
        </button>
      </div>

      <Card
        className={`p-4 ${exhausted ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-[#0084bf]"}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-slate-500">{f.so_id ?? ""}</span>
          <StatusPill tone="info">Framework</StatusPill>
          <span className="text-xs text-slate-500">
            {f.call_off_count} call-off{f.call_off_count === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-3 max-w-md">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
            <span className="text-slate-600">
              {formatINR(f.consumed)} of {formatINR(f.effective_ceiling)} carved out
            </span>
            <span className={exhausted ? "text-rose-600 font-medium" : "text-slate-500"}>
              {formatINR(f.remaining)} left
            </span>
          </div>
          <div className="mt-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                exhausted ? "bg-rose-500" : pct >= 85 ? "bg-amber-500" : "bg-[#0084bf]"
              }`}
              style={{ width: `${Math.max(2, pct)}%` }}
            />
          </div>
        </div>

        {f.effective_valid_until && (
          <p className="mt-2 text-sm text-slate-500">
            Runs to {formatDate(f.effective_valid_until)}
          </p>
        )}
        {exhausted && (
          <p className="mt-2 text-sm text-rose-700">
            Fully carved up. No further call-off can be opened until the client
            authorises a value increase on the framework.
          </p>
        )}
      </Card>

      {data.call_offs?.length > 0 && (
        <div className="space-y-2 sm:pl-6">
          {data.call_offs.map((c: any) => {
            const cpct = Math.min(100, c.percent_consumed ?? 0);
            return (
              <Card key={c.so_id} className="p-3.5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 lg:flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-500">
                        {c.so_id}
                      </span>
                      {!c.usable && c.blocked_because && (
                        <StatusPill tone="bad">Blocked</StatusPill>
                      )}
                    </div>
                    <p className="font-medium text-slate-900 break-words">
                      {c.project_name ?? c.so_number}
                    </p>
                    {!c.usable && c.blocked_because && (
                      <p className="text-sm text-rose-700 break-words">
                        {c.blocked_because}
                      </p>
                    )}
                  </div>
                  <div className="lg:w-64 shrink-0">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-slate-600">
                        {formatINR(c.consumed)} of {formatINR(c.ceiling)}
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        {cpct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cpct >= 85 ? "bg-amber-500" : "bg-[#0084bf]"
                        }`}
                        style={{ width: `${Math.max(2, cpct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-600">
        {data.note}
      </p>
    </section>
  );
}

function CallOffForm({
  framework: f,
  onClose,
  onDone,
}: {
  framework: any;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [projectName, setProjectName] = useState("");
  const [jobId, setJobId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [busy, setBusy] = useState(false);

  const value = Number(amount || 0);
  const overruns = value > (f.remaining ?? 0);

  const submit = async () => {
    setBusy(true);
    try {
      const out = await api.openCallOff(f.so_id, {
        amount: value,
        project_name: projectName || undefined,
        job_id: jobId || undefined,
        valid_until: validUntil ? new Date(validUntil).toISOString() : undefined,
      });
      toast.success(
        `${out.so_id} opened — ${formatINR(out.framework_remaining_after)} left on the framework`,
      );
      onDone();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not open the call-off");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Open a call-off"
      subtitle={`${f.so_id} · ${formatINR(f.remaining)} left`}
      onClose={onClose}
    >
      <p className="text-sm text-slate-600">
        A call-off is a slice of the framework. It inherits the client, the
        term and the end date, and it cannot be larger than what is left or
        run past the framework&apos;s own expiry.
      </p>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Value *"
        className={inputClass}
      />
      {overruns && (
        <p className="flex items-start gap-2 text-sm text-rose-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {formatINR(value)} does not fit — the framework has{" "}
          {formatINR(f.remaining)} left. A slice larger than the cake is
          covered by nothing.
        </p>
      )}
      <input
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        placeholder="What it covers"
        className={inputClass}
      />
      <input
        value={jobId}
        onChange={(e) => setJobId(e.target.value)}
        placeholder="Job reference"
        className={inputClass}
      />
      <input
        type="date"
        value={validUntil}
        onChange={(e) => setValidUntil(e.target.value)}
        className={inputClass}
      />
      <p className="text-xs text-slate-500">
        Leave the end date blank to inherit the framework&apos;s
        {f.effective_valid_until ? ` (${formatDate(f.effective_valid_until)})` : ""}.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button onClick={onClose} className={buttonSecondary}>
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy || !value || overruns}
          className={`${buttonPrimary} disabled:opacity-50`}
        >
          {busy ? "Opening…" : "Open it"}
        </button>
      </div>
    </Modal>
  );
}
