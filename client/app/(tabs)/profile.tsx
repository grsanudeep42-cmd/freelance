import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

type MeUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  creditBalance: number;
};

export default function ProfileScreen(): JSX.Element {
  const { token, logout, loading: authLoading } = useAuth();

  const [user, setUser] = useState<MeUser | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMe(): Promise<void> {
      if (!token) return;
      setLoading(true);
      setMessage(null);
      try {
        const res = await api.get("/auth/me");
        setUser((res.data?.data?.user ?? null) as MeUser | null);
      } catch {
        setMessage("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadMe();
  }, [token]);

  const canLogout = useMemo(() => !authLoading, [authLoading]);

  if (!token) {
    return (
      <View className="flex-1 bg-appBg px-4 py-8">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="bg-card rounded-2xl p-4 border border-slate-700/50">
            <Text className="text-white text-xl font-bold">Profile</Text>
            <Text className="text-textMuted mt-2">Log in to view your account details.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-appBg px-4 py-8">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          <View className="bg-card rounded-2xl p-4 border border-slate-700/50">
            <Text className="text-white text-xl font-bold">Profile</Text>
            <Text className="text-textMuted mt-1">
              {loading ? "Loading..." : user ? "Account details" : "No data"}
            </Text>
          </View>

          {message ? <Text className="text-red-400">{message}</Text> : null}

          {user ? (
            <View className="bg-card rounded-2xl p-4 border border-slate-700/50 gap-2">
              <Text className="text-white text-base font-semibold">{user.fullName}</Text>
              <Text className="text-textMuted text-sm">{user.email}</Text>
              <Text className="text-textMuted text-sm">Role: {user.role}</Text>
              <Text className="text-textMuted text-sm">Credits: {user.creditBalance}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            disabled={!canLogout}
            onPress={logout}
            className={
              canLogout
                ? "bg-slate-700 rounded-xl px-4 py-3"
                : "bg-slate-700 rounded-xl px-4 py-3 opacity-50"
            }
          >
            <Text className="text-white text-center font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

