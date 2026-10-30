import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle2, Cpu, FileCheck, Search, ShieldCheck } from "@/components/icons";
import { IQELogo } from "@/components/IQELogo";

const features = [
  {
    icon: Cpu,
    iconClass: "text-sky-400 bg-sky-500/10 border-sky-500/30",
    title: "AI Inspector Match",
    body: "Smart competency scoring and assignment optimization.",
  },
  {
    icon: FileCheck,
    iconClass: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    title: "Automated QC & Finance",
    body: "End-to-end report approval, expense check, and invoicing.",
  },
  {
    icon: CheckCircle2,
    iconClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    title: "Real-Time Anomaly Flag",
    body: "Instant detection of inspection anomalies & compliance gaps.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#001a2c] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient animated brand backdrop */}
      <div aria-hidden className="absolute inset-0 bg-grid opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)]" />
      <div aria-hidden className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-[#0084bf]/30 rounded-full blur-3xl animate-blob" />
      <div aria-hidden className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-[#e35f14]/20 rounded-full blur-3xl animate-blob [animation-delay:-7s]" />

      <div className="max-w-3xl w-full text-center relative z-10 space-y-8 stagger">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#003752]/80 border border-[#0084bf]/40 text-sky-200 text-xs font-semibold glow-iqe-blue backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-[#e35f14] animate-pulse" />
          <span>Next-Gen Quality &amp; Inspection Engine</span>
        </div>

        <div className="flex items-center justify-center gap-4">
          <IQELogo className="w-16 h-16 md:w-20 md:h-20 drop-shadow-2xl animate-float" />
          <h1 className="text-4xl md:text-6xl font-extrabold font-heading tracking-tight text-gradient-iqe">
            IQEApp
          </h1>
        </div>

        <p className="text-lg md:text-xl text-slate-300/90 font-light max-w-xl mx-auto leading-relaxed">
          Ideal Quality Engineers enterprise platform for smart inspection scheduling, automated QC checks, finance approvals, and AI inspector matching.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left stagger">
          {features.map(({ icon: Icon, iconClass, title, body }) => (
            <div
              key={title}
              className="group p-5 rounded-2xl bg-[#002235]/60 border border-slate-700/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#0084bf]/50 hover:bg-[#002a42]/80 hover:shadow-glow-blue"
            >
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-6 ${iconClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* PUBLIC UNIVERSAL VERIFICATION GATEWAY */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#00283f]/90 to-[#001f31]/90 border border-[#0084bf]/40 shadow-2xl backdrop-blur-xl space-y-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#0084bf]/20 text-sky-400 border border-[#0084bf]/30">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-white font-heading">
                  Public Document Verification Gateway
                </h2>
                <p className="text-xs text-slate-300">
                  Verify any Certificate, Tax Invoice, or Inspection Report without logging in.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold self-start sm:self-auto">
              ISO/IEC 17020 &bull; 256-Bit Cryptographic Trust
            </span>
          </div>

          <form action="/verify" method="GET" className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="ref"
                required
                placeholder="Enter Reference (e.g., CERT-2026-0001, INV-2026-001, VIS-001)..."
                className="w-full pl-10 pr-3 py-3 bg-white/10 border border-slate-600 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0084bf] focus:bg-white/15 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0084bf] to-[#006a9b] hover:from-[#0075ab] hover:to-[#005c87] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Verify Document</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-test chips */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Try sample reference:</span>
            <Link
              href="/verify?ref=CERT-2026-0001"
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-sky-300 font-mono text-[11px] font-bold transition-colors"
            >
              [Cert] CERT-2026-0001
            </Link>
            <Link
              href="/verify?ref=INV-2026-001"
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-emerald-300 font-mono text-[11px] font-bold transition-colors"
            >
              [Invoice] INV-2026-001
            </Link>
            <Link
              href="/verify?ref=VIS-001"
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-purple-300 font-mono text-[11px] font-bold transition-colors"
            >
              [Report] VIS-001
            </Link>
            <Link
              href="/verify?ref=MEMO/IQE/MUDIGONDA/2026/044"
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-amber-300 font-mono text-[11px] font-bold transition-colors"
            >
              [Memo] MEMO/IQE/...
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="sheen group w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0084bf] via-[#0075ab] to-[#e35f14] text-white font-semibold shadow-lg glow-iqe-blue hover:shadow-glow-orange transition-all duration-500 flex items-center justify-center gap-2"
          >
            <span>Sign In to Portal</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold border border-slate-700 hover:border-slate-500 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>Direct Dashboard</span>
          </Link>
          <Link
            href="/verify"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-sky-300 hover:text-white font-semibold border border-sky-600/40 hover:border-sky-400 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Open Universal Verify Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
