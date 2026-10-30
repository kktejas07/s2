import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import api from "../../api/client";

export default function CoordinatorDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    api.listJobs({ per_page: 20 }).then((res: any) => setJobs(res.data || []));
  }, []);

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-xl font-bold mb-4">Jobs</Text>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.job_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(coordinator)/job/${item.job_id}` as any)}
            className="bg-white p-4 mb-2 rounded shadow"
          >
            <Text className="font-bold">{item.job_id}</Text>
            <Text className="text-gray-600">{item.title}</Text>
            <Text className="text-sm text-gray-400">Status: {item.status}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
