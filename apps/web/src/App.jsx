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
import { Roles } from "./auth/session.js";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { RoleGate } from "./components/RoleGate.jsx";
import { Footer } from "./components/Footer.jsx";
import { Badge } from "./components/Badge.jsx";
import { UgcBoard } from "./components/UgcBoard.jsx";
import { DashboardShell } from "./components/DashboardShell.jsx";
import { LogoWordmark } from "./components/LogoWordmark.jsx";
import { resourceItems as RESOURCE_ITEMS, questionnaires as QUESTIONNAIRES } from "./data/platform.js";
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
  ExclusiveCalendarPage,
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
import { AdminQueuesPage } from "./pages/AdminQueuesPage.jsx";
import { AdminApprovalsPage } from "./pages/AdminApprovalsPage.jsx";
import { AdminUsersPage } from "./pages/AdminUsersPage.jsx";
import AdminTasksPage from "./pages/AdminTasksPage.jsx";
import AdminCalendarPage from "./pages/AdminCalendarPage.jsx";
import { AdminMessagingPage } from "./pages/AdminMessagingPage.jsx";
import { AdminContractsPage } from "./pages/AdminContractsPage.jsx";
import { AdminFinancePage } from "./pages/AdminFinancePage.jsx";
import { AdminSettingsPage } from "./pages/AdminSettingsPage.jsx";
import { AdminUserFeedPage } from "./pages/AdminUserFeedPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { MessagingContext, useMessaging } from "./context/messaging.js";
import { useRemoteMessaging } from "./hooks/useRemoteMessaging.js";
import { useAuth } from "./context/AuthContext.jsx";

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

const SIMULATED_ALERT_SCENARIOS = [
  { title: "Task due", detail: "Creator storyboard needs review within 4 hours.", type: "task" },
  { title: "Brief update", detail: "Luxury travel drop brief received a revision.", type: "brief" },
  { title: "Approval needed", detail: "Finance wants confirmation before releasing payouts.", type: "finance" },
  { title: "System notice", detail: "Webhooks delayed—falling back to polling for 30s.", type: "system" }
];

const SIMULATED_INCOMING_PINGS = [
  {
    body: "Dropping the latest storyboard link here—let me know if legal needs adjustments.",
    attachments: [{ id: "att-storyboard", label: "Storyboard_v3.pdf", type: "pdf" }]
  },
  { body: "Any update on the paid media CTA lock? We are queued to post tomorrow.", attachments: [] },
  { body: "Travel team confirmed availability for next week. Need ticketing info.", attachments: [] },
  {
    body: "Uploading product shots tonight. Prefer Google Drive or Break drive?",
    attachments: [{ id: "att-drive", label: "Drive link", type: "link" }]
  },
  { body: "Reminder: hero edit still waiting for approvals before we can post.", attachments: [] }
];

function createMessage({ id, sender, senderRole, body, timestamp = Date.now(), attachments = [], readBy = [] }) {
  return {
    id: id || `msg-${timestamp}`,
    sender,
    senderRole,
    body,
    timestamp,
    attachments,
    readBy
  };
}

const NOW = Date.now();

