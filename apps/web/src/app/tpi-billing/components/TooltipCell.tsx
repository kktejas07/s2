"use client";

import { useState } from "react";
import { Eye } from "@/components/icons";

export default function TooltipCell({ text, maxLength = 28, className = "" }: { text: string; maxLength?: number; className?: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isTruncated = text && text.length > maxLength;

  return (
    <div
      className={`relative group inline-block ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="truncate max-w-[210px] cursor-help" title={text}>
        {text}
      </div>
      {showTooltip && isTruncated && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-slate-900 text-white text-[11px] p-3 rounded-2xl shadow-2xl border border-slate-700 leading-relaxed pointer-events-none break-words font-sans">
          <div className="font-extrabold text-sky-400 mb-1 flex items-center gap-1.5 text-xs">
            <Eye className="w-3.5 h-3.5" /> Full Specification Detail
          </div>
          <p className="text-slate-200 font-medium">{text}</p>
        </div>
      )}
    </div>
  );
}
