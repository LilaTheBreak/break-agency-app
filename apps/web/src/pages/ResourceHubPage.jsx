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

const WEBINARS = [
  {
    type: "Webinar",
    audience: "Brands",
    title: "How to brief creators without chaos",
    description: "Live walkthrough on briefs, approvals, and clear deliverables.",
    cta: "Register"
  },
  {
    type: "Webinar",
    audience: "Creators",
    title: "Rate setting for UK/US campaigns",
    description: "Benchmarks and negotiation guardrails for common deliverables.",
    cta: "Register"
  }
];

const GUIDES = [
  {
    type: "Guide",
    audience: "Brands",
    title: "Creator legal basics",
    description: "Usage, approvals, and payment checkpoints to avoid disputes.",
    cta: "Read guide"
  },
  {
    type: "Guide",
    audience: "Creators",
    title: "Working with regulated categories",
    description: "What to know before posting for finance, health, or pharma brands.",
    cta: "Read guide"
  }
];

const EVENTS = [
  {
    type: "Event",
    audience: "Brands",
    title: "London creator meetup",
    description: "In-person session on 2026 creator strategy and partnerships.",
    cta: "RSVP"
  },
  {
    type: "Event",
    audience: "Creators",
    title: "NYC creator ops lab",
    description: "Hands-on workflow clinic for content, contracts, and billing.",
    cta: "RSVP"
  }
];

export function ResourceHubPage() {
  return (
    <div className="bg-white text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-6 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Resource hub</p>
          <h1 className="text-4xl font-semibold text-slate-900">Public intel, no login required.</h1>
          <p className="mx-auto max-w-3xl text-slate-900 leading-relaxed">
            Our public library houses articles, templates, digital products, and webinars curated for both sides of the marketplace.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs uppercase tracking-[0.35em] text-slate-900">
            <span>Articles</span>
            <span>Templates</span>
            <span>Webinars</span>
            <span>Guides</span>
            <span>Events</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-10 px-6 py-12">
        <ResourceSection title="Templates & Kits" label="Public" resources={PUBLIC_RESOURCES} />
        <ResourceSection title="Mindshare Articles" label="Public" resources={PUBLIC_RESOURCES.slice(0, 2)} />
        <ResourceSection title="Webinars" label="Public" resources={WEBINARS} />
        <ResourceSection title="Guides" label="Public" resources={GUIDES} />
        <ResourceSection title="Events" label="Public" resources={EVENTS} />
      </section>
    </div>
  );
}


function ResourceSection({ title, label, resources, protected: isProtected = false }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        <span className="text-xs uppercase tracking-[0.35em] text-slate-500">{label}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((item) => (
          <article
            key={item.title}
            className={`relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition ${
              isProtected ? "backdrop-blur-sm" : ""
            }`}
          >
            {isProtected && (
              <div className="absolute inset-0 rounded-3xl bg-slate-200/80" aria-hidden="true" />
            )}
            <div className="relative flex items-center justify-between text-xs text-slate-600">
              <span>{item.type}</span>
              <span>{item.audience}</span>
            </div>
              <h3 className="relative mt-3 text-3xl font-bold tracking-wide text-slate-900">
                {item.title}
              </h3>
            <p className="relative mt-2 text-sm text-slate-800 leading-relaxed">{item.description}</p>
            <div className="relative mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] text-brand-red">
              <button type="button" disabled={isProtected}>
                {item.cta} →
              </button>
              {isProtected && <span className="text-[0.6rem] uppercase text-slate-700">Login required</span>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