const INITIAL_THREADS = [
  {
    id: "thread-creators-feedback",
    subject: "Opportunities board feedback",
    persona: "Creators",
    participants: ["ugc@creator.com", DEFAULT_ACTOR_EMAIL],
    tags: ["UGC", "Pipeline"],
    lastUpdated: NOW - 1000 * 60 * 30,
    messages: [
      createMessage({
        id: "msg-creators-1",
        sender: "ugc@creator.com",
        senderRole: "Creator",
        body: "Thanks for the notes—I'll revise the draft tonight.",
        timestamp: NOW - 1000 * 60 * 55,
        attachments: [{ id: "att-ugc-1", label: "UGC-draft.mov", type: "video" }],
        readBy: []
      }),
      createMessage({
        id: "msg-creators-2",
        sender: DEFAULT_ACTOR_EMAIL,
        senderRole: "Admin",
        body: "Appreciate the quick turnaround—flag once the revised cut is ready and we can route approvals.",
        timestamp: NOW - 1000 * 60 * 32,
        attachments: [],
        readBy: [DEFAULT_ACTOR_EMAIL]
      })
    ]
  },
  {
    id: "thread-brand-budget",
    subject: "Budget confirmation",
    persona: "Brands",
    participants: ["brand@client.com", DEFAULT_ACTOR_EMAIL],
    tags: ["Finance", "Campaign"],
    lastUpdated: NOW - 1000 * 60 * 90,
    messages: [
      createMessage({
        id: "msg-brand-1",
        sender: "brand@client.com",
        senderRole: "Brand",
        body: "Confirming the new £45k cap for paid media plus organic boost.",
        timestamp: NOW - 1000 * 60 * 120,
        attachments: [{ id: "att-budget", label: "Budget.xlsx", type: "sheet" }],
        readBy: []
      }),
      createMessage({
        id: "msg-brand-2",
        sender: DEFAULT_ACTOR_EMAIL,
        senderRole: "Admin",
        body: "Logged and shared with finance—once creator invoices hit we will reconcile automatically.",
        timestamp: NOW - 1000 * 60 * 95,
        readBy: [DEFAULT_ACTOR_EMAIL]
      })
    ]
  },
  {
    id: "thread-roster-onboarding",
    subject: "Roster onboarding",
    persona: "Talent Managers",
    participants: ["manager@breaktalent.com", DEFAULT_ACTOR_EMAIL],
    tags: ["Onboarding"],
    lastUpdated: NOW - 1000 * 60 * 15,
    messages: [
      createMessage({
        id: "msg-onboard-1",
        sender: "manager@breaktalent.com",
        senderRole: "Talent Manager",
        body: "Need a quick check on the exclusivity clause before I sign.",
        timestamp: NOW - 1000 * 60 * 25,
        attachments: [{ id: "att-contract", label: "Exclusivity.pdf", type: "pdf" }],
        readBy: []
      }),
      createMessage({
        id: "msg-onboard-2",
        sender: DEFAULT_ACTOR_EMAIL,
        senderRole: "Admin",
        body: "Clause 4.1 only applies to fintech verticals—happy to hop on a call if helpful.",
        timestamp: NOW - 1000 * 60 * 15,
        readBy: [DEFAULT_ACTOR_EMAIL]
      })
    ]
  }
];

