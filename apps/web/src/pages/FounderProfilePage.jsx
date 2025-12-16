import React from "react";
import { ProfilePage } from "./ProfilePage.jsx";

export default function FounderProfilePage({ session }) {
  return <ProfilePage session={session} variant="founder" />;
}
