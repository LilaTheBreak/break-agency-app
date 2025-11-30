import React from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function GoogleSignIn({ open, onClose }) {
  const { loginWithGoogle, error } = useAuth();

  if (!open) return null;

  const handleLogin = () => {
    loginWithGoogle().catch(() => {});
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-brand-black/70 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-in-heading"
    >
      <div className="w-full max-w-lg rounded-[34px] border border-brand-black/10 bg-brand-white/95 p-6 text-brand-black shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
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
