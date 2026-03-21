import React from "react";

export function ProfileStrength({ score, showLabel = true }: { score: number; showLabel?: boolean }): JSX.Element {
  // Ensure score is clamped between 0 and 100
  const validScore = Math.max(0, Math.min(100, score || 0));

  let colorClass = "";
  let label = "";

  if (validScore <= 30) {
    colorClass = "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
    label = "Just getting started";
  } else if (validScore <= 60) {
    colorClass = "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
    label = "Getting there";
  } else if (validScore <= 80) {
    colorClass = "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]";
    label = "Looking good";
  } else {
    colorClass = "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
    label = "Profile complete ✓";
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold">
        {showLabel && <span className="text-slate-300">{label}</span>}
        <span className="text-white ml-auto">{validScore}%</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
        <div 
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`} 
          style={{ width: `${validScore}%` }} 
        />
      </div>
    </div>
  );
}
