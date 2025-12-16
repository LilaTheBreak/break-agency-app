import React from "react";
import { ProfilePage } from "./ProfilePage.jsx";

export default function UgcProfilePage({ session }) {
  return <ProfilePage session={session} variant="ugc" />;
}
