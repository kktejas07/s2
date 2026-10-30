import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { startBackgroundSync } from "../offline/sync";

export default function RootLayout() {
  // Started once for the life of the app rather than per screen: an inspector
  // walking back into signal is usually not on the capture screen, and the
  // queue should drain anyway.
  useEffect(() => startBackgroundSync(), []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#000",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Login" }} />
        <Stack.Screen name="(inspector)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
