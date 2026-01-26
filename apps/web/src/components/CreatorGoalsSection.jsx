import React from "react";
import { useAuth } from "../context/AuthContext.jsx";

export function CreatorGoalsSection() {
  const [onboardingData, setOnboardingData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchOnboardingData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/onboarding/user/${user.id}`);
        if (!response.ok) throw new Error("Failed to fetch onboarding data");
        const data = await response.json();
        setOnboardingData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingData();
  }, [user?.id]);

  if (loading) {
    return (
      <section id="creator-goals" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Your goals</p>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-brand-black/10" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !onboardingData?.onboarding_responses) {
    return (
      <section id="creator-goals" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Your goals</p>
        <p className="text-sm text-brand-black/70">No onboarding data found. Please complete your onboarding.</p>
      </section>
    );
  }

  const responses = onboardingData.onboarding_responses;
  const hasData = Object.values(responses).some(v => v);

  if (!hasData) {
    return null;
  }

  // Map onboarding field names to display labels
  const fieldLabels = {
    reality: "Current Inbound Reality",
    primaryGoal: "Primary Goal",
    targetAmount: "Target Amount",
    timeframe: "Timeframe",
    audience: "Your Audience",
    challenges: "Current Challenges",
    support: "Support Needed"
  };

  return (
    <section id="creator-goals" className="mt-6 space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div>
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Your goals</p>
        <h3 className="font-display text-3xl uppercase text-brand-black">Goals & context</h3>
        <p className="mt-1 text-sm text-brand-black/60">Information you shared during setup</p>
      </div>

      <div className="space-y-4">
        {Object.entries(responses).map(([key, value]) => {
          if (!value) return null;

          const label = fieldLabels[key] || key.replace(/([A-Z])/g, " $1").trim();

          return (
            <div key={key} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-black/60">
                {label}
              </p>
              <p className="mt-2 text-sm text-brand-black/80">{value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
