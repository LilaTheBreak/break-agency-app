import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Roles } from "../constants/roles.js";
import {
  getActiveOnboardingRole,
  getDashboardPathForRole,
  loadOnboardingState,
  markOnboardingSubmitted,
  persistOnboardingState,
  shouldRouteToOnboarding
} from "../lib/onboardingState.js";
import { submitOnboarding, skipOnboarding } from "../services/onboardingClient.js";
import { saveCrmOnboarding } from "../lib/crmOnboarding.js";
import { upsertContactFromOnboarding } from "../lib/crmContacts.js";

const DEFAULT_FORM = {
  preferredName: "",
  reality: "",
  context: "",
  platforms: [],
  formats: [],
  primaryNiche: "",
  secondaryNiches: [],
  contentAngles: [],
  primaryGoal: "",
  targetAmount: "",
  timeframe: "12",
  priority: "",
  revenueRange: "",
  incomePredictability: "",
  blockers: [],
  blockerNotes: "",
  partnershipsPerMonth: "",
  leadTime: "",
  lessOfThis: [],
  categoriesWanted: [],
  categoriesAvoided: [],
  partnershipPreference: "",
  usp: "",
  proofPoints: [],
  ugcUsage: "",
  ugcGoals: [],
  ugcCapacity: "",
  ugcPricingConfidence: ""
};

const REALITY_OPTIONS = [
  "Regular inbound (weekly)",
  "Occasional inbound (monthly)",
  "Rare or unpredictable",
  "Almost no inbound"
];

const CONTEXT_OPTIONS = [
  "Creator (audience-led)",
  "Founder / SMB owner + creator",
  "UGC creator",
  "Creator with a team",
  "Exploring creator income"
];

const PLATFORM_OPTIONS = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Pinterest", "Newsletter", "Podcast"];
const FORMAT_OPTIONS = ["Short-form video", "Long-form video", "Photo sets", "Carousels", "Live sessions", "Written content"];
const NICHE_OPTIONS = ["Beauty", "Fashion", "Fitness", "Finance", "Tech/AI", "Travel", "Food & Beverage", "Lifestyle"];
const ANGLE_OPTIONS = [
  "Educational",
  "Behind-the-scenes",
  "Day-in-the-life",
  "Product-led storytelling",
  "Founder POV",
  "Humor / meme-driven",
  "Luxury tone",
  "Data-first"
];

const GOAL_OPTIONS = [
  "Consistent paid partnerships",
  "Grow brand demand",
  "Launch a signature offer",
  "Increase audience trust",
  "Shift into premium deals",
  "Balance audience + revenue"
];

const REVENUE_OPTIONS = [
  "£0-£2k / month",
  "£2k-£5k / month",
  "£5k-£10k / month",
  "£10k-£25k / month",
  "£25k+ / month"
];

const PREDICTABILITY_OPTIONS = [
  "Highly predictable",
  "Somewhat predictable",
  "Seasonal",
  "Unpredictable / feast or famine"
];

const BLOCKER_OPTIONS = [
  "Inconsistent inbound",
  "Pricing confidence",
  "Negotiation support",
  "Offer positioning",
  "Creative block",
  "Fulfilment capacity",
  "Legal / approvals",
  "Cash flow timing",
  "Audience growth"
];

const CAPACITY_OPTIONS = ["1-2 partnerships / month", "3-4 partnerships / month", "5-6 partnerships / month", "7+ partnerships / month"];
const LEAD_TIME_OPTIONS = ["1 week", "2 weeks", "3-4 weeks", "4+ weeks"];
const LESS_OF_OPTIONS = ["Last-minute asks", "Underpriced briefs", "Misaligned categories", "Heavy usage rights", "Spec creative without pay", "Unclear deliverables"];

const CATEGORY_OPTIONS = ["Beauty", "Luxury / Fashion", "Finance / Fintech", "Travel", "Wellness", "Food & Beverage", "AI / Tech", "Home / Lifestyle", "Auto / Mobility"];
const PARTNERSHIP_PREFERENCES = [
  "One-off briefs",
  "3-6 month retainers",
  "Ambassador / long-term",
  "Hybrid (paid + affiliate)",
  "Event / experiential",
  "Content-only (no posting)"
];

