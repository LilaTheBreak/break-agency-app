import React from "react";
import { ControlRoomView } from "./ControlRoomView.jsx";
import { CONTROL_ROOM_PRESETS } from "./controlRoomPresets.js";

export function UgcTalentDashboard({ session }) {
  return <ControlRoomView config={CONTROL_ROOM_PRESETS.ugc} session={session} />;
}
