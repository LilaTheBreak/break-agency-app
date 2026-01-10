import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { Roles } from "./constants/roles.js";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { RoleGate } from "./components/RoleGate.jsx";
import { Footer } from "./components/Footer.jsx";
import { Badge } from "./components/Badge.jsx";
import { UgcBoard } from "./components/UgcBoard.jsx";
import { DashboardShell } from "./components/DashboardShell.jsx";
import { LogoWordmark } from "./components/LogoWordmark.jsx";
import { ImpersonationBanner } from "./components/ImpersonationBanner.jsx";
import AppErrorBoundary from "./components/AppErrorBoundary.jsx";
import * as Sentry from "@sentry/react";
import { RouteErrorBoundaryWrapper } from "./components/RouteErrorBoundary.jsx";
import ToastProvider from "./components/ToastProvider.jsx";
import { OnboardingReminderBanner } from "./components/OnboardingReminderBanner.jsx";
import BrandDashboardLayout, {
  BrandOverviewPage,
  BrandProfilePage,
  BrandSocialsPage,
  BrandCampaignsPage,
  BrandOpportunitiesPage,
  BrandContractsPage,
  BrandFinancialsPage,
  BrandMessagesPage,
  BrandSettingsPage
} from "./pages/BrandDashboard.jsx";
import { CreatorDashboard } from "./pages/CreatorDashboard.jsx";
import { AdminDashboard } from "./pages/AdminDashboard.jsx";
import { AdminActivityPage } from "./pages/AdminActivity.jsx";
import ExclusiveTalentDashboardLayout, {
  ExclusiveOverviewPage,
  ExclusiveProfilePage,
  ExclusiveSocialsPage,
  ExclusiveCampaignsPage,
  ExclusiveAnalyticsPage,
  ExclusiveCalendarPage,
  ExclusiveCommercePage,
  ExclusiveProjectsPage,
  ExclusiveTasksPage,
  ExclusiveOpportunitiesPage,
  ExclusiveContractsPage,
  ExclusiveFinancialsPage,
  ExclusiveMessagesPage,
  ExclusiveSettingsPage
} from "./pages/ExclusiveTalentDashboard.jsx";
import { UgcTalentDashboard } from "./pages/UgcTalentDashboard.jsx";
import { FounderDashboard } from "./pages/FounderDashboard.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import AccountSetupPage from "./pages/AccountSetupPage.jsx";
import { AdminQueuesPage } from "./pages/AdminQueuesPage.jsx";
import { AdminApprovalsPage } from "./pages/AdminApprovalsPage.jsx";
import AdminUserApprovals from "./pages/AdminUserApprovals.jsx";
import { AdminUsersPage } from "./pages/AdminUsersPage.jsx";
import { AdminBrandsPage } from "./pages/AdminBrandsPage.jsx";
import { AdminCampaignsPage } from "./pages/AdminCampaignsPage.jsx";
import { AdminAnalyticsPage } from "./pages/AdminAnalyticsPage.jsx";
import { AdminEventsPage } from "./pages/AdminEventsPage.jsx";
import { AdminDealsPage } from "./pages/AdminDealsPage.jsx";
import { AdminTalentPage } from "./pages/AdminTalentPage.jsx";
import { AdminTalentDetailPage } from "./pages/AdminTalentDetailPage.jsx";
import { AdminContactsPage } from "./pages/AdminContactsPage.jsx";
import { AdminReportsPage } from "./pages/AdminReportsPage.jsx";
import AdminTasksPage from "./pages/AdminTasksPage.jsx";
import AdminCalendarPage from "./pages/AdminCalendarPage.jsx";
import { AdminOutreachPage } from "./pages/AdminOutreachPage.jsx";
import { AdminMessagingPage } from "./pages/AdminMessagingPage.jsx";
import { AdminContractsPage } from "./pages/AdminContractsPage.jsx";
import { AdminFinancePage } from "./pages/AdminFinancePage.jsx";
import { AdminRevenuePage } from "./pages/AdminRevenuePage.jsx";
import { AdminSettingsPage } from "./pages/AdminSettingsPage.jsx";
import { AdminUserFeedPage } from "./pages/AdminUserFeedPage.jsx";
import { OpportunitiesAdmin } from "./pages/admin/OpportunitiesAdmin.jsx";
import { AdminDocumentsPage } from "./pages/AdminDocumentsPage.jsx";
import { AdminContentPage } from "./pages/AdminContentPage.jsx";
import AdminResourceHub from "./pages/AdminResourceHub.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { ProfilePageNew } from "./pages/ProfilePageNew.jsx";
import { CreatorPage } from "./pages/CreatorPage.jsx";
import { LegalPrivacyPage } from "./pages/LegalPrivacy.jsx";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicy.jsx";
import { TermsOfServicePage } from "./pages/TermsOfService.jsx";
import { ContactPage } from "./pages/Contact.jsx";
import { HelpCenterPage } from "./pages/HelpCenter.jsx";
import { SupportPage } from "./pages/SupportPage.jsx";
import { PressPage } from "./pages/Press.jsx";
import { CareersPage } from "./pages/CareersPage.jsx";
import { ExclusiveGoalsOnboardingPage } from "./pages/ExclusiveGoalsOnboardingPage.jsx";
import { BookFounderPage } from "./pages/BookFounder.jsx";
import { ResourceHubPage } from "./pages/ResourceHubPage.jsx";
import EmailOpportunities from "./pages/EmailOpportunities.jsx";
import SignupPage from "./pages/Signup.jsx";
import DevLogin from "./pages/DevLogin.jsx";
import { MessagingContext } from "./context/messaging.js";
import { useRemoteMessaging } from "./hooks/useRemoteMessaging.js";
import { useAuth } from "./context/AuthContext.jsx";
import { BrandPage } from "./pages/BrandPage.jsx";
import { shouldRouteToOnboarding, getDashboardPathForRole } from "./lib/onboardingState.js";
import { setSentryTags } from "./lib/sentry.js";
// TEMPORARY — SENTRY VERIFICATION: Sentry already imported on line 22
import { ErrorTestButton } from "./components/ErrorTestButton.jsx";
import { BlockRenderer } from "./components/BlockRenderer.jsx";
import { usePublicCmsPage } from "./hooks/usePublicCmsPage.js";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "#mission", label: "Mission" },
  { to: "#solutions", label: "Solutions" },
  { to: "#how-it-works", label: "How it Works" },
  { to: "/resource-hub", label: "Resource Hub" },
  { to: "#contact", label: "Contact" }
];

