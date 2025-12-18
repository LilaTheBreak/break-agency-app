import React from "react";
import { Link } from "react-router-dom";

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

const brandNav = [
  { label: "Creator Match", copy: "Access vetted creators across content, affiliate, event, and ambassador campaigns.", to: "/brand/dashboard/creators" },
  { label: "Campaign Management", copy: "Brief once. Track deliverables, deadlines, and progress end-to-end.", to: "/brand/dashboard/campaigns" },
  { label: "Messaging & Files", copy: "Centralised communication and file sharing with creators.", to: "/brand/dashboard/messages" },
  { label: "Reporting & Insights", copy: "Clear visibility on reach, engagement, and campaign performance.", to: "/brand/dashboard/reports" },
  { label: "Account & Billing", copy: "Control billing, permissions, and access in one place.", to: "/brand/dashboard/account" },
  { label: "Campaign Dashboard", copy: "Monitor campaigns, alerts, and milestones at a glance.", to: "/brand/dashboard" }
];

const clientTestimonials = [
  {
    id: "klarna",
    brand: "Klarna",
    headline: "Outstanding Results!",
    quote:
      "Great to see the traction — really excited about this partnership and seeing the series develop. Thank you also for the very smooth process and comms.",
    speaker: "Mike Waywell",
    title: "Klarna",
    colors: {
      frame: "#ece7e2",
      canvas: "#f4e6de",
      accent: "#f8b7cb",
      bar: "#111827",
      text: "#0f172a"
    },
    brandRender: (
      <div className="rounded-xl bg-[#f8b7cb] px-4 py-10 text-center shadow-inner">
        <span className="text-5xl font-black tracking-tight text-slate-900">Klarna</span>
      </div>
    )
  },
  {
    id: "bare-minerals",
    brand: "bareMinerals",
    headline: "Exceeded Our Expectations",
    quote:
      "Our internal teams are so excited about the campaign and how well it's doing.",
    speaker: "Madeline Dennis",
    title: "Global Influencer Marketing – BareMinerals",
    colors: {
      frame: "#e6e2db",
      canvas: "#e6e2db",
      accent: "#0d0d0d",
      bar: "#0d0d0d",
      text: "#0f172a"
    },
    brandRender: (
      <div className="rounded-xl bg-black px-4 py-12 text-center shadow-inner">
        <span className="text-4xl font-semibold tracking-wide text-white">bareMinerals</span>
      </div>
    )
  },
  {
    id: "blumi",
    brand: "Blumi",
    headline: "Innovative and Reliable",
    quote:
      "I am truly grateful to you. Last night I did see my dream come true — it was amazing. It was absolutely epic and I am still gobsmacked you executed that within 10 days.",
    speaker: "Naomi",
    title: "Founder of Blumi",
    colors: {
      frame: "#ece7e2",
      canvas: "#f4e6de",
      accent: "#ffffff",
      bar: "#0f172a",
      text: "#0f172a"
    },
    brandRender: (
      <div className="rounded-xl bg-white px-4 py-8 text-center shadow-inner">
        <span className="bg-gradient-to-r from-fuchsia-600 via-pink-600 to-orange-400 bg-clip-text text-5xl font-black tracking-tight text-transparent">
          Blumi
        </span>
      </div>
    )
  }
];

