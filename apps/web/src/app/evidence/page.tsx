"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera, RefreshCw, Upload, ShieldCheck, AlertTriangle, CheckCircle2,
  Sparkles, ListChecks,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";
import { formatDate } from "@/lib/workPackageLifecycle";
import {
  Card, EmptyState, PageHeader, SkeletonRows, StatusPill, Tone,
  buttonPrimary, buttonSecondary, humanise, inputClass,
} from "@/components/ui";

/**
 * Evidence and assists for one work package.
 *
 * These two belong together: both answer "is this package ready to hand over".
 * The completeness check tells you what is missing; the evidence panel is
 * where you fix it. Keeping them on one screen means an inspector does not
 * have to hold the list of gaps in their head while navigating elsewhere.
 */

type Evidence = {
  evidence_id: string;
  kind: string;
  filename: string;
  caption?: string | null;
  content_type: string;
  size_bytes: number;
  sha256: string;
  status: string;
  withdrawn_reason?: string | null;
  captured_at?: string | null;
  created_at: string;
};

const KIND_TONE: Record<string, Tone> = {
  PHOTO: "info",
  DOCUMENT: "idle",
  MEASUREMENT: "info",
  SIGNATURE: "ok",
  VIDEO: "idle",
  OTHER: "idle",
};

export default function EvidencePage() {
  const [packageId, setPackageId] = useState("");
  const [active, setActive] = useState("");
  const [items, setItems] = useState<Evidence[]>([]);
  const [includeWithdrawn, setIncludeWithdrawn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [checklist, setChecklist] = useState<any>(null);
  const [available, setAvailable] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const [ev, avail] = await Promise.all([
        api.getEvidence("work_package", id, includeWithdrawn),
        api.getAssistsAvailable(id).catch(() => null),
      ]);
      setItems(ev?.data ?? []);
      setAvailable(avail);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || `Could not load ${id}.`);
      setItems([]);
      setAvailable(null);
    } finally {
      setLoading(false);
    }
  }, [includeWithdrawn]);

  useEffect(() => {
    if (active) load(active);
  }, [active, load]);

  const open = () => {
    const id = packageId.trim();
    if (!id) return;
    setValidation(null);
    setAnomalies(null);
    setChecklist(null);
    setActive(id);
  };

  const upload = async (file: File) => {
    const caption = window.prompt(`Caption for ${file.name}?`) ?? "";
    setBusy("upload");
    try {
      await api.attachEvidence("work_package", active, file, { caption, kind: guessKind(file) });
      toast.success(`${file.name} attached.`);
      load(active);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || `Could not attach ${file.name}.`);
    } finally {
      setBusy(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const verify = async (item: Evidence) => {
    try {
      const res = await api.verifyEvidence(item.evidence_id);
      if (res.intact) {
        toast.success(`${item.filename} is unchanged since it was captured.`);
      } else {
        toast.error(
          `${item.filename} does not match what was captured — ${res.reason ?? "the file has changed"}.`,
        );
      }
    } catch {
      toast.error("Could not verify that file.");
    }
  };

  const withdraw = async (item: Evidence) => {
    const reason = window.prompt(
      `Why is ${item.filename} being withdrawn? It stays in the record with this reason.`,
    );
    if (!reason?.trim()) return;
    try {
      await api.withdrawEvidence(item.evidence_id, reason.trim());
      toast.success(`${item.filename} withdrawn.`);
      load(active);
    } catch {
      toast.error("Could not withdraw that file.");
    }
  };

  const runAssist = async (which: "validate" | "anomalies" | "checklist") => {
    setBusy(which);
    try {
      if (which === "validate") setValidation(await api.runValidation(active));
      if (which === "anomalies") setAnomalies(await api.runAnomalyScan(active));
      if (which === "checklist") setChecklist(await api.generateChecklist(active));
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "That assist is not available for this work type.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Camera}
        title="Evidence & checks"
        description="The photographs and certificates behind a work package, and the checks that say whether it is ready to hand over."
        actions={
          active ? (
            <button onClick={() => load(active)} className={buttonSecondary}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          ) : undefined
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-sm font-semibold text-slate-900 dark:text-white">
              Open a work package
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Evidence attaches to the package it was captured for.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && open()}
              placeholder="WP-2026-0001"
              className={inputClass + " sm:w-48"}
            />
            <button onClick={open} disabled={!packageId.trim()} className={buttonPrimary}>
              Open
            </button>
          </div>
        </div>
      </Card>

      {!active ? (
        <EmptyState
          icon={Camera}
          title="No work package open"
          description="Enter a package reference to see its evidence and run the completeness checks against it."
        />
      ) : (
        <>
          {/* Checks first: they tell you what the evidence panel needs to fix. */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-sm font-semibold text-slate-900 dark:text-white">
                  Checks
                </h2>
                {available && (
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {available.work_type_code} permits{" "}
                    {available.declared?.length
                      ? available.declared.map(humanise).join(", ")
                      : "no assists"}
                    {available.needs_a_model?.length > 0 &&
                      ` — ${available.needs_a_model.map(humanise).join(", ")} ${
                        available.needs_a_model.length === 1 ? "needs" : "need"
                      } a language model, which is ${
                        available.model_configured ? "configured" : "not configured"
                      }.`}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => runAssist("validate")}
                  disabled={busy === "validate"}
                  className={buttonSecondary}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {busy === "validate" ? "Checking…" : "Completeness"}
                </button>
                <button
                  onClick={() => runAssist("anomalies")}
                  disabled={busy === "anomalies"}
                  className={buttonSecondary}
                >
                  <Sparkles className="h-4 w-4" />
                  {busy === "anomalies" ? "Scanning…" : "Outliers"}
                </button>
                <button
                  onClick={() => runAssist("checklist")}
                  disabled={busy === "checklist"}
                  className={buttonSecondary}
                >
                  <ListChecks className="h-4 w-4" />
                  {busy === "checklist" ? "Building…" : "Checklist"}
                </button>
              </div>
            </div>

            {validation && (
              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Completeness
                </h3>
                <div className="flex items-center gap-2">
                  <StatusPill tone={validation.ready_to_submit ? "ok" : "bad"}>
                    {validation.ready_to_submit ? "Ready to submit" : "Not ready"}
                  </StatusPill>
                  <span className="text-xs text-slate-400">
                    checked against {validation.work_type_code}
                  </span>
                </div>
                {validation.blocking?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {validation.blocking.map((b: string) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                {validation.advisory?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {validation.advisory.map((a: string) => (
                      <li key={a} className="text-sm text-amber-700 dark:text-amber-400">
                        {a}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {anomalies && (
              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Outliers
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {anomalies.findings?.length
                    ? `${anomalies.findings.length} line${anomalies.findings.length === 1 ? "" : "s"} worth a second look across ${anomalies.lines_examined} examined.`
                    : anomalies.note || `Nothing unusual across ${anomalies.lines_examined ?? 0} certified lines.`}
                </p>
                {anomalies.findings?.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {anomalies.findings.map((f: any, i: number) => (
                      <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
                        <StatusPill tone="warn">{humanise(f.kind)}</StatusPill>
                        <span className="font-mono text-xs text-slate-500">{f.item}</span>
                        <span className="text-slate-600 dark:text-slate-400">{f.explanation}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {checklist && (
              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Suggested checklist
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{checklist.note}</p>
                <ol className="mt-2 space-y-1">
                  {checklist.points?.map((p: any) => (
                    <li key={p.item_id} className="flex flex-wrap items-baseline gap-2 text-sm">
                      <span className="font-mono text-xs text-slate-400">{p.item_id}</span>
                      <span className="text-slate-700 dark:text-slate-300">{p.verification_point}</span>
                      <span className="text-xs text-slate-400">{p.discipline}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={includeWithdrawn}
                onChange={(e) => setIncludeWithdrawn(e.target.checked)}
                className="rounded border-slate-300 text-[#0084bf] focus:ring-[#0084bf]/30"
              />
              Show withdrawn evidence
            </label>
            <>
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
              <button
                onClick={() => fileInput.current?.click()}
                disabled={busy === "upload"}
                className={buttonPrimary}
              >
                <Upload className="h-4 w-4" />
                {busy === "upload" ? "Attaching…" : "Attach evidence"}
              </button>
            </>
          </div>

          {loading ? (
            <SkeletonRows rows={3} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Camera}
              title="No evidence attached"
              description="Photographs, material certificates and measurement sheets attach here and travel with the report."
            />
          ) : (
            <div className="grid gap-2.5 md:grid-cols-2">
              {items.map((item) => {
                const withdrawn = item.status === "WITHDRAWN";
                return (
                  <Card key={item.evidence_id} className={`p-4 ${withdrawn ? "opacity-70" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill tone={KIND_TONE[item.kind] ?? "idle"}>
                            {humanise(item.kind)}
                          </StatusPill>
                          {withdrawn && <StatusPill tone="bad">Withdrawn</StatusPill>}
                        </div>
                        <p className="mt-1.5 truncate text-sm font-medium text-slate-900 dark:text-white">
                          {item.filename}
                        </p>
                        {item.caption && (
                          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                            {item.caption}
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>{fileSize(item.size_bytes)}</span>
                          <span>{formatDate(item.created_at)}</span>
                          <span className="font-mono" title={item.sha256}>
                            {item.sha256.slice(0, 12)}…
                          </span>
                        </div>
                        {withdrawn && item.withdrawn_reason && (
                          <p className="mt-1.5 text-xs text-rose-700 dark:text-rose-300">
                            {item.withdrawn_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <a
                        href={api.evidenceFileUrl(item.evidence_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[#0084bf] hover:underline"
                      >
                        Open file
                      </a>
                      <button
                        onClick={() => verify(item)}
                        className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-[#0084bf] hover:underline dark:text-slate-400"
                        title="Re-hash the stored file and compare"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verify
                      </button>
                      {!withdrawn && (
                        <button
                          onClick={() => withdraw(item)}
                          className="ml-auto font-medium text-rose-600 hover:underline dark:text-rose-400"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** A photograph off a phone is megabytes; a readings file is kilobytes.
 *  One unit for both makes the big ones unreadable. */
function fileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function guessKind(file: File): string {
  if (file.type.startsWith("image/")) return "PHOTO";
  if (file.type.startsWith("video/")) return "VIDEO";
  if (file.type === "text/csv") return "MEASUREMENT";
  return "DOCUMENT";
}
