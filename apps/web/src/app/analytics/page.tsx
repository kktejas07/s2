"use client";

import { API_BASE } from "@/lib/config";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Building2,
  Users,
  ShieldCheck,
  Award,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  FileCheck,
  Zap,
  Star,
  Download,
  DollarSign,
  Activity,
  Layers,
  ChevronRight,
} from "@/components/icons";
import { IQELoader } from "@/components/IQELoader";

interface VendorAnalytics {
  vendorId: string;
  vendorName: string;
  category: string;
  location: string;
  totalAudits: number;
  recurringAuditsCount: number;
  qualityComplianceRate: number; // e.g. 98.4%
  avgAuditCost: string;
  topAuditTypes: string[];
  recommendedAuditors: {
    name: string;
    qualification: string;
    matchScore: number;
    completedVisits: number;
  }[];
}

const VENDOR_ANALYTICS_DATA: VendorAnalytics[] = [
  {
    vendorId: "M-001",
    vendorName: "Greenko Wind & Renewable Energy",
    category: "Wind Turbine & Solar PV Substation Audit",
    location: "HYD - Hyderabad / Kurnool Site",
    totalAudits: 28,
    recurringAuditsCount: 14,
    qualityComplianceRate: 98.6,
    avgAuditCost: "Rs. 45,000 / Visit",
    topAuditTypes: ["Electrical Relay Audit", "Transformer Oil DGA Test", "PV Inverter Acceptance"],
    recommendedAuditors: [
      { name: "Er. V. Sharma", qualification: "NDT Level III / Senior Solar & Grid Audit", matchScore: 99, completedVisits: 42 },
      { name: "Er. Rao", qualification: "NDT Level III / High Voltage Specialist", matchScore: 95, completedVisits: 38 },
    ],
  },
  {
    vendorId: "M-002",
    vendorName: "Larsen & Toubro Ltd - Heavy Engg Div",
    category: "Boilers & Pressure Vessels / Marine Works",
    location: "HAZ - Hazira Works / Mumbai Coastal Road",
    totalAudits: 45,
    recurringAuditsCount: 22,
    qualityComplianceRate: 99.2,
    avgAuditCost: "Rs. 62,000 / Visit",
    topAuditTypes: ["ASME Sec VIII Hydrotest", "90° Elbow Forging UT Check", "Radiographic Film Sign-off"],
    recommendedAuditors: [
      { name: "Er. K. Patel", qualification: "NDT Level III / Pressure Vessel Specialist", matchScore: 98, completedVisits: 56 },
      { name: "Er. S. Nair", qualification: "Lead Quality Auditor", matchScore: 94, completedVisits: 31 },
    ],
  },
  {
    vendorId: "M-003",
    vendorName: "BHEL Trichy Boilers Works",
    category: "High Pressure Steam Boiler Drums",
    location: "TRI - Trichy Works 1",
    totalAudits: 34,
    recurringAuditsCount: 18,
    qualityComplianceRate: 97.8,
    avgAuditCost: "Rs. 50,000 / Visit",
    topAuditTypes: ["PMI Spectro Analysis", "Steam Boiler Drum Radiography", "Weld Visual Audit"],
    recommendedAuditors: [
      { name: "Er. V. Swaminathan", qualification: "NDT Level III / Metallurgy Audit", matchScore: 97, completedVisits: 48 },
      { name: "Er. Rao", qualification: "NDT Level III / Boiler Spec Auditor", matchScore: 92, completedVisits: 38 },
    ],
  },
  {
    vendorId: "M-004",
    vendorName: "Thermax Energy & Chemical Systems",
    category: "Pumps, Compressors & Cryogenic Vessels",
    location: "PUN - Pune Industrial Zone",
    totalAudits: 19,
    recurringAuditsCount: 8,
    qualityComplianceRate: 96.5,
    avgAuditCost: "Rs. 38,000 / Visit",
    topAuditTypes: ["Ultrasonic DFT Gauge Check", "Cryogenic Liner Verification", "Gas Skid Hydrotest"],
    recommendedAuditors: [
      { name: "Er. Sandeep Joshi", qualification: "NDT Level II / Coating Specialist", matchScore: 96, completedVisits: 29 },
    ],
  },
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <IQELoader message="Loading IQE Vendor Quality & Predictive Intelligence Dashboard..." />;
  }

  const filteredData = VENDOR_ANALYTICS_DATA.filter(
    (v) =>
      (selectedVendorId === "ALL" || v.vendorId === selectedVendorId) &&
      (v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedVendor = VENDOR_ANALYTICS_DATA.find((v) => v.vendorId === selectedVendorId) || VENDOR_ANALYTICS_DATA[0];

  return (
    <div className="space-y-6 pb-16 animate-fade-in bg-[#f4f8fb] text-slate-800 p-2 sm:p-4 rounded-3xl">
      {/* Top Banner Header - Light Theme */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#003366] flex items-center justify-center text-white shadow-sm shrink-0">
              <BarChart3 className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#003366] dark:text-sky-300 font-heading tracking-tight">
                Predictive Analytics &amp; Auditor Intelligence Dashboard
              </h1>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Vendor Audit Frequency • Auditor Recommendation Engine • Quality Validation &amp; Cost Benchmarking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href={`${API_BASE}/api/v1/reports/pdf/tpi-billing`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-sky-300" />
            <span>Export Analytics Summary PDF</span>
          </a>
        </div>
      </div>

      {/* KPI Overview Metrics - Light Theme Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total TPI Audits Logged</p>
            <p className="text-2xl font-extrabold text-[#003366] dark:text-sky-300 font-mono mt-1">126 Audits</p>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Across 4 major industrial vendors</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#003366] dark:text-sky-300 border border-blue-200 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider">Recurring Audit Frequency</p>
            <p className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">62.4%</p>
            <p className="text-[11px] text-emerald-800 font-bold mt-0.5">Greenko &amp; L&amp;T Repeat Audits</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider">AI Auditor Match Precision</p>
            <p className="text-2xl font-extrabold text-amber-900 font-mono mt-1">98.5%</p>
            <p className="text-[11px] text-amber-800 font-semibold mt-0.5">NDT Level III Qualification Match</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white text-amber-700 border border-amber-200 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-brand-900 uppercase tracking-wider">Avg Quality Compliance Score</p>
            <p className="text-2xl font-extrabold text-brand-900 font-mono mt-1">98.1%</p>
            <p className="text-[11px] text-brand-800 font-bold mt-0.5">ASME &amp; TPI Quality Standards</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white text-brand-700 border border-brand-200 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Vendor Selection & Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vendor Filter & Audit Frequency Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-base font-extrabold text-[#003366] dark:text-sky-300 font-heading flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>Vendor Quality &amp; Audit History Analysis</span>
              </h2>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    aria-label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search vendor name..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {/* Vendor Cards Grid */}
            <div className="space-y-4">
              {filteredData.map((v) => (
                <div
                  key={v.vendorId}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedVendorId === v.vendorId}
                  onClick={() => setSelectedVendorId(v.vendorId)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedVendorId(v.vendorId); } }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    selectedVendorId === v.vendorId
                      ? "bg-blue-50/80 border-[#003366] ring-2 ring-[#003366]/20 shadow-sm"
                      : "bg-white border-slate-200 hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#003366] text-white font-mono font-bold text-[11px]">
                          {v.vendorId}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900">{v.vendorName}</h3>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">{v.category}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-extrabold border border-emerald-300">
                        {v.qualityComplianceRate}% Compliance
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block uppercase">Total Audits</span>
                      <span className="font-extrabold font-mono text-slate-900 text-sm">{v.totalAudits} Times</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block uppercase">Recurring Frequency</span>
                      <span className="font-extrabold font-mono text-blue-700 text-sm">{v.recurringAuditsCount} Repeat Audits</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block uppercase">Benchmark Quote</span>
                      <span className="font-extrabold font-mono text-slate-900 text-xs">{v.avgAuditCost}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block uppercase">Location</span>
                      <span className="font-semibold text-slate-700 text-xs truncate block">{v.location}</span>
                    </div>
                  </div>

                  {/* Top Audit Types Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 font-bold">Top Audit Scope:</span>
                    {v.topAuditTypes.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Auditor Recommendation Engine */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold tracking-wider uppercase border border-amber-300 flex items-center gap-1.5 w-max mb-2">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>AI Auditor Matching Engine</span>
              </span>
              <h2 className="text-base font-extrabold text-[#003366] dark:text-sky-300 font-heading">
                Recommended Auditors for {selectedVendor.vendorName}
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Matched based on historical NDT Level III qualification, past vendor audit success, and distance proximity.
              </p>
            </div>

            <div className="space-y-4">
              {selectedVendor.recommendedAuditors.map((auditor) => (
                <div
                  key={auditor.name}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>{auditor.name}</span>
                      </h3>
                      <p className="text-[11px] text-slate-600 font-semibold">{auditor.qualification}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Match Score</span>
                      <span className="font-mono text-sm font-extrabold text-emerald-700">
                        {auditor.matchScore}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/80">
                    <span className="text-[11px] text-slate-600 font-medium">
                      Completed Visits: <strong className="text-slate-900">{auditor.completedVisits} Audits</strong>
                    </span>
                    <Link
                      href={`/visits/new?job_id=${selectedVendor.vendorId}`}
                      className="px-3 py-1 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-[11px] font-extrabold shadow-2xs transition-all flex items-center gap-1"
                    >
                      <span>Assign Auditor</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 text-xs">
              <h4 className="font-extrabold text-[#003366] dark:text-sky-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Validation &amp; Quote Optimization</span>
              </h4>
              <p className="text-slate-700 font-medium text-[11px] leading-relaxed">
                Greenko Wind Power &amp; L&amp;T Heavy Engg show a 98%+ quality pass rate when Er. V. Sharma or Er. K. Patel lead joint site inspections. Recommended quote range: <strong>{selectedVendor.avgAuditCost}</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

