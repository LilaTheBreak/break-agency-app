import React from "react";

export function ProtectedRoute({ session, allowed, onRequestSignIn, children }) {
  if (!session) {
    return (
      <Gate
        title="Sign in required"
        description="Creators and brands need a Break account to access this surface."
        actionLabel="Sign in"
        onAction={onRequestSignIn}
      />
    );
  }

  const canAccess = session.roles?.some((role) => allowed.includes(role));
  if (!canAccess) {
    return (
      <Gate
        title="Permission denied"
        description="Your role cannot access this view. Contact ops to update permissions."
      />
    );
  }

  return children;
}

function Gate({ title, description, actionLabel, onAction }) {
  return (
    <div className="grid min-h-[60vh] place-items-center bg-brand-black px-6 text-center text-brand-white">
      <div className="max-w-lg space-y-4 rounded-3xl border border-brand-white/10 bg-brand-black/40 p-8">
        <h2 className="font-display text-3xl uppercase tracking-wide">{title}</h2>
        <p className="text-brand-white/70">{description}</p>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="rounded-full bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-white hover:bg-brand-red/90"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
