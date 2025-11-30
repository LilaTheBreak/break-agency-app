import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";

const Composer = forwardRef(function Composer({ onSend }, ref) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    insertDraft(text) {
      setValue((prev) => {
        const next = prev ? `${prev}\n\n${text}` : text;
        return next;
      });
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }));

  const handleSend = () => {
    onSend?.(value);
    setValue("");
  };

  return (
    <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-white p-4 shadow-sm">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-xl border border-brand-black/10 bg-brand-linen/50 p-3 text-sm text-brand-black outline-none focus:border-brand-red"
        rows={6}
        placeholder="Compose a reply..."
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSend}
          className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white transition hover:bg-brand-red"
        >
          Send
        </button>
      </div>
    </div>
  );
});

export default Composer;
