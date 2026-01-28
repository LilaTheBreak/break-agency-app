import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const CONTENT_CATEGORIES = [
  "Fashion & Beauty",
  "Food & Beverage",
  "Tech & Gadgets",
  "Lifestyle & Wellness",
  "Home & Decor",
  "Fitness & Sports",
  "Travel",
  "Parenting & Family",
  "Gaming",
  "Pets",
  "Other"
];

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "New Zealand",
  "Other"
];

export default function UgcProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    displayName: user?.name || "",
    country: "",
    categories: [],
    tiktok: "",
    instagram: "",
    youtube: "",
    portfolio: ""
  });

  const toggleCategory = (category) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.displayName || !form.country || form.categories.length === 0) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ugc/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          displayName: form.displayName,
          country: form.country,
          categories: form.categories,
          socials: {
            tiktok: form.tiktok || null,
            instagram: form.instagram || null,
            youtube: form.youtube || null,
            portfolio: form.portfolio || null
          }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      // Navigate to UGC dashboard
      navigate("/ugc/dashboard", { replace: true });
    } catch (err) {
      console.error("[UGC SETUP] Error:", err);
      setError(err.message || "Unable to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-linen px-6 py-16 text-brand-black">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-red">UGC Creator</p>
          <h1 className="text-3xl font-semibold uppercase tracking-[0.25em]">Set Up Your Profile</h1>
          <p className="text-sm text-brand-black/70">
            Complete your profile to start receiving UGC briefs and opportunities.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-[34px] border border-brand-black/10 bg-brand-white p-8 shadow-[0_30px_90px_rgba(0,0,0,0.15)]">
          {/* Display Name */}
          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 mb-2">
              Full Name <span className="text-brand-red">*</span>
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              required
              className="w-full rounded-2xl border border-brand-black/10 bg-brand-white/90 px-4 py-3 text-sm text-brand-black focus:border-brand-red focus:outline-none"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 mb-2">
              Country <span className="text-brand-red">*</span>
            </label>
            <select
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              required
              className="w-full rounded-2xl border border-brand-black/10 bg-brand-white/90 px-4 py-3 text-sm text-brand-black focus:border-brand-red focus:outline-none"
            >
              <option value="">Select your country</option>
              {COUNTRIES.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* Content Categories */}
          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 mb-3">
              Content Categories <span className="text-brand-red">*</span>
            </label>
            <p className="text-xs text-brand-black/60 mb-3">Select all that apply</p>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_CATEGORIES.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`rounded-2xl border px-4 py-2.5 text-sm transition ${
                    form.categories.includes(category)
                      ? "border-brand-red bg-brand-red/10 text-brand-red"
                      : "border-brand-black/10 bg-brand-white/90 text-brand-black hover:border-brand-black/20"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Social Accounts */}
          <div className="space-y-4 pt-4 border-t border-brand-black/10">
            <div>
              <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 mb-2">
                TikTok Handle
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-black/40">@</span>
                <input
                  type="text"
                  value={form.tiktok}
                  onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
                  placeholder="username"
                  className="w-full rounded-2xl border border-brand-black/10 bg-brand-white/90 px-4 py-3 pl-8 text-sm text-brand-black focus:border-brand-red focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 mb-2">
                Instagram Handle
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-black/40">@</span>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  placeholder="username"
                  className="w-full rounded-2xl border border-brand-black/10 bg-brand-white/90 px-4 py-3 pl-8 text-sm text-brand-black focus:border-brand-red focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 mb-2">
                YouTube Channel
              </label>
              <input
                type="url"
                value={form.youtube}
                onChange={(e) => setForm({ ...form, youtube: e.target.value })}
                placeholder="https://youtube.com/@username"
                className="w-full rounded-2xl border border-brand-black/10 bg-brand-white/90 px-4 py-3 text-sm text-brand-black focus:border-brand-red focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 mb-2">
                Portfolio Link
              </label>
              <input
                type="url"
                value={form.portfolio}
                onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-2xl border border-brand-black/10 bg-brand-white/90 px-4 py-3 text-sm text-brand-black focus:border-brand-red focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-brand-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-brand-white transition hover:bg-brand-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-wait disabled:bg-brand-black/60"
          >
            {loading ? "Saving..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
