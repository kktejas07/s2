/**
 * Mirrors ALLOWED_TRANSITIONS in backend/modules/work_packages/models.py.
 *
 * The UI only offers moves the API will accept, so an invalid transition is
 * never presented rather than being offered and then rejected with a 409.
 * If the backend map changes, change this with it.
 */

export type WorkPackageStatus =
  | "planned" | "assigned" | "in_progress" | "submitted" | "under_qc"
  | "certified" | "billed" | "closed" | "on_hold" | "cancelled";

export const ALLOWED_TRANSITIONS: Record<WorkPackageStatus, WorkPackageStatus[]> = {
  planned:     ["assigned", "on_hold", "cancelled"],
  assigned:    ["in_progress", "planned", "on_hold", "cancelled"],
  in_progress: ["submitted", "on_hold", "cancelled"],
  submitted:   ["under_qc", "in_progress"],
  under_qc:    ["certified", "in_progress"],
  certified:   ["billed", "under_qc"],
  billed:      ["closed", "certified"],
  closed:      [],
  on_hold:     ["planned", "assigned", "in_progress", "cancelled"],
  cancelled:   [],
};

/** The happy path, in order. on_hold and cancelled sit outside it. */
export const LIFECYCLE: WorkPackageStatus[] = [
  "planned", "assigned", "in_progress", "submitted",
  "under_qc", "certified", "billed", "closed",
];

export const ASIDE_STATES: WorkPackageStatus[] = ["on_hold", "cancelled"];

export const STATUS_LABEL: Record<WorkPackageStatus, string> = {
  planned: "Planned",
  assigned: "Assigned",
  in_progress: "In progress",
  submitted: "Submitted",
  under_qc: "Under QC",
  certified: "Certified",
  billed: "Billed",
  closed: "Closed",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

/** What each stage is waiting for — shown so the rail explains itself. */
export const STATUS_MEANING: Record<WorkPackageStatus, string> = {
  planned: "Needs an inspection officer",
  assigned: "Officer assigned, not started",
  in_progress: "Work underway on site",
  submitted: "Awaiting quality review",
  under_qc: "Quality review in progress",
  certified: "Quantities certified, ready to bill",
  billed: "Invoice raised",
  closed: "Complete",
  on_hold: "Paused",
  cancelled: "Dropped",
};

/**
 * Tone per stage. Certified is the one stage drawn in orange: a package sitting
 * there is verified revenue that has not been invoiced, which is the number the
 * business most needs to see.
 */
export const STATUS_TONE: Record<WorkPackageStatus, string> = {
  planned:     "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  assigned:    "bg-iqe-50 text-iqe-800 ring-iqe-200 dark:bg-iqe-950/60 dark:text-iqe-200 dark:ring-iqe-800/60",
  in_progress: "bg-iqe-100 text-iqe-900 ring-iqe-300 dark:bg-iqe-900/60 dark:text-iqe-100 dark:ring-iqe-700",
  submitted:   "bg-indigo-50 text-indigo-800 ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-200 dark:ring-indigo-800/60",
  under_qc:    "bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950/60 dark:text-violet-200 dark:ring-violet-800/60",
  certified:   "bg-iqeOrange-50 text-iqeOrange-800 ring-iqeOrange-300 dark:bg-iqeOrange-950/60 dark:text-iqeOrange-200 dark:ring-iqeOrange-800/60",
  billed:      "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800/60",
  closed:      "bg-slate-200 text-slate-600 ring-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
  on_hold:     "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-800/60",
  cancelled:   "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:ring-rose-800/60",
};

export const RATE_BASIS_LABEL: Record<string, string> = {
  HOURLY: "Per hour",
  MAN_DAY: "Per man-day",
  PER_VISIT: "Per visit",
  PER_UNIT: "Per unit measured",
  LUMP_SUM: "Lump sum",
  PCT_CERTIFIED_VALUE: "% of certified value",
  RETAINER: "Monthly retainer",
};

export function nextStates(current: string): WorkPackageStatus[] {
  return ALLOWED_TRANSITIONS[current as WorkPackageStatus] ?? [];
}

export function formatCurrency(value: number, currency = "INR") {
  if (!value) return "—";
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
