import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "./Badge.jsx";

function listOrPlaceholder(values) {
  if (!values || (Array.isArray(values) && values.length === 0)) return "Not provided";
  if (Array.isArray(values)) return values.join(", ");
  return values;
}

export function OnboardingSnapshot({ data, role, heading = "Onboarding summary" }) {
  if (!data?.responses) {
    return (
      <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{heading}</p>
        <p className="mt-2 text-sm text-brand-black/70">No onboarding data captured yet.</p>
        <Link
          to="/onboarding"
          className="mt-3 inline-flex rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-white"
        >
          Complete onboarding
        </Link>
      </div>
    );
  }

  const responses = data.responses;
  const showUgc = role === "UGC_TALENT" || responses.context === "UGC creator";

  const cards = [
    {
      title: "Goals",
      body: listOrPlaceholder([responses.primaryGoal, responses.targetAmount ? `Target: ${responses.targetAmount}` : "", responses.timeframe ? `${responses.timeframe} month horizon` : ""].filter(Boolean)),
      detail: listOrPlaceholder(responses.priority || responses.revenueRange)
    },
    {
      title: "Platforms & formats",
      body: listOrPlaceholder(responses.platforms),
      detail: listOrPlaceholder(responses.formats)
    },
    {
      title: "Niche & angles",
      body: listOrPlaceholder([responses.primaryNiche, ...((responses.contentAngles || []) || [])].filter(Boolean)),
      detail: listOrPlaceholder(responses.categoriesWanted)
    },
    {
      title: "Friction & blocks",
      body: listOrPlaceholder(responses.blockers),
      detail: responses.blockerNotes || "No notes added"
    },
    {
      title: "Capacity & timelines",
      body: listOrPlaceholder([responses.capacity, responses.partnershipsPerMonth, responses.leadTime].filter(Boolean)),
      detail: listOrPlaceholder(responses.lessOfThis)
    },
    {
      title: "Partnership preferences",
      body: listOrPlaceholder(responses.partnershipPreference),
      detail: listOrPlaceholder(responses.categoriesAvoided)
    },
    {
      title: "Proof points",
      body: listOrPlaceholder(responses.proofPoints),
      detail: responses.usp || "USP not set"
    }
  ];

  if (showUgc) {
    cards.push({
      title: "UGC goals & usage",
      body: listOrPlaceholder(responses.ugcGoals),
      detail: listOrPlaceholder(responses.ugcUsage)
    });
    cards.push({
      title: "UGC delivery",
      body: listOrPlaceholder([responses.ugcCapacity, responses.ugcPricingConfidence].filter(Boolean)),
      detail: responses.ugcCommercialGoals ? listOrPlaceholder(responses.ugcCommercialGoals) : "—"
    });
  }

  return (
    <section className="space-y-3 rounded-3xl border border-brand-black/10 bg-brand-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{heading}</p>
          <p className="text-sm text-brand-black/70">Derived from your onboarding responses.</p>
        </div>
        <Link
          to="/onboarding"
          className="rounded-full border border-brand-black/20 px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-brand-black hover:-translate-y-0.5 hover:bg-brand-black/5"
        >
          Edit onboarding
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{card.title}</p>
              <Badge tone="neutral">Onboarding</Badge>
            </div>
            <p className="mt-2 text-sm font-semibold text-brand-black">{card.body}</p>
            <p className="text-xs text-brand-black/60">{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default OnboardingSnapshot;
