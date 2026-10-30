"use client";

import React, { useState } from "react";

export function IQELogo({ className = "w-10 h-10" }: { className?: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative flex items-center justify-center shrink-0 bg-white/95 rounded-xl p-1 shadow-sm border border-slate-200/50 ${className}`}>
      {!imgError ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src="/iqe-logo.png"
          alt="Ideal Quality Engineers (I) Pvt Ltd Logo"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain"
        />
      ) : (
        /* Native SVG fallback matching the official IQE Globe Emblem */
        <svg viewBox="0 0 100 100" className="w-full h-full object-contain">
          {/* Orange top accent */}
          <path d="M 30 15 L 45 5 L 48 20 Z" fill="#e35f14" />
          {/* Main Blue Q Loop */}
          <path
            d="M 50 10 C 25 10 10 25 10 50 C 10 75 25 90 50 90 C 65 90 75 82 82 72 L 95 85 L 85 92 L 68 78 C 62 82 56 84 50 84 C 30 84 18 70 18 50 C 18 30 30 16 50 16 C 70 16 82 30 82 50 C 82 56 80 62 76 68 L 88 78 C 94 69 98 59 98 50 C 98 25 75 10 50 10 Z"
            fill="#0084bf"
          />
          {/* Globe Center Sphere */}
          <circle cx="50" cy="48" r="24" fill="#ffffff" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Globe Latitude Lines */}
          <ellipse cx="50" cy="48" rx="24" ry="10" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
          <ellipse cx="50" cy="48" rx="24" ry="18" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Globe Longitude Lines */}
          <ellipse cx="50" cy="48" rx="10" ry="24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="50" y1="24" x2="50" y2="72" stroke="#94a3b8" strokeWidth="2" />
          <line x1="26" y1="48" x2="74" y2="48" stroke="#94a3b8" strokeWidth="2" />
        </svg>
      )}
    </div>
  );
}
