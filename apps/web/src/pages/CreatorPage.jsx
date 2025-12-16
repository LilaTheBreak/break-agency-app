import React, { useState, useEffect } from "react";
import { LogoWordmark } from "../components/LogoWordmark.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const PROFILE_FIELDS = [
  "Platforms and audience insights",
  "Rates and typical deliverables",
  "Availability and travel preferences",
  "Portfolio links and recent work"
];

const DASHBOARD_FEATURES = [
  "Campaign dashboard",
  "One-click applications",
  "Content deadlines and briefs",
  "Files and media uploads",
  "Performance insights (where available)",
  "Support from the Break team"
];

const QUESTIONNAIRE_PREVIEW = [
  { label: "Revenue goals", value: "What you want to earn and how you price work" },
  { label: "Platform focus", value: "Where you publish and what performs best" },
  { label: "Brand categories", value: "Who you want to work with next" },
  { label: "Availability", value: "When you can take on projects" },
  { label: "Travel preferences", value: "Cities you can cover and how often" }
];

const HOW_IT_WORKS_STEPS = [
  {
    title: "Create your Break profile",
    detail: "Share your platforms, content style, availability, and past work."
  },
  {
    title: "Get approved",
    detail: "Every profile is reviewed to ensure brand fit, quality, and compliance."
  },
  {
    title: "Apply to opportunities",
    detail: "Browse briefs, apply in one click, and manage everything in one place."
  }
];

const CLIENT_LOGOS = [
  { src: "/logos/amex.png", alt: "AMEX" },
  { src: "/logos/audemars-piguet.png", alt: "Audemars Piguet" },
  { src: "/logos/burberry.png", alt: "Burberry" },
  { src: "/logos/gisou.png", alt: "Gisou" },
  { src: "/logos/lancome.png", alt: "Lancome" },
  { src: "/logos/prada.png", alt: "Prada" },
  { src: "/logos/samsung.png", alt: "Samsung" },
  { src: "/logos/sky.png", alt: "Sky" },
  { src: "/logos/sol-de-janeiro.png", alt: "Sol De Janeiro" },
  { src: "/logos/yves-saint-laurent.png", alt: "Yves Saint Laurent" }
];

