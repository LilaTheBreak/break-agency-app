import React from "react";
import { Badge } from "./Badge.jsx";
import { ProgressBar } from "./ProgressBar.jsx";

export function MultiBrandCampaignCard({
  campaign,
  notes,
  onNotesChange,
  showNotes = true
}) {
  const brands = campaign.brandSummaries || [];
  const aggregated = campaign.aggregated || {};
  return (
    <article className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Campaign</p>
          <h4 className="font-display text-2xl uppercase">{campaign.title}</h4>
        </div>
        <Badge tone="positive">{campaign.stage || "planning"}</Badge>
      </div>
      {brands.length ? (
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => (
            <span
              key={brand.id}
              className="rounded-full border border-brand-black/20 bg-white px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-black/70"
            >
              {brand.name}
            </span>
          ))}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Total reach" value={aggregated.totalReach || 0} suffix=" impressions" />
        <Metric
          label="Brands involved"
          value={brands.length}
          suffix={` ${brands.length === 1 ? "brand" : "brands"}`}
        />
        <Metric
          label="Creator pods"
          value={Array.isArray(campaign.creatorTeams) ? campaign.creatorTeams.length : 0}
          suffix=" pods"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {brands.map((brand) => (
          <div key={brand.id} className="rounded-2xl border border-brand-black/10 bg-brand-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Brand</p>
                <p className="font-semibold text-brand-black">{brand.name}</p>
              </div>
              <Badge tone="neutral">£{formatNumber(brand.revenue || 0)}</Badge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Pacing</p>
              <ProgressBar value={Math.min(Math.round((brand.pacing || 0) * 100), 100)} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Creator matches</p>
              {brand.matches?.length ? (
                <ul className="mt-1 space-y-1 text-xs text-brand-black/70">
                  {brand.matches.map((match, index) => (
                    <li key={`${brand.id}-match-${index}`}>• {match.name || match}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-brand-black/50">Matches loading…</p>
              )}
            </div>
            {brand.opportunities?.length ? (
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Opportunities</p>
                <ul className="mt-1 space-y-1 text-xs text-brand-black/70">
                  {brand.opportunities.map((opportunity, index) => (
                    <li key={`${brand.id}-opp-${index}`}>• {opportunity}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {showNotes ? (
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-red">Notes</p>
          <textarea
            value={notes ?? ""}
            onChange={(event) => onNotesChange?.(campaign.id, event.target.value)}
            className="mt-2 w-full rounded-2xl border border-brand-black/20 bg-white px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>
      ) : null}
    </article>
  );
}

function Metric({ label, value, suffix = "" }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{label}</p>
      <p className="text-xl font-semibold text-brand-black">{formatNumber(value)}{suffix}</p>
    </div>
  );
}

function formatNumber(value) {
  if (typeof value !== "number") return value;
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value;
}
