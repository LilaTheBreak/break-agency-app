import React from "react";
import { Link } from "react-router-dom";
import { questionnaires } from "../data/platform.js";

export function HomePage({ onRequestSignIn }) {
  return (
    <div className="bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 lg:flex-row">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-brand-red">Dubai · London</p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              The operating system for creators, talent managers, and brands that ship UGC at scale.
            </h1>
            <p className="text-lg text-white/70">
              Break Agency merges AI deal support, compliant onboarding, and a public resource hub so
              both sides of the marketplace stay in sync. No property listings, just campaigns.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/creator"
                className="rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-black hover:bg-brand-red/90"
              >
                I am a Creator/Talent
              </Link>
              <Link
                to="/brand"
                className="rounded-full border border-white/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-white/10"
              >
                I am a Brand
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-white/60">
              <Stat label="Creators vetted" value="450+" footer="18 markets" />
              <Stat label="Campaigns shipped" value="120+" footer="Last 12 months" />
              <Stat label="UGC board" value="Public" footer="Apply after login" />
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-lg font-semibold">Wireflow overview</h3>
            <ol className="mt-4 space-y-3 text-sm text-white/70">
              <li>Public: Home → Case studies → Resource Hub → Level-one split.</li>
              <li>Creators: View UGC board, create profile, onboarding, dashboard.</li>
              <li>Brands: Needs questionnaire, profile, campaign + match tools.</li>
              <li>Permissions: Resource Hub public, UGC creator-only, campaigns brand-only.</li>
            </ol>
            <button
              type="button"
              onClick={onRequestSignIn}
              className="mt-6 w-full rounded-2xl bg-brand-red px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-brand-red/90"
            >
              Launch console
            </button>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-black/40">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-10 md:grid-cols-3">
          {questionnaires.map((form) => (
            <div key={form.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Questionnaire</p>
              <h3 className="mt-3 text-xl font-semibold">{form.title}</h3>
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

      <section className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16 md:flex-row md:items-center">
          <div className="flex-1 space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Case studies</p>
            <h2 className="text-3xl font-semibold">Dubai hospitality · London fintech · Hybrid retail.</h2>
            <p className="text-white/70">
              We publish anonymised case studies inside the Resource Hub so both brands and creators
              see what high-performing collaborations look like before logging in.
            </p>
          </div>
          <div className="flex flex-1 gap-4">
            <CaseStudy
              title="UGC pipeline for GCC luxury stays"
              subtitle="41 briefs → 10 hero edits → 18 days"
              tag="Hospitality"
            />
            <CaseStudy
              title="Creator Match for AI finance app"
              subtitle="7 creators • £320 CPA • 4-country rollout"
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
      <p>{label}</p>
      <p className="text-xs text-white/50">{footer}</p>
    </div>
  );
}

function CaseStudy({ title, subtitle, tag }) {
  return (
    <div className="flex-1 rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{tag}</p>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-white/70">{subtitle}</p>
    </div>
  );
}
