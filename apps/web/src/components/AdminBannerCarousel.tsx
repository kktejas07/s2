"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, ShieldCheck, ClipboardList, Award, ArrowRight } from "@/components/icons";
import Link from "next/link";

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  gradient: string;
  accentBg: string;
  ctaText: string;
  ctaLink: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Enterprise Field Quality & Technical Inspection Platform",
    subtitle: "Streamline third-party inspection (TPI), quality control (QC), technician scheduling, and real-time site audit logs.",
    badge: "IQE Inspection Management v2.0",
    icon: ShieldCheck,
    gradient: "from-[#001a2c] via-[#003752] to-[#0084bf]",
    accentBg: "bg-[#e35f14]/20 text-[#ffedd5] border-[#e35f14]/40",
    ctaText: "Schedule Visit",
    ctaLink: "/visits",
  },
  {
    id: 2,
    title: "Service Orders & Control Number Scheduling Engine",
    subtitle: "Automated Job ID umbrellas connecting Clients, Manufacturers, Control Numbers, and Field Engineer Visit Dispatch.",
    badge: "Service Order & Control Hub",
    icon: ClipboardList,
    gradient: "from-[#001a2c] via-[#004b6e] to-[#0075ab]",
    accentBg: "bg-sky-500/20 text-sky-200 border-sky-500/30",
    ctaText: "Manage Service Orders",
    ctaLink: "/service-orders",
  },
  {
    id: 3,
    title: "Automated TPI Billing & Financial Revenue Management",
    subtitle: "Generate consolidated invoices, track vendor expenses, associate daily rates, and perform fast financial approvals.",
    badge: "Financial & Billing Annexure Engine",
    icon: Award,
    gradient: "from-[#001a2c] via-[#70280d] to-[#e35f14]",
    accentBg: "bg-amber-500/20 text-amber-200 border-amber-500/30",
    ctaText: "View Invoices",
    ctaLink: "/invoices",
  },
];

export function AdminBannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const slide = slides[currentSlide];
  const IconComponent = slide.icon;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-slate-800/40 text-white transition-all duration-700"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* Background Gradient & Animated Glow */}
      <div className={`relative min-h-[220px] sm:min-h-[250px] bg-gradient-to-r ${slide.gradient} p-6 sm:p-8 flex flex-col justify-between transition-all duration-700`}>
        {/* Subtle Decorative Grid Lines & Radial Orbs */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${slide.accentBg}`}>
            <IconComponent className="w-3.5 h-3.5" />
            <span>{slide.badge}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-700/50">
              {currentSlide + 1} / {slides.length}
            </span>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-md bg-slate-900/60 text-slate-300 hover:text-white border border-slate-700/50 transition-colors"
              title={isPlaying ? "Pause Slideshow" : "Play Slideshow"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Middle Content */}
        <div className="relative z-10 my-4 space-y-2 max-w-2xl">
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white drop-shadow-sm">
            {slide.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
            {slide.subtitle}
          </p>
        </div>

        {/* Bottom CTA Row & Controls */}
        <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10">
          <Link
            href={slide.ctaLink}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold font-heading hover:bg-slate-100 transition-colors shadow-md hover:shadow-lg"
          >
            <span>{slide.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Indicators & Manual Arrows */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentSlide ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={handlePrev}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
