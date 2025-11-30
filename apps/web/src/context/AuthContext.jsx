import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

/**
 * Legacy context note:
 * - The previous implementation stored a fake "session" inside localStorage via `auth/session.js`
 *   and simply injected `x-user-id` / `x-user-roles` headers on every request.
 * - Role gating was simulated in `App.jsx` by reading that local storage session and never talking
 *   to the API.
 * - API base URLs continue to flow through `VITE_API_URL` (see `services/apiClient.js`).
 *
 * This provider replaces that mock setup with a real `/auth/me` fetch, JWT cookies, and the OAuth
 * redirect URLs served by the backend.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/auth/me");
      if (response.status === 401) {
        setUser(null);
        return;
      }
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || "Unable to load session");
      }
      const payload = await response.json();
      setUser(
        payload.user
          ? {
              ...payload.user,
              onboardingStatus: payload.user.onboardingStatus
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load session");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    const response = await apiFetch("/auth/google/url");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.url) {
      const message = payload?.error || "Unable to start Google login";
      setError(message);
      throw new Error(message);
    }
    window.location.assign(payload.url);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Failed to log out", err);
    } finally {
      setUser(null);
    }
  }, []);

  const hasRole = useCallback(
    (...roles) => {
      if (!user?.roles?.length) return false;
      if (!roles.length) return Boolean(user);
      return roles.some((role) => user.roles.includes(role));
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      refreshUser,
      loginWithGoogle,
      logout,
      hasRole
    }),
    [user, loading, error, refreshUser, loginWithGoogle, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
