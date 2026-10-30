import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import api from "../api/client";

export default function LoginScreen() {
  const router = useRouter();
  const [loginName, setLoginName] = useState("admin");
  const [password, setPassword] = useState("admin123");

  async function handleLogin() {
    try {
      const res = await api.login(loginName, password);
      router.replace("/(inspector)" as any);
    } catch { Alert.alert("Login Failed", "Invalid credentials"); }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-center bg-white p-6">
      <Text className="text-3xl font-bold text-center mb-2">IQEApp</Text>
      <Text className="text-gray-500 text-center mb-8">Inspector App</Text>
      <TextInput value={loginName} onChangeText={setLoginName} placeholder="Login Name" className="border border-gray-300 p-4 rounded-xl mb-3 text-base" autoCapitalize="none" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry className="border border-gray-300 p-4 rounded-xl mb-4 text-base" />
      <TouchableOpacity onPress={handleLogin} className="bg-blue-600 p-4 rounded-xl"><Text className="text-white text-center font-bold text-base">Sign In</Text></TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
