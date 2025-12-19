import React from "react";
import { ControlRoomView } from "./ControlRoomView.jsx";
import { CONTROL_ROOM_PRESETS } from "./controlRoomPresets.js";
import { OnboardingSnapshot } from "../components/OnboardingSnapshot.jsx";
import { useCrmOnboarding } from "../hooks/useCrmOnboarding.js";
import { useAuth } from "../context/AuthContext.jsx";
import { CrmContactPanel } from "../components/CrmContactPanel.jsx";
import { getContact } from "../lib/crmContacts.js";

export function FounderDashboard({ session }) {
  const { user } = useAuth();
  const onboarding = useCrmOnboarding(session?.email || user?.email);
  const contact = getContact(session?.email || user?.email);
  return (
    <ControlRoomView config={CONTROL_ROOM_PRESETS.founder} session={session}>
      <OnboardingSnapshot data={onboarding} role="FOUNDER" heading="Onboarding → CRM" />
      <CrmContactPanel contact={contact} heading="CRM contact" />
    </ControlRoomView>
  );
}
