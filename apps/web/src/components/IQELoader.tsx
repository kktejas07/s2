"use client";

import React from "react";
import { IQELogo } from "./IQELogo";

export function IQELoader({ message = "Loading Ideal Quality Engine..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full p-8 space-y-6 animate-fade-in">
      <div className="relative flex items-center justify-center" role="status" aria-live="polite">
        {/* Outer Pulsing Glow */}
        <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-[#0084bf] via-[#00618e] to-[#e35f14] blur-2xl opacity-50 animate-pulse" />

        {/* Rotating Spinner Rings (counter-rotating for depth) */}
        <div className="w-28 h-28 rounded-full border-4 border-slate-200/80 dark:border-slate-800 border-t-[#0084bf] border-r-[#00618e] border-b-[#e35f14] animate-spin" />
        <div className="absolute w-[8.5rem] h-[8.5rem] rounded-full border border-dashed border-[#0084bf]/30 animate-[spin-slow_12s_linear_infinite_reverse]" />

        {/* Orbiting accent dot */}
        <div className="absolute w-[8.5rem] h-[8.5rem] animate-spin-slow">
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#e35f14] shadow-glow-orange" />
        </div>

        {/* Center Larger IQE Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <IQELogo className="w-16 h-16 drop-shadow-md animate-float" />
        </div>
      </div>

      <div className="text-center space-y-1.5 max-w-sm">
        <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-200 font-heading tracking-tight">
          Ideal Quality Engineers (I) Pvt Ltd
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center gap-1">
          <span>{message}</span>
          <span className="inline-flex gap-0.5" aria-hidden>
            <span className="w-1 h-1 rounded-full bg-[#0084bf] animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 rounded-full bg-[#0084bf] animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 rounded-full bg-[#e35f14] animate-bounce" />
          </span>
        </p>
        <span className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#003366] dark:text-sky-300 border border-blue-200 dark:border-blue-800 text-[11px] font-mono font-extrabold mt-1">
          Third Party Inspection Services
        </span>
      </div>
    </div>
  );
}

