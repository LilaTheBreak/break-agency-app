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
        <div className="flex flex-col gap-6 text-brand-black/80 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <LogoWordmark variant="dark" className="h-8 w-auto" />
            <p className="font-subtitle text-xs uppercase tracking-[0.3em] text-brand-black/50">
              Premium console for creators, brands, and culture teams.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-3xl border border-brand-black/10 bg-brand-white px-5 py-4 text-sm text-brand-black md:flex-row md:items-center md:gap-4">
            <p className="font-subtitle text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60">Stay in the loop</p>
            <p>ops@thebreak.co · +44 (0)20 1234 5678</p>
          </div>
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
          <p>Operating across NYC · Doha · London · Dubai</p>
        </div>
      </div>
    </footer>
  );
}
