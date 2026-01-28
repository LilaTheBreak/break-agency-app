import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_OPTIONS = [
  { value: "BRAND", label: "Brand", description: "Commission campaigns and collaborations" },
  { value: "FOUNDER", label: "Founder", description: "Personal brand strategy and founder-led content" },
  { value: "CREATOR", label: "Creator", description: "Standard creator opportunities" },
  { value: "UGC", label: "UGC Creator", description: "Content creation without audience leverage" },
  { value: "AGENT", label: "Agent", description: "Represent talent and manage deals" }
];

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const email = searchParams.get("email");
  const name = searchParams.get("name");
  const isTemp = searchParams.get("temp") === "true";

  useEffect(() => {
    // If user is already authenticated and has a role, redirect
    if (!isTemp) {
      navigate("/dashboard", { replace: true });
    }
  }, [isTemp, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setError("Please select a role");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Call backend to complete OAuth signup with selected role
      const response = await fetch("/api/auth/complete-oauth-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          role: selectedRole
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to complete signup");
      }

      // Refresh user session
      await refreshUser();

      // Navigate to appropriate onboarding based on role
      let onboardingPath = "/onboarding";
      if (selectedRole === "BRAND") {
        onboardingPath = "/onboarding/brand";
      } else if (selectedRole === "FOUNDER") {
        onboardingPath = "/onboarding/founder";
      } else if (selectedRole === "UGC") {
        onboardingPath = "/ugc/setup";
      } else if (selectedRole === "AGENT") {
        onboardingPath = "/agent/upload-cv";
      }

      navigate(onboardingPath, { replace: true });
    } catch (err) {
      console.error("[ROLE SELECTION] Error:", err);
      setError(err.message || "Unable to complete signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-linen px-6 py-16 text-brand-black">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-[34px] border border-brand-black/10 bg-brand-white p-8 shadow-[0_30px_90px_rgba(0,0,0,0.15)]">
        <div className="space-y-2 text-center">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-red">One more step</p>
          <h1 className="text-2xl font-semibold uppercase tracking-[0.25em]">Select Your Role</h1>
          {name && (
            <p className="text-sm text-brand-black/70">
              Welcome, {name}! Please select your role to continue.
            </p>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 mb-2">
              I am a *
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${
                    selectedRole === option.value
                      ? "border-brand-red bg-brand-red/5"
                      : "border-brand-black/10 hover:border-brand-black/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={selectedRole === option.value}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mt-0.5"
                    required
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brand-black">{option.label}</p>
                    <p className="text-xs text-brand-black/60">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-brand-red">{error}</p>}

          <button
            type="submit"
            disabled={loading || !selectedRole}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-brand-white transition hover:bg-brand-red/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:bg-brand-black/40"
          >
            {loading ? "Continuing..." : "Continue"}
          </button>
        </form>

        <p className="text-center text-xs text-brand-black/60">
          Your role determines which features and workflows you'll see.
        </p>
      </div>
    </div>
  );
}
