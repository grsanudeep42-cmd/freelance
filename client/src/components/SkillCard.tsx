import type { Skill } from "../types";
import { formatMoney } from "../utils/formatMoney";

export function SkillCard({ skill }: { skill: Skill }): JSX.Element {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(skill.rating));

  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.1)",
        borderRadius: 12,
        padding: 16,
        background: "white"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{skill.title}</div>
          <div style={{ color: "rgba(0,0,0,0.6)", marginTop: 4 }}>{skill.category}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700 }}>{formatMoney(skill.hourlyRate)}</div>
          <div style={{ fontSize: 12, color: "rgba(0,0,0,0.6)" }}>/ hour</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
        {stars.map((on, idx) => (
          <span key={idx} aria-hidden="true" style={{ color: on ? "#f59e0b" : "rgba(0,0,0,0.2)" }}>
            ★
          </span>
        ))}
        <span style={{ color: "rgba(0,0,0,0.6)", fontSize: 12 }}>{skill.rating.toFixed(1)}</span>
        {skill.verified ? <span style={{ marginLeft: 8, fontSize: 12 }}>Verified</span> : null}
      </div>
    </div>
  );
}

