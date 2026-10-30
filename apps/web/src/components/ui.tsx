"use client";

import { ReactNode } from "react";

/**
 * Shared interface primitives for the execution spine.
 *
 * The organising idea: in inspection work, state is the content. A package is
 * somewhere in its lifecycle, a claim is certified or deducted, a person is
 * authorised or not. So status gets the strongest visual treatment and
 * everything around it stays quiet.
 *
 * The tone vocabulary here is deliberately identical to the one the PDF
 * renderer uses (backend/app/pdf/styles/base.css). A coordinator who reads a
 * certified package on screen and then opens its PDF should see the same
 * green. Keep the two in step if either changes.
 *
 * Colour is never the only carrier of meaning: every pill prints its label,
 * and carries a filled dot for readers who cannot separate the hues.
 */

export type Tone = "ok" | "warn" | "bad" | "info" | "idle";

const TONE_CLASS: Record<Tone, string> = {
  ok: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-400/20",
  warn: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-400/20",
  bad: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-400/20",
  info: "bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-400/20",
  idle: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/20",
};

const TONE_DOT: Record<Tone, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-rose-500",
  info: "bg-[#0084bf]",
  idle: "bg-slate-400",
};

export const TONE_BAR: Record<Tone, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-rose-500",
  info: "bg-[#0084bf]",
  idle: "bg-slate-300 dark:bg-slate-600",
};

/** Work package and certification lifecycle states, mapped once. */
export const LIFECYCLE_TONE: Record<string, Tone> = {
  planned: "idle",
  draft: "idle",
  assigned: "info",
  in_progress: "warn",
  submitted: "warn",
  under_qc: "warn",
  pending: "warn",
  on_hold: "bad",
  disputed: "bad",
  cancelled: "bad",
  overdue: "bad",
  certified: "ok",
  issued: "ok",
  billed: "ok",
  closed: "ok",
  paid: "ok",
  authorized: "ok",
  superseded: "idle",
};

export function toneFor(status?: string | null): Tone {
  if (!status) return "idle";
  return LIFECYCLE_TONE[status.toLowerCase().replace(/\s+/g, "_")] ?? "idle";
}

/** Turns snake_case or SCREAMING_CASE into something a person reads. */
/** Acronyms that must not be title-cased. The PDF renderer has carried this
 *  list since the formats were built; without the same list here the same
 *  value reads "NDT Service" in a generated report and "Ndt Service" on the
 *  screen beside it, which makes the screen look like the careless one. */
const ACRONYMS = new Set([
  "NCR", "BOQ", "RA", "QC", "QA", "SAT", "FAT", "GMP", "URS", "ITP", "UOM",
  "ID", "PO", "NDT", "UT", "RT", "MT", "PT", "HVAC", "IQE", "TPI", "WHO",
  "PMI", "MTC", "NABL", "UKAS", "AQL", "CAPA", "IRN", "IVR", "EVR", "FIR",
  "SOW", "LOI", "QTN", "EPC", "AI", "PDF", "ISO", "IEC", "DPR", "CV",
]);

export function humanise(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function StatusPill({
  status,
  tone,
  children,
  className = "",
}: {
  status?: string | null;
  tone?: Tone;
  children?: ReactNode;
  className?: string;
}) {
  const t = tone ?? toneFor(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLASS[t]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[t]}`} aria-hidden />
      {children ?? humanise(status)}
    </span>
  );
}

/**
 * A job's position rendered as one band.
 *
 * This is the page's strongest element on purpose: it is how a coordinator
 * actually thinks about a job — not "six packages" but "how much of it is
 * finished, how much is stuck". Mirrors the scope bar in the project report
 * PDF so the two read the same.
 */
export function LifecycleBar({
  counts,
  total,
  className = "",
}: {
  counts: Record<string, number>;
  total?: number;
  className?: string;
}) {
  const entries = Object.entries(counts).filter(([, n]) => n > 0);
  const sum = total ?? entries.reduce((acc, [, n]) => acc + n, 0);
  if (!sum) return null;

  return (
    <div className={className}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {entries.map(([status, n]) => (
          <div
            key={status}
            className={TONE_BAR[toneFor(status)]}
            style={{ width: `${(n / sum) * 100}%` }}
            title={`${humanise(status)}: ${n}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {entries.map(([status, n]) => (
          <span key={status} className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className={`h-2 w-2 rounded-sm ${TONE_BAR[toneFor(status)]}`} aria-hidden />
            {humanise(status)}
            <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">{n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon: any;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#0084bf] to-[#00618e] text-white shadow-glow-blue">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          {description && (
            <p className="mt-0.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 self-start">{actions}</div>}
    </header>
  );
}

/**
 * A figure with its label beneath it, not above: the number is what someone
 * came to read, and a label stacked on top makes every panel announce itself
 * before saying anything.
 */
export function Metric({
  value,
  label,
  sub,
  tone,
  size = "md",
}: {
  value: ReactNode;
  label: string;
  sub?: string;
  tone?: Tone;
  size?: "md" | "lg";
}) {
  const colour =
    tone === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "bad"
      ? "text-rose-600 dark:text-rose-400"
      : tone === "warn"
      ? "text-amber-600 dark:text-amber-400"
      : tone === "info"
      ? "text-[#0084bf]"
      : "text-slate-900 dark:text-white";

  return (
    <div className="min-w-[8rem]">
      <div
        className={`font-heading font-bold tabular-nums ${colour} ${
          size === "lg" ? "text-3xl" : "text-xl"
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sub}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: any;
}) {
  return (
    <Tag
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </Tag>
  );
}

/** An empty screen is an invitation to act, so it carries the action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: any;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
      <Icon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
      <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonRows({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40"
        />
      ))}
    </div>
  );
}

/** Secondary action. Focus ring is explicit — keyboard users need to see it. */
export const buttonSecondary =
  "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-xs transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0084bf]/40 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800";

export const buttonPrimary =
  "inline-flex items-center gap-2 rounded-xl bg-[#0084bf] px-4 py-2.5 text-sm font-semibold text-white shadow-glow-blue transition hover:bg-[#00739f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0084bf]/50 disabled:opacity-50";

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0084bf] focus:outline-none focus:ring-2 focus:ring-[#0084bf]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

/** Currency as IQE reads it: rupees, no decimals until they matter. */
export function formatINR(value?: number | null, opts?: { decimals?: boolean }) {
  const n = value ?? 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: opts?.decimals ? 2 : 0,
    maximumFractionDigits: opts?.decimals ? 2 : 0,
  }).format(n);
}
