import React from "react";
import { LogoWordmark } from "../components/LogoWordmark.jsx";

const PROFILE_FIELDS = [
  "Audience insights + platforms",
  "Rates, deliverable lanes, and usage guardrails",
  "Availability, travel cities, and compliance notes",
  "Portfolio links, case studies, and recent wins"
];

const OPPORTUNITY_PREVIEW = [
  {
    brand: "Maison Delphine",
    location: "Paris & Remote",
    title: "Luxury Residency Story Suite",
    deliverables: "4 IG Reels • 2 Editorial Posts",
    payment: "€8K – €12K + travel",
    deadline: "Feb 28",
    status: "Shortlisting · Login required to apply"
  },
  {
    brand: "Nova Fintech",
    location: "Dubai · Hybrid",
    title: "AI Banking Confidence Drops",
    deliverables: "3 TikTok explainers • 1 livestream",
    payment: "$6K – $9K + CPA bonus",
    deadline: "Mar 5",
    status: "Live brief · Login required to apply"
  },
  {
    brand: "Aster Retail",
    location: "New York & Doha",
    title: "Global Capsule Tour",
    deliverables: "6 UGC sets • OOH stills",
    payment: "$5K – $7K + product equity",
    deadline: "Mar 12",
    status: "Pre-production · Login required to apply"
  }
];

const DASHBOARD_FEATURES = [
  "Performance metrics",
  "AI Deal Co-Pilot",
  "Content Calendar",
  "Files & Media Kit",
  "Priority briefs",
  "One-click applications"
];

const QUESTIONNAIRE_PREVIEW = [
  { label: "Revenue goal", value: "$180K run-rate · premium tier" },
  { label: "Affiliate linking", value: "LTK + ShopMy enabled, Amazon pending" },
  { label: "Platforms", value: "IG, TikTok, YouTube Shorts" },
  { label: "Gap analysis", value: "Need finance + travel authority lanes" },
  { label: "Quick wins", value: "Bundle evergreen Reels + city drops" }
];

export function CreatorPage({ onRequestSignIn }) {
  return (
    <div className="bg-brand-black text-brand-white">
      {/* Header */}
      <header className="border-b border-brand-white/10 bg-brand-black/70">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">// Talent Lane</p>
          <h1 className="font-display text-4xl uppercase tracking-wide">The Creator Pathway</h1>
          <p className="max-w-2xl text-sm text-brand-white/70">
            Explore opportunities, build your profile, join campaigns.
          </p>
        </div>
      </header>

      {/* Start Here */}
      <section className="border-b border-brand-white/10 bg-brand-white/5">
        <div className="mx-auto max-w-6xl px-6 py-12 grid gap-8 md:grid-cols-[1.2fr,1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Start here</p>
            <h2 className="mt-3 text-2xl font-semibold">Create your premium Break profile.</h2>
            <p className="mt-3 text-sm text-brand-white/70">
            Your profile powers matchmaking, AI prep, and routing. Submit once, keep it living.
            </p>
          </div>
          <div className="rounded-3xl border border-brand-white/15 bg-brand-black/60 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">You&apos;ll enter</p>
            <ul className="mt-4 space-y-2 text-sm text-brand-white/80">
              {PROFILE_FIELDS.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onRequestSignIn}
              className="mt-6 w-full rounded-full bg-brand-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-black hover:bg-brand-red/90 hover:text-brand-white"
            >
              Create your profile
            </button>
          </div>
        </div>
      </section>

      {/* Explore Opportunities */}
      <section className="border-b border-brand-white/10 bg-brand-black">
        <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Explore opportunities</p>
            <p className="mt-3 text-sm text-brand-white/70 max-w-lg">
              Preview active briefs before logging in. Applying requires a Break account so our team can
              route you with the right permissions and compliance.
            </p>
          </div>
          <a
            href="#opportunities-preview"
            className="inline-flex items-center justify-center rounded-full border border-brand-white/30 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-white hover:bg-brand-white/10"
          >
            Browse opportunities
          </a>
        </div>
      </section>

      {/* Opportunities Board Preview */}
      <section id="opportunities-preview" className="mx-auto max-w-6xl px-6 py-12 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold">Opportunities board preview</h3>
            <p className="text-sm text-brand-white/60">Login required to apply · Updated daily</p>
          </div>
          <span className="rounded-full border border-brand-white/15 px-4 py-1 text-xs uppercase tracking-[0.35em] text-brand-white/70">
            Public preview
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {OPPORTUNITY_PREVIEW.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-brand-white/10 bg-brand-white/5 p-5 space-y-3"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{item.brand}</p>
                <p className="text-sm text-brand-white/60">{item.location}</p>
              </div>
              <h4 className="text-xl font-semibold">{item.title}</h4>
              <div className="space-y-1 text-sm text-brand-white/70">
                <p><span className="text-brand-white/50">Deliverables:</span> {item.deliverables}</p>
                <p><span className="text-brand-white/50">Payment:</span> {item.payment}</p>
                <p><span className="text-brand-white/50">Deadline:</span> {item.deadline}</p>
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-white/60">{item.status}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Dashboard Unlocks */}
      <section className="border-t border-brand-white/10 bg-brand-white/5">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-6 md:flex md:items-start md:justify-between">
          <div className="max-w-xl space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Dashboard unlocks</p>
            <h3 className="text-2xl font-semibold">Premium-grade controls once you&apos;re approved.</h3>
            <p className="text-sm text-brand-white/70">
              Everything routes through the Break console so you stay calm, fast, and paid. AI co-pilots keep briefs prepped,
              while our finance + ops teams manage compliance in the background.
            </p>
          </div>
          <div className="rounded-3xl border border-brand-white/10 bg-brand-black/60 p-6 w-full md:max-w-sm">
            <ul className="space-y-2 text-sm text-brand-white/80">
              {DASHBOARD_FEATURES.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <a
              href="/onboarding"
              className="mt-6 block rounded-full bg-brand-white px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.35em] text-brand-black hover:bg-brand-red/90 hover:text-brand-white"
            >
              Complete onboarding
            </a>
          </div>
        </div>
      </section>

      {/* Questionnaire Preview */}
      <section className="border-t border-brand-white/10 bg-brand-black">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Questionnaire preview</p>
            <h3 className="text-2xl font-semibold">We collect intent so teams can act with clarity.</h3>
          </div>
          <div className="rounded-[32px] border border-brand-white/10 bg-brand-white/5 p-6 grid gap-4 md:grid-cols-2">
            {QUESTIONNAIRE_PREVIEW.map((entry) => (
              <div key={entry.label}>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-white/50">{entry.label}</p>
                <p className="mt-1 text-sm text-brand-white/80">{entry.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-white/10 bg-brand-black/70">
        <div className="mx-auto flex flex-col gap-4 px-6 py-10 text-sm text-brand-white/70 md:flex-row md:items-center md:justify-between max-w-6xl">
          <div className="flex items-center gap-3">
            <LogoWordmark variant="light" className="h-8 w-auto" />
            <span className="text-xs uppercase tracking-[0.35em]">The Break Co.</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <a href="/resource-hub" className="hover:text-brand-white">Resource Hub</a>
            <a href="/creator" className="hover:text-brand-white">Creators</a>
            <a href="/brand" className="hover:text-brand-white">Brands</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
