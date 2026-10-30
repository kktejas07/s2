"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Gauge, RefreshCw, AlertTriangle, ChevronRight, ShieldCheck, Receipt,
  UserCheck, ClipboardList, Briefcase,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { StatusPill } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/workPackageLifecycle";

type Role =
  | "coordinator" | "inspection_officer" | "qc_reviewer"
  | "finance" | "technical_manager" | "management";

const ROLE_LABEL: Record<Role, string> = {
  coordinator: "Coordinator",
  inspection_officer: "Inspection officer",
  qc_reviewer: "QC reviewer",
  finance: "Finance",
  technical_manager: "Technical manager",
  management: "Management",
};

const ROLE_QUESTION: Record<Role, string> = {
  coordinator: "What still needs someone on it?",
  inspection_officer: "What am I doing this week?",
  qc_reviewer: "What is waiting on my review?",
  finance: "What can I invoice, and what is late?",
  technical_manager: "Who is authorized, and what lapses soon?",
  management: "Where does the business stand?",
};

const ROLE_ICON: Record<Role, any> = {
  coordinator: ClipboardList,
  inspection_officer: UserCheck,
  qc_reviewer: ShieldCheck,
  finance: Receipt,
  technical_manager: ShieldCheck,
  management: Briefcase,
};

const STORAGE_KEY = "iqe.console.role";

export default function ConsolePage() {
  const [role, setRole] = useState<Role>("coordinator");
  const [personId, setPersonId] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Remember the role per browser; it is a convenience, not shared state.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Role | null;
      if (saved && saved in ROLE_LABEL) setRole(saved);
    } catch {
      /* private mode or blocked storage — the default role is fine */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.getRoleDashboard(role, personId || undefined));
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (role === "inspection_officer" && detail?.includes("person_id")) {
        setData({ needsPerson: true });
      } else {
        toast.error(detail ?? "Could not load the dashboard.");
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [role, personId]);

  useEffect(() => {
    load();
  }, [load]);

  function pick(r: Role) {
    setRole(r);
    try {
      localStorage.setItem(STORAGE_KEY, r);
    } catch {
      /* storage unavailable — the choice just will not persist */
    }
  }

  const h = data?.headline ?? {};

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#0084bf] to-[#00618e] text-white shadow-glow-blue">
            <Gauge className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Console
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {ROLE_QUESTION[role]}
            </p>
          </div>
        </div>

        <button
          onClick={load}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {/* Role switch */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => {
          const Icon = ROLE_ICON[r];
          const on = role === r;
          return (
            <button
              key={r}
              onClick={() => pick(r)}
              aria-pressed={on}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                on
                  ? "border-[#0084bf] bg-[#0084bf] text-white"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {ROLE_LABEL[r]}
            </button>
          );
        })}
      </div>

      {role === "inspection_officer" && (
        <input
          value={personId}
          onChange={(e) => setPersonId(e.target.value)}
          placeholder="Your employee id, e.g. EMP-00007"
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0084bf] focus:outline-none focus:ring-2 focus:ring-[#0084bf]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        />
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : data?.needsPerson ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <UserCheck className="mx-auto h-7 w-7 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            This view is per person.
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Enter an employee id above to see that officer&rsquo;s week.
          </p>
        </div>
      ) : !data ? null : (
        <>
          {/* Headline numbers — named by what they mean, not by table */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(h).map(([key, value]) => (
              <Tile key={key} name={key} value={value as any} />
            ))}
          </div>

          {role === "coordinator" && <CoordinatorBody d={data} />}
          {role === "inspection_officer" && <OfficerBody d={data} />}
          {role === "qc_reviewer" && <QCBody d={data} />}
          {role === "finance" && <FinanceBody d={data} />}
          {role === "technical_manager" && <TechManagerBody d={data} />}
          {role === "management" && <ManagementBody d={data} />}
        </>
      )}
    </div>
  );
}

/** Keys that are money, so they format as currency rather than a bare count. */
const MONEY_KEYS = new Set([
  "certified_not_billed_value", "outstanding_value", "overdue_value",
  "retention_held", "certified_value",
]);
const PCT_KEYS = new Set(["deduction_pct", "utilisation_pct"]);

/** Counts that mean something is wrong, so they are drawn in a warning tone. */
const ALERT_KEYS = new Set([
  "past_planned_finish", "waiting_over_48h", "overdue_value",
  "certifications_disputed", "unverified_legacy_grants",
  "work_types_with_no_authorized_person", "credentials_lapsing_90_days",
]);

const EMPHASIS_KEYS = new Set(["certified_not_billed_value"]);

