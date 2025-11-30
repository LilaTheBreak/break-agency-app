import React, { createContext, useContext } from "react";
import { useInbox } from "../hooks/useInbox";

const InboxContext = createContext(null);

/**
 * Provider component that wraps the part of your app that needs access to the inbox state.
 */
export function InboxProvider({ children }) {
  const inbox = useInbox();
  return (
    <InboxContext.Provider value={inbox}>{children}</InboxContext.Provider>
  );
}

/**
 * Custom hook to use the inbox context.
 * @returns The inbox context value (state and setters).
 */
export function useInboxContext() {
  const context = useContext(InboxContext);
  if (!context) {
    throw new Error("useInboxContext must be used within an InboxProvider");
  }
  return context;
}