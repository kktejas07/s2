import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    setTimeout(() => router.replace("/login" as any), 100);
  }, []);
  return <View className="flex-1 justify-center items-center"><ActivityIndicator /><Text className="mt-2">Loading...</Text></View>;
}
