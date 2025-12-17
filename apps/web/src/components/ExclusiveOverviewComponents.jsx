import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/Badge.jsx";

/**
 * First-time user onboarding overlay
 */
export function FirstTimeWelcome({ onComplete, onSkip, basePath = "/exclusive" }) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const navigate = useNavigate();

  const steps = [
    {
      title: "Let's get you set up",
      description: "A quick tour to help you get the most out of your exclusive experience.",
      action: "Start",
      icon: "🎯",
      link: null
    },
    {
      title: "Connect your socials",
      description: "Link Instagram, TikTok, and YouTube so we can track your performance and suggest content ideas.",
      action: "Open socials",
      link: `${basePath}/socials`,
      icon: "📱"
    },
    {
      title: "Set your goals",
      description: "Define what success means to you — whether it's creative freedom, revenue targets, or work-life balance.",
      action: "Open goals",
      link: `${basePath}/goals`,
      icon: "⭐"
    }
  ];

  const currentStep = steps[step - 1];

  const handlePrimary = () => {
    if (currentStep.link) {
      onSkip();
      navigate(currentStep.link);
      return;
    }
    if (step < totalSteps) setStep(step + 1);
    else onComplete();
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-[36px] border border-brand-black/10 bg-brand-white p-8 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <div className="text-center">
          <div className="text-6xl mb-4">{currentStep.icon}</div>
          <h2 className="font-display text-3xl uppercase text-brand-black">
            {currentStep.title}
          </h2>
          <p className="mt-4 text-brand-black/70">
            {currentStep.description}
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition ${
                i + 1 === step ? "bg-brand-red" : "bg-brand-black/20"
              }`}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-between gap-3">
          <button
            onClick={onSkip}
            className="rounded-full border border-brand-black/20 px-6 py-3 text-xs uppercase tracking-[0.3em] text-brand-black/60"
          >
            Skip for now
          </button>
          <div className="flex gap-2">
            {currentStep.link ? (
              <button
                onClick={handleNext}
                className="rounded-full border border-brand-black/20 px-6 py-3 text-xs uppercase tracking-[0.3em] text-brand-black/70 hover:bg-brand-black/5"
              >
                Not now
              </button>
            ) : null}
            <button
              onClick={handlePrimary}
              className="rounded-full bg-brand-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
            >
              {currentStep.action}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Section loading skeleton
 */
export function SectionSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
          <div className="h-4 w-1/3 bg-brand-black/10 rounded"></div>
          <div className="mt-2 h-3 w-2/3 bg-brand-black/10 rounded"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state component
 */
export function EmptyState({ title, description, action }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-6 text-center">
      <p className="font-semibold text-brand-black">{title}</p>
      <p className="mt-2 text-sm text-brand-black/70">{description}</p>
      {action && (
        <button
          onClick={() => navigate(action.to)}
          className="mt-4 rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Error state component (friendly, no technical details)
 */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-6 text-center">
      <p className="font-semibold text-brand-black">Just a moment</p>
      <p className="mt-2 text-sm text-brand-black/70">
        {message || "We're refreshing your data — check back shortly."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
        >
          Refresh
        </button>
      )}
    </div>
  );
}

/**
 * Event card with accept/decline actions
 */
export function EventCard({ event, onAccept, onDecline, processing }) {
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [feedback, setFeedback] = useState(null);

  const handleAccept = async () => {
    const result = await onAccept(event.id);
    setFeedback(result);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDecline = async () => {
    const result = await onDecline(event.id, declineReason);
    setFeedback(result);
    setShowDeclineReason(false);
    setDeclineReason("");
    setTimeout(() => setFeedback(null), 3000);
  };

  const needsResponse = event.status === "pending_invite" || event.status === "suggested";
  const isProcessing = processing === event.id;

  return (
    <article className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 transition hover:bg-brand-white">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
              {event.status === "suggested" ? "Suggested" : event.status.replace("_", " ")}
            </p>
            {event.status === "suggested" && (
              <Badge tone="neutral">Optional</Badge>
            )}
          </div>
          <p className="mt-1 font-semibold text-brand-black">{event.title}</p>
          <p className="text-sm text-brand-black/70">
            {event.location} · {event.date}
          </p>
          {event.required && (
            <p className="mt-1 text-xs text-brand-black/60">
              {event.required}
            </p>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`mt-3 rounded-lg p-3 text-sm ${
          feedback.success 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {feedback.message}
        </div>
      )}

      {needsResponse && !feedback && (
        <div className="mt-3">
          {!showDeclineReason ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Accept"}
              </button>
              <button
                onClick={() => setShowDeclineReason(true)}
                disabled={isProcessing}
                className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Optional: Let your agent know why (brief)"
                className="w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDecline}
                  disabled={isProcessing}
                  className="rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] disabled:opacity-50"
                >
                  {isProcessing ? "Sending..." : "Send"}
                </button>
                <button
                  onClick={() => {
                    setShowDeclineReason(false);
                    setDeclineReason("");
                  }}
                  className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!needsResponse && event.status === "confirmed" && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {}} // Navigate to calendar
            className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
          >
            View details
          </button>
        </div>
      )}
    </article>
  );
}

