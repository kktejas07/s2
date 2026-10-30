"use client";

import Link from "next/link";
import {
  Compass,
  Zap,
  FileSpreadsheet,
  PackageCheck,
  Layers,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
} from "@/components/icons";

export type InspectionFlowStepId =
  | "expediting"
  | "flash"
  | "visit"
  | "release"
  | "irn"
  | "boq"
  | "billing";

interface InspectionFlowStepperProps {
  currentStep: InspectionFlowStepId;
}

interface StepItem {
  id: InspectionFlowStepId;
  stepNum: number;
  code: string;
  name: string;
  shortDesc: string;
  href: string;
  icon: any;
}

const FLOW_STEPS: StepItem[] = [
  {
    id: "expediting",
    stepNum: 1,
    code: "IQE-TP-05",
    name: "Expediting Visit",
    shortDesc: "Shop Progress & Schedule",
    href: "/expediting-visit-report",
    icon: Compass,
  },
  {
    id: "flash",
    stepNum: 2,
    code: "IQE-TP-02",
    name: "Flash Inspection",
    shortDesc: "Preliminary Day Summary",
    href: "/flash-inspection-report",
    icon: Zap,
  },
  {
    id: "visit",
    stepNum: 3,
    code: "IQE-TP-03",
    name: "Inspection Visit Report",
    shortDesc: "Comprehensive Formal Report",
    href: "/inspection-visit-report",
    icon: FileSpreadsheet,
  },
  {
    id: "release",
    stepNum: 4,
    code: "IQE-TP-04",
    name: "Inspection Release Note",
    shortDesc: "Dispatch Clearance (IRN)",
    href: "/inspection-release-note",
    icon: PackageCheck,
  },
  {
    id: "boq",
    stepNum: 5,
    code: "F-BOQ-01",
    name: "BOQ Reconciliation",
    shortDesc: "Material & Qty Audit",
    href: "/boq-reconciliation",
    icon: Layers,
  },
  {
    id: "billing",
    stepNum: 6,
    code: "F-BILL-01",
    name: "Bill Verification",
    shortDesc: "Payment Certification",
    href: "/tpi-billing",
    icon: FileCheck2,
  },
];

export function InspectionFlowStepper({ currentStep }: InspectionFlowStepperProps) {
  const normalizedStep = currentStep === "irn" ? "release" : currentStep;
  const currentIndex = FLOW_STEPS.findIndex((s) => s.id === normalizedStep);
  const nextStep = currentIndex >= 0 && currentIndex < FLOW_STEPS.length - 1 ? FLOW_STEPS[currentIndex + 1] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 print:hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-[#003366] text-white">
            TPI Quality Lifecycle Flow
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Stage {currentIndex + 1} of {FLOW_STEPS.length}:{" "}
            <strong className="text-slate-800">{FLOW_STEPS[currentIndex]?.name}</strong> ({FLOW_STEPS[currentIndex]?.code})
          </span>
        </div>

        {nextStep && (
          <Link
            href={nextStep.href}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 hover:bg-sky-100 text-[#003366] border border-sky-200 rounded-lg text-xs font-bold transition-all group"
          >
            <span>Next in Flow: {nextStep.code}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-3">
        {FLOW_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = step.id === currentStep;
          const isCompleted = idx < currentIndex;
          const isPending = idx > currentIndex;

          return (
            <Link
              key={step.id}
              href={step.href}
              className={`relative p-2.5 rounded-xl border transition-all text-left block group ${
                isCurrent
                  ? "bg-sky-50/80 border-[#003366] ring-2 ring-[#003366]/20 shadow-xs"
                  : isCompleted
                  ? "bg-slate-50/80 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                  : "bg-white border-slate-200/80 hover:border-slate-300 opacity-75 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                    isCurrent
                      ? "bg-[#003366] text-white"
                      : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.stepNum}
                </span>

                <span
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isCurrent
                      ? "bg-[#003366] text-white"
                      : isCompleted
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {step.code}
                </span>
              </div>

              <div className="text-xs font-bold truncate text-slate-800 group-hover:text-[#003366] flex items-center gap-1">
                <Icon className={`w-3 h-3 shrink-0 ${isCurrent ? "text-[#003366]" : "text-slate-400"}`} />
                <span className="truncate">{step.name}</span>
              </div>

              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                {step.shortDesc}
              </div>

              {isCurrent && (
                <div className="mt-1 flex items-center gap-1 text-[11px] font-extrabold text-[#003366]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003366] animate-pulse"></span>
                  <span>CURRENT DOCUMENT</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
