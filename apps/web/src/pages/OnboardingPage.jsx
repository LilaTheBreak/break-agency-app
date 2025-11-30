import React, { useEffect, useState } from "react";
import { apiFetch } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";

export function OnboardingPage() {
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    platforms: "",
    niche: "",
    followerCount: "",
    brandGoals: "",
    completedSteps: []
  });

  const [status, setStatus] = useState("DRAFT");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load onboarding state
  useEffect(() => {
    async function loadOnboarding() {
      const res = await apiFetch("/onboarding/me");

      if (res.ok) {
        const { onboarding } = await res.json();
        if (onboarding) {
          setForm(onboarding.questionnaire || form);
          setStatus(onboarding.status);
        }
      }

      setLoading(false);
    }

    loadOnboarding();
  }, []);

  // Handle form updates
  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSaving(true);

    const response = await apiFetch("/onboarding/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        completedSteps: ["profile", "details", "goals"]
      }),
    });

    setSaving(false);

    if (response.ok) {
      await refreshUser();
      const { onboarding } = await response.json();
      setStatus(onboarding.status);
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading onboarding…</div>;

  if (status === "APPROVED") {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-white/10 rounded-2xl text-white">
        <h2 className="text-2xl font-semibold">Your onboarding is complete 🎉</h2>
        <p className="mt-2 text-sm text-white/70">You now have full access to your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 text-white">
      <h1 className="text-3xl font-semibold">Finish your Break onboarding</h1>
      <p className="mt-2 text-sm text-white/60">Status: {status}</p>

      <div className="mt-8 space-y-6">

        {/* PLATFORMS */}
        <div>
          <label className="block text-sm font-medium">Primary platforms</label>
          <input
            type="text"
            placeholder="Instagram, TikTok, YouTube…"
            value={form.platforms}
            onChange={e => updateField("platforms", e.target.value)}
            className="mt-2 w-full p-3 rounded-xl text-black"
          />
        </div>

        {/* NICHE */}
        <div>
          <label className="block text-sm font-medium">Niche / Content category</label>
          <input
            type="text"
            placeholder="Beauty, Fashion, Fitness…"
            value={form.niche}
            onChange={e => updateField("niche", e.target.value)}
            className="mt-2 w-full p-3 rounded-xl text-black"
          />
        </div>

        {/* FOLLOWER COUNT */}
        <div>
          <label className="block text-sm font-medium">Follower count (approx)</label>
          <input
            type="number"
            placeholder="30000"
            value={form.followerCount}
            onChange={e => updateField("followerCount", e.target.value)}
            className="mt-2 w-full p-3 rounded-xl text-black"
          />
        </div>

        {/* GOALS */}
        <div>
          <label className="block text-sm font-medium">What are your brand goals?</label>
          <textarea
            placeholder="I want to work with…"
            value={form.brandGoals}
            onChange={e => updateField("brandGoals", e.target.value)}
            className="mt-2 w-full p-3 min-h-[120px] rounded-xl text-black"
          />
        </div>

      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="mt-6 px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-red-500 hover:text-white transition"
      >
        {saving ? "Saving…" : "Submit for review"}
      </button>
    </div>
  );
}

export default OnboardingPage;
