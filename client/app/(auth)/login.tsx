import React, { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginScreen(): JSX.Element {
  const router = useRouter();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0 && !loading;
  }, [email, password, loading]);

  async function onSubmit(): Promise<void> {
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (err) {
      setError("Login failed. Check your email/password and try again.");
    }
  }

  return (
    <View className="flex-1 bg-appBg px-4 py-8">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          <View className="bg-card rounded-2xl p-4 border border-slate-700/50">
            <Text className="text-white text-2xl font-bold">Welcome back</Text>
            <Text className="text-textMuted mt-1">Log in to continue to SkillBridge.</Text>
          </View>

          <View className="bg-card rounded-2xl p-4 border border-slate-700/50 gap-3">
            <Text className="text-textMuted text-sm">Email</Text>
            <TextInput
              className="bg-appBg text-white rounded-xl px-3 py-2"
              placeholder="you@example.com"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text className="text-textMuted text-sm">Password</Text>
            <TextInput
              className="bg-appBg text-white rounded-xl px-3 py-2"
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error ? <Text className="text-red-400">{error}</Text> : null}

            <TouchableOpacity
              disabled={!canSubmit}
              onPress={onSubmit}
              className={
                canSubmit ? "bg-blue-500 rounded-xl px-4 py-3" : "bg-slate-700 rounded-xl px-4 py-3"
              }
            >
              <Text className="text-white text-center font-semibold">
                {loading ? "Logging in..." : "Login"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/register")} className="mt-2">
              <Text className="text-center text-textMuted">
                Don&apos;t have an account? Register
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

