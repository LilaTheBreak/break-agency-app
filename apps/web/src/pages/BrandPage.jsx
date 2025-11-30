import React from "react";
import { Link } from "react-router-dom";
import { getSuitabilityScore } from "../hooks/useSuitability.js";
import SuitabilityScore from "../components/SuitabilityScore.jsx";

const brandNav = ["Dashboard", "Campaigns", "Creator Match", "Reports", "Messages", "Account"];

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
    <div className="bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Brand pathway</p>
          <h1 className="text-3xl font-semibold">Campaign creation, creator match, contracts, reporting.</h1>
          <p className="text-white/70">
            Brands browse public case studies, complete the needs questionnaire, then unlock the
            dashboard to manage campaigns. Opportunities board stays creator-side; brands only create briefs that
            route to eligible creators.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRequestSignIn}
              className="rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-brand-red/90"
            >
              Create brand profile
            </button>
            <Link
              to="/resource-hub"
              className="rounded-full border border-white/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/10"
            >
              Review case studies
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12 space-y-4">
        <h2 className="text-2xl font-semibold">Brand dashboard navigation</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {brandNav.map((item) => (
            <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold">{item}</p>
              <p className="mt-2 text-xs text-white/60">{copyForNav(item)}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="border-t border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-4">
          <h3 className="text-xl font-semibold">Brand Needs Questionnaire</h3>
          <p className="text-white/70">
            Qualifies scope, budget, and readiness; prompts profile creation to proceed. Campaign
            creation stays brand-only, opportunities routing happens automatically to approved creators.
          </p>
          <button
            type="button"
            onClick={onRequestSignIn}
            className="rounded-full bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-black hover:bg-brand-red/90"
          >
            Launch questionnaire
          </button>
        </div>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Suitability</p>
              <p className="text-lg font-semibold">Talent-brand fit demo</p>
              <p className="text-sm text-white/70">Pattern-based score using categories, platforms, and engagement.</p>
            </div>
            <button
              type="button"
              onClick={handleDemoFit}
              disabled={fitLoading}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black disabled:opacity-50"
            >
              {fitLoading ? "Calculating..." : "Run demo fit"}
            </button>
          </div>
          {fitError ? <p className="mt-2 text-sm text-brand-red">{fitError}</p> : null}
          {fitResult ? (
            <div className="mt-4">
              <SuitabilityScore {...fitResult} />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function copyForNav(item) {
  switch (item) {
    case "Campaigns":
      return "Plan, brief, and track campaigns end-to-end.";
    case "Creator Match":
      return "AI-assisted recommendations with shortlist exports.";
    case "Reports":
      return "Reach, engagement, conversions, spend.";
    case "Messages":
      return "Threaded comms + files with creators.";
    case "Account":
      return "Billing, permissions, notification policies.";
    default:
      return "Pulse of briefs, alerts, and upcoming milestones.";
  }
}
