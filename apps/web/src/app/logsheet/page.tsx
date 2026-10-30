"use client";

import { useEffect, useState } from "react";
import { 
  FileText, Search, Download, MapPin, X, CheckCircle2, 
  MoreVertical, Edit3, Power, LayoutGrid, LayoutList, RefreshCw, User, UserCheck, Factory, Tag, Globe, Compass, ShieldCheck, ArrowRight, Clock, AlertTriangle, DollarSign, Calendar
} from "@/components/icons";
import { api } from "@/lib/api";

const alphabet = ["ALL", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

export default function LogSheetPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<any>({
    total_count: 0,
    scheduled_count: 0,
    initiated_count: 0,
    completed_count: 0,
    cancelled_count: 0,
  });

  const [search, setSearch] = useState("");
  const [selectedAlpha, setSelectedAlpha] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "initiated" | "completed" | "cancelled">("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [loading, setLoading] = useState(true);

  // Drawer / Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLogSheet, setSelectedLogSheet] = useState<any | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadLogSheet();
  }, [search, selectedAlpha, statusFilter]);

  async function loadLogSheet() {
    setLoading(true);
    try {
      const statusParam = statusFilter === "all" ? "" : statusFilter;
      const r = await api.getVisitLogSheet({ 
        search, 
        alpha: selectedAlpha === "ALL" ? "" : selectedAlpha,
        status: statusParam,
        per_page: 200 
      });
      setVisits(r.data || []);
      if (r.status_counts) {
        setStatusCounts(r.status_counts);
      }
    } catch (e) {
      console.error(e);
      // Fallback sample logsheet entries matching ScheduledVisitList.cshtml
      const sampleLogs = [
        {
          visit_id: "VST-2026-001",
          control_number_id: "CN-2026-001",
          po_number: "PO/RIL/2026/094",
          client_id: "C-001",
          customer_name: "Reliance Industries Ltd",
          client_unit_name: "Reliance - Unit 1 (Hazira Heavy Fabrication Yard)",
          manufacturer_id: "M-001",
          manufacturer_name: "BHEL Trichy Boilers",
          manufacturer_unit_name: "BHEL - Works 1 (Heavy Forging & Casting Shop)",
          plant_location: "HAZ - Hazira Industrial Zone (WST - Western Region)",
          inspector_id: "INS-001",
          inspector_name: "Alok Gupta (Senior TPI Engineer)",
          scheduled_start_date: "2026-08-15",
          scheduled_end_date: "2026-08-17",
          visit_type: "Regular Visit",
          inspection_scope: "Raw Material Heat Verification & Bevel End Dimensional Audit",
          inspection_report_no: "IRN/BHEL/2026/901",
          comments: "Inspector to carry calibrated digital vernier callipers.",
          expenses: [{ type: "travel", amount: 4500, description: "Mumbai to Hazira Taxi & Lodging" }],
          findings: [{ description: "Bevel end root face dimension within ±0.5mm tolerance.", severity: "observation" }],
          status: "scheduled",
          is_active: true,
        },
        {
          visit_id: "VST-2026-002",
          control_number_id: "CN-2026-002",
          po_number: "PO/LNT/2026/441",
          client_id: "C-002",
          customer_name: "L&T Heavy Engineering",
          client_unit_name: "L&T - Unit 2 (Jamnagar Refinery Expansion Site)",
          manufacturer_id: "M-002",
          manufacturer_name: "Godrej Heavy Engineering",
          manufacturer_unit_name: "Godrej - Works 2 (High Pressure Boiler & Vessel Shop)",
          plant_location: "JAM - Jamnagar Petrochemical Complex (WST - Western Region)",
          inspector_id: "INS-004",
          inspector_name: "Rao (QC Specialist)",
          scheduled_start_date: "2026-08-18",
          scheduled_end_date: "2026-08-20",
          visit_type: "Final Stage Audit",
          inspection_scope: "Hydrostatic Pressure Witness at 1.5x Design Pressure",
          inspection_report_no: "IRN/GDJ/2026/904",
          comments: "Pressure chart signed off by client representative.",
          expenses: [{ type: "travel", amount: 6200, description: "Ahmedabad to Jamnagar Site Travel" }],
          findings: [{ description: "Zero leakage observed during 30-minute pressure hold at 150 bar.", severity: "observation" }],
          status: "initiated",
          is_active: true,
        },
        {
          visit_id: "VST-2026-003",
          control_number_id: "CN-2026-003",
          po_number: "PO/ONGC/2026/812",
          client_id: "C-003",
          customer_name: "ONGC Offshore Project",
          client_unit_name: "ONGC - Unit 3 (Chennai Subsea Integration Works)",
          manufacturer_id: "M-003",
          manufacturer_name: "ISGEC Heavy Engineering",
          manufacturer_unit_name: "ISGEC - Works 1 (Heavy Forging & Casting Shop)",
          plant_location: "CHE - Chennai Ennore Port SEZ (STH - Southern Region)",
          inspector_id: "INS-002",
          inspector_name: "S. Sundaram (Subsea Inspector)",
          scheduled_start_date: "2026-08-10",
          scheduled_end_date: "2026-08-12",
          visited_from: "2026-08-10",
          visited_to: "2026-08-12",
          visit_type: "Re-inspection",
          inspection_scope: "Cryogenic Pressure Re-test & Actuator Torque Calibration Audit",
          inspection_report_no: "IRN/ISG/2026/812",
          comments: "All 15 subsea skid valves passed pressure hold; IRN-ONGC-990 issued.",
          expenses: [{ type: "travel", amount: 8500, description: "Chennai SEZ Flight & Site Hotel" }],
          findings: [{ description: "Actuator torque verified at 120 Nm according to valve specs.", severity: "observation" }],
          status: "completed",
          is_active: true,
        },
      ];
      setVisits(sampleLogs);
      setStatusCounts({
        total_count: sampleLogs.length,
        scheduled_count: 1,
        initiated_count: 1,
        completed_count: 1,
        cancelled_count: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  const handleExportCSV = () => {
    if (visits.length === 0) return;
    const headers = ["Visit ID", "Status", "Customer", "Client Unit", "Vendor", "Vendor Works", "Control No", "PO No", "Inspector", "Start Date", "End Date", "Location", "IRN Report No"];
    const rows = visits.map((v) => [
      v.visit_id,
      v.status,
      v.customer_name || "",
      v.client_unit_name || "",
      v.manufacturer_name || "",
      v.manufacturer_unit_name || "",
      v.control_number_id || "",
      v.po_number || "",
      v.inspector_name || "",
      v.scheduled_start_date ? v.scheduled_start_date.split("T")[0] : "",
      v.scheduled_end_date ? v.scheduled_end_date.split("T")[0] : "",
      v.plant_location || "",
      v.inspection_report_no || "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.map((x) => `"${x}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IQE_Visit_LogSheet_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenDetails = (v: any) => {
    setSelectedLogSheet(v);
    setShowDetailsModal(true);
    setActiveDropdown(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Visit Processing LogSheet & Audit Register</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
              {statusCounts.total_count || visits.length} Total Visits Logged
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive logsheet tracking all scheduled inspection calls, assigned inspectors, captured findings, and IRN reports
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadLogSheet}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh LogSheet"
            aria-label="Refresh log sheet"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export LogSheet CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Scheduled</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-purple-600">{statusCounts.scheduled_count}</span>
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Progress</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-amber-600">{statusCounts.initiated_count}</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed & QC Passed</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-emerald-600">{statusCounts.completed_count}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cancelled / Closed</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-rose-600">{statusCounts.cancelled_count}</span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Alphabetical A-Z Jump Bar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1 px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alphabetical Customer & Inspector Index</span>
          <span className="text-[11px] font-mono text-blue-600 font-semibold">Filter by Customer, Vendor, or Inspector initial</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {alphabet.map((letter) => {
            const isActive = selectedAlpha === letter;
            return (
              <button
                key={letter}
                onClick={() => setSelectedAlpha(letter)}
                className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm scale-105"
                    : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/60"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search, Filter Bar & View Toggle */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
          <input
            value={search}
            aria-label="Search log sheets"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by LogSheet ID (VST-2026-001), Control No, Customer, Inspector, Vendor, IRN No..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 md:shrink-0">
          <div className="inline-flex flex-wrap p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "all" ? "bg-white text-slate-900 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All LogSheets
            </button>
            <button
              onClick={() => setStatusFilter("scheduled")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "scheduled" ? "bg-white text-purple-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setStatusFilter("initiated")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "initiated" ? "bg-white text-amber-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "completed" ? "bg-white text-emerald-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Completed
            </button>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-slate-600">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Table View"
              aria-label="Table view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Card Grid View"
              aria-label="Card grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Content Area */}
      {viewMode === "table" ? (
        /* Data Table View (Matching legacy ScheduledVisitList.cshtml) */
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">LogSheet / Visit ID</th>
                  <th className="p-3">Inspection Dates</th>
                  <th className="p-3">Customer & Unit</th>
                  <th className="p-3">Vendor Works Site</th>
                  <th className="p-3">Control No / PO</th>
                  <th className="p-3">Assigned Inspector</th>
                  <th className="p-3">IRN Report No</th>
                  <th className="p-3">Inspection Scope</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      No visit logsheet records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  visits.map((v) => (
                    <tr key={v.visit_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-600">{v.visit_id}</td>
                      <td className="p-3 font-mono text-slate-900">{v.scheduled_start_date ? v.scheduled_start_date.split("T")[0] : "N/A"}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{v.customer_name || "Unassigned Customer"}</p>
                        {v.client_unit_name && <p className="text-[11px] text-slate-500">Unit: {v.client_unit_name}</p>}
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-slate-800">{v.manufacturer_name || "Unassigned Vendor"}</p>
                        {v.manufacturer_unit_name && <p className="text-[11px] text-slate-400">Works: {v.manufacturer_unit_name}</p>}
                      </td>
                      <td className="p-3 font-mono">
                        <p className="font-bold text-brand-600">{v.control_number_id || "N/A"}</p>
                        {v.po_number && <p className="text-[11px] text-slate-400">{v.po_number}</p>}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{v.inspector_name || "Unassigned"}</td>
                      <td className="p-3 font-mono font-bold text-purple-700">{v.inspection_report_no || "Pending"}</td>
                      <td className="p-3 max-w-xs truncate text-slate-700" title={v.inspection_scope}>{v.inspection_scope}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          v.status === "completed" || v.status === "quality_check_completed" ? "bg-emerald-100 text-emerald-800" :
                          v.status === "initiated" ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
                        }`}>
                          {v.status === "completed" || v.status === "quality_check_completed" ? "Completed" : v.status === "initiated" ? "In Progress" : "Scheduled"}
                        </span>
                      </td>
                      <td className="p-3 text-right relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === v.visit_id ? null : v.visit_id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                          aria-label={`Actions for ${v.visit_id}`}
                          title="More actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Ellipsis Menu */}
                        {activeDropdown === v.visit_id && (
                          <div className="absolute right-3 top-10 z-20 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-left text-xs space-y-0.5">
                            <button
                              onClick={() => handleOpenDetails(v)}
                              className="w-full px-3 py-1.5 hover:bg-blue-50 text-blue-700 flex items-center gap-2 font-bold"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View LogSheet Details</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visits.map((v) => (
            <div
              key={v.visit_id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                    {v.visit_id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    v.status === "completed" || v.status === "quality_check_completed" ? "bg-emerald-100 text-emerald-800" :
                    v.status === "initiated" ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
                  }`}>
                    {v.status === "completed" || v.status === "quality_check_completed" ? "Completed" : v.status === "initiated" ? "In Progress" : "Scheduled"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">{v.customer_name}</h3>
                  {v.client_unit_name && <p className="text-[11px] text-slate-500">Unit: {v.client_unit_name}</p>}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <p><span className="text-slate-400">Inspector:</span> <span className="font-bold text-slate-900">{v.inspector_name}</span></p>
                  <p><span className="text-slate-400">IRN Report No:</span> <span className="font-mono font-bold text-purple-700">{v.inspection_report_no || "Pending"}</span></p>
                  <p><span className="text-slate-400">Location:</span> <span className="text-slate-800 font-medium">{v.plant_location}</span></p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-500">{v.control_number_id}</span>
                <button
                  onClick={() => handleOpenDetails(v)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LogSheet Details Drawer / Modal */}
      {showDetailsModal && selectedLogSheet && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    LogSheet Inspection Register — {selectedLogSheet.visit_id}
                  </h2>
                  <p className="text-xs text-slate-500">Customer: {selectedLogSheet.customer_name} • Supplier: {selectedLogSheet.manufacturer_name}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close details" title="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <p className="text-slate-400">Control Number ID:</p>
                  <p className="font-mono font-bold text-brand-700 text-sm">{selectedLogSheet.control_number_id || "N/A"}</p>
                </div>
                <div>
                  <p className="text-slate-400">Purchase Order No:</p>
                  <p className="font-mono font-bold text-slate-900 text-sm">{selectedLogSheet.po_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-slate-400">Assigned Inspector:</p>
                  <p className="font-bold text-slate-900">{selectedLogSheet.inspector_name}</p>
                </div>
                <div>
                  <p className="text-slate-400">IRN Report No:</p>
                  <p className="font-mono font-bold text-purple-700">{selectedLogSheet.inspection_report_no || "Pending"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Inspection Scope & Testing Plan</h4>
                <p className="p-3 bg-slate-50 border rounded-xl text-slate-800">{selectedLogSheet.inspection_scope}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Captured Audit Findings</h4>
                {selectedLogSheet.findings && selectedLogSheet.findings.length > 0 ? (
                  <ul className="space-y-1.5">
                    {selectedLogSheet.findings.map((f: any, idx: number) => (
                      <li key={idx} className="p-2.5 bg-purple-50/60 border border-purple-200 rounded-xl text-purple-900 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <span>{f.description}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">No specific findings logged for this visit call.</p>
                )}
              </div>

              {selectedLogSheet.expenses && selectedLogSheet.expenses.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Travel & Inspection Expenses</h4>
                  <ul className="space-y-1">
                    {selectedLogSheet.expenses.map((e: any, idx: number) => (
                      <li key={idx} className="flex items-center justify-between p-2 bg-slate-50 border rounded-lg">
                        <span>{e.description}</span>
                        <span className="font-mono font-bold text-slate-900">₹{(e.amount || 0).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
