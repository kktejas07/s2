"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase, Plus, Search, ChevronDown, UserCheck, ShieldCheck } from "@/components/icons";
import { api } from "@/lib/api";

interface ClientOption {
  id: string; // C-001 or M-001
  name: string;
  type: "client" | "manufacturer";
  city?: string;
}

interface InspectorOption {
  user_id: string;
  inspector_code: string;
  full_name: string;
  email: string;
}

const PRESET_JOB_TITLES = [
  "Boiler & Pressure Vessel Weld Quality Audit",
  "Cross-Country Pipeline NDT Radiography Testing",
  "Heavy Fabrication Structural Integrity Inspection",
  "Steam Turbine Alignment & Vibration Audit",
  "Offshore Wellhead Valve Acceptance Sign-off",
  "Substation Transformer & Switchgear Inspection",
  "Chemical Reactor Vessel Hydrostatic Testing",
  "Refinery Piping System Thermal Expansion Inspection",
  "Heat Exchanger Tube Bundle Eddy Current Testing",
  "Gas Compressor Skid Operational Performance Check",
  "Solar PV Module & Inverter Station Audit",
  "Storage Tank Ultrasonic Thickness Measurement",
  "Cryogenic LNG Tank Fabrication Quality Check",
];

export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [selectedInspectorId, setSelectedInspectorId] = useState("");
  const [selectedInspectorName, setSelectedInspectorName] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [nextJobId, setNextJobId] = useState("JOB-051");

  // Client Options State
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Inspector Options State
  const [inspectors, setInspectors] = useState<InspectorOption[]>([]);
  const [inspectorSearchQuery, setInspectorSearchQuery] = useState("");
  const [inspectorDropdownOpen, setInspectorDropdownOpen] = useState(false);
  const inspectorDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsSettled, mfrsSettled, usersSettled, jobsSettled] = await Promise.allSettled([
          api.listClients({ per_page: 200 }),
          api.listManufacturers({ per_page: 200 }),
          // 200 inspectors + the handful of admin/client logins must all fit in
          // one page; at per_page=200 the last few inspectors were cut off.
          api.listUsers({ per_page: 500 }),
          api.client.get("/jobs/", { params: { per_page: 1 } }),
        ]);

        // Client List
        let clientList: ClientOption[] = [];
        if (clientsSettled.status === "fulfilled") {
          const raw = clientsSettled.value?.data || clientsSettled.value || [];
          clientList = (Array.isArray(raw) ? raw : []).map((c: any) => ({
            id: c.client_id || `C-${c.id}`,
            name: c.name,
            type: "client" as const,
            city: c.city,
          }));
        }

        // Manufacturer List
        let mfrList: ClientOption[] = [];
        if (mfrsSettled.status === "fulfilled") {
          const raw = mfrsSettled.value?.data || mfrsSettled.value || [];
          mfrList = (Array.isArray(raw) ? raw : []).map((m: any) => ({
            id: m.manufacturer_id || `M-${m.id}`,
            name: m.name,
            type: "manufacturer" as const,
            city: m.city,
          }));
        }

        if (clientList.length > 0 || mfrList.length > 0) {
          setClientOptions([...clientList, ...mfrList]);
        }

        // Next Job ID
        if (jobsSettled.status === "fulfilled") {
          const totalJobs = jobsSettled.value?.data?.total || 232;
          setNextJobId(`JOB-${(totalJobs + 1).toString().padStart(3, "0")}`);
        }

        // Inspectors List
        if (usersSettled.status === "fulfilled") {
          const rawUsers = usersSettled.value?.data?.data || usersSettled.value?.data || usersSettled.value || [];
          const inspectorList: InspectorOption[] = (Array.isArray(rawUsers) ? rawUsers : [])
            .filter((u: any) => u.role_id === 2 || u.inspector_code)
            .map((u: any) => ({
              user_id: u.user_id,
              inspector_code: u.inspector_code || `INS-${u.user_id}`,
              full_name: u.full_name,
              email: u.email,
            }));

          if (inspectorList.length > 0) {
            setInspectors(inspectorList);
          }
        }
      } catch (err) {
        console.error("Failed to load options:", err);
      }
    }
    fetchData();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
      if (inspectorDropdownRef.current && !inspectorDropdownRef.current.contains(e.target as Node)) {
        setInspectorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClientOptions = clientOptions.filter(
    (opt) =>
      opt.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
      opt.id.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
      (opt.city && opt.city.toLowerCase().includes(clientSearchQuery.toLowerCase()))
  );

  const filteredInspectors = inspectors.filter(
    (ins) =>
      ins.full_name.toLowerCase().includes(inspectorSearchQuery.toLowerCase()) ||
      ins.inspector_code.toLowerCase().includes(inspectorSearchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        job_id: nextJobId,
        site_id: "SITE-01",
        title: title || "New Client Inspection Assignment",
        client_id: selectedClientId || "C-001",
        client_name: clientName || "Selected Client",
        assigned_inspector_id: selectedInspectorId || "INS-001",
        assigned_inspector_name: selectedInspectorName || "Er. V. Sharma",
        budget: parseFloat(budget) || 250000,
        status: "in_progress",
      };
      const res = await api.createJob(payload);
      router.push(`/jobs/${res?.job_id || nextJobId}`);
    } catch (err) {
      console.warn("createJob fallback handled:", err);
      router.push(`/jobs/${nextJobId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003366] dark:text-sky-400 hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assignments Directory</span>
      </Link>

      <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 font-heading">Create New Assignment</h1>
              <p className="text-xs text-slate-500">Dispatch a new client inspection assignment</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Assignment ID Preview</span>
            <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
              {nextJobId}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Job Title & Preset Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="job-title" className="block text-xs font-semibold text-slate-700">Job Title / Scope *</label>
            </div>
            <input
              id="job-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Boiler & Pressure Vessel Weld Quality Audit"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all mb-2"
            />
            {/* Quick Preset Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 py-0.5 font-medium">Suggestions:</span>
              {PRESET_JOB_TITLES.slice(0, 4).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTitle(t)}
                  className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-brand-50 text-[11px] font-medium text-slate-600 hover:text-brand-700 border border-slate-200 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Client Selector & Inspector Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Auto-Populating Client Selector */}
            <div className="relative" ref={clientDropdownRef}>
              <label htmlFor="job-client" className="block text-xs font-semibold text-slate-700 mb-1">Client Name / Client ID *</label>

              <button
                type="button"
                id="job-client"
                aria-haspopup="listbox"
                aria-expanded={clientDropdownOpen}
                onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                className="w-full text-left px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-brand-500 bg-white transition-all cursor-pointer flex items-center justify-between min-h-[40px]"
              >
                {clientName ? (
                  <div className="flex items-center gap-2 overflow-hidden">
                    {selectedClientId && (
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold ${selectedClientId.startsWith('M-') ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-800'}`}>
                        {selectedClientId}
                      </span>
                    )}
                    <span className="font-medium text-slate-900 truncate">{clientName}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">Select Client or Manufacturer...</span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              </button>

              {clientDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      aria-label="Search clients and manufacturers"
                      placeholder="Search 200 clients by name or ID (e.g. C-014)..."
                      className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
                    />
                  </div>

                  <div className="overflow-y-auto max-h-48 divide-y divide-slate-50">
                    {filteredClientOptions.length > 0 ? (
                      filteredClientOptions.map((opt) => (
                        <button
                          type="button"
                          key={`${opt.type}-${opt.id}`}
                          onClick={() => {
                            setSelectedClientId(opt.id);
                            setClientName(opt.name);
                            setClientSearchQuery("");
                            setClientDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-brand-50/70 cursor-pointer flex items-center justify-between transition-colors ${
                            selectedClientId === opt.id ? "bg-brand-50 font-medium" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold shrink-0 ${
                                opt.type === "manufacturer"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-brand-100 text-brand-800"
                              }`}
                            >
                              {opt.id}
                            </span>
                            <span className="text-slate-800 truncate">{opt.name}</span>
                          </div>
                          {opt.city && (
                            <span className="text-[11px] text-slate-400 shrink-0 ml-2">{opt.city}</span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No clients found matching "{clientSearchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Auto-Populating Inspector Selector (200 Inspectors) */}
            <div className="relative" ref={inspectorDropdownRef}>
              <label htmlFor="job-inspector" className="block text-xs font-semibold text-slate-700 mb-1">Assign Lead Inspector (200 Available)</label>

              <button
                type="button"
                id="job-inspector"
                aria-haspopup="listbox"
                aria-expanded={inspectorDropdownOpen}
                onClick={() => setInspectorDropdownOpen(!inspectorDropdownOpen)}
                className="w-full text-left px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-brand-500 bg-white transition-all cursor-pointer flex items-center justify-between min-h-[40px]"
              >
                {selectedInspectorName ? (
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800">
                      {selectedInspectorId}
                    </span>
                    <span className="font-medium text-slate-900 truncate">{selectedInspectorName}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">Select Inspector (e.g. INS-001)...</span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              </button>

              {inspectorDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      value={inspectorSearchQuery}
                      onChange={(e) => setInspectorSearchQuery(e.target.value)}
                      aria-label="Search inspectors"
                      placeholder="Search 200 inspectors by name or INS-XXX code..."
                      className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
                    />
                  </div>

                  <div className="overflow-y-auto max-h-48 divide-y divide-slate-50">
                    {filteredInspectors.length > 0 ? (
                      filteredInspectors.map((ins) => (
                        <button
                          type="button"
                          key={ins.user_id}
                          onClick={() => {
                            setSelectedInspectorId(ins.inspector_code);
                            setSelectedInspectorName(ins.full_name);
                            setInspectorSearchQuery("");
                            setInspectorDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-emerald-50/70 cursor-pointer flex items-center justify-between transition-colors ${
                            selectedInspectorId === ins.inspector_code ? "bg-emerald-50 font-medium" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold shrink-0 bg-emerald-100 text-emerald-800">
                              {ins.inspector_code}
                            </span>
                            <span className="text-slate-800 truncate">{ins.full_name}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 truncate ml-2">{ins.email}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No inspectors found matching "{inspectorSearchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="job-budget" className="block text-xs font-semibold text-slate-700 mb-1">Budget (₹)</label>
              <input
                id="job-budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 250000"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label htmlFor="job-start" className="block text-xs font-semibold text-slate-700 mb-1">Requested Start</label>
              <input
                id="job-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label htmlFor="job-end" className="block text-xs font-semibold text-slate-700 mb-1">Requested End</label>
              <input
                id="job-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              href="/jobs"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !clientName}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 text-white font-semibold text-xs shadow-lg glow-indigo hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? "Creating..." : "Save & Open Assessment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
