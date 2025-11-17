import React from "react";
import { NoAccessCard } from "./NoAccessCard.jsx";

export function RoleGate({ session, allowed, description, children }) {
  if (!session) {
    return (
      <NoAccessCard
        title="Sign in required"
        description="Please sign in with an authorized account to see this module."
      />
    );
  }
  const canAccess = session.roles?.some((role) => allowed.includes(role));
  if (!canAccess) {
    return <NoAccessCard description={description || "You do not have access to this module."} />;
  }
  return children;
}
