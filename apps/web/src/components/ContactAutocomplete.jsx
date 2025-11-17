import React, { useMemo, useState } from "react";

export function ContactAutocomplete({ options = [], value, onSelect }) {
  const [query, setQuery] = useState(value || "");
  const normalizedOptions = useMemo(
    () =>
      options.filter((item) => {
        if (!query) return true;
        return item.toLowerCase().includes(query.toLowerCase());
      }),
    [options, query]
  );

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setQuery(nextValue);
    onSelect?.(nextValue);
  };

  return (
    <div className="space-y-1">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search contacts or add an email"
        className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
      />
      {normalizedOptions.length > 0 ? (
        <div className="max-h-40 overflow-y-auto rounded-2xl border border-brand-black/10 bg-brand-white text-sm shadow-brand">
          {normalizedOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setQuery(option);
                onSelect?.(option);
              }}
              className="block w-full px-4 py-2 text-left text-brand-black/80 hover:bg-brand-linen/60"
            >
              {option}
            </button>
          ))}
          <p className="border-t border-brand-black/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/50">
            {options.length === normalizedOptions.length ? "All contacts" : "Filtered"}
          </p>
        </div>
      ) : (
        <p className="text-xs text-brand-black/50">
          Start typing an email or contact from the roster.
        </p>
      )}
    </div>
  );
}
