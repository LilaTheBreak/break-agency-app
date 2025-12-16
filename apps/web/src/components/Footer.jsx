import React from "react";
import { Link } from "react-router-dom";
import { LogoWordmark } from "./LogoWordmark.jsx";

const NAV_LINKS = [
  {
    heading: "Platform",
    links: [
      { to: "/creator", label: "Creators" },
      { to: "/brand", label: "Brands" },
      { to: "/resource-hub", label: "Resource hub" }
    ]
  },
  {
    heading: "Company",
    links: [
      { to: "/about", label: "About Break" },
      { to: "/careers", label: "Careers" },
      { to: "/press", label: "Press" }
    ]
  },
  {
    heading: "Support",
    links: [
      { to: "/help", label: "Help center" },
      { to: "/contact", label: "Contact" },
      { to: "/legal", label: "Legal + privacy" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="border-t border-brand-black/10 bg-brand-linen/60 text-brand-black">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-14">
        <div className="flex flex-col items-center gap-3 text-center text-brand-black/80">
          <LogoWordmark variant="dark" className="h-8 w-auto" />
          <p className="font-subtitle text-xs uppercase tracking-[0.3em] text-brand-black/50">
            Premium console for creators, brands, and culture teams.
          </p>
        </div>

        <div className="grid gap-8 text-sm text-brand-black/70 md:grid-cols-4">
          {NAV_LINKS.map((section) => (
            <div key={section.heading} className="space-y-3">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{section.heading}</p>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="transition hover:text-brand-black">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="space-y-3">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Console</p>
            <p className="text-sm text-brand-black/60">Log in to manage programs, approvals, and AI copilots.</p>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.35em] text-brand-black transition hover:bg-brand-white"
            >
              Launch console
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 border-t border-brand-black/10 pt-6 text-xs text-brand-black/60 md:flex-row md:items-center md:justify-between">
          <p className="font-subtitle uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} The Break Co.
          </p>
          <div className="space-y-1 text-[0.75rem]">
            <p>Operating across NYC · Doha · London · Dubai</p>
            <p>Break is a creator management and influencer marketing platform connecting brands with the right creators.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
