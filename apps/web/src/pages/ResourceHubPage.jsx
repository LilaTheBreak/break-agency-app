import React from "react";
import { Link } from "react-router-dom";

const PUBLIC_RESOURCES = [
  {
    type: "Template",
    audience: "Everyone",
    title: "AI-Native Brief Builder",
    description: "Framings to scope influencer or UGC campaigns in minutes.",
    cta: "Download"
  },
  {
    type: "Guide",
    audience: "Brands",
    title: "Dubai & London Launch Playbook",
    description: "Regional talent fees, shoot logistics, and compliance guardrails.",
    cta: "Read guide"
  },
  {
    type: "Digital Product",
    audience: "Creators",
    title: "Creator CFO Toolkit",
    description: "Notion finance HQ + rate calculator used by Break Agency talent.",
    cta: "Download toolkit"
  },
  {
    type: "Checklist",
    audience: "Managers",
    title: "Inbox Zero for Talent Managers",
    description: "Weekly operating rhythm for campaigns, comms, invoices.",
    cta: "Copy checklist"
  }
];

const PRIVATE_RESOURCES = [
  {
    type: "Playbook",
    audience: "Admins",
    title: "Premium Launch Lab Notes",
    description: "Internal model for pacing feedback, briefs, and AI copilot prompts.",
    cta: "Reserved for logged-in admins"
  },
  {
    type: "Case study",
    audience: "Admins",
    title: "Creator Residency · Q2 Retros",
    description: "Full mix sheets + payout logs for strategy refinement.",
    cta: "Reserved for logged-in admins"
  },
  {
    type: "Toolkit",
    audience: "Admins",
    title: "Brand Upload Protocol",
    description: "Standard naming, compliance steps, and approval docs before publishing.",
    cta: "Reserved for logged-in admins"
  }
];

export function ResourceHubPage() {
  return (
    <div className="bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-6 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Resource hub</p>
          <h1 className="text-4xl font-semibold">Public intel, no login required.</h1>
          <p className="mx-auto max-w-3xl text-white/70">
            Our public library houses articles, templates, digital products, and webinars curated for both sides of the marketplace.
            Spellcheck + QA are baked into every onboarding doc — the Resource Hub grows with every launch.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs uppercase tracking-[0.35em] text-white/70">
            <span>Articles</span>
            <span>Templates</span>
            <span>Webinars</span>
            <span>Guides</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-10 px-6 py-12">
        <ResourceSection title="Templates & Kits" label="Public" resources={PUBLIC_RESOURCES} />
        <ResourceSection title="Mindshare Articles" label="Public" resources={PUBLIC_RESOURCES.slice(0, 2)} />
        <ResourceSection
          title="Admin Vault"
          label="Protected"
          resources={PRIVATE_RESOURCES}
          protected
        />
      </section>

      <section className="border-t border-white/10 bg-black/60">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-6">
          <h2 className="text-3xl font-semibold">Admin resource uploads</h2>
          <p className="text-white/70">
            Admins can upload templates, legal docs, and brand-facing briefs straight into the Resource Hub. Public resources stay accessible to anyone,
            while private folders remain blurred and protected until a console login occurs.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/dashboard"
              className="rounded-full border border-white/70 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/10"
            >
              Admin console
            </Link>
            <button
              type="button"
              className="rounded-full bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-black"
              onClick={() => window.alert("Upload flow coming soon")}
            >
              Upload resource
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}


function ResourceSection({ title, label, resources, protected: isProtected = false }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <span className="text-xs uppercase tracking-[0.35em] text-white/60">{label}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((item) => (
          <article
            key={item.title}
            className={`relative rounded-3xl border border-white/10 bg-white/5 p-6 transition ${
              isProtected ? "backdrop-blur-sm" : ""
            }`}
          >
            {isProtected && (
              <div className="absolute inset-0 rounded-3xl bg-black/60" aria-hidden="true" />
            )}
            <div className="relative flex items-center justify-between text-xs text-white/60">
              <span>{item.type}</span>
              <span>{item.audience}</span>
            </div>
              <h3 className="relative mt-3 text-4xl font-semibold uppercase tracking-[0.35em]">
                {item.title}
              </h3>
            <p className="relative mt-2 text-sm text-white/70">{item.description}</p>
            <div className="relative mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] text-brand-red">
              <button type="button" disabled={isProtected}>
                {item.cta} →
              </button>
              {isProtected && <span className="text-[0.6rem] uppercase text-white/60">Login required</span>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
