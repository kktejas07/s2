"use client";

import { useEffect, useState } from "react";
import { 
  Calendar, Search, Plus, MapPin, X, CheckCircle2, 
  MoreVertical, Edit3, Power, LayoutGrid, LayoutList, RefreshCw, User, UserCheck, Factory, Tag, Globe, Compass, ShieldCheck, ArrowRight, Clock, AlertCircle
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

const alphabet = ["ALL", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

const visitTypes = ["Regular Visit", "Re-inspection", "Emergency Callout", "Final Stage Audit"];
const sampleInspectors = [
  { id: "INS-001", name: "Alok Gupta (Senior TPI Engineer)" },
  { id: "INS-002", name: "S. Sundaram (Subsea Inspector)" },
  { id: "INS-003", name: "Vikram Sharma (Metallurgical Auditor)" },
  { id: "INS-004", name: "Rao (QC Specialist)" },
];

export default function VisitSchedulePage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [mfrs, setMfrs] = useState<any[]>([]);
  const [cns, setCns] = useState<any[]>([]);
  const [clientUnits, setClientUnits] = useState<any[]>([]);
  const [mfrUnits, setMfrUnits] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [selectedAlpha, setSelectedAlpha] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"scheduled" | "initiated" | "completed" | "all">("scheduled");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState<any | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Form State for Schedule Visit Wizard
  const [visitId, setVisitId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedClientUnitId, setSelectedClientUnitId] = useState("");
  const [selectedCNId, setSelectedCNId] = useState("");
  const [selectedMfrId, setSelectedMfrId] = useState("");
  const [selectedMfrUnitId, setSelectedMfrUnitId] = useState("");
  const [plantLocation, setPlantLocation] = useState("");
  const [selectedInspectorId, setSelectedInspectorId] = useState("");
  const [scheduledStartDate, setScheduledStartDate] = useState("");
  const [scheduledEndDate, setScheduledEndDate] = useState("");
  const [visitType, setVisitType] = useState("Regular Visit");
  const [inspectionScope, setInspectionScope] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadVisits();
    loadDropdownData();
  }, [search, selectedAlpha, statusFilter]);

  async function loadDropdownData() {
    try {
      const cRes = await api.listClients({ per_page: 200 });
      setClients(cRes.data || []);
      const mRes = await api.listManufacturers({ per_page: 200 });
      setMfrs(mRes.data || []);
      const cnRes = await api.listControlNumbers({ per_page: 200 });
      setCns(cnRes.data || []);
    } catch (e) {
      console.warn("Failed to load dropdowns", e);
    }
  }

  // Load client units when client selection changes in modal
  useEffect(() => {
    if (!selectedClientId) {
      setClientUnits([]);
      return;
    }
    api.listClientUnits(selectedClientId).then((u) => setClientUnits(u || [])).catch(() => setClientUnits([]));
  }, [selectedClientId]);

  // Load manufacturer units when manufacturer selection changes in modal
  useEffect(() => {
    if (!selectedMfrId) {
      setMfrUnits([]);
      return;
    }
    api.listManufacturerUnits(selectedMfrId).then((u) => setMfrUnits(u || [])).catch(() => setMfrUnits([]));
  }, [selectedMfrId]);

  async function loadVisits() {
    setLoading(true);
    try {
      const statusParam = statusFilter === "all" ? "" : statusFilter;
      const r = await api.listVisits({ 
        search, 
        alpha: selectedAlpha === "ALL" ? "" : selectedAlpha,
        status: statusParam,
        per_page: 200 
      });
      setVisits(r.data || []);
    } catch (e) {
      console.error(e);
      // Fallback sample scheduled visits
      setVisits([
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
          inspection_scope: "Raw Material Heat Verification, Bevel End Dimensional Audit & Radiography NDT Film Witnessing",
          comments: "Inspector to carry calibrated digital vernier callipers and Ultrasonic thickness gauge.",
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
          inspection_scope: "Hydrostatic Pressure Witness at 1.5x Design Pressure & Inspection Release Note (IRN) Signoff",
          comments: "Mandatory client representative presence required for final pressure chart signoff.",
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
          visit_type: "Re-inspection",
          inspection_scope: "Cryogenic Pressure Re-test & Actuator Torque Calibration Audit",
          comments: "All 15 subsea skid valves passed pressure hold; IRN-ONGC-990 issued.",
          status: "completed",
          is_active: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingVisit(null);
    setWizardStep(1);
    setVisitId(`VST-2026-${(visits.length + 1).toString().padStart(3, "0")}`);
    setSelectedClientId("");
    setSelectedClientUnitId("");
    setSelectedCNId("");
    setSelectedMfrId("");
    setSelectedMfrUnitId("");
    setPlantLocation("HAZ - Hazira Industrial Zone (WST - Western Region)");
    setSelectedInspectorId(sampleInspectors[0].id);
    setScheduledStartDate(new Date().toISOString().split("T")[0]);
    setScheduledEndDate(new Date().toISOString().split("T")[0]);
    setVisitType("Regular Visit");
    setInspectionScope("Stage Inspection, Dimensional Audit & Radiography NDT Witnessing");
    setComments("Inspector to ensure 48-hour pre-visit call to vendor plant QC manager.");
    setShowScheduleModal(true);
  };

  const handleOpenEditModal = (v: any) => {
    setEditingVisit(v);
    setWizardStep(1);
    setVisitId(v.visit_id || "");
    setSelectedClientId(v.client_id || "");
    setSelectedClientUnitId(v.client_unit_id || "");
    setSelectedCNId(v.control_number_id || "");
    setSelectedMfrId(v.manufacturer_id || "");
    setSelectedMfrUnitId(v.manufacturer_unit_id || "");
    setPlantLocation(v.plant_location || "");
    setSelectedInspectorId(v.inspector_id || sampleInspectors[0].id);
    setScheduledStartDate(v.scheduled_start_date ? v.scheduled_start_date.split("T")[0] : "");
    setScheduledEndDate(v.scheduled_end_date ? v.scheduled_end_date.split("T")[0] : "");
    setVisitType(v.visit_type || "Regular Visit");
    setInspectionScope(v.inspection_scope || "");
    setComments(v.comments || "");
    setShowScheduleModal(true);
    setActiveDropdown(null);
  };

  const handleSaveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const clientObj = clients.find((c) => c.client_id === selectedClientId);
    const clientUnitObj = clientUnits.find((u) => u.client_unit_id === selectedClientUnitId);
    const mfrObj = mfrs.find((m) => m.manufacturer_id === selectedMfrId);
    const mfrUnitObj = mfrUnits.find((u) => u.manufacturer_unit_id === selectedMfrUnitId);
    const inspObj = sampleInspectors.find((i) => i.id === selectedInspectorId);

    const payload = {
      visit_id: visitId,
      control_number_id: selectedCNId,
      client_id: selectedClientId,
      customer_name: clientObj ? clientObj.name : undefined,
      client_unit_id: selectedClientUnitId,
      client_unit_name: clientUnitObj ? clientUnitObj.name : undefined,
      manufacturer_id: selectedMfrId,
      manufacturer_name: mfrObj ? mfrObj.name : undefined,
      manufacturer_unit_id: selectedMfrUnitId,
      manufacturer_unit_name: mfrUnitObj ? mfrUnitObj.name : undefined,
      plant_location: plantLocation,
      inspector_id: selectedInspectorId,
      inspector_name: inspObj ? inspObj.name : undefined,
      scheduled_start_date: scheduledStartDate || undefined,
      scheduled_end_date: scheduledEndDate || undefined,
      planned_date: scheduledStartDate || undefined,
      visit_type: visitType,
      inspection_scope: inspectionScope,
      comments,
      status: "scheduled",
    };

    try {
      if (editingVisit) {
        await api.updateVisitSchedule(editingVisit.visit_id, payload);
      } else {
        await api.createVisitSchedule(payload);
      }
      setShowScheduleModal(false);
      loadVisits();
    } catch (err) {
      console.error("Failed to schedule Visit:", err);
      toast.error("Couldn't save the inspection visit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (v: any) => {
    try {
      await api.updateVisitStatus(v.visit_id, !v.is_active);
      loadVisits();
    } catch (e) {
      console.error(e);
    } finally {
      setActiveDropdown(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Inspection Visit Schedule & Inspector Allocation</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold font-mono">
              {visits.length} Scheduled Visits
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Allocate lead TPI inspectors, set schedule start & end dates, map customer/vendor plant sites, and manage visit calls
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadVisits}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh Schedule"
            aria-label="Refresh schedule"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 text-white font-semibold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Inspection Visit</span>
          </button>
        </div>
      </div>

      {/* Alphabetical A-Z Jump Bar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alphabetical Customer & Inspector Index</span>
          <span className="text-[11px] font-mono text-purple-600 font-semibold">Filter by Customer, Vendor, or Inspector initial</span>
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
                    ? "bg-purple-600 text-white shadow-sm scale-105"
                    : "bg-slate-50 text-slate-600 hover:bg-purple-50 hover:text-purple-600 border border-slate-200/60"
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
        <div className="relative flex-1">
          <input
            aria-label="Search visits"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Visit ID (VST-2026-001), Control No, Customer, Inspector, Vendor, Location..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex flex-wrap p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
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
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "all" ? "bg-white text-slate-900 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-slate-600">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-purple-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Table View"
              aria-label="Table view"
              aria-pressed={viewMode === "table"}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-purple-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Card Grid View"
              aria-label="Card grid view"
              aria-pressed={viewMode === "grid"}
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
                  <th className="p-3">Visit ID</th>
                  <th className="p-3">Schedule Dates</th>
                  <th className="p-3">Customer & Plant Site</th>
                  <th className="p-3">Vendor Works Site</th>
                  <th className="p-3">Control No / PO</th>
                  <th className="p-3">Assigned Inspector</th>
                  <th className="p-3">Visit Type & Scope</th>
                  <th className="p-3">Plant Location</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      No scheduled inspection visits found matching criteria.
                    </td>
                  </tr>
                ) : (
                  visits.map((v) => (
                    <tr key={v.visit_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-purple-600">{v.visit_id}</td>
                      <td className="p-3">
                        <p className="font-mono font-bold text-slate-900">{v.scheduled_start_date ? v.scheduled_start_date.split("T")[0] : "N/A"}</p>
                        {v.scheduled_end_date && <p className="text-[11px] text-slate-400">to {v.scheduled_end_date.split("T")[0]}</p>}
                      </td>
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
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="font-bold text-slate-900">{v.inspector_name || "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="font-bold text-purple-700 text-[11px]">{v.visit_type || "Regular Visit"}</p>
                        <p className="text-slate-700 truncate" title={v.inspection_scope}>{v.inspection_scope}</p>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{v.plant_location || "On-Site"}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          v.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                          v.status === "initiated" ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
                        }`}>
                          {v.status === "completed" ? "Completed" : v.status === "initiated" ? "In Progress" : "Scheduled"}
                        </span>
                      </td>
                      <td className="p-3 text-right relative">
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(activeDropdown === v.visit_id ? null : v.visit_id)}
                          aria-label={`Actions for ${v.visit_id}`}
                          title="More actions"
                          aria-haspopup="menu"
                          aria-expanded={activeDropdown === v.visit_id}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Ellipsis Menu */}
                        {activeDropdown === v.visit_id && (
                          <div className="absolute right-3 top-10 z-20 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-left text-xs space-y-0.5">
                            <button
                              onClick={() => handleOpenEditModal(v)}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                              <span>Edit Visit Schedule</span>
                            </button>
                            <button
                              onClick={() => handleToggleStatus(v)}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                            >
                              <Power className={`w-3.5 h-3.5 ${v.is_active !== false ? "text-rose-600" : "text-emerald-600"}`} />
                              <span>{v.is_active !== false ? "Cancel Schedule" : "Re-activate Visit"}</span>
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
                  <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-lg">
                    {v.visit_id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    v.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                    v.status === "initiated" ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
                  }`}>
                    {v.status === "completed" ? "Completed" : v.status === "initiated" ? "In Progress" : "Scheduled"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">{v.customer_name}</h3>
                  {v.client_unit_name && <p className="text-[11px] text-slate-500">Unit: {v.client_unit_name}</p>}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <p><span className="text-slate-400">Inspector:</span> <span className="font-bold text-slate-900">{v.inspector_name}</span></p>
                  <p><span className="text-slate-400">Schedule Date:</span> <span className="font-mono font-bold text-brand-700">{v.scheduled_start_date}</span></p>
                  <p><span className="text-slate-400">Location:</span> <span className="text-slate-800 font-medium">{v.plant_location}</span></p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-500">{v.control_number_id}</span>

                <button
                  onClick={() => handleOpenEditModal(v)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors"
                >
                  Edit Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Multi-Step Schedule Inspection Visit Wizard Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {editingVisit ? `Edit Visit Schedule (${editingVisit.visit_id})` : "Schedule New Inspection Visit & Allocate Inspector"}
                </h2>
              </div>
              <button type="button" onClick={() => setShowScheduleModal(false)} aria-label="Close" title="Close" className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wizard Steps Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-1 bg-purple-50 p-2.5 rounded-xl border border-purple-100 text-xs font-bold font-mono">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className={`px-3 py-1 rounded-lg transition-all ${wizardStep === 1 ? "bg-purple-600 text-white shadow-sm" : "text-purple-800 hover:bg-purple-100"}`}
              >
                1. Customer & CN
              </button>
              <ArrowRight className="w-4 h-4 text-purple-300" />
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className={`px-3 py-1 rounded-lg transition-all ${wizardStep === 2 ? "bg-purple-600 text-white shadow-sm" : "text-purple-800 hover:bg-purple-100"}`}
              >
                2. Vendor & Works Site
              </button>
              <ArrowRight className="w-4 h-4 text-purple-300" />
              <button
                type="button"
                onClick={() => setWizardStep(3)}
                className={`px-3 py-1 rounded-lg transition-all ${wizardStep === 3 ? "bg-purple-600 text-white shadow-sm" : "text-purple-800 hover:bg-purple-100"}`}
              >
                3. Inspector & Dates
              </button>
            </div>

            <form onSubmit={handleSaveVisit} className="space-y-3">
              {wizardStep === 1 && (
                /* Step 1: Customer & Control Number Selection */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="vs-id" className="block text-xs font-semibold text-slate-700 mb-1">Visit ID *</label>
                      <input id="vs-id"
                        type="text"
                        required
                        value={visitId}
                        onChange={(e) => setVisitId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold text-purple-700"
                      />
                    </div>

                    <div>
                      <label htmlFor="vs-cn" className="block text-xs font-semibold text-slate-700 mb-1">Control Number Assignment</label>
                      <select id="vs-cn"
                        value={selectedCNId}
                        onChange={(e) => setSelectedCNId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold text-brand-700"
                      >
                        <option value="">Select Control Number</option>
                        {cns.map((c) => (
                          <option key={c.control_number_id} value={c.control_number_id}>
                            {c.control_number_id} — {c.client_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="vs-client" className="block text-xs font-semibold text-slate-700 mb-1">Customer / Client *</label>
                      <select id="vs-client"
                        required
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Corporate Client</option>
                        {clients.map((c) => (
                          <option key={c.client_id} value={c.client_id}>
                            {c.name} ({c.client_id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="vs-client-unit" className="block text-xs font-semibold text-slate-700 mb-1">Client Plant Unit Site</label>
                      <select id="vs-client-unit"
                        value={selectedClientUnitId}
                        onChange={(e) => setSelectedClientUnitId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Plant Unit Site</option>
                        {clientUnits.map((u) => (
                          <option key={u.client_unit_id} value={u.client_unit_id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-sm flex items-center gap-1"
                    >
                      <span>Next: Vendor & Location</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                /* Step 2: Vendor & Location Selection (_LocationSelection.cshtml & _ManufacturerMappingSection.cshtml) */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="vs-mfr" className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Manufacturer *</label>
                      <select id="vs-mfr"
                        required
                        value={selectedMfrId}
                        onChange={(e) => setSelectedMfrId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Equipment Vendor</option>
                        {mfrs.map((m) => (
                          <option key={m.manufacturer_id} value={m.manufacturer_id}>
                            {m.name} ({m.manufacturer_id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="vs-mfr-unit" className="block text-xs font-semibold text-slate-700 mb-1">Supplier Plant Unit</label>
                      <select id="vs-mfr-unit"
                        value={selectedMfrUnitId}
                        onChange={(e) => setSelectedMfrUnitId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Vendor Plant Site</option>
                        {mfrUnits.map((u) => (
                          <option key={u.manufacturer_unit_id} value={u.manufacturer_unit_id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="vs-location" className="block text-xs font-semibold text-slate-700 mb-1">Plant Location (3-Letter Coded) *</label>
                    <input id="vs-location"
                      type="text"
                      required
                      value={plantLocation}
                      onChange={(e) => setPlantLocation(e.target.value)}
                      placeholder="HAZ - Hazira Industrial Zone (WST - Western Region)"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-sm flex items-center gap-1"
                    >
                      <span>Next: Inspector & Dates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                /* Step 3: Inspector Allocation & Dates (_VisitDatesConfirmation.cshtml) */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="vs-inspector" className="block text-xs font-semibold text-slate-700 mb-1">Lead TPI Inspector *</label>
                      <select id="vs-inspector"
                        required
                        value={selectedInspectorId}
                        onChange={(e) => setSelectedInspectorId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                      >
                        {sampleInspectors.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="vs-type" className="block text-xs font-semibold text-slate-700 mb-1">Visit Call Type</label>
                      <select id="vs-type"
                        value={visitType}
                        onChange={(e) => setVisitType(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {visitTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="vs-start" className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Start Date *</label>
                      <input id="vs-start"
                        type="date"
                        required
                        value={scheduledStartDate}
                        onChange={(e) => setScheduledStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="vs-end" className="block text-xs font-semibold text-slate-700 mb-1">Scheduled End Date</label>
                      <input id="vs-end"
                        type="date"
                        value={scheduledEndDate}
                        onChange={(e) => setScheduledEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="vs-scope" className="block text-xs font-semibold text-slate-700 mb-1">Inspection Scope & Testing Plan *</label>
                    <textarea id="vs-scope"
                      rows={2}
                      required
                      value={inspectionScope}
                      onChange={(e) => setInspectionScope(e.target.value)}
                      placeholder="Specify NDT, Dimensional Audit, Hydrotest witnessing..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="vs-comments" className="block text-xs font-semibold text-slate-700 mb-1">Pre-Visit Instructions & Comments</label>
                    <input id="vs-comments"
                      type="text"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="e.g. Ensure 48-hour prior call to vendor plant QC manager"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !visitId || !selectedClientId || !plantLocation || !scheduledStartDate}
                      className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 shadow-sm"
                    >
                      {submitting ? "Confirming..." : "Confirm Visit Schedule"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
