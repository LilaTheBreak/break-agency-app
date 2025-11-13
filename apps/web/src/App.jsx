import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useLocation,
  Navigate
} from "react-router-dom";
import { Analytics } from "@vercel/analytics/next";

import GoogleSignIn from "./auth/GoogleSignIn.jsx";
import { Roles, SESSION_CHANGED_EVENT, clearSession, getSession } from "./auth/session.js";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/resource-hub", label: "Resource Hub" },
  { to: "/creator", label: "Creators" },
  { to: "/brand", label: "Brands" }
];

const RESOURCE_ITEMS = [
  {
    title: "AI-Native Brief Builder",
    type: "Template",
    audience: "Everyone",
    description: "Framings to scope influencer or UGC campaigns in minutes.",
    cta: "Download",
    category: "Templates"
  },
  {
    title: "Dubai & London Launch Playbook",
    type: "Guide",
    audience: "Brands",
    description: "Regional talent fees, shoot logistics, and compliance guardrails.",
    cta: "Read guide",
    category: "Articles"
  },
  {
    title: "Creator CFO Toolkit",
    type: "Digital Product",
    audience: "Creators",
    description: "Notion finance HQ + rate calculator used by Break Agency talent.",
    cta: "Purchase",
    category: "Digital Product"
  },
  {
    title: "Inbox Zero for Talent Managers",
    type: "Checklist",
    audience: "Managers",
    description: "Weekly operating rhythm for campaigns, comms, invoices.",
    cta: "Copy checklist",
    category: "Checklists"
  },
  {
    title: "Pitch Clinic: Case Studies Library",
    type: "Webinar",
    audience: "Everyone",
    description: "Live walk-through of 3 partnership wins with Q&A.",
    cta: "Register",
    category: "Webinars"
  }
];

const UGC_BRIEFS = [
  {
    id: "ugc-1",
    title: "Luxury Resort Staycation Reels",
    brand: "Atlantis The Royal",
    budget: "AED 18k – AED 24k",
    deliverables: ["3x Reels", "1x TikTok", "Stills"],
    deadline: "10 Feb",
    region: "Dubai only",
    status: "Open",
    access: "priority"
  },
  {
    id: "ugc-2",
    title: "Gulf-Air Creator Concierge",
    brand: "Gulf Air",
    budget: "£6k flat",
    deliverables: ["Mini vlog", "Stories pack"],
    deadline: "22 Feb",
    region: "London + Doha",
    status: "Shortlisting",
    access: "priority"
  },
  {
    id: "ugc-3",
    title: "AI Productivity Stack Features",
    brand: "Notion x Break",
    budget: "Revenue share",
    deliverables: ["Guide", "Newsletter placement"],
    deadline: "Rolling",
    region: "Remote",
    status: "Always-on",
    access: "public"
  }
];

const CREATOR_METRICS = [
  { label: "Active campaigns", value: "4", delta: "+2 vs last month" },
  { label: "Projected revenue", value: "£28.4k", delta: "Includes paid media uplift" },
  { label: "UGC priority slots", value: "3", delta: "1 reserved for AI SaaS" },
  { label: "Brief response SLA", value: "3h avg", delta: "Goal under 4h" }
];

const BRAND_CAMPAIGNS = [
  {
    id: "cmp-1",
    name: "Creator Residency · Q2",
    status: "Live sprint",
    stage: "Deliverables",
    reach: "12.4M",
    creators: 8,
    owner: "Mo Al Ghazi"
  },
  {
    id: "cmp-2",
    name: "UGC Bank · Always-On",
    status: "Briefing",
    stage: "Shortlisting",
    reach: "—",
    creators: 24,
    owner: "Break Studio"
  },
  {
    id: "cmp-3",
    name: "Creator Match Pilot (AI)",
    status: "Discovery",
    stage: "Needs analysis",
    reach: "Target 6M",
    creators: 0,
    owner: "Automation Pod"
  }
];

const QUESTIONNAIRES = [
  {
    title: "Brand Needs Finder",
    summary: "Creates a scoped brief, budget rails, and onboarding link.",
    cta: "Start questionnaire",
    route: "/brand?questionnaire=needs"
  },
  {
    title: "Creator Readiness Check",
    summary: "Audits socials, usage rights readiness, and consent.",
    cta: "Take readiness check",
    route: "/creator?questionnaire=readiness"
  }
];

function useCurrentSession() {
  const [session, setSession] = useState(() => getSession());
  useEffect(() => {
    const handler = () => setSession(getSession());
    window.addEventListener(SESSION_CHANGED_EVENT, handler);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, handler);
  }, []);
  return session;
}