const INITIAL_ALERTS = [
  { id: "alert-brief", title: "Brief update", detail: "AI banking launch brief moved to Approvals.", type: "brief", timestamp: NOW - 1000 * 60 * 90 },
  { id: "alert-task", title: "Task due", detail: "Exclusive Creator owes draft edits at 18:00 GMT.", type: "task", timestamp: NOW - 1000 * 60 * 20 }
];

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
  const { user: session, loading: authLoading, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [threads, setThreads] = useState(INITIAL_THREADS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const remoteMessaging = useRemoteMessaging(session);
  const isRemoteMessagingEnabled = remoteMessaging.enabled;

  useEffect(() => {
    if (session && authModalOpen) {
      setAuthModalOpen(false);
    }
  }, [session, authModalOpen]);

  const currentActor = session?.email || DEFAULT_ACTOR_EMAIL;
  const actorRole = session?.roles?.[0] || Roles.ADMIN;

  const threadSource = isRemoteMessagingEnabled ? remoteMessaging.threads : threads;
  const messagingConnectionStatus = isRemoteMessagingEnabled ? remoteMessaging.connectionStatus : connectionStatus;

  const handleSignOut = () => {
    logout();
  };

  const addMessage = useCallback(
    (entry) => {
      if (isRemoteMessagingEnabled) return;
      setThreads((prev) => {
        const timestamp = Date.now();
        const sender = entry.participants?.[0] || entry.email || "external@breakagency.com";
        const starterMessage = createMessage({
          sender,
          senderRole: entry.persona || "External",
          body: entry.preview || entry.body || entry.message || "New inquiry received.",
          attachments: entry.attachments || [],
          timestamp,
          readBy: []
        });
        const newThread = {
          id: `thread-${timestamp}`,
          subject: entry.subject || "External inquiry",
          persona: entry.persona || "External",
          participants: entry.participants || [sender, currentActor],
          tags: entry.tags || ["Inbound"],
          lastUpdated: timestamp,
          messages: [starterMessage]
        };
        return [newThread, ...prev];
      });
    },
    [currentActor, isRemoteMessagingEnabled]
  );

  const sendMessage = useCallback(
    async (threadId, payload) => {
      const actor = payload?.sender || currentActor;
      const role = payload?.senderRole || actorRole || "Admin";
      const body = payload?.body?.trim();
      if (!threadId || !body) return;
      if (isRemoteMessagingEnabled) {
        await remoteMessaging.sendMessage(threadId, payload);
        return;
      }
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== threadId) return thread;
          const timestamp = Date.now();
          const outgoing = createMessage({
            sender: actor,
            senderRole: role,
            body,
            attachments: payload.attachments || [],
            timestamp,
            readBy: [actor]
          });
          return {
            ...thread,
            messages: [...thread.messages, outgoing],
            lastUpdated: timestamp
          };
        })
      );
    },
    [actorRole, currentActor, isRemoteMessagingEnabled, remoteMessaging]
  );

  const markThreadRead = useCallback(
    async (threadId, actor = currentActor) => {
      if (!threadId || !actor) return;
      if (isRemoteMessagingEnabled) {
        await remoteMessaging.markThreadRead(threadId);
        return;
      }
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== threadId) return thread;
          const updatedMessages = thread.messages.map((message) =>
            message.readBy.includes(actor) ? message : { ...message, readBy: [...message.readBy, actor] }
          );
          return { ...thread, messages: updatedMessages };
        })
      );
    },
    [currentActor, isRemoteMessagingEnabled, remoteMessaging]
  );

  useEffect(() => {
    if (isRemoteMessagingEnabled) return;
    const interval = setInterval(() => {
      setConnectionStatus("syncing");
      setTimeout(() => {
        setThreads((prev) => {
          if (!prev.length) return prev;
          const targetIndex = Math.floor(Math.random() * prev.length);
          const ping = SIMULATED_INCOMING_PINGS[Math.floor(Math.random() * SIMULATED_INCOMING_PINGS.length)];
          const timestamp = Date.now();
          return prev.map((thread, index) => {
            if (index !== targetIndex) return thread;
            const incoming = createMessage({
              sender: thread.participants[0],
              senderRole: thread.persona,
              body: ping.body,
              attachments: ping.attachments || [],
              timestamp,
              readBy: []
            });
            return {
              ...thread,
              messages: [...thread.messages, incoming],
              lastUpdated: timestamp
            };
          });
        });
        setAlerts((prev) => {
          const scenario = SIMULATED_ALERT_SCENARIOS[Math.floor(Math.random() * SIMULATED_ALERT_SCENARIOS.length)];
          const entry = { ...scenario, id: `alert-${Date.now()}`, timestamp: Date.now() };
          return [entry, ...prev].slice(0, 6);
        });
        setConnectionStatus("connected");
      }, 700);
    }, 25000);
    return () => clearInterval(interval);
  }, [isRemoteMessagingEnabled]);

  const messagingValue = useMemo(
    () => ({
      messages: threadSource,
      threads: threadSource,
      addMessage,
      sendMessage,
      markThreadRead,
      templates: MESSAGE_TEMPLATES,
      alerts,
      connectionStatus: messagingConnectionStatus,
      currentUser: currentActor
    }),
    [threadSource, addMessage, sendMessage, markThreadRead, alerts, messagingConnectionStatus, currentActor]
  );

  return (
    <MessagingContext.Provider value={messagingValue}>
      <BrowserRouter>
        <AppRoutes
          session={session}
          authModalOpen={authModalOpen}
          setAuthModalOpen={setAuthModalOpen}
          handleSignOut={handleSignOut}
          authLoading={authLoading}
        />
      </BrowserRouter>
    </MessagingContext.Provider>
  );
}