const PROOF_POINTS = [
  "Audience growth spikes",
  "Conversion wins",
  "High retention community",
  "Press mentions",
  "Category expertise",
  "Prior brand partners",
  "Operational reliability",
  "Creative awards"
];

const UGC_USAGE_OPTIONS = [
  "Organic social",
  "Paid social",
  "Email / CRM",
  "Landing pages",
  "Retail / OOH",
  "Product education"
];

const UGC_COMMERCIAL_GOALS = [
  "Launch support",
  "Always-on creative",
  "Paid media variants",
  "Product education",
  "Testimonials",
  "Retention content"
];

const UGC_CAPACITY_OPTIONS = [
  "2-3 assets / week",
  "4-6 assets / week",
  "7-10 assets / week",
  "11+ assets / week"
];

const UGC_PRICING_CONFIDENCE = [
  "Very confident",
  "Somewhat confident",
  "Figuring it out",
  "Need guardrails"
];

function deriveDefaultContext(role) {
  if (role === Roles.UGC) return "UGC creator";
  if (role === Roles.FOUNDER) return "Founder / SMB owner + creator";
  return "Creator (audience-led)";
}

function isUgcFlow(role, contextValue) {
  return role === Roles.UGC || contextValue === "UGC creator";
}

function buildSteps(includeUgcScreens) {
  const steps = [
    { id: "welcome", title: "Build momentum — even when deals are quiet" },
    { id: "reality", title: "Current reality" },
    { id: "context", title: "Creator context" },
    { id: "platforms", title: "Platforms & formats" },
    { id: "niche", title: "Niche & angle" },
    { id: "north-star", title: "North star" },
    { id: "revenue", title: "Revenue baseline" }
  ];

  if (includeUgcScreens) {
    steps.push(
      { id: "ugc-usage", title: "How brands use your content" },
      { id: "ugc-goals", title: "Commercial goals" },
      { id: "ugc-capacity", title: "Production capacity" },
      { id: "ugc-pricing", title: "Pricing confidence" }
    );
  }

  steps.push(
    { id: "friction", title: "Friction & blocks" },
    { id: "capacity", title: "Capacity & boundaries" },
    { id: "brand-fit", title: "Brand fit" },
    { id: "break-angle", title: "Your Break angle" },
    { id: "complete", title: "You're set" }
  );

  return steps;
}

