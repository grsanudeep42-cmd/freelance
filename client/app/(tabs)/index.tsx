import React, { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { api } from "../../lib/api";

type Job = {
  id: string;
  title: string;
  type: string;
  budget: number | null;
};

export default function JobsFeedScreen(): JSX.Element {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadJobs(): Promise<void> {
    setError(null);
    try {
      const res = await api.get("/jobs");
      const nextJobs = (res.data?.data ?? []) as Job[];
      setJobs(nextJobs);
    } catch {
      setError("Failed to load jobs. Try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  const content = useMemo(() => {
    if (loading) return <Text className="text-textMuted mt-2">Loading jobs...</Text>;
    if (error) return <Text className="text-red-400 mt-2">{error}</Text>;
    if (!jobs.length) return <Text className="text-textMuted mt-2">No open jobs right now.</Text>;
    return null;
  }, [jobs.length, loading, error]);

  return (
    <View className="flex-1 bg-appBg px-4 py-4">
      <View className="mb-3">
        <Text className="text-white text-2xl font-bold">Jobs</Text>
        <Text className="text-textMuted mt-1">Browse open opportunities.</Text>
      </View>

      {content}

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-6"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadJobs} tintColor="#ffffff" />
        }
        renderItem={({ item }) => (
          <View className="bg-card rounded-2xl p-4 mb-3 border border-slate-700/50">
            <Text className="text-white text-base font-semibold">{item.title}</Text>
            <View className="flex-row items-center mt-2 gap-2">
              <View className="px-2 py-1 rounded-full bg-appBg border border-slate-700/50">
                <Text className="text-textMuted text-xs">{item.type}</Text>
              </View>
              {item.budget !== null && item.budget !== undefined ? (
                <View className="px-2 py-1 rounded-full bg-appBg border border-slate-700/50">
                  <Text className="text-textMuted text-xs">Budget: {item.budget}</Text>
                </View>
              ) : (
                <View className="px-2 py-1 rounded-full bg-appBg border border-slate-700/50">
                  <Text className="text-textMuted text-xs">Budget: Not set</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => {}}
              className="mt-4 bg-slate-700 rounded-xl px-4 py-3"
            >
              <Text className="text-white text-center font-semibold">View details</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

