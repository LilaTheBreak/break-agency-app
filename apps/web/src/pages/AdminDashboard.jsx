import React from "react";
import { Navigate } from "react-router-dom";
import { ControlRoomView } from "./ControlRoomView.jsx";
import { CONTROL_ROOM_PRESETS } from "./controlRoomPresets.js";
import { AdminAuditTable } from "../components/AdminAuditTable.jsx";
import { AdminActivityFeed } from "../components/AdminActivityFeed.jsx";
import { MultiBrandCampaignCard } from "../components/MultiBrandCampaignCard.jsx";
import PendingUsersApproval from "../components/admin/PendingUsersApproval.jsx";
import { ResourceManager } from "../components/admin/ResourceManager.jsx";
import { useCampaigns } from "../hooks/useCampaigns.js"; // This hook will be wired up later
import { useAuth } from "../context/AuthContext.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";

export function AdminDashboard({ session }) {
  const auth = useAuth();
  const activeSession = session || auth.user;
  if (auth.loading) return <LoadingScreen />;
  if (!activeSession) return <Navigate to="/" replace />;

  return (
    <ControlRoomView
      config={CONTROL_ROOM_PRESETS.admin}
      session={activeSession}
      role={activeSession?.role}
      showStatusSummary
    >
      <PendingUsersApproval />
      <ResourceManager />
      <AdminActivityFeed />
      <AdminCampaignsPanel session={activeSession} />
      <AdminAuditTable />
    </ControlRoomView>
  );
}

function AdminCampaignsPanel({ session }) {
  const isAdmin = session?.role === "ADMIN" || session?.role === "SUPERADMIN";
  const { campaigns, loading, error } = useCampaigns({
    session,
    userId: isAdmin ? "all" : session?.id
  });
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
      ) : campaigns.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
          <p className="text-sm text-brand-black/60">No campaigns yet</p>
          <p className="mt-2 text-xs text-brand-black/40">Campaign data will appear once created</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {campaigns.slice(0, 3).map((campaign) => (
            <MultiBrandCampaignCard key={campaign.id} campaign={campaign} showNotes={false} />
          ))}
        </div>
      )}
    </section>
  );
}