function App() {
  const session = useCurrentSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleSignOut = () => {
    clearSession();
  };

  return (
    <BrowserRouter>
      <SiteChrome
        session={session}
        onRequestSignIn={() => setAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />
      <Routes>
        <Route path="/" element={<LandingPage onRequestSignIn={() => setAuthModalOpen(true)} />} />
        <Route path="/resource-hub" element={<ResourceHubPage />} />
        <Route
          path="/creator"
          element={<CreatorEntryPage onRequestSignIn={() => setAuthModalOpen(true)} />}
        />
        <Route
          path="/brand"
          element={<BrandEntryPage onRequestSignIn={() => setAuthModalOpen(true)} />}
        />
        <Route
          path="/creator/dashboard"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.CREATOR, Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <CreatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brand/dashboard"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.BRAND, Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <BrandDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      <GoogleSignIn
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSignedIn={() => setAuthModalOpen(false)}
        allowedDomain={null}
      />
      <Analytics />
    </BrowserRouter>
  );
}

function SiteChrome({ session, onRequestSignIn, onSignOut }) {
  const location = useLocation();
  const isPublicResource = location.pathname.startsWith("/resource-hub");

  return (
    <header className="bg-black text-white sticky top-0 z-30 shadow-xl shadow-black/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-semibold tracking-wide uppercase">
          Break Agency
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "text-sm uppercase tracking-[0.3em] transition hover:text-emerald-200",
                  isActive ? "text-emerald-200" : "text-white/70"
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-white/70 md:inline-flex">
            {isPublicResource ? "Public Surface" : "Platform"}
          </span>
          {session ? (
            <>
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/80">
                {session.roles?.[0] || "member"}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white hover:bg-white/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onRequestSignIn}
              className="rounded-full bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-emerald-200"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function LandingPage({ onRequestSignIn }) {
  return (
    <div className="bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 lg:flex-row">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">Dubai · London</p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              The operating system for creators, talent managers, and brands that ship UGC at scale.
            </h1>
            <p className="text-lg text-white/70">
              Break Agency merges AI deal support, compliant onboarding, and a public resource hub so
              both sides of the marketplace stay in sync. No property listings, just campaigns.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/creator"
                className="rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-black hover:bg-emerald-200"
              >
                I am a Creator/Talent
              </Link>
              <Link
                to="/brand"
                className="rounded-full border border-white/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-white/10"
              >
                I am a Brand
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-white/60">
              <div>
                <p className="text-2xl font-semibold text-white">450+</p>
                <p>Creators vetted across 18 markets.</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">120+</p>
                <p>Brand campaigns shipped in 12 months.</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">UGC board</p>
                <p>Visible publicly, apply after login.</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-lg font-semibold">Wireflow overview</h3>
            <ol className="mt-4 space-y-3 text-sm text-white/70">
              <li>Public: Home → Case studies → Resource Hub → Level-one Split.</li>
              <li>Creators: View UGC board, submit profile, access dashboards once approved.</li>
              <li>Brands: Complete needs questionnaire, create campaign brief, manage creators.</li>
              <li>Permissions: Resource Hub stays public, UGC is creator-only, campaigns brand-only.</li>
            </ol>
            <button
              type="button"
              onClick={onRequestSignIn}
              className="mt-6 w-full rounded-2xl bg-emerald-400/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-emerald-300"
            >
              Launch console
            </button>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-black/40">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-10 md:grid-cols-3">
          {QUESTIONNAIRES.map((form) => (
            <div key={form.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Questionnaire</p>
              <h3 className="mt-3 text-xl font-semibold">{form.title}</h3>
              <p className="mt-2 text-sm text-white/70">{form.summary}</p>
              <Link
                to={form.route}
                className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200"
              >
                {form.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16 md:flex-row md:items-center">
          <div className="flex-1 space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Case studies</p>
            <h2 className="text-3xl font-semibold">Dubai hospitality · London fintech · Hybrid retail.</h2>
            <p className="text-white/70">
              We publish anonymised case studies inside the Resource Hub so both brands and creators
              see what high-performing collaborations look like before logging in.
            </p>
          </div>
          <div className="flex flex-1 gap-4">
            <div className="flex-1 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Hospitality</p>
              <h3 className="mt-2 text-lg font-semibold">UGC pipeline for GCC luxury stays.</h3>
              <p className="mt-2 text-sm text-white/70">41 briefs → 10 hero edits → 18 days.</p>
            </div>
            <div className="flex-1 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Fintech</p>
              <h3 className="mt-2 text-lg font-semibold">Creator Match for AI finance app.</h3>
              <p className="mt-2 text-sm text-white/70">7 creators • £320 CPA • 4-country rollout.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ResourceHubPage() {
  const categories = useMemo(() => {
    const map = new Map();
    for (const item of RESOURCE_ITEMS) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <div className="bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Resource hub</p>
          <h1 className="text-3xl font-semibold">Public intel, no login required.</h1>
          <p className="text-white/70">
            Articles, templates, digital products, and webinars curated for both sides of the
            marketplace. Spellcheck and QA baked into every onboarding doc.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12 space-y-10">
        {categories.map(([category, items]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{category}</h2>
              <span className="text-xs uppercase tracking-[0.35em] text-white/50">Public</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item) => (
                <article key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{item.type}</span>
                    <span>{item.audience}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-white/70">{item.description}</p>
                  <button className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200">
                    {item.cta} →
                  </button>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function CreatorEntryPage({ onRequestSignIn }) {
  return (
    <div className="bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Creator pathway</p>
          <h1 className="text-3xl font-semibold">View UGC briefs, create your profile, join campaigns.</h1>
          <p className="text-white/70">
            Visitors can browse the opportunities board. Applying requires a Break profile and
            consent-backed onboarding. Approved creators unlock dashboards, AI co-pilots, and revenue
            tools.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRequestSignIn}
              className="rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-emerald-200"
            >
              Create profile
            </button>
            <a
              href="#ugc-board"
              className="rounded-full border border-white/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/10"
            >
              Browse UGC board
            </a>
          </div>
        </div>
      </section>
      <section id="ugc-board" className="mx-auto max-w-6xl px-6 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">UGC Opportunities</h2>
          <Badge>Visible to all · Apply requires login</Badge>
        </div>
        <UgcBoard canApply={false} />
      </section>
      <section className="border-t border-white/10 bg-white/5">
        <div className="mx-auto max-w-6xl px-6 py-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/60 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Onboarding</p>
            <h3 className="mt-3 text-lg font-semibold">Profile creation</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>• Personal info, social handles, performance screenshots.</li>
              <li>• Rates, exclusivity preferences, usage rights consent.</li>
              <li>• Optional vetting (portfolio review + reference check).</li>
              <li>• Spellchecked outputs automatically.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/60 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Dashboard unlocks</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>• Performance & metrics (platform APIs).</li>
              <li>• AI agent for deals, reminders, rate guidance.</li>
              <li>• Content calendar, tasks, and files.</li>
              <li>• UGC board with autofill + priority briefs.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function BrandEntryPage({ onRequestSignIn }) {
  return (
    <div className="bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Brand pathway</p>
          <h1 className="text-3xl font-semibold">Campaign creation, creator match, contracts, reporting.</h1>
          <p className="text-white/70">
            Brands can browse public case studies, complete the needs questionnaire, and then unlock
            the dashboard to manage campaigns. UGC boards stay creator-side only.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRequestSignIn}
              className="rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-emerald-200"
            >
              Create brand profile
            </button>
            <Link
              to="/resource-hub"
              className="rounded-full border border-white/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/10"
            >
              Review case studies
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12 space-y-4">
        <h2 className="text-2xl font-semibold">Brand dashboard navigation</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {["Dashboard", "Campaigns", "Creator Match", "Reports", "Messages", "Account"].map(
            (item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold">{item}</p>
                <p className="mt-2 text-xs text-white/60">
                  {item === "Campaigns"
                    ? "Plan, brief, and track campaigns end-to-end."
                    : item === "Creator Match"
                    ? "AI-assisted recommendations with shortlist exports."
                    : item === "Reports"
                    ? "Reach, engagement, conversions, spend."
                    : item === "Messages"
                    ? "Threaded comms + files with creators."
                    : item === "Account"
                    ? "Billing, permissions, notification policies."
                    : "Pulse of briefs, alerts, and upcoming milestones."}
                </p>
              </div>
            )
          )}
        </div>
      </section>
      <section className="border-t border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-4">
          <h3 className="text-xl font-semibold">Brand Needs Questionnaire</h3>
          <p className="text-white/70">
            Qualifies scope, budget, and readiness; prompts profile creation to proceed. Campaign
            creation stays brand-only, UGC routing happens automatically to approved creators.
          </p>
          <button
            type="button"
            onClick={onRequestSignIn}
            className="rounded-full bg-emerald-400/80 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-black hover:bg-emerald-300"
          >
            Launch questionnaire
          </button>
        </div>
      </section>
    </div>
  );
}

function CreatorDashboard() {
  return (
    <DashboardShell
      title="Creator Dashboard"
      subtitle="Performance, AI deal support, calendars, revenue tools, and priority UGC briefs."
      navigation={["Dashboard", "Campaigns & Deals", "UGC Opportunities", "Messages", "Account"]}
    >
      <section className="grid gap-4 md:grid-cols-2">
        {CREATOR_METRICS.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
            <p className="text-xs text-emerald-200">{metric.delta}</p>
          </div>
        ))}
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify_between">
*** End Patch
