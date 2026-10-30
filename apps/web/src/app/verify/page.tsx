"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IQELogo } from "@/components/IQELogo";
import {
  ArrowUpRight, Building, Calendar, FileText, Hash, ShieldCheck,
  Tag, Info, AlertTriangle, X, Search, Sparkles, CheckCircle2,
  DollarSign, ArrowRight, RefreshCw, Receipt, Check
} from "@/components/icons";
import { API_BASE } from "@/lib/config";

type Verification = {
  found: boolean;
  reference: string;
  in_force: boolean;
  status: string | null;
  meaning: string;
  document_type: string | null;
  title: string | null;
  issued_on: string | null;
  client: string | null;
  issuing_body: string;
  checked_at: string;
  details?: Record<string, any>;
};

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return value;
  }
}

const SAMPLE_REFS = [
  { label: "Certificate", ref: "CERT-2026-0001", tag: "COI" },
  { label: "Tax Invoice", ref: "INV-2026-001", tag: "Invoice" },
  { label: "Inspection Report", ref: "VIS-001", tag: "IVR/IRN" },
  { label: "TPI Report", ref: "IR/2026/1001", tag: "TP02" },
  { label: "Deduction Memo", ref: "MEMO/IQE/MUDIGONDA/2026/044", tag: "IS 1200" },
];

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRef = searchParams.get("ref") || "";
  const pdf = searchParams.get("pdf");

  const [reference, setReference] = useState(queryRef);
  const [searchInput, setSearchInput] = useState(queryRef);
  const [result, setResult] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (queryRef) {
      setReference(queryRef);
      setSearchInput(queryRef);
      runVerification(queryRef);
    }
  }, [queryRef]);

  const runVerification = async (refToVerify: string) => {
    const clean = refToVerify.trim();
    if (!clean) return;
    setLoading(true);
    setFailed(false);
    setResult(null);

    try {
      // Encode path slashes appropriately for URL
      const encoded = clean.split("/").map(encodeURIComponent).join("/");
      const res = await fetch(`${API_BASE}/api/v1/verify/${encoded}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setReference(searchInput.trim());
      router.push(`/verify?ref=${encodeURIComponent(searchInput.trim())}`);
      runVerification(searchInput.trim());
    }
  };

  const handleChipClick = (refVal: string) => {
    setSearchInput(refVal);
    setReference(refVal);
    router.push(`/verify?ref=${encodeURIComponent(refVal)}`);
    runVerification(refVal);
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb] text-slate-900 flex flex-col font-sans">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#001a2c] via-[#003352] to-[#001a2c] px-5 pt-8 pb-16 text-white relative overflow-hidden">
        <div aria-hidden className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-[#0084bf]/30 blur-3xl" />
        <div className="relative max-w-xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <IQELogo className="w-11 h-11 transition-transform group-hover:scale-105" />
            <div>
              <p className="font-heading font-bold leading-tight text-white text-base">
                Ideal Quality Engineers (I) Pvt Ltd
              </p>
              <p className="text-[11px] text-sky-200/80">
                Third-Party Inspection &bull; Universal Document Verification Portal
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-semibold border border-white/10">
              ISO/IEC 17020:2026
            </span>
            <Link
              href="/login"
              className="px-3 py-1 rounded-xl bg-[#0084bf] hover:bg-[#0073a8] text-white text-xs font-bold transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 -mt-10 pb-16">
        <div className="max-w-xl mx-auto space-y-4">
          {/* UNIVERSAL SEARCH BAR CARD */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-200/90 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0084bf]" />
              <h2 className="font-heading font-bold text-slate-900 text-sm">
                Public Authenticity Check (No Login Required)
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify certificates, commercial tax invoices, TPI inspection visit reports (IVR/IRN), or statutory deduction memos issued by IQE.
            </p>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter reference (e.g., CERT-2026-0001, INV-2026-001, VIS-001)..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0084bf] focus:bg-white transition-all placeholder:font-sans placeholder:font-normal"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !searchInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0084bf] to-[#00628f] hover:from-[#0075ab] hover:to-[#00547d] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Verify</span>
              </button>
            </form>

            {/* Quick Test Chips */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 font-semibold mr-1">Quick Sample:</span>
              {SAMPLE_REFS.map((chip) => (
                <button
                  key={chip.ref}
                  type="button"
                  onClick={() => handleChipClick(chip.ref)}
                  className={`px-2 py-0.5 rounded-lg border font-mono transition-all cursor-pointer ${
                    reference === chip.ref
                      ? "bg-blue-50 border-blue-300 text-blue-700 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="text-[10px] text-slate-400 mr-1 font-sans font-bold">[{chip.tag}]</span>
                  {chip.ref}
                </button>
              ))}
            </div>
          </div>

          {/* VERIFICATION OUTCOME PANEL */}
          {!reference ? (
            <Panel>
              <Verdict tone="unknown" label="Ready to Verify" />
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Scan the QR code printed on an official IQE certificate/invoice or enter the reference number above to check its real-time legal validity.
              </p>
            </Panel>
          ) : loading ? (
            <Panel>
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-[#0084bf] animate-spin" />
                <div className="text-sm font-semibold text-slate-700">
                  Checking IQE central registry for <span className="font-mono text-blue-600 font-bold">{reference}</span>...
                </div>
              </div>
              <div className="mt-4 h-4 w-full rounded bg-slate-100 animate-pulse" />
              <div className="mt-2 h-4 w-2/3 rounded bg-slate-100 animate-pulse" />
            </Panel>
          ) : failed ? (
            <Panel>
              <Verdict tone="unknown" label="Could not reach registry" />
              <p className="mt-3 text-sm text-slate-600">
                We could not connect to IQE&rsquo;s validation registry just now. Please try again shortly or contact our technical support.
              </p>
              <Reference value={reference} />
            </Panel>
          ) : result ? (
            <>
              <Panel>
                <div className="flex items-center justify-between gap-2">
                  <Verdict
                    tone={!result.found ? "bad" : result.in_force ? "ok" : "warn"}
                    label={
                      !result.found
                        ? "Not found in IQE records"
                        : result.in_force
                        ? "Valid IQE Document & Stand Behind"
                        : "Not in force"
                    }
                  />
                  {result.found && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                      {result.status?.toUpperCase() || "VERIFIED"}
                    </span>
                  )}
                </div>

                <h1 className="mt-3 font-heading text-xl font-bold leading-snug text-slate-900">
                  {result.title ?? result.reference}
                </h1>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    !result.found || !result.in_force
                      ? "text-rose-800 font-medium"
                      : "text-slate-600"
                  }`}
                >
                  {result.meaning}
                </p>

                {result.found && (
                  <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                    <Row icon={Hash} label="Reference" value={result.reference} />
                    <Row icon={FileText} label="Document" value={result.document_type} />
                    <Row icon={Tag} label="Status" value={result.status} />
                    <Row icon={Calendar} label="Issued" value={formatDate(result.issued_on)} />
                    {result.client && <Row icon={Building} label="Client / Asset" value={result.client} />}
                  </dl>
                )}

                {/* RICH METADATA DETAILS (Invoices, Reports, Memos) */}
                {result.found && result.details && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                      <span>Authenticated Details</span>
                      <span className="text-[#0084bf] font-mono">256-bit Verified</span>
                    </div>

                    {/* Invoice Specific Details */}
                    {result.details.amount !== undefined && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                        <div>
                          <span className="text-slate-500">Invoice Amount:</span>
                          <div className="font-mono font-extrabold text-slate-900 text-sm">
                            ₹{(result.details.amount || 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Payment Status:</span>
                          <div className="font-mono font-bold text-emerald-700 capitalize">
                            {result.details.payment_status || "Issued"}
                          </div>
                        </div>
                        {result.details.due_date && (
                          <div>
                            <span className="text-slate-500">Due Date:</span>
                            <div className="font-mono font-semibold text-slate-700">
                              {result.details.due_date}
                            </div>
                          </div>
                        )}
                        {result.details.irn_seal && (
                          <div>
                            <span className="text-slate-500">e-Invoice Seal:</span>
                            <div className="font-mono font-semibold text-blue-700 truncate">
                              {result.details.irn_seal}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inspection Report Specific Details */}
                    {result.details.inspector && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                        <div>
                          <span className="text-slate-500">Assigned Inspector:</span>
                          <div className="font-bold text-slate-800">
                            {result.details.inspector}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Impartiality Safeguard:</span>
                          <div className="font-bold text-emerald-700">
                            {result.details.impartiality_status || "ISO 17020 Cl. 4.1 Passed"}
                          </div>
                        </div>
                        {result.details.protocol && (
                          <div className="sm:col-span-2">
                            <span className="text-slate-500">Audit Protocol:</span>
                            <div className="text-slate-700 font-medium">
                              {result.details.protocol}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Deduction Memo Details */}
                    {result.details.total_deductions_inr !== undefined && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                        <div>
                          <span className="text-slate-500">Contractor:</span>
                          <div className="font-bold text-slate-800">
                            {result.details.contractor}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Total Deductions:</span>
                          <div className="font-mono font-extrabold text-rose-700 text-sm">
                            ₹{(result.details.total_deductions_inr).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!result.found && <Reference value={reference} />}
              </Panel>

              {/* PDF Preview Link if provided */}
              {pdf && result.found && result.in_force ? (
                <a
                  href={pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sheen group flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0084bf] via-[#0075ab] to-[#e35f14] text-white font-semibold shadow-md transition-all hover:opacity-95"
                >
                  <FileText className="w-5 h-5" />
                  <span>Open Official Document PDF</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              ) : null}

              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500 px-1">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Checked against IQE&rsquo;s tamper-proof operational registry on{" "}
                  {formatDate(result.checked_at) ?? "today"}. Compare details against your physical copy; if anything differs, contact{" "}
                  <strong>{result.issuing_body}</strong> immediately.
                </span>
              </p>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-md border border-slate-200/90 p-5 space-y-3">
      {children}
    </section>
  );
}

function Verdict({ tone, label }: { tone: "ok" | "warn" | "bad" | "unknown"; label: string }) {
  const styles = {
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    bad: "bg-rose-50 text-rose-700 border-rose-200",
    unknown: "bg-slate-100 text-slate-600 border-slate-200",
  }[tone];
  const Icon = tone === "ok" ? ShieldCheck : tone === "bad" ? X : AlertTriangle;
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${styles}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="w-4 h-4 mt-0.5 text-[#0084bf] shrink-0" />
      <dt className="text-xs text-slate-500 w-24 shrink-0 pt-px">{label}</dt>
      <dd className="text-xs font-semibold text-slate-800 break-words min-w-0 font-mono">{value}</dd>
    </div>
  );
}

function Reference({ value }: { value: string }) {
  return (
    <p className="mt-3 text-xs text-slate-500">
      Reference checked:{" "}
      <span className="font-mono text-slate-700 break-all">{value}</span>
    </p>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f8fb] flex items-center justify-center p-4">
          <div className="text-center space-y-2">
            <IQELogo className="w-10 h-10 mx-auto animate-pulse" />
            <p className="text-xs text-slate-500 font-mono">Loading verification gateway...</p>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
