"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Search,
  Filter,
  Eye,
  Sliders,
  Sparkles,
  ChevronRight,
  BookOpen,
  FileText,
  Wrench,
  AlertTriangle,
  HardHat,
  Ruler,
  Layers,
  ArrowRight,
  X,
} from "@/components/icons";

interface WorkInstruction {
  id: string;
  code: string;
  discipline: "Civil" | "Piping" | "Electrical" | "HVAC" | "NDT" | "Mechanical";
  title: string;
  rev: string;
  toolsRequired: string[];
  safetyPPE: string[];
  keyChecks: string[];
  acceptanceCriteria: string;
}

const WORK_INSTRUCTIONS: WorkInstruction[] = [
  {
    id: "wi-civ-01",
    code: "WI-CIV-01",
    discipline: "Civil",
    title: "Concealed Reinforced Concrete & Rebar Inspection",
    rev: "Rev 2.1",
    toolsRequired: ["Digital Vernier Caliper", "Cover Meter", "Laser Distance Meter", "Crack Width Gauge"],
    safetyPPE: ["Safety Helmet (EN 397)", "Steel-Toe Boots (S3)", "Reflective Vest", "Safety Glasses"],
    keyChecks: [
      "Verify rebar grade, diameter, spacing, and lap length per approved BBS & structural drawings.",
      "Check minimum clear concrete cover using calibrated non-metallic cover blocks.",
      "Inspect shuttering line, level, plumbness, and formwork release agent application.",
      "Ensure complete de-watering, silt removal, and tie wire ends bent inward."
    ],
    acceptanceCriteria: "Tolerances per IS 456 / ACI 318: Rebar spacing ±10mm, Cover tolerance +10mm/-3mm, Plumbness within 1:500."
  },
  {
    id: "wi-pip-02",
    code: "WI-PIP-02",
    discipline: "Piping",
    title: "Piping Hydrostatic & Pneumatic Pressure Testing",
    rev: "Rev 3.0",
    toolsRequired: ["2x Calibrated Pressure Gauges (1.5x - 4x test pressure)", "Dead Weight Tester", "Calibrated Temp Recorder"],
    safetyPPE: ["Blast Shield Protection", "Full Face Visor", "High-Pressure Handling Gloves"],
    keyChecks: [
      "Isolate sensitive instruments, safety valves, and expansion joints with blind flanges.",
      "Ensure lowest point fill and highest point venting to prevent trapped air pockets.",
      "Step pressurization at 30%, 60%, 100%, and holding at test pressure for 2 hours.",
      "Verify zero pressure drop and absence of weeping, sweating, or deformation."
    ],
    acceptanceCriteria: "Test pressure at 1.5x design pressure per ASME B31.3. Zero leakage and pressure stability over minimum 2 hours hold."
  },
  {
    id: "wi-ele-03",
    code: "WI-ELE-03",
    discipline: "Electrical",
    title: "HT/LT Switchgear & Transformer Pre-Commissioning",
    rev: "Rev 2.0",
    toolsRequired: ["5kV Digital Megger (Insulation Tester)", "Micro-Ohmmeter (Contact Resistance)", "Phase Rotation Meter"],
    safetyPPE: ["Dielectric Safety Gloves (Class 4 - 36kV)", "Arc Flash Suit (40 cal/cm²)", "Earthing Discharge Rod"],
    keyChecks: [
      "Perform Insulation Resistance (IR) test (Phase-Phase & Phase-Earth) before and after HV test.",
      "Verify torque marking on all busbar bolted joints per DIN 43673 torque matrix.",
      "Test interlock mechanism (mechanical & electrical trip logic between incomer and bus-coupler).",
      "Confirm dual dedicated copper earthing with measured earth resistance < 1.0 Ohm."
    ],
    acceptanceCriteria: "IR value > 1000 Mega-Ohms at 20°C per IEEE 43. Contact resistance < 50 micro-ohms per breaker pole."
  },
  {
    id: "wi-hva-04",
    code: "WI-HVA-04",
    discipline: "HVAC",
    title: "Cleanroom HEPA Filter Integrity & Velocity Testing",
    rev: "Rev 1.2 (Sch M)",
    toolsRequired: ["PAO Aerosol Photometer (ATI-2i)", "Laskin Nozzle Aerosol Generator", "Digital Anemometer (Hot-wire)"],
    safetyPPE: ["Cleanroom Sterile Coverall", "N95 / FFP2 Particulate Mask", "Antistatic Safety Booties"],
    keyChecks: [
      "Generate 20-80 µg/L PAO challenge aerosol upstream of terminal HEPA filters.",
      "Scan entire filter face, perimeter gaskets, and frame joint at traverse rate < 5 cm/sec with probe 2.5cm away.",
      "Measure air face velocity at 5 grid points per terminal filter to verify 0.45 m/s (90 FPM) ±20%.",
      "Calculate cleanroom Air Changes per Hour (ACPH) against Schedule M Grade classification."
    ],
    acceptanceCriteria: "Maximum allowable downstream penetration < 0.01% of upstream challenge concentration per ISO 14644-3."
  },
  {
    id: "wi-ndt-05",
    code: "WI-NDT-05",
    discipline: "NDT",
    title: "Ultrasonic (UT) & Radiographic (RT) Weld Inspection",
    rev: "Rev 4.0",
    toolsRequired: ["Digital Ultrasonic Flaw Detector", "Calibration Blocks (IIW V1 & V2)", "Dual Crystal Angle Probes"],
    safetyPPE: ["Radiation Dosimeter / TLD Badge (for RT)", "Leather Welding Gloves", "Hard Hat"],
    keyChecks: [
      "Verify weld joint surface finish (free from spatter, rust, and surface irregularities to Ra 6.3µm).",
      "Perform DAC (Distance Amplitude Curve) calibration with approved reference block.",
      "Scan heat affected zone (HAZ) and weld body with longitudinal and shear wave probes.",
      "Record echo amplitude, flaw depth, and length for any indication exceeding reference level."
    ],
    acceptanceCriteria: "Evaluation per ASME Section VIII Div 1 Appendix 12 / API 1104: Zero cracks, lack of fusion, or incomplete penetration."
  },
  {
    id: "wi-mec-06",
    code: "WI-MEC-06",
    discipline: "Mechanical",
    title: "Rotating Equipment Laser Alignment & Vibration Baseline",
    rev: "Rev 2.0",
    toolsRequired: ["Dual-Beam Laser Shaft Alignment Tool", "Tri-axial Vibration FFT Analyzer", "Feeler Gauges"],
    safetyPPE: ["Lockout/Tagout (LOTO) Kit", "Safety Eyewear", "Steel-Toe Boots"],
    keyChecks: [
      "Check soft-foot condition with dial indicator (< 0.05 mm deflection per machine foot).",
      "Perform thermal growth offset calculation for operating temperature differential.",
      "Measure radial and axial angularity and offset at driver-driven coupling.",
      "Capture initial uncoupled and coupled vibration velocity RMS (10-1000 Hz spectrum)."
    ],
    acceptanceCriteria: "Shaft offset < 0.05mm, angularity < 0.05mm/100mm. Vibration severity Class 1 (< 1.8 mm/s RMS) per ISO 10816-3."
  },
];

