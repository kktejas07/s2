"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Receipt, RefreshCw, Plus, X, AlertTriangle, Calculator, CheckCircle2,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatDate } from "@/lib/workPackageLifecycle";
import {
  Card, EmptyState, Metric, PageHeader, SkeletonRows, StatusPill, Tone,
  buttonPrimary, buttonSecondary, formatINR, inputClass,
} from "@/components/ui";

/**
 * Rate cards, and the floor below which work is not worth doing.
 *
 * Three things that were being conflated, kept visibly apart here:
 *
 *   standard   what IQE publishes — the house card
 *   client     what a client negotiated — their own card, with its own expiry
 *   floor      what the work costs to deliver plus the margin required
 *
 * The floor sits with the work type rather than the client, because a client
 * who negotiates hard does not change what a man-day costs to deploy; they
 * change whether the work should be taken. That separation is what makes the
 * pre-sales check possible at all — BELOW_RATE_FLOOR used to be a reason code
 * someone ticked against nothing.
 */

const STATUS_TONE: Record<string, Tone> = {
  ACTIVE: "ok", DRAFT: "warn", SUPERSEDED: "idle", EXPIRED: "idle",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "In force", DRAFT: "Draft",
  SUPERSEDED: "Superseded", EXPIRED: "Expired",
};

const RATE_BASES = [
  "MAN_DAY", "PER_VISIT", "HOURLY", "PER_UNIT", "LUMP_SUM",
  "PCT_CERTIFIED_VALUE", "RETAINER",
];

function basisLabel(b: string) {
  return b.replace(/_/g, " ").toLowerCase();
}

/** Not every rate is money. A percentage of certified value formatted as
 *  rupees reads as a two-rupee job, which is how 1.5% renders once currency
 *  formatting has rounded it. */
const PERCENTAGE_BASES = new Set(["PCT_CERTIFIED_VALUE"]);

function rateLabel(rate: number, basis: string) {
  return PERCENTAGE_BASES.has(basis) ? `${rate}%` : formatINR(rate);
}

