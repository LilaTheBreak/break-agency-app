import { useState } from "react";

export function DealNoteComposer({ onSubmit }) {
  const [value, setValue] = useState("");

  return (
    <div className="mt-4 flex gap-3">
      <input
        className="flex-1 rounded-lg border border-brand-black/20 p-2 text-sm"
        placeholder="Write a note…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        className="rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
        onClick={() => {
          if (value.trim()) {
            onSubmit?.(value);
            setValue("");
          }
        }}
      >
        Add
      </button>
    </div>
  );
}

export default DealNoteComposer;
