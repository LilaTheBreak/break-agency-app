import React from "react";
import { NoAccessCard } from "./NoAccessCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export function RoleGate({ session: providedSession, allowed = [], description, children }) {
  const { user, loading } = useAuth();
  const session = providedSession ?? user;

  if (loading && !session) {
    return (
      <NoAccessCard description="Checking your access…" />
    );
  }
  if (!session) {
    return (
      <NoAccessCard
        title="Sign in required"
        description="Please sign in with an authorized account to see this module."
      />
    );
  }
  if (!allowed?.length) return children;
  const canAccess = session.roles?.some((role) => allowed.includes(role));
  if (!canAccess) {
    return <NoAccessCard description={description || "You do not have access to this module."} />;
  }
  return children;
}
