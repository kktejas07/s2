import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import api from "../../api/client";

export default function InspectorJobs() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const r = await api.listJobs({ status: "open,assigned,in_progress", per_page: 50 });
    setJobs(r.data || []);
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, []);

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold mb-4">My Jobs</Text>
      <FlatList
        data={jobs} keyExtractor={j => j.job_id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/visits?job_id=${item.job_id}` as any)} className="bg-white p-4 mb-3 rounded-xl shadow">
            <View className="flex-row justify-between items-center">
              <Text className="font-bold text-base">{item.job_id}</Text>
              <Text className={`text-xs px-2 py-1 rounded ${item.status === "open" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{item.status}</Text>
            </View>
            <Text className="text-gray-600 mt-1">{item.title}</Text>
            {item.client_name && <Text className="text-gray-400 text-sm mt-1">{item.client_name}</Text>}
            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-400 text-xs">Budget: ₹{item.budget?.toLocaleString() || "0"}</Text>
              <Text className="text-blue-600 text-xs">View Visits →</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
