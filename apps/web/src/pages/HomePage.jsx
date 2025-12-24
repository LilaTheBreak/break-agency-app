import React from "react";
import { Link } from "react-router-dom";
import { questionnaires } from "../data/platform.js";

const highlightCards = [
  {
    title: "Signal + workflow engine",
    body: "Predictive deal scoring, automated briefs, and HUD-style status updates keep every creator and brand informed."
  },
  {
    title: "Identity & compliance",
    body: "Custom onboarding, self-serve contracts, and publishable audit trails mean you never chase paperwork again."
  },
  {
    title: "Ops in minutes",
    body: "Launch live briefs, match creators, and surface approvals without leaving a single interface."
  },
];

export function HomePage({ onRequestSignIn }) {
  const [creatorCount, setCreatorCount] = React.useState(450);

  React.useEffect(() => {
    fetch("/api/dashboard/creators/active")
      .then((res) => res.json())
      .then((data) => {
        if (data.count !== undefined) {
          setCreatorCount(data.count);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch creator count:", err);
      });
  }, []);
  return (
    <div className="bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-brand-red">
              <span>BUILDING IN THE CLOUD</span>
              <span className="h-px flex-1 bg-white/40" />
            </div>
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.45em] text-brand-red">
                Operating across NYC · Doha · London · Dubai
              </p>
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                Creator campaigns built on resilient infrastructure, AI oversight, and zero trust workflows.
              </h1>
              <div className="grid gap-2 text-sm text-white/70 md:grid-cols-2">
                <p>Split live campaigns, approvals, and payments across a single, auditable command center.</p>
                <p>Every insight is traceable—from call notes to signature-ready deliverables—without the noise.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/creator"
                className="w-full rounded-full border border-white/30 px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:border-brand-red hover:text-brand-red sm:w-auto"
              >
                Creator console
              </Link>
              <Link
                to="/brand"
                className="w-full rounded-full border border-white/30 px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:border-brand-red hover:text-brand-red sm:w-auto"
              >
                Brand control room
              </Link>
            </div>
            <div className="grid gap-4 text-sm text-white/60 md:grid-cols-3">
              <Stat label="Creators vetted" value={`${creatorCount}+`} footer="Across 18 markets" />
              <Stat label="Campaigns shipped" value="120+" footer="Last 12 months" />
              <Stat label="Brief turnaround" value="72h" footer="Intake to shortlist" />
            </div>
          </div>
          <div className="flex-1 space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_120px_rgba(10,10,10,0.7)] backdrop-blur">
            <div className="flex flex-wrap gap-2">
              {["AI", "API", "Live Ops", "Secure"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/20 px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-white/70"
                >
                  {chip}
                </span>
              ))}
            </div>
            <p className="text-xs uppercase tracking-[0.45em] text-brand-red">Live telemetry</p>
            <h3 className="text-2xl font-semibold text-white">Wireframes become launchpads.</h3>
            <p className="text-sm text-white/70">
              Deploy compliance-approved creators, attach AI-generated risk scores, and claim new opportunities from a single API-backed surface.
            </p>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-brand-red" />
                Automations keep approvals, deliverables, and payouts synchronized.
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-brand-red" />
                Break AI monitors every last mile and signals exactly what to ship next.
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-brand-red" />
                Teams step into the console with single sign-on, scoped tokens, and dark-mode-ready dashboards.
              </li>
            </ul>
            <button
              type="button"
              onClick={onRequestSignIn}
              className="w-full rounded-2xl bg-brand-red px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-red/90"
            >
              Launch console
            </button>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-black/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-12 lg:grid-cols-3">
          {questionnaires.map((form) => (
            <div key={form.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Questionnaire</p>
              <h3 className="mt-3 text-lg font-semibold">{form.title}</h3>
              <p className="mt-2 text-sm text-white/70">{form.summary}</p>
              <Link
                to={form.route}
                className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.3em] text-brand-red"
              >
                {form.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Signal & workflow</p>
            <h2 className="text-3xl font-semibold">Tech to keep every creator, founder, and brand aligned.</h2>
            <p className="max-w-xl text-sm text-white/70">
              A modern operations layer doesn’t mean more meetings. Break connects briefs, approvals, contracts,
              and execution so teams can move with the confidence of a systems-level product.
            </p>
            <div className="grid gap-4">
              {highlightCards.map((card) => (
                <TechCard key={card.title} title={card.title} body={card.body} />
              ))}
            </div>
          </div>
          <div className="grid flex-1 gap-4 md:grid-cols-2">
            <NumericCard
              label="Precision briefs"
              value="1,200"
              footer="Campaigns documented in the last 6 months"
            />
            <NumericCard label="Automated insights" value="24/7" footer="AI surface new risks in real time" />
            <NumericCard label="Creator tokens" value="32" footer="Profiles live on public board" />
            <NumericCard label="Written playbooks" value="18" footer="Shared with every client" />
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16 md:flex-row md:items-center">
          <div className="flex-1 space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Case studies</p>
            <h2 className="text-3xl font-semibold">Dubai hospitality · London fintech · Hybrid retail.</h2>
            <p className="text-sm text-white/70">
              Anonymised case studies show how creators and brands move from brief to live activation without slowing down.
            </p>
          </div>
          <div className="flex flex-1 gap-4">
            <CaseStudy
              title="UGC pipeline for GCC luxury stays"
              subtitle="41 briefs → 10 hero edits → 18 days"
              tag="Hospitality"
            />
            <CaseStudy
              title="Creator match for AI finance app"
              subtitle="7 creators · £320 CPA · 4-country rollout"
              tag="Fintech"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, footer }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="text-xs uppercase tracking-[0.35em] text-white/60">{label}</p>
      <p className="text-xs text-white/50">{footer}</p>
    </div>
  );
}

function TechCard({ title, body }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2">{body}</p>
    </div>
  );
}

function NumericCard({ label, value, footer }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 text-sm text-white">
      <p className="text-3xl font-semibold">{value}</p>
      <p className="text-xs uppercase tracking-[0.35em] text-white/60">{label}</p>
      <p className="mt-2 text-xs text-white/70">{footer}</p>
    </div>
  );
}

function CaseStudy({ title, subtitle, tag }) {
  return (
    <div className="flex-1 rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{tag}</p>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-white/70">{subtitle}</p>
    </div>
  );
}