function AppRoutes({ session, authModalOpen, setAuthModalOpen, handleSignOut, authLoading }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && session?.roles?.includes(Roles.ADMIN) && location.pathname === "/") {
      navigate("/admin/dashboard");
    }
  }, [session, authLoading, location.pathname, navigate]);

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
          path="/onboarding"
          element={
            <ProtectedRoute session={session}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brand"
          element={<BrandEntryPage onRequestSignIn={() => setAuthModalOpen(true)} />}
        />
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
              allowed={session?.roles?.length ? session.roles : [Roles.ADMIN, Roles.BRAND, Roles.CREATOR, Roles.TALENT_MANAGER]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <ProfilePage session={session} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/creator/dashboard"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.CREATOR, Roles.ADMIN, Roles.EXCLUSIVE_TALENT, Roles.UGC]}
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
              allowed={[Roles.BRAND, Roles.ADMIN]}
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
              <RoleGate session={session} allowed={[Roles.ADMIN, Roles.AGENT, Roles.BRAND]}>
                <BrandOpportunitiesPage />
              </RoleGate>
            }
          />
          <Route
            path="contracts"
            element={
              <RoleGate session={session} allowed={[Roles.BRAND, Roles.ADMIN, Roles.AGENT]}>
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
              allowed={[Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminDashboard session={session} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tasks"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN]}
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
              allowed={[Roles.ADMIN]}
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
              allowed={[Roles.ADMIN]}
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
              <AdminApprovalsPage session={session} />
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
              allowed={[
                Roles.ADMIN,
                Roles.AGENT,
                Roles.BRAND,
                Roles.CREATOR,
                Roles.EXCLUSIVE_TALENT,
                Roles.UGC,
                Roles.FOUNDER
              ]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminMessagingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/contracts"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.AGENT]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminContractsPage session={session} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/finance"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN, Roles.FOUNDER]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <AdminFinancePage session={session} />
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
          path="/admin/view/brand/*"
          element={
            <ProtectedRoute
              session={session}
              allowed={[Roles.ADMIN]}
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
              <RoleGate session={session} allowed={[Roles.ADMIN, Roles.AGENT]}>
                <BrandOpportunitiesPage />
              </RoleGate>
            }
          />
          <Route
            path="contracts"
            element={
              <RoleGate session={session} allowed={[Roles.ADMIN, Roles.AGENT]}>
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
              allowed={[Roles.ADMIN]}
              onRequestSignIn={() => setAuthModalOpen(true)}
            >
              <ExclusiveTalentDashboardLayout basePath="/admin/view/exclusive" session={session} />
            </ProtectedRoute>
          }
        >
          <Route index element={<ExclusiveOverviewPage />} />
          <Route path="profile" element={<ExclusiveProfilePage />} />
          <Route path="socials" element={<ExclusiveSocialsPage />} />
          <Route path="campaigns" element={<ExclusiveCampaignsPage />} />
          <Route path="calendar" element={<ExclusiveCalendarPage />} />
          <Route path="projects" element={<ExclusiveProjectsPage />} />
          <Route
            path="opportunities"
            element={
              <RoleGate session={session} allowed={[Roles.ADMIN, Roles.AGENT]}>
                <ExclusiveOpportunitiesPage />
              </RoleGate>
            }
          />
          <Route path="tasks" element={<ExclusiveTasksPage />} />
          <Route
            path="contracts"
            element={
              <RoleGate session={session} allowed={[Roles.ADMIN, Roles.AGENT]}>
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
                allowed={[Roles.ADMIN]}
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
  if (session.roles?.includes(Roles.ADMIN) || session.roles?.includes(Roles.TALENT_MANAGER)) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (session.roles?.includes(Roles.BRAND)) {
    return <Navigate to="/brand/dashboard" replace />;
  }
  if (
    session.roles?.some((role) =>
      [Roles.EXCLUSIVE_TALENT, Roles.CREATOR, Roles.UGC].includes(role)
    )
  ) {
    return <Navigate to="/creator/dashboard" replace />;
  }
  return <Navigate to="/" replace />;
}

function SiteChrome({ session, onRequestSignIn, onSignOut }) {
  const location = useLocation();
  const isPublicResource = location.pathname.startsWith("/resource-hub");
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const isAdmin = session?.roles?.includes(Roles.ADMIN);
  const navigate = useNavigate();
  const navSplitIndex = Math.ceil(NAV_LINKS.length / 2);
  const navLeft = NAV_LINKS.slice(0, navSplitIndex);
  const navRight = NAV_LINKS.slice(navSplitIndex);

  const renderNavItem = (item) =>
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
    );

  useEffect(() => {
    if (!isAdmin) {
      setAdminMenuOpen(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    setAdminMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-brand-white/10 bg-brand-black/95 text-brand-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2" aria-label="The Break Co. home">
          <LogoWordmark variant="light" className="h-8 w-auto" />
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
          {navLeft.map(renderNavItem)}
          <LogoWordmark variant="mark" className="h-9 w-9 opacity-90" aria-hidden="true" />
          {navRight.map(renderNavItem)}
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
                    onClick={() => setAdminMenuOpen((prev) => !prev)}
                    className="rounded-full border border-brand-red px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-brand-red hover:bg-brand-red/10"
                  >
                    {session.email?.split("@")[0]?.split(".")[0] || "Admin"}
                  </button>
                  {adminMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-brand-black/10 bg-brand-white p-3 text-brand-black shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
                      <div>
                        <p className="px-4 pb-2 text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-brand-black/50">
                          Control room
                        </p>
                        {[
                          { to: "/admin/dashboard", label: "Overview" },
                          { to: "/admin/activity", label: "Activity" },
                          { to: "/admin/queues", label: "Queues" },
                          { to: "/admin/approvals", label: "Approvals" },
                          { to: "/admin/users", label: "Users" },
                          { to: "/admin/messaging", label: "Messaging" },
                          { to: "/admin/finance", label: "Finance" },
                          { to: "/admin/settings", label: "Settings" }
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
                      <div className="mt-3 border-t border-brand-black/10 pt-3">
                        <p className="px-4 pb-2 text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-brand-black/50">
                          View as
                        </p>
                        {[
                          { to: "/admin/view/brand", label: "Brand preview" },
                          { to: "/admin/view/talent", label: "Talent preview" },
                          { to: "/admin/view/exclusive", label: "Exclusive talent preview" },
                          { to: "/admin/view/ugc", label: "UGC talent preview" },
                          { to: "/admin/view/founder", label: "Founder view" }
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
                    </div>
                  )}
                </div>
              )}
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
  const { addMessage } = useMessaging();
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState("");
  const heroStats = [
    {
      title: "Creators vetted",
      detail: "Across 18 markets & diasporas",
      target: 450,
      suffix: "+"
    },
    {
      title: "Campaigns shipped",
      detail: "Executed in the last 12 months",
      target: 120,
      suffix: "+"
    },
    {
      title: "Avg. brief turn",
      detail: "Intake to shortlist",
      target: 72,
      suffix: "h"
    }
  ];

  const handleContactSubmit = (event) => {
    event.preventDefault();
    if (!contactForm.email || !contactForm.message) {
      setContactStatus("Please share an email and message.");
      return;
    }
    addMessage({
      subject: `Contact from ${contactForm.name || contactForm.email}`,
      persona: "External",
      participants: [contactForm.email],
      preview: contactForm.message
    });
    setContactStatus("Message sent. We'll reply shortly.");
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="bg-brand-linen text-brand-black">
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl space-y-8 rounded-[48px] bg-brand-white p-10 text-center shadow-[0_25px_90px_rgba(0,0,0,0.08)]">
          <div className="space-y-4">
            <p className="font-subtitle text-sm uppercase tracking-[0.4em] text-brand-red">// Break Console</p>
            <h1 className="font-display text-5xl uppercase leading-tight">
              <span className="inline-flex h-1 w-12 rounded-full bg-brand-red align-[0.3em]" />
              <span className="ml-3 align-middle">A modern control room for talent, brands, and culture.</span>
            </h1>
            <p className="text-base text-brand-black/70">
              Break is the premium operating system for creators, managers, and brand leaders. One console manages briefs,
              AI prep, approvals, and payouts so every launch feels deliberate and fast.
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

      <section id="mission" className="px-6 pb-16">
        <div className="mx-auto max-w-6xl space-y-8 rounded-[48px] bg-brand-white p-10 shadow-[0_25px_90px_rgba(0,0,0,0.08)]">
          <div className="space-y-3 text-center">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Why this exists</p>
            <h2 className="font-display text-5xl uppercase">
              <span className="inline-flex h-1 w-10 rounded-full bg-brand-red align-[0.35em]" />
              <span className="ml-3 align-middle">Modern infrastructure for creative economies</span>
            </h2>
            <p className="text-brand-black/70">
              We designed Break so premium creators and growth-minded brands can operate inside one calm, accountable workflow.
            </p>
          </div>
          <div className="grid gap-6 text-left md:grid-cols-3">
            {MISSION_POINTS.map((point) => (
              <article key={point.title} className="rounded-[32px] border border-brand-black/10 bg-brand-linen/60 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{point.title}</p>
                <p className="mt-3 text-sm text-brand-black/70">{point.body}</p>
              </article>
            ))}
          </div>
          <p className="text-center text-xs font-subtitle uppercase tracking-[0.3em] text-brand-black/60">
            Trusted across hospitality · fintech · retail · culture
          </p>
        </div>
      </section>

      <section id="how-it-works" className="px-6 pb-16">
        <div className="mx-auto max-w-6xl space-y-8 rounded-[48px] bg-brand-white p-10 shadow-[0_25px_90px_rgba(0,0,0,0.08)]">
          <div className="space-y-3 text-center">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">How it works</p>
            <h2 className="font-display text-5xl uppercase">
              <span className="inline-flex h-1 w-10 rounded-full bg-brand-red align-[0.35em]" />
              <span className="ml-3 align-middle">Clarity from intake to reporting</span>
            </h2>
            <p className="text-brand-black/70">
              Each program follows the same premium workflow so every stakeholder knows what happens next.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <article key={step.title} className="rounded-[32px] border border-brand-black/10 bg-brand-linen/60 p-6 text-left shadow-[0_12px_50px_rgba(0,0,0,0.08)]">
                <h3 className="font-display text-2xl uppercase">{step.title}</h3>
                <p className="mt-3 text-sm text-brand-black/70">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl space-y-10 rounded-[48px] bg-brand-white p-10 text-center shadow-[0_25px_90px_rgba(0,0,0,0.08)]">
          <div className="space-y-2">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">For creators & talent</p>
            <h2 className="font-display text-5xl uppercase">
              <span className="inline-flex h-1 w-10 rounded-full bg-brand-red align-[0.35em]" />
              <span className="ml-3 align-middle">Two lanes, one premium console</span>
            </h2>
            <p className="text-brand-black/70">
              Select the service that matches your runway. Break handles onboarding, AI prep, negotiation, and finance
              while you stay focused on the work and the audience.
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

      <section id="solutions" className="px-6 pb-16">
        <div className="mx-auto max-w-6xl space-y-10 rounded-[48px] bg-brand-white p-10 shadow-[0_25px_90px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Solutions</p>
              <h2 className="font-display text-5xl uppercase">
                <span className="inline-flex h-1 w-10 rounded-full bg-brand-red align-[0.35em]" />
                <span className="ml-3 align-middle">Everything in one operating layer</span>
              </h2>
              <p className="text-sm text-brand-black/70">
                Marketplace → curated rosters, opportunities board, approvals, payouts. Workflows → structured questionnaires, AI pre-reads,
                deliverable tracking. Intelligence → case studies, retros, and financial transparency.
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
        <div className="mx-auto max-w-6xl space-y-10 rounded-[48px] bg-brand-white p-10 shadow-[0_25px_90px_rgba(0,0,0,0.08)]">
          <div className="text-center">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Pricing preview</p>
            <h2 className="font-display text-5xl uppercase">
              <span className="inline-flex h-1 w-10 rounded-full bg-brand-red align-[0.35em]" />
              <span className="ml-3 align-middle">Engagements built around outcomes</span>
            </h2>
            <p className="text-sm text-brand-black/70">
              Every scope receives a custom proposal. Here is how typical partners engage with Break.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PRICING_PREVIEW.map((plan) => (
              <article key={plan.title} className="rounded-[32px] border border-brand-black/10 bg-brand-linen/70 p-6 text-left shadow-[0_12px_50px_rgba(0,0,0,0.08)]">
                <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{plan.title}</p>
                <p className="mt-2 text-lg font-semibold text-brand-black">{plan.price}</p>
                <p className="mt-3 text-sm text-brand-black/70">{plan.detail}</p>
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
            Secure access to the dashboard to view briefs, submit to the Opportunities board, or open a brand request. White-glove onboarding in under three days.
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

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl space-y-6 rounded-[48px] bg-brand-white p-10 shadow-[0_25px_90px_rgba(0,0,0,0.08)]">
          <div className="text-center">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">FAQs</p>
            <h2 className="font-display text-5xl uppercase">
              <span className="inline-flex h-1 w-10 rounded-full bg-brand-red align-[0.35em]" />
              <span className="ml-3 align-middle">Clarity before you log in</span>
            </h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((item) => (
              <article key={item.question} className="rounded-[24px] border border-brand-black/10 bg-brand-linen/60 p-6 text-left shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                <h3 className="font-subtitle text-sm uppercase tracking-[0.35em] text-brand-red">{item.question}</h3>
                <p className="mt-3 text-sm text-brand-black/70">{item.answer}</p>
              </article>
            ))}
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
              <form className="space-y-3" onSubmit={handleContactSubmit}>
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full rounded-full border border-brand-black/10 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                  value={contactForm.name}
                  onChange={(e) => {
                    setContactStatus("");
                    setContactForm((prev) => ({ ...prev, name: e.target.value }));
                  }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full rounded-full border border-brand-black/10 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                  value={contactForm.email}
                  onChange={(e) => {
                    setContactStatus("");
                    setContactForm((prev) => ({ ...prev, email: e.target.value }));
                  }}
                />
                <textarea
                  placeholder="Tell us what you need"
                  rows={3}
                  className="w-full rounded-3xl border border-brand-black/10 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                  value={contactForm.message}
                  onChange={(e) => {
                    setContactStatus("");
                    setContactForm((prev) => ({ ...prev, message: e.target.value }));
                  }}
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-brand-black px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
                >
                  Send message
                </button>
                {contactStatus ? (
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-red">{contactStatus}</p>
                ) : null}
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
            <span className="ml-3 align-middle">Explore opportunities, create your profile, join campaigns.</span>
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
              href="#opportunities-board"
              className="rounded-full border border-brand-black/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
            >
              Browse opportunities
            </a>
          </div>
        </div>
      </section>
      <section id="opportunities-board" className="mx-auto max-w-6xl px-6 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-4xl uppercase">Opportunities board</h2>
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
              <li>• Opportunities board with autofill + priority briefs.</li>
            </ul>
          </div>
        </div>
      </section>
      <section className="border-t border-brand-black/10 bg-brand-white">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-6">
          <h3 className="font-display text-3xl uppercase">Questionnaire preview</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="rounded-3xl border border-brand-black/10 bg-brand-linen/60 p-4 text-xs uppercase tracking-[0.3em] text-brand-black/60">
              Revenue target
              <input
                type="number"
                placeholder="£120000"
                className="mt-2 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm text-brand-black focus:border-brand-black focus:outline-none"
              />
            </label>
            <label className="rounded-3xl border border-brand-black/10 bg-brand-linen/60 p-4 text-xs uppercase tracking-[0.3em] text-brand-black/60">
              Affiliate linking
              <select className="mt-2 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm text-brand-black focus:border-brand-black focus:outline-none">
                <option>Yes</option>
                <option>No</option>
                <option>Open to it</option>
              </select>
            </label>
          </div>
          <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Platforms</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-brand-black/80">
              {["Instagram", "TikTok", "YouTube", "Newsletter", "Pinterest"].map((platform) => (
                <span key={platform} className="rounded-full border border-brand-black/20 px-3 py-1 text-xs uppercase tracking-[0.3em]">
                  {platform}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/60 p-4">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Gaps analysis</p>
              <ul className="mt-3 space-y-2 text-sm text-brand-black/70">
                <li>• Missing affiliate integrations.</li>
                <li>• Add finance case studies to media kit.</li>
                <li>• Post cadence dips on weekends.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/60 p-4">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Quick wins</p>
              <ul className="mt-3 space-y-2 text-sm text-brand-black/70">
                <li>• Enable auto-invoice for opportunities board submissions.</li>
                <li>• Refresh travel pitch template with luxury-inclusivity proof points.</li>
                <li>• Publish one long-form video per month.</li>
              </ul>
            </div>
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
            the dashboard to manage campaigns. Opportunities board stays creator-side only.
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
            creation stays brand-only, opportunities routing happens automatically to approved creators.
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
      <section className="border-t border-brand-black/10 bg-brand-white">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-6">
          <h3 className="font-display text-3xl uppercase">Onboarding preview</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="rounded-3xl border border-brand-black/10 bg-brand-linen/60 p-4 text-xs uppercase tracking-[0.3em] text-brand-black/60">
              Account details
              <input
                placeholder="Brand legal name"
                className="mt-2 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm text-brand-black focus:border-brand-black focus:outline-none"
              />
            </label>
            <label className="rounded-3xl border border-brand-black/10 bg-brand-linen/60 p-4 text-xs uppercase tracking-[0.3em] text-brand-black/60">
              Bank details (IBAN / ACH)
              <input
                placeholder="GB00 BUKB 1234 5678"
                className="mt-2 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm text-brand-black focus:border-brand-black focus:outline-none"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="rounded-3xl border border-brand-black/10 bg-brand-linen/60 p-4 text-xs uppercase tracking-[0.3em] text-brand-black/60">
              Retainer type
              <select className="mt-2 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm text-brand-black focus:border-brand-black focus:outline-none">
                <option>3-month retainer (default)</option>
                <option>6-month retainer</option>
                <option>12-month retainer</option>
              </select>
            </label>
            <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Talent application</p>
              <p className="mt-2 text-sm text-brand-black/70">
                Only 12 spaces per year. Brands apply, creators self-identify — we never rewrite how talent describes themselves.
              </p>
              <button className="mt-4 w-full rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]">
                Submit info
              </button>
            </div>
          </div>
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
