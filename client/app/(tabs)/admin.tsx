import React, { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminJobsScreen(): JSX.Element {
  const { token, loading } = useAuth();

  const [jobId, setJobId] = useState("");
  const [submission, setSubmission] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const canClaim = useMemo(() => jobId.trim().length > 0 && !loading, [jobId, loading]);
  const canSubmit = useMemo(
    () => jobId.trim().length > 0 && submission.trim().length >= 5 && !loading,
    [jobId, submission, loading]
  );

  async function claim(): Promise<void> {
    setMessage(null);
    try {
      const res = await api.post("/admin-jobs/claim", { jobId: jobId.trim() });
      setMessage(res.data?.message ?? "Claim submitted.");
    } catch {
      setMessage("Failed to claim admin job.");
    }
  }

  async function submitWork(): Promise<void> {
    setMessage(null);
    try {
      const res = await api.post("/admin-jobs/submit", { jobId: jobId.trim(), submission });
      setMessage(res.data?.message ?? "Submission submitted.");
    } catch {
      setMessage("Failed to submit admin work.");
    }
  }

  if (!token) {
    return (
      <View className="flex-1 bg-appBg px-4 py-8">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="bg-card rounded-2xl p-4 border border-slate-700/50">
            <Text className="text-white text-xl font-bold">Admin jobs</Text>
            <Text className="text-textMuted mt-2">
              Please log in to claim or submit admin jobs.
            </Text>
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
            <Text className="text-white text-xl font-bold">Admin jobs</Text>
            <Text className="text-textMuted mt-1">Claim and submit admin work.</Text>
          </View>

          <View className="bg-card rounded-2xl p-4 border border-slate-700/50 gap-3">
            <Text className="text-textMuted text-sm">Job ID</Text>
            <TextInput
              className="bg-appBg text-white rounded-xl px-3 py-2"
              placeholder="UUID job id"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              value={jobId}
              onChangeText={setJobId}
            />

            <Text className="text-textMuted text-sm">Submission</Text>
            <TextInput
              className="bg-appBg text-white rounded-xl px-3 py-2"
              placeholder="Short summary or link (min 5)"
              placeholderTextColor="#64748b"
              value={submission}
              onChangeText={setSubmission}
            />

            {message ? <Text className="text-textMuted mt-2">{message}</Text> : null}

            <TouchableOpacity
              disabled={!canClaim}
              onPress={claim}
              className={canClaim ? "bg-blue-500 rounded-xl px-4 py-3" : "bg-slate-700 rounded-xl px-4 py-3"}
            >
              <Text className="text-white text-center font-semibold">
                {loading ? "Working..." : "Claim"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!canSubmit}
              onPress={submitWork}
              className={canSubmit ? "bg-green-500 rounded-xl px-4 py-3" : "bg-slate-700 rounded-xl px-4 py-3"}
            >
              <Text className="text-white text-center font-semibold">Submit work</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

