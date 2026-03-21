import { Redirect, Stack, usePathname } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function AuthGate(): JSX.Element {
  const pathname = usePathname();
  const { token } = useAuth();

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isTabsRoute = pathname === "/" || pathname === "/admin" || pathname === "/profile";

  if (!token && isTabsRoute) {
    return <Redirect href="/(auth)/login" />;
  }

  if (token && isAuthRoute) {
    return <Redirect href="/(tabs)/index" />;
  }

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-appBg">
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false
          }}
        />
        <View className="px-4 py-2">
          <Text className="text-textMuted text-xs">SkillBridge</Text>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

export default function RootLayout(): JSX.Element {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

