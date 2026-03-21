import React from "react";
import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  className?: string;
}>;

// Placeholder component for web UI. In Next.js, use <div> instead of <View>.
export function Card({ children, className }: Props): JSX.Element {
  return <div className={`rounded-xl bg-card p-4 ${className ?? ""}`.trim()}>{children}</div>;
}

