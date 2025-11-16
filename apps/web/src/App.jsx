import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useLocation,
  useNavigate,
  Navigate
} from "react-router-dom";
import GoogleSignIn from "./auth/GoogleSignIn.jsx";
import { Roles, SESSION_CHANGED_EVENT, clearSession, getSession } from "./auth/session.js";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { Footer } from "./components/Footer.jsx";
import { Badge } from "./components/Badge.jsx";
import { UgcBoard } from "./components/UgcBoard.jsx";
import { DashboardShell } from "./components/DashboardShell.jsx";
import { resourceItems as RESOURCE_ITEMS, questionnaires as QUESTIONNAIRES } from "./data/platform.js";
import { BrandDashboard } from "./pages/BrandDashboard.jsx";
import { CreatorDashboard } from "./pages/CreatorDashboard.jsx";
import { AdminDashboard } from "./pages/AdminDashboard.jsx";
import { ExclusiveTalentDashboard } from "./pages/ExclusiveTalentDashboard.jsx";
import { UgcTalentDashboard } from "./pages/UgcTalentDashboard.jsx";
import { OtherUsersDashboard } from "./pages/OtherUsersDashboard.jsx";
import { AdminQueuesPage } from "./pages/AdminQueuesPage.jsx";
import { AdminApprovalsPage } from "./pages/AdminApprovalsPage.jsx";
import { AdminUsersPage } from "./pages/AdminUsersPage.jsx";
import { AdminMessagingPage } from "./pages/AdminMessagingPage.jsx";
import { AdminFinancePage } from "./pages/AdminFinancePage.jsx";
import { AdminSettingsPage } from "./pages/AdminSettingsPage.jsx";
import { AdminUserFeedPage } from "./pages/AdminUserFeedPage.jsx";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/resource-hub", label: "Resource Hub" },
  { to: "/creator", label: "Creators" },
  { to: "/brand", label: "Brands" },
  { to: "#contact", label: "Contact" }
];

const CREATOR_PANELS = [
  {
    badge: "Representation + Concierge",
    title: "Exclusive Talent",
    bullets: [
      "Hands-on management & campaign sourcing.",
      "Brand partnerships spanning fashion, beauty, finance, and travel.",
      "Full-service deal flow, invoicing, and compliance."
    ],
    cta: "Apply for roster"
  },
  {
    badge: "Briefs + Education",
    title: "UGC Creator",
    bullets: [
      "Access to public UGC opportunities & AI prep tools.",
      "Content calendar, deliverable tracker, and template library.",
      "Upgrade to concierge once minimum paces are met."
    ],
    cta: "Join the UGC board"
  }
];

const RESOURCE_PANELS = [
  {
    title: "Creator partnerships",
    description:
      "Handpicked rosters, compliant onboarding, and talent strategy that respects culture and commerce."
  },
  {
    title: "Brand activations",
    description: "From hero UGC to experiential pop-ups, we bridge on- and offline to keep audiences immersed."
  },
  {
    title: "Intelligence layer",
    description: "Live performance dashboards, campaign retros, and resource hub playbooks open to both sides."
  }
];

const CASE_STUDIES = [
  {
    label: "Hospitality",
    title: "GCC luxury stays",
    meta: "41 briefs → 10 hero edits → 18 days."
  },
  {
    label: "Fintech",
    title: "AI finance launch",
    meta: "7 creators · £320 CPA · 4-country rollout."
  },
  {
    label: "Lifestyle",
    title: "Retail capsule tour",
    meta: "Hybrid retail pop-up across two continents."
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

function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

function App() {
  const session = useCurrentSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleSignOut = () => {
    clearSession();
  };

  return (
    <BrowserRouter>
      <AppRoutes
        session={session}
        authModalOpen={authModalOpen}
        setAuthModalOpen={setAuthModalOpen}
        handleSignOut={handleSignOut}
      />
    </BrowserRouter>
  );
}

function AppRoutes({ session, authModalOpen, setAuthModalOpen, handleSignOut }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (session?.roles?.includes(Roles.ADMIN) && location.pathname === "/") {
      navigate("/admin/dashboard");
    }
  }, [session, location.pathname, navigate]);

  return (
    <>
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
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/queues"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminQueuesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:email"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminUserFeedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/messaging"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminMessagingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/finance"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminFinancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exclusive"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <ExclusiveTalentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ugc"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <UgcTalentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/other"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <OtherUsersDashboard />
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
    </>
  );
}

