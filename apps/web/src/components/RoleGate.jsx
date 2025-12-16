import React from "react";
import { NoAccessCard } from "./NoAccessCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export function RoleGate({ allowed = [], description, children }) {
  const { user, loading } = useAuth();

  if (loading && !user) {
    return (
      <NoAccessCard description="Checking your access…" />
    );
  }
  if (!user) {
    return (
      <NoAccessCard
        title="Sign in required"
        description="Please sign in with an authorized account to see this module."
      />
    );
  }
  if (!allowed?.length) return children;
  const userRole = user.role;
  const canAccess = allowed.includes(userRole);
  if (!canAccess) {
    return <NoAccessCard description={description || "You do not have access to this module."} />;
  }
  return children;
}
