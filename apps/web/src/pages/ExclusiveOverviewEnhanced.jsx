import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "../components/Badge.jsx";
import { AiAssistantCard } from "../components/AiAssistantCard.jsx";
import {
  FirstTimeWelcome,
  SectionSkeleton,
  EmptyState,
  ErrorState,
  EventCard,
  RevenueCard,
  WellnessCheckin,
} from "../components/ExclusiveOverviewComponents.jsx";
import {
  useExclusiveTalentData,
  useEventActions,
  useWellnessCheckin,
  useAIAssistant,
} from "../hooks/useExclusiveTalentData.js";
import {
  calculateSectionPriority,
  getTodaysFocus,
  getEmptyStateMessage,
  shouldCollapseSection,
  getFocusCycleLabel,
  formatCreatorDate,
  getActionSignal,
} from "../utils/exclusiveOverviewHelpers.js";
import { TopPerformingPosts } from "../components/TopPerformingPosts.jsx";
import { GoalsProgressSummary } from "../components/GoalsProgressSummary.jsx";

/**
 * Exclusive Talent Overview Page
 * 
 * A calm, intelligent creative home base that:
 * - Shows what matters today, not everything
 * - Adapts section order based on urgency
 * - Protects focus and reduces anxiety
 * - Makes business side feel handled
 */
export function ExclusiveOverviewEnhanced({ session, basePath: basePathProp }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [goalsJustSet, setGoalsJustSet] = useState(false);
  const basePath =
    basePathProp ||
    (location.pathname.startsWith("/admin/view/exclusive") ? "/admin/view/exclusive" : "/exclusive");

  // Data fetching (non-blocking, independent sections)
  const { data, loading, error, isFirstTime, refresh } = useExclusiveTalentData(session);
  const { acceptEvent, declineEvent, processing } = useEventActions();
  const wellness = useWellnessCheckin();
  const aiAssistant = useAIAssistant();

  // First-time user flow
  useEffect(() => {
    if (isFirstTime && !welcomeDismissed) {
      setShowWelcome(true);
    }
  }, [isFirstTime, welcomeDismissed]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("break_exclusive_goals_just_set_v1");
      if (raw) setGoalsJustSet(true);
    } catch {
      // ignore
    }
  }, []);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    setWelcomeDismissed(true);
    // Mark onboarding as complete
    fetch("/exclusive/onboarding-complete", { method: "POST", credentials: "include" });
  };

  const handleWelcomeSkip = () => {
    setShowWelcome(false);
    setWelcomeDismissed(true);
  };

  // Dynamic section ordering
  const sectionPriority = calculateSectionPriority(data);
  const todaysFocus = getTodaysFocus(data);
  const focusCycle = getFocusCycleLabel();
  
  const firstName = session?.name?.split(" ")?.[0] || 
    session?.email?.split("@")?.[0]?.split(".")?.[0] || 
    "Creator";

  // Wellness check-in
  const handleWellnessSubmit = (wellnessData) => {
    wellness.submitCheckin(wellnessData);
    // Optionally send to backend
    fetch("/exclusive/wellness-checkin", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wellnessData),
    });
  };

  if (showWelcome) {
    return (
      <FirstTimeWelcome
        basePath={basePath}
        onComplete={handleWelcomeComplete}
        onSkip={handleWelcomeSkip}
      />
    );
  }

  return (
    <section id="exclusive-overview-enhanced" className="space-y-6">
      {/* Hero Section - Always visible */}
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
              Overview
            </p>
            <h2 className="font-display text-4xl uppercase text-brand-black">
              Hi {firstName}.
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{focusCycle}</Badge>
              <span className="text-sm text-brand-black/60">
                The business side is handled — you can stay focused on creating.
              </span>
            </div>
          </div>

          {/* Today's Focus */}
          <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-4 min-w-[300px]">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
              What matters today
            </p>
            <div className="mt-3 space-y-2">
              {todaysFocus.length > 0 ? (
                todaysFocus.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className={`mt-0.5 h-2 w-2 rounded-full ${
                      item.priority === "high" ? "bg-brand-red" : 
                      item.priority === "medium" ? "bg-yellow-500" : 
                      "bg-brand-black/20"
                    }`} />
                    <div>
                      <p className="text-sm font-semibold text-brand-black">
                        {item.action}
                      </p>
                      <p className="text-xs text-brand-black/70">{item.label}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-brand-black/70">
                  All caught up — enjoy the clear space
                </p>
              )}
            </div>
          </div>
        </div>

        {goalsJustSet && (
          <div className="mt-4 rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Goals saved</p>
                <p className="mt-1 text-sm text-brand-black/70">
                  Got it. We’ll tailor things around this. You can update goals anytime from your Overview or Settings.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`${basePath}/goals`)}
                  className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
                >
                  Review
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGoalsJustSet(false);
                    try {
                      localStorage.removeItem("break_exclusive_goals_just_set_v1");
                    } catch {
                      // ignore
                    }
                  }}
                  className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/70 hover:bg-brand-black/5"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4">
            <ErrorState message={error} onRetry={refresh} />
          </div>
        )}
      </section>

      {/* Top Performing Posts - Replaces Onboarding → CRM */}
      <TopPerformingPosts session={session} />

      {/* Goals Progress Summary */}
      <GoalsProgressSummary session={session} basePath={basePath} />

      {/* Wellness Check-in (Opt-in, weekly) */}
      {wellness.shouldShow && !loading && (
        <WellnessCheckin
          onSubmit={handleWellnessSubmit}
          onSnooze={wellness.snooze}
        />
      )}

      {/* Dynamic Sections - Ordered by priority */}
      {loading && (
        <section className="space-y-4">
          <SectionSkeleton rows={3} />
        </section>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {sectionPriority.map((section) => {
            // Skip collapsed sections
            if (shouldCollapseSection(section.id, data)) {
              return null;
            }

            switch (section.id) {
              case "events":
                return (
                  <EventsSection
                    key={section.id}
                    events={data.events}
                    highlight={section.highlight}
                    onAccept={acceptEvent}
                    onDecline={declineEvent}
                    processing={processing}
                    navigate={navigate}
                    basePath={basePath}
                  />
                );

              case "tasks":
                return (
                  <TasksSection
                    key={section.id}
                    tasks={data.tasks}
                    highlight={section.highlight}
                    navigate={navigate}
                    basePath={basePath}
                  />
                );

              case "opportunities":
                return (
                  <OpportunitiesSection
                    key={section.id}
                    opportunities={data.opportunities}
                    highlight={section.highlight}
                    navigate={navigate}
                    basePath={basePath}
                  />
                );

              case "projects":
                return (
                  <ProjectsSection
                    key={section.id}
                    projects={data.projects}
                    navigate={navigate}
                    basePath={basePath}
                  />
                );

              case "calendar":
                return (
                  <CalendarSection
                    key={section.id}
                    calendar={data.calendar}
                    navigate={navigate}
                    basePath={basePath}
                  />
                );

              case "insights":
                return (
                  <InsightsSection
                    key={section.id}
                    insights={data.insights}
                    basePath={basePath}
                  />
                );

              case "revenue":
                return (
                  <RevenueCard
                    key={section.id}
                    revenue={data.revenue}
                  />
                );

              case "ai-assistant":
                return (
                  <AISection
                    key={section.id}
                    session={session}
                    assistant={aiAssistant}
                  />
                );

              case "goals":
                return (
                  <GoalsSection
                    key={section.id}
                    goals={data.goals}
                    navigate={navigate}
                    basePath={basePath}
                  />
                );

              default:
                return null;
            }
          })}
        </div>
      )}
    </section>
  );
}

