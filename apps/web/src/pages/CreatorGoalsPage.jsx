import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { CreatorGoalsSection } from "../components/CreatorGoalsSection.jsx";
import { CONTROL_ROOM_PRESETS } from "./controlRoomPresets.js";

export function CreatorGoalsPage({ session }) {
  const config = CONTROL_ROOM_PRESETS.talent;
  const navLinks = config.tabs || [];

  return (
    <DashboardShell
      title="Goals"
      subtitle="Your goals and context from onboarding"
      role={session?.user?.role}
      navLinks={navLinks}
      session={session}
    >
      <div className="space-y-6">
        <CreatorGoalsSection />
      </div>
    </DashboardShell>
  );
}

export default CreatorGoalsPage;
