import React from "react";
import { Link } from "react-router-dom";
import { getSuitabilityScore } from "../hooks/useSuitability.js";
import SuitabilityScore from "../components/SuitabilityScore.jsx";

const BRAND_STATS = [
  {
    title: "450+ vetted creators",
    detail: "Connected across hospitality, fintech, retail, and lifestyle markets."
  },
  {
    title: "120+ campaigns delivered",
    detail: "Scaled through one accountable console across creators and brands."
  },
  {
    title: "72h average brief turnaround",
    detail: "Intake to shortlist happens in under three days every time."
  }
];

const brandNav = [
  { label: "Creator Match", copy: "Access vetted creators across content, affiliate, event, and ambassador campaigns.", to: "/brand/dashboard/creators" },
  { label: "Campaign Management", copy: "Brief once. Track deliverables, deadlines, and progress end-to-end.", to: "/brand/dashboard/campaigns" },
  { label: "Messaging & Files", copy: "Centralised communication and file sharing with creators.", to: "/brand/dashboard/messages" },
  { label: "Reporting & Insights", copy: "Clear visibility on reach, engagement, and campaign performance.", to: "/brand/dashboard/reports" },
  { label: "Account & Billing", copy: "Control billing, permissions, and access in one place.", to: "/brand/dashboard/account" },
  { label: "Campaign Dashboard", copy: "Monitor campaigns, alerts, and milestones at a glance.", to: "/brand/dashboard" }
];

export function BrandPage({ onRequestSignIn }) {
  const [fitResult, setFitResult] = React.useState(null);
  const [fitError, setFitError] = React.useState("");
  const [fitLoading, setFitLoading] = React.useState(false);

  const handleDemoFit = async () => {
    setFitLoading(true);
    setFitError("");
    try {
      const result = await getSuitabilityScore({
        talent: {
          categories: ["fashion", "lifestyle"],
          audienceInterests: ["beauty", "shopping"],
          avgEngagementRate: 3.5,
          platforms: ["instagram", "tiktok"],
          brandSafetyFlags: []
        },
        brief: {
          industry: "fashion",
          targetInterests: ["fashion", "beauty"],
          goals: ["awareness"],
          requiredPlatforms: ["instagram"],
          excludedCategories: []
        }
      });
      setFitResult(result);
    } catch (err) {
      setFitError(err instanceof Error ? err.message : "Unable to calculate fit");
    } finally {
      setFitLoading(false);
    }
  };

  return (
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
            {fitError ? <p className="mt-2 text-sm text-brand-red">{fitError}</p> : null}
            {fitResult ? (
              <div className="mt-4">
                <SuitabilityScore {...fitResult} />
              </div>
            ) : null}
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
    </div>
  );
}
