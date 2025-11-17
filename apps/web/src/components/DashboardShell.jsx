import React from "react";
import { Link, useLocation } from "react-router-dom";

export function DashboardShell({ title, subtitle, navigation, navLinks = [], children }) {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-brand-ivory text-brand-black">
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-6">
        <div className="space-y-3">
          <p className="font-subtitle text-xs uppercase tracking-[0.4em] text-brand-red">
            Secure console
          </p>
          <h1 className="font-display text-4xl uppercase tracking-wide text-brand-black">
            <span className="inline-flex h-1 w-12 rounded-full bg-brand-red align-middle" />
            <span className="ml-3">{title}</span>
          </h1>
          <p className="text-base text-brand-black/70">{subtitle}</p>
        </div>
        {navLinks.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-full border px-4 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.3em] ${
                  location.pathname === link.to
                    ? "border-brand-red bg-brand-red text-brand-white"
                    : "border-brand-black/20 hover:bg-brand-black/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(navigation || []).map((item) => {
              if (item && typeof item === "object" && item.anchor) {
                return (
                  <a
                    key={item.anchor}
                    href={item.anchor}
                    className="rounded-full border border-brand-black/20 px-4 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.25em] hover:bg-brand-black/5"
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <span
                  key={item}
                  className="rounded-full border border-brand-black/20 px-4 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.25em]"
                >
                  {item}
                </span>
              );
            })}
          </div>
        )}
        <div className="rounded-billboard border border-brand-black/10 bg-brand-white/70 p-6 shadow-brand">
          {children}
        </div>
      </div>
    </div>
  );
}
