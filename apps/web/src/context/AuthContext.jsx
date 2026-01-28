import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/apiClient.js";
import { getCurrentUser, login as loginWithEmailClient, signup as signupWithEmailClient } from "../services/authClient.js";
import { deriveOnboardingStatus } from "../lib/onboardingState.js";
import { setSentryUser, setSentryTags } from "../lib/sentry.js";

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
      
      // Handle expected status codes gracefully
      if (response.status === 401 || response.status === 403) {
        // Not authenticated - this is normal, not an error
        setUser(null);
        return;
      }
      
      if (!response.ok) {
        // Only throw error for unexpected status codes
        const text = await response.text().catch(() => "");
        const errorMsg = text || `Unable to load session (${response.status})`;
        console.warn("[AUTH] Failed to load user:", errorMsg);
        setUser(null);
        // Don't set error for auth failures - they're expected
        return;
      }
      
      const payload = await response.json();
      const newUser = payload.user
        ? {
            ...payload.user,
            onboardingStatus: deriveOnboardingStatus(payload.user)
          }
        : null;
      setUser(newUser);
      
      // Update Sentry user context
      if (newUser) {
        setSentryUser({ id: newUser.id, role: newUser.role });
        setSentryTags({ role: newUser.role || "unknown" });
      } else {
        setSentryUser(null);
      }
    } catch (err) {
      // Network errors or JSON parsing errors
      console.warn("[AUTH] Error loading user:", err);
      setUser(null);
      // Only set error for actual network failures, not auth failures
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError("Unable to connect to server. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for token in URL (from OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      // Store token in localStorage for cross-domain auth
      localStorage.setItem('auth_token', tokenFromUrl);
      
      // Clean up URL
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
    
    refreshUser();
  }, [refreshUser]);

  const loginWithGoogle = useCallback(async (role) => {
    setError(null);
    console.log("Fetching Google OAuth URL...", role ? `with role: ${role}` : "(no role)");
    // Include role as query parameter if provided (for signup flow)
    const url = role ? `/api/auth/google/url?role=${encodeURIComponent(role)}` : "/api/auth/google/url";
    const response = await apiFetch(url);
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
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Failed to log out", err);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
      // Clear Sentry user context on logout
      setSentryUser(null);
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
      
      // Store token for cross-domain auth
      if (payload.token) {
        localStorage.setItem('auth_token', payload.token);
      }
      
      const loggedInUser = payload.user || null;
      const normalizedUser = loggedInUser
        ? { ...loggedInUser, onboardingStatus: deriveOnboardingStatus(loggedInUser) }
        : null;
      setUser(normalizedUser);
      
      // Update Sentry user context
      if (normalizedUser) {
        setSentryUser({ id: normalizedUser.id, role: normalizedUser.role });
        setSentryTags({ role: normalizedUser.role || "unknown" });
      }
      
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
      
      // Store token for cross-domain auth
      const payload = await response.json();
      if (payload.token) {
        localStorage.setItem('auth_token', payload.token);
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
