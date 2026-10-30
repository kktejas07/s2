"use client";
import { useEffect, useState } from "react";
import { Search, Plus, RefreshCw, ArrowRight, CheckCircle2, X } from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

export default function JobHandoffPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({
    enquiry_id: "", region_code: "S", service_line: "PART_A",
    po_number: "", po_value: 0, client_contact: "",
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.listConversions();
      setItems(res.items || res.data || res || []);
    } catch { toast.error("Failed to load conversions"); }
    setLoading(false);
  }

  async function handleConvert() {
    setConverting(true);
    try {
      const res = await api.convertEnquiryToJob(form);
      setResult(res);
      toast.success(`Job created: ${res.j_no || res.job_id}`);
      loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Conversion failed");
    }
    setConverting(false);
  }

  const filtered = items.filter((i: any) =>
    (i.enquiry_id || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.j_no || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.job_id || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Handoff</h1>
          <p className="text-sm text-gray-500 mt-1">Convert won enquiries into active jobs with J.No generation</p>
        </div>
        <button onClick={() => { setShowModal(true); setResult(null); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Convert Enquiry
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by enquiry or J.No..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <button onClick={loadData} className="p-2 border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Enquiry ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">J.No</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Region</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Service Line</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PO Number</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PO Value</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Converted</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No conversions found</td></tr>
            ) : filtered.map((item: any) => (
              <tr key={item.conversion_id || item._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{item.enquiry_id}</td>
                <td className="px-4 py-3"><ArrowRight className="w-4 h-4 text-gray-400" /></td>
                <td className="px-4 py-3 font-mono text-xs font-bold text-blue-700">{item.j_no || item.job_id}</td>
                <td className="px-4 py-3">{item.region_code}</td>
                <td className="px-4 py-3">{(item.service_line || "").replace(/_/g, " ")}</td>
                <td className="px-4 py-3">{item.po_number || "—"}</td>
                <td className="px-4 py-3">{item.po_value ? `₹${item.po_value.toLocaleString()}` : "—"}</td>
                <td className="px-4 py-3">{item.converted_at ? new Date(item.converted_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Convert Enquiry to Job</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>

            {result ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900">Job Created Successfully</p>
                <p className="text-3xl font-bold text-blue-700 mt-2 font-mono">{result.j_no || result.job_id}</p>
                <p className="text-sm text-gray-500 mt-2">Enquiry {form.enquiry_id} has been converted</p>
                <button onClick={() => setShowModal(false)} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Done</button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enquiry ID</label>
                    <input value={form.enquiry_id} onChange={e => setForm({ ...form, enquiry_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="ENQ-XXXXX" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                      <select value={form.region_code} onChange={e => setForm({ ...form, region_code: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                        <option value="S">South</option>
                        <option value="N">North</option>
                        <option value="E">East</option>
                        <option value="W">West</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Line</label>
                      <select value={form.service_line} onChange={e => setForm({ ...form, service_line: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                        <option value="PART_A">Part A - TPI</option>
                        <option value="PART_B">Part B - Vendor Audit</option>
                        <option value="PART_C">Part C - Expediting</option>
                        <option value="MANPOWER">Manpower Supply</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                      <input value={form.po_number} onChange={e => setForm({ ...form, po_number: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PO Value (₹)</label>
                      <input type="number" value={form.po_value} onChange={e => setForm({ ...form, po_value: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Contact</label>
                    <input value={form.client_contact} onChange={e => setForm({ ...form, client_contact: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={handleConvert} disabled={converting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {converting ? "Converting..." : "Convert to Job"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