/**
 * Revenue summary card (read-only, no anxiety)
 */
export function RevenueCard({ revenue }) {
  if (!revenue) return null;

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
        Revenue overview
      </p>
      <h3 className="font-display text-2xl uppercase text-brand-black">
        Confidence, not accounting
      </h3>
      <p className="mt-1 text-sm text-brand-black/60">
        Managed by your agent.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Earnings to date
          </p>
          <p className="mt-2 font-display text-2xl uppercase text-brand-black">
            {revenue.earningsFormatted}
          </p>
          <p className="text-xs text-brand-black/60">YTD (rounded)</p>
        </div>

        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Potential revenue
          </p>
          <p className="mt-2 font-display text-2xl uppercase text-brand-black">
            {revenue.potentialFormatted}
          </p>
          <p className="text-xs text-brand-black/60">Pipeline estimate</p>
        </div>

        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Trend
          </p>
          <p className="mt-2 font-display text-2xl uppercase text-brand-black">
            {revenue.trend}
          </p>
          <p className="text-xs text-brand-black/60">{revenue.trendDescription}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
        <p className="text-sm text-brand-black/70">
          If you want a deeper breakdown, ask your agent — you don't need to manage invoices or payouts here.
        </p>
      </div>
    </section>
  );
}

/**
 * Wellness check-in prompt (opt-in, non-nagging)
 */
export function WellnessCheckin({ onSubmit, onSnooze }) {
  const [energy, setEnergy] = useState("");
  const [workload, setWorkload] = useState("");

  const handleSubmit = () => {
    onSubmit({ energy, workload, timestamp: new Date().toISOString() });
  };

  return (
    <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
        Quick check-in
      </p>
      <p className="mt-2 text-sm text-brand-black/70">
        Optional: How are you feeling this week?
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60 mb-2">
            Energy level
          </p>
          <div className="flex flex-wrap gap-2">
            {["Low", "Steady", "High"].map((level) => (
              <button
                key={level}
                onClick={() => setEnergy(level)}
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] ${
                  energy === level
                    ? "border-brand-black bg-brand-black text-brand-white"
                    : "border-brand-black/20"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60 mb-2">
            Workload
          </p>
          <div className="flex flex-wrap gap-2">
            {["Light", "Balanced", "Heavy"].map((level) => (
              <button
                key={level}
                onClick={() => setWorkload(level)}
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] ${
                  workload === level
                    ? "border-brand-black bg-brand-black text-brand-white"
                    : "border-brand-black/20"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!energy || !workload}
          className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white disabled:opacity-50"
        >
          Submit
        </button>
        <button
          onClick={() => onSnooze(7)}
          className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
        >
          Ask me next week
        </button>
      </div>
    </div>
  );
}