const CREATOR_PANELS = [
  {
    badge: "Representation + Premium",
    title: "Exclusive Talent",
    bullets: [
      "Dedicated strategists handling sourcing, negotiations, and luxury-ready delivery.",
      "Cross-category opportunities spanning beauty, finance, travel, and culture.",
      "Finance, compliance, and production handled under one premium service."
    ],
    cta: "Apply for access"
  },
  {
    badge: "Briefs + Education",
    title: "UGC Creator",
    bullets: [
      "Immediate access to curated UGC briefs, AI prep guides, and templates.",
      "Centralized deliverable tracker, billing workflow, and payouts.",
      "Upgrade into premium management once performance tiers are met."
    ],
    cta: "Explore opportunities board"
  }
];

// Helper to extract feature name from route for Sentry tagging
function getFeatureFromRoute(pathname) {
  if (pathname.startsWith("/admin/talent")) return "talent";
  if (pathname.startsWith("/admin/campaigns")) return "campaigns";
  if (pathname.startsWith("/admin/messaging")) return "messaging";
  if (pathname.startsWith("/admin/inbox")) return "gmail";
  if (pathname.startsWith("/admin/opportunities")) return "opportunities";
  if (pathname.startsWith("/admin/deals")) return "deals";
  if (pathname.startsWith("/admin/finance")) return "finance";
  if (pathname.startsWith("/creator")) return "creator";
  if (pathname.startsWith("/brand")) return "brand";
  return "other";
}

