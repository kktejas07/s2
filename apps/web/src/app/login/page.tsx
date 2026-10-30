"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, User as UserIcon, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck, Building2, HardHat } from "@/components/icons";
import { api } from "@/lib/api";
import { IQELogo } from "@/components/IQELogo";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [errorKey, setErrorKey] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.login(username, password);
      router.push("/dashboard");
    } catch {
      setError("Invalid credentials. Check username or password.");
      setErrorKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  const fillDemo = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError("");
    setLoading(true);
    try {
      await api.login(u, p);
      router.push("/dashboard");
    } catch {
      setError("Invalid credentials. Check username or password.");
      setErrorKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#001a2c] flex items-center justify-center p-4 md:p-8 overflow-hidden">
      {/* Ambient animated brand backdrop */}
      <div aria-hidden className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div aria-hidden className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-[#0084bf]/25 blur-3xl animate-blob" />
      <div aria-hidden className="absolute -bottom-40 -right-24 w-[26rem] h-[26rem] rounded-full bg-[#e35f14]/20 blur-3xl animate-blob [animation-delay:-7s]" />

      <div className="relative max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden border border-[#0084bf]/30 shadow-2xl shadow-black/40 bg-[#002235]/80 backdrop-blur-xl animate-scale-up">
        {/* Left Side: Official IQE Logo Visual Banner */}
        <div className="relative p-8 md:p-10 gradient-iqe-dark flex flex-col justify-between overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0084bf]/20 rounded-full blur-3xl -mr-20 -mt-20 animate-float"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#e35f14]/20 rounded-full blur-2xl -ml-10 -mb-10 animate-float [animation-delay:-3s]"></div>

          <div className="relative stagger">
            <div className="flex items-center gap-3 mb-8">
              <IQELogo className="w-12 h-12 drop-shadow-md animate-float" />
              <div>
                <span className="font-heading text-lg font-extrabold tracking-tight text-white block leading-tight">
                  Ideal Quality Engineers
                </span>
                <span className="text-[11px] text-[#e35f14] font-bold block">
                  (I) Pvt Ltd — Third Party Inspection
                </span>
              </div>
            </div>

            <div className="space-y-4 stagger">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#003752] border border-[#0084bf]/40 text-sky-200 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#e35f14]" />
                <span>AI Inspection Portal</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white font-heading leading-tight">
                Master Technical &amp; <span className="text-gradient-iqe">Quality Engineering</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Streamline TPI inspection workflows, BOQ bill verification, field visit logs, vendor audits, and invoice ledger management in one unified corporate engine.
              </p>
            </div>
          </div>

          <div className="relative mt-8 pt-6 border-t border-slate-800/80 space-y-2 stagger">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>FastAPI & MongoDB Beanie engine</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
              <span>Gemini AI Anomaly & Inspector matching</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center animate-slide-in-right [animation-delay:120ms]">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white font-heading">Sign In</h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your inspector or manager credentials below.
            </p>
          </div>

          {error && (
            <div key={errorKey} role="alert" className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="log-login-name-user-id" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Login Name / User ID
              </label>
              <div className="relative">
                <input id="log-login-name-user-id"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or inspector1"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#001a2c] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 hover:border-slate-600 focus:outline-none focus:border-[#0084bf] focus:ring-4 focus:ring-[#0084bf]/20 transition-all peer"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 transition-colors peer-focus:text-sky-400" />
              </div>
            </div>

            <div>
              <label htmlFor="log-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input id="log-password"
                  type={showPassword ? "text" : "password"}
                  onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#001a2c] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 hover:border-slate-600 focus:outline-none focus:border-[#0084bf] focus:ring-4 focus:ring-[#0084bf]/20 transition-all peer"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 transition-colors peer-focus:text-sky-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {capsLock && (
                <p className="mt-1.5 text-[11px] text-amber-400 font-semibold flex items-center gap-1 animate-fade-down">
                  <AlertCircle className="w-3 h-3" /> Caps Lock is on
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="sheen group w-full py-3 rounded-xl bg-gradient-to-r from-[#0084bf] via-[#0075ab] to-[#e35f14] text-white font-semibold text-xs shadow-lg glow-iqe-blue hover:shadow-glow-orange disabled:opacity-60 transition-all duration-500 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Shortcuts for Admin, Tenant, and User */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-400 mb-2 font-medium">Select Role to Quick Sign In:</p>
            <div className="grid grid-cols-3 gap-2 stagger">
              <button
                type="button"
                onClick={() => fillDemo("admin_system", "admin123")}
                className="px-2.5 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-[11px] text-purple-300 border border-purple-800/50 transition-all duration-300 font-semibold flex flex-col items-center gap-1 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Admin</span>
                </div>
                <span className="text-[11px] text-purple-400 font-normal">Super Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("tenant_client", "tenant123")}
                className="px-2.5 py-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 text-[11px] text-blue-300 border border-blue-800/50 transition-all duration-300 font-semibold flex flex-col items-center gap-1 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tenant</span>
                </div>
                <span className="text-[11px] text-blue-400 font-normal">Client / PM</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("tpi_engineer", "engineer123")}
                className="px-2.5 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-[11px] text-emerald-300 border border-emerald-800/50 transition-all duration-300 font-semibold flex flex-col items-center gap-1 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <HardHat className="w-3.5 h-3.5 text-emerald-400" />
                  <span>User</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-normal">TPI Engineer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