function humanise(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\bpct\b/, "%")
    .replace(/\bvalue\b/, "")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function Tile({ name, value }: { name: string; value: number | string }) {
  const numeric = typeof value === "number" ? value : 0;
  const alert = ALERT_KEYS.has(name) && numeric > 0;
  const emphasis = EMPHASIS_KEYS.has(name) && numeric > 0;

  let shown: string;
  if (MONEY_KEYS.has(name)) shown = formatCurrency(numeric);
  else if (PCT_KEYS.has(name)) shown = `${numeric}%`;
  else shown = String(value ?? "—");

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        emphasis
          ? "border-iqeOrange-200 bg-iqeOrange-50/60 dark:border-iqeOrange-900/50 dark:bg-iqeOrange-950/25"
          : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      <div className="text-xs text-slate-400">{humanise(name)}</div>
      <div
        className={`mt-1 font-heading text-2xl font-bold tabular-nums ${
          emphasis
            ? "text-[#e35f14]"
            : alert
            ? "text-rose-600 dark:text-rose-400"
            : "text-slate-900 dark:text-white"
        }`}
      >
        {shown}
      </div>
    </div>
  );
}

function Panel({
  title, action, children,
}: {
  title: string; action?: { href: string; label: string }; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#0084bf] hover:underline"
          >
            {action.label}
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-sm text-slate-400">{children}</p>;
}

function Row({
  left, sub, right, tone, id, status, tags,
}: {
  left: string; sub?: string; right?: string; tone?: "alert";
  id?: string; status?: string; tags?: string[];
}) {
  return (
    <li className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800">
      <div className="min-w-0">
        <div className="truncate text-sm text-slate-800 dark:text-slate-200">{left}</div>
        {/* The identifier and the state are two different facts, so they get
            two different treatments rather than being joined into one string. */}
        {(id || status || sub) && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {id && <span className="font-mono text-xs text-slate-400">{id}</span>}
            {status && <StatusPill status={status} />}
            {sub && <span className="truncate text-xs text-slate-400">{sub}</span>}
          </div>
        )}
        {tags && tags.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {tags.map((t) => (
              <li
                key={t}
                className="rounded-md bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-400/20"
              >
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
      {right && (
        <span
          className={`shrink-0 text-sm tabular-nums ${
            tone === "alert" ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-300"
          }`}
        >
          {right}
        </span>
      )}
    </li>
  );
}

function CoordinatorBody({ d }: { d: any }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title="Needs an officer" action={{ href: "/assignments", label: "Assign" }}>
        {d.needs_an_officer?.length ? (
          <ul>
            {d.needs_an_officer.map((w: any) => (
              <Row
                key={w.work_package_id}
                left={w.title}
                id={w.work_package_id}
                sub={w.location ?? w.job_id}
                right={w.planned_start ? formatDate(w.planned_start) : undefined}
              />
            ))}
          </ul>
        ) : (
          <Empty>Everything has someone on it.</Empty>
        )}
      </Panel>

      <Panel title="Running past planned finish">
        {d.running_late?.length ? (
          <ul>
            {d.running_late.map((w: any) => (
              <Row
                key={w.work_package_id}
                left={w.title}
                id={w.work_package_id}
                status={w.status}
                right={formatDate(w.planned_finish)}
                tone="alert"
              />
            ))}
          </ul>
        ) : (
          <Empty>Nothing has slipped past its finish date.</Empty>
        )}
      </Panel>

      {d.awaiting_client?.length > 0 && (
        <Panel title="Waiting on client approval">
          <ul>
            {d.awaiting_client.map((a: any) => (
              <Row
                key={a.assignment_id}
                left={a.person_name ?? a.assignment_id}
                sub={a.work_package_id}
                right={`${a.days_waiting}d`}
                tone={a.days_waiting > 5 ? "alert" : undefined}
              />
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function OfficerBody({ d }: { d: any }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {!d.deployable && (
        <div className="lg:col-span-2 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/30">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
          <p className="text-sm text-rose-900 dark:text-rose-200">
            You cannot be assigned work right now: {d.deployability_reason ?? "not authorized"}.
          </p>
        </div>
      )}

      <Panel title="This week" action={{ href: "/work-packages", label: "All work" }}>
        {d.this_week?.length ? (
          <ul>
            {d.this_week.map((a: any) => (
              <Row
                key={a.assignment_id}
                left={a.title ?? a.work_package_id}
                id={a.work_package_id}
                status={a.status}
                right={a.planned_from ? formatDate(a.planned_from) : undefined}
              />
            ))}
          </ul>
        ) : (
          <Empty>Nothing scheduled in the next seven days.</Empty>
        )}
      </Panel>

      <Panel title="Your credentials">
        {d.credentials_lapsing?.length ? (
          <ul>
            {d.credentials_lapsing.map((c: any, i: number) => (
              <Row
                key={i}
                left={c.name}
                sub={`expires ${formatDate(c.expires_on)}`}
                right={`${c.days_remaining}d`}
                tone={c.days_remaining < 30 ? "alert" : undefined}
              />
            ))}
          </ul>
        ) : (
          <Empty>Nothing lapsing in the next 90 days.</Empty>
        )}
      </Panel>
    </div>
  );
}

function QCBody({ d }: { d: any }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title="Review queue, oldest first" action={{ href: "/work-packages", label: "Open" }}>
        {d.review_queue?.length ? (
          <ul>
            {d.review_queue.map((w: any) => (
              <Row
                key={w.work_package_id}
                left={w.title}
                id={w.work_package_id}
                status={w.status}
                right={`${w.waiting_hours}h`}
                tone={w.waiting_hours > 48 ? "alert" : undefined}
              />
            ))}
          </ul>
        ) : (
          <Empty>Nothing is waiting for review.</Empty>
        )}
      </Panel>

      <Panel title="Disputed certifications" action={{ href: "/certifications", label: "Open" }}>
        {d.disputed?.length ? (
          <ul>
            {d.disputed.map((c: any) => (
              <Row
                key={c.certification_id}
                left={c.dispute_note ?? "Disputed"}
                id={c.certification_id}
                sub={c.work_package_id}
                right={formatCurrency(c.certified_value)}
                tone="alert"
              />
            ))}
          </ul>
        ) : (
          <Empty>No certifications are in dispute.</Empty>
        )}
      </Panel>
    </div>
  );
}

function FinanceBody({ d }: { d: any }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title="Ready to invoice" action={{ href: "/billing", label: "Raise invoices" }}>
        {d.ready_to_invoice?.length ? (
          <ul>
            {d.ready_to_invoice.map((c: any) => (
              <Row
                key={c.certification_id}
                left={c.certification_id}
                id={c.job_id}
                sub={`Certified ${formatDate(c.certified_at)}`}
                right={formatCurrency(c.net_payable_value)}
              />
            ))}
          </ul>
        ) : (
          <Empty>Everything certified has been invoiced.</Empty>
        )}
      </Panel>

      <Panel title="Overdue invoices">
        {d.overdue_invoices?.length ? (
          <ul>
            {d.overdue_invoices.map((i: any) => (
              <Row
                key={i.invoice_id}
                left={i.invoice_id}
                id={i.job_id}
                status="overdue"
                sub={`Due ${formatDate(i.due_date)}, ${i.days_late} days ago`}
                right={formatCurrency(i.grand_total)}
                tone="alert"
              />
            ))}
          </ul>
        ) : (
          <Empty>Nothing is past due.</Empty>
        )}
      </Panel>
    </div>
  );
}

function TechManagerBody({ d }: { d: any }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title="Awaiting your decision" action={{ href: "/people", label: "People" }}>
        {d.awaiting_decision?.length ? (
          <ul>
            {d.awaiting_decision.map((a: any) => (
              <Row
                key={a.authorization_id}
                left={a.person_id}
                sub={`Supervised inspections: ${a.supervised}`}
                tags={
                  [
                    a.qualification_verified ? null : "Qualifications unverified",
                    a.training_completed ? null : "Training outstanding",
                    a.witnessed_assessment_passed ? null : "Assessment not passed",
                  ].filter(Boolean) as string[]
                }
              />
            ))}
          </ul>
        ) : (
          <Empty>No authorizations are waiting.</Empty>
        )}
      </Panel>

      <Panel title="Lapsing within 60 days">
        {d.expiring?.length ? (
          <ul>
            {d.expiring.map((e: any) => (
              <Row
                key={e.authorization_id}
                left={e.person_id}
                sub={e.inspection_types?.join(", ") || "Authorization"}
                right={`${e.days_remaining}d`}
                tone={e.days_remaining < 30 ? "alert" : undefined}
              />
            ))}
          </ul>
        ) : (
          <Empty>Nothing lapses in the next 60 days.</Empty>
        )}
      </Panel>

      {d.coverage_gaps?.length > 0 && (
        <Panel title="Work types nobody is authorized for" action={{ href: "/work-types", label: "Work types" }}>
          <ul>
            {d.coverage_gaps.map((g: any) => (
              <Row
                key={g.work_type_code}
                left={g.name}
                sub={`needs ${g.requires.join(", ")}`}
                tone="alert"
                right="no cover"
              />
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function ManagementBody({ d }: { d: any }) {
  const byType: Record<string, number> = d.certified_value_by_work_type ?? {};
  const top = Math.max(1, ...Object.values(byType));

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title="Certified value by work type">
        {Object.keys(byType).length ? (
          <ul className="space-y-2.5">
            {Object.entries(byType).map(([code, value]) => (
              <li key={code}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{code}</span>
                  <span className="text-sm tabular-nums text-slate-800 dark:text-slate-200">
                    {formatCurrency(value)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-[#0084bf]"
                    style={{ width: `${Math.round((value / top) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nothing has been certified yet.</Empty>
        )}
      </Panel>

      <Panel title="Work by stage" action={{ href: "/work-packages", label: "Open" }}>
        {Object.keys(d.packages_by_status ?? {}).length ? (
          <ul>
            {Object.entries(d.packages_by_status).map(([status, count]) => (
              <Row key={status} left={status.replace(/_/g, " ")} right={String(count)} />
            ))}
          </ul>
        ) : (
          <Empty>No work packages yet.</Empty>
        )}
      </Panel>
    </div>
  );
}
