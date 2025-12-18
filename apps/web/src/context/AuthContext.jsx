import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/apiClient.js";
import { getCurrentUser, login as loginWithEmailClient, signup as signupWithEmailClient } from "../services/authClient.js";
import { deriveOnboardingStatus } from "../lib/onboardingState.js";

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
      const response = await getCurrentUser();
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
              onboardingStatus: deriveOnboardingStatus(payload.user)
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
    console.log("Fetching Google OAuth URL...");
    const response = await apiFetch("/auth/google/url");
    console.log("Response status:", response.status);
    const payload = await response.json().catch(() => ({}));
    console.log("Payload:", payload);
    if (!response.ok || !payload.url) {
      const message = payload?.error || "Unable to start Google login";
      console.error("OAuth URL error:", message);
      setError(message);
      throw new Error(message);
    }
    console.log("Redirecting to:", payload.url);
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

  const loginWithEmail = useCallback(
    async (email, password) => {
      setError(null);
      const response = await loginWithEmailClient(email, password);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error || "Unable to log in";
        throw new Error(message);
      }
      const payload = await response.json();
      const loggedInUser = payload.user || null;
      const normalizedUser = loggedInUser
        ? { ...loggedInUser, onboardingStatus: deriveOnboardingStatus(loggedInUser) }
        : null;
      setUser(normalizedUser);
      return normalizedUser;
    },
    []
  );

  const signupWithEmail = useCallback(
    async (email, password, role) => {
      setError(null);
      const response = await signupWithEmailClient(email, password, role);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error || "Unable to sign up";
        const err = new Error(message);
        err.code = payload?.code || response.status;
        throw err;
      }
      await refreshUser();
    },
    [refreshUser]
  );

  const syncOnboardingFromLocal = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, onboardingStatus: deriveOnboardingStatus(prev) };
    });
  }, []);

  const hasRole = useCallback(
    (...roles) => {
      if (!user?.role) return false;
      if (!roles.length) return Boolean(user);
      return roles.includes(user.role);
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
      loginWithEmail,
      signupWithEmail,
      logout,
      hasRole,
      syncOnboardingFromLocal
    }),
    [user, loading, error, refreshUser, loginWithGoogle, loginWithEmail, signupWithEmail, logout, hasRole, syncOnboardingFromLocal]
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
