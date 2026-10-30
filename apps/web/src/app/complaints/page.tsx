"use client";

import { useEffect, useState } from "react";
import { 
  AlertTriangle, Search, Plus, MapPin, X, CheckCircle2, 
  MoreVertical, Edit3, Power, LayoutGrid, LayoutList, RefreshCw, FileText, Download, ShieldAlert, ShieldCheck, HelpCircle, Clock, Send
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

const alphabet = ["ALL", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

const severities = ["Critical", "Major", "Minor"];
const complaintModes = ["Email", "Official Letter", "Inspection Audit", "Site Call"];
const complaintTypes = ["Quality", "Dimensional", "Delay", "NDT Defect", "Documentation"];

export default function CustomerComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [mfrs, setMfrs] = useState<any[]>([]);
  const [clientUnits, setClientUnits] = useState<any[]>([]);
  const [mfrUnits, setMfrUnits] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [selectedAlpha, setSelectedAlpha] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [loading, setLoading] = useState(true);

  // Modals State
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<any | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Update CAPA Modal
  const [showCAPAModal, setShowCAPAModal] = useState(false);
  const [selectedCMPForCAPA, setSelectedCMPForCAPA] = useState<any | null>(null);
  const [rootCause, setRootCause] = useState("");
  const [proposedAction, setProposedAction] = useState("");
  const [actionBy, setActionBy] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [capaStatus, setCapaStatus] = useState("in_progress");

  // Form State for Log New Complaint
  const [complaintId, setComplaintId] = useState("");
  const [identificationNo, setIdentificationNo] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedClientUnitId, setSelectedClientUnitId] = useState("");
  const [selectedMfrId, setSelectedMfrId] = useState("");
  const [selectedMfrUnitId, setSelectedMfrUnitId] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [jobTagNo, setJobTagNo] = useState("");
  const [poWoNumber, setPoWoNumber] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [severity, setSeverity] = useState("Major");
  const [description, setDescription] = useState("");
  const [complaintMode, setComplaintMode] = useState("Email");
  const [complaintType, setComplaintType] = useState("Quality");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComplaints();
    loadDropdownData();
  }, [search, selectedAlpha, statusFilter]);

  async function loadDropdownData() {
    try {
      const cRes = await api.listClients({ per_page: 200 });
      setClients(cRes.data || []);
      const mRes = await api.listManufacturers({ per_page: 200 });
      setMfrs(mRes.data || []);
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

  async function loadComplaints() {
    setLoading(true);
    try {
      const activeParam = statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined;
      const r = await api.listComplaints({ 
        search, 
        alpha: selectedAlpha === "ALL" ? "" : selectedAlpha,
        is_active: activeParam,
        per_page: 200 
      });
      setComplaints(r.data || []);
    } catch (e) {
      console.error(e);
      // Fallback sample customer complaints
      setComplaints([
        {
          complaint_id: "CMP-2026-001",
          identification_no: "CID-RIL-901",
          client_id: "C-001",
          customer_name: "Reliance Industries Ltd",
          client_unit_name: "Reliance - Unit 1 (Hazira Heavy Fabrication Yard)",
          manufacturer_id: "M-001",
          manufacturer_name: "BHEL Trichy Boilers",
          manufacturer_unit_name: "BHEL - Works 1 (Heavy Forging & Casting Shop)",
          equipment_name: "90 Degree Forged Pipe Elbows (DN150 PN40)",
          job_tag_no: "TAG-ELB-901 / Heat H-8891",
          po_wo_number: "PO/RIL/2026/094",
          received_date: "2026-07-20",
          severity: "Major",
          description: "Surface pitting observed on bevel end preparation during pre-weld fitup inspection.",
          root_cause: "Improper protective plastic cap sealing during transit storage resulting in atmospheric moisture exposure.",
          proposed_action: "Re-machining of bevel ends to ASME B16.25 standards under TPI engineer supervision.",
          action_by: "BHEL Quality Team Lead",
          closing_date: "2026-07-28",
          resolution_notes: "Bevel re-machined & 100% PT verified. Inspection Release Note issued.",
          remarks: "CAPA verified and closed satisfactorily.",
          file_name: "NCR_Bevel_Defect_Report.pdf",
          complaint_mode: "Email",
          complaint_type: "Quality",
          status: "closed",
          is_active: false,
        },
        {
          complaint_id: "CMP-2026-002",
          identification_no: "CID-LNT-904",
          client_id: "C-002",
          customer_name: "L&T Heavy Engineering",
          client_unit_name: "L&T - Unit 2 (Jamnagar Refinery Expansion Site)",
          manufacturer_id: "M-002",
          manufacturer_name: "Godrej Heavy Engineering",
          manufacturer_unit_name: "Godrej - Works 2 (High Pressure Boiler & Vessel Shop)",
          equipment_name: "High Pressure Seamless Heat Exchanger Tubes",
          job_tag_no: "TAG-TB-102 / Spool S-441",
          po_wo_number: "PO/LNT/2026/441",
          received_date: "2026-08-01",
          severity: "Critical",
          description: "Wall thickness variation detected below minimum ASME Sec VIII Div 1 design tolerance during Eddy Current audit.",
          root_cause: "Tooling calibration drift during final tube drawing pass at manufacturing works.",
          proposed_action: "Hold batch shipment; 100% ultrasonic thickness re-audit for all 250 tubes in batch.",
          action_by: "Godrej Metallurgical Head",
          remarks: "Under investigation by senior TPI metallurgist.",
          file_name: "Eddy_Current_Audit_Deviation.pdf",
          complaint_mode: "Inspection Audit",
          complaint_type: "Dimensional",
          status: "in_progress",
          is_active: true,
        },
        {
          complaint_id: "CMP-2026-003",
          identification_no: "CID-ONGC-910",
          client_id: "C-003",
          customer_name: "ONGC Offshore Project",
          client_unit_name: "ONGC - Unit 3 (Chennai Subsea Integration Works)",
          manufacturer_id: "M-003",
          manufacturer_name: "ISGEC Heavy Engineering",
          manufacturer_unit_name: "ISGEC - Works 1 (Heavy Forging & Casting Shop)",
          equipment_name: "Offshore Subsea Manifolds & Valve Assemblies",
          job_tag_no: "TAG-VAL-990 / Skid 03",
          po_wo_number: "PO/ONGC/2026/812",
          received_date: "2026-08-05",
          severity: "Minor",
          description: "Delay in submitting Hydrotest Witnessing Records & Material Test Reports (MTR).",
          root_cause: "Documentation back-log at vendor quality documentation desk.",
          proposed_action: "Deploy dedicated digital document coordinator to expedite MTR compilation.",
          action_by: "ISGEC Documentation Lead",
          remarks: "Draft MTRs received; awaiting final signature stamp.",
          file_name: "MTR_Delay_Notice.pdf",
          complaint_mode: "Official Letter",
          complaint_type: "Documentation",
          status: "open",
          is_active: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingComplaint(null);
    setComplaintId(`CMP-2026-${(complaints.length + 1).toString().padStart(3, "0")}`);
    setIdentificationNo(`CID-GEN-${(900 + complaints.length + 1)}`);
    setSelectedClientId("");
    setSelectedClientUnitId("");
    setSelectedMfrId("");
    setSelectedMfrUnitId("");
    setEquipmentName("");
    setJobTagNo("");
    setPoWoNumber("");
    setReceivedDate(new Date().toISOString().split("T")[0]);
    setSeverity("Major");
    setDescription("");
    setRootCause("");
    setProposedAction("");
    setActionBy("");
    setComplaintMode("Email");
    setComplaintType("Quality");
    setRemarks("");
    setShowComplaintModal(true);
  };

  const handleOpenEditModal = (c: any) => {
    setEditingComplaint(c);
    setComplaintId(c.complaint_id || "");
    setIdentificationNo(c.identification_no || "");
    setSelectedClientId(c.client_id || "");
    setSelectedClientUnitId(c.client_unit_id || "");
    setSelectedMfrId(c.manufacturer_id || "");
    setSelectedMfrUnitId(c.manufacturer_unit_id || "");
    setEquipmentName(c.equipment_name || "");
    setJobTagNo(c.job_tag_no || "");
    setPoWoNumber(c.po_wo_number || "");
    setReceivedDate(c.received_date ? c.received_date.split("T")[0] : "");
    setSeverity(c.severity || "Major");
    setDescription(c.description || "");
    setRootCause(c.root_cause || "");
    setProposedAction(c.proposed_action || "");
    setActionBy(c.action_by || "");
    setComplaintMode(c.complaint_mode || "Email");
    setComplaintType(c.complaint_type || "Quality");
    setRemarks(c.remarks || "");
    setShowComplaintModal(true);
    setActiveDropdown(null);
  };

  const handleSaveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const clientObj = clients.find((c) => c.client_id === selectedClientId);
    const clientUnitObj = clientUnits.find((u) => u.client_unit_id === selectedClientUnitId);
    const mfrObj = mfrs.find((m) => m.manufacturer_id === selectedMfrId);
    const mfrUnitObj = mfrUnits.find((u) => u.manufacturer_unit_id === selectedMfrUnitId);

    const payload = {
      complaint_id: complaintId,
      identification_no: identificationNo,
      client_id: selectedClientId,
      customer_name: clientObj ? clientObj.name : undefined,
      client_unit_id: selectedClientUnitId,
      client_unit_name: clientUnitObj ? clientUnitObj.name : undefined,
      manufacturer_id: selectedMfrId,
      manufacturer_name: mfrObj ? mfrObj.name : undefined,
      manufacturer_unit_id: selectedMfrUnitId,
      manufacturer_unit_name: mfrUnitObj ? mfrUnitObj.name : undefined,
      equipment_name: equipmentName,
      job_tag_no: jobTagNo,
      po_wo_number: poWoNumber,
      received_date: receivedDate || undefined,
      severity,
      description,
      root_cause: rootCause,
      proposed_action: proposedAction,
      action_by: actionBy,
      complaint_mode: complaintMode,
      complaint_type: complaintType,
      remarks,
    };

    try {
      if (editingComplaint) {
        await api.updateComplaint(editingComplaint.complaint_id, payload);
      } else {
        await api.createComplaint(payload);
      }
      setShowComplaintModal(false);
      loadComplaints();
    } catch (err) {
      console.error("Failed to save Customer Complaint:", err);
      toast.error("Couldn't save the customer complaint. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (c: any) => {
    try {
      await api.updateComplaintStatus(c.complaint_id, !c.is_active);
      loadComplaints();
    } catch (e) {
      console.error(e);
    } finally {
      setActiveDropdown(null);
    }
  };

  // Open Update CAPA Sub-Dialog
  const handleOpenCAPAModal = (c: any) => {
    setSelectedCMPForCAPA(c);
    setRootCause(c.root_cause || "");
    setProposedAction(c.proposed_action || "");
    setActionBy(c.action_by || "");
    setResolutionNotes(c.resolution_notes || "");
    setClosingDate(c.closing_date ? c.closing_date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setCapaStatus(c.status || "in_progress");
    setShowCAPAModal(true);
    setActiveDropdown(null);
  };

  const handleSaveCAPA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCMPForCAPA) return;
    try {
      await api.updateComplaint(selectedCMPForCAPA.complaint_id, {
        root_cause: rootCause,
        proposed_action: proposedAction,
        action_by: actionBy,
        resolution_notes: resolutionNotes,
        closing_date: closingDate || undefined,
        status: capaStatus,
        is_active: capaStatus !== "closed",
      });
      setShowCAPAModal(false);
      loadComplaints();
    } catch (e) {
      console.error("Failed to update CAPA details", e);
      toast.error("Couldn't update the root cause and CAPA details. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Customer Complaints & CAPA Registry</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold font-mono">
              {complaints.length} Quality Grievances
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Customer non-conformance registry, Root Cause Analysis (RCA), Corrective & Preventive Action (CAPA) tracking
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button aria-label="Refresh Registry"
            onClick={loadComplaints}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-semibold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Log Customer Complaint</span>
          </button>
        </div>
      </div>

      {/* Alphabetical A-Z Jump Bar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alphabetical Customer Index</span>
          <span className="text-[11px] font-mono text-rose-600 font-semibold">Filter by Customer or Vendor initial</span>
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
                    ? "bg-rose-600 text-white shadow-sm scale-105"
                    : "bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/60"
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
            placeholder="Search by Complaint ID (CMP-2026-001), Customer, Supplier, PO No, Equipment, Tag No, RCA..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "active" ? "bg-white text-rose-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Open & Active
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "inactive" ? "bg-white text-emerald-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Resolved & Closed
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
            <button aria-label="Table View"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-rose-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button aria-label="Card Grid View"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-rose-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Content Area */}
      {viewMode === "table" ? (
        /* Data Table View (Matching _CustomerComplaintDirectory.cshtml) */
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Complaint ID</th>
                  <th className="p-3">Received Date</th>
                  <th className="p-3">Customer & Unit Details</th>
                  <th className="p-3">PO / WO No</th>
                  <th className="p-3">Equipment / Defect Description</th>
                  <th className="p-3">Job / Tag No</th>
                  <th className="p-3">Root Cause (CAPA)</th>
                  <th className="p-3">Closing Date</th>
                  <th className="p-3">Document</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      No customer complaint records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c.complaint_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-rose-600">{c.complaint_id}</td>
                      <td className="p-3 font-mono text-slate-700">{c.received_date ? c.received_date.split("T")[0] : "N/A"}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{c.customer_name || "Unassigned Customer"}</p>
                        {c.client_unit_name && <p className="text-[11px] text-slate-500">Unit: {c.client_unit_name}</p>}
                        {c.manufacturer_name && <p className="text-[11px] text-slate-400">Supplier: {c.manufacturer_name}</p>}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">{c.po_wo_number || "N/A"}</td>
                      <td className="p-3 max-w-xs">
                        <p className="font-bold text-slate-800 truncate" title={c.equipment_name}>{c.equipment_name || "General Equipment"}</p>
                        <p className="text-[11px] text-slate-600 truncate" title={c.description}>{c.description}</p>
                      </td>
                      <td className="p-3 font-mono text-purple-700 font-medium">{c.job_tag_no || "N/A"}</td>
                      <td className="p-3 max-w-xs">
                        <p className="text-slate-800 font-medium truncate" title={c.root_cause}>{c.root_cause || "Pending RCA investigation"}</p>
                        {c.proposed_action && <p className="text-[11px] text-emerald-700 truncate" title={c.proposed_action}>CAPA: {c.proposed_action}</p>}
                      </td>
                      <td className="p-3 font-mono text-slate-700">{c.closing_date ? c.closing_date.split("T")[0] : "Open"}</td>
                      <td className="p-3">
                        {c.file_name ? (
                          <span className="inline-flex items-center gap-1 text-brand-600 hover:underline font-mono text-[11px] cursor-pointer">
                            <FileText className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[100px]">{c.file_name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          c.status === "closed" ? "bg-emerald-100 text-emerald-800" :
                          c.status === "in_progress" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {c.status === "closed" ? "Closed & Resolved" : c.status === "in_progress" ? "Under Investigation" : "Open"}
                        </span>
                      </td>
                      <td className="p-3 text-right relative">
                        <button aria-label="More actions" title="More actions"
                          onClick={() => setActiveDropdown(activeDropdown === c.complaint_id ? null : c.complaint_id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Ellipsis Menu */}
                        {activeDropdown === c.complaint_id && (
                          <div className="absolute right-3 top-10 z-20 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-left text-xs space-y-0.5">
                            <button
                              onClick={() => handleOpenCAPAModal(c)}
                              className="w-full px-3 py-1.5 hover:bg-rose-50 text-rose-700 flex items-center gap-2 font-bold"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Update Root Cause & CAPA</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(c)}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                              <span>Edit Complaint Details</span>
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              onClick={() => handleToggleStatus(c)}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                            >
                              <Power className={`w-3.5 h-3.5 ${c.is_active !== false ? "text-emerald-600" : "text-rose-600"}`} />
                              <span>{c.is_active !== false ? "Close Complaint" : "Re-open Complaint"}</span>
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
          {complaints.map((c) => (
            <div
              key={c.complaint_id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg">
                    {c.complaint_id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    c.status === "closed" ? "bg-emerald-100 text-emerald-800" :
                    c.status === "in_progress" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {c.status === "closed" ? "Closed & Resolved" : c.status === "in_progress" ? "Under Investigation" : "Open"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">{c.customer_name}</h3>
                  {c.client_unit_name && <p className="text-[11px] text-slate-500">Unit: {c.client_unit_name}</p>}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <p><span className="text-slate-400">Equipment:</span> <span className="font-bold text-slate-800">{c.equipment_name}</span></p>
                  <p><span className="text-slate-400">Defect:</span> <span className="text-slate-700 font-medium truncate inline-block max-w-[200px]">{c.description}</span></p>
                  <p><span className="text-slate-400">Root Cause (RCA):</span> <span className="text-slate-800 font-medium truncate inline-block max-w-[200px]">{c.root_cause || "Under Investigation"}</span></p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenCAPAModal(c)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors flex items-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Update CAPA</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(c)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log New / Edit Customer Complaint Modal (_AddCustomerComplaint.cshtml) */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {editingComplaint ? `Edit Complaint Details (${editingComplaint.complaint_id})` : "Log New Customer Complaint & Quality Grievance"}
                </h2>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowComplaintModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveComplaint} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="com-complaint-id" className="block text-xs font-semibold text-slate-700 mb-1">Complaint ID *</label>
                  <input id="com-complaint-id"
                    type="text"
                    required
                    value={complaintId}
                    onChange={(e) => setComplaintId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold text-rose-700"
                  />
                </div>

                <div>
                  <label htmlFor="com-complaint-identification-no" className="block text-xs font-semibold text-slate-700 mb-1">Complaint Identification No</label>
                  <input id="com-complaint-identification-no"
                    type="text"
                    value={identificationNo}
                    onChange={(e) => setIdentificationNo(e.target.value)}
                    placeholder="e.g. CID-RIL-901"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="com-customer-name" className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                  <select id="com-customer-name"
                    required
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Select Corporate Customer</option>
                    {clients.map((c) => (
                      <option key={c.client_id} value={c.client_id}>
                        {c.name} ({c.client_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="com-customer-plant-unit-site" className="block text-xs font-semibold text-slate-700 mb-1">Customer Plant Unit Site</label>
                  <select id="com-customer-plant-unit-site"
                    value={selectedClientUnitId}
                    onChange={(e) => setSelectedClientUnitId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                  <label htmlFor="com-supplier-manufacturer" className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Manufacturer</label>
                  <select id="com-supplier-manufacturer"
                    value={selectedMfrId}
                    onChange={(e) => setSelectedMfrId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                  <label htmlFor="com-supplier-plant-unit" className="block text-xs font-semibold text-slate-700 mb-1">Supplier Plant Unit</label>
                  <select id="com-supplier-plant-unit"
                    value={selectedMfrUnitId}
                    onChange={(e) => setSelectedMfrUnitId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="com-equipment-name" className="block text-xs font-semibold text-slate-700 mb-1">Equipment Name *</label>
                  <input id="com-equipment-name"
                    type="text"
                    required
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    placeholder="90 Degree Forged Elbows"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label htmlFor="com-job-tag-no" className="block text-xs font-semibold text-slate-700 mb-1">Job / Tag No</label>
                  <input id="com-job-tag-no"
                    type="text"
                    value={jobTagNo}
                    onChange={(e) => setJobTagNo(e.target.value)}
                    placeholder="TAG-ELB-901 / Heat H-8891"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="com-po-wo-number" className="block text-xs font-semibold text-slate-700 mb-1">PO / WO Number</label>
                  <input id="com-po-wo-number"
                    type="text"
                    value={poWoNumber}
                    onChange={(e) => setPoWoNumber(e.target.value)}
                    placeholder="PO/RIL/2026/094"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="com-received-date" className="block text-xs font-semibold text-slate-700 mb-1">Received Date</label>
                  <input id="com-received-date"
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label htmlFor="com-severity-level" className="block text-xs font-semibold text-slate-700 mb-1">Severity Level</label>
                  <select id="com-severity-level"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  >
                    {severities.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="com-complaint-type" className="block text-xs font-semibold text-slate-700 mb-1">Complaint Type</label>
                  <select id="com-complaint-type"
                    value={complaintType}
                    onChange={(e) => setComplaintType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {complaintTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="com-detailed-complaint-description" className="block text-xs font-semibold text-slate-700 mb-1">Detailed Complaint Description *</label>
                <textarea id="com-detailed-complaint-description"
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the non-conformance, physical defect, or dimensional deviation reported..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="com-initial-root-cause-analysis-rca" className="block text-xs font-semibold text-slate-700 mb-1">Initial Root Cause Analysis (RCA)</label>
                  <input id="com-initial-root-cause-analysis-rca"
                    type="text"
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="e.g. Atmospheric exposure during transit"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label htmlFor="com-proposed-action-capa" className="block text-xs font-semibold text-slate-700 mb-1">Proposed Action (CAPA)</label>
                  <input id="com-proposed-action-capa"
                    type="text"
                    value={proposedAction}
                    onChange={(e) => setProposedAction(e.target.value)}
                    placeholder="e.g. Re-machining bevels under TPI witnessing"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !complaintId || !selectedClientId || !equipmentName || !description}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Saving..." : "Log Complaint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Root Cause & CAPA Sub-Dialog (_EditCustomerComplaint.cshtml) */}
      {showCAPAModal && selectedCMPForCAPA && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Update Root Cause & CAPA — {selectedCMPForCAPA.complaint_id}
                </h2>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowCAPAModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCAPA} className="space-y-3">
              <div>
                <label htmlFor="com-root-cause-analysis-rca" className="block text-xs font-semibold text-slate-700 mb-1">Root Cause Analysis (RCA) *</label>
                <textarea id="com-root-cause-analysis-rca"
                  rows={2}
                  required
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Identify root technical cause..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label htmlFor="com-corrective-preventive-action-capa" className="block text-xs font-semibold text-slate-700 mb-1">Corrective & Preventive Action (CAPA) *</label>
                <textarea id="com-corrective-preventive-action-capa"
                  rows={2}
                  required
                  value={proposedAction}
                  onChange={(e) => setProposedAction(e.target.value)}
                  placeholder="Specify immediate corrective action and long-term preventive measures..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="com-responsible-party-lead" className="block text-xs font-semibold text-slate-700 mb-1">Responsible Party / Lead</label>
                  <input id="com-responsible-party-lead"
                    type="text"
                    value={actionBy}
                    onChange={(e) => setActionBy(e.target.value)}
                    placeholder="e.g. BHEL Quality Lead"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label htmlFor="com-resolution-status" className="block text-xs font-semibold text-slate-700 mb-1">Resolution Status</label>
                  <select id="com-resolution-status"
                    value={capaStatus}
                    onChange={(e) => setCapaStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">Under Investigation</option>
                    <option value="capa_implemented">CAPA Implemented</option>
                    <option value="closed">Closed & Resolved</option>
                  </select>
                </div>
              </div>

              {capaStatus === "closed" && (
                <div>
                  <label htmlFor="com-closing-date" className="block text-xs font-semibold text-slate-700 mb-1">Closing Date</label>
                  <input id="com-closing-date"
                    type="date"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div>
                <label htmlFor="com-final-resolution-notes" className="block text-xs font-semibold text-slate-700 mb-1">Final Resolution Notes</label>
                <textarea id="com-final-resolution-notes"
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record client sign-off, IRN details, or final closeout comments..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCAPAModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-sm"
                >
                  Save CAPA Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
