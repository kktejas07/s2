import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function JobDetail() {
  const { job_id } = useLocalSearchParams<{ job_id: string }>();

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-4">{job_id}</Text>
      <Text className="text-gray-600">Job detail view - coming soon</Text>
    </View>
  );
}
