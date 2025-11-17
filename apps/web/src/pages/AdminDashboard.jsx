import React from "react";
import { ControlRoomView } from "./ControlRoomView.jsx";
import { CONTROL_ROOM_PRESETS } from "./controlRoomPresets.js";
import { AdminAuditTable } from "../components/AdminAuditTable.jsx";
import { AdminActivityFeed } from "../components/AdminActivityFeed.jsx";
import { MultiBrandCampaignCard } from "../components/MultiBrandCampaignCard.jsx";
import { useCampaigns } from "../hooks/useCampaigns.js";
import { FALLBACK_CAMPAIGNS } from "../data/campaignsFallback.js";

export function AdminDashboard({ session }) {
  return (
    <ControlRoomView config={CONTROL_ROOM_PRESETS.admin} session={session}>
      <AdminActivityFeed />
      <AdminCampaignsPanel session={session} />
      <AdminAuditTable />
    </ControlRoomView>
  );
}

function AdminCampaignsPanel({ session }) {
  const { campaigns, loading, error } = useCampaigns({
    session,
    userId: session?.roles?.includes("admin") ? "all" : session?.email
  });
  const data = campaigns.length ? campaigns : FALLBACK_CAMPAIGNS;
  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Multi-brand overview</p>
          <h3 className="font-display text-3xl uppercase">Campaign performance</h3>
        </div>
      </div>
      {error ? <p className="text-sm text-brand-red">{error}</p> : null}
      {loading && !campaigns.length ? (
        <p className="text-sm text-brand-black/60">Loading campaigns…</p>
      ) : (
        <div className="mt-4 space-y-4">
          {data.slice(0, 3).map((campaign) => (
            <MultiBrandCampaignCard key={campaign.id} campaign={campaign} showNotes={false} />
          ))}
        </div>
      )}
    </section>
  );
}
