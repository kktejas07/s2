"use client";

import { useEffect, useState } from "react";
import { 
  Factory, Search, Plus, MapPin, Mail, Phone, X, CheckCircle2, 
  MoreVertical, Edit3, Power, Layers, LayoutGrid, LayoutList, RefreshCw, Tag, Globe, Compass 
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

interface MfrUnitItem {
  manufacturer_unit_id: string;
  name: string;
  unit_type?: string;
  region?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  custom_category?: string;
}

const alphabet = ["ALL", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

const unitTypes = [
  "FOR - Forging & Casting Shop",
  "PIP - Pipe & Tube Mill",
  "VAL - Valve & Flow Control Works",
  "BOI - Boiler & Pressure Vessel Shop",
  "ELE - Electrical & Transformer Unit",
  "STR - Structural Fabrication Yard",
  "CUS - Custom / User Defined",
];

const regions = [
  "WST - Western Region",
  "NTH - Northern Region",
  "STH - Southern Region",
  "EST - Eastern Region",
  "CNT - Central Region",
  "INT - Overseas / International",
];

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const mfrs = manufacturers;
  const setMfrs = setManufacturers;
  const [search, setSearch] = useState("");
  const [selectedAlpha, setSelectedAlpha] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [loading, setLoading] = useState(true);

  // Modals & Dropdown State
  const [showMfrModal, setShowMfrModal] = useState(false);
  const [editingMfr, setEditingMfr] = useState<any | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Units Modal State
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [selectedMfrForUnits, setSelectedMfrForUnits] = useState<any | null>(null);
  const [mfrUnits, setMfrUnits] = useState<MfrUnitItem[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [unitRegionFilter, setUnitRegionFilter] = useState("ALL");
  const [unitTypeFilter, setUnitTypeFilter] = useState("ALL");

  // Form State for Add New Plant Unit
  const [unitName, setUnitName] = useState("");
  const [unitType, setUnitType] = useState("FOR - Forging & Casting Shop");
  const [unitRegion, setUnitRegion] = useState("WST - Western Region");
  const [unitCity, setUnitCity] = useState("");
  const [unitLocation, setUnitLocation] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [unitContact, setUnitContact] = useState("");
  const [unitPhone, setUnitPhone] = useState("");

  // Form State for Add / Edit Manufacturer
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [gst, setGst] = useState("");
  const [equipmentCategory, setEquipmentCategory] = useState("Boilers & Pressure Vessels");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadManufacturers();
  }, [search, selectedAlpha, statusFilter]);

  async function loadManufacturers() {
    setLoading(true);
    try {
      const activeParam = statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined;
      const r = await api.listManufacturers({ 
        search, 
        alpha: selectedAlpha === "ALL" ? "" : selectedAlpha,
        is_active: activeParam,
        per_page: 200 
      });
      setManufacturers(r.data || []);
    } catch (e) {
      console.error(e);
      // Fallback sample manufacturer database matching legacy seed
      setManufacturers([
        { manufacturer_id: "M-001", name: "BHEL Trichy Boilers", equipment_category: "Boilers & Pressure Vessels", city: "TRI - Trichy", state: "Tamil Nadu", contact_person: "V. Swaminathan", contact_number: "+91 94433 11223", email: "contact@bhel.in", total_units: 4, is_active: true, created_at: "2024-01-10" },
        { manufacturer_id: "M-002", name: "Godrej Heavy Engineering", equipment_category: "Valves & Flow Control", city: "MUM - Mumbai", state: "Maharashtra", contact_person: "Ketan Patel", contact_number: "+91 98200 55443", email: "info@godrej.com", total_units: 5, is_active: true, created_at: "2024-02-14" },
        { manufacturer_id: "M-003", name: "ISGEC Heavy Engineering", equipment_category: "Heavy Castings & Forgings", city: "YAM - Yamunanagar", state: "Haryana", contact_person: "Rajesh Bhatia", contact_number: "+91 98120 77889", email: "sales@isgec.com", total_units: 3, is_active: true, created_at: "2024-03-01" },
        { manufacturer_id: "M-004", name: "Thermax Energy Systems", equipment_category: "Pumps & Compressors", city: "PUN - Pune", state: "Maharashtra", contact_person: "Sandeep Joshi", contact_number: "+91 98900 33445", email: "support@thermax.com", total_units: 2, is_active: false, created_at: "2024-04-05" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingMfr(null);
    setName("");
    setCity("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setEquipmentCategory("Boilers & Pressure Vessels");
    setShowMfrModal(true);
  };

  const handleOpenEditModal = (mfr: any) => {
    setEditingMfr(mfr);
    setName(mfr.name || "");
    setCity(mfr.city || "");
    setContactPerson(mfr.contact_person || "");
    setEmail(mfr.email || "");
    setPhone(mfr.contact_number || "");
    setEquipmentCategory(mfr.equipment_category || "Boilers & Pressure Vessels");
    setShowMfrModal(true);
    setActiveDropdown(null);
  };

  const handleSaveManufacturer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingMfr) {
        await api.updateManufacturer(editingMfr.manufacturer_id, {
          name,
          city,
          contact_person: contactPerson,
          email,
          contact_number: phone,
          equipment_category: equipmentCategory,
        });
      } else {
        const nextAutoId = `M-${(manufacturers.length + 1).toString().padStart(3, "0")}`;
        await api.createManufacturer({
          manufacturer_id: nextAutoId,
          name,
          city,
          contact_person: contactPerson,
          email,
          contact_number: phone,
          equipment_category: equipmentCategory,
        });
      }
      setShowMfrModal(false);
      loadManufacturers();
    } catch (err) {
      console.error("Failed to save manufacturer:", err);
      toast.error("Couldn't save the manufacturer details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  const handleSaveMfr = handleSaveManufacturer;

  const handleToggleStatus = async (mfr: any) => {
    try {
      await api.updateManufacturerStatus(mfr.manufacturer_id, !mfr.is_active);
      loadManufacturers();
    } catch (e) {
      console.error(e);
    } finally {
      setActiveDropdown(null);
    }
  };

  // Plant Units Management Handlers
  const handleOpenUnitsModal = async (mfr: any) => {
    setSelectedMfrForUnits(mfr);
    setShowUnitsModal(true);
    setLoadingUnits(true);
    setActiveDropdown(null);
    try {
      const units = await api.listManufacturerUnits(mfr.manufacturer_id);
      if (units && units.length > 0) {
        setMfrUnits(units);
      } else {
        setMfrUnits([
          { manufacturer_unit_id: `${mfr.manufacturer_id}-U01`, name: `${mfr.name} - Works 1 (Heavy Forging & Casting Shop)`, unit_type: "FOR - Forging & Casting Shop", region: "WST - Western Region", city: "PUN - Pune", location: "PUN - Chakan MIDC Phase II Industrial Area", contact_person: "Vendor QC Lead", phone: mfr.contact_number || "+91 98220 11223", custom_category: "10,000T Forging Press Line" },
          { manufacturer_unit_id: `${mfr.manufacturer_id}-U02`, name: `${mfr.name} - Works 2 (High Pressure Boiler & Vessel Shop)`, unit_type: "BOI - Boiler & Pressure Vessel Shop", region: "STH - Southern Region", city: "TRI - Trichy", location: "TRI - Heavy Industrial Complex Area", contact_person: "Plant Manager", phone: mfr.contact_number || "+91 94433 88776", custom_category: "ASME Nuclear Stamp Bay" },
          { manufacturer_unit_id: `${mfr.manufacturer_id}-U03`, name: `${mfr.name} - Works 3 (Valve & Flow Control Test Facility)`, unit_type: "VAL - Valve & Flow Control Works", region: "WST - Western Region", city: "AHM - Ahmedabad", location: "AHM - Odhav GIDC Sector 3", contact_person: "Testing Head", phone: "+91 98790 55443", custom_category: "Cryogenic Test Bay" },
        ]);
      }
    } catch (e) {
      console.warn("Failed to list units, using sample structured vendor units", e);
      setMfrUnits([
        { manufacturer_unit_id: `${mfr.manufacturer_id}-U01`, name: `${mfr.name} - Works 1 (Heavy Forging & Casting Shop)`, unit_type: "FOR - Forging & Casting Shop", region: "WST - Western Region", city: "PUN - Pune", location: "PUN - Chakan MIDC Phase II Industrial Area", contact_person: "Vendor QC Lead", phone: mfr.contact_number || "+91 98220 11223", custom_category: "10,000T Forging Press Line" },
        { manufacturer_unit_id: `${mfr.manufacturer_id}-U02`, name: `${mfr.name} - Works 2 (High Pressure Boiler & Vessel Shop)`, unit_type: "BOI - Boiler & Pressure Vessel Shop", region: "STH - Southern Region", city: "TRI - Trichy", location: "TRI - Heavy Industrial Complex Area", contact_person: "Plant Manager", phone: mfr.contact_number || "+91 94433 88776", custom_category: "ASME Nuclear Stamp Bay" },
        { manufacturer_unit_id: `${mfr.manufacturer_id}-U03`, name: `${mfr.name} - Works 3 (Valve & Flow Control Test Facility)`, unit_type: "VAL - Valve & Flow Control Works", region: "WST - Western Region", city: "AHM - Ahmedabad", location: "AHM - Odhav GIDC Sector 3", contact_person: "Testing Head", phone: "+91 98790 55443", custom_category: "Cryogenic Test Bay" },
      ]);
    } finally {
      setLoadingUnits(false);
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMfrForUnits || !unitName) return;
    try {
      await api.createManufacturerUnit(selectedMfrForUnits.manufacturer_id, {
        name: unitName,
        unit_type: unitType,
        region: unitRegion,
        city: unitCity,
        location: unitLocation,
        custom_category: customCategory,
        contact_person: unitContact,
        phone: unitPhone,
      });

      setUnitName("");
      setUnitCity("");
      setUnitLocation("");
      setCustomCategory("");
      setUnitContact("");
      setUnitPhone("");

      const updatedUnits = await api.listManufacturerUnits(selectedMfrForUnits.manufacturer_id);
      setMfrUnits(updatedUnits || []);
      loadManufacturers();
    } catch (e) {
      console.error("Failed to add vendor unit", e);
      toast.error("Couldn't add the vendor unit. Please try again.");
    }
  };

  const filteredUnits = mfrUnits.filter((u) => {
    if (unitRegionFilter !== "ALL" && u.region !== unitRegionFilter) return false;
    if (unitTypeFilter !== "ALL" && u.unit_type !== unitTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Manufacturer & Vendor Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold font-mono">
              {mfrs.length} Approved Vendors
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage equipment manufacturers, vendor manufacturing plant sites, regions, equipment sub-categories, and status tracking
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button aria-label="Refresh Directory"
            onClick={loadManufacturers}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0084bf] to-[#e35f14] text-white font-semibold text-xs shadow-md glow-iqe-blue hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Manufacturer</span>
          </button>
        </div>
      </div>

      {/* Alphabetical A-Z Jump Bar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alphabetical Index</span>
          <span className="text-[11px] font-mono text-[#00618e] font-semibold">Filter by starting letter</span>
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
                    ? "bg-[#0084bf] text-white shadow-sm scale-105"
                    : "bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-[#00618e] border border-slate-200/60"
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
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            aria-label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search manufacturer by ID (e.g. M-001), vendor name, equipment category, city..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Status Filter Toggle Group & View Toggle */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "active" ? "bg-white text-amber-700 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
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
              Inactive
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
              className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-amber-700 shadow-sm" : "hover:text-slate-900"}`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button aria-label="Card Grid View"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-amber-700 shadow-sm" : "hover:text-slate-900"}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Content Area */}
      {viewMode === "table" ? (
        /* Data Table View (Matching _ManufacturerDirectory.cshtml) */
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Manufacturer ID</th>
                  <th className="p-3">Manufacturer Name</th>
                  <th className="p-3">Equipment Category</th>
                  <th className="p-3">Location / Contact</th>
                  <th className="p-3 text-center">Total Units</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mfrs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No manufacturers found matching criteria.
                    </td>
                  </tr>
                ) : (
                  mfrs.map((m) => (
                    <tr key={m.manufacturer_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-700">{m.manufacturer_id}</td>
                      <td className="p-3 font-bold text-slate-900">{m.name}</td>
                      <td className="p-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 font-medium text-[11px] border border-amber-200">
                          {m.equipment_category || "Heavy Equipment"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">
                        <div>{m.city || "Head Office"}{m.state ? `, ${m.state}` : ""}</div>
                        {m.contact_number && <div className="text-[11px] text-slate-400">{m.contact_number}</div>}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold font-mono text-[11px]">
                          <Factory className="w-3 h-3" />
                          {m.total_units || 0} Units
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          m.is_active !== false ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {m.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3 text-right relative">
                        <button aria-label="More actions" title="More actions"
                          onClick={() => setActiveDropdown(activeDropdown === m.manufacturer_id ? null : m.manufacturer_id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Ellipsis Menu */}
                        {activeDropdown === m.manufacturer_id && (
                          <div className="absolute right-3 top-10 z-20 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-left text-xs space-y-0.5">
                            <button
                              onClick={() => handleOpenEditModal(m)}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                              <span>Edit Manufacturer</span>
                            </button>
                            <button
                              onClick={() => handleOpenUnitsModal(m)}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                            >
                              <Layers className="w-3.5 h-3.5 text-blue-600" />
                              <span>Manage Units ({m.total_units || 0})</span>
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              onClick={() => handleToggleStatus(m)}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                            >
                              <Power className={`w-3.5 h-3.5 ${m.is_active !== false ? "text-rose-600" : "text-emerald-600"}`} />
                              <span>{m.is_active !== false ? "Inactivate Vendor" : "Activate Vendor"}</span>
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
          {mfrs.map((m) => (
            <div
              key={m.manufacturer_id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                    {m.manufacturer_id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    m.is_active !== false ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {m.is_active !== false ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">{m.name}</h3>

                <div className="space-y-1 text-xs text-slate-500 pt-1">
                  {m.equipment_category && (
                    <p className="text-[11px] font-medium text-slate-600">
                      <span className="text-slate-400">Equipment:</span> {m.equipment_category}
                    </p>
                  )}
                  {m.city && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {m.city}{m.state ? `, ${m.state}` : ""}
                    </p>
                  )}
                  {m.contact_number && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {m.contact_number}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenUnitsModal(m)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900"
                >
                  <Factory className="w-3.5 h-3.5" />
                  <span>{m.total_units || 0} Plant Units</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(m)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Manufacturer Modal */}
      {showMfrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {editingMfr ? `Edit Manufacturer (${editingMfr.manufacturer_id})` : "Add New Manufacturer"}
                </h2>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowMfrModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMfr} className="space-y-3">
              <div>
                <label htmlFor="man-manufacturer-name" className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer Name *</label>
                <input id="man-manufacturer-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Heat Exchangers & Vessels Ltd"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="man-equipment-category" className="block text-xs font-semibold text-slate-700 mb-1">Equipment Category</label>
                  <input id="man-equipment-category"
                    type="text"
                    value={equipmentCategory}
                    onChange={(e) => setEquipmentCategory(e.target.value)}
                    placeholder="e.g. Boilers & Pressure Vessels"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label htmlFor="man-city-location" className="block text-xs font-semibold text-slate-700 mb-1">City / Location</label>
                  <input id="man-city-location"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Trichy, Mumbai"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="man-contact-phone" className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input id="man-contact-phone"
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label htmlFor="man-gst-number" className="block text-xs font-semibold text-slate-700 mb-1">GST Number</label>
                  <input id="man-gst-number"
                    type="text"
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    placeholder="27AAAC..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMfrModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name}
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Manufacturer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Manage Manufacturer Units Modal (Sub-Categories, Regions, Location & Custom Category Tag) */}
      {showUnitsModal && selectedMfrForUnits && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-amber-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Vendor Plant Sites — {selectedMfrForUnits.name}
                  </h2>
                  <p className="text-xs text-slate-500">Manufacturer ID: {selectedMfrForUnits.manufacturer_id}</p>
                </div>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowUnitsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar inside Units Modal */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-700">Filter Region:</span>
                <select
                  aria-label="Filter by region"
                  value={unitRegionFilter}
                  onChange={(e) => setUnitRegionFilter(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="ALL">All Regions ({mfrUnits.length})</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-700">Plant Sub-Category:</span>
                <select
                  aria-label="Filter by plant sub-category"
                  value={unitTypeFilter}
                  onChange={(e) => setUnitTypeFilter(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="ALL">All Categories</option>
                  {unitTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of Registered Manufacturer Units with Badges */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Registered Vendor Plant Sites ({filteredUnits.length})
              </h3>

              {loadingUnits ? (
                <p className="text-xs text-slate-400">Loading units...</p>
              ) : filteredUnits.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-xl border">
                  No manufacturing sites registered under this filter.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredUnits.map((u) => (
                    <div key={u.manufacturer_unit_id} className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm space-y-2 relative hover:border-amber-300 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          {u.manufacturer_unit_id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {u.region || "Western Region"}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs">{u.name}</h4>

                      {/* Sub-Category Badges & Custom Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200 flex items-center gap-1">
                          <Factory className="w-3 h-3 text-slate-500" />
                          {u.unit_type || "Forging & Casting Shop"}
                        </span>

                        {u.custom_category && (
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200 flex items-center gap-1">
                            <Tag className="w-3 h-3 text-purple-500" />
                            {u.custom_category}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                        {(u.city || u.location) && (
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {u.city && <span className="font-semibold text-slate-700">{u.city}: </span>}
                            <span>{u.location || u.city}</span>
                          </p>
                        )}
                        {u.contact_person && <p>Contact: <span className="font-semibold text-slate-700">{u.contact_person}</span> ({u.phone || "N/A"})</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form to Add New Plant Unit */}
            <form onSubmit={handleAddUnit} className="pt-4 border-t border-slate-200 space-y-3 bg-slate-50/50 p-4 rounded-xl border">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 font-heading">Add New Vendor Plant Site</h3>
                <span className="text-[11px] text-amber-700 font-semibold">* Required fields</span>
              </div>

              <div>
                <label htmlFor="man-unit-plant-site-name" className="block text-xs font-semibold text-slate-700 mb-1">Unit / Plant Site Name *</label>
                <input id="man-unit-plant-site-name"
                  type="text"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="e.g. Trichy Heavy Boiler Works - Unit 2"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Plant Sub-Category & Region Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="man-plant-sub-category-type" className="block text-xs font-semibold text-slate-700 mb-1">Plant Sub-Category / Type *</label>
                  <select id="man-plant-sub-category-type"
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {unitTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="man-geographical-region" className="block text-xs font-semibold text-slate-700 mb-1">Geographical Region *</label>
                  <select id="man-geographical-region"
                    value={unitRegion}
                    onChange={(e) => setUnitRegion(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {regions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Custom Category / Tag Entry */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="man-optional-custom-category-tag" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-purple-600" />
                    <span>Optional Custom Category / Tag</span>
                  </label>
                  <span className="text-[11px] text-slate-400">User Defined Tag</span>
                </div>
                <input id="man-optional-custom-category-tag"
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. 10,000T Forging Press Line, ASME Nuclear Stamp Shop, High Alloy Casting Bay"
                  className="w-full px-3 py-2 text-xs bg-white border border-purple-200 text-purple-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Location & Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="man-city-town" className="block text-xs font-semibold text-slate-700 mb-1">City / Town</label>
                  <input id="man-city-town"
                    type="text"
                    value={unitCity}
                    onChange={(e) => setUnitCity(e.target.value)}
                    placeholder="e.g. Trichy, Pune, Chakan"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label htmlFor="man-specific-site-address-location" className="block text-xs font-semibold text-slate-700 mb-1">Specific Site Address / Location</label>
                  <input id="man-specific-site-address-location"
                    type="text"
                    value={unitLocation}
                    onChange={(e) => setUnitLocation(e.target.value)}
                    placeholder="e.g. Plot 12, MIDC Industrial Area Phase II"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Contact Person & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="man-contact-person" className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input id="man-contact-person"
                    type="text"
                    value={unitContact}
                    onChange={(e) => setUnitContact(e.target.value)}
                    placeholder="Vendor Plant Head / QC Lead"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label htmlFor="man-phone" className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input id="man-phone"
                    type="text"
                    value={unitPhone}
                    onChange={(e) => setUnitPhone(e.target.value)}
                    placeholder="+91 Phone"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUnitsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!unitName}
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 shadow-sm"
                >
                  Save Vendor Plant Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
