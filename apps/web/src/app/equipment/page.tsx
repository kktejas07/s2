"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  Ruler, RefreshCw, Search, X, AlertTriangle, Plus, ShieldAlert, History,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatDate } from "@/lib/workPackageLifecycle";
import {
  Card, EmptyState, Metric, PageHeader, SkeletonRows, StatusPill, Tone,
  buttonPrimary, buttonSecondary, humanise, inputClass,
} from "@/components/ui";

/**
 * Equipment register and calibration (ISO/IEC 17020 cl. 6.2).
 *
 * The page leads with what has lapsed, because that is the only thing here
 * with operational urgency: a measurement taken with an out-of-calibration
 * instrument is not defensible, and every hour one stays in service is more
 * work that may have to be revisited.
 */

type Equipment = {
  equipment_id: string;
  asset_tag: string;
  name: string;
  equipment_type?: string | null;
  serial_number?: string | null;
  status: string;
  location?: string | null;
  applicable_work_types: string[];
  calibration_due_on?: string | null;
  calibration_certificate_no?: string | null;
  traceable_to?: string | null;
  quarantine_reason?: string | null;
  calibration?: {
    in_calibration: boolean;
    reason?: string | null;
    days_remaining?: number | null;
    due_on?: string | null;
  };
};

const STATUS_TONE: Record<string, Tone> = {
  IN_SERVICE: "ok",
  OUT_FOR_CALIBRATION: "warn",
  UNDER_REPAIR: "warn",
  QUARANTINED: "bad",
  RETIRED: "idle",
};

/** Calibration standing, as a tone. Separate from status: an instrument can be
 *  in service and out of calibration, which is exactly the dangerous case. */
function calibrationTone(item: Equipment): Tone {
  const c = item.calibration;
  if (!c || !c.due_on) return "idle";
  if (!c.in_calibration) return "bad";
  if ((c.days_remaining ?? 999) <= 30) return "warn";
  return "ok";
}

function calibrationLabel(item: Equipment): string {
  const c = item.calibration;
  if (!c || !c.due_on) return "Never calibrated";
  if (!c.in_calibration) return "Lapsed";
  const days = c.days_remaining ?? 0;
  // Not "in calibration": that reads as "away at the laboratory", which is the
  // opposite of what it means here.
  return days <= 30 ? `Due in ${days}d` : "Calibration valid";
}

