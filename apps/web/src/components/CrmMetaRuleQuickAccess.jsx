import React, { useState } from "react";
import { CrmObjectClassifier } from "./CrmMetaRuleHelper.jsx";

/**
 * Quick Help Icon - Shows the object classifier when clicked
 * 
 * Usage:
 * <CrmMetaRuleHelpIcon onNavigate={(path) => navigate(path)} />
 */
export function CrmMetaRuleHelpIcon({ onNavigate }) {
  const [showClassifier, setShowClassifier] = useState(false);

  const handleSelect = (type) => {
    const routes = {
      person: "/admin/contacts?create=1",
      company: "/admin/brands?create=1",
      moment: "/admin/campaigns?create=1",
      thing: "/admin/deals?create=1",
    };
    
    if (onNavigate && routes[type]) {
      onNavigate(routes[type]);
    }
    
    setShowClassifier(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowClassifier(true)}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-black/20 text-xs text-brand-black/50 hover:bg-brand-linen/40 hover:text-brand-black/70"
        title="What should I create?"
        aria-label="CRM object help"
      >
        ?
      </button>

      {showClassifier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowClassifier(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-[0_35px_120px_rgba(0,0,0,0.25)]">
            <CrmObjectClassifier
              onSelect={handleSelect}
              onCancel={() => setShowClassifier(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Inline Link to CRM Settings
 * 
 * Usage:
 * <CrmMetaRuleLearnMore />
 */
export function CrmMetaRuleLearnMore() {
  return (
    <a
      href="/admin/crm-settings"
      className="inline-flex items-center gap-1 text-xs text-brand-black/50 hover:text-brand-black/70"
    >
      <span>Learn about CRM modeling</span>
      <span>→</span>
    </a>
  );
}

/**
 * Quick Reference Card (Collapsible)
 * 
 * Usage:
 * <CrmMetaRuleQuickRef />
 */
export function CrmMetaRuleQuickRef() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">💡</span>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60">
            CRM Meta-Rule
          </span>
        </div>
        <span className="text-brand-black/40">{expanded ? "−" : "+"}</span>
      </button>

      {expanded && (
        <div className="border-t border-brand-black/10 p-4">
          <p className="mb-3 text-xs text-brand-black/70">
            "Is this a person, a company, a moment, or a thing?"
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 rounded-lg bg-brand-white p-2">
              <span>👤</span>
              <span className="text-brand-black/60">Person → Contact</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-brand-white p-2">
              <span>🏢</span>
              <span className="text-brand-black/60">Company → Brand</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-brand-white p-2">
              <span>📅</span>
              <span className="text-brand-black/60">Moment → Event/Campaign</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-brand-white p-2">
              <span>💼</span>
              <span className="text-brand-black/60">Thing → Deal/Contract</span>
            </div>
          </div>
          <div className="mt-3 border-t border-brand-black/10 pt-3">
            <CrmMetaRuleLearnMore />
          </div>
        </div>
      )}
    </div>
  );
}