// ===========================
// Section Components
// ===========================

function EventsSection({ events, highlight, onAccept, onDecline, processing, navigate, basePath }) {
  const pendingEvents = events.filter(
    e => e.status === "pending_invite" || e.status === "suggested"
  );
  const confirmedEvents = events.filter(e => e.status === "confirmed");

  if (events.length === 0) {
    const emptyState = getEmptyStateMessage("events", { basePath });
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
          Events & invitations
        </p>
        <EmptyState {...emptyState} />
      </section>
    );
  }

  return (
    <section className={`rounded-3xl border ${
      highlight ? "border-brand-red shadow-lg" : "border-brand-black/10"
    } bg-brand-white p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
            Events & invitations
          </p>
          <h3 className="font-display text-2xl uppercase text-brand-black">
            Worth your time
          </h3>
          {highlight && (
            <p className="mt-1 text-sm font-semibold text-brand-red">
              Action needed
            </p>
          )}
        </div>
        <button
          onClick={() => navigate(`${basePath}/calendar`)}
          className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
        >
          View calendar
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {pendingEvents.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
              Pending response
            </p>
            {pendingEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onAccept={onAccept}
                onDecline={onDecline}
                processing={processing}
              />
            ))}
          </div>
        )}

        {confirmedEvents.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
              Confirmed
            </p>
            {confirmedEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onAccept={onAccept}
                onDecline={onDecline}
                processing={processing}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TasksSection({ tasks, highlight, navigate, basePath }) {
  const pendingTasks = tasks.filter(t => !t.completed);
  
  if (pendingTasks.length === 0) {
    const emptyState = getEmptyStateMessage("tasks", { basePath });
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
          Creative tasks
        </p>
        <EmptyState {...emptyState} />
      </section>
    );
  }

  return (
    <section className={`rounded-3xl border ${
      highlight ? "border-brand-red shadow-lg" : "border-brand-black/10"
    } bg-brand-white p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
            Creative tasks
          </p>
          <h3 className="font-display text-2xl uppercase text-brand-black">
            Action needed
          </h3>
          {highlight && (
            <p className="mt-1 text-sm text-brand-black/70">
              {pendingTasks.length} task{pendingTasks.length > 1 ? "s" : ""} due
            </p>
          )}
        </div>
        <button
          onClick={() => navigate(`${basePath}/tasks`)}
          className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
        >
          View all
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {pendingTasks.slice(0, 5).map(task => (
          <article
            key={task.id}
            className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-brand-black">{task.title}</p>
                <p className="mt-1 text-sm text-brand-black/70">{task.description}</p>
                {task.dueDate && (
                  <p className="mt-2 text-xs text-brand-black/60">
                    Due {formatCreatorDate(task.dueDate)}
                  </p>
                )}
              </div>
              {getActionSignal(task, "task") === "primary" && (
                <Badge tone="urgent">Due</Badge>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function OpportunitiesSection({ opportunities, highlight, navigate, basePath }) {
  const pending = opportunities.filter(o => o.awaitingYourInput);

  if (opportunities.length === 0) {
    const emptyState = getEmptyStateMessage("opportunities", { basePath });
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
          Opportunities
        </p>
        <EmptyState {...emptyState} />
      </section>
    );
  }

  return (
    <section className={`rounded-3xl border ${
      highlight ? "border-brand-red shadow-lg" : "border-brand-black/10"
    } bg-brand-white p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
            What's in motion
          </p>
          <h3 className="font-display text-2xl uppercase text-brand-black">
            Projects + opportunities
          </h3>
          <p className="mt-1 text-sm text-brand-black/60">
            Only what you need to do — no admin noise
          </p>
          {pending.length > 0 && (
            <p className="mt-1 text-sm text-brand-black/70">
              {pending.length} item{pending.length > 1 ? "s" : ""} need your input
            </p>
          )}
        </div>
        <button
          onClick={() => navigate(`${basePath}/opportunities`)}
          className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
        >
          View all
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {opportunities.slice(0, 4).map(opp => (
          <article
            key={opp.id}
            className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
                  {opp.type}
                </p>
                <p className="mt-1 font-semibold text-brand-black">{opp.brand}</p>
                <p className="text-sm text-brand-black/70">{opp.project}</p>
                {opp.yourNext && (
                  <p className="mt-2 text-sm text-brand-black/80">
                    <span className="font-semibold">You:</span> {opp.yourNext}
                  </p>
                )}
              </div>
              <Badge tone="neutral">{opp.status}</Badge>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigate(`${basePath}/opportunities/${opp.id}`)}
                className="rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]"
              >
                Open
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProjectsSection({ projects, navigate, basePath }) {
  if (projects.length === 0) {
    const emptyState = getEmptyStateMessage("projects", { basePath });
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
          Active projects
        </p>
        <EmptyState {...emptyState} />
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
            Active projects
          </p>
          <h3 className="font-display text-2xl uppercase text-brand-black">
            In progress
          </h3>
        </div>
        <button
          onClick={() => navigate(`${basePath}/projects`)}
          className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
        >
          View all
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(project => (
          <article
            key={project.id}
            className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4"
          >
            <Badge tone="neutral">{project.status}</Badge>
            <p className="mt-2 font-semibold text-brand-black">{project.name}</p>
            <p className="mt-1 text-sm text-brand-black/70">{project.brand}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CalendarSection({ calendar, navigate, basePath }) {
  const upcoming = calendar.slice(0, 3);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
            Calendar preview
          </p>
          <h3 className="font-display text-2xl uppercase text-brand-black">
            This week
          </h3>
          <p className="mt-1 text-sm text-brand-black/60">
            Key dates only: shoots, events, deadlines
          </p>
        </div>
        <button
          onClick={() => navigate(`${basePath}/calendar`)}
          className="rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
        >
          Open calendar
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {upcoming.map(item => (
          <div
            key={item.id}
            className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
              {formatCreatorDate(item.date)}
            </p>
            <p className="mt-1 font-semibold text-brand-black">{item.title}</p>
            <p className="mt-1 text-sm text-brand-black/70">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function InsightsSection({ insights, basePath }) {
  if (insights.length === 0) {
    const emptyState = getEmptyStateMessage("insights", { basePath });
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
          Performance insights
        </p>
        <EmptyState {...emptyState} />
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
        What's working
      </p>
      <h3 className="font-display text-2xl uppercase text-brand-black">
        High-level insights
      </h3>
      <p className="mt-1 text-sm text-brand-black/60">
        Themes, not dashboards
      </p>

      <div className="mt-4 space-y-3">
        {insights.map(insight => (
          <article
            key={insight.id}
            className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4"
          >
            <p className="font-semibold text-brand-black">{insight.title}</p>
            <p className="mt-1 text-sm text-brand-black/70">{insight.description}</p>
            {insight.suggestion && (
              <p className="mt-2 text-xs italic text-brand-black/60">
                💡 {insight.suggestion}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function AISection({ session, assistant }) {
  const suggestedPrompts = [
    "What content should I post this week?",
    "Suggest viral angles for my audience",
    "How can I balance work and rest this week?",
    "What hooks are working in my niche?"
  ];

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <AiAssistantCard
        session={session}
        role="exclusive"
        title="AI Assistant"
        description="Your creative partner — prompts, angles, and weekly planning"
      />
      
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestedPrompts.map(prompt => (
          <button
            key={prompt}
            onClick={() => assistant.sendPrompt(prompt)}
            disabled={assistant.loading}
            className="rounded-full border border-brand-black/20 bg-brand-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:bg-brand-black/5 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-brand-black/60">
        Ask for content ideas, hooks, scripts, and balance — not contracts or invoices.
      </p>
    </section>
  );
}

function GoalsSection({ goals, navigate, basePath }) {
  if (!goals) {
    const emptyState = getEmptyStateMessage("goals", { basePath });
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
          Your goals
        </p>
        <EmptyState {...emptyState} />
      </section>
    );
  }

  const isStoredGoals =
    Array.isArray(goals?.creativeIntentions) ||
    Array.isArray(goals?.supportAreas) ||
    Boolean(goals?.revenueRange) ||
    Boolean(goals?.commercialSkipped);

  if (isStoredGoals) {
    const creative = (goals.creativeIntentions || []).map((item) => item?.title || item?.id || item).filter(Boolean);
    const support = (goals.supportAreas || []).map((item) => item?.title || item?.id || item).filter(Boolean);
    const revenueLabel = goals?.revenueRange?.label || "";
    const commercialChecks = (goals.commercialChecks || []).map((item) => item?.label || item?.id || item).filter(Boolean);
    const commercialSkipped = Boolean(goals.commercialSkipped || goals?.revenueRange?.id === "prefer-not");

    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Your goals</p>
            <h3 className="font-display text-2xl uppercase text-brand-black">In this season</h3>
            <p className="mt-1 text-sm text-brand-black/60">Light context that helps your team support you better.</p>
          </div>
          <button
            onClick={() => navigate(`${basePath}/goals`)}
            className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
          >
            Update goals
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Creative direction</p>
            <p className="mt-2 text-sm text-brand-black/80">
              {creative.length ? creative.join(" • ") : "Not set yet"}
            </p>
          </div>
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Success (optional)</p>
            <p className="mt-2 text-sm text-brand-black/80">
              {commercialSkipped
                ? "Skipped"
                : revenueLabel
                  ? `${revenueLabel}${commercialChecks.length ? ` • ${commercialChecks.join(" • ")}` : ""}`
                  : commercialChecks.length
                    ? commercialChecks.join(" • ")
                    : "Not set (totally fine)"}
            </p>
          </div>
          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Support areas</p>
            <p className="mt-2 text-sm text-brand-black/80">
              {support.length ? support.join(" • ") : "Not set yet"}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-brand-black/60">
          You can revisit this anytime. Nothing here is a commitment.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
            Your goals
          </p>
          <h3 className="font-display text-2xl uppercase text-brand-black">
            Progress
          </h3>
          <p className="mt-1 text-sm text-brand-black/60">
            Personal and commercial, treated equally
          </p>
        </div>
        <button
          onClick={() => navigate(`${basePath}/goals`)}
          className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
        >
          Update goals
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {Object.entries(goals).map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold capitalize text-brand-black">
                {key.replace("_", " ")}
              </p>
              <p className="text-sm text-brand-black/60">
                {Math.round(value * 100)}%
              </p>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brand-black/10">
              <div
                className="h-full bg-brand-black"
                style={{ width: `${value * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
