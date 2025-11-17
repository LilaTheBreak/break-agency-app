import React from "react";
import { ControlRoomView } from "./ControlRoomView.jsx";
import { CONTROL_ROOM_PRESETS } from "./controlRoomPresets.js";

export function FounderDashboard() {
  return <ControlRoomView config={CONTROL_ROOM_PRESETS.founder} />;
}