const RESOURCE_PANELS = [
  {
    title: "Creator partnerships",
    description:
      "Curated rosters with contract, compliance, and cultural positioning handled end-to-end."
  },
  {
    title: "Brand activations",
    description: "Story-driven programs across hero UGC, experiential drops, and offline moments."
  },
  {
    title: "Intelligence layer",
    description: "Unified dashboards with pacing, payments, and retros so every team sees the same signal."
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

const MISSION_POINTS = [
  {
    title: "Singular operating system",
    body: "We give creators, managers, and brands the same living source of truth so briefs, approvals, and payouts never splinter."
  },
  {
    title: "Premium service layer",
    body: "Premium onboarding, compliance, and finance workflows are engineered for luxury launches, regulated categories, and global drops."
  },
  {
    title: "Creative confidence",
    body: "Every campaign ships with AI prep, performance context, and live risk signals so decisions are made before momentum slips."
  }
];

const HOW_IT_WORKS_STEPS = [
  {
    title: "01. Intake & alignment",
    detail: "Creators and brands complete a structured intake so our team can map objectives, guardrails, and commercial terms in under 48 hours."
  },
  {
    title: "02. Orchestrate & produce",
    detail: "We assemble curated talent pods, route briefs through the console, and manage deliverables, payments, and compliance end-to-end."
  },
  {
    title: "03. Report & learn",
    detail: "Live dashboards surface pacing, spend, and cultural insights so teams can iterate in real time and roll wins into the next brief."
  }
];

const PRICING_PREVIEW = [
  {
    title: "Premium talent management",
    price: "From 15% of managed revenue",
    detail: "Full-service representation, finance, and campaign sourcing for exclusive roster talent."
  },
  {
    title: "Brand programs",
    price: "From $12k per initiative",
    detail: "Multi-market creator sourcing, production, and reporting for premium launches and seasonal moments."
  },
  {
    title: "Platform access",
    price: "Custom",
    detail: "Access to Break console, AI prep tools, and Opportunities board for qualified teams."
  }
];

const FAQS = [
  {
    question: "Who is Break built for?",
    answer: "Premium creators, boutique agencies, and brand leaders who need a single workflow for sourcing, executing, and measuring cultural campaigns."
  },
  {
    question: "How fast can we launch?",
    answer: "After intake, most creator or brand programs are stood up within 72 hours with a curated roster and approval plan."
  },
  {
    question: "Do you support existing teams?",
    answer: "Yes. We can embed alongside in-house talent, legal, or finance teams and simply become the operating layer."
  }
];


const DEFAULT_ACTOR_EMAIL = "admin@thebreakco.com";

const MESSAGE_TEMPLATES = [
  {
    id: "template-followup",
    label: "Follow-up: Deliverables check-in",
    body: "Hi team — just checking the status of today's deliverable. Let me know if you need any edits or clarification from the brand side."
  },
  {
    id: "template-budget",
    label: "Budget reminder",
    body: "Thanks for the update. Confirming the approved budget cap and reminding finance to release the next tranche as soon as assets are approved."
  },
  {
    id: "template-approval",
    label: "Approval request",
    body: "Flagging this for approval — once you green-light the edit we can route it through paid amplification and report back on initial KPIs."
  }
];

// Mock alert scenarios removed - using remote API only

// Simulated incoming pings removed - using remote API only

// Mock messaging data removed - using remote API only

function App() {
  const { user: session, loading: authLoading, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFade, setSplashFade] = useState(false);
  const remoteMessaging = useRemoteMessaging(session);
  
  // Removed: TEMPORARY Sentry verification test (was flooding production with fake errors)
  // This verification test was left in production code and caused Sentry signal pollution.
  // Real errors are now visible again.

  useEffect(() => {
    if (session && authModalOpen) {
      setAuthModalOpen(false);
    }
  }, [session, authModalOpen]);

  const currentActor = session?.email || DEFAULT_ACTOR_EMAIL;
  const actorRole = session?.role || Roles.ADMIN;

  const handleSignOut = () => {
    logout();
  };

  // addMessage removed - handled by remote messaging API

  const sendMessage = useCallback(
    async (threadId, payload) => {
      if (!threadId || !payload?.body?.trim()) return;
      await remoteMessaging.sendMessage(threadId, payload);
    },
    [remoteMessaging]
  );

  const markThreadRead = useCallback(
    async (threadId) => {
      if (!threadId) return;
      await remoteMessaging.markThreadRead(threadId);
    },
    [remoteMessaging]
  );

  // Simulation effect removed - using real-time remote messaging only

  const messagingValue = useMemo(
    () => ({
      messages: remoteMessaging.threads,
      threads: remoteMessaging.threads,
      sendMessage,
      markThreadRead,
      templates: MESSAGE_TEMPLATES,
      alerts: [], // Alerts now handled separately, not part of messaging
      connectionStatus: remoteMessaging.connectionStatus,
      currentUser: currentActor
    }),
    [remoteMessaging.threads, remoteMessaging.connectionStatus, sendMessage, markThreadRead, currentActor]
  );

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFade(true), 900);
    const hideTimer = setTimeout(() => setSplashVisible(false), 1500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <BrowserRouter>
      <Sentry.ErrorBoundary fallback={null}>
        <AppErrorBoundary>
          <ToastProvider />
          <ErrorTestButton />
          <MessagingContext.Provider value={messagingValue}>
            {splashVisible && (
              <div
                className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0f0d0b] transition-opacity duration-700 ${
                  splashFade ? "opacity-0" : "opacity-100"
                }`}
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="rounded-3xl bg-white/6 p-6 backdrop-blur-sm">
                    <img
                      src="/B-Logo-Mark.png"
                      alt="Break"
                      className="h-14 w-14 object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                    />
                  </div>
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-full bg-white/80" style={{ animation: "loaderBar 1.4s ease-in-out infinite" }} />
                  </div>
                </div>
              </div>
            )}
            <OnboardingReminderBanner />
            <ImpersonationBanner />
            <AppRoutes
              session={session}
              authModalOpen={authModalOpen}
              setAuthModalOpen={setAuthModalOpen}
              handleSignOut={handleSignOut}
              authLoading={authLoading}
            />
          </MessagingContext.Provider>
        </AppErrorBoundary>
      </Sentry.ErrorBoundary>
    </BrowserRouter>
  );
}

function AppRoutes({ session, authModalOpen, setAuthModalOpen, handleSignOut, authLoading }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showGate, setShowGate] = useState(location.pathname === "/");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!authLoading && (session?.role === 'ADMIN' || session?.role === 'SUPERADMIN') && location.pathname === "/") {
      navigate("/admin/dashboard");
    }
  }, [session, authLoading, location.pathname, navigate]);

  const handleGateChoice = (path) => {
    navigate(path);
  };

  // Track route changes in Sentry with user role and feature flags
  // Moved here from App component since we need Router context for useLocation()
  useEffect(() => {
    if (location.pathname) {
      // Capture feature flags snapshot
      const featureFlags = typeof window !== "undefined" && window.__FEATURE_FLAGS__ 
        ? window.__FEATURE_FLAGS__ 
        : {};
      
      setSentryTags({
        route: location.pathname,
        feature: getFeatureFromRoute(location.pathname),
        role: session?.role || "anonymous",
        ...Object.fromEntries(
          Object.entries(featureFlags).map(([key, value]) => [`feature_${key}`, String(value)])
        ),
      });
    }
  }, [location.pathname, session?.role]);

  useEffect(() => {
    if (location.pathname !== "/") {
      setShowGate(false);
    }
  }, [location.pathname]);

  // AUTH LOADING GATE - Prevent any rendering until auth is resolved
  if (authLoading) {
    return null; // or return a neutral loading skeleton
  }

  const showGateScreen = showGate && location.pathname === "/" && !session;
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthenticatedRoute = session && (isAdminRoute || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/account'));

  return (
    <>
      {showGateScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white px-6">
          <div className="flex flex-col items-center gap-5 text-center">
            <LogoWordmark variant="mark" className="h-10 w-auto" />
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => handleGateChoice("/brand")}
                className="w-[320px] rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-brand-red hover:translate-y-[-1px]"
              >
                I Am A Brand
              </button>
              <button
                type="button"
                onClick={() => handleGateChoice("/creator")}
                className="w-[320px] rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-brand-red hover:translate-y-[-1px]"
              >
                I Am A Creator
              </button>
            </div>
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="text-[0.75rem] font-medium uppercase tracking-[0.3em] text-slate-600 underline-offset-4 hover:text-brand-red"
            >
              Existing member? Log in
            </button>
          </div>
        </div>
      )}
      <GoogleSignIn open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <SiteChrome
        session={session}
        onRequestSignIn={() => setAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />
      <Routes>
        <Route 
          path="/" 
          element={
            !session ? (
              <LandingPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route path="/resource-hub" element={<ResourceHubPage />} />
        <Route path="/legal" element={<LegalPrivacyPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/help" element={<HelpCenterPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/press" element={<PressPage />} />
        <Route path="/book-founder" element={<BookFounderPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dev-login" element={<DevLogin />} />
        <Route path="/setup" element={<AccountSetupPage />} />
        <Route path="/creator" element={<CreatorPage onRequestSignIn={() => setAuthModalOpen(true)} />} />
        <Route
          path="/creator/opportunities"
          element={
            <ProtectedRoute session={session}>
              <EmailOpportunities />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute session={session}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route path="/brand" element={<BrandPage onRequestSignIn={() => setAuthModalOpen(true)} />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              session={session}
              allowed={[
                Roles.ADMIN,
                Roles.BRAND,
                Roles.CREATOR,
                Roles.EXCLUSIVE_TALENT,
                Roles.UGC,
                Roles.TALENT_MANAGER
              ]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <DashboardRedirect session={session} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/profile"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.SUPERADMIN, Roles.ADMIN, Roles.BRAND, Roles.CREATOR, Roles.EXCLUSIVE_TALENT, Roles.UGC, Roles.TALENT_MANAGER, Roles.FOUNDER]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <ProfilePageNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <ProtectedRoute
              session={session}
              allowed={[
                Roles.ADMIN,
                Roles.SUPERADMIN,
                Roles.BRAND,
                Roles.FOUNDER,
                Roles.CREATOR,
                Roles.EXCLUSIVE_TALENT,
                Roles.UGC,
                Roles.TALENT_MANAGER
              ]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <SupportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/creator/dashboard"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.CREATOR, Roles.ADMIN, Roles.SUPERADMIN, Roles.EXCLUSIVE_TALENT, Roles.UGC]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <CreatorDashboard session={session} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brand/dashboard/*"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.BRAND, Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <BrandDashboardLayout basePath="/brand/dashboard" session={session} />
            </ProtectedRoute>
          }
        >
          <Route index element={<BrandOverviewPage />} />
          <Route path="profile" element={<BrandProfilePage />} />
          <Route path="socials" element={<BrandSocialsPage />} />
          <Route path="campaigns" element={<BrandCampaignsPage />} />
          <Route
            path="opportunities"
            element={
              <RoleGate session={session} allowed={[Roles.ADMIN, Roles.SUPERADMIN, Roles.BRAND]}>
                <BrandOpportunitiesPage />
              </RoleGate>
            }
          />
          <Route
            path="contracts"
            element={
              <RoleGate session={session} allowed={[Roles.BRAND, Roles.ADMIN, Roles.SUPERADMIN]}>
                <BrandContractsPage />
              </RoleGate>
            }
          />
          <Route path="financials" element={<BrandFinancialsPage />} />
          <Route path="messages" element={<BrandMessagesPage />} />
          <Route path="settings" element={<BrandSettingsPage />} />
        </Route>
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <RouteErrorBoundaryWrapper routeName="Admin Dashboard">
                <AdminDashboard session={session} />
              </RouteErrorBoundaryWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tasks"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/calendar"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminCalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activity"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminActivityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/queues"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminQueuesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/outreach"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <RouteErrorBoundaryWrapper routeName="Outreach">
                <AdminOutreachPage session={session} />
              </RouteErrorBoundaryWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/campaigns"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminCampaignsPage session={session} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminAnalyticsPage session={session} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminEventsPage session={session} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/deals"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminDealsPage session={session} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminApprovalsPage session={session} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/user-approvals"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminUserApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <RouteErrorBoundaryWrapper routeName="User Management">
                <AdminUsersPage />
              </RouteErrorBoundaryWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/brands"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <RouteErrorBoundaryWrapper routeName="Brands CRM">
                <AdminBrandsPage session={session} />
              </RouteErrorBoundaryWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/talent"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <RouteErrorBoundaryWrapper routeName="Talent Management">
                <AdminTalentPage />
              </RouteErrorBoundaryWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/talent/:talentId"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <RouteErrorBoundaryWrapper routeName="Talent Detail">
                <AdminTalentDetailPage />
              </RouteErrorBoundaryWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/contacts"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <RouteErrorBoundaryWrapper routeName="Contacts">
                <AdminContactsPage />
              </RouteErrorBoundaryWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:email"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
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
              allowed={[
                Roles.ADMIN,
                Roles.SUPERADMIN,
                Roles.BRAND,
                Roles.CREATOR,
                Roles.EXCLUSIVE_TALENT,
                Roles.UGC,
                Roles.FOUNDER
              ]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <RouteErrorBoundaryWrapper routeName="Messaging">
                <AdminMessagingPage />
              </RouteErrorBoundaryWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/contracts"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminContractsPage session={session} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/documents"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <RouteErrorBoundaryWrapper routeName="Documents">
                <AdminDocumentsPage session={session} />
              </RouteErrorBoundaryWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/content"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <RouteErrorBoundaryWrapper routeName="CMS">
                <AdminContentPage session={session} />
              </RouteErrorBoundaryWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/finance"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN, Roles.FOUNDER]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <RouteErrorBoundaryWrapper routeName="Finance">
                <AdminFinancePage session={session} />
              </RouteErrorBoundaryWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <RouteErrorBoundaryWrapper routeName="Reports">
                <AdminReportsPage />
              </RouteErrorBoundaryWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/revenue"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN, Roles.FOUNDER]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <RouteErrorBoundaryWrapper routeName="Revenue">
                <AdminRevenuePage />
              </RouteErrorBoundaryWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/resources"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminResourceHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/opportunities"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <OpportunitiesAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/view/brand/*"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <BrandDashboardLayout basePath="/admin/view/brand" session={session} />
            </ProtectedRoute>
          }
        >
          <Route index element={<BrandOverviewPage />} />
          <Route path="profile" element={<BrandProfilePage />} />
          <Route path="socials" element={<BrandSocialsPage />} />
          <Route path="campaigns" element={<BrandCampaignsPage />} />
          <Route
            path="opportunities"
            element={
              <RoleGate session={session} allowed={[Roles.ADMIN, Roles.SUPERADMIN]}>
                <BrandOpportunitiesPage />
              </RoleGate>
            }
          />
          <Route
            path="contracts"
            element={
              <RoleGate session={session} allowed={[Roles.ADMIN, Roles.SUPERADMIN]}>
                <BrandContractsPage />
              </RoleGate>
            }
          />
          <Route path="financials" element={<BrandFinancialsPage />} />
          <Route path="messages" element={<BrandMessagesPage />} />
          <Route path="settings" element={<BrandSettingsPage />} />
        </Route>
        <Route
          path="/admin/view/exclusive/*"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <ExclusiveTalentDashboardLayout basePath="/admin/view/exclusive" session={session} />
            </ProtectedRoute>
          }
        >
          <Route index element={<ExclusiveOverviewPage />} />
          <Route path="goals" element={<ExclusiveGoalsOnboardingPage />} />
          <Route path="profile" element={<ExclusiveProfilePage />} />
          <Route path="socials" element={<ExclusiveSocialsPage />} />
          <Route path="campaigns" element={<ExclusiveCampaignsPage />} />
          <Route path="analytics" element={<ExclusiveAnalyticsPage />} />
          <Route path="calendar" element={<ExclusiveCalendarPage />} />
          <Route path="commerce" element={<ExclusiveCommercePage />} />
          <Route path="projects" element={<ExclusiveProjectsPage />} />
          <Route
            path="opportunities"
            element={
              <RoleGate session={session} allowed={[Roles.ADMIN, Roles.SUPERADMIN]}>
                <ExclusiveOpportunitiesPage />
              </RoleGate>
            }
          />
          <Route path="tasks" element={<ExclusiveTasksPage />} />
          <Route
            path="contracts"
            element={
              <RoleGate session={session} allowed={[Roles.ADMIN, Roles.SUPERADMIN]}>
                <ExclusiveContractsPage />
              </RoleGate>
            }
          />
          <Route path="financials" element={<ExclusiveFinancialsPage />} />
          <Route path="messages" element={<ExclusiveMessagesPage />} />
          <Route path="settings" element={<ExclusiveSettingsPage />} />
        </Route>
        {[
          { path: "/admin/view/talent", element: <CreatorDashboard session={session} /> },
          { path: "/admin/view/ugc", element: <UgcTalentDashboard session={session} /> },
          { path: "/admin/view/founder", element: <FounderDashboard session={session} /> }
        ].map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute
                session={session}
                allowed={[Roles.ADMIN, Roles.SUPERADMIN]}
                onRequestSignIn={() => setAuthModalOpen(true)}
              >
                {element}
              </ProtectedRoute>
            }
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      <GoogleSignIn
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}

function DashboardRedirect({ session }) {
  if (!session) {
    return <Navigate to="/" replace />;
  }
  if (shouldRouteToOnboarding(session)) {
    const search = session.role ? `?role=${session.role}` : "";
    return <Navigate to={`/onboarding${search}`} replace />;
  }
  const userRole = session.role;
  if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (userRole === 'BRAND' || userRole === 'FOUNDER') {
    return <Navigate to="/brand/dashboard" replace />;
  }
  if (userRole === 'EXCLUSIVE_TALENT' || userRole === 'CREATOR' || userRole === 'UGC') {
    return <Navigate to="/creator/dashboard" replace />;
  }
  return <Navigate to="/" replace />;
}

function SiteChrome({ session, onRequestSignIn, onSignOut }) {
  const location = useLocation();
  const isPublicResource = location.pathname.startsWith("/resource-hub");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  // Notifications system not yet implemented - using empty array until API is ready
  const [notifications, setNotifications] = useState(() => []);
  const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPERADMIN';

  useEffect(() => {
    setNotificationsOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleNotifications = () => setNotificationsOpen((prev) => !prev);

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <header className="sticky top-0 z-30 border-b border-brand-white/10 bg-brand-black/95 text-brand-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2" aria-label="The Break Co. home">
          <LogoWordmark variant="light" className="h-8 w-auto" />
        </Link>
        <div className="relative flex items-center gap-3">
          <span className="hidden font-subtitle text-[0.7rem] uppercase tracking-[0.35em] text-brand-white/70 md:inline-flex">
            {isPublicResource ? "Public Surface" : "Platform"}
          </span>
          {session ? (
            <>
              <Link
                to={getDashboardPathForRole(session.role)}
                className="rounded-full border border-brand-white/30 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-brand-white/90 hover:bg-brand-white/10 transition cursor-pointer"
                title="Go to dashboard"
              >
                Dashboard
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-brand-white/20 text-brand-white hover:-translate-y-0.5 hover:bg-brand-white/10"
                  aria-label="Notifications"
                  aria-pressed={notificationsOpen}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M12 22c1.1 0 2-.9 2-2H10c0 1.1.9 2 2 2Z" />
                    <path d="M18 16v-5a6 6 0 0 0-12 0v5" />
                    <path d="M5 16h14l-1.2 2.4a2 2 0 0 1-1.8 1.1H8a2 2 0 0 1-1.8-1.1L5 16Z" />
                  </svg>
                  {unreadCount > 0 ? (
                    <span className="absolute right-1 top-1 inline-flex h-2.5 w-2.5 rounded-full bg-brand-black" aria-label={`${unreadCount} unread notifications`} />
                  ) : null}
                </button>
                {notificationsOpen ? (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-brand-black/10 bg-brand-white p-3 text-brand-black shadow-[0_25px_80px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center justify-between">
                      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-brand-black">Notifications</p>
                      <button
                        type="button"
                        className="text-[0.65rem] uppercase tracking-[0.3em] text-brand-black hover:text-brand-black/70"
                        onClick={markAllRead}
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-brand-black/60">You're all caught up.</p>
                      ) : (
                        notifications.map((note) => (
                          <Link
                            key={note.id}
                            to={note.to || "/dashboard"}
                            onClick={() => {
                              markAsRead(note.id);
                              setNotificationsOpen(false);
                            }}
                            className={[
                              "block rounded-xl border px-3 py-2 transition",
                              note.read
                                ? "border-brand-black/10 bg-brand-white text-brand-black/70"
                                : "border-brand-black/40 bg-brand-black/10 text-brand-black"
                            ].join(" ")}
                          >
                            <p className="text-sm font-semibold text-brand-black">{note.title}</p>
                            <p className="text-xs text-brand-black/70">{note.detail}</p>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              {isAdmin && (
                <Link
                  to="/account/profile"
                  className="rounded-full border border-brand-black px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-brand-black hover:bg-brand-black/10"
                >
                  {session.name?.split(" ")[0] || session.email?.split("@")[0]?.split(".")[0] || "Admin"}
                </Link>
              )}
              <Link
                to="/support"
                className="rounded-full border border-brand-black/70 px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/10"
              >
                Support
              </Link>
              <Link
                to="/account/profile"
                className="rounded-full border border-brand-white/30 px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-brand-white hover:bg-brand-white/10"
              >
                Profile
              </Link>
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
              className="rounded-full bg-brand-black px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-brand-white hover:bg-brand-black/90"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}


function LandingPage() {
  // Fetch CMS content for welcome page (public, no auth required)
  const cms = usePublicCmsPage("welcome");

  // If CMS has blocks, render them instead of hardcoded content
  if (!cms.loading && cms.blocks && cms.blocks.length > 0) {
    return (
      <div className="bg-[#f6efe7] text-slate-900">
        <BlockRenderer blocks={cms.blocks} />
      </div>
    );
  }

  // Fallback to hardcoded content if CMS is empty or loading
  return <LandingPageHardcoded />;
}

function LandingPageHardcoded() {
  const clientLogos = [
    { src: "/logos/amex.png", alt: "AMEX" },
    { src: "/logos/audemars-piguet.png", alt: "Audemars Piguet" },
    { src: "/logos/burberry.png", alt: "Burberry" },
    { src: "/logos/gisou.png", alt: "Gisou" },
    { src: "/logos/lancome.png", alt: "Lancome" },
    { src: "/logos/prada.png", alt: "Prada" },
    { src: "/logos/samsung.png", alt: "Samsung" },
    { src: "/logos/sky.png", alt: "Sky" },
    { src: "/logos/sol-de-janeiro.png", alt: "Sol De Janeiro" },
    { src: "/logos/yves-saint-laurent.png", alt: "Yves Saint Laurent" }
  ];

  const trustStats = [
    {
      label: "Creators vetted",
      detail: "Across 18 markets & diasporas",
      target: 450,
      suffix: "+"
    },
    {
      label: "Influencer campaigns delivered",
      detail: "Executed in the last 12 months",
      target: 120,
      suffix: "+"
    },
    {
      label: "Global execution",
      detail: "UK, US & UAE",
      value: "Global"
    }
  ];

  const platformFeatures = [
    {
      title: "Creator Discovery & Matching",
      copy: "Match brands with creators based on audience, performance, and fit."
    },
    {
      title: "Creator Opportunities Hub",
      copy: "Creators discover and manage brand opportunities in one place."
    },
    {
      title: "Campaign & Brief Management",
      copy: "Centralised briefs, deliverables, timelines, and approvals."
    },
    {
      title: "Content Review & Approvals",
      copy: "Approve content, request revisions, and manage delivery without email threads."
    },
    {
      title: "Contracts, Usage & Rights Tracking",
      copy: "Keep licensing and usage terms clearly documented."
    },
    {
      title: "Payments & Monetisation Tracking",
      copy: "Track payouts, payment status, and creator earnings."
    },
    {
      title: "Performance & Reporting Dashboards",
      copy: "Monitor engagement and campaign results."
    }
  ];

  return (
    <>
      <style>
        {`
          @keyframes heroTitleSlide {
            0% {
              transform: translateY(30px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes logoMarquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          @keyframes loaderBar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(-10%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
      <div className="bg-[#f6efe7] text-slate-900">
        <section className="relative overflow-hidden border-b border-[#e6d8ca] bg-gradient-to-b from-[#f6efe7] via-[#f3e6dc] to-[#edded4]">
          <div className="pointer-events-none absolute inset-y-10 right-[-4%] hidden w-1/3 rounded-[32px] bg-gradient-to-b from-white/10 via-white/5 to-transparent blur-[60px] lg:block z-10" />
          <div className="pointer-events-none absolute left-[-5%] top-8 block h-64 w-64 rounded-[40px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.3),_rgba(255,255,255,0))] opacity-60 z-10" />
          <div className="relative z-20 mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 lg:flex-row lg:items-start">
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.45em] text-brand-red">
                  Operating across UK, US & UAE
                </p>
                <h1
                  className="font-display w-full text-[clamp(5.75rem,9vw,9.5rem)] font-semibold leading-[1.01] tracking-[0.15em] text-slate-900"
                  style={{ animation: "heroTitleSlide 1.2s ease-out forwards" }}
                >
                  THE PLATFORM FOR BRANDS AND CREATORS
                </h1>
                <p className="max-w-2xl text-sm text-slate-600">
                  Discover creator opportunities, match brands with the right creators, and run influencer campaigns on a single platform.
                </p>
                <p className="max-w-2xl text-sm text-slate-600">
                  Break combines a powerful creator marketing platform with hands-on execution - so campaigns don't just run, they deliver.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:flex-wrap">
                <Link
                  to="/signup"
                  className="w-full rounded-full border border-slate-300 bg-white px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.35em] text-slate-900 transition hover:border-brand-red hover:text-brand-red sm:w-auto"
                >
                  Create an account
                </Link>
                <Link
                  to="/creator"
                  className="w-full rounded-full border border-slate-300 bg-white px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.35em] text-slate-900 transition hover:border-brand-red hover:text-brand-red shadow-[0_6px_18px_rgba(0,0,0,0.05)] sm:w-auto"
                >
                  Apply as a creator
                </Link>
              </div>
            </div>
          </div>
        </section>

      <section className="border-b border-[#e6d8ca] bg-[#fffaf6] text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-xs uppercase tracking-[0.4em] text-brand-red">
            Trusted by brands, creators, and global teams running influencer campaigns across fashion, hospitality, fintech, and culture.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {trustStats.map((stat) => (
              <TrustStatCard key={stat.label} stat={stat} />
            ))}
          </div>
          <div className="relative mt-10 overflow-hidden rounded-3xl border border-[#e6d8ca] bg-white/70 px-4 py-5">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
            <div
              className="flex min-w-[200%] items-center gap-16"
              style={{ animation: "logoMarquee 28s linear infinite" }}
            >
              {[...clientLogos, ...clientLogos].map((client, idx) => (
                <div key={`${client.alt}-${idx}`} className="flex items-center justify-center opacity-80 transition hover:opacity-100">
                  <img
                    src={client.src}
                    alt={client.alt}
                    className="h-28 w-auto object-contain md:h-36 lg:h-40 xl:h-44 2xl:h-48"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e6d8ca] bg-white text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[32px] border border-slate-200 bg-[#fffefb] p-8 shadow-sm">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Brands & Agencies</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">Find, match, and run creator campaigns - with execution built in.</h2>
              <p className="mt-3 text-sm text-slate-600">
                Break helps brands discover creators, manage campaigns, and rely on expert operational support when needed.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-slate-400" />
                  <span>Matching and discovery powered by a creator platform that knows your audience.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-slate-400" />
                  <span>Control and visibility across briefs, approvals, and budgets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-slate-400" />
                  <span>Delivery and optimisation backed by Break's operations team.</span>
                </li>
              </ul>
              <Link
                to="/brand"
                className="mt-6 inline-flex rounded-full border border-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-900 transition hover:border-brand-red hover:text-brand-red"
              >
                Create a brand account
              </Link>
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-[#fdfbf8] p-8 shadow-sm">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Creators</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">Discover brand opportunities - backed by real operations.</h2>
              <p className="mt-3 text-sm text-slate-600">
                Break gives creators access to paid opportunities and long-term partnerships, with clear deals and structured delivery.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-slate-400" />
                  <span>Opportunity discovery curated through a creator management software lens.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-slate-400" />
                  <span>Deal clarity with rates, timelines, and usage in one view.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-slate-400" />
                  <span>Smooth delivery and payouts with execution support on standby.</span>
                </li>
              </ul>
              <Link
                to="/creator"
                className="mt-6 inline-flex rounded-full border border-slate-300 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-900 transition hover:border-brand-red hover:text-brand-red shadow-[0_6px_18px_rgba(0,0,0,0.05)]"
              >
                Apply as a creator
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e6d8ca] bg-[#fffaf6] text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Why Break</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Software-first. Execution-backed.</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Break is built for teams who want the efficiency of an influencer marketing platform and the reliability of a creator marketing agency.
          </p>
          <ul className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            {[
              "Platform-driven discovery and workflows",
              "Agency-led campaign operations",
              "Clear ownership across briefs, approvals, and delivery",
              "Fewer handoffs, fewer mistakes, better outcomes"
            ].map((item) => (
              <li
                key={item}
                className="rounded-3xl border border-slate-200 bg-white/90 px-4 py-3"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-[#e6d8ca] bg-white text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Platform tools & features</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Everything you need to run creator campaigns</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {platformFeatures.map((feature) => (
              <div key={feature.title} className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.copy}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Supported by Break's operations team when required.
          </p>
        </div>
      </section>

      <section className="border-b border-[#e6d8ca] bg-[#fffdf9] text-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center">
          <div className="flex-1 space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Case studies</p>
            <h2 className="text-3xl font-semibold">Creator campaigns, run properly.</h2>
            <p className="text-sm text-slate-600">
              These campaigns show how Break combines technology and operations to run creator partnerships at scale.
            </p>
          </div>
          <div className="flex flex-1 gap-4">
            <CaseStudy
              title="White-label hospitality brand for GCC luxury stays"
              subtitle="41 briefs · 10 hero edits · 18 days · Break owned ops, payments, and investor-ready launch."
              tag="Hospitality"
            />
            <CaseStudy
              title="AI finance creator brand, multi-market rollout"
              subtitle="7 creators · £320 CPA · 4-country bookings · Break matched talent, structured monetisation, and kept the rollout funded."
              tag="Fintech"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#1c1a17] text-white">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center space-y-6">
          <h2 className="text-3xl font-semibold">Ready to find the right partnership?</h2>
          <p className="text-sm text-white/70">
            Create an account to start discovering creators, finding brand opportunities, and running campaigns — with platform clarity and execution support.
          </p>
          <Link
            to="/signup"
            className="inline-flex rounded-full border border-white/40 px-8 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/10"
          >
            Create an account
          </Link>
          <p className="text-[0.8rem] uppercase tracking-[0.35em] text-white/60">
            Operating across UK, US &amp; UAE.
          </p>
        </div>
      </section>
    </div>
  </>
  );
}

export default App;

function useAnimatedCount(target, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!target) {
      setValue(0);
      return undefined;
    }

    let frameId;
    let start;

    const step = (timestamp) => {
      if (!start) {
        start = timestamp;
      }

      const progress = Math.min((timestamp - start) / duration, 1);
      const nextValue = Math.round(progress * target);
      setValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return value;
}

function TrustStatCard({ stat }) {
  const count = useAnimatedCount(stat.value ? 0 : stat.target);
  const displayValue = stat.value ?? `${count}${stat.suffix || ""}`;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 text-slate-900 shadow-sm">
      <p className="text-4xl font-semibold text-slate-900">{displayValue}</p>
      <p className="mt-2 text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">{stat.label}</p>
      <p className="mt-1 text-sm text-slate-500">{stat.detail}</p>
    </div>
  );
}

function CaseStudy({ title, subtitle, tag }) {
  return (
    <div className="flex-1 rounded-3xl border border-slate-200 bg-white/90 p-6 text-slate-900 shadow-sm">
      <div className="mb-4 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">
        <span className="rounded-full border border-slate-300 px-2 py-1">DATA</span>
        <span className="h-2 w-10 rounded-full border border-slate-300 bg-slate-100" />
      </div>
      <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{tag}</p>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      <div className="mt-4 flex items-center justify-between text-[0.6rem] text-slate-500">
        <span>Operations</span>
        <span className="h-1 w-16 rounded-full bg-brand-red/60" />
        <span>Investor-ready</span>
      </div>
    </div>
  );
}
