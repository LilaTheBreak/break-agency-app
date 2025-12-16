import React from "react";
import { ProfilePage } from "./ProfilePage.jsx";

export default function ExclusiveTalentProfilePage({ session }) {
  return <ProfilePage session={session} variant="exclusive" />;
}
