import React, { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

export default function RegisterScreen(): JSX.Element {
  const router = useRouter();
  const { register, loading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return fullName.trim().length > 0 && email.trim().length > 0 && password.trim().length >= 8 && !loading;
  }, [fullName, email, password, loading]);

  async function onSubmit(): Promise<void> {
    setError(null);
    try {
      await register(fullName.trim(), email.trim(), password);
      router.replace("/");
    } catch {
      setError("Registration failed. Please check your details and try again.");
    }
  }

  return (
    <View className="flex-1 bg-appBg px-4 py-8">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          <View className="bg-card rounded-2xl p-4 border border-slate-700/50">
            <Text className="text-white text-2xl font-bold">Create account</Text>
            <Text className="text-textMuted mt-1">Get started with SkillBridge.</Text>
          </View>

          <View className="bg-card rounded-2xl p-4 border border-slate-700/50 gap-3">
            <Text className="text-textMuted text-sm">Full name</Text>
            <TextInput
              className="bg-appBg text-white rounded-xl px-3 py-2"
              placeholder="Your name"
              placeholderTextColor="#64748b"
              autoCapitalize="words"
              value={fullName}
              onChangeText={setFullName}
            />

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
              placeholder="Minimum 8 characters"
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
                canSubmit
                  ? "bg-blue-500 rounded-xl px-4 py-3"
                  : "bg-slate-700 rounded-xl px-4 py-3"
              }
            >
              <Text className="text-white text-center font-semibold">
                {loading ? "Creating..." : "Register"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/login")} className="mt-2">
              <Text className="text-center text-textMuted">Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