export default function WorkInstructionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("All");
  const [activeWI, setActiveWI] = useState<WorkInstruction | null>(null);

  const filteredWIs = WORK_INSTRUCTIONS.filter((wi) => {
    const matchesSearch =
      wi.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wi.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wi.acceptanceCriteria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDisc = selectedDiscipline === "All" || wi.discipline === selectedDiscipline;
    return matchesSearch && matchesDisc;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#001a2c] via-[#003859] to-[#001a2c] border border-sky-800/40 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-300 text-xs font-mono font-bold mb-3">
              <HardHat className="w-3.5 h-3.5" />
              Technical Work Instructions (WI) &bull; Field Execution Protocols
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading text-white">
              Work Instructions (WI)
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
              Step-by-step engineering work instructions, acceptance criteria, equipment calibration requirements, and safety PPE standards for on-site inspectors.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/itps"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0084bf] to-[#e35f14] text-white text-xs font-bold shadow-md glow-iqe-blue transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>Inspection &amp; Test Plans (ITP)</span>
            </Link>
          </div>
        </div>

        {/* Sub-module Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/60">
          <Link
            href="/pms-formats"
            className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-3 hover:bg-slate-800/80 transition-all"
          >
            <BookOpen className="w-5 h-5 text-sky-400" />
            <div>
              <div className="text-xs font-bold text-white">Formats</div>
              <div className="text-[11px] text-slate-400">Audit &amp; Formats</div>
            </div>
          </Link>
          <Link
            href="/sops"
            className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-3 hover:bg-slate-800/80 transition-all"
          >
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs font-bold text-white">SOP&apos;s</div>
              <div className="text-[11px] text-slate-400">Operating Procedures</div>
            </div>
          </Link>
          <Link
            href="/work-instructions"
            className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center gap-3 hover:bg-amber-500/30 transition-all"
          >
            <CheckCircle2 className="w-5 h-5 text-amber-300" />
            <div>
              <div className="text-xs font-bold text-white">Work Instructions</div>
              <div className="text-[11px] text-amber-200">Active WI Library</div>
            </div>
          </Link>
          <Link
            href="/itps"
            className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-3 hover:bg-slate-800/80 transition-all"
          >
            <Layers className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-xs font-bold text-white">ITP&apos;s</div>
              <div className="text-[11px] text-slate-400">Quality Plans</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            aria-label="Search"
            placeholder="Search WI title, code, or criteria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0084bf]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["All", "Civil", "Piping", "Electrical", "HVAC", "NDT", "Mechanical"].map((disc) => (
            <button
              key={disc}
              onClick={() => setSelectedDiscipline(disc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDiscipline === disc
                  ? "bg-[#0084bf] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {disc}
            </button>
          ))}
        </div>
      </div>

      {/* Work Instructions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWIs.map((wi) => (
          <div
            key={wi.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-extrabold bg-amber-50 dark:bg-amber-950 text-[#e35f14] border border-amber-200 dark:border-amber-800">
                  {wi.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {wi.discipline} &bull; {wi.rev}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                {wi.title}
              </h3>

              <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <div>
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-[#0084bf]" />
                    <span>Calibrated Tools:</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                    {wi.toolsRequired.join(", ")}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Acceptance Benchmark:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5 leading-snug">
                    {wi.acceptanceCriteria}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setActiveWI(wi)}
                className="py-2 px-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-100 text-[#e35f14] text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Protocol</span>
              </button>
              <span className="text-[11px] font-mono text-slate-400">{wi.keyChecks.length} Checkpoints</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal View for Selected Work Instruction */}
      {activeWI && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#e35f14]">{activeWI.code} &bull; {activeWI.discipline} Discipline &bull; {activeWI.rev}</span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading mt-1">{activeWI.title}</h2>
              </div>
              <button aria-label="Close"
                onClick={() => setActiveWI(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mandatory Safety PPE */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-xs">
              <div className="font-bold text-[#e35f14] flex items-center gap-1.5 mb-1">
                <HardHat className="w-4 h-4" />
                <span>Mandatory Safety PPE:</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">{activeWI.safetyPPE.join(" • ")}</p>
            </div>

            {/* Required Calibrated Tools */}
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-xs">
              <div className="font-bold text-[#0084bf] flex items-center gap-1.5 mb-1">
                <Wrench className="w-4 h-4" />
                <span>Calibrated Measuring Tools Required:</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">{activeWI.toolsRequired.join(" • ")}</p>
            </div>

            {/* Key Procedural Checks */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                Step-by-Step Field Inspection Checkpoints
              </h4>
              <div className="space-y-2">
                {activeWI.keyChecks.map((check, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-[#e35f14] dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 dark:text-slate-200 leading-relaxed">{check}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acceptance Criteria */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-xs">
              <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Acceptance &amp; Rejection Benchmark:</span>
              </div>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{activeWI.acceptanceCriteria}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setActiveWI(null)}
                className="px-5 py-2 rounded-xl bg-[#0084bf] hover:bg-[#00618e] text-white text-xs font-bold transition-colors"
              >
                Close Work Instruction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
