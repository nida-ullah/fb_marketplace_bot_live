"use client";

import React from "react";

interface StatusBadgeProps {
  posted: boolean;
}

export default function StatusBadge({ posted }: StatusBadgeProps) {
  const bg = posted ? "bg-green-100" : "bg-yellow-100";
  const text = posted ? "text-green-800" : "text-yellow-800";
  const icon = posted ? "✅" : "⏳";
  const label = posted ? "Posted" : "Pending";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
