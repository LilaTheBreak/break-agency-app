import React from "react";

export function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="h-3 w-full rounded-full bg-brand-black/10">
      <div
        className="h-full rounded-full bg-brand-red transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
