import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * CollapsibleDetailSection Component
 * 
 * Reusable collapsible container for form sections.
 * Hides detail form fields by default to reduce form fatigue.
 * Used for: Representation Type, Status, Legal Name, etc.
 */
export function CollapsibleDetailSection({
  title,
  children,
  badge,
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-brand-black/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.3em] text-brand-black/60">
            {title}
          </span>
          {badge && (
            <span className="inline-block px-2 py-1 rounded-full bg-brand-red/10 text-xs text-brand-red font-semibold">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-brand-black/40 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="border-t border-brand-black/10 px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
}