export function BrandPage() {
  const [activeTestimonial, setActiveTestimonial] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % clientTestimonials.length);
    }, 5000);
    return () => clearInterval(timer);
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
        <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Brand pathway</p>
          <h1 className="text-3xl font-semibold text-slate-900">Creator campaigns, partnerships, and activations — without the chaos.</h1>
          <p className="text-slate-700 leading-relaxed">
            Create campaigns, match with vetted creators, manage contracts, and track results — all in one calm, accountable console.
          </p>
          <p className="text-sm text-slate-600">
            From one-off campaigns to affiliates, events, and long-term partnerships.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-red/90"
            >
              Create brand profile
            </Link>
            <Link
              to="/resource-hub"
              className="rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 hover:bg-slate-100"
            >
              View case studies
            </Link>
          </div>
        </div>
      </section>
      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl space-y-8 rounded-[32px] bg-white p-10 text-center shadow-[0_20px_70px_rgba(0,0,0,0.06)] border border-slate-200">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">How brands use Break</p>
            <h2 className="text-4xl font-semibold uppercase leading-tight text-slate-900">
              Create, match, and launch without friction.
            </h2>
            <p className="text-sm text-slate-600">
              Break brings every opportunity, campaign, deliverable, and payment into one console so teams can stay organised without the chaos.
            </p>
          </div>
          <div className="grid gap-6 text-sm text-slate-700 md:grid-cols-3">
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Create a brand profile</p>
              <p className="mt-3">Tell us about your goals, budget range, timelines, and target audience.</p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Get matched with creators</p>
              <p className="mt-3">We route your brief to vetted creators who fit your brand, platforms, and objectives.</p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Launch and manage with ease</p>
              <p className="mt-3">Contracts, deliverables, comms, and reporting live in one place.</p>
            </article>
          </div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">
            Brands create briefs. Creator applications and routing are handled on the creator side.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12 space-y-6">
        <h2 className="text-2xl font-semibold text-slate-900">Your brand dashboard unlocks after setup</h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
          Once your brand profile and needs questionnaire are complete, you’ll unlock your dashboard to manage campaigns, creators, reporting, and billing in one place.
        </p>
          <div className="grid gap-4 md:grid-cols-3">
            {brandNav.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300"
              >
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-2 text-xs text-slate-600">{item.copy}</p>
              </Link>
            ))}
          </div>
        <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
          Built for every type of creator partnership: Paid creator campaigns · Affiliate programmes · Product seeding · Event & experiential activations · Ambassador & long-term partnerships. Whether you’re testing creators or scaling a programme, Break adapts to your workflow.
        </p>
      </section>
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-14 space-y-6 text-center">
          <h3 className="text-xl font-semibold text-slate-900">A short setup that saves weeks later.</h3>
          <p className="text-slate-700 leading-relaxed max-w-3xl mx-auto">
            Our onboarding questionnaire qualifies scope, budget, and timelines — so creator matching and campaign setup happens quickly and accurately.
          </p>
          <div className="flex justify-center">
            <Link
              to="/signup"
              className="inline-flex rounded-full bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-brand-red/90"
            >
              Create brand profile
            </Link>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-left shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Founder-led strategy</p>
                <p className="text-lg font-semibold text-slate-900">Work directly with the founder behind Break.</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  For brands that want more than software, Break offers a founder-led strategy option — combining platform access with hands-on campaign planning, creator curation, and execution oversight.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Strategic campaign design · Creator shortlisting and negotiations · Launch planning and activation support · Senior-level oversight throughout delivery. This is a premium, hands-on service for brands seeking high-impact results.
                </p>
              </div>
              <div className="flex items-start">
            <Link
              to="/book-founder"
              className="inline-flex rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-red/90"
            >
              Request founder-led strategy
            </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 space-y-4 text-center">
          <h3 className="text-2xl font-semibold text-slate-900">Not a marketplace. Not an agency guessing.</h3>
          <p className="text-sm text-slate-700 max-w-3xl mx-auto leading-relaxed">
            Break is a curated platform combining vetted creators, structured workflows, and real human oversight — giving brands clarity, control, and confidence at every stage.
          </p>
        </div>
      </section>
      
      {/* Trusted Brands */}
      <section className="border-t border-slate-200 bg-[#fffaf6]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-xs uppercase tracking-[0.4em] text-brand-red">
            Trusted by global brands running creator campaigns across fashion, hospitality, fintech, and culture.
          </p>
          <div className="relative mt-10 overflow-hidden rounded-3xl border border-[#e6d8ca] bg-white/70 px-4 py-5">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
            <div
              className="flex min-w-[200%] items-center gap-16"
              style={{ animation: "logoMarquee 28s linear infinite" }}
            >
              {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((client, idx) => (
                <div key={`${client.alt}-${idx}`} className="flex items-center justify-center opacity-80 transition hover:opacity-100">
                  <img
                    src={client.src}
                    alt={client.alt}
                    className="h-32 w-48 object-contain scale-150"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="border-t border-slate-200 bg-[#f6efe7]">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="relative rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
            >
              {clientTestimonials.map((entry) => (
                <div
                  key={entry.id}
                  className="min-w-full w-full shrink-0 grow-0 grid gap-6 md:grid-cols-[1.05fr,1fr]"
                  style={{ width: "100%" }}
                >
                  <div
                    className="flex items-center justify-center p-6 md:rounded-l-[32px] md:rounded-tr-none rounded-t-[32px]"
                    style={{ backgroundColor: entry.colors.canvas }}
                  >
                    <div
                      className="w-full max-w-xl overflow-hidden rounded-2xl border"
                      style={{ borderColor: "#cbd5e1", backgroundColor: entry.colors.frame }}
                    >
                      <div className="h-2" style={{ backgroundColor: entry.colors.bar }} />
                      <div className="bg-white px-4 pb-5 pt-4">
                        {entry.brandRender}
                      </div>
                      <div className="border-t border-slate-400/50 bg-white px-6 py-5">
                        <p className="text-xl font-semibold text-slate-900">"{entry.headline}"</p>
                        <div className="mt-3 border-t border-slate-400/60 pt-3 text-sm leading-relaxed text-slate-800">
                          <p>{entry.quote}</p>
                          <p className="mt-4 font-semibold">{entry.speaker},</p>
                          <p className="-mt-1 text-slate-700">{entry.title}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center px-6 py-8 md:px-10 space-y-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Client results</p>
                    <h3 className="text-2xl font-semibold text-slate-900">Proof from partners that demand both speed and polish.</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {entry.id === "klarna"
                        ? "Klarna tapped Break to deliver an always-on creator series with clear pacing, approvals, and smooth comms. The result: fast traction, happy teams, and a premium experience end-to-end."
                        : entry.id === "bare-minerals"
                        ? "BareMinerals relied on Break to keep a premium campaign on pace with strong comms, clear approvals, and predictable delivery — giving internal teams confidence in the rollout."
                        : "Blumi trusted Break to move fast on a founder-led vision—turning a dream brief into a live, premium launch within 10 days while keeping collaboration smooth."}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        to="/signup"
                        className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-red/90"
                      >
                        Launch with Break
                      </Link>
                      <Link
                        to="/resource-hub"
                        className="rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 hover:bg-slate-100"
                      >
                        See more work
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveTestimonial((prev) => (prev + 1) % clientTestimonials.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md ring-1 ring-slate-200 transition hover:bg-white"
              aria-label="Next testimonial"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5 text-slate-900"
              >
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex items-center justify-center border-t border-slate-200 bg-white/80 px-6 py-4">
              <div className="flex gap-2">
                {clientTestimonials.map((entry, index) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setActiveTestimonial(index)}
                    className={`h-2.5 w-8 rounded-full transition ${
                      activeTestimonial === index ? "bg-slate-900" : "bg-slate-200 hover:bg-slate-300"
                    }`}
                    aria-label={`Show ${entry.brand} testimonial`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
