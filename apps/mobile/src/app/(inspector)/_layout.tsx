import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function InspectorLayout() {
  return (
    <Tabs screenOptions={{ tabBarStyle: { paddingBottom: 8, paddingTop: 4 } }}>
      <Tabs.Screen name="index" options={{ title: "My Jobs", tabBarIcon: () => <Text>📋</Text> }} />
      <Tabs.Screen name="visits" options={{ title: "Visits", tabBarIcon: () => <Text>✅</Text> }} />
    </Tabs>
  );
}
