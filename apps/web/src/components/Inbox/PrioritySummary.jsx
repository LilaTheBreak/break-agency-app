import React, { useMemo } from "react";

export default function PrioritySummary({ totals }) {
  const { high = 0, medium = 0, low = 0 } = totals || {};
  const total = high + medium + low || 1;
  const pct = (value) => `${Math.round((value / total) * 100)}%`;

  const items = useMemo(
    () => [
      { label: "High Priority", value: high, color: "bg-brand-red/10 text-brand-red" },
      { label: "Medium Priority", value: medium, color: "bg-orange-100 text-orange-700" },
      { label: "Low Priority", value: low, color: "bg-brand-black/10 text-brand-black/70" }
    ],
    [high, medium, low]
  );

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-2xl border border-brand-black/10 p-4 ${item.color} shadow-sm`}
        >
          <p className="text-xs uppercase tracking-[0.35em]">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold">{item.value}</p>
          <p className="text-sm text-brand-black/70">{pct(item.value)} of inbox</p>
        </div>
      ))}
    </div>
  );
}
