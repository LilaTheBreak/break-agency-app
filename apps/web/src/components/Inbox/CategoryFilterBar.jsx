import React from "react";

const FILTERS = ["All", "Deals", "Events", "Gifting", "PR", "Scam", "Spam", "Other"];

export default function CategoryFilterBar({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((label) => {
        const id = label.toLowerCase();
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange?.(id)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition ${
              selected
                ? "bg-brand-red text-white border-brand-red"
                : "bg-white text-brand-black border-brand-black/20"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
