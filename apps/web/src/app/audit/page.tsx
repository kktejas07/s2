"use client";

import { useCallback, useEffect, useState } from "react";
import { History, RefreshCw, Search, X, ArrowRight } from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import {
  Card, EmptyState, PageHeader, SkeletonRows, StatusPill, Tone,
  buttonSecondary, formatINR, humanise, inputClass,
} from "@/components/ui";

/**
 * The audit trail.
 *
 * Read the way an assessor reads it: one record's history in the order it
 * happened, or a search across everything. Entries are append-only, so there
 * is nothing to edit here and no action to offer — the page is deliberately
 * a reading surface.
 */

type Change = { field: string; before?: string | null; after?: string | null };

type Entry = {
  audit_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_user_id?: string | null;
  actor_role_id?: number | null;
  changes: Change[];
  note?: string | null;
  context: Record<string, any>;
  at: string;
};

const ACTION_TONE: Record<string, Tone> = {
  CREATE: "info",
  UPDATE: "idle",
  STATUS_CHANGE: "idle",
  ISSUE: "ok",
  BILL: "ok",
  AUTHORIZE: "ok",
  ASSIGN: "info",
  REVISE: "warn",
  DISPUTE: "bad",
  DELETE: "bad",
  MIGRATE: "warn",
  SEED: "idle",
  LOGIN: "idle",
  EXPORT: "idle",
};

const ENTITY_TYPES = [
  "work_package", "certification", "authorization", "assignment",
  "invoice", "appeal", "equipment",
];

/** The trail stores values as strings, so a rupee figure arrives as
 *  "1494000". Reading a deduction out of that means counting digits, which is
 *  exactly the error a reviewer is there to catch. Money fields are named
 *  consistently in this system, so the name is enough to format by. */
const MONEY_FIELD = /(^|_)(value|amount|rate|total|retention|advance|deduction)s?$/i;

function renderValue(field: string, raw?: string | null): string {
  if (raw === null || raw === undefined || raw === "") return "—";
  if (MONEY_FIELD.test(field)) {
    const n = Number(raw);
    if (Number.isFinite(n)) return formatINR(n);
  }
  return raw;
}

function when(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AuditPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [lookup, setLookup] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.searchAudit({
        entity_type: entityType || undefined,
        action: action || undefined,
        actor_user_id: actor || undefined,
        per_page: 100,
      });
      setEntries(res?.data ?? []);
      setTotal(res?.total ?? 0);
    } catch (e: any) {
      if (e?.response?.status === 403) {
        toast.error("Your role may not search the audit trail. You can still open one record's history.");
      } else {
        toast.error("Could not load the audit trail.");
      }
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, action, actor]);

  useEffect(() => {
    load();
  }, [load]);

  const openRecord = async () => {
    const value = lookup.trim();
    if (!value) return;
    // "certification CERT-2026-0001" or just the identifier.
    const parts = value.split(/\s+/);
    const [type, id] = parts.length > 1 ? parts : [guessType(value), value];
    setLoading(true);
    try {
      const res = await api.getEntityHistory(type, id);
      setEntries(res?.data ?? []);
      setTotal(res?.total ?? 0);
      if (!res?.total) toast.error(`Nothing recorded against ${type} ${id}.`);
    } catch {
      toast.error(`Could not read the history for ${id}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={History}
        title="Audit trail"
        description="Who changed what, and when. Entries are append-only — nothing here can be edited or removed."
        actions={
          <button onClick={load} className={buttonSecondary}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <Card className="p-4">
        <h2 className="font-heading text-sm font-semibold text-slate-900 dark:text-white">
          One record&rsquo;s history
        </h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Everything recorded against a single certification, package or authorization, oldest
          first.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && openRecord()}
            placeholder="CERT-2026-0001"
            className={inputClass + " sm:max-w-xs"}
          />
          <button onClick={openRecord} disabled={!lookup.trim()} className={buttonSecondary}>
            Open history
          </button>
        </div>
      </Card>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className={inputClass + " sm:w-52"}
        >
          <option value="">Any record type</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>{humanise(t)}</option>
          ))}
        </select>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className={inputClass + " sm:w-48"}
        >
          <option value="">Any action</option>
          {Object.keys(ACTION_TONE).map((a) => (
            <option key={a} value={a}>{humanise(a)}</option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="Filter by who did it"
            className={inputClass + " pl-9 pr-9"}
          />
          {actor && (
            <button
              onClick={() => setActor("")}
              aria-label="Clear"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nothing recorded yet"
          description="The trail fills as work moves: packages change state, certifications are issued, authorizations are decided."
        />
      ) : (
        <>
          <p className="text-xs text-slate-400">
            {entries.length} of {total} entries
          </p>
          <ol className="space-y-2">
            {entries.map((e) => (
              <li key={e.audit_id}>
                <Card className="p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={ACTION_TONE[e.action] ?? "idle"}>
                          {humanise(e.action)}
                        </StatusPill>
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {humanise(e.entity_type)}
                        </span>
                        <span className="font-mono text-xs text-slate-400">{e.entity_id}</span>
                      </div>

                      {(e.changes?.length ?? 0) > 0 && (
                        <ul className="mt-2 space-y-1">
                          {e.changes!.map((c) => (
                            <li
                              key={c.field}
                              className="flex flex-wrap items-center gap-1.5 text-xs"
                            >
                              <span className="text-slate-500 dark:text-slate-400">
                                {humanise(c.field)}
                              </span>
                              <span className="text-slate-400 line-through">
                                {renderValue(c.field, c.before)}
                              </span>
                              <ArrowRight className="h-3 w-3 text-slate-300" />
                              <span className="font-medium text-slate-700 dark:text-slate-200">
                                {renderValue(c.field, c.after)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {e.note && (
                        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{e.note}</p>
                      )}

                      {Object.keys(e.context ?? {}).length > 0 && (
                        <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          {Object.entries(e.context).map(([k, v]) => (
                            <div key={k} className="flex gap-1">
                              <dt className="text-slate-400">{humanise(k)}</dt>
                              <dd className="text-slate-600 dark:text-slate-300">
                                {Array.isArray(v) ? v.join(", ") : String(v ?? "—")}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {e.actor_user_id ?? "system"}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">{when(e.at)}</div>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

/** Infer the record type from an identifier prefix, so the common case needs
 *  no typing. Falls back to a certification, which is what people look up. */
function guessType(id: string): string {
  const upper = id.toUpperCase();
  if (upper.startsWith("WP-")) return "work_package";
  if (upper.startsWith("CERT-")) return "certification";
  if (upper.startsWith("ATH-")) return "authorization";
  if (upper.startsWith("ASG-")) return "assignment";
  if (upper.startsWith("INV-")) return "invoice";
  if (upper.startsWith("APL-")) return "appeal";
  if (upper.startsWith("EQP-")) return "equipment";
  return "certification";
}
