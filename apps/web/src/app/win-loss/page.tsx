"use client";
import { useEffect, useState } from "react";
import { Search, RefreshCw, TrendingUp, TrendingDown, BarChart3, X } from "@/components/icons";
import { api } from "@/lib/api";
import { toast } from "@/components/feedback";

function outcomeBadge(outcome: string) {
  const colors: Record<string, string> = {
    won: "bg-green-100 text-green-800", lost: "bg-red-100 text-red-700",
    no_go: "bg-yellow-100 text-yellow-800", pending: "bg-gray-100 text-gray-600",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[outcome] || "bg-gray-100 text-gray-600"}`}>{outcome.replace(/_/g, " ").toUpperCase()}</span>;
}

export default function WinLossPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => { loadData(); loadSummary(); }, [regionFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params: any = {};
      if (regionFilter !== "all") params.region = regionFilter;
      const res = await api.listWinLoss(params);
      setItems(res.items || res.data || res || []);
    } catch { toast.error("Failed to load"); }
    setLoading(false);
  }

  async function loadSummary() {
    try {
      const res = regionFilter !== "all" ? await api.winLossByRegion(regionFilter) : await api.winLossSummary();
      setSummary(res);
    } catch { /* ignore */ }
  }

  const filtered = items.filter((i: any) =>
    (i.client_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.enquiry_id || "").toLowerCase().includes(search.toLowerCase()) ||
    (i.sector || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Win-Loss Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">Track enquiry outcomes, win rates, and loss reasons</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-sm text-gray-500">Win Rate</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{summary.win_rate != null ? `${(summary.win_rate * 100).toFixed(0)}%` : "—"}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Avg Cycle Days</p>
            <p className="text-3xl font-bold text-gray-900">{summary.avg_cycle_days?.toFixed(0) || "—"}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Total Won / Lost</p>
            <p className="text-3xl font-bold">
              <span className="text-green-600">{summary.won_count || 0}</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-red-600">{summary.lost_count || 0}</span>
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2">Top Loss Reasons</p>
            <div className="space-y-1">
              {(summary.top_loss_reasons || []).slice(0, 3).map((r: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 truncate">{r.reason || r}</span>
                  {r.count && <span className="text-gray-500 ml-2">{r.count}</span>}
                </div>
              ))}
              {(!summary.top_loss_reasons || summary.top_loss_reasons.length === 0) && (
                <p className="text-xs text-gray-400">No data</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client, enquiry, sector..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="all">All Regions</option>
          <option value="S">South</option>
          <option value="N">North</option>
          <option value="E">East</option>
          <option value="W">West</option>
        </select>
        <button onClick={loadData} className="p-2 border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Enquiry</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Sector</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Region</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Value</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Outcome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reason</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Competitor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cycle Days</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No records found</td></tr>
            ) : filtered.map((item: any) => (
              <tr key={item.record_id || item._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{item.enquiry_id}</td>
                <td className="px-4 py-3">{item.client_name}</td>
                <td className="px-4 py-3">{item.sector || "—"}</td>
                <td className="px-4 py-3">{item.region_code || "—"}</td>
                <td className="px-4 py-3">{item.value ? `₹${item.value.toLocaleString()}` : "—"}</td>
                <td className="px-4 py-3">{outcomeBadge(item.outcome)}</td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">{item.reason || "—"}</td>
                <td className="px-4 py-3 text-xs">{item.competitor || "—"}</td>
                <td className="px-4 py-3">{item.cycle_days || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