function SiteChrome({ session, onRequestSignIn, onSignOut }) {
  const location = useLocation();
  const isPublicResource = location.pathname.startsWith("/resource-hub");
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const isAdmin = session?.roles?.includes(Roles.ADMIN);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      setAdminMenuOpen(false);
    }
  }, [isAdmin]);

  return (
    <header className="sticky top-0 z-30 border-b border-brand-white/10 bg-brand-black/95 text-brand-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-2xl uppercase tracking-[0.2em]">
          The Break Co.
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((item) => (
            item.to.startsWith("#") ? (
              <a
                key={item.to}
                href={item.to}
                className="text-xs font-subtitle uppercase tracking-[0.35em] text-brand-white/70 transition hover:text-brand-white"
              >
                {item.label}
              </a>
            ) : (
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
            )
          ))}
        </nav>
        <div className="relative flex items-center gap-3">
          <span className="hidden font-subtitle text-[0.7rem] uppercase tracking-[0.35em] text-brand-white/70 md:inline-flex">
            {isPublicResource ? "Public Surface" : "Platform"}
          </span>
          {session ? (
            <>
              <span className="rounded-full border border-brand-white/30 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-brand-white/90">
                {session.roles?.[0] || "member"}
              </span>
              {isAdmin && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminMenuOpen(false);
                      session?.email && navigate("/admin/dashboard");
                    }}
                    className="rounded-full border border-brand-red px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-brand-red hover:bg-brand-red/10"
                  >
                    {session.email?.split("@")[0]?.split(".")[0] || "Admin"}
                  </button>
                  {adminMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-brand-black/10 bg-brand-white p-3 text-brand-black shadow-lg">
                      {[
                        { to: "/admin/dashboard", label: "Control room" },
                        { to: "/admin/queues", label: "Queues" },
                        { to: "/admin/approvals", label: "Approvals" },
                        { to: "/admin/users", label: "Users" },
                        { to: "/admin/messaging", label: "Messaging" },
                        { to: "/admin/finance", label: "Finance" },
                        { to: "/admin/settings", label: "Settings" },
                        { to: "/admin/exclusive", label: "Exclusive talent view" },
                        { to: "/admin/ugc", label: "UGC talent view" },
                        { to: "/admin/other", label: "Other users view" }
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setAdminMenuOpen(false)}
                          className="block rounded-xl px-4 py-2 text-sm hover:bg-brand-black/5"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
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

function LandingPage({ onRequestSignIn }) {
  const heroStats = [
    {
      title: "Creators vetted",
      detail: "18 markets & diasporas",
      target: 450,
      suffix: "+"
    },
    {
      title: "Campaigns shipped",
      detail: "Past 12 months",
      target: 120,
      suffix: "+"
    },
    {
      title: "Avg. brief turn",
      detail: "From intake to shortlist",
      target: 72,
      suffix: "h"
    }
  ];

  return (
    <div className="bg-brand-linen text-brand-black">
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl space-y-8 rounded-[48px] bg-brand-white p-10 text-center shadow-[0_25px_90px_rgba(0,0,0,0.08)]">
          <div className="space-y-4">
            <p className="font-subtitle text-sm uppercase tracking-[0.4em] text-brand-red">// The Break Co.</p>
          <h1 className="font-display text-5xl uppercase leading-tight">
            <span className="inline-flex h-1 w-12 rounded-full bg-brand-red align-[0.3em]" />
            <span className="ml-3 align-middle">Creating legacies by bridging talent, brands, and culture.</span>
          </h1>
            <p className="text-base text-brand-black/70">
              We are the operating system for creators, talent managers, and brands who need UGC, partnerships,
              and IRL storytelling without the chaos. Modern workflows, white-glove guidance, and a public resource hub keep everyone aligned.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/creator"
              className="rounded-full border-2 border-brand-black px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
            >
              Creators / Talent
            </Link>
            <Link
              to="/brand"
              className="rounded-full border-2 border-brand-black bg-brand-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
            >
              Brands & Leaders
            </Link>
          </div>
          <div className="grid gap-6 text-sm text-brand-black/70 md:grid-cols-3 text-center">
            {heroStats.map((stat) => (
              <HeroStat key={stat.title} {...stat} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl space-y-10 rounded-[48px] bg-brand-white p-10 text-center shadow-[0_25px_90px_rgba(0,0,0,0.08)]">
          <div className="space-y-2">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Creator pathway</p>
            <h2 className="font-display text-5xl uppercase">
              <span className="inline-flex h-1 w-10 rounded-full bg-brand-red align-[0.35em]" />
              <span className="ml-3 align-middle">About the Break creator collective</span>
            </h2>
            <p className="text-brand-black/70">
              We are a management-first studio for creators who value culture, commerce, and clarity. Our team handles
              compliant onboarding, AI-assisted deal support, and private briefings so you can focus on storytelling.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {CREATOR_PANELS.map((panel) => (
              <article
                key={panel.title}
                className="rounded-[32px] border border-brand-black/10 bg-brand-white p-6 text-left shadow-[0_12px_50px_rgba(0,0,0,0.08)]"
              >
                <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{panel.badge}</p>
                <h3 className="mt-3 font-display text-3xl uppercase">{panel.title}</h3>
                <ul className="mt-4 space-y-2 text-sm text-brand-black/70">
                  {panel.bullets.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={onRequestSignIn}
                  className="mt-6 w-full rounded-full bg-brand-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
                >
                  {panel.cta}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl space-y-10 rounded-[48px] bg-brand-white p-10 shadow-[0_25px_90px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Resource hub</p>
              <h2 className="font-display text-5xl uppercase">
                <span className="inline-flex h-1 w-10 rounded-full bg-brand-red align-[0.35em]" />
                <span className="ml-3 align-middle">Creating legacies</span>
              </h2>
              <p className="text-sm text-brand-black/70">
                Marketplace → UGC board, intake, approvals, payouts. Workflows → Creator/brand questionnaires + AI pre-reads.
                Resource hub → Case studies, decks, talent & brand splits.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={onRequestSignIn}
                className="rounded-full bg-brand-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
              >
                Launch console
              </button>
              <Link
                to="/resource-hub"
                className="rounded-full border border-brand-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black"
              >
                Resource hub
              </Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {RESOURCE_PANELS.map((panel) => (
              <article key={panel.title} className="rounded-[24px] bg-brand-linen/70 p-6 text-left shadow-inner">
                <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">///</p>
                <h3 className="mt-2 font-display text-2xl uppercase">{panel.title}</h3>
                <p className="mt-2 text-sm text-brand-black/70">{panel.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="text-center">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Questionnaires</p>
            <h2 className="font-display text-5xl uppercase">
              <span className="inline-flex h-1 w-10 rounded-full bg-brand-red align-[0.35em]" />
              <span className="ml-3 align-middle">Intake first, matchmaking next</span>
            </h2>
            <p className="text-brand-black/70">
              Whether you're a creator or a brand, you begin inside the same structured intake. It keeps expectations clear and our team able to move at speed.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {QUESTIONNAIRES.map((form) => (
              <article
                key={form.title}
                className="rounded-[32px] border border-brand-black/10 bg-brand-white p-6 text-left shadow-[0_12px_50px_rgba(0,0,0,0.08)]"
              >
                <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Questionnaire</p>
                <h3 className="mt-2 font-display text-xl uppercase tracking-[0.25em]">{form.title}</h3>
                <p className="mt-2 text-sm text-brand-black/70">{form.summary}</p>
                <Link
                  to={form.route}
                  className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.35em] text-brand-red"
                >
                  {form.cta} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl space-y-8 rounded-[48px] bg-brand-white p-10 text-center shadow-[0_25px_90px_rgba(0,0,0,0.08)]">
          <div className="space-y-2">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Case studies</p>
            <h2 className="font-display text-5xl uppercase">
              <span className="inline-flex h-1 w-10 rounded-full bg-brand-red align-[0.35em]" />
              <span className="ml-3 align-middle">Proof across industries</span>
            </h2>
            <p className="text-sm text-brand-black/70">
              Browse a snapshot of the brands and sectors we support, from hospitality and fintech to lifestyle and retail.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {CASE_STUDIES.map((study) => (
              <article key={study.title} className="rounded-[24px] border border-brand-black/10 bg-brand-linen/70 p-5 text-left">
                <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{study.label}</p>
                <h3 className="mt-2 text-lg font-semibold text-brand-black">{study.title}</h3>
                <p className="mt-2 text-sm text-brand-black/70">{study.meta}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl space-y-4 rounded-[48px] bg-brand-red p-12 text-center text-brand-white shadow-[0_25px_90px_rgba(0,0,0,0.15)]">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em]">The Break Co.</p>
          <h2 className="font-display text-5xl uppercase">Ready to build what's next</h2>
          <p className="text-brand-white/80">
            Secure access to the dashboard to view briefs, submit to the UGC board, or open a brand request. White-glove onboarding in under three days.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onRequestSignIn}
              className="rounded-full bg-brand-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black"
            >
              Launch console
            </button>
            <Link
              to="/resource-hub"
              className="rounded-full border border-brand-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
            >
              Resource hub
            </Link>
          </div>
        </div>
      </section>

      <section id="contact" className="px-6 pb-16">
        <div className="mx-auto max-w-6xl rounded-[48px] bg-brand-white p-10 shadow-[0_25px_90px_rgba(0,0,0,0.08)]">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Explore</p>
              <ul className="mt-4 space-y-2 text-sm text-brand-black/70">
                <li>Resource Hub</li>
                <li>Creator Console</li>
                <li>Brand Portal</li>
              </ul>
            </div>
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Company</p>
              <ul className="mt-4 space-y-2 text-sm text-brand-black/70">
                <li>Case Studies</li>
                <li>Careers</li>
                <li>Press</li>
              </ul>
            </div>
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Legal</p>
              <ul className="mt-4 space-y-2 text-sm text-brand-black/70">
                <li>Privacy Policy</li>
                <li>Terms</li>
                <li>Cookies</li>
              </ul>
            </div>
            <div className="space-y-4 text-left">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Contact</p>
              <p className="text-sm text-brand-black/70">
                Have a briefing, a deck, or a wild idea? Drop us a line and we'll get back within two business days.
              </p>
              <form className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full rounded-full border border-brand-black/10 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full rounded-full border border-brand-black/10 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                />
                <textarea
                  placeholder="Tell us what you need"
                  rows={3}
                  className="w-full rounded-3xl border border-brand-black/10 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                />
                <button
                  type="button"
                  className="w-full rounded-full bg-brand-black px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
                >
                  Send message
                </button>
              </form>
            </div>
          </div>
          <p className="mt-8 text-center text-xs uppercase tracking-[0.35em] text-brand-black/60">
            © {new Date().getFullYear()} The Break Co. — Creating legacies since 2024.
          </p>
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
    <div className="bg-brand-ivory text-brand-black">
      <section className="border-b border-brand-black/10 bg-brand-white">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-4">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Resource hub</p>
          <h1 className="font-display text-5xl uppercase">Public intel, no login required.</h1>
          <p className="text-brand-black/70">
            Articles, templates, digital products, and webinars curated for both sides of the
            marketplace. Spellcheck and QA baked into every onboarding doc.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12 space-y-10">
        {categories.map(([category, items]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center justify-between border-b border-brand-black/10 pb-2">
              <h2 className="font-display text-4xl uppercase">{category}</h2>
              <span className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Public</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item) => (
                <article
                  key={item.title}
                  className="rounded-3xl border border-brand-black/10 bg-brand-white p-5 shadow-brand"
                >
                  <div className="flex items-center justify-between text-xs text-brand-black/60">
                    <span>{item.type}</span>
                    <span>{item.audience}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-brand-black">{item.title}</h3>
                  <p className="mt-2 text-sm text-brand-black/70">{item.description}</p>
                  <button className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-brand-red">
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
    <div className="bg-brand-ivory text-brand-black">
      <section className="border-b border-brand-black/10 bg-brand-white">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-4 text-center">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Creator pathway</p>
          <h1 className="font-display text-5xl uppercase">
            <span className="inline-flex h-1 w-10 rounded-full bg-brand-red align-[0.35em]" />
            <span className="ml-3 align-middle">View UGC briefs, create your profile, join campaigns.</span>
          </h1>
          <p className="text-brand-black/70">
            Visitors can browse the opportunities board. Applying requires a Break profile and
            consent-backed onboarding. Approved creators unlock dashboards, AI co-pilots, and revenue
            tools.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onRequestSignIn}
              className="rounded-full bg-brand-red px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white hover:bg-brand-red/90"
            >
              Create profile
            </button>
            <a
              href="#ugc-board"
              className="rounded-full border border-brand-black/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
            >
              Browse UGC board
            </a>
          </div>
        </div>
      </section>
      <section id="ugc-board" className="mx-auto max-w-6xl px-6 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-4xl uppercase">UGC Opportunities</h2>
          <Badge>Visible to all · Apply requires login</Badge>
        </div>
        <UgcBoard canApply={false} />
      </section>
      <section className="border-t border-brand-black/10 bg-brand-linen">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-2">
          <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-brand">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Onboarding</p>
            <h3 className="mt-3 text-lg font-semibold text-brand-black">Profile creation</h3>
            <ul className="mt-4 space-y-2 text-sm text-brand-black/70">
              <li>• Personal info, social handles, performance screenshots.</li>
              <li>• Rates, exclusivity preferences, usage rights consent.</li>
              <li>• Optional vetting (portfolio review + reference check).</li>
              <li>• Spellchecked outputs automatically.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-brand">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Dashboard unlocks</p>
            <ul className="mt-4 space-y-2 text-sm text-brand-black/70">
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
    <div className="bg-brand-ivory text-brand-black">
      <section className="border-b border-brand-black/10 bg-brand-white">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-4 text-center">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Brand pathway</p>
          <h1 className="font-display text-5xl uppercase">
            Campaign creation, creator match, contracts, reporting.
          </h1>
          <p className="text-brand-black/70">
            Brands can browse public case studies, complete the needs questionnaire, and then unlock
            the dashboard to manage campaigns. UGC boards stay creator-side only.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRequestSignIn}
              className="rounded-full bg-brand-red px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white hover:bg-brand-red/90"
            >
              Create brand profile
            </button>
            <Link
              to="/resource-hub"
              className="rounded-full border border-brand-black/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
            >
              Review case studies
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12 space-y-4">
        <h2 className="font-display text-4xl uppercase">Brand dashboard navigation</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {["Dashboard", "Campaigns", "Creator Match", "Reports", "Messages", "Account"].map(
            (item) => (
              <div key={item} className="rounded-3xl border border-brand-black/10 bg-brand-white p-5 shadow-brand">
                <p className="text-sm font-semibold text-brand-black">{item}</p>
                <p className="mt-2 text-xs text-brand-black/70">
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
      <section className="border-t border-brand-black/10 bg-brand-black text-brand-white">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-4">
          <h3 className="font-display text-4xl uppercase">Brand Needs Questionnaire</h3>
          <p className="text-brand-white/70">
            Qualifies scope, budget, and readiness; prompts profile creation to proceed. Campaign
            creation stays brand-only, UGC routing happens automatically to approved creators.
          </p>
          <button
            type="button"
            onClick={onRequestSignIn}
            className="rounded-full bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-white hover:bg-brand-red/90"
          >
            Launch questionnaire
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;

function HeroStat({ target, suffix, title, detail }) {
  const value = useCountUp(target);
  return (
    <div className="space-y-2 text-center">
      <div className="flex justify-center">
        <span className="inline-block h-1 w-10 rounded-full bg-brand-red" />
      </div>
      <p className="font-display text-4xl uppercase text-brand-black">
        {value}
        {suffix}
      </p>
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-black">
        {title}
      </p>
      <p className="text-xs text-brand-red/80">{detail}</p>
    </div>
  );
}
