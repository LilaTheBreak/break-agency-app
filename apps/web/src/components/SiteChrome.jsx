import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { LogoWordmark } from "./LogoWordmark.jsx";

export const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/resource-hub", label: "Resource Hub" },
  { to: "/creator", label: "Creators" },
  { to: "/brand", label: "Brands" }
];

export function SiteChrome({ session, onRequestSignIn, onSignOut }) {
  const location = useLocation();
  const isPublicResource = location.pathname.startsWith("/resource-hub");

  if (session) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-brand-white/10 bg-brand-black/95 text-brand-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2" aria-label="The Break Co. home">
          <LogoWordmark variant="light" className="h-8 w-auto" />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "text-xs font-subtitle uppercase tracking-[0.35em] transition",
                  isActive ? "text-brand-white" : "text-brand-white/70 hover:text-brand-white"
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden font-subtitle text-[0.7rem] uppercase tracking-[0.35em] text-brand-white/70 md:inline-flex">
            {isPublicResource ? "Public Surface" : "Platform"}
          </span>
          {session ? (
            <>
              <span className="rounded-full border border-brand-white/30 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-brand-white/90">
                {session.role || "member"}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-full border border-brand-white/30 px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-brand-white hover:bg-brand-white/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onRequestSignIn}
              className="rounded-full bg-brand-red px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-brand-white hover:bg-brand-red/90"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
