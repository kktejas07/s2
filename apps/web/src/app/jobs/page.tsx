"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Briefcase, Search, Plus, MapPin, X, CheckCircle2, 
  MoreVertical, Edit3, Power, LayoutGrid, LayoutList, RefreshCw, User, UserCheck, Factory, Tag, Globe, Compass, ShieldAlert, ArrowRight, Clock, AlertTriangle, DollarSign, Calendar, CalendarCheck, FileText, Check, Award, Layers, ListChecks, FileSpreadsheet, History, GitCommit, UserX, Sparkles, BookOpen, Layers3, CheckSquare
} from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

const alphabet = ["ALL", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

const jobCategories = [
  { code: "PV-PIPE", name: "Pressure Vessel & Heavy Piping Audit" },
  { code: "STR-FAB", name: "Structural & Heavy Fabrication Audit" },
  { code: "NDT-RAD", name: "Non-Destructive Testing (NDT) Witnessing" },
  { code: "VND-AUD", name: "Vendor Capability & Quality Audit" },
  { code: "PRE-SHP", name: "Final Pre-Shipment & Packaging Audit" },
  { code: "CUSTOM", name: "Custom Scope Inspection Job" },
];

const sampleInspectors = [
  { id: "INS-001", name: "Alok Gupta (Senior TPI Engineer)", certs: ["ASNT Level III NDT", "API 510 Pressure Vessel"], exp: 14 },
  { id: "INS-002", name: "S. Sundaram (Subsea & NDT Inspector)", certs: ["CSWIP 3.1 Welding Inspector", "ISNT Level II UT/MT"], exp: 11 },
  { id: "INS-003", name: "Vikram Sharma (Metallurgical Auditor)", certs: ["NACE Coating Inspector", "API 653 Storage Tank"], exp: 16 },
  { id: "INS-004", name: "Rao (QC Specialist)", certs: ["ISO 9001 Lead Auditor", "ASNT Level II Radiography"], exp: 9 },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [mfrs, setMfrs] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [selectedAlpha, setSelectedAlpha] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending_approval" | "approved" | "rejected" | "in_progress">("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [loading, setLoading] = useState(true);

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Submit Inspector CV Modal
  const [showCvModal, setShowCvModal] = useState(false);
  const [selectedJobForCv, setSelectedJobForCv] = useState<any | null>(null);
  const [selectedInspectorId, setSelectedInspectorId] = useState(sampleInspectors[0].id);

  // Client Approval Sub-Dialog
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedJobForApproval, setSelectedJobForApproval] = useState<any | null>(null);
  const [clientApproveDecision, setClientApproveDecision] = useState<boolean>(true);
  const [clientRemarks, setClientRemarks] = useState("");

  // Budget & Schedule Modal
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedJobForBudget, setSelectedJobForBudget] = useState<any | null>(null);
  const [contractAmt, setContractAmt] = useState<number>(250000);
  const [inspectorFee, setInspectorFee] = useState<number>(80000);
  const [travelFee, setTravelFee] = useState<number>(15000);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // SOW Checklist & Pre-Defined Templates Modal
  const [showSowModal, setShowSowModal] = useState(false);
  const [selectedJobForSow, setSelectedJobForSow] = useState<any | null>(null);
  const [sowItems, setSowItems] = useState<any[]>([]);
  const [newSowText, setNewSowText] = useState("");
  const [sowTemplates, setSowTemplates] = useState<any[]>([]);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>("PV-ASME");

  // Roadmap Timeline Modal
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [roadmapJob, setRoadmapJob] = useState<any | null>(null);
  const [roadmapData, setRoadmapData] = useState<any | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  // Form State for Create Job
  const [jobTitle, setJobTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("PV-PIPE");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedMfrId, setSelectedMfrId] = useState("");
  const [poNo, setPoNo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadJobs();
    loadDropdowns();
    loadSowTemplates();
  }, [search, selectedAlpha, statusFilter]);

  async function loadDropdowns() {
    try {
      const cRes = await api.listClients({ per_page: 200 });
      setClients(cRes.data || []);
      const mRes = await api.listManufacturers({ per_page: 200 });
      setMfrs(mRes.data || []);
    } catch (e) {
      console.warn(e);
    }
  }

  async function loadSowTemplates() {
    try {
      const res = await api.getSOWTemplates();
      setSowTemplates(Array.isArray(res) ? res : (res?.templates || []));
    } catch (e) {
      console.warn("Failed to load SOW templates", e);
    }
  }

  async function loadJobs() {
    setLoading(true);
    try {
      const r = await api.listJobs({ 
        search, 
        per_page: 200 
      });
      let fetchedJobs = r.data || [];

      if (selectedAlpha !== "ALL") {
        fetchedJobs = fetchedJobs.filter((j: any) => j.title?.toUpperCase().startsWith(selectedAlpha) || j.client_name?.toUpperCase().startsWith(selectedAlpha));
      }

      if (statusFilter === "pending_approval") {
        fetchedJobs = fetchedJobs.filter((j: any) => j.client_approval_status === "pending_client_approval");
      } else if (statusFilter === "approved") {
        fetchedJobs = fetchedJobs.filter((j: any) => j.client_approval_status === "approved_by_client");
      } else if (statusFilter === "rejected") {
        fetchedJobs = fetchedJobs.filter((j: any) => j.client_approval_status === "rejected_by_client");
      } else if (statusFilter === "in_progress") {
        fetchedJobs = fetchedJobs.filter((j: any) => j.status === "in_progress");
      }

      setJobs(fetchedJobs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Handle Create Job
  const handleOpenCreateModal = () => {
    setJobTitle("Reliance Hazira Heavy Pressure Vessel Audit");
    setSelectedCategory("PV-PIPE");
    setSelectedClientId("");
    setSelectedMfrId("");
    setPoNo("PO/RIL/2026/094");
    setShowCreateModal(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const clientObj = clients.find((c) => c.client_id === selectedClientId);
    const mfrObj = mfrs.find((m) => m.manufacturer_id === selectedMfrId);

    const payload = {
      title: jobTitle,
      job_type_category: selectedCategory,
      client_id: selectedClientId,
      client_name: clientObj ? clientObj.name : undefined,
      manufacturer_id: selectedMfrId,
      manufacturer_name: mfrObj ? mfrObj.name : undefined,
      po_number: poNo,
      budget_contract_amount: 250000,
      budget_inspector_fee: 80000,
      budget_travel_allowance: 15000,
      budget_total: 345000,
      budget: 345000,
      status: "open",
    };

    try {
      await api.createJob(payload);
      setShowCreateModal(false);
      loadJobs();
    } catch (e) {
      console.error("Failed to create job", e);
      toast.error("Couldn't create the inspection job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Inspector CV Submission / Re-assignment
  const handleOpenCvModal = (j: any) => {
    setSelectedJobForCv(j);
    setSelectedInspectorId(sampleInspectors[0].id);
    setShowCvModal(true);
    setActiveDropdown(null);
  };

  const handleSaveCvAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForCv) return;
    const insp = sampleInspectors.find((i) => i.id === selectedInspectorId);

    try {
      await api.assignJobInspector(selectedJobForCv.job_id, {
        inspector_id: selectedInspectorId,
        inspector_name: insp ? insp.name : "",
        certifications: insp ? insp.certs : [],
        experience_years: insp ? insp.exp : 10,
      });
      setShowCvModal(false);
      loadJobs();
    } catch (e) {
      console.error(e);
      toast.error("Couldn't submit the inspector CV. Please try again.");
    }
  };

  // Client Approval / Rejection Decision
  const handleOpenApprovalModal = (j: any, forceApprove = true) => {
    setSelectedJobForApproval(j);
    setClientApproveDecision(forceApprove);
    setClientRemarks(forceApprove ? "Approved by Client Quality Director." : "Rejected: Requires ASNT Level III NDT certification with 15+ years experience.");
    setShowApprovalModal(true);
    setActiveDropdown(null);
  };

  const handleSaveApprovalDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForApproval) return;

    try {
      await api.clientApproveInspector(selectedJobForApproval.job_id, {
        approved: clientApproveDecision,
        remarks: clientRemarks,
      });
      setShowApprovalModal(false);
      loadJobs();
    } catch (e) {
      console.error(e);
      toast.error("Couldn't record the client decision. Please try again.");
    }
  };

  // Budget & Schedule
  const handleOpenBudgetModal = (j: any) => {
    setSelectedJobForBudget(j);
    setContractAmt(j.budget_contract_amount || 250000);
    setInspectorFee(j.budget_inspector_fee || 80000);
    setTravelFee(j.budget_travel_allowance || 15000);
    setStartDate(j.scheduled_start_date ? j.scheduled_start_date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setEndDate(j.scheduled_end_date ? j.scheduled_end_date.split("T")[0] : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setShowBudgetModal(true);
    setActiveDropdown(null);
  };

  const handleSaveBudgetSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForBudget) return;

    try {
      await api.updateJobBudgetSchedule(selectedJobForBudget.job_id, {
        contract_amount: contractAmt,
        inspector_fee: inspectorFee,
        travel_allowance: travelFee,
        start_date: startDate,
        end_date: endDate,
      });
      setShowBudgetModal(false);
      loadJobs();
    } catch (e) {
      console.error(e);
      toast.error("Couldn't update the budget and schedule. Please try again.");
    }
  };

  // Scope of Work (SOW) & Scenario Templates
  const handleOpenSowModal = (j: any) => {
    setSelectedJobForSow(j);
    setSowItems(j.scope_of_work || []);
    setNewSowText("");
    setSelectedTemplateCode("PV-ASME");
    setShowSowModal(true);
    setActiveDropdown(null);
  };

  const handleApplySowScenarioTemplate = async () => {
    if (!selectedJobForSow) return;
    try {
      const res = await api.applySOWTemplate(selectedJobForSow.job_id, {
        template_code: selectedTemplateCode,
        append: true,
      });
      setSowItems(res.scope_of_work || []);
      toast.success(`Applied the ${res.applied_template} template (${(res.applicable_codes || []).join(", ")}).`);
      loadJobs();
    } catch (e) {
      console.error(e);
      toast.error("Couldn't apply the scope of work template. Please try again.");
    }
  };

  const handleToggleSowItem = (idx: number) => {
    setSowItems((prev) => prev.map((it, i) => (i === idx ? { ...it, completed: !it.completed } : it)));
  };

  const handleAddSowItem = () => {
    if (!newSowText.trim()) return;
    const newItem = {
      item_id: `SOW-${(sowItems.length + 1).toString().padStart(2, "0")}`,
      description: newSowText.trim(),
      category: "Custom Requirement",
      is_checklist: true,
      completed: false,
    };
    setSowItems([...sowItems, newItem]);
    setNewSowText("");
  };

  const handleSaveSow = async () => {
    if (!selectedJobForSow) return;
    try {
      await api.updateJobSOW(selectedJobForSow.job_id, { sow_items: sowItems });
      setShowSowModal(false);
      loadJobs();
    } catch (e) {
      console.error(e);
      toast.error("Couldn't save the scope of work. Please try again.");
    }
  };

  // Open Roadmap Timeline Modal
  const handleOpenRoadmapModal = async (j: any) => {
    setRoadmapJob(j);
    setShowRoadmapModal(true);
    setRoadmapLoading(true);
    setActiveDropdown(null);
    try {
      const res = await api.getJobAssignmentRoadmap(j.job_id);
      setRoadmapData(res);
    } catch (e) {
      console.error("Failed to load assignment roadmap", e);
    } finally {
      setRoadmapLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Inspection Assignments &amp; Service Orders</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold font-mono">
              Pre-defined Method Scenarios &amp; SOW Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pre-defined Scope of Work (SOW) method scenarios, multi-information ingestion, client portal CV approvals, and audit roadmap tracking
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadJobs}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh Assignments"
            aria-label="Refresh assignments"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1 min-w-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Inspection Assignments</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900">{jobs.length}</span>
            <Briefcase className="w-5 h-5 text-brand-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1 min-w-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pre-Defined Method Scenarios</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-purple-600">{sowTemplates.length}</span>
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1 min-w-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Client CV Approval</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-amber-600">
              {jobs.filter((j) => j.client_approval_status === "pending_client_approval").length}
            </span>
            <UserCheck className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1 min-w-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Allocated Budget</span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-extrabold font-mono text-blue-600 break-all">
              ₹{jobs.reduce((acc, j) => acc + (j.budget_total || j.budget || 0), 0).toLocaleString()}
            </span>
            <DollarSign className="w-5 h-5 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Alphabetical A-Z Jump Bar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alphabetical Customer &amp; Title Index</span>
          <span className="text-[11px] font-mono text-brand-600 font-semibold">Filter by Job Title or Client initial</span>
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
            aria-label="Search assignments"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Job ID (JOB-2026-001), Title, Client Name, PO Ref..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex flex-wrap p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "all" ? "bg-white text-slate-900 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Jobs
            </button>
            <button
              onClick={() => setStatusFilter("pending_approval")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "pending_approval" ? "bg-white text-amber-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pending CV
            </button>
            <button
              onClick={() => setStatusFilter("rejected")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "rejected" ? "bg-white text-rose-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Rejections
            </button>
            <button
              onClick={() => setStatusFilter("approved")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "approved" ? "bg-white text-emerald-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Approved
            </button>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-slate-600">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-brand-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Table View"
              aria-label="Table view"
              aria-pressed={viewMode === "table"}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-brand-600 shadow-sm" : "hover:text-slate-900"}`}
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
        /* Data Table View */
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Job ID</th>
                  <th className="p-3">Job Title &amp; Category</th>
                  <th className="p-3">Customer Client &amp; Site</th>
                  <th className="p-3">Assigned Inspector</th>
                  <th className="p-3">Client CV Approval</th>
                  <th className="p-3">SOW Method Scenario</th>
                  <th className="p-3">Budget &amp; Dates</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No inspection jobs found matching criteria.
                    </td>
                  </tr>
                ) : (
                  jobs.map((j) => (
                    <tr key={j.job_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-brand-600">{j.job_id}</td>
                      <td className="p-3 max-w-xs">
                        <p className="font-bold text-slate-900">{j.title}</p>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                          {j.job_type_category || "PV-PIPE"}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{j.client_name || "Unassigned Client"}</p>
                        {j.client_unit_name && <p className="text-[11px] text-slate-500">Unit: {j.client_unit_name}</p>}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {j.assigned_inspector_name ? (
                          <span>{j.assigned_inspector_name}</span>
                        ) : (
                          <span className="text-amber-600 text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          j.client_approval_status === "approved_by_client" ? "bg-emerald-100 text-emerald-800" :
                          j.client_approval_status === "rejected_by_client" ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse" :
                          j.client_approval_status === "pending_client_approval" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                        }`}>
                          {j.client_approval_status === "approved_by_client" ? "Approved by Client" :
                           j.client_approval_status === "rejected_by_client" ? "Rejected — Re-assign" :
                           j.client_approval_status === "pending_client_approval" ? "Pending CV Review" : "Draft Assignment"}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleOpenSowModal(j)}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] flex items-center gap-1 border border-purple-200"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>SOW ({j.scope_of_work ? j.scope_of_work.length : 0} Criteria)</span>
                        </button>
                      </td>
                      <td className="p-3 font-mono text-xs">
                        <p className="font-bold text-slate-900">₹{(j.budget_total || j.budget || 0).toLocaleString()}</p>
                        <p className="text-[11px] text-slate-500">{j.scheduled_start_date ? j.scheduled_start_date.split("T")[0] : "Dates TBD"}</p>
                      </td>
                      <td className="p-3 text-right relative">
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(activeDropdown === j.job_id ? null : j.job_id)}
                          aria-label={`Actions for ${j.job_id}`}
                          title="More actions"
                          aria-haspopup="menu"
                          aria-expanded={activeDropdown === j.job_id}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Ellipsis Menu */}
                        {activeDropdown === j.job_id && (
                          <div className="absolute right-3 top-10 z-20 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 text-left text-xs space-y-1">
                            <button
                              onClick={() => handleOpenApprovalModal(j, true)}
                              className="w-full px-3.5 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center gap-2 font-extrabold border-b border-slate-100 dark:border-slate-800"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Client Inspector Approval (Sign-off)</span>
                            </button>

                            <button
                              onClick={() => handleOpenApprovalModal(j, false)}
                              className="w-full px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 flex items-center gap-2 font-extrabold border-b border-slate-100 dark:border-slate-800"
                            >
                              <UserX className="w-4 h-4 text-rose-600" />
                              <span>Client Reject / Reassign Inspector</span>
                            </button>

                            <button
                              onClick={() => handleOpenSowModal(j)}
                              className="w-full px-3.5 py-2 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-400 flex items-center gap-2 font-bold"
                            >
                              <Sparkles className="w-4 h-4 text-purple-600" />
                              <span>Apply Pre-Defined Method SOW</span>
                            </button>

                            {j.client_approval_status === "rejected_by_client" ? (
                              <button
                                onClick={() => handleOpenCvModal(j)}
                                className="w-full px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 flex items-center gap-2 font-bold"
                              >
                                <UserX className="w-4 h-4" />
                                <span>Re-Assign Alternative Inspector</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenCvModal(j)}
                                className="w-full px-3.5 py-2 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-brand-700 dark:text-brand-400 flex items-center gap-2 font-bold"
                              >
                                <UserCheck className="w-4 h-4 text-brand-600" />
                                <span>Submit Inspector CV to Client</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenRoadmapModal(j)}
                              className="w-full px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2 font-bold"
                            >
                              <History className="w-4 h-4 text-slate-500" />
                              <span>View Roadmap Timeline</span>
                            </button>

                            <Link
                              href={`/visits/new?job_id=${j.job_id}`}
                              className="w-full px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-[#003366] dark:text-sky-300 flex items-center gap-2 font-extrabold border-t border-slate-100 dark:border-slate-800"
                            >
                              <CalendarCheck className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                              <span>+ Schedule / Assign Field Visit</span>
                            </Link>
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
          {jobs.map((j) => (
            <div
              key={j.job_id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-lg">
                    {j.job_id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    j.client_approval_status === "approved_by_client" ? "bg-emerald-100 text-emerald-800" :
                    j.client_approval_status === "rejected_by_client" ? "bg-rose-100 text-rose-800" :
                    j.client_approval_status === "pending_client_approval" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                  }`}>
                    {j.client_approval_status === "approved_by_client" ? "Approved" :
                     j.client_approval_status === "rejected_by_client" ? "Rejected" : "Pending CV"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">{j.title}</h3>
                  <p className="text-[11px] text-slate-500">{j.client_name}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <p><span className="text-slate-400">Inspector:</span> <span className="font-bold text-slate-900">{j.assigned_inspector_name || "Unassigned"}</span></p>
                  <p><span className="text-slate-400">SOW Checklists:</span> <span className="font-bold text-purple-700">{j.scope_of_work ? j.scope_of_work.length : 0} Criteria</span></p>
                  <p><span className="text-slate-400">Budget:</span> <span className="font-mono font-bold text-emerald-700">₹{(j.budget_total || j.budget || 0).toLocaleString()}</span></p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenSowModal(j)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs hover:bg-purple-100 transition-colors flex items-center gap-1 border border-purple-200"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SOW Scenario</span>
                </button>

                <button
                  onClick={() => handleOpenCvModal(j)}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors"
                >
                  Submit CV
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Job Wizard Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Briefcase className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Create Assessment (Industry Category)
                </h2>
              </div>
              <button type="button" onClick={() => setShowCreateModal(false)} aria-label="Close" title="Close" className="text-slate-400 hover:text-slate-600 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="space-y-3">
              <div>
                <label htmlFor="cj-title" className="block text-xs font-semibold text-slate-700 mb-1">Assessment Title *</label>
                <input id="cj-title"
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
              </div>

              <div>
                <label htmlFor="cj-category" className="block text-xs font-semibold text-slate-700 mb-1">Industry Assessment Category *</label>
                <select id="cj-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                >
                  {jobCategories.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.code} — {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cj-client" className="block text-xs font-semibold text-slate-700 mb-1">Corporate Client *</label>
                  <select id="cj-client"
                    required
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select Client</option>
                    {clients.map((c) => (
                      <option key={c.client_id} value={c.client_id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="cj-mfr" className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Manufacturer *</label>
                  <select id="cj-mfr"
                    required
                    value={selectedMfrId}
                    onChange={(e) => setSelectedMfrId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select Vendor</option>
                    {mfrs.map((m) => (
                      <option key={m.manufacturer_id} value={m.manufacturer_id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="cj-po" className="block text-xs font-semibold text-slate-700 mb-1">Purchase Order Reference (Optional)</label>
                <input id="cj-po"
                  type="text"
                  value={poNo}
                  onChange={(e) => setPoNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !jobTitle || !selectedClientId}
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Creating..." : "Create Assessment & Auto-Generate SOW"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scope of Work (SOW) & Pre-Defined Templates Modal */}
      {showSowModal && selectedJobForSow && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Pre-Defined Inspection Method Scenarios &amp; SOW Engine — {selectedJobForSow.job_id}
                  </h2>
                  <p className="text-xs text-slate-500">Job Category: {selectedJobForSow.job_type_category || "PV-PIPE"}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowSowModal(false)} aria-label="Close" title="Close" className="text-slate-400 hover:text-slate-600 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1-Click Pre-Defined Method Scenario Selector */}
            <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <label htmlFor="sow-template">Select Pre-Defined Inspection Method Scenario:</label>
                </div>
                <button
                  type="button"
                  onClick={handleApplySowScenarioTemplate}
                  className="px-3 py-1.5 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-700 shadow-sm flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1-Click Load Method Scenario</span>
                </button>
              </div>

              <select
                id="sow-template"
                value={selectedTemplateCode}
                onChange={(e) => setSelectedTemplateCode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
              >
                {sowTemplates.map((tmpl) => (
                  <option key={tmpl.code} value={tmpl.code}>
                    [{tmpl.topic}] {tmpl.method_name} — ({tmpl.applicable_codes.join(", ")})
                  </option>
                ))}
              </select>

              {/* Selected Scenario Preview Details */}
              {(() => {
                const currentTmpl = sowTemplates.find((t) => t.code === selectedTemplateCode);
                if (!currentTmpl) return null;
                return (
                  <div className="p-3 bg-white rounded-xl border border-purple-200 space-y-2 text-xs">
                    <p className="text-purple-950 font-bold">{currentTmpl.description}</p>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">
                        Hold Point: {currentTmpl.stage_hold_point}
                      </span>
                      {currentTmpl.applicable_codes?.map((code: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono font-bold">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Checklist Items & Manual Custom Add */}
            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Scope of Work Checklist ({sowItems.length} Criteria)</span>
                <span className="text-[11px] text-slate-500">Click any item to toggle completion status</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input
                  type="text"
                  aria-label="New scope of work item"
                  value={newSowText}
                  onChange={(e) => setNewSowText(e.target.value)}
                  placeholder="Add custom scope of work item description..."
                  className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddSowItem}
                  className="px-3 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700"
                >
                  Add Custom Item
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sowItems.map((item, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleToggleSowItem(idx)}
                    aria-pressed={!!item.completed}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      item.completed ? "bg-emerald-50/60 border-emerald-200 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-800 hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 max-w-xl min-w-0">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${item.completed ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"}`}>
                        {item.completed && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <p className="font-medium">{item.description}</p>
                        {item.notes && <p className="text-[11px] text-slate-500 font-mono mt-0.5">{item.notes}</p>}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500 shrink-0">
                      {item.category || "General"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSowModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSow}
                className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-sm"
              >
                Save Scope of Work
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit / Re-Assign Inspector CV Modal */}
      {showCvModal && selectedJobForCv && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <UserCheck className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {selectedJobForCv.client_approval_status === "rejected_by_client"
                    ? `Re-Assign Alternative Inspector — ${selectedJobForCv.job_id}`
                    : `Submit Inspector CV to Client — ${selectedJobForCv.job_id}`}
                </h2>
              </div>
              <button type="button" onClick={() => setShowCvModal(false)} aria-label="Close" title="Close" className="text-slate-400 hover:text-slate-600 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCvAssignment} className="space-y-3">
              {selectedJobForCv.client_approval_status === "rejected_by_client" && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <UserX className="w-4 h-4 text-rose-600" />
                    <span>Previous Inspector Rejected by Client:</span>
                  </p>
                  <p className="text-[11px] text-rose-800 font-mono">
                    "{selectedJobForCv.client_approval_remarks || "Rejection feedback from client"}"
                  </p>
                  <p className="text-[11px] text-rose-700">Select a new alternative Inspection Officer below to re-submit CV.</p>
                </div>
              )}

              <div>
                <label htmlFor="cv-inspector" className="block text-xs font-semibold text-slate-700 mb-1">Select Inspection Officer *</label>
                <select id="cv-inspector"
                  value={selectedInspectorId}
                  onChange={(e) => setSelectedInspectorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                >
                  {sampleInspectors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.exp} Yrs Exp)
                    </option>
                  ))}
                </select>
              </div>

              {/* Inspector Resume Details */}
              {(() => {
                const insp = sampleInspectors.find((i) => i.id === selectedInspectorId);
                return (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <p className="font-bold text-slate-900">CV &amp; Certification Profile Summary:</p>
                    <p><span className="text-slate-400">Total Industry Experience:</span> <span className="font-bold text-slate-800">{insp?.exp} Years</span></p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {insp?.certs.map((c, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-brand-100 text-brand-800 font-bold text-[11px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200">
                Submitting will send the Inspector's CV to client <strong>{selectedJobForCv.client_name}</strong> for portal approval before job dispatch.
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCvModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-sm"
                >
                  {selectedJobForCv.client_approval_status === "rejected_by_client" ? "Re-Submit CV to Client" : "Submit CV to Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Approval Sub-Dialog */}
      {showApprovalModal && selectedJobForApproval && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Simulate Client CV Response — {selectedJobForApproval.job_id}
                </h2>
              </div>
              <button type="button" onClick={() => setShowApprovalModal(false)} aria-label="Close" title="Close" className="text-slate-400 hover:text-slate-600 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveApprovalDecision} className="space-y-3">
              <div>
                <p id="client-decision-label" className="block text-xs font-semibold text-slate-700 mb-1">Client Approval Decision *</p>
                <div role="group" aria-labelledby="client-decision-label" className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setClientApproveDecision(true)}
                    aria-pressed={clientApproveDecision}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      clientApproveDecision ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Approve Inspector
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientApproveDecision(false)}
                    aria-pressed={!clientApproveDecision}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      !clientApproveDecision ? "bg-rose-600 text-white shadow-sm" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Reject Inspector
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="ap-remarks" className="block text-xs font-semibold text-slate-700 mb-1">Client Remarks *</label>
                <input id="ap-remarks"
                  type="text"
                  required
                  value={clientRemarks}
                  onChange={(e) => setClientRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm ${
                    clientApproveDecision ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  Confirm Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Audit Trail Roadmap Timeline Modal */}
      {showRoadmapModal && roadmapJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <History className="w-5 h-5 text-brand-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Assignment Audit Roadmap &amp; Backflow — {roadmapJob.job_id}
                  </h2>
                  <p className="text-xs text-slate-500">Client: {roadmapJob.client_name}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowRoadmapModal(false)} aria-label="Close" title="Close" className="text-slate-400 hover:text-slate-600 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {roadmapLoading ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
                <span>Loading assignment timeline roadmap...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400 font-medium">Active Inspector: </span>
                    <span className="font-bold text-slate-900">{roadmapJob.assigned_inspector_name || "Unassigned"}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    roadmapJob.client_approval_status === "approved_by_client" ? "bg-emerald-100 text-emerald-800" :
                    roadmapJob.client_approval_status === "rejected_by_client" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {roadmapJob.client_approval_status}
                  </span>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {(!roadmapData?.roadmap || roadmapData.roadmap.length === 0) ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 italic">
                      No previous inspector rejection attempts recorded. Current assignment is active.
                    </div>
                  ) : (
                    roadmapData.roadmap.map((attempt: any, idx: number) => {
                      const isRejected = attempt.status === "rejected_by_client";
                      const isApproved = attempt.status === "approved_by_client";
                      return (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white border-2 border-white ${
                            isApproved ? "bg-emerald-600" : isRejected ? "bg-rose-600" : "bg-amber-500 animate-pulse"
                          }`}>
                            {idx + 1}
                          </div>

                          <div className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
                            isApproved ? "bg-emerald-50/50 border-emerald-200" :
                            isRejected ? "bg-rose-50/50 border-rose-200" : "bg-slate-50 border-slate-200"
                          }`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-brand-700">
                                {attempt.entry_id || `ATTEMPT #${idx + 1}`}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                                isApproved ? "bg-emerald-100 text-emerald-800" :
                                isRejected ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {isApproved ? "Approved by Client" : isRejected ? "Rejected by Client" : "Pending Review"}
                              </span>
                            </div>

                            <div>
                              <p className="font-bold text-slate-900 text-sm">{attempt.inspector_name}</p>
                              <p className="text-slate-500 text-[11px]">{attempt.experience_years} Years Experience</p>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {attempt.certifications?.map((c: string, cIdx: number) => (
                                <span key={cIdx} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700">
                                  {c}
                                </span>
                              ))}
                            </div>

                            {attempt.client_remarks && (
                              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-mono">
                                <span className="font-bold text-slate-500">Client Feedback: </span>
                                "{attempt.client_remarks}"
                              </div>
                            )}

                            <div className="text-[11px] text-slate-400 pt-1 flex flex-wrap items-center justify-between gap-x-3 font-mono">
                              <span>Submitted: {attempt.submitted_at ? attempt.submitted_at.replace("T", " ").substring(0, 19) : "N/A"}</span>
                              {attempt.decided_at && <span>Decided: {attempt.decided_at.replace("T", " ").substring(0, 19)}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRoadmapModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl"
              >
                Close Roadmap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget & Schedule Modal */}
      {showBudgetModal && selectedJobForBudget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Allocate Budget &amp; Schedule Dates — {selectedJobForBudget.job_id}
                </h2>
              </div>
              <button type="button" onClick={() => setShowBudgetModal(false)} aria-label="Close" title="Close" className="text-slate-400 hover:text-slate-600 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudgetSchedule} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="bg-contract" className="block text-xs font-semibold text-slate-700 mb-1">Contract Value (₹)</label>
                  <input id="bg-contract"
                    type="number"
                    value={contractAmt}
                    onChange={(e) => setContractAmt(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="bg-inspector-fee" className="block text-xs font-semibold text-slate-700 mb-1">Inspector Fee (₹)</label>
                  <input id="bg-inspector-fee"
                    type="number"
                    value={inspectorFee}
                    onChange={(e) => setInspectorFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="bg-travel" className="block text-xs font-semibold text-slate-700 mb-1">Travel Fee (₹)</label>
                  <input id="bg-travel"
                    type="number"
                    value={travelFee}
                    onChange={(e) => setTravelFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bg-start" className="block text-xs font-semibold text-slate-700 mb-1">Job Start Date *</label>
                  <input id="bg-start"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="bg-end" className="block text-xs font-semibold text-slate-700 mb-1">Job End Date *</label>
                  <input id="bg-end"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm"
                >
                  Save Budget &amp; Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
