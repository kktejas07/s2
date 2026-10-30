"use client";

import { useEffect, useState } from "react";
import { 
  FileText, Search, Plus, MapPin, Mail, Phone, X, CheckCircle2, 
  MoreVertical, Edit3, Power, Layers, LayoutGrid, LayoutList, RefreshCw, Factory, Tag, Globe, Compass, DollarSign, Calendar, ArrowRight, ShieldCheck, FileCheck, Repeat, Download, Eye, FileSpreadsheet, ExternalLink
} from "@/components/icons";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

const alphabet = ["ALL", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

const soTypes = ["Regular", "Man-Day", "Lump-Sum", "Hourly Callout"];

export default function ControlNumbersPage() {
  const router = useRouter();
  const [cns, setCns] = useState<any[]>([]);
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
  const [showCNModal, setShowCNModal] = useState(false);
  const [editingCN, setEditingCN] = useState<any | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // View Row Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCNForDetails, setSelectedCNForDetails] = useState<any | null>(null);

  // Update LOI / SO Sub-Dialog
  const [showSOModal, setShowSOModal] = useState(false);
  const [selectedCNForSO, setSelectedCNForSO] = useState<any | null>(null);
  const [loiNo, setLoiNo] = useState("");
  const [loiDate, setLoiDate] = useState("");
  const [soNumber, setSoNumber] = useState("");
  const [soEffDate, setSoEffDate] = useState("");
  const [soDueDate, setSoDueDate] = useState("");
  const [soType, setSoType] = useState("Regular");

  // Reassign CN Modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedCNForReassign, setSelectedCNForReassign] = useState<any | null>(null);
  const [newCNId, setNewCNId] = useState("");
  const [reassignReason, setReassignReason] = useState("");

  // Previous Visits Modal State
  const [showVisitsModal, setShowVisitsModal] = useState(false);
  const [selectedCNForVisits, setSelectedCNForVisits] = useState<any | null>(null);
  const [cnVisits, setCnVisits] = useState<any[]>([]);

  // Form State for Add / Edit Control Number
  const [controlNumberId, setControlNumberId] = useState("");
  const [enquiryNo, setEnquiryNo] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedClientUnitId, setSelectedClientUnitId] = useState("");
  const [selectedMfrId, setSelectedMfrId] = useState("");
  const [selectedMfrUnitId, setSelectedMfrUnitId] = useState("");
  const [workScope, setWorkScope] = useState("");
  const [location, setLocation] = useState("");
  const [contractAmount, setContractAmount] = useState(0);
  const [comments, setComments] = useState("");
  const [raBillRef, setRaBillRef] = useState("RA-BILL-001");
  const [claimedQty, setClaimedQty] = useState<number | string>(10);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCNs();
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

  async function loadCNs() {
    setLoading(true);
    try {
      const activeParam = statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined;
      const r = await api.listControlNumbers({ 
        search, 
        alpha: selectedAlpha === "ALL" ? "" : selectedAlpha,
        is_active: activeParam,
        per_page: 200 
      });
      setCns(r.data || []);
    } catch (e) {
      console.error(e);
      setCns([
        { 
          control_number_id: "CN-2026-001", 
          control_number: "CN-2026-001", 
          enquiry_no: "ENQ-901", 
          equipment_name: "90 Degree Forged Pipe Elbows (DN150 PN40)", 
          client_id: "C-001", 
          client_name: "Reliance Industries Ltd", 
          client_unit_name: "Reliance - Unit 1 (Hazira Heavy Fabrication Yard)", 
          manufacturer_id: "M-001", 
          manufacturer_name: "BHEL Trichy Boilers", 
          manufacturer_unit_name: "BHEL - Works 1 (Heavy Forging & Casting Shop)", 
          loi_no: "LOI/RIL/2026/102", 
          loi_date: "2026-06-15", 
          so_number: "SO-8890", 
          so_effective_date: "2026-07-01", 
          so_due_date: "2026-12-31", 
          so_type: "Regular", 
          work_scope: "Full TPI Stage Inspection, NDT Radiography & Hydrotest Witnessing", 
          location: "HAZ - Hazira Industrial Zone (WST - Western Region)", 
          contract_amount: 4500000, 
          ra_bill_ref: "RA-BILL-001",
          claimed_qty: 15,
          comments: "Mandatory 48-hour prior visit call by TPI Inspector", 
          is_active: true, 
          created_at: "2026-07-01" 
        },
        { 
          control_number_id: "CN-2026-002", 
          control_number: "CN-2026-002", 
          enquiry_no: "ENQ-904", 
          equipment_name: "High Pressure Seamless Heat Exchanger Tubes", 
          client_id: "C-002", 
          client_name: "L&T Heavy Engineering", 
          client_unit_name: "L&T - Unit 2 (Jamnagar Refinery Expansion Site)", 
          manufacturer_id: "M-002", 
          manufacturer_name: "Godrej Heavy Engineering", 
          manufacturer_unit_name: "Godrej - Works 2 (High Pressure Boiler & Vessel Shop)", 
          loi_no: "LOI/LNT/2026/440", 
          loi_date: "2026-06-20", 
          so_number: "SO-8892", 
          so_effective_date: "2026-07-10", 
          so_due_date: "2026-11-30", 
          so_type: "Man-Day", 
          work_scope: "Eddy Current Testing, Positive Material Identification (PMI), & Mill Cert Audit", 
          location: "JAM - Jamnagar Petrochemical Complex (WST - Western Region)", 
          contract_amount: 2800000, 
          ra_bill_ref: "RA-BILL-002",
          claimed_qty: 40,
          comments: "Man-day rate basis: 8 hours per shift inspection call", 
          is_active: true, 
          created_at: "2026-07-10" 
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingCN(null);
    setControlNumberId(`CN-2026-${(cns.length + 1).toString().padStart(3, "0")}`);
    setEnquiryNo(`ENQ-${(900 + cns.length + 1)}`);
    setEquipmentName("");
    setSelectedClientId("");
    setSelectedClientUnitId("");
    setSelectedMfrId("");
    setSelectedMfrUnitId("");
    setWorkScope("Full TPI Stage Inspection, Dimensional Verification & Hydrotest Witnessing");
    setLocation("HAZ - Hazira Industrial Zone (WST - Western Region)");
    setContractAmount(0);
    setComments("");
    setRaBillRef(`RA-BILL-${(cns.length + 1).toString().padStart(3, "0")}`);
    setClaimedQty(10);
    setLoiNo("");
    setLoiDate(new Date().toISOString().split("T")[0]);
    setSoNumber(`SO-${(8890 + cns.length + 1)}`);
    setSoEffDate(new Date().toISOString().split("T")[0]);
    setSoDueDate("");
    setSoType("Regular");
    setShowCNModal(true);
  };

  const handleOpenEditModal = (cn: any) => {
    setEditingCN(cn);
    setControlNumberId(cn.control_number_id || "");
    setEnquiryNo(cn.enquiry_no || "");
    setEquipmentName(cn.equipment_name || "");
    setSelectedClientId(cn.client_id || "");
    setSelectedClientUnitId(cn.client_unit_id || "");
    setSelectedMfrId(cn.manufacturer_id || "");
    setSelectedMfrUnitId(cn.manufacturer_unit_id || "");
    setWorkScope(cn.work_scope || "");
    setLocation(cn.location || "");
    setContractAmount(cn.contract_amount || 0);
    setComments(cn.comments || "");
    setRaBillRef(cn.ra_bill_ref || "RA-BILL-001");
    setClaimedQty(cn.claimed_qty || 10);
    setLoiNo(cn.loi_no || "");
    setLoiDate(cn.loi_date ? cn.loi_date.split("T")[0] : "");
    setSoNumber(cn.so_number || "");
    setSoEffDate(cn.so_effective_date ? cn.so_effective_date.split("T")[0] : "");
    setSoDueDate(cn.so_due_date ? cn.so_due_date.split("T")[0] : "");
    setSoType(cn.so_type || "Regular");
    setShowCNModal(true);
    setActiveDropdown(null);
  };

  const handleOpenViewDetailsModal = (cn: any) => {
    setSelectedCNForDetails(cn);
    setShowDetailsModal(true);
    setActiveDropdown(null);
  };

  const handleExportWholeListCSV = () => {
    if (!cns || cns.length === 0) return;
    const headers = [
      "Control Number ID", "Enquiry No", "Equipment Name / Item Description", "Client Name", "Client Unit", 
      "Manufacturer Name", "Manufacturer Unit", "LOI Ref No", "SO Number", "SO Type", 
      "Contract Amount ₹", "Location", "RA Bill Ref", "Claimed Qty", "Status"
    ];
    const rows = cns.map((cn) => [
      cn.control_number_id || "",
      cn.enquiry_no || "",
      `"${(cn.equipment_name || "").replace(/"/g, '""')}"`,
      `"${(cn.client_name || "").replace(/"/g, '""')}"`,
      `"${(cn.client_unit_name || "").replace(/"/g, '""')}"`,
      `"${(cn.manufacturer_name || "").replace(/"/g, '""')}"`,
      `"${(cn.manufacturer_unit_name || "").replace(/"/g, '""')}"`,
      cn.loi_no || "",
      cn.so_number || "",
      cn.so_type || "Regular",
      cn.contract_amount || 0,
      `"${(cn.location || "").replace(/"/g, '""')}"`,
      cn.ra_bill_ref || "RA-BILL-001",
      cn.claimed_qty || 10,
      cn.is_active ? "Active" : "Closed"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Control_Numbers_List_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSingleRowCSV = (cn: any) => {
    const data = [
      ["Control Number ID", cn.control_number_id || ""],
      ["Enquiry No", cn.enquiry_no || ""],
      ["Equipment Name / Item Description", cn.equipment_name || ""],
      ["Client Name", cn.client_name || ""],
      ["Client Unit / Plant Site", cn.client_unit_name || ""],
      ["Manufacturer / Vendor", cn.manufacturer_name || ""],
      ["Vendor Works Site", cn.manufacturer_unit_name || ""],
      ["LOI Ref Number", cn.loi_no || ""],
      ["LOI Date", cn.loi_date || ""],
      ["SO Number", cn.so_number || ""],
      ["SO Effective Date", cn.so_effective_date || ""],
      ["SO Due Date", cn.so_due_date || ""],
      ["SO Type Basis", cn.so_type || "Regular"],
      ["Verification Scope / Work Scope", cn.work_scope || ""],
      ["Location of Work", cn.location || ""],
      ["RA Bill Ref No", cn.ra_bill_ref || "RA-BILL-001"],
      ["Claimed Qty", cn.claimed_qty || 10],
      ["Verified Rate / Contract Amount (₹)", cn.contract_amount || 0],
      ["Verification Remarks / Comments", cn.comments || ""],
      ["Status", cn.is_active ? "Active" : "Closed"],
      ["Created At", cn.created_at || ""]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + data.map((e) => `"${e[0]}","${(e[1] + "").replace(/"/g, '""')}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Record_${cn.control_number_id || "CN"}_Details.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveCN = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const clientObj = clients.find((c) => c.client_id === selectedClientId);
    const clientUnitObj = clientUnits.find((u) => u.client_unit_id === selectedClientUnitId);
    const mfrObj = mfrs.find((m) => m.manufacturer_id === selectedMfrId);
    const mfrUnitObj = mfrUnits.find((u) => u.manufacturer_unit_id === selectedMfrUnitId);

    const payload = {
      control_number_id: controlNumberId,
      control_number: controlNumberId,
      enquiry_no: enquiryNo,
      equipment_name: equipmentName,
      client_id: selectedClientId,
      client_name: clientObj ? clientObj.name : undefined,
      client_unit_id: selectedClientUnitId,
      client_unit_name: clientUnitObj ? clientUnitObj.name : undefined,
      manufacturer_id: selectedMfrId,
      manufacturer_name: mfrObj ? mfrObj.name : undefined,
      manufacturer_unit_id: selectedMfrUnitId,
      manufacturer_unit_name: mfrUnitObj ? mfrUnitObj.name : undefined,
      loi_no: loiNo,
      loi_date: loiDate || undefined,
      so_number: soNumber,
      so_effective_date: soEffDate || undefined,
      so_due_date: soDueDate || undefined,
      so_type: soType,
      work_scope: workScope,
      location,
      contract_amount: Number(contractAmount),
      ra_bill_ref: raBillRef,
      claimed_qty: claimedQty,
      comments,
    };

    try {
      if (editingCN) {
        await api.updateControlNumber(editingCN.control_number_id, payload);
      } else {
        await api.createControlNumber(payload);
      }
      setShowCNModal(false);
      loadCNs();
    } catch (err) {
      console.error(err);
      toast.error(editingCN ? "Couldn't update the control number. Please try again." : "Couldn't generate the control number. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Control Numbers &amp; Enquiry Bill Verification</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold font-mono">
              {cns.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage, edit, view details, and export row records and whole list reports with 6 core bill verification fields
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button aria-label="Refresh Registry"
            onClick={loadCNs}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleExportWholeListCSV}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold text-xs shadow-sm hover:bg-slate-50 transition-all flex items-center gap-1.5"
            title="Download Entire Table to CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Entire List (CSV)</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 text-white font-semibold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Control Number</span>
          </button>
        </div>
      </div>

      {/* Alphabetical A-Z Jump Bar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alphabetical Customer Index</span>
          <span className="text-[11px] font-mono text-brand-600 font-semibold">Filter by Customer or Supplier initial</span>
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
                    ? "bg-brand-600 text-white shadow-sm scale-105"
                    : "bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-600 border border-slate-200/60"
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
            placeholder="Search by Control No (CN-2026-001), Customer, Supplier, LOI/SO Ref, Scope, Location..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "active" ? "bg-white text-brand-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "inactive" ? "bg-white text-rose-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Closed
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
              className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-brand-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button aria-label="Card Grid View"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-brand-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Content Area */}
      {viewMode === "table" ? (
        /* Data Table View */
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Control No / Enquiry</th>
                  <th className="p-3">Customer Details &amp; Plant Unit</th>
                  <th className="p-3">Supplier Details &amp; Works Site</th>
                  <th className="p-3">LOI / SO Ref &amp; Basis</th>
                  <th className="p-3">Bill Verification &amp; Scope</th>
                  <th className="p-3">Contract Value ₹</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No control number records found matching search filters.
                    </td>
                  </tr>
                ) : (
                  cns.map((cn) => (
                    <tr key={cn.control_number_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-brand-600">
                        <p>{cn.control_number_id}</p>
                        <span className="text-[11px] text-slate-500">{cn.enquiry_no || "ENQ-901"}</span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="font-bold text-slate-900">{cn.client_name || "Reliance Industries Ltd"}</p>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{cn.client_unit_name || "Hazira Plant Yard"}</p>
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="font-bold text-slate-900">{cn.manufacturer_name || "BHEL Trichy"}</p>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{cn.manufacturer_unit_name || "Forging Works"}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{cn.so_number || "SO-8890"}</p>
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold">
                          {cn.so_type || "Regular"}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="font-bold text-slate-900 truncate">{cn.equipment_name || "Pipe Elbows Audit"}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-emerald-700 font-mono">
                          <span>Ref: {cn.ra_bill_ref || "RA-BILL-001"}</span>
                          <span>• Qty: {cn.claimed_qty || 10}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        ₹{(cn.contract_amount || 0).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          cn.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                        }`}>
                          {cn.is_active ? "Active" : "Closed"}
                        </span>
                      </td>
                      <td className="p-3 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <button aria-label="View Full Details"
                            onClick={() => handleOpenViewDetailsModal(cn)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-brand-600 transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button aria-label="Edit Row"
                            onClick={() => handleOpenEditModal(cn)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors"
                            title="Edit Row"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button aria-label="Download Single Row (CSV)"
                            onClick={() => handleExportSingleRowCSV(cn)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-emerald-600 transition-colors"
                            title="Download Single Row (CSV)"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button aria-label="More actions" title="More actions"
                            onClick={() => setActiveDropdown(activeDropdown === cn.control_number_id ? null : cn.control_number_id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Ellipsis Action Menu */}
                        {activeDropdown === cn.control_number_id && (
                          <div className="absolute right-3 top-10 z-20 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-left text-xs space-y-0.5">
                            <button
                              onClick={() => handleOpenViewDetailsModal(cn)}
                              className="w-full px-3 py-1.5 hover:bg-slate-100 text-slate-700 flex items-center gap-2 font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5 text-brand-600" />
                              <span>View Full Row Details</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(cn)}
                              className="w-full px-3 py-1.5 hover:bg-blue-50 text-blue-700 flex items-center gap-2 font-semibold"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Row Details</span>
                            </button>

                            <button
                              onClick={() => handleExportSingleRowCSV(cn)}
                              className="w-full px-3 py-1.5 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 font-semibold"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download Single Row (CSV)</span>
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
          {cns.map((cn) => (
            <div
              key={cn.control_number_id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-lg">
                    {cn.control_number_id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    cn.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                  }`}>
                    {cn.is_active ? "Active" : "Closed"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">{cn.equipment_name || "Inspection Equipment"}</h3>
                  <p className="text-[11px] text-slate-500">{cn.client_name}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <p><span className="text-slate-400">RA Bill Ref:</span> <span className="font-mono font-bold text-slate-900">{cn.ra_bill_ref || "RA-BILL-001"}</span></p>
                  <p><span className="text-slate-400">Claimed Qty:</span> <span className="font-bold text-slate-900">{cn.claimed_qty || 10} Units</span></p>
                  <p><span className="text-slate-400">Contract Amount:</span> <span className="font-mono font-bold text-emerald-700">₹{(cn.contract_amount || 0).toLocaleString()}</span></p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenViewDetailsModal(cn)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-brand-600" />
                  <span>View</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(cn)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors flex items-center gap-1 border border-blue-200"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleExportSingleRowCSV(cn)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Control Number Modal */}
      {showCNModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {editingCN ? `Edit Control Number Row — ${controlNumberId}` : "Add New Control Number Row"}
                </h2>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowCNModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCN} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="connum-control-number-id" className="block text-xs font-semibold text-slate-700 mb-1">Control Number ID *</label>
                  <input id="connum-control-number-id"
                    type="text"
                    required
                    value={controlNumberId}
                    onChange={(e) => setControlNumberId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="connum-enquiry-reference-no" className="block text-xs font-semibold text-slate-700 mb-1">Enquiry Reference No *</label>
                  <input id="connum-enquiry-reference-no"
                    type="text"
                    required
                    value={enquiryNo}
                    onChange={(e) => setEnquiryNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="connum-equipment-name-description" className="block text-xs font-semibold text-slate-700 mb-1">Equipment Name / Description *</label>
                  <input id="connum-equipment-name-description"
                    type="text"
                    required
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* 6 Core Bill Verification Fields */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Enquiry Bill Verification Elements (6 Core Fields)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label htmlFor="connum-1-item-description" className="block text-[11px] font-medium text-slate-600 mb-0.5">1. Item Description</label>
                    <input id="connum-1-item-description"
                      type="text"
                      value={equipmentName}
                      onChange={(e) => setEquipmentName(e.target.value)}
                      placeholder="Item description..."
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-medium"
                    />
                  </div>

                  <div>
                    <label htmlFor="connum-2-verification-scope" className="block text-[11px] font-medium text-slate-600 mb-0.5">2. Verification Scope</label>
                    <input id="connum-2-verification-scope"
                      type="text"
                      value={workScope}
                      onChange={(e) => setWorkScope(e.target.value)}
                      placeholder="Verification scope..."
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-medium"
                    />
                  </div>

                  <div>
                    <label htmlFor="connum-3-ra-bill-ref-no" className="block text-[11px] font-medium text-slate-600 mb-0.5">3. RA Bill Ref No</label>
                    <input id="connum-3-ra-bill-ref-no"
                      type="text"
                      value={raBillRef}
                      onChange={(e) => setRaBillRef(e.target.value)}
                      placeholder="RA-BILL-001"
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label htmlFor="connum-4-claimed-qty" className="block text-[11px] font-medium text-slate-600 mb-0.5">4. Claimed Qty</label>
                    <input id="connum-4-claimed-qty"
                      type="number"
                      value={claimedQty}
                      onChange={(e) => setClaimedQty(e.target.value)}
                      placeholder="10"
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-bold"
                    />
                  </div>

                  <div>
                    <label htmlFor="connum-5-verified-rate-amount" className="block text-[11px] font-medium text-slate-600 mb-0.5">5. Verified Rate / Amount ₹</label>
                    <input id="connum-5-verified-rate-amount"
                      type="number"
                      value={contractAmount}
                      onChange={(e) => setContractAmount(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label htmlFor="connum-6-verification-remarks" className="block text-[11px] font-medium text-slate-600 mb-0.5">6. Verification Remarks</label>
                    <input id="connum-6-verification-remarks"
                      type="text"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Remarks & notes..."
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCNModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-sm"
                >
                  {submitting ? "Saving..." : editingCN ? "Save Changes" : "Create Control Number"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Row Details Modal */}
      {showDetailsModal && selectedCNForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-brand-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Row Details — {selectedCNForDetails.control_number_id}
                  </h2>
                  <p className="text-xs text-slate-500">Enquiry No: {selectedCNForDetails.enquiry_no}</p>
                </div>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 6 Core Bill Verification Details Card */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Enquiry Bill Verification Summary (6 Core Elements)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 text-[11px]">1. Item Description:</span>
                    <p className="font-bold text-slate-900">{selectedCNForDetails.equipment_name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">2. Verification Scope:</span>
                    <p className="font-bold text-slate-900">{selectedCNForDetails.work_scope || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">3. RA Bill Ref No:</span>
                    <p className="font-mono font-bold text-emerald-800">{selectedCNForDetails.ra_bill_ref || "RA-BILL-001"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">4. Claimed Qty:</span>
                    <p className="font-bold text-slate-900">{selectedCNForDetails.claimed_qty || 10} Units</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">5. Verified Amount (₹):</span>
                    <p className="font-mono font-bold text-slate-900">₹{(selectedCNForDetails.contract_amount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">6. Verification Remarks:</span>
                    <p className="font-medium text-slate-800">{selectedCNForDetails.comments || "None"}</p>
                  </div>
                </div>
              </div>

              {/* Client & Vendor Details */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <span className="text-slate-400 font-medium">Customer / Client:</span>
                  <p className="font-bold text-slate-900">{selectedCNForDetails.client_name}</p>
                  <p className="text-[11px] text-slate-500">{selectedCNForDetails.client_unit_name}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Manufacturer / Vendor:</span>
                  <p className="font-bold text-slate-900">{selectedCNForDetails.manufacturer_name}</p>
                  <p className="text-[11px] text-slate-500">{selectedCNForDetails.manufacturer_unit_name}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleExportSingleRowCSV(selectedCNForDetails)}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Row CSV</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleOpenEditModal(selectedCNForDetails);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  Edit Row
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
