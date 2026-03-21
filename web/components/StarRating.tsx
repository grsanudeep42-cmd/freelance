"use client";

import React, { useState } from "react";

interface StarRatingProps {
  value: number;
  max?: number;
  readonly?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({ value, max = 5, readonly = false, onChange }: StarRatingProps): JSX.Element {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null && !readonly ? hoverValue : value;

  return (
    <div className={`flex items-center gap-1 ${readonly ? "cursor-default" : "cursor-pointer"}`}>
      {Array.from({ length: max }).map((_, i) => {
        const starNum = i + 1;
        const fillPercent = Math.max(0, Math.min(100, (displayValue - i) * 100));

        return (
          <div
            key={starNum}
            className="relative w-6 h-6 text-2xl text-slate-700/50"
            onMouseEnter={() => !readonly && setHoverValue(starNum)}
            onMouseLeave={() => !readonly && setHoverValue(null)}
            onClick={() => !readonly && onChange?.(starNum)}
          >
            ★
            <div
              className="absolute top-0 left-0 overflow-hidden text-amber-400 transition-all duration-150"
              style={{ width: `${fillPercent}%` }}
            >
              ★
            </div>
          </div>
        );
      })}
    </div>
  );
}