export default function EquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [due, setDue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, any[]>>({});
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, dueSoon] = await Promise.all([
        api.getEquipment(statusFilter ? { status: statusFilter } : undefined),
        api.getCalibrationDue(30),
      ]);
      setItems(list?.data ?? []);
      setDue(dueSoon ?? null);
    } catch {
      toast.error("Could not load the equipment register. Check the API connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openHistory = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!history[id]) {
      try {
        const res = await api.getCalibrationHistory(id);
        setHistory((h) => ({ ...h, [id]: res?.data ?? [] }));
      } catch {
        toast.error("Could not load the calibration history.");
      }
    }
  };

  const quarantine = async (item: Equipment) => {
    const reason = window.prompt(
      `Why is ${item.asset_tag} being quarantined? The reason is recorded against it.`,
    );
    if (!reason?.trim()) return;
    try {
      await api.setEquipmentStatus(item.equipment_id, "QUARANTINED", reason.trim());
      toast.success(`${item.asset_tag} quarantined.`);
      load();
    } catch {
      toast.error(`Could not quarantine ${item.asset_tag}.`);
    }
  };

  const visible = items.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.asset_tag.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      (i.equipment_type ?? "").toLowerCase().includes(q) ||
      (i.serial_number ?? "").toLowerCase().includes(q)
    );
  });

  const lapsed = due?.lapsed ?? [];
  const soon = due?.due_within_horizon ?? [];
  const never = due?.never_calibrated ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Ruler}
        title="Equipment"
        description="The instruments inspections are performed with, and whether their calibration still stands."
        actions={
          <>
            <button onClick={() => setAdding(true)} className={buttonPrimary}>
              <Plus className="h-4 w-4" />
              Register equipment
            </button>
            <button onClick={load} className={buttonSecondary}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </>
        }
      />

      {/* Lapsed first: a measurement taken with one of these is not defensible. */}
      {lapsed.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                {lapsed.length} instrument{lapsed.length === 1 ? " is" : "s are"} past calibration
              </p>
              <p className="mt-0.5 text-sm text-rose-800/90 dark:text-rose-300/90">
                {lapsed.length === 1
                  ? "A measurement taken with it cannot be defended. Take it out of service or recalibrate before it is used again."
                  : "A measurement taken with these cannot be defended. Take them out of service or recalibrate before they are used again."}
              </p>
              <ul className="mt-2 space-y-1">
                {lapsed.slice(0, 6).map((l: any) => (
                  <li key={l.equipment_id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono text-xs text-rose-700 dark:text-rose-300">
                      {l.asset_tag}
                    </span>
                    <span className="text-rose-900 dark:text-rose-200">{l.name}</span>
                    <span className="text-xs text-rose-700/80 dark:text-rose-300/80">
                      {l.reason}
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
          <div className="flex flex-wrap gap-8">
            <Metric value={lapsed.length} label="Lapsed" tone={lapsed.length ? "bad" : "ok"} />
            <Metric value={soon.length} label="Due within 30 days" tone={soon.length ? "warn" : "ok"} />
            <Metric value={never.length} label="Never calibrated" tone={never.length ? "warn" : "ok"} />
            <Metric value={items.length} label="Registered instruments" />
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by asset tag, name, type or serial number"
            className={inputClass + " pl-9 pr-9"}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={inputClass + " sm:w-56"}
        >
          <option value="">Any status</option>
          {Object.keys(STATUS_TONE).map((s) => (
            <option key={s} value={s}>
              {humanise(s)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <SkeletonRows rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title={items.length === 0 ? "No equipment registered" : "Nothing matches that search"}
          description={
            items.length === 0
              ? "Register the instruments inspections are performed with. Each one needs an asset tag, because that is what an inspector writes on the report."
              : "Try a different tag, name or serial number."
          }
          action={
            items.length === 0 ? (
              <button onClick={() => setAdding(true)} className={buttonPrimary}>
                Register the first instrument
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2.5">
          {visible.map((item) => {
            const open = expanded === item.equipment_id;
            return (
              <Card key={item.equipment_id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                        {item.asset_tag}
                      </span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{item.name}</span>
                      <StatusPill tone={STATUS_TONE[item.status] ?? "idle"}>
                        {humanise(item.status)}
                      </StatusPill>
                      <StatusPill tone={calibrationTone(item)}>{calibrationLabel(item)}</StatusPill>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.equipment_type && <span>{item.equipment_type}</span>}
                      {item.serial_number && <span>Serial {item.serial_number}</span>}
                      {item.location && <span>{item.location}</span>}
                      {item.calibration?.due_on && (
                        <span>Due {formatDate(item.calibration.due_on)}</span>
                      )}
                      {item.traceable_to && <span>Traceable to {item.traceable_to}</span>}
                    </div>
                    {item.quarantine_reason && item.status === "QUARANTINED" && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-rose-700 dark:text-rose-300">
                        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {item.quarantine_reason}
                      </p>
                    )}
                    {(item.applicable_work_types?.length ?? 0) > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.applicable_work_types!.map((w) => (
                          <span
                            key={w}
                            className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => openHistory(item.equipment_id)}
                      className={buttonSecondary + " !px-2.5 !py-1.5 text-xs"}
                    >
                      <History className="h-3.5 w-3.5" />
                      Calibration
                    </button>
                    {item.status !== "QUARANTINED" && (
                      <button
                        onClick={() => quarantine(item)}
                        className="rounded-xl border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                      >
                        Quarantine
                      </button>
                    )}
                  </div>
                </div>

                {open && (
                  <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    {!history[item.equipment_id] ? (
                      <p className="text-sm text-slate-400">Loading…</p>
                    ) : history[item.equipment_id].length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No calibration recorded yet. Until one is, this instrument should not be
                        used for measurement.
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-slate-400">
                            <th className="pb-1 font-medium">Calibrated</th>
                            <th className="pb-1 font-medium">Due</th>
                            <th className="pb-1 font-medium">Result</th>
                            <th className="pb-1 font-medium">Certificate</th>
                            <th className="pb-1 font-medium">By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {history[item.equipment_id].map((r: any) => (
                            <Fragment key={r.record_id}>
                              <tr>
                                <td className="py-1.5">{formatDate(r.calibrated_on)}</td>
                                <td className="py-1.5">{formatDate(r.due_on)}</td>
                                <td className="py-1.5">
                                  {/* An adjustment is not a clean pass: the instrument
                                      had drifted and was corrected at the laboratory. */}
                                  <StatusPill
                                    tone={
                                      r.result === "FAIL"
                                        ? "bad"
                                        : r.result === "PASS_WITH_ADJUSTMENT"
                                        ? "warn"
                                        : "ok"
                                    }
                                  >
                                    {humanise(r.result)}
                                  </StatusPill>
                                </td>
                                <td className="py-1.5 font-mono text-xs text-slate-500">
                                  {r.certificate_no || "—"}
                                </td>
                                <td className="py-1.5 text-slate-600 dark:text-slate-400">
                                  {r.calibrated_by || "—"}
                                </td>
                              </tr>
                              {(r.deviation_found || r.impact_assessment) && (
                                <tr>
                                  <td colSpan={5} className="pb-2 text-xs">
                                    {r.deviation_found && (
                                      <p className="text-amber-700 dark:text-amber-400">
                                        {r.deviation_found}
                                      </p>
                                    )}
                                    {/* What a FAIL means for work already done is the
                                        reason this register exists. */}
                                    {r.impact_assessment && (
                                      <p className="mt-0.5 text-rose-700 dark:text-rose-300">
                                        {r.impact_assessment}
                                      </p>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {adding && <RegisterDialog onClose={() => setAdding(false)} onSaved={load} />}
    </div>
  );
}

function RegisterDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    asset_tag: "",
    name: "",
    equipment_type: "",
    manufacturer: "",
    model: "",
    serial_number: "",
    location: "",
    calibration_interval_months: "12",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    if (!form.asset_tag.trim() || !form.name.trim()) {
      toast.error("An asset tag and a name are both required.");
      return;
    }
    setSaving(true);
    try {
      await api.registerEquipment({
        ...form,
        calibration_interval_months: Number(form.calibration_interval_months) || 12,
      });
      toast.success(`${form.asset_tag} registered.`);
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Could not register the instrument.");
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
              Register equipment
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              The asset tag is what an inspector writes on the report, so it has to match what is
              stamped on the instrument.
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

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Asset tag" required>
            <input value={form.asset_tag} onChange={set("asset_tag")} className={inputClass} placeholder="UT-001" />
          </Field>
          <Field label="Name" required>
            <input value={form.name} onChange={set("name")} className={inputClass} placeholder="UT thickness gauge" />
          </Field>
          <Field label="Type">
            <input value={form.equipment_type} onChange={set("equipment_type")} className={inputClass} />
          </Field>
          <Field label="Serial number">
            <input value={form.serial_number} onChange={set("serial_number")} className={inputClass} />
          </Field>
          <Field label="Manufacturer">
            <input value={form.manufacturer} onChange={set("manufacturer")} className={inputClass} />
          </Field>
          <Field label="Model">
            <input value={form.model} onChange={set("model")} className={inputClass} />
          </Field>
          <Field label="Location">
            <input value={form.location} onChange={set("location")} className={inputClass} />
          </Field>
          <Field label="Calibration interval (months)">
            <input
              type="number"
              value={form.calibration_interval_months}
              onChange={set("calibration_interval_months")}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className={buttonSecondary}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} className={buttonPrimary}>
            {saving ? "Registering…" : "Register"}
          </button>
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}
