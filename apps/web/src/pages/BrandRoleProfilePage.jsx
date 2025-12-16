import React from "react";
import { ProfilePage } from "./ProfilePage.jsx";

export default function BrandRoleProfilePage({ session }) {
  return <ProfilePage session={session} variant="brand" />;
}
