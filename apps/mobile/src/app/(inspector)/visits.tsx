import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "../../api/client";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-gray-100", initiated: "bg-blue-100", in_progress: "bg-yellow-100",
  completed: "bg-green-100", quality_check_completed: "bg-purple-100",
  finance_check_completed: "bg-teal-100",
};

export default function VisitsScreen() {
  const router = useRouter();
  const { job_id } = useLocalSearchParams<{ job_id: string }>();
  const [visits, setVisits] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const params: any = { per_page: 50 };
    if (filter) params.status = filter;
    if (job_id) params.job_id = job_id;
    const r = await api.listVisits(params);
    setVisits(r.data || []);
  }, [filter, job_id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const filters = ["", "scheduled", "initiated", "in_progress", "completed"];

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold mb-4">{job_id ? `Visits: ${job_id}` : "All Visits"}</Text>
      <View className="flex-row mb-4 gap-2">
        {filters.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} className={`px-3 py-2 rounded-full ${filter === f ? "bg-blue-600" : "bg-white border"}`}>
            <Text className={`text-xs ${filter === f ? "text-white" : "text-gray-600"}`}>{f || "All"}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={visits} keyExtractor={v => v.visit_id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/visits/${item.visit_id}` as any)} className="bg-white p-4 mb-3 rounded-xl shadow">
            <View className="flex-row justify-between items-center">
              <Text className="font-mono font-bold">{item.visit_id}</Text>
              <Text className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[item.status] || "bg-gray-100"}`}>{item.status}</Text>
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-500 text-sm">Inspector: {item.inspector_name || "—"}</Text>
              <Text className="text-gray-400 text-xs">{item.planned_date ? new Date(item.planned_date).toLocaleDateString() : "—"}</Text>
            </View>
            {item.inspection_report_no && <Text className="text-gray-400 text-xs mt-1">Report: {item.inspection_report_no}</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
