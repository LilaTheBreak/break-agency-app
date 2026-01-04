import React from "react";
import { Link } from "react-router-dom";

const BRAND_FAQS = [
  {
    q: "How do I create a brand profile?",
    a: "Click Create brand profile, complete the short questionnaire with goals, budget range, timelines, and target audience, then submit. You’ll unlock your dashboard after setup."
  },
  {
    q: "How does creator matching work?",
    a: "Break routes your brief to vetted creators who align to your brand, platforms, and objectives. You’ll see recommended matches in the Creator Match area of your dashboard."
  },
  {
    q: "Can I run different campaign types?",
    a: "Yes. Break supports paid creator campaigns, affiliate programmes, product seeding, event and experiential activations, and ambassador/long-term partnerships."
  },
  {
    q: "Where do I manage contracts and deliverables?",
    a: "In your brand dashboard. Contracts, deliverables, timelines, messaging, and reporting sit in one place once your profile is approved."
  }
];

const CREATOR_FAQS = [
  {
    q: "How do I get approved?",
    a: "Create your Break profile with platforms, audience, rates, deliverables, and availability. We review profiles for brand fit, quality, and compliance before enabling applications."
  },
  {
    q: "What happens after approval?",
    a: "You’ll unlock your dashboard to browse briefs, apply in one click, track deadlines, and manage messages, files, and payments in one place."
  },
  {
    q: "Can I see payments before applying?",
    a: "Payment details are visible once you’re logged in and approved. Public previews hide sensitive terms to protect both creators and brands."
  },
  {
    q: "How do I update availability or travel?",
    a: "Edit your profile to keep availability, travel cities, and rates current. This helps us route the right briefs to you."
  }
];

const SUPPORT_TOPICS = [
  {
    title: "Getting started",
    links: [
      { label: "Create a brand profile", to: "/brand" },
      { label: "Create a creator profile", to: "/creator" },
      { label: "View case studies", to: "/resource-hub" }
    ]
  },
  {
    title: "Account & access",
    links: [
      { label: "Reset your password", to: "/help#passwords" },
      { label: "Manage permissions", to: "/help#permissions" },
      { label: "Billing & invoices", to: "/help#billing" }
    ]
  },
  {
    title: "Campaigns & briefs",
    links: [
      { label: "Create a brief", to: "/help#briefs" },
      { label: "Track deliverables", to: "/help#deliverables" },
      { label: "Reporting & insights", to: "/help#reporting" }
    ]
  },
  {
    title: "Policies",
    links: [
      { label: "Acceptable use", to: "/legal#acceptable-use" },
      { label: "Privacy & data", to: "/legal#privacy" },
      { label: "Payments & fees", to: "/legal#fees" }
    ]
  }
];

import { BlockRenderer } from "../components/BlockRenderer.jsx";
import { usePublicCmsPage } from "../hooks/usePublicCmsPage.js";

export function HelpCenterPage() {
  // Fetch CMS content for help center page (public, no auth required)
  const cms = usePublicCmsPage("help");

  // If CMS has blocks, render them instead of hardcoded content
  if (!cms.loading && cms.blocks && cms.blocks.length > 0) {
    return (
      <div className="bg-white text-slate-900 min-h-screen">
        <BlockRenderer blocks={cms.blocks} />
      </div>
    );
  }

  // Fallback to hardcoded content if CMS is empty or loading
  return <HelpCenterPageHardcoded />;
}

function HelpCenterPageHardcoded() {
  return (
    <div className="bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-10 space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Help Centre</p>
          <h1 className="text-3xl font-semibold">Support for brands and creators.</h1>
          <p className="text-sm text-slate-600">
            Browse FAQs, find quick links, and get answers on how to use Break. If you need more help, contact us and the team will respond.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/contact"
              className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-red/90"
            >
              Contact support
            </Link>
            <Link
              to="/legal"
              className="rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 hover:bg-slate-100"
            >
              Legal &amp; privacy
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Brand FAQs</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              {BRAND_FAQS.map((item) => (
                <div key={item.q}>
                  <p className="font-semibold text-slate-900">{item.q}</p>
                  <p className="mt-1 text-slate-700">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Creator FAQs</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              {CREATOR_FAQS.map((item) => (
                <div key={item.q}>
                  <p className="font-semibold text-slate-900">{item.q}</p>
                  <p className="mt-1 text-slate-700">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Popular topics</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {SUPPORT_TOPICS.map((topic) => (
              <div key={topic.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{topic.title}</p>
                <div className="mt-2 flex flex-col gap-1 text-sm text-slate-700">
                  {topic.links.map((link) => (
                    <Link key={link.label} to={link.to} className="underline underline-offset-4 hover:text-brand-red">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Still need help?</h2>
          <p className="text-sm text-slate-700">
            Email us at{" "}
            <a href="mailto:help@thebreakco.com" className="underline">
              help@thebreakco.com
            </a>{" "}
            or use the contact form. We aim to respond within one business day.
          </p>
        </section>
      </main>
    </div>
  );
}

export default HelpCenterPage;
