import React, { useState } from "react";

/**
 * CRM Object Meta-Rule Helper Component
 * 
 * Provides gentle guidance on object classification:
 * "Is this a person, a company, a moment, or a thing?"
 * 
 * This is design-only guidance, not enforcement.
 */

export function CrmMetaRuleTooltip({ context = "generic", onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  if (dismissed) return null;

  const hints = {
    task: "If this is a person, company, moment, or commercial item, consider creating it as its own record.",
    note: "If this describes a person, company, moment, or deal, it might work better as a dedicated record.",
    outreach: "If you're reaching out about something specific, consider linking to an existing Deal or Campaign.",
    generic: "Person → Contact | Company → Brand | Moment → Event/Campaign | Thing → Deal/Contract",
  };

  return (
    <div className="mt-2 flex items-start gap-2 rounded-xl border border-brand-black/10 bg-brand-linen/40 p-3 text-xs">
      <span className="text-brand-black/50">💡</span>
      <p className="flex-1 text-brand-black/70">{hints[context]}</p>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-brand-black/40 hover:text-brand-black/70"
        aria-label="Dismiss hint"
      >
        ×
      </button>
    </div>
  );
}

export function CrmObjectClassifier({ onSelect, onCancel }) {
  const classifications = [
    {
      type: "person",
      label: "A person",
      description: "Someone you work with",
      action: "Create Contact",
      icon: "👤",
    },
    {
      type: "company",
      label: "A company",
      description: "A brand or organization",
      action: "Create Brand",
      icon: "🏢",
    },
    {
      type: "moment",
      label: "A moment",
      description: "An event or campaign",
      action: "Create Event/Campaign",
      icon: "📅",
    },
    {
      type: "thing",
      label: "A commercial item",
      description: "A deal, contract, or invoice",
      action: "Create Deal/Contract",
      icon: "💼",
    },
  ];

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60">
            What is this?
          </p>
          <p className="mt-1 text-sm text-brand-black/70">
            Choose the best fit to keep your CRM organized
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-brand-black/40 hover:text-brand-black/70"
        >
          Skip
        </button>
      </div>

      <div className="grid gap-2">
        {classifications.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => onSelect(item.type)}
            className="flex items-center gap-3 rounded-xl border border-brand-black/10 bg-brand-linen/30 p-3 text-left transition-all hover:bg-brand-linen/60"
          >
            <span className="text-2xl">{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-black">{item.label}</p>
              <p className="text-xs text-brand-black/60">{item.description}</p>
            </div>
            <span className="text-xs text-brand-black/40">{item.action} →</span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-[0.65rem] text-brand-black/40">
        This helps keep things trackable. You can always proceed without choosing.
      </p>
    </div>
  );
}

export function CrmMetaRulePanel() {
  return (
    <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-red">CRM Modelling</p>
        <h3 className="font-display text-2xl uppercase text-brand-black">The Meta-Rule</h3>
      </div>

      <div className="mb-5 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
        <p className="mb-3 text-sm font-semibold text-brand-black">
          For every new thing added to the CRM, ask:
        </p>
        <p className="text-lg font-display text-brand-black">
          "Is this a person, a company, a moment, or a thing?"
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-brand-black/10 bg-brand-white p-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-black">Person</p>
              <p className="text-xs text-brand-black/60">→ User or Contact</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-brand-black/10 bg-brand-white p-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏢</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-black">Company</p>
              <p className="text-xs text-brand-black/60">→ Brand</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-brand-black/10 bg-brand-white p-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-black">Moment</p>
              <p className="text-xs text-brand-black/60">→ Event or Campaign</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-brand-black/10 bg-brand-white p-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">💼</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-black">Thing</p>
              <p className="text-xs text-brand-black/60">→ Deal, Contract, Invoice</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-brand-black/10 bg-brand-linen/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60">
          Why this matters
        </p>
        <p className="mt-2 text-sm text-brand-black/70">
          This rule prevents overloading entities, keeps Tasks and Notes focused, and ensures
          important information gets its own trackable record. It's guidance, not enforcement.
        </p>
      </div>

      <div className="mt-5 border-t border-brand-black/10 pt-4">
        <p className="text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/40">
          Examples
        </p>
        <div className="mt-3 space-y-2">
          <div className="rounded-lg bg-brand-linen/30 p-3">
            <p className="text-xs text-brand-black/60">
              <span className="font-semibold text-brand-black">"Follow up with Sarah"</span> → Task
            </p>
          </div>
          <div className="rounded-lg bg-brand-linen/30 p-3">
            <p className="text-xs text-brand-black/60">
              <span className="font-semibold text-brand-black">"Sarah prefers WhatsApp"</span> → Note on Contact
            </p>
          </div>
          <div className="rounded-lg bg-brand-linen/30 p-3">
            <p className="text-xs text-brand-black/60">
              <span className="font-semibold text-brand-black">"Nike Summer Launch"</span> → Campaign
            </p>
          </div>
          <div className="rounded-lg bg-brand-linen/30 p-3">
            <p className="text-xs text-brand-black/60">
              <span className="font-semibold text-brand-black">"£25k creator partnership"</span> → Deal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LongContentWarning({ type, count, threshold, onConvert }) {
  if (count < threshold) return null;

  const suggestions = {
    note: {
      message: "This note is getting detailed. Consider if it describes a Deal, Event, or Brand worth tracking separately.",
      actions: [
        { label: "Create Deal", value: "deal" },
        { label: "Create Event", value: "event" },
        { label: "Keep as note", value: "dismiss" },
      ],
    },
    task: {
      message: "This task is complex. If it involves a specific deal or event, linking it might keep things clearer.",
      actions: [
        { label: "Link to Deal", value: "deal" },
        { label: "Link to Campaign", value: "campaign" },
        { label: "Keep as is", value: "dismiss" },
      ],
    },
  };

  const config = suggestions[type];
  if (!config) return null;

  return (
    <div className="mt-2 rounded-xl border border-brand-red/20 bg-brand-red/5 p-3">
      <div className="flex items-start gap-2">
        <span className="text-sm">💡</span>
        <div className="flex-1">
          <p className="text-xs text-brand-black/70">{config.message}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {config.actions.map((action) => (
              <button
                key={action.value}
                type="button"
                onClick={() => onConvert(action.value)}
                className="rounded-lg border border-brand-black/10 bg-brand-white px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/70 hover:bg-brand-black/5"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state with meta-rule guidance
 */
export function EmptyStateWithHint({ entity, onCreate, onLearnMore }) {
  const entityGuides = {
    tasks: {
      title: "No tasks yet",
      description: "Tasks track actions. If you're planning something bigger, consider creating a Campaign or Deal first.",
      icon: "✓",
    },
    notes: {
      title: "No notes yet",
      description: "Notes capture context. If this is about a specific person or company, create a Contact or Brand.",
      icon: "📝",
    },
    outreach: {
      title: "No outreach yet",
      description: "Outreach tracks communication. Link it to Contacts and Deals to see the full story.",
      icon: "📧",
    },
  };

  const guide = entityGuides[entity] || entityGuides.tasks;

  return (
    <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-10 text-center">
      <span className="text-4xl">{guide.icon}</span>
      <p className="mt-3 font-display text-2xl uppercase text-brand-black">{guide.title}</p>
      <p className="mt-2 text-sm text-brand-black/60">{guide.description}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={onCreate}
          className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
        >
          Create {entity.slice(0, -1)}
        </button>
        {onLearnMore && (
          <button
            type="button"
            onClick={onLearnMore}
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
          >
            Learn more
          </button>
        )}
      </div>
    </div>
  );
}
