import { useQuery } from "@tanstack/react-query";
import { fetchSkills } from "../api";
import { SkillCard } from "../components/SkillCard";

export function SkillsPage(): JSX.Element {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const res = await fetchSkills();
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    }
  });

  return (
    <main style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ margin: 0 }}>Verified skills</h1>
      <p style={{ marginTop: 12, color: "rgba(0,0,0,0.7)" }}>
        Sample data loaded from the server. Add real endpoints to back this UI.
      </p>

      {isLoading ? <div style={{ marginTop: 18 }}>Loading...</div> : null}
      {isError ? (
        <div style={{ marginTop: 18, color: "#b91c1c" }}>
          {error instanceof Error ? error.message : "Failed to load skills"}
        </div>
      ) : null}

      {data ? (
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14
          }}
        >
          {data.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      ) : null}
    </main>
  );
}