export default function OnboardingPage() {
  const { user, loading, syncOnboardingFromLocal } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const signupRole = searchParams.get("role");
  const resolvedRole = useMemo(
    () => getActiveOnboardingRole(user, signupRole ? signupRole.toUpperCase() : undefined) || Roles.CREATOR,
    [user, signupRole]
  );

  const stored = useMemo(() => loadOnboardingState(user?.email), [user?.email]);
  const [form, setForm] = useState(() => {
    const fromStorage = stored.responses || {};
    const context = fromStorage.context || stored.context || deriveDefaultContext(resolvedRole);
    return { ...DEFAULT_FORM, ...fromStorage, context };
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const ugcFlow = isUgcFlow(resolvedRole, form.context);
  const steps = useMemo(() => buildSteps(ugcFlow), [ugcFlow]);
  const currentStep = steps[stepIndex] || steps[0];

  useEffect(() => {
    const storedStepId = stored.currentStep;
    const initialIndex = storedStepId ? steps.findIndex((step) => step.id === storedStepId) : 0;
    if (initialIndex >= 0) {
      setStepIndex(initialIndex);
    }
  }, [stored.currentStep, steps]);

  useEffect(() => {
    const status = currentStep.id === "complete" ? "pending_review" : "in_progress";
    // Keep storage in sync as answers change
    persistOnboardingState(user?.email, {
      responses: form,
      role: resolvedRole,
      context: form.context,
      status,
      currentStep: currentStep.id
    });
  }, [form, currentStep.id, resolvedRole, user?.email]);

  useEffect(() => {
    if (!loading && user && !shouldRouteToOnboarding(user) && currentStep.id !== "complete") {
      navigate(getDashboardPathForRole(user.role), { replace: true });
    }
  }, [user, loading, currentStep.id, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      const shouldCollapse = window.scrollY > 180;
      setNavCollapsed(shouldCollapse);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading && !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-linen px-6">
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white px-6 py-5 text-brand-black shadow-brand">
          Checking your session…
        </div>
      </div>
    );
  }

  if (!user) return null;

  const stepTotal = steps.length;
  const progress = Math.round(((stepIndex + 1) / stepTotal) * 100);

  const handleSelect = (field, value) => {
    setForm((prev) => {
      if (Array.isArray(prev[field])) {
        const exists = prev[field].includes(value);
        const nextArray = exists ? prev[field].filter((item) => item !== value) : [...prev[field], value];
        return { ...prev, [field]: nextArray };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleNext = async () => {
    const validation = validateStep(currentStep.id, form, ugcFlow);
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    if (currentStep.id === "complete") {
      await finishOnboarding();
      return;
    }
    const nextIndex = Math.min(stepIndex + 1, steps.length - 1);
    const nextStepId = steps[nextIndex].id;
    if (nextStepId === "complete") {
      await finishOnboarding();
      setStepIndex(nextIndex);
      persistOnboardingState(user.email, {
        responses: form,
        role: resolvedRole,
        context: form.context,
        status: "pending_review",
        currentStep: nextStepId
      });
      return;
    }
    setStepIndex(nextIndex);
    persistOnboardingState(user.email, {
      responses: form,
      role: resolvedRole,
      context: form.context,
      status: "in_progress",
      currentStep: nextStepId
    });
  };

  const handleBack = () => {
    setError("");
    const prevIndex = Math.max(0, stepIndex - 1);
    setStepIndex(prevIndex);
    persistOnboardingState(user.email, { currentStep: steps[prevIndex].id });
  };

  const finishOnboarding = async () => {
    try {
      // Submit to backend API
      const response = await submitOnboarding(form, resolvedRole, form.context);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to submit onboarding" }));
        console.error("Onboarding submission failed:", error);
        setError(error.error || "Failed to submit onboarding. Please try again.");
        return false;
      }

      // Mark onboarding as completed in backend
      try {
        const completeResponse = await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!completeResponse.ok) {
          console.warn("Failed to mark onboarding as completed:", await completeResponse.text());
        }
      } catch (err) {
        console.warn("Error marking onboarding as completed:", err);
      }

      // For creators, auto-link or create talent record
      if (resolvedRole === Roles.CREATOR) {
        try {
          const talentResponse = await fetch("/api/creator/complete-onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              displayName: form.displayName,
              categories: form.categories || [],
              representationType: form.representationType,
            }),
          });
          
          if (!talentResponse.ok) {
            const error = await talentResponse.json().catch(() => ({ error: "Failed to link talent" }));
            console.error("Failed to link creator talent:", error);
            // Don't fail onboarding for this, just log it
            if (talentResponse.status === 409) {
              console.warn("Email conflict during talent linking:", error);
            }
          } else {
            const talentData = await talentResponse.json();
            console.log("Creator talent linked/created:", talentData);
          }
        } catch (err) {
          console.error("Error linking creator talent:", err);
          // Don't fail onboarding for this error
        }
      }

      // Update local storage
      markOnboardingSubmitted(user.email, resolvedRole, form.context);
      saveCrmOnboarding(user.email, resolvedRole, form.context, form);
      upsertContactFromOnboarding(user.email, resolvedRole, form);
      syncOnboardingFromLocal();
      return true;
    } catch (err) {
      console.error("Error submitting onboarding:", err);
      setError("Failed to submit onboarding. Please try again.");
      return false;
    }
  };

  const handleGoToDashboard = async () => {
    const success = await finishOnboarding();
    if (success) {
      const path = getDashboardPathForRole(resolvedRole);
      navigate(path, { replace: true });
    }
  };

  const handleSkipOnboarding = async () => {
    setIsSkipping(true);
    setError(""); // Clear any existing errors
    try {
      const response = await skipOnboarding();
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to skip onboarding" }));
        console.error("Skip onboarding failed:", error);
        setError(error.error || "Failed to skip onboarding. Please try again.");
        setIsSkipping(false);
        return;
      }
      const data = await response.json();
      console.log("Onboarding skipped successfully:", data);
      // Navigate to dashboard after skipping
      const path = getDashboardPathForRole(resolvedRole);
      navigate(path, { replace: true });
    } catch (err) {
      console.error("Error skipping onboarding:", err);
      setError("Failed to skip onboarding. Please try again.");
      setIsSkipping(false);
    }
  };

  const renderPrimaryAction = () => {
    if (currentStep.id === "welcome") {
      return (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleNext}
            className="w-full rounded-full bg-brand-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-white transition hover:-translate-y-0.5 hover:bg-brand-red"
          >
            Let's set your direction (≈8 mins)
          </button>
          <button
            type="button"
            onClick={handleSkipOnboarding}
            disabled={isSkipping}
            className="w-full rounded-full border border-brand-black/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60 transition hover:bg-brand-black/5 hover:text-brand-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSkipping ? "Skipping..." : "Do this later"}
          </button>
        </div>
      );
    }
    if (currentStep.id === "complete") {
      return (
        <button
          type="button"
          onClick={handleGoToDashboard}
          className="w-full rounded-full bg-brand-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-white transition hover:-translate-y-0.5 hover:bg-brand-red"
        >
          Go to dashboard
        </button>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="rounded-full border border-brand-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-full bg-brand-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-white transition hover:-translate-y-0.5 hover:bg-brand-red"
          >
            Next
          </button>
        </div>
        <button
          type="button"
          onClick={handleSkipOnboarding}
          disabled={isSkipping}
          className="w-full rounded-full border border-brand-black/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60 transition hover:bg-brand-black/5 hover:text-brand-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSkipping ? "Skipping..." : "Do this later"}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-ivory text-brand-black">
      <div className="sticky top-0 z-30 border-b border-brand-black/10 bg-brand-ivory/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-brand-red px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white">
              Onboarding
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">
              Step {stepIndex + 1} of {stepTotal}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-48 rounded-full bg-brand-black/10 sm:w-64 md:w-80">
              <div
                className="h-2 rounded-full bg-brand-red transition-all"
                style={{ width: `${progress}%` }}
                aria-label={`Progress ${progress}%`}
              />
            </div>
            <button
              type="button"
              onClick={() => setNavCollapsed((prev) => !prev)}
              className="hidden rounded-full border border-brand-black/20 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:bg-brand-black/5 lg:inline-flex"
            >
              {navCollapsed ? "Show steps" : "Hide steps"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 lg:flex-row">
        {!navCollapsed ? (
          <aside className="w-full lg:w-[320px]">
            <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 text-brand-black shadow-[0_25px_80px_rgba(0,0,0,0.08)]">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Unified creator onboarding</p>
              <h1 className="mt-2 font-display text-3xl uppercase leading-tight text-brand-black">
                Calm, clear momentum plan
              </h1>
              <p className="mt-3 text-sm text-brand-black/70">
                We keep this under 10 minutes. Your answers route you to the right playbook without labels or judgement.
              </p>
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-brand-black/60">
                  <span>Step {stepIndex + 1}</span>
                  <span>of {stepTotal}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-brand-black/10">
                  <div
                    className="h-2 rounded-full bg-brand-red transition-all"
                    style={{ width: `${progress}%` }}
                    aria-label={`Progress ${progress}%`}
                  />
                </div>
                <ul className="mt-6 space-y-2 text-sm text-brand-black/80">
                  {steps.map((step, idx) => {
                    const isActive = idx === stepIndex;
                    const isDone = idx < stepIndex;
                    return (
                      <li
                        key={step.id}
                        className={[
                          "flex items-center justify-between rounded-2xl border px-3 py-2",
                          isActive
                            ? "border-brand-red/60 bg-brand-red/10 text-brand-black"
                            : "border-brand-black/10 bg-brand-linen/60"
                        ].join(" ")}
                      >
                        <span className="flex items-center gap-2 text-brand-black">
                          <span
                            className={[
                              "grid h-7 w-7 place-items-center rounded-full text-[0.65rem] font-semibold uppercase tracking-[0.2em]",
                              isDone ? "bg-brand-red text-white" : "bg-brand-black/10 text-brand-black/70"
                            ].join(" ")}
                          >
                            {idx + 1}
                          </span>
                          {step.title}
                        </span>
                        {isDone ? <span className="text-xs text-brand-black/60">Saved</span> : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </aside>
        ) : null}

        <main className="min-w-0 flex-1 space-y-4">
          <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-[0_25px_90px_rgba(0,0,0,0.12)]">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">
              {currentStep.id === "welcome" ? "Welcome" : "Momentum intake"}
            </p>
            <StepContent
              stepId={currentStep.id}
              form={form}
              onSelect={handleSelect}
              onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
              ugcFlow={ugcFlow}
            />
            {error ? <p className="mt-4 text-sm text-brand-red">{error}</p> : null}
            <div className="mt-6">{renderPrimaryAction()}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StepContent({ stepId, form, onSelect, onChange, ugcFlow }) {
  if (stepId === "welcome") {
    return (
      <div className="mt-3 space-y-4 text-brand-black">
        <h2 className="font-display text-4xl uppercase leading-tight text-brand-black">
          Build momentum — even when deals are quiet
        </h2>
        <p className="text-base text-brand-black/70">
          The Break helps you turn your goals into clear next steps, whether deals are coming in or not.
        </p>
        <p className="text-sm text-brand-black/60">
          Most creators don’t have consistent inbound. That’s normal.
        </p>
      </div>
    );
  }

  if (stepId === "reality") {
    return (
      <QuestionCard
        title="How consistent is your brand inbound right now?"
        helper="No judgement. This simply helps us set the right pacing."
      >
        <ChoiceGrid
          options={REALITY_OPTIONS}
          value={form.reality}
          onSelect={(value) => onSelect("reality", value)}
        />
      </QuestionCard>
    );
  }

  if (stepId === "context") {
    return (
      <QuestionCard
        title="Which best describes your setup right now?"
        helper="This routes your experience later. It isn’t a label."
      >
        <ChoiceGrid
          options={CONTEXT_OPTIONS}
          value={form.context}
          onSelect={(value) => onSelect("context", value)}
          columns={2}
        />
      </QuestionCard>
    );
  }

  if (stepId === "platforms") {
    return (
      <div className="space-y-6">
        <QuestionCard
          title="Where do you already publish?"
          helper="Select the platforms that feel natural for you."
        >
          <ChoiceGrid
            options={PLATFORM_OPTIONS}
            value={form.platforms}
            onSelect={(value) => onSelect("platforms", value)}
            multiple
          />
        </QuestionCard>
        <QuestionCard
          title="Pick the formats you enjoy"
          helper="We prioritise what you can maintain long-term."
        >
          <ChoiceGrid
            options={FORMAT_OPTIONS}
            value={form.formats}
            onSelect={(value) => onSelect("formats", value)}
            multiple
          />
        </QuestionCard>
      </div>
    );
  }

  if (stepId === "niche") {
    return (
      <div className="space-y-6">
        <QuestionCard title="Primary niche" helper="Pick the center of gravity for your content.">
          <ChoiceGrid
            options={NICHE_OPTIONS}
            value={form.primaryNiche}
            onSelect={(value) => onSelect("primaryNiche", value)}
            columns={3}
          />
        </QuestionCard>
        <QuestionCard title="Secondary niches (optional)" helper="Pick supporting categories.">
          <ChoiceGrid
            options={NICHE_OPTIONS}
            value={form.secondaryNiches}
            onSelect={(value) => onSelect("secondaryNiches", value)}
            multiple
            columns={3}
          />
        </QuestionCard>
        <QuestionCard title="Content angle" helper="What tone or format feels most true to you?">
          <ChoiceGrid
            options={ANGLE_OPTIONS}
            value={form.contentAngles}
            onSelect={(value) => onSelect("contentAngles", value)}
            multiple
            columns={2}
          />
        </QuestionCard>
      </div>
    );
  }

  if (stepId === "north-star") {
    return (
      <div className="space-y-6">
        <QuestionCard title="What are we moving toward?" helper="Frame this as an anchor, not pressure.">
          <ChoiceGrid
            options={GOAL_OPTIONS}
            value={form.primaryGoal}
            onSelect={(value) => onSelect("primaryGoal", value)}
            columns={2}
          />
        </QuestionCard>
        <div className="grid gap-4 md:grid-cols-3">
          <LabelledField label="Target amount (£)" helper="Rounded is fine.">
            <input
              type="number"
              min="0"
              value={form.targetAmount}
              onChange={(e) => onChange("targetAmount", e.target.value)}
              className="w-full rounded-2xl border border-brand-black/15 bg-brand-white px-4 py-3 text-sm focus:border-brand-red focus:outline-none"
              placeholder="e.g. 15000"
            />
          </LabelledField>
          <LabelledField label="Timeframe" helper="Choose the horizon that feels right.">
            <select
              value={form.timeframe}
              onChange={(e) => onChange("timeframe", e.target.value)}
              className="w-full rounded-2xl border border-brand-black/15 bg-brand-white px-4 py-3 text-sm focus:border-brand-red focus:outline-none"
            >
              <option value="6">6 months</option>
              <option value="12">12 months</option>
              <option value="18">18 months</option>
            </select>
          </LabelledField>
          <LabelledField label="Priority" helper="What matters most right now?">
            <select
              value={form.priority}
              onChange={(e) => onChange("priority", e.target.value)}
              className="w-full rounded-2xl border border-brand-black/15 bg-brand-white px-4 py-3 text-sm focus:border-brand-red focus:outline-none"
            >
              <option value="">Select</option>
              <option value="Stability">Stability</option>
              <option value="Growth">Growth</option>
              <option value="Balance">Balance</option>
            </select>
          </LabelledField>
        </div>
      </div>
    );
  }

  if (stepId === "revenue") {
    return (
      <div className="space-y-6">
        <QuestionCard title="Revenue range" helper="This stays private.">
          <ChoiceGrid
            options={REVENUE_OPTIONS}
            value={form.revenueRange}
            onSelect={(value) => onSelect("revenueRange", value)}
            columns={2}
          />
        </QuestionCard>
        <QuestionCard title="Income predictability" helper="We track momentum, not just deals.">
          <ChoiceGrid
            options={PREDICTABILITY_OPTIONS}
            value={form.incomePredictability}
            onSelect={(value) => onSelect("incomePredictability", value)}
            columns={2}
          />
        </QuestionCard>
      </div>
    );
  }

  if (stepId === "ugc-usage") {
    return (
      <QuestionCard title="How do brands use your content?" helper="Select the channels you usually deliver for.">
        <ChoiceGrid
          options={UGC_USAGE_OPTIONS}
          value={form.ugcUsage}
          onSelect={(value) => onSelect("ugcUsage", value)}
          columns={2}
        />
      </QuestionCard>
    );
  }

  if (stepId === "ugc-goals") {
    return (
      <QuestionCard title="Commercial goals" helper="Pick what brands lean on you for most often.">
        <ChoiceGrid
          options={UGC_COMMERCIAL_GOALS}
          value={form.ugcGoals}
          onSelect={(value) => onSelect("ugcGoals", value)}
          multiple
          columns={2}
        />
      </QuestionCard>
    );
  }

  if (stepId === "ugc-capacity") {
    return (
      <QuestionCard title="Production capacity" helper="Helps us pace briefs and approvals.">
        <ChoiceGrid
          options={UGC_CAPACITY_OPTIONS}
          value={form.ugcCapacity}
          onSelect={(value) => onSelect("ugcCapacity", value)}
          columns={2}
        />
      </QuestionCard>
    );
  }

  if (stepId === "ugc-pricing") {
    return (
      <QuestionCard title="Pricing confidence" helper="No pressure. We’ll calibrate together.">
        <ChoiceGrid
          options={UGC_PRICING_CONFIDENCE}
          value={form.ugcPricingConfidence}
          onSelect={(value) => onSelect("ugcPricingConfidence", value)}
          columns={2}
        />
      </QuestionCard>
    );
  }

  if (stepId === "friction") {
    return (
      <QuestionCard title="What’s getting in the way?" helper="Pick up to 3 and add texture if helpful.">
        <ChoiceGrid
          options={BLOCKER_OPTIONS}
          value={form.blockers}
          onSelect={(value) => onSelect("blockers", value)}
          multiple
          columns={2}
        />
        <textarea
          value={form.blockerNotes}
          onChange={(e) => onChange("blockerNotes", e.target.value)}
          placeholder="Anything else slowing momentum?"
          className="mt-4 w-full rounded-2xl border border-brand-black/15 bg-brand-linen/60 px-4 py-3 text-sm focus:border-brand-red focus:outline-none"
          rows={3}
        />
      </QuestionCard>
    );
  }

  if (stepId === "capacity") {
    return (
      <div className="space-y-6">
        <QuestionCard title="Ideal partnerships per month" helper="We’ll pace outreach to match.">
          <ChoiceGrid
            options={CAPACITY_OPTIONS}
            value={form.partnershipsPerMonth}
            onSelect={(value) => onSelect("partnershipsPerMonth", value)}
            columns={2}
          />
        </QuestionCard>
        <QuestionCard title="Preferred lead time" helper="Give us your ideal runway.">
          <ChoiceGrid
            options={LEAD_TIME_OPTIONS}
            value={form.leadTime}
            onSelect={(value) => onSelect("leadTime", value)}
            columns={4}
          />
        </QuestionCard>
        <QuestionCard title="Less of this" helper="Pick things you want to avoid.">
          <ChoiceGrid
            options={LESS_OF_OPTIONS}
            value={form.lessOfThis}
            onSelect={(value) => onSelect("lessOfThis", value)}
            multiple
            columns={2}
          />
        </QuestionCard>
      </div>
    );
  }

  if (stepId === "brand-fit") {
    return (
      <div className="space-y-6">
        <QuestionCard title="Categories wanted" helper="Where you want to lean in.">
          <ChoiceGrid
            options={CATEGORY_OPTIONS}
            value={form.categoriesWanted}
            onSelect={(value) => onSelect("categoriesWanted", value)}
            multiple
            columns={3}
          />
        </QuestionCard>
        <QuestionCard title="Categories to avoid" helper="Where we should tread lightly.">
          <ChoiceGrid
            options={CATEGORY_OPTIONS}
            value={form.categoriesAvoided}
            onSelect={(value) => onSelect("categoriesAvoided", value)}
            multiple
            columns={3}
          />
        </QuestionCard>
        <QuestionCard title="Partnership preference" helper="We’ll bias outreach toward this.">
          <ChoiceGrid
            options={PARTNERSHIP_PREFERENCES}
            value={form.partnershipPreference}
            onSelect={(value) => onSelect("partnershipPreference", value)}
            columns={2}
          />
        </QuestionCard>
      </div>
    );
  }

  if (stepId === "break-angle") {
    return (
      <div className="space-y-6">
        <QuestionCard title="Your Break angle" helper="One line that sums up why you win.">
          <textarea
            value={form.usp}
            onChange={(e) => onChange("usp", e.target.value)}
            placeholder="e.g. Data-backed creator who makes premium finance feel simple"
            className="w-full rounded-2xl border border-brand-black/15 bg-brand-linen/60 px-4 py-3 text-sm focus:border-brand-red focus:outline-none"
            rows={3}
          />
        </QuestionCard>
        <QuestionCard title="Proof points" helper="Pick the signals that matter.">
          <ChoiceGrid
            options={PROOF_POINTS}
            value={form.proofPoints}
            onSelect={(value) => onSelect("proofPoints", value)}
            multiple
            columns={2}
          />
        </QuestionCard>
      </div>
    );
  }

  if (stepId === "complete") {
    return (
      <div className="space-y-3">
        <h2 className="font-display text-4xl uppercase leading-tight text-brand-black">You’re set</h2>
        <p className="text-base text-brand-black/70">
          We’ve built your first momentum plan — even if deals are quiet.
        </p>
        <p className="text-sm text-brand-black/60">
          Your dashboard will appear in a review state while our team approves your account.
        </p>
      </div>
    );
  }

  return null;
}

function QuestionCard({ title, helper, children }) {
  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-5">
      <div>
        <h3 className="text-xl font-semibold text-brand-black">{title}</h3>
        {helper ? <p className="text-sm text-brand-black/60">{helper}</p> : null}
        <p className="text-xs text-brand-black/50">Your answers save automatically to your account.</p>
      </div>
      {children}
    </div>
  );
}

function ChoiceGrid({ options, value, onSelect, multiple = false, columns = 1 }) {
  const activeValues = Array.isArray(value) ? value : [value];
  const columnClass =
    columns === 4
      ? "md:grid-cols-4"
      : columns === 3
      ? "md:grid-cols-3"
      : columns === 2
      ? "md:grid-cols-2"
      : "";
  return (
    <div className={`grid gap-3 ${columnClass}`}>
      {options.map((option) => {
        const isActive = activeValues.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            aria-pressed={isActive}
            className={[
              "w-full rounded-2xl border px-4 py-3 text-left text-sm transition",
              isActive
                ? "border-brand-red bg-brand-white shadow-brand"
                : "border-brand-black/10 bg-brand-white/80 hover:-translate-y-0.5 hover:border-brand-black/30"
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-semibold text-brand-black">{option}</span>
                {multiple ? (
                  <span className="mt-1 block text-xs uppercase tracking-[0.25em] text-brand-black/50">Multi-select</span>
                ) : null}
              </div>
              <span
                className={[
                  "mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold",
                  isActive ? "border-brand-red bg-brand-red text-white" : "border-brand-black/15 text-brand-black/40"
                ].join(" ")}
              >
                {isActive ? "✓" : ""}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function LabelledField({ label, helper, children }) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.3em] text-brand-black/70">{label}</p>
      {helper ? <p className="text-xs text-brand-black/60">{helper}</p> : null}
      {children}
    </div>
  );
}

function validateStep(stepId, form, ugcFlow) {
  const requireFields = (...fields) => fields.every((field) => Boolean(form[field] && (Array.isArray(form[field]) ? form[field].length : form[field].toString().trim().length)));
  if (stepId === "welcome") return "";
  if (stepId === "reality" && !form.reality) return "Select the option that best matches your inbound.";
  if (stepId === "context" && !form.context) return "Pick the setup that best routes your flow.";
  if (stepId === "platforms" && (!form.platforms.length || !form.formats.length)) return "Choose at least one platform and up to three formats you enjoy.";
  if (stepId === "niche" && (!form.primaryNiche || !form.contentAngles.length)) return "Set your primary niche and pick at least one content angle.";
  if (stepId === "north-star" && !requireFields("primaryGoal", "targetAmount", "timeframe", "priority")) {
    return "Set your goal, target amount, timeframe, and priority.";
  }
  if (stepId === "revenue" && !requireFields("revenueRange", "incomePredictability")) {
    return "Choose your revenue range and predictability.";
  }
  if (ugcFlow) {
    if (stepId === "ugc-usage" && !form.ugcUsage) return "Tell us how brands use your content.";
    if (stepId === "ugc-goals" && !form.ugcGoals.length) return "Select at least one commercial goal.";
    if (stepId === "ugc-capacity" && !form.ugcCapacity) return "Set your production capacity.";
    if (stepId === "ugc-pricing" && !form.ugcPricingConfidence) return "Share your pricing confidence level.";
  }
  if (stepId === "friction" && !form.blockers.length) return "Pick at least one blocker.";
  if (stepId === "capacity" && (!form.partnershipsPerMonth || !form.leadTime || !form.lessOfThis.length)) {
    return "Set partnerships per month, lead time, and pick at least one thing you want less of.";
  }
  if (stepId === "brand-fit" && (!form.categoriesWanted.length || !form.partnershipPreference)) {
    return "Choose categories you want and a partnership preference.";
  }
  if (stepId === "break-angle" && (!form.usp || !form.proofPoints.length)) {
    return "Add your Break angle and at least one proof point.";
  }
  return "";
}
