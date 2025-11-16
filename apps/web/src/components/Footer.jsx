import React from "react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-brand-black/10 bg-brand-black text-brand-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-brand-white/70 md:flex-row md:items-center md:justify-between">
        <p className="font-subtitle uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} The Break Co.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/resource-hub" className="hover:text-brand-white">
            Resource Hub
          </Link>
          <Link to="/creator" className="hover:text-brand-white">
            Creators
          </Link>
          <Link to="/brand" className="hover:text-brand-white">
            Brands
          </Link>
        </div>
      </div>
    </footer>
  );
}
