import React from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { CreatorGoalsSection } from "../components/CreatorGoalsSection.jsx";

export function CreatorGoalsPage({ session }) {
  return (
    <DashboardShell
      title="Goals"
      subtitle="Your goals and context from onboarding"
      role={session?.user?.role}
    >
      <div className="space-y-6">
        <CreatorGoalsSection />
      </div>
    </DashboardShell>
  );
}

export default CreatorGoalsPage;
