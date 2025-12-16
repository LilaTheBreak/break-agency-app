import React from "react";
import { ProfilePage } from "./ProfilePage.jsx";

export default function AdminProfilePage({ session }) {
  return <ProfilePage session={session} variant="admin" />;
}