export function CreatorPage({ onRequestSignIn }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: session } = useAuth();
  const isAuthed = Boolean(session);

  useEffect(() => {
    // Fetch opportunities from API
    const fetchOpportunities = async () => {
      try {
        const response = await fetch('/api/opportunities/public');
        if (response.ok) {
          const data = await response.json();
          setOpportunities(data);
        }
      } catch (error) {
        console.error('Error fetching opportunities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes logoMarquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}
      </style>
      <div className="bg-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Operating across the US, UK, and UAE</p>
          <h1 className="font-display text-4xl uppercase tracking-wide">A platform connecting creators to real brand opportunities.</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Create a profile, get approved, and apply to paid brand campaigns — with clarity, protection, and support.
          </p>
          <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={onRequestSignIn}
              className="w-full rounded-full bg-slate-900 px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-brand-red/90 sm:w-auto"
            >
              Create your profile
            </button>
            <a
              href="#opportunities-preview"
              className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-900 underline-offset-4 hover:text-brand-red"
            >
              Browse opportunities
            </a>
          </div>
        </div>
      </header>

      {/* How It Works */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">How it works</p>
            <h2 className="text-2xl font-semibold text-slate-900">How it works</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div key={step.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Approval helps us protect creators and brands on both sides.
          </p>
        </div>
      </section>

      {/* Trusted Brands */}
      <section className="border-b border-slate-200 bg-[#fffaf6]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-xs uppercase tracking-[0.4em] text-brand-red">
            Trusted by global brands running creator campaigns across fashion, hospitality, fintech, and culture.
          </p>
          <div className="relative mt-10 overflow-hidden rounded-3xl border border-[#e6d8ca] bg-white/70 px-4 py-5">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
            <div
              className="flex min-w-[200%] items-center gap-10"
              style={{ animation: "logoMarquee 28s linear infinite" }}
            >
              {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((client, idx) => (
                <div key={`${client.alt}-${idx}`} className="flex items-center justify-center opacity-80 transition hover:opacity-100">
                  <img
                    src={client.src}
                    alt={client.alt}
                    className="h-10 w-auto object-contain"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Start Here */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12 grid gap-8 md:grid-cols-[1.2fr,1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Start here</p>
            <h2 className="mt-3 text-2xl font-semibold">Your Break profile unlocks opportunities.</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Your profile helps brands understand your audience, rates, and availability — so you&apos;re only considered for work that actually fits.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Profile includes</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {PROFILE_FIELDS.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onRequestSignIn}
              className="mt-6 w-full rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-brand-red/90"
            >
              Create your profile
            </button>
          </div>
        </div>
      </section>

      {/* Explore Opportunities */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Live brand opportunities</p>
            <p className="mt-3 text-sm text-slate-600 max-w-lg leading-relaxed">
              Preview active briefs. Applying requires a Break account and approval.
            </p>
          </div>
          <a
            href="#opportunities-preview"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-900 hover:bg-slate-100"
          >
            Browse opportunities
          </a>
        </div>
      </section>

      {/* Opportunities Board Preview */}
      <section id="opportunities-preview" className="mx-auto max-w-6xl px-6 py-12 space-y-6 bg-slate-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold">Live brand opportunities</h3>
              <p className="text-sm text-slate-500">Log in required to apply · Updated daily</p>
            </div>
          <span className="rounded-full border border-slate-300 px-4 py-1 text-xs uppercase tracking-[0.35em] text-slate-500">
            Public preview
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {loading ? (
            <div className="col-span-3 py-12 text-center text-slate-500">
              Loading opportunities...
            </div>
          ) : opportunities.length === 0 ? (
            <div className="col-span-3 py-12 text-center text-slate-500">
              No opportunities available at this time
            </div>
          ) : (
            opportunities.map((item) => (
            <article
              key={item.title}
              className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white"
            >
              <div className="relative h-40 w-full">
                <img
                  src={item.image}
                  alt={`${item.brand} preview`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-6 -bottom-8 flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md">
                  <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-100">
                    <img src={item.logo} alt={`${item.brand} logo`} className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{item.type}</p>
                    <p className="text-sm font-semibold text-slate-900">{item.brand}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 px-5 pb-6 pt-10">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{item.location}</p>
                </div>
                <h4 className="text-xl font-semibold">{item.title}</h4>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>
                    <span className="text-slate-400">Deliverables:</span> {item.deliverables}
                  </p>
                  <p className="relative flex items-center gap-2">
                    <span className="text-slate-400">Payment:</span>
                    <span className={!isAuthed ? "blur-[4px] opacity-60 select-none" : ""}>{item.payment}</span>
                    {!isAuthed && (
                      <span className="ml-auto flex items-center gap-1 rounded-full bg-slate-900/85 px-2 py-1 text-[0.6rem] uppercase tracking-[0.25em] text-white">
                        <span aria-hidden="true">🔒</span> Log in to view
                      </span>
                    )}
                  </p>
                  <p>
                    <span className="text-slate-400">Deadline:</span> {item.deadline}
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  {isAuthed ? "Apply in Break" : "Log in to apply"}
                </p>
              </div>
            </article>
          )))}
        </div>
        <p className="text-xs text-slate-500">Details and applications are available once approved.</p>
      </section>

      {/* Dashboard Unlocks */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-6 md:flex md:items-start md:justify-between md:gap-12 md:space-y-0">
          <div className="max-w-xl space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Dashboard unlocks</p>
            <h3 className="text-2xl font-semibold text-slate-900">Everything you need, once you&apos;re approved.</h3>
            <p className="text-sm text-slate-600">
              Once approved, you&apos;ll manage campaigns, deadlines, and applications through the Break platform — while we handle the admin in the background.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 w-full md:max-w-sm shadow-sm">
            <ul className="space-y-2 text-sm text-slate-600">
              {DASHBOARD_FEATURES.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <a
              href="/onboarding"
              className="mt-6 block rounded-full bg-slate-900 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-brand-red/90"
            >
              Complete onboarding
            </a>
          </div>
        </div>
      </section>

      {/* Questionnaire Preview */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Questionnaire preview</p>
            <h3 className="text-2xl font-semibold text-slate-900">We collect intent so brands don&apos;t waste your time.</h3>
            <p className="text-sm text-slate-600">
              A short onboarding questionnaire helps us understand your goals and route you to the right opportunities.
            </p>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 grid gap-4 md:grid-cols-2">
            {QUESTIONNAIRE_PREVIEW.map((entry) => (
              <div key={entry.label}>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{entry.label}</p>
                <p className="mt-1 text-sm text-slate-600">{entry.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
