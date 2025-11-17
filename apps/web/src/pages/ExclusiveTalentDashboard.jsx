import React from "react";
import { ControlRoomView } from "./ControlRoomView.jsx";
import { CONTROL_ROOM_PRESETS } from "./controlRoomPresets.js";
import { ExclusiveSocialPanel } from "./ExclusiveSocialPanel.jsx";

export function ExclusiveTalentDashboard() {
  return (
    <ControlRoomView config={CONTROL_ROOM_PRESETS.exclusive}>
      <ExclusiveSocialPanel />
    </ControlRoomView>
  );
}
