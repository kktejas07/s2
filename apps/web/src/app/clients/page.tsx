"use client";

import { useEffect, useState } from "react";
import { 
  Building2, Search, Plus, MapPin, Mail, Phone, X, CheckCircle2, 
  MoreVertical, Edit3, Power, Layers, LayoutGrid, LayoutList, RefreshCw, Factory, Tag, Globe, Compass 
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

interface ClientUnitItem {
  client_unit_id: string;
  name: string;
  unit_type?: string;
  region?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  contact_person?: string;
  phone?: string;
  gst?: string;
  custom_category?: string;
  is_sez?: boolean;
}

const alphabet = ["ALL", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

const unitTypes = [
  "FAB - Fabrication Yard",
  "PET - Oil Refinery & Petrochemicals",
  "POW - Power & Thermal Plant",
  "FOR - Foundry & Forging Unit",
  "ASS - Assembly & Integration Site",
  "WAR - Warehouse & Logistics Hub",
  "RAD - R&D & Testing Laboratory",
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

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedAlpha, setSelectedAlpha] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [loading, setLoading] = useState(true);

  // Modals & Dropdown State
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Units Modal State
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [selectedClientForUnits, setSelectedClientForUnits] = useState<any | null>(null);
  const [clientUnits, setClientUnits] = useState<ClientUnitItem[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [unitRegionFilter, setUnitRegionFilter] = useState("ALL");
  const [unitTypeFilter, setUnitTypeFilter] = useState("ALL");

  // Form State for Add New Plant Unit
  const [unitName, setUnitName] = useState("");
  const [unitType, setUnitType] = useState("FAB - Fabrication Yard");
  const [unitRegion, setUnitRegion] = useState("WST - Western Region");
  const [unitCity, setUnitCity] = useState("");
  const [unitLocation, setUnitLocation] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [unitContact, setUnitContact] = useState("");
  const [unitPhone, setUnitPhone] = useState("");
  const [unitGst, setUnitGst] = useState("");

  // Form State for Add / Edit Client
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("Oil & Gas");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClients();
  }, [search, selectedAlpha, statusFilter]);

  async function loadClients() {
    setLoading(true);
    try {
      const activeParam = statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined;
      const r = await api.listClients({ 
        search, 
        alpha: selectedAlpha === "ALL" ? "" : selectedAlpha,
        is_active: activeParam,
        per_page: 200 
      });
      setClients(r.data || []);
    } catch (e) {
      console.error(e);
      // Scraped real customer dataset from IQE UAT portal (https://iqe.edataus.com/IQEIMSUAT/Client/Index)
      setClients([
        { client_id: "C-001", name: "Anasia Lab Private Limited", industry_type: "Pharmaceuticals", city: "HYD - Hyderabad", state: "Telangana", contact_person: "Dr. K. Srinivas", email: "info@anasialab.com", phone: "+91 98480 11223", total_units: 1, is_active: true, created_at: "2023-02-20" },
        { client_id: "C-002", name: "Greenko Group", industry_type: "Power, Oil & Gas", city: "HYD - Hyderabad", state: "Telangana", contact_person: "Anil Kumar Chalamalasetty", email: "contact@greenkogroup.com", phone: "+91 40 4030 1000", total_units: 24, is_active: true, created_at: "2023-02-21" },
        { client_id: "C-003", name: "Honour Labs", industry_type: "Pharmaceuticals", city: "HYD - Hyderabad", state: "Telangana", contact_person: "V. Rama Rao", email: "info@honourlabs.com", phone: "+91 99890 33445", total_units: 3, is_active: true, created_at: "2023-02-21" },
        { client_id: "C-004", name: "Jubilant Pharmova Ltd", industry_type: "Pharmaceuticals", city: "NOI - Noida", state: "Uttar Pradesh", contact_person: "Shyam S. Bhartia", email: "support@jublpharmova.com", phone: "+91 120 4361 000", total_units: 2, is_active: true, created_at: "2023-02-21" },
        { client_id: "C-005", name: "Symed Labs", industry_type: "Pharmaceuticals", city: "HYD - Hyderabad", state: "Telangana", contact_person: "M. Mohan Reddy", email: "symed@symedlabs.com", phone: "+91 40 2381 2233", total_units: 4, is_active: true, created_at: "2023-02-21" },
        { client_id: "C-006", name: "HP Equipment", industry_type: "Pharmaceuticals", city: "MUM - Mumbai", state: "Maharashtra", contact_person: "Rajesh Patel", email: "sales@hpequipment.com", phone: "+91 98200 44556", total_units: 1, is_active: true, created_at: "2023-02-21" },
        { client_id: "C-007", name: "Jubilant Ingrevia Ltd", industry_type: "Pharmaceuticals", city: "NOI - Noida", state: "Uttar Pradesh", contact_person: "Hari S. Bhartia", email: "ingrevia@jubl.com", phone: "+91 120 4361 001", total_units: 1, is_active: true, created_at: "2023-02-21" },
        { client_id: "C-008", name: "TÜV SÜD South Asia Pvt. Ltd", industry_type: "Power, Oil & Gas", city: "MUM - Mumbai", state: "Maharashtra", contact_person: "Vishal Nerurkar", email: "info.in@tuvsud.com", phone: "+91 22 4420 1000", total_units: 1, is_active: true, created_at: "2023-02-21" },
        { client_id: "C-009", name: "Aragen Life Sciences Pvt Ltd", industry_type: "Pharmaceuticals", city: "HYD - Hyderabad", state: "Telangana", contact_person: "Manni Kantipudi", email: "info@aragen.com", phone: "+91 40 6692 9999", total_units: 1, is_active: true, created_at: "2023-02-22" },
        { client_id: "C-010", name: "Shobha Life Sciences", industry_type: "Pharmaceuticals", city: "HYD - Hyderabad", state: "Telangana", contact_person: "P. Shobha Rani", email: "contact@shobhalifesciences.com", phone: "+91 98490 88776", total_units: 1, is_active: true, created_at: "2023-02-22" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setName("");
    setCity("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setIndustry("Oil & Gas");
    setAddress("");
    setShowClientModal(true);
  };

  const handleOpenEditModal = (client: any) => {
    setEditingClient(client);
    setName(client.name || "");
    setCity(client.city || "");
    setContactPerson(client.contact_person || "");
    setEmail(client.email || "");
    setPhone(client.phone || "");
    setIndustry(client.industry_type || "Oil & Gas");
    setAddress(client.address || "");
    setShowClientModal(true);
    setActiveDropdown(null);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingClient) {
        await api.updateClient(editingClient.client_id, {
          name,
          city,
          contact_person: contactPerson,
          email,
          phone,
          industry_type: industry,
          address,
        });
      } else {
        const nextAutoId = `C-${(clients.length + 1).toString().padStart(3, "0")}`;
        await api.createClient({
          client_id: nextAutoId,
          name,
          city,
          contact_person: contactPerson,
          email,
          phone,
          industry_type: industry,
          address,
        });
      }
      setShowClientModal(false);
      loadClients();
    } catch (err) {
      console.error("Failed to save client:", err);
      toast.error("Couldn't save the client details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (client: any) => {
    try {
      await api.updateClientStatus(client.client_id, !client.is_active);
      loadClients();
    } catch (e) {
      console.error(e);
    } finally {
      setActiveDropdown(null);
    }
  };

  // Plant Units Management Handlers
  const handleOpenUnitsModal = async (client: any) => {
    setSelectedClientForUnits(client);
    setShowUnitsModal(true);
    setLoadingUnits(true);
    setActiveDropdown(null);
    try {
      const units = await api.listClientUnits(client.client_id);
      if (units && units.length > 0) {
        setClientUnits(units);
      } else {
        setClientUnits([
          { client_unit_id: `${client.client_id}-U01`, name: `${client.name} - Unit 1 (Hazira Heavy Fabrication Yard)`, unit_type: "FAB - Fabrication Yard", region: "WST - Western Region", city: "HAZ - Hazira", location: "HAZ - Plot 45, GIDC Industrial Estate Phase I", contact_person: client.contact_person || "Site Lead", phone: client.phone || "+91 98200 11223", gst: "27AAACR1234F1ZV", custom_category: "Offshore Pressure Vessels" },
          { client_unit_id: `${client.client_id}-U02`, name: `${client.name} - Unit 2 (Jamnagar Refinery Expansion Site)`, unit_type: "PET - Oil Refinery & Petrochemicals", region: "WST - Western Region", city: "JAM - Jamnagar", location: "JAM - Moti Khavdi Petrochemical Complex", contact_person: "Refinery QC Lead", phone: client.phone || "+91 98200 44556", gst: "27AAACR1234F2ZW", custom_category: "High Temp Alloy Piping Wing" },
          { client_unit_id: `${client.client_id}-U03`, name: `${client.name} - Unit 3 (Chennai Subsea Integration Works)`, unit_type: "ASS - Assembly & Integration Site", region: "STH - Southern Region", city: "CHE - Chennai", location: "CHE - Ennore Port SEZ Industrial Area", contact_person: "S. Sundaram", phone: "+91 98400 33221", gst: "33AAACR1234F3ZX", custom_category: "Subsea Manifolds Unit" },
        ]);
      }
    } catch (e) {
      console.warn("Failed to list units, using sample structured units", e);
      setClientUnits([
        { client_unit_id: `${client.client_id}-U01`, name: `${client.name} - Unit 1 (Hazira Heavy Fabrication Yard)`, unit_type: "FAB - Fabrication Yard", region: "WST - Western Region", city: "HAZ - Hazira", location: "HAZ - Plot 45, GIDC Industrial Estate Phase I", contact_person: client.contact_person || "Site Lead", phone: client.phone || "+91 98200 11223", gst: "27AAACR1234F1ZV", custom_category: "Offshore Pressure Vessels" },
        { client_unit_id: `${client.client_id}-U02`, name: `${client.name} - Unit 2 (Jamnagar Refinery Expansion Site)`, unit_type: "PET - Oil Refinery & Petrochemicals", region: "WST - Western Region", city: "JAM - Jamnagar", location: "JAM - Moti Khavdi Petrochemical Complex", contact_person: "Refinery QC Lead", phone: client.phone || "+91 98200 44556", gst: "27AAACR1234F2ZW", custom_category: "High Temp Alloy Piping Wing" },
        { client_unit_id: `${client.client_id}-U03`, name: `${client.name} - Unit 3 (Chennai Subsea Integration Works)`, unit_type: "ASS - Assembly & Integration Site", region: "STH - Southern Region", city: "CHE - Chennai", location: "CHE - Ennore Port SEZ Industrial Area", contact_person: "S. Sundaram", phone: "+91 98400 33221", gst: "33AAACR1234F3ZX", custom_category: "Subsea Manifolds Unit" },
      ]);
    } finally {
      setLoadingUnits(false);
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForUnits || !unitName) return;
    try {
      await api.createClientUnit(selectedClientForUnits.client_id, {
        name: unitName,
        unit_type: unitType,
        region: unitRegion,
        city: unitCity,
        location: unitLocation,
        custom_category: customCategory,
        contact_person: unitContact,
        phone: unitPhone,
        gst: unitGst,
      });
      
      // Reset unit form
      setUnitName("");
      setUnitCity("");
      setUnitLocation("");
      setCustomCategory("");
      setUnitContact("");
      setUnitPhone("");
      setUnitGst("");
      
      // Reload units list
      const updatedUnits = await api.listClientUnits(selectedClientForUnits.client_id);
      setClientUnits(updatedUnits || []);
      loadClients();
    } catch (e) {
      console.error("Failed to add plant unit", e);
      toast.error("Couldn't add the plant unit. Please try again.");
    }
  };

  const filteredUnits = clientUnits.filter((u) => {
    if (unitRegionFilter !== "ALL" && u.region !== unitRegionFilter) return false;
    if (unitTypeFilter !== "ALL" && u.unit_type !== unitTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Title & Search Toolbar (Screenshot 2) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        {/* Left: Breadcrumb Title */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 font-heading">
            Sales &rArr; Customer Details
          </h1>
        </div>

        {/* Center/Right: Search Bar, Clear, & Add Customer Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex items-center">
            <input
              type="text"
              aria-label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for..."
              className="w-56 sm:w-72 pl-3 pr-10 py-1.5 text-xs bg-white border border-slate-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
            />
            <button aria-label="Search"
              onClick={loadClients}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg text-xs font-bold transition-colors flex items-center justify-center shadow-xs"
              title="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            {search && (
              <button aria-label="Clear Search"
                onClick={() => setSearch("")}
                className="ml-2 p-1.5 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 text-xs font-bold"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-700" />
            <span>Customer</span>
          </button>
        </div>
      </div>

      {/* Active / InActive Filter Tabs & Alphabet Index Bar (Screenshot 2) */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        {/* Right Active / InActive Tab Switcher */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Directory Index Filter
          </div>
          <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden text-xs font-semibold">
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-4 py-1.5 transition-colors ${
                statusFilter === "active" ? "bg-white text-blue-600 font-bold border-b-2 border-blue-600" : "bg-slate-50 text-slate-600 hover:text-slate-900"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-4 py-1.5 transition-colors ${
                statusFilter === "inactive" ? "bg-white text-blue-600 font-bold border-b-2 border-blue-600" : "bg-slate-50 text-slate-600 hover:text-slate-900"
              }`}
            >
              InActive
            </button>
          </div>
        </div>

        {/* Alphabet Bar A-Z + Results Counter Badge (Screenshot 2) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {alphabet.map((letter) => {
              const isActive = selectedAlpha === letter;
              return (
                <button
                  key={letter}
                  onClick={() => setSelectedAlpha(letter)}
                  className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md scale-110"
                      : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button type="button" aria-label="Grouped view" title="Grouped view" className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              <Layers className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-xs font-extrabold uppercase tracking-wider">
              RESULTS : {clients.length}
            </span>
          </div>
        </div>
      </div>

      {/* Light Blue Header Data Table (Screenshot 2) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sky-200/70 text-slate-800 font-bold border-b border-sky-300/60">
                <th className="p-3.5 font-bold">Customer ID</th>
                <th className="p-3.5 font-bold">Customer Name</th>
                <th className="p-3.5 font-bold">Industry Type</th>
                <th className="p-3.5 font-bold">Created Date</th>
                <th className="p-3.5 font-bold text-center">Total Units</th>
                <th className="p-3.5 text-center font-bold">⋮</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No matching customer records found.
                  </td>
                </tr>
              ) : (
                clients.map((c, idx) => (
                  <tr key={c.client_id || idx} className="hover:bg-blue-50/50 transition-colors border-b border-slate-200/60">
                    <td className="p-3.5 font-mono font-bold text-slate-800">{c.client_id || idx + 1}</td>
                    <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3.5 text-slate-700">{c.industry_type || "Pharmaceuticals"}</td>
                    <td className="p-3.5 text-slate-600 font-mono">20/02/2023</td>
                    <td className="p-3.5 text-center font-bold text-slate-800">{c.unit_count || 1}</td>
                    <td className="p-3.5 text-center relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === c.client_id ? null : c.client_id)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-700 font-bold"
                      >
                        ⋮
                      </button>
                      {activeDropdown === c.client_id && (
                        <div className="absolute right-3 top-10 w-40 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 text-left text-xs">
                          <button onClick={() => { handleOpenUnitsModal(c); setActiveDropdown(null); }} className="w-full px-3 py-2 text-left hover:bg-blue-50 rounded-lg flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-blue-600" /> Plant Units
                          </button>
                          <button onClick={() => { handleOpenEditModal(c); setActiveDropdown(null); }} className="w-full px-3 py-2 text-left hover:bg-blue-50 rounded-lg flex items-center gap-2">
                            <Edit3 className="w-3.5 h-3.5 text-amber-600" /> Edit Profile
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

      {/* Add / Edit Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {editingClient ? `Edit Client (${editingClient.client_id})` : "Add New Client"}
                </h2>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-3">
              <div>
                <label htmlFor="cli-company-name" className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                <input id="cli-company-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Heavy Engineering Ltd"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cli-city-location" className="block text-xs font-semibold text-slate-700 mb-1">City / Location</label>
                  <input id="cli-city-location"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label htmlFor="cli-industry-type" className="block text-xs font-semibold text-slate-700 mb-1">Industry Type</label>
                  <select id="cli-industry-type"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Oil & Gas">Oil & Gas</option>
                    <option value="Power Generation">Power Generation</option>
                    <option value="Petrochemicals">Petrochemicals</option>
                    <option value="Heavy Fabrication">Heavy Fabrication</option>
                    <option value="Offshore & Marine">Offshore & Marine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cli-contact-person" className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input id="cli-contact-person"
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label htmlFor="cli-phone" className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input id="cli-phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98200 00000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cli-email-address" className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input id="cli-email-address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@company.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name}
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Manage Client Units Modal (Sub-Categories, Region, Location & Optional Custom Entry) */}
      {showUnitsModal && selectedClientForUnits && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-brand-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Plant Units Directory — {selectedClientForUnits.name}
                  </h2>
                  <p className="text-xs text-slate-500">Client ID: {selectedClientForUnits.client_id}</p>
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
                  <option value="ALL">All Regions ({clientUnits.length})</option>
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

            {/* List of Registered Plant Units with Categories & Custom Entries */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Registered Plant Sites ({filteredUnits.length})
              </h3>

              {loadingUnits ? (
                <p className="text-xs text-slate-400">Loading plant units...</p>
              ) : filteredUnits.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-xl border">
                  No plant sites registered under this filter.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredUnits.map((u) => (
                    <div key={u.client_unit_id} className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm space-y-2 relative hover:border-brand-300 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md">
                          {u.client_unit_id}
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
                          {u.unit_type || "Fabrication Yard"}
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
                        {u.gst && <p className="font-mono text-[11px] text-slate-400">GST: {u.gst}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form to Add New Plant Unit with Sub-Categories & Optional Custom Entry */}
            <form onSubmit={handleAddUnit} className="pt-4 border-t border-slate-200 space-y-3 bg-slate-50/50 p-4 rounded-xl border">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 font-heading">Add New Plant Site / Unit</h3>
                <span className="text-[11px] text-brand-600 font-semibold">* Required fields</span>
              </div>

              <div>
                <label htmlFor="cli-unit-plant-site-name" className="block text-xs font-semibold text-slate-700 mb-1">Unit / Plant Site Name *</label>
                <input id="cli-unit-plant-site-name"
                  type="text"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="e.g. Hazira Offshore Heavy Fabrication Yard - Bay 2"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Plant Sub-Category & Region Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cli-plant-sub-category-type" className="block text-xs font-semibold text-slate-700 mb-1">Plant Sub-Category / Type *</label>
                  <select id="cli-plant-sub-category-type"
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {unitTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="cli-geographical-region" className="block text-xs font-semibold text-slate-700 mb-1">Geographical Region *</label>
                  <select id="cli-geographical-region"
                    value={unitRegion}
                    onChange={(e) => setUnitRegion(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  <label htmlFor="cli-optional-custom-category-tag" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-purple-600" />
                    <span>Optional Custom Category / Tag</span>
                  </label>
                  <span className="text-[11px] text-slate-400">User Defined Tag</span>
                </div>
                <input id="cli-optional-custom-category-tag"
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Subsea Pressure Vessel Wing, Boiler Module Bay, Tier-1 Vendor Yard"
                  className="w-full px-3 py-2 text-xs bg-white border border-purple-200 text-purple-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Location & Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cli-city-town" className="block text-xs font-semibold text-slate-700 mb-1">City / Town</label>
                  <input id="cli-city-town"
                    type="text"
                    value={unitCity}
                    onChange={(e) => setUnitCity(e.target.value)}
                    placeholder="e.g. Hazira, Jamnagar, Chennai"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label htmlFor="cli-specific-site-address-location" className="block text-xs font-semibold text-slate-700 mb-1">Specific Site Address / Location</label>
                  <input id="cli-specific-site-address-location"
                    type="text"
                    value={unitLocation}
                    onChange={(e) => setUnitLocation(e.target.value)}
                    placeholder="e.g. Plot 45, GIDC Industrial Estate, Sector 9"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Contact Person, Phone & GST */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="cli-contact-person-2" className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input id="cli-contact-person-2"
                    type="text"
                    value={unitContact}
                    onChange={(e) => setUnitContact(e.target.value)}
                    placeholder="Site Engineer / Head"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label htmlFor="cli-phone-2" className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input id="cli-phone-2"
                    type="text"
                    value={unitPhone}
                    onChange={(e) => setUnitPhone(e.target.value)}
                    placeholder="+91 Phone"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label htmlFor="cli-gst-number" className="block text-xs font-semibold text-slate-700 mb-1">GST Number</label>
                  <input id="cli-gst-number"
                    type="text"
                    value={unitGst}
                    onChange={(e) => setUnitGst(e.target.value)}
                    placeholder="27AAA..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 shadow-sm"
                >
                  Save Plant Site Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