export default function RatesPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"cards" | "floors">("cards");
  const [adding, setAdding] = useState(false);
  const [settingFloor, setSettingFloor] = useState(false);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, f, e] = await Promise.all([
        api.listRateCards(),
        api.listRateFloors().catch(() => null),
        api.expiringRateCards(45).catch(() => null),
      ]);
      setCards(c?.data ?? []);
      setFloors(f?.data ?? []);
      setExpiring(e);
    } catch {
      toast.error("Could not load the rates");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activate = async (cardId: string) => {
    try {
      const out = await api.activateRateCard(cardId);
      toast.success(
        out.superseded?.length
          ? `${cardId} in force, superseding ${out.superseded.join(", ")}`
          : `${cardId} is in force`,
      );
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not activate it");
    }
  };

  const active = cards.filter((c) => c.status === "ACTIVE");
  const lapsed = expiring?.lapsed ?? [];
  const closing = expiring?.expiring ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={Receipt}
        title="Rate Cards & Floors"
        description="What the work is sold at, and the floor below which it is not worth doing"
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={load} className={buttonSecondary}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={() => setChecking(true)} className={buttonSecondary}>
              <Calculator className="w-4 h-4" /> Check a rate
            </button>
            <button
              onClick={() => (tab === "cards" ? setAdding(true) : setSettingFloor(true))}
              className={buttonPrimary}
            >
              <Plus className="w-4 h-4" />
              {tab === "cards" ? "New card" : "Set a floor"}
            </button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <Metric value={active.length} label="Cards in force" />
          <Metric
            value={floors.length}
            label="Work types with a floor"
            sub={floors.length ? undefined : "Nothing can be checked yet"}
            tone={floors.length ? undefined : "warn"}
          />
          <Metric
            value={closing.length}
            label="Expiring in 45 days"
            tone={closing.length ? "warn" : undefined}
          />
          <Metric
            value={lapsed.length}
            label="Lapsed"
            sub="Still pricing work at old rates"
            tone={lapsed.length ? "bad" : "ok"}
          />
        </div>
      </Card>

      {(lapsed.length > 0 || closing.length > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-900">
            A card expires on its own cycle, not with the order it prices — so
            an order can be perfectly valid while the rates under it are a year
            old.{" "}
            {lapsed.length > 0 &&
              `${lapsed.length} ${
                lapsed.length === 1 ? "card has" : "cards have"
              } already lapsed.`}
          </p>
        </div>
      )}

      {floors.length === 0 && !loading && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Calculator className="w-5 h-5 text-slate-500 shrink-0" />
          <p className="text-sm text-slate-600">
            No floors are set, so no proposed rate can be checked against
            anything. Until one exists, BELOW_RATE_FLOOR on the pre-sales
            scorecard is a note rather than a control.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTab("cards")}
          className={tab === "cards" ? buttonPrimary : buttonSecondary}
        >
          Cards
        </button>
        <button
          onClick={() => setTab("floors")}
          className={tab === "floors" ? buttonPrimary : buttonSecondary}
        >
          Floors
        </button>
      </div>

      {loading ? (
        <SkeletonRows rows={4} />
      ) : tab === "cards" ? (
        cards.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No rate cards"
            description="A card with no client is the house standard. A client card overrides it for that client only."
          />
        ) : (
          <div className="space-y-3">
            {cards.map((c) => (
              <CardRow key={c.card_id} card={c} onActivate={activate} />
            ))}
          </div>
        )
      ) : floors.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="No floors set"
          description="A floor is direct cost plus overhead recovery plus the margin required. It belongs to the work type, not to any client."
        />
      ) : (
        <div className="space-y-3">
          {floors.map((f) => (
            <FloorRow key={f.floor_id} floor={f} />
          ))}
        </div>
      )}

      {adding && (
        <CardForm
          onClose={() => setAdding(false)}
          onDone={() => {
            setAdding(false);
            load();
          }}
        />
      )}
      {settingFloor && (
        <FloorForm
          onClose={() => setSettingFloor(false)}
          onDone={() => {
            setSettingFloor(false);
            load();
          }}
        />
      )}
      {checking && <CheckForm onClose={() => setChecking(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------- rows */

function CardRow({
  card: c,
  onActivate,
}: {
  card: any;
  onActivate: (id: string) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 lg:flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-500">{c.card_id}</span>
            <StatusPill tone={STATUS_TONE[c.status] ?? "idle"}>
              {STATUS_LABEL[c.status] ?? c.status}
            </StatusPill>
            {!c.client_id && <StatusPill tone="info">House standard</StatusPill>}
            {c.version > 1 && (
              <span className="text-xs text-slate-500">v{c.version}</span>
            )}
          </div>
          <h3 className="mt-1.5 font-semibold text-slate-900 break-words">
            {c.name}
          </h3>
          <p className="text-sm text-slate-500 break-words">
            {c.client_name ?? "Applies to any client with no card of their own"}
          </p>
          <p className="mt-1.5 text-sm text-slate-500">
            {c.line_count} {c.line_count === 1 ? "line" : "lines"} ·{" "}
            {formatDate(c.valid_from)} to{" "}
            {c.valid_until ? formatDate(c.valid_until) : "until superseded"}
            {c.escalation_percent
              ? ` · ${c.escalation_percent}% escalation`
              : ""}
          </p>

          {c.lines?.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {c.lines.slice(0, 4).map((l: any, i: number) => (
                <div
                  key={i}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm"
                >
                  <span className="text-slate-700 min-w-0 break-words">
                    {l.work_type_code}
                    {l.discipline ? ` · ${l.discipline}` : ""}
                    <span className="text-slate-400">
                      {" "}
                      per {basisLabel(l.rate_basis)}
                    </span>
                  </span>
                  <span className="tabular-nums text-slate-900 font-medium">
                    {rateLabel(l.rate, l.rate_basis)}
                  </span>
                </div>
              ))}
              {c.lines.length > 4 && (
                <p className="text-xs text-slate-400">
                  and {c.lines.length - 4} more
                </p>
              )}
            </div>
          )}
        </div>

        {c.status === "DRAFT" && (
          <button
            onClick={() => onActivate(c.card_id)}
            className={`${buttonPrimary} shrink-0`}
          >
            Put in force
          </button>
        )}
      </div>
    </Card>
  );
}

function FloorRow({ floor: f }: { floor: any }) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 break-words">
            {f.work_type_code}
            {f.discipline ? ` · ${f.discipline}` : ""}
          </p>
          <p className="text-sm text-slate-500">
            {formatINR(f.direct_cost)} direct + {f.overhead_percent}% overhead +{" "}
            {f.target_margin_percent}% margin, per {basisLabel(f.rate_basis)}
          </p>
          {f.note && (
            <p className="mt-1 text-sm text-slate-500 break-words">{f.note}</p>
          )}
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="font-heading text-xl font-bold tabular-nums text-slate-900">
            {rateLabel(f.floor_rate, f.rate_basis)}
          </p>
          <p className="text-xs text-slate-500">floor</p>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ forms */

function CardForm({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [escalation, setEscalation] = useState("");
  const [lines, setLines] = useState([
    { work_type_code: "", discipline: "", rate_basis: "MAN_DAY", rate: "", uom: "" },
  ]);
  const [busy, setBusy] = useState(false);

  const update = (i: number, patch: any) =>
    setLines(lines.map((l, n) => (n === i ? { ...l, ...patch } : l)));

  const submit = async () => {
    setBusy(true);
    try {
      const out = await api.createRateCard({
        name,
        client_id: clientId || null,
        client_name: clientName || null,
        valid_from: new Date().toISOString(),
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        escalation_percent: escalation ? Number(escalation) : null,
        lines: lines
          .filter((l) => l.work_type_code && l.rate)
          .map((l) => ({
            work_type_code: l.work_type_code,
            discipline: l.discipline || null,
            rate_basis: l.rate_basis,
            rate: Number(l.rate),
            uom: l.uom || null,
          })),
      });
      toast.success(`${out.card_id} saved as a draft`);
      onDone();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not save the card");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="New rate card" onClose={onClose}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Card name, e.g. 2026 standard rates *"
        className={inputClass}
      />
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Client reference (blank = house card)"
          className={inputClass}
        />
        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Client name"
          className={inputClass}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
          className={inputClass}
        />
        <input
          type="number"
          value={escalation}
          onChange={(e) => setEscalation(e.target.value)}
          placeholder="Annual escalation %"
          className={inputClass}
        />
      </div>
      <p className="text-xs text-slate-500">
        Leave the end date blank for a card that runs until it is superseded.
      </p>

      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <input
                value={l.work_type_code}
                onChange={(e) => update(i, { work_type_code: e.target.value })}
                placeholder="Work type *"
                className={`${inputClass} flex-1 min-w-[8rem]`}
              />
              <input
                value={l.discipline}
                onChange={(e) => update(i, { discipline: e.target.value })}
                placeholder="Discipline"
                className={`${inputClass} flex-1 min-w-[8rem]`}
              />
              {lines.length > 1 && (
                <button
                  onClick={() => setLines(lines.filter((_, n) => n !== i))}
                  className="p-2 text-slate-400 hover:text-red-600"
                  aria-label="Remove line"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={l.rate_basis}
                onChange={(e) => update(i, { rate_basis: e.target.value })}
                className={`${inputClass} flex-1 min-w-[8rem]`}
              >
                {RATE_BASES.map((b) => (
                  <option key={b} value={b}>
                    per {basisLabel(b)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={l.rate}
                onChange={(e) => update(i, { rate: e.target.value })}
                placeholder="Rate *"
                className={`${inputClass} flex-1 min-w-[6rem]`}
              />
            </div>
          </div>
        ))}
        <button
          onClick={() =>
            setLines([
              ...lines,
              { work_type_code: "", discipline: "", rate_basis: "MAN_DAY", rate: "", uom: "" },
            ])
          }
          className={buttonSecondary}
        >
          <Plus className="w-4 h-4" /> Add a line
        </button>
      </div>

      <p className="text-xs text-slate-500">
        A line naming a discipline beats one that does not — ultrasonic
        testing and visual inspection are both inspection and are not the same
        price.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button onClick={onClose} className={buttonSecondary}>
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy || !name.trim()}
          className={`${buttonPrimary} disabled:opacity-50`}
        >
          {busy ? "Saving…" : "Save as draft"}
        </button>
      </div>
    </Modal>
  );
}

function FloorForm({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [workType, setWorkType] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [basis, setBasis] = useState("MAN_DAY");
  const [direct, setDirect] = useState("");
  const [overhead, setOverhead] = useState("25");
  const [margin, setMargin] = useState("20");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const preview =
    direct && Number(direct) > 0
      ? Number(direct) *
        (1 + Number(overhead || 0) / 100) *
        (1 + Number(margin || 0) / 100)
      : null;

  const submit = async () => {
    setBusy(true);
    try {
      const out = await api.setRateFloor({
        work_type_code: workType,
        discipline: discipline || null,
        rate_basis: basis,
        direct_cost: Number(direct),
        overhead_percent: Number(overhead || 0),
        target_margin_percent: Number(margin || 0),
        note: note || null,
      });
      toast.success(`Floor set at ${formatINR(out.floor_rate)}`);
      onDone();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not set the floor");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Set a floor" onClose={onClose}>
      <p className="text-sm text-slate-600">
        What the work costs to deliver plus the margin required. It belongs to
        the work type, not to a client — someone who negotiates hard does not
        change what a man-day costs to deploy.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
          placeholder="Work type *"
          className={inputClass}
        />
        <input
          value={discipline}
          onChange={(e) => setDiscipline(e.target.value)}
          placeholder="Discipline"
          className={inputClass}
        />
      </div>
      <select
        value={basis}
        onChange={(e) => setBasis(e.target.value)}
        className={inputClass}
      >
        {RATE_BASES.map((b) => (
          <option key={b} value={b}>
            per {basisLabel(b)}
          </option>
        ))}
      </select>
      <div className="grid sm:grid-cols-3 gap-2">
        <input
          type="number"
          value={direct}
          onChange={(e) => setDirect(e.target.value)}
          placeholder="Direct cost *"
          className={inputClass}
        />
        <input
          type="number"
          value={overhead}
          onChange={(e) => setOverhead(e.target.value)}
          placeholder="Overhead %"
          className={inputClass}
        />
        <input
          type="number"
          value={margin}
          onChange={(e) => setMargin(e.target.value)}
          placeholder="Margin %"
          className={inputClass}
        />
      </div>
      {preview !== null && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          Floor:{" "}
          <span className="font-semibold">{rateLabel(preview, basis)}</span> per{" "}
          {basisLabel(basis)}
        </p>
      )}
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note"
        className={inputClass}
      />
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button onClick={onClose} className={buttonSecondary}>
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy || !workType.trim() || !direct}
          className={`${buttonPrimary} disabled:opacity-50`}
        >
          {busy ? "Saving…" : "Set the floor"}
        </button>
      </div>
    </Modal>
  );
}

function CheckForm({ onClose }: { onClose: () => void }) {
  const [workType, setWorkType] = useState("");
  const [clientId, setClientId] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [rate, setRate] = useState("");
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const out = await api.checkRate({
        work_type_code: workType,
        rate: Number(rate),
        client_id: clientId || undefined,
        discipline: discipline || undefined,
      });
      setResult(out);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Could not check it");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Check a proposed rate" onClose={onClose}>
      <p className="text-sm text-slate-600">
        The pre-sales check. A rate below the floor does not cover its own cost
        and the margin required.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
          placeholder="Work type *"
          className={inputClass}
        />
        <input
          type="number"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder="Proposed rate *"
          className={inputClass}
        />
        <input
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Client reference"
          className={inputClass}
        />
        <input
          value={discipline}
          onChange={(e) => setDiscipline(e.target.value)}
          placeholder="Discipline"
          className={inputClass}
        />
      </div>

      {result && (
        <div
          className={`rounded-lg border p-3 space-y-2 ${
            !result.checkable
              ? "border-slate-200 bg-slate-50"
              : result.acceptable
              ? "border-emerald-200 bg-emerald-50"
              : "border-rose-200 bg-rose-50"
          }`}
        >
          <div className="flex items-center gap-2">
            {!result.checkable ? (
              <AlertTriangle className="w-4 h-4 text-slate-500" />
            ) : result.acceptable ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-medium text-slate-900">
              {!result.checkable
                ? "Nothing to check against"
                : result.acceptable
                ? "Clears the floor"
                : "Below the floor"}
            </span>
            {result.reason_code && (
              <StatusPill tone="bad">{result.reason_code}</StatusPill>
            )}
          </div>
          <p className="text-sm text-slate-700">{result.note}</p>
          {result.resolved?.floor != null && (
            <p className="text-sm text-slate-600">
              Floor {formatINR(result.resolved.floor)}
              {result.resolved.margin_percent != null &&
                ` · margin over direct cost ${result.resolved.margin_percent}%`}
              {result.resolved.discount_from_standard_percent != null &&
                ` · ${result.resolved.discount_from_standard_percent}% below standard`}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button onClick={onClose} className={buttonSecondary}>
          Close
        </button>
        <button
          onClick={run}
          disabled={busy || !workType.trim() || !rate}
          className={`${buttonPrimary} disabled:opacity-50`}
        >
          {busy ? "Checking…" : "Check it"}
        </button>
      </div>
    </Modal>
  );
}

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
      <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl">
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
