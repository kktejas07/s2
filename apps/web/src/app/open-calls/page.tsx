"use client";

import { useEffect, useState } from "react";
import { 
  PhoneCall, Search, Plus, MapPin, X, CheckCircle2, 
  MoreVertical, Edit3, Power, LayoutGrid, LayoutList, RefreshCw, User, UserCheck, Factory, Tag, Globe, Compass, ShieldAlert, ArrowRight, Clock, AlertTriangle
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

const alphabet = ["ALL", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

const urgencyLevels = ["Emergency Callout", "High Priority", "Regular Visit"];
const sampleInspectors = [
  { id: "INS-001", name: "Alok Gupta (Senior TPI Engineer)" },
  { id: "INS-002", name: "S. Sundaram (Subsea Inspector)" },
  { id: "INS-003", name: "Vikram Sharma (Metallurgical Auditor)" },
  { id: "INS-004", name: "Rao (QC Specialist)" },
];

export default function OpenCallsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [mfrs, setMfrs] = useState<any[]>([]);
  const [cns, setCns] = useState<any[]>([]);
  const [clientUnits, setClientUnits] = useState<any[]>([]);
  const [mfrUnits, setMfrUnits] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [selectedAlpha, setSelectedAlpha] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"unassigned" | "assigned" | "all">("unassigned");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showCallModal, setShowCallModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Assign Inspector Sub-Dialog
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCallForAssign, setSelectedCallForAssign] = useState<any | null>(null);
  const [assignedInspectorId, setAssignedInspectorId] = useState(sampleInspectors[0].id);
  const [scheduledStartDate, setScheduledStartDate] = useState("");

  // Form State for Log New Open Call
  const [callId, setCallId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedClientUnitId, setSelectedClientUnitId] = useState("");
  const [selectedCNId, setSelectedCNId] = useState("");
  const [selectedMfrId, setSelectedMfrId] = useState("");
  const [selectedMfrUnitId, setSelectedMfrUnitId] = useState("");
  const [plantLocation, setPlantLocation] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [urgency, setUrgency] = useState("High Priority");
  const [inspectionScope, setInspectionScope] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOpenCalls();
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

  async function loadOpenCalls() {
    setLoading(true);
    try {
      const r = await api.listOpenCalls({ 
        search, 
        alpha: selectedAlpha === "ALL" ? "" : selectedAlpha,
        per_page: 200 
      });
      let fetchedCalls = r.data || [];
      if (statusFilter === "unassigned") {
        fetchedCalls = fetchedCalls.filter((c: any) => !c.inspector_id);
      } else if (statusFilter === "assigned") {
        fetchedCalls = fetchedCalls.filter((c: any) => Boolean(c.inspector_id));
      }
      setCalls(fetchedCalls);
    } catch (e) {
      console.error(e);
      // Fallback sample open calls
      setCalls([
        {
          visit_id: "OPC-2026-001",
          control_number_id: "CN-2026-001",
          po_number: "PO/RIL/2026/094",
          client_id: "C-001",
          customer_name: "Reliance Industries Ltd",
          client_unit_name: "Reliance - Unit 1 (Hazira Heavy Fabrication Yard)",
          manufacturer_id: "M-001",
          manufacturer_name: "BHEL Trichy Boilers",
          manufacturer_unit_name: "BHEL - Works 1 (Heavy Forging & Casting Shop)",
          plant_location: "HAZ - Hazira Industrial Zone (WST - Western Region)",
          scheduled_start_date: "2026-08-20",
          scheduled_end_date: "2026-08-21",
          visit_type: "Emergency Callout",
          inspection_scope: "Pre-weld Bevel Preparation & 100% Magnetic Particle Test (MPT)",
          comments: "URGENT: Client RFI requested immediate callout for pipe spool fitup.",
          status: "open_call",
          is_active: true,
        },
        {
          visit_id: "OPC-2026-002",
          control_number_id: "CN-2026-002",
          po_number: "PO/LNT/2026/441",
          client_id: "C-002",
          customer_name: "L&T Heavy Engineering",
          client_unit_name: "L&T - Unit 2 (Jamnagar Refinery Expansion Site)",
          manufacturer_id: "M-002",
          manufacturer_name: "Godrej Heavy Engineering",
          manufacturer_unit_name: "Godrej - Works 2 (High Pressure Boiler & Vessel Shop)",
          plant_location: "JAM - Jamnagar Petrochemical Complex (WST - Western Region)",
          scheduled_start_date: "2026-08-22",
          scheduled_end_date: "2026-08-23",
          visit_type: "High Priority",
          inspection_scope: "Heat Exchanger Tube Bundle Eddy Current & Dimensional Audit",
          comments: "RFI call received; awaiting coordinator inspector allocation.",
          status: "open_call",
          is_active: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setCallId(`OPC-2026-${(calls.length + 1).toString().padStart(3, "0")}`);
    setSelectedClientId("");
    setSelectedClientUnitId("");
    setSelectedCNId("");
    setSelectedMfrId("");
    setSelectedMfrUnitId("");
    setPlantLocation("HAZ - Hazira Industrial Zone (WST - Western Region)");
    setTargetDate(new Date().toISOString().split("T")[0]);
    setUrgency("High Priority");
    setInspectionScope("Stage Inspection, Dimensional Audit & Radiography NDT Witnessing");
    setComments("Urgent client Request for Inspection (RFI) callout.");
    setShowCallModal(true);
  };

  const handleSaveCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const clientObj = clients.find((c) => c.client_id === selectedClientId);
    const clientUnitObj = clientUnits.find((u) => u.client_unit_id === selectedClientUnitId);
    const mfrObj = mfrs.find((m) => m.manufacturer_id === selectedMfrId);
    const mfrUnitObj = mfrUnits.find((u) => u.manufacturer_unit_id === selectedMfrUnitId);

    const payload = {
      visit_id: callId,
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
      scheduled_start_date: targetDate || undefined,
      planned_date: targetDate || undefined,
      visit_type: urgency,
      inspection_scope: inspectionScope,
      comments,
      status: "open_call",
    };

    try {
      await api.createVisitSchedule(payload);
      setShowCallModal(false);
      loadOpenCalls();
    } catch (err) {
      console.error("Failed to log Open Call:", err);
      toast.error("Couldn't log the open inspection call. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Assign Inspector Modal
  const handleOpenAssignModal = (c: any) => {
    setSelectedCallForAssign(c);
    setAssignedInspectorId(sampleInspectors[0].id);
    setScheduledStartDate(c.scheduled_start_date ? c.scheduled_start_date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setShowAssignModal(true);
    setActiveDropdown(null);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCallForAssign) return;
    const inspObj = sampleInspectors.find((i) => i.id === assignedInspectorId);

    try {
      await api.updateVisitSchedule(selectedCallForAssign.visit_id, {
        inspector_id: assignedInspectorId,
        inspector_name: inspObj ? inspObj.name : undefined,
        scheduled_start_date: scheduledStartDate || undefined,
        status: "scheduled",
      });
      setShowAssignModal(false);
      loadOpenCalls();
    } catch (e) {
      console.error("Failed to assign inspector", e);
      toast.error("Couldn't assign the inspector to this call. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Open Calls & Actionable Inspection Queue</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold font-mono">
              {calls.length} Active RFI Calls
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Client Requests for Inspection (RFI), unassigned callouts, priority urgency tracking, and 1-click inspector allocation
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button aria-label="Refresh Queue"
            onClick={loadOpenCalls}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Log Open RFI Call</span>
          </button>
        </div>
      </div>

      {/* Alphabetical A-Z Jump Bar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alphabetical Customer & Vendor Index</span>
          <span className="text-[11px] font-mono text-amber-600 font-semibold">Filter by Customer or Vendor initial</span>
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
                    ? "bg-amber-600 text-white shadow-sm scale-105"
                    : "bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-600 border border-slate-200/60"
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
            aria-label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Call ID (OPC-2026-001), Control No, Customer, Vendor, Location, Scope..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setStatusFilter("unassigned")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "unassigned" ? "bg-white text-rose-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Unassigned Open Calls
            </button>
            <button
              onClick={() => setStatusFilter("assigned")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "assigned" ? "bg-white text-brand-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Inspector Assigned
            </button>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "all" ? "bg-white text-slate-900 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Calls
            </button>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-slate-600">
            <button aria-label="Table View"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-amber-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button aria-label="Card Grid View"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-amber-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Content Area */}
      {viewMode === "table" ? (
        /* Data Table View (Matching legacy HomePage.cshtml / _ViewMySchedules.cshtml) */
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Call ID</th>
                  <th className="p-3">Target Date</th>
                  <th className="p-3">Customer & Plant Site</th>
                  <th className="p-3">Vendor Works Site</th>
                  <th className="p-3">Control No / PO</th>
                  <th className="p-3">Urgency / Call Type</th>
                  <th className="p-3">Inspection Scope</th>
                  <th className="p-3">Assigned Inspector</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calls.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      No open inspection call requests found matching criteria.
                    </td>
                  </tr>
                ) : (
                  calls.map((c) => (
                    <tr key={c.visit_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-600">{c.visit_id}</td>
                      <td className="p-3 font-mono text-slate-900 font-bold">{c.scheduled_start_date ? c.scheduled_start_date.split("T")[0] : "ASAP"}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{c.customer_name || "Unassigned Customer"}</p>
                        {c.client_unit_name && <p className="text-[11px] text-slate-500">Unit: {c.client_unit_name}</p>}
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-slate-800">{c.manufacturer_name || "Unassigned Vendor"}</p>
                        {c.manufacturer_unit_name && <p className="text-[11px] text-slate-400">Works: {c.manufacturer_unit_name}</p>}
                      </td>
                      <td className="p-3 font-mono">
                        <p className="font-bold text-brand-600">{c.control_number_id || "N/A"}</p>
                        {c.po_number && <p className="text-[11px] text-slate-400">{c.po_number}</p>}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          c.visit_type === "Emergency Callout" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {c.visit_type || "High Priority"}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="text-slate-800 font-medium truncate" title={c.inspection_scope}>{c.inspection_scope}</p>
                        {c.comments && <p className="text-[11px] text-slate-400 truncate">{c.comments}</p>}
                      </td>
                      <td className="p-3">
                        {c.inspector_name ? (
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {c.inspector_name}
                          </span>
                        ) : (
                          <span className="font-bold text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          c.inspector_id ? "bg-brand-100 text-brand-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {c.inspector_id ? "Assigned" : "Open Call"}
                        </span>
                      </td>
                      <td className="p-3 text-right relative">
                        <button aria-label="More actions" title="More actions"
                          onClick={() => setActiveDropdown(activeDropdown === c.visit_id ? null : c.visit_id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Ellipsis Menu */}
                        {activeDropdown === c.visit_id && (
                          <div className="absolute right-3 top-10 z-20 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-left text-xs space-y-0.5">
                            <button
                              onClick={() => handleOpenAssignModal(c)}
                              className="w-full px-3 py-1.5 hover:bg-amber-50 text-amber-700 flex items-center gap-2 font-bold"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Assign Inspector & Schedule</span>
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
          {calls.map((c) => (
            <div
              key={c.visit_id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                    {c.visit_id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    c.inspector_id ? "bg-brand-100 text-brand-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {c.inspector_id ? "Assigned" : "Open Call"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">{c.customer_name}</h3>
                  {c.client_unit_name && <p className="text-[11px] text-slate-500">Unit: {c.client_unit_name}</p>}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <p><span className="text-slate-400">Target Date:</span> <span className="font-mono font-bold text-amber-700">{c.scheduled_start_date}</span></p>
                  <p><span className="text-slate-400">Vendor:</span> <span className="font-medium text-slate-800">{c.manufacturer_name}</span></p>
                  <p><span className="text-slate-400">Scope:</span> <span className="text-slate-700 truncate inline-block max-w-[200px]">{c.inspection_scope}</span></p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenAssignModal(c)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Assign Inspector</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log New Open Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Log Open Inspection Call (Client RFI Request)
                </h2>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowCallModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCall} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="opecal-call-request-id" className="block text-xs font-semibold text-slate-700 mb-1">Call Request ID *</label>
                  <input id="opecal-call-request-id"
                    type="text"
                    required
                    value={callId}
                    onChange={(e) => setCallId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-amber-700"
                  />
                </div>

                <div>
                  <label htmlFor="opecal-control-number-assignment" className="block text-xs font-semibold text-slate-700 mb-1">Control Number Assignment</label>
                  <select id="opecal-control-number-assignment"
                    value={selectedCNId}
                    onChange={(e) => setSelectedCNId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-brand-700"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="opecal-customer-client" className="block text-xs font-semibold text-slate-700 mb-1">Customer / Client *</label>
                  <select id="opecal-customer-client"
                    required
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  <label htmlFor="opecal-client-plant-unit-site" className="block text-xs font-semibold text-slate-700 mb-1">Client Plant Unit Site</label>
                  <select id="opecal-client-plant-unit-site"
                    value={selectedClientUnitId}
                    onChange={(e) => setSelectedClientUnitId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="opecal-supplier-manufacturer" className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Manufacturer *</label>
                  <select id="opecal-supplier-manufacturer"
                    required
                    value={selectedMfrId}
                    onChange={(e) => setSelectedMfrId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  <label htmlFor="opecal-supplier-plant-unit" className="block text-xs font-semibold text-slate-700 mb-1">Supplier Plant Unit</label>
                  <select id="opecal-supplier-plant-unit"
                    value={selectedMfrUnitId}
                    onChange={(e) => setSelectedMfrUnitId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="opecal-target-inspection-date" className="block text-xs font-semibold text-slate-700 mb-1">Target Inspection Date *</label>
                  <input id="opecal-target-inspection-date"
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label htmlFor="opecal-call-urgency-level" className="block text-xs font-semibold text-slate-700 mb-1">Call Urgency Level</label>
                  <select id="opecal-call-urgency-level"
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  >
                    {urgencyLevels.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="opecal-plant-location-3-letter-coded" className="block text-xs font-semibold text-slate-700 mb-1">Plant Location (3-Letter Coded) *</label>
                <input id="opecal-plant-location-3-letter-coded"
                  type="text"
                  required
                  value={plantLocation}
                  onChange={(e) => setPlantLocation(e.target.value)}
                  placeholder="HAZ - Hazira Industrial Zone (WST - Western Region)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label htmlFor="opecal-requested-inspection-scope" className="block text-xs font-semibold text-slate-700 mb-1">Requested Inspection Scope *</label>
                <textarea id="opecal-requested-inspection-scope"
                  rows={2}
                  required
                  value={inspectionScope}
                  onChange={(e) => setInspectionScope(e.target.value)}
                  placeholder="Specify NDT, Dimensional Audit, Hydrotest witnessing..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCallModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !callId || !selectedClientId || !plantLocation}
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Logging Call..." : "Log Open Call"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Inspector Sub-Dialog */}
      {showAssignModal && selectedCallForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Assign Lead TPI Inspector — {selectedCallForAssign.visit_id}
                </h2>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-3">
              <div>
                <label htmlFor="opecal-select-lead-tpi-inspector" className="block text-xs font-semibold text-slate-700 mb-1">Select Lead TPI Inspector *</label>
                <select id="opecal-select-lead-tpi-inspector"
                  required
                  value={assignedInspectorId}
                  onChange={(e) => setAssignedInspectorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                >
                  {sampleInspectors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="opecal-confirmed-schedule-date" className="block text-xs font-semibold text-slate-700 mb-1">Confirmed Schedule Date *</label>
                <input id="opecal-confirmed-schedule-date"
                  type="date"
                  required
                  value={scheduledStartDate}
                  onChange={(e) => setScheduledStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-sm"
                >
                  Confirm & Schedule Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
