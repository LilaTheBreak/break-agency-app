import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function GoogleSignIn({ open, onClose }) {
  const { loginWithGoogle, loginWithEmail, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleLogin = () => {
    loginWithGoogle().catch(() => {});
  };

  const getRoleBasedRedirect = (userRole) => {
    if (userRole === "ADMIN" || userRole === "SUPERADMIN") {
      return "/admin/dashboard";
    }
    if (userRole === "BRAND" || userRole === "FOUNDER") {
      return "/brand/dashboard";
    }
    if (userRole === "CREATOR" || userRole === "EXCLUSIVE_TALENT" || userRole === "UGC") {
      return "/creator/dashboard";
    }
    if (userRole === "AGENT") {
      return "/admin/dashboard";
    }
    return "/dashboard";
  };

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setFormError("");
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const loggedInUser = await loginWithEmail(normalizedEmail, password);
      setEmail("");
      setPassword("");
      if (onClose) onClose();
      
      // Redirect based on user role
      const redirectPath = getRoleBasedRedirect(loggedInUser?.role);
      navigate(redirectPath);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-brand-black/70 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-in-heading"
    >
      <div className="relative w-full max-w-lg rounded-[34px] border border-brand-black/10 bg-brand-white p-6 text-brand-black shadow-[0_30px_90px_rgba(0,0,0,0.35)]" style={{ backgroundColor: '#ffffff', opacity: 1 }}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full text-brand-black/40 transition hover:bg-brand-black/5 hover:text-brand-black"
          aria-label="Close dialog"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="space-y-2">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-red">Secure access</p>
          <h3 id="sign-in-heading" className="text-2xl font-semibold">
            Sign in to The Break Console
          </h3>
          <p className="text-sm text-brand-black/70">
            You&apos;ll be redirected to Google to verify your identity. After authenticating, you&apos;ll return
            here with secure console access.
          </p>
        </div>
        {error ? <p className="mt-4 text-sm text-brand-red">{error}</p> : null}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleLogin}
            className="inline-flex items-center justify-center rounded-full bg-brand-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-brand-white transition hover:bg-brand-red/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
          >
            Continue with Google
          </button>
          <div className="flex items-center justify-center gap-3 text-[0.65rem] uppercase text-brand-black/60">
            <span className="h-px flex-1 bg-brand-black/10" />
            <span>or</span>
            <span className="h-px flex-1 bg-brand-black/10" />
          </div>
          <form className="space-y-3" onSubmit={handleEmailLogin}>
            <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-2xl border border-brand-black/10 bg-brand-white/90 px-4 py-3 text-sm text-brand-black focus:border-brand-red focus:outline-none"
            />
            <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-2xl border border-brand-black/10 bg-brand-white/90 px-4 py-3 text-sm text-brand-black focus:border-brand-red focus:outline-none"
            />
            <label className="flex items-center gap-2 text-xs text-brand-black/70 cursor-pointer">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded border-brand-black/20"
              />
              Show password
            </label>
            {formError ? <p className="text-sm text-brand-red">{formError}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="relative inline-flex items-center justify-center rounded-full bg-brand-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-brand-white transition hover:bg-brand-red/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-wait disabled:bg-brand-black/60"
            >
              {loading ? "Signing in..." : "Log in"}
            </button>
          </form>
          <p className="text-center text-xs text-brand-black/60">
            Don't have an account?{" "}
            <Link to="/signup" onClick={onClose} className="font-semibold text-brand-red">
              Sign up
            </Link>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-brand-black/60 transition hover:text-brand-black/90"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
