import React, { useMemo } from "react";
import { useQuery } from "../lib/react-query-shim.jsx";
import { useDealFilters } from "../hooks/useDealFilters.js";
import { fetchDeals } from "../services/dealsClient.js";
import DealsFilters from "../components/DealsFilters.jsx";
import DealsTable from "../components/DealsTable.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { useDealExtraction } from "../hooks/useDealExtraction.js";
import { useEffect, useState } from "react";
import { useNegotiationInsights } from "../hooks/useNegotiationInsights.js";
import { useCampaignBuilder } from "../hooks/useCampaignBuilder.js";

export default function DealsDashboard() {
  const { filters, update } = useDealFilters();
  const auth = useAuth();
  const { listDrafts } = useDealExtraction();
  const { generate } = useNegotiationInsights();
  const { buildFromDeal } = useCampaignBuilder();
  const [drafts, setDrafts] = useState([]);
  const [draftError, setDraftError] = useState("");

  useEffect(() => {
    if (!auth?.user?.id) return;
    const loadDrafts = async () => {
      try {
        const payload = await listDrafts(auth.user.id);
        setDrafts(payload?.drafts || []);
      } catch (err) {
        setDraftError(err instanceof Error ? err.message : "Unable to load drafts");
      }
    };
    loadDrafts();
  }, [auth?.user?.id, listDrafts]);

  const { data, status } = useQuery({
    queryKey: ["deals", filters],
    queryFn: () => fetchDeals(filters),
    enabled: Boolean(auth?.user)
  });

  const deals = data?.threads || [];

  const allTalents = useMemo(() => {
    const list = [];
    deals.forEach((d) => {
      (d.talentProfiles || []).forEach((t) => {
        if (t && !list.find((x) => x.id === t.id)) list.push(t);
      });
    });
    return list;
  }, [deals]);

  const allBrands = useMemo(() => {
    const list = [];
    deals.forEach((d) => {
      if (d.brand && !list.find((b) => b.id === d.brand.id)) list.push(d.brand);
    });
    return list;
  }, [deals]);

  if (auth.loading || status === "loading") return <LoadingScreen />;
  if (!auth.user) return null;

  return (
    <div className="space-y-4 px-4 py-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Deals</p>
        <h1 className="font-display text-3xl uppercase text-brand-black">Pipeline overview</h1>
      </div>

      <DealsFilters filters={filters} update={update} talents={allTalents} brands={allBrands} />

      {status === "error" ? <p className="text-sm text-brand-red">Unable to load deals.</p> : null}

      <DealsTable deals={deals} />

      <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Deal drafts</p>
            <h2 className="text-lg font-semibold text-brand-black">AI extracted offers</h2>
          </div>
        </div>
        {draftError ? <p className="text-sm text-brand-red">{draftError}</p> : null}
        {drafts.length === 0 ? (
          <p className="text-sm text-brand-black/60">No drafts yet.</p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {drafts.map((draft) => (
              <div key={draft.id} className="rounded-xl border border-brand-black/10 bg-white p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-brand-black">{draft.brand || "Unknown brand"}</h3>
                <p className="text-sm text-brand-black/60">{draft.offerType || "Unspecified offer"}</p>
                <p className="mt-1 text-xs text-brand-black/60">Payment: {draft.paymentAmount ? `${draft.paymentAmount} ${draft.currency || ""}` : "N/A"}</p>
                <p className="text-xs text-brand-black/60">
                  Confidence: {draft.confidence !== null && draft.confidence !== undefined ? `${Math.round(draft.confidence * 100)}%` : "N/A"}
                </p>
                {draft.deliverables ? (
                  <p className="text-sm text-brand-black/80">Deliverables: {Array.isArray(draft.deliverables) ? draft.deliverables.join(", ") : JSON.stringify(draft.deliverables)}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <button className="rounded-full bg-brand-black px-3 py-1 font-semibold uppercase tracking-[0.25em] text-brand-white" type="button">
                    Convert to Deal
                  </button>
                  <button className="rounded-full border border-brand-black px-3 py-1 font-semibold uppercase tracking-[0.25em] text-brand-black" type="button">
                    Open Source Email
                  </button>
                  <button
                    className="rounded-full border border-brand-red px-3 py-1 font-semibold uppercase tracking-[0.25em] text-brand-red"
                    type="button"
                    onClick={() => generate(draft.id).catch(() => undefined)}
                  >
                    Generate Negotiation Insight
                  </button>
                  <button
                    className="rounded-full border border-brand-black px-3 py-1 font-semibold uppercase tracking-[0.25em] text-brand-black"
                    type="button"
                    onClick={() => buildFromDeal(draft.id).catch(() => undefined)}
                  >
                    Build Campaign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
