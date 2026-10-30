"use client";

import { useEffect, useState } from "react";
import { 
  ShoppingBag, Search, Plus, MapPin, Mail, Phone, X, CheckCircle2, 
  MoreVertical, Edit3, Power, Layers, LayoutGrid, LayoutList, RefreshCw, Factory, Tag, Globe, Compass, DollarSign, Calendar, FileText, ArrowRight 
} from "@/components/icons";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

interface POItem {
  po_item_id: string;
  item_no: number;
  description: string;
  tag_number?: string;
  quantity: number;
  uom?: string;
  inspection_activity?: string;
  number_of_visits?: number;
  rate: number;
  amount: number;
  remarks?: string;
}

const alphabet = ["ALL", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [pos, setPos] = useState<any[]>([]);
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
  const [showPOModal, setShowPOModal] = useState(false);
  const [editingPO, setEditingPO] = useState<any | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Line Items Sub-Dialog State
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedPOForItems, setSelectedPOForItems] = useState<any | null>(null);
  const [poItems, setPoItems] = useState<POItem[]>([]);
  
  // Add Line Item Form State
  const [itemDesc, setItemDesc] = useState("");
  const [itemTag, setItemTag] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemUom, setItemUom] = useState("NOS");
  const [itemRate, setItemRate] = useState(0);
  const [itemActivity, setItemActivity] = useState("TPI & Visual Inspection");
  const [itemVisits, setItemVisits] = useState(1);

  // Form State for Add / Edit PO
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedClientUnitId, setSelectedClientUnitId] = useState("");
  const [selectedMfrId, setSelectedMfrId] = useState("");
  const [selectedMfrUnitId, setSelectedMfrUnitId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState("");
  const [poAmount, setPoAmount] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPOs();
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

  async function loadPOs() {
    setLoading(true);
    try {
      const activeParam = statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined;
      const r = await api.listPurchaseOrders({ 
        search, 
        alpha: selectedAlpha === "ALL" ? "" : selectedAlpha,
        is_active: activeParam,
        per_page: 200 
      });
      setPos(r.data || []);
    } catch (e) {
      console.error(e);
      // Fallback sample purchase order database matching legacy PO list
      setPos([
        { 
          po_id: "PO-001", 
          po_number: "PO/RIL/2026/094", 
          po_date: "2026-07-15", 
          client_id: "C-001", 
          client_name: "Reliance Industries Ltd", 
          client_unit_name: "Jamnagar Refinery Complex", 
          manufacturer_id: "M-001", 
          manufacturer_name: "BHEL Trichy Boilers", 
          manufacturer_unit_name: "Unit 1 Heavy Works", 
          po_amount: 4500000, 
          currency: "INR", 
          total_items: 4, 
          remarks: "Annual TPI Contract for Pressure Vessel Audit", 
          is_active: true, 
          created_at: "2026-07-15" 
        },
        { 
          po_id: "PO-002", 
          po_number: "PO/LNT/2026/441", 
          po_date: "2026-07-20", 
          client_id: "C-002", 
          client_name: "L&T Heavy Engineering", 
          client_unit_name: "Hazira Fabrication Yard", 
          manufacturer_id: "M-002", 
          manufacturer_name: "Godrej Heavy Engineering", 
          manufacturer_unit_name: "Vikhroli Works", 
          po_amount: 2800000, 
          currency: "INR", 
          total_items: 6, 
          remarks: "Subsea Piping Spool Inspection", 
          is_active: true, 
          created_at: "2026-07-20" 
        },
        { 
          po_id: "PO-003", 
          po_number: "PO/ONGC/2026/812", 
          po_date: "2026-08-01", 
          client_id: "C-003", 
          client_name: "ONGC Offshore Project", 
          client_unit_name: "Mumbai High Offshore Platform", 
          manufacturer_id: "M-003", 
          manufacturer_name: "ISGEC Yamunanagar", 
          manufacturer_unit_name: "Boiler Shop 2", 
          po_amount: 6200000, 
          currency: "INR", 
          total_items: 3, 
          remarks: "Offshore Platform QC & Valve Hydro-testing", 
          is_active: true, 
          created_at: "2026-08-01" 
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingPO(null);
    setSelectedClientId("");
    setSelectedClientUnitId("");
    setSelectedMfrId("");
    setSelectedMfrUnitId("");
    setPoNumber("");
    setPoDate(new Date().toISOString().split("T")[0]);
    setPoAmount(0);
    setRemarks("");
    setShowPOModal(true);
  };

  const handleOpenEditModal = (po: any) => {
    setEditingPO(po);
    setSelectedClientId(po.client_id || "");
    setSelectedClientUnitId(po.client_unit_id || "");
    setSelectedMfrId(po.manufacturer_id || "");
    setSelectedMfrUnitId(po.manufacturer_unit_id || "");
    setPoNumber(po.po_number || "");
    setPoDate(po.po_date ? po.po_date.split("T")[0] : "");
    setPoAmount(po.po_amount || 0);
    setRemarks(po.remarks || "");
    setShowPOModal(true);
    setActiveDropdown(null);
  };

  const handleSavePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const clientObj = clients.find((c) => c.client_id === selectedClientId);
    const clientUnitObj = clientUnits.find((u) => u.client_unit_id === selectedClientUnitId);
    const mfrObj = mfrs.find((m) => m.manufacturer_id === selectedMfrId);
    const mfrUnitObj = mfrUnits.find((u) => u.manufacturer_unit_id === selectedMfrUnitId);

    const payload = {
      po_number: poNumber,
      po_date: poDate,
      client_id: selectedClientId,
      client_name: clientObj ? clientObj.name : undefined,
      client_unit_id: selectedClientUnitId,
      client_unit_name: clientUnitObj ? clientUnitObj.name : undefined,
      manufacturer_id: selectedMfrId,
      manufacturer_name: mfrObj ? mfrObj.name : undefined,
      manufacturer_unit_id: selectedMfrUnitId,
      manufacturer_unit_name: mfrUnitObj ? mfrUnitObj.name : undefined,
      po_amount: Number(poAmount),
      remarks,
    };

    try {
      if (editingPO) {
        await api.updatePurchaseOrder(editingPO.po_id, payload);
      } else {
        const nextAutoId = `PO-${(pos.length + 1).toString().padStart(3, "0")}`;
        await api.createPurchaseOrder({ ...payload, po_id: nextAutoId });
      }
      setShowPOModal(false);
      loadPOs();
    } catch (err) {
      console.error("Failed to save purchase order:", err);
      toast.error("Couldn't save the purchase order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (po: any) => {
    try {
      await api.updatePOStatus(po.po_id, !po.is_active);
      loadPOs();
    } catch (e) {
      console.error(e);
    } finally {
      setActiveDropdown(null);
    }
  };

  // Open Line Items Modal
  const handleOpenItemsModal = async (po: any) => {
    setSelectedPOForItems(po);
    setShowItemsModal(true);
    setActiveDropdown(null);
    try {
      const detail = await api.getPurchaseOrder(po.po_id);
      setPoItems(detail.items || []);
    } catch (e) {
      console.warn("Failed to fetch PO items, using sample line items", e);
      setPoItems([
        { po_item_id: `${po.po_id}-01`, item_no: 1, description: "90 Degree Forged Carbon Steel Pipe Elbows (DN150 PN40)", tag_number: "TAG-ELB-901", quantity: 10, uom: "NOS", rate: 45000, amount: 450000, inspection_activity: "Visual & Hydrostatic Pressure Test", number_of_visits: 2 },
        { po_item_id: `${po.po_id}-02`, item_no: 2, description: "Seamless Heat Exchanger Tubes (SS316L, 1 inch OD x 18 SWG)", tag_number: "TAG-TB-102", quantity: 250, uom: "MTRS", rate: 1200, amount: 300000, inspection_activity: "Eddy Current & PMI Verification", number_of_visits: 3 },
      ]);
    }
  };

  const handleAddLineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOForItems || !itemDesc) return;
    const rateVal = Number(itemRate);
    const qtyVal = Number(itemQty);
    const amtVal = rateVal * qtyVal;

    try {
      await api.addPOLineItem(selectedPOForItems.po_id, {
        item_no: poItems.length + 1,
        description: itemDesc,
        tag_number: itemTag,
        quantity: qtyVal,
        uom: itemUom,
        rate: rateVal,
        amount: amtVal,
        inspection_activity: itemActivity,
        number_of_visits: Number(itemVisits),
      });

      setItemDesc("");
      setItemTag("");
      setItemQty(1);
      setItemRate(0);

      const updatedDetail = await api.getPurchaseOrder(selectedPOForItems.po_id);
      setPoItems(updatedDetail.items || []);
      loadPOs();
    } catch (e) {
      console.error("Failed to add line item", e);
      toast.error("Couldn't add the line item to the purchase order. Please try again.");
    }
  };

  // Start Job with selected Purchase Order
  const handleStartJobWithPO = (po: any) => {
    const params = new URLSearchParams({
      po_id: po.po_id,
      po_number: po.po_number || "",
      client_id: po.client_id || "",
      client_unit_id: po.client_unit_id || "",
      mfr_id: po.manufacturer_id || "",
      mfr_unit_id: po.manufacturer_unit_id || "",
    });
    router.push(`/jobs/new?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Purchase Orders & TPI Line Items</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
              {pos.length} Active Orders
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage customer purchase orders, line item BOQs, client/supplier unit links, and start inspection jobs
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button aria-label="Refresh Directory"
            onClick={loadPOs}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-brand-600 text-white font-semibold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Alphabetical A-Z Jump Bar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alphabetical Index</span>
          <span className="text-[11px] font-mono text-blue-600 font-semibold">Filter by Customer / Supplier initial</span>
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
        <div className="relative flex-1">
          <input
            aria-label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO by File No (e.g. PO-001), PO Ref, Customer, Supplier, Remarks..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "active" ? "bg-white text-blue-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
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
              className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button aria-label="Card Grid View"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Content Area */}
      {viewMode === "table" ? (
        /* Data Table View (Matching _PurchaseOrdersList.cshtml) */
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">File No</th>
                  <th className="p-3">Customer Name & Unit</th>
                  <th className="p-3">Supplier Details</th>
                  <th className="p-3">PO Number & Date</th>
                  <th className="p-3 text-right">PO Amount</th>
                  <th className="p-3 text-center">Items Qty</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No purchase orders found matching criteria.
                    </td>
                  </tr>
                ) : (
                  pos.map((p) => (
                    <tr key={p.po_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-600">{p.po_id}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{p.client_name || "Unassigned Client"}</p>
                        {p.client_unit_name && <p className="text-[11px] text-slate-500">Unit: {p.client_unit_name}</p>}
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-slate-800">{p.manufacturer_name || "Unassigned Supplier"}</p>
                        {p.manufacturer_unit_name && <p className="text-[11px] text-slate-400">Plant: {p.manufacturer_unit_name}</p>}
                      </td>
                      <td className="p-3">
                        <p className="font-mono font-bold text-slate-800">{p.po_number}</p>
                        {p.po_date && <p className="text-[11px] text-slate-400">{new Date(p.po_date).toLocaleDateString()}</p>}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ₹{(p.po_amount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleOpenItemsModal(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold font-mono text-[11px] hover:bg-blue-100 transition-colors"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          {p.total_items || (p.items ? p.items.length : 0)} Items
                        </button>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          p.is_active !== false ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {p.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3 text-right relative">
                        <button aria-label="More actions" title="More actions"
                          onClick={() => setActiveDropdown(activeDropdown === p.po_id ? null : p.po_id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Ellipsis Menu */}
                        {activeDropdown === p.po_id && (
                          <div className="absolute right-3 top-10 z-20 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-left text-xs space-y-0.5">
                            <button
                              onClick={() => handleStartJobWithPO(p)}
                              className="w-full px-3 py-1.5 hover:bg-brand-50 text-brand-700 flex items-center gap-2 font-bold"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>Start Job with PO</span>
                            </button>
                            <button
                              onClick={() => handleOpenItemsModal(p)}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                            >
                              <Layers className="w-3.5 h-3.5 text-blue-600" />
                              <span>Manage Line Items</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                              <span>Edit Order</span>
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              onClick={() => handleToggleStatus(p)}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                            >
                              <Power className={`w-3.5 h-3.5 ${p.is_active !== false ? "text-rose-600" : "text-emerald-600"}`} />
                              <span>{p.is_active !== false ? "Inactivate PO" : "Activate PO"}</span>
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
          {pos.map((p) => (
            <div
              key={p.po_id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                    {p.po_id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    p.is_active !== false ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {p.is_active !== false ? "Active" : "Inactive"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">{p.po_number}</h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">{p.client_name}</p>
                  {p.client_unit_name && <p className="text-[11px] text-slate-400">Unit: {p.client_unit_name}</p>}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                  <p><span className="text-slate-400">Supplier:</span> {p.manufacturer_name || "N/A"}</p>
                  <p><span className="text-slate-400">Total Value:</span> <span className="font-mono font-bold text-slate-900">₹{(p.po_amount || 0).toLocaleString()}</span></p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleStartJobWithPO(p)}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors flex items-center gap-1"
                >
                  <span>Start Job</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleOpenItemsModal(p)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Items ({p.total_items || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Purchase Order Modal */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {editingPO ? `Edit Purchase Order (${editingPO.po_id})` : "Add New Purchase Order"}
                </h2>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowPOModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePO} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="purord-customer-client" className="block text-xs font-semibold text-slate-700 mb-1">Customer / Client *</label>
                  <select id="purord-customer-client"
                    required
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label htmlFor="purord-client-plant-unit-site" className="block text-xs font-semibold text-slate-700 mb-1">Client Plant Unit Site</label>
                  <select id="purord-client-plant-unit-site"
                    value={selectedClientUnitId}
                    onChange={(e) => setSelectedClientUnitId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label htmlFor="purord-supplier-manufacturer" className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Manufacturer *</label>
                  <select id="purord-supplier-manufacturer"
                    required
                    value={selectedMfrId}
                    onChange={(e) => setSelectedMfrId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label htmlFor="purord-supplier-plant-unit" className="block text-xs font-semibold text-slate-700 mb-1">Supplier Plant Unit</label>
                  <select id="purord-supplier-plant-unit"
                    value={selectedMfrUnitId}
                    onChange={(e) => setSelectedMfrUnitId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label htmlFor="purord-po-ref-number" className="block text-xs font-semibold text-slate-700 mb-1">PO Ref / Number *</label>
                  <input id="purord-po-ref-number"
                    type="text"
                    required
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="e.g. PO/RIL/2026/094"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="purord-po-date" className="block text-xs font-semibold text-slate-700 mb-1">PO Date</label>
                  <input id="purord-po-date"
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="purord-total-po-amount-inr" className="block text-xs font-semibold text-slate-700 mb-1">Total PO Amount (INR)</label>
                <input id="purord-total-po-amount-inr"
                  type="number"
                  value={poAmount}
                  onChange={(e) => setPoAmount(Number(e.target.value))}
                  placeholder="e.g. 4500000"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="purord-remarks-contract-scope-notes" className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Contract Scope Notes</label>
                <textarea id="purord-remarks-contract-scope-notes"
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add scope details or inspection requirements..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !poNumber || !selectedClientId}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Saving..." : "Save Purchase Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage PO Line Items Sub-Dialog */}
      {showItemsModal && selectedPOForItems && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    PO Line Items BOQ Breakdown — {selectedPOForItems.po_number}
                  </h2>
                  <p className="text-xs text-slate-500">File No: {selectedPOForItems.po_id} • Customer: {selectedPOForItems.client_name}</p>
                </div>
              </div>
              <button aria-label="Close" title="Close" onClick={() => setShowItemsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Existing Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Configured BOQ Line Items ({poItems.length})
                </h3>
                <span className="text-xs font-mono font-bold text-blue-700">
                  Total Value: ₹{poItems.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()}
                </span>
              </div>

              {poItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-xl border">
                  No line items configured yet for this purchase order.
                </p>
              ) : (
                <div className="space-y-2">
                  {poItems.map((item, idx) => (
                    <div key={item.po_item_id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-500">#{item.item_no || idx + 1}</span>
                          <span className="font-bold text-slate-900">{item.description}</span>
                          {item.tag_number && <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[11px] font-bold">{item.tag_number}</span>}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          <span>Activity: {item.inspection_activity || "TPI Inspection"} • </span>
                          <span>Visits: {item.number_of_visits || 1} • </span>
                          <span className="font-mono font-semibold">Qty: {item.quantity} {item.uom || "NOS"} @ ₹{item.rate}/unit</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-slate-900 text-sm">₹{(item.amount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form to Add New Line Item */}
            <form onSubmit={handleAddLineItem} className="pt-4 border-t border-slate-200 space-y-3 bg-slate-50/50 p-4 rounded-xl border">
              <h3 className="text-xs font-bold text-slate-900 font-heading">Add New BOQ Line Item</h3>

              <div>
                <label htmlFor="purord-equipment-description-boq-item" className="block text-xs font-semibold text-slate-700 mb-1">Equipment Description / BOQ Item *</label>
                <input id="purord-equipment-description-boq-item"
                  type="text"
                  required
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="e.g. 90 Degree Forged Steel Pipe Elbows (DN150 PN40)"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label htmlFor="purord-tag-drawing-no" className="block text-xs font-semibold text-slate-700 mb-1">Tag / Drawing No</label>
                  <input id="purord-tag-drawing-no"
                    type="text"
                    value={itemTag}
                    onChange={(e) => setItemTag(e.target.value)}
                    placeholder="TAG-ELB-01"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="purord-quantity" className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input id="purord-quantity"
                    type="number"
                    value={itemQty}
                    onChange={(e) => setItemQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label htmlFor="purord-unit-of-measure" className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <select id="purord-unit-of-measure"
                    value={itemUom}
                    onChange={(e) => setItemUom(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NOS">NOS</option>
                    <option value="MTRS">MTRS</option>
                    <option value="KGS">KGS</option>
                    <option value="SETS">SETS</option>
                    <option value="LOT">LOT</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="purord-unit-rate-inr" className="block text-xs font-semibold text-slate-700 mb-1">Unit Rate (INR)</label>
                  <input id="purord-unit-rate-inr"
                    type="number"
                    value={itemRate}
                    onChange={(e) => setItemRate(Number(e.target.value))}
                    placeholder="45000"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowItemsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!itemDesc}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                >
                  Add Line Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
