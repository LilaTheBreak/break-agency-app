import React, { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import {
  ACCOUNT_TYPES,
  ensureLinkSlots,
  getSocialPlaceholder,
  SOCIAL_LINK_PRESETS,
  DEFAULT_PROFILE
} from "../data/users.js";
import { fetchProfile, saveProfile } from "../services/profileClient.js";
import { Roles } from "../auth/session.js";
import { getSuitabilityScore } from "../hooks/useSuitability.js";
import SuitabilityScore from "../components/SuitabilityScore.jsx";

function pickEditableFields(profile = DEFAULT_PROFILE) {
  return {
    name: profile.name || "",
    location: profile.location || "",
    timezone: profile.timezone || "",
    pronouns: profile.pronouns || "",
    accountType: profile.accountType || profile.status || "",
    bio: profile.bio || "",
    links: ensureLinkSlots(profile.links || [])
  };
}

export function ProfilePage({ session }) {
  const email = session?.email || "";
  const [profile, setProfile] = useState(() => ({ ...DEFAULT_PROFILE, email }));
  const [formState, setFormState] = useState(() => pickEditableFields(DEFAULT_PROFILE));
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isAdmin = session?.roles?.includes(Roles.ADMIN);
   const [fitResult, setFitResult] = useState(null);
  const [fitError, setFitError] = useState("");
  const [fitLoading, setFitLoading] = useState(false);

  useEffect(() => {
    if (!email) return;
    let active = true;
    setLoading(true);
    setError("");
    fetchProfile(email)
      .then((loaded) => {
        if (!active) return;
        setProfile(loaded);
        setFormState(pickEditableFields(loaded));
      })
      .catch(() => {
        if (!active) return;
        setError("We couldn't load your profile. Try refreshing the page.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [email]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) return;
    setSaving(true);
    setError("");
    try {
      const updated = await saveProfile(email, { ...formState, links: formState.links });
      setProfile(updated);
      setFormState(pickEditableFields(updated));
      setStatusMessage("Profile saved · " + new Date().toLocaleTimeString());
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (saveError) {
      console.error(saveError);
      setError("We couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateLink = (index, field, value) => {
    setFormState((prev) => {
      const nextLinks = [...(prev.links || [])];
      nextLinks[index] = { ...nextLinks[index], [field]: value };
      return { ...prev, links: nextLinks };
    });
  };

  const addLinkRow = () => {
    setFormState((prev) => ({
      ...prev,
      links: [...(prev.links || []), { label: "Custom link", url: "" }]
    }));
  };

  const removeLink = (index) => {
    setFormState((prev) => {
      const nextLinks = [...(prev.links || [])];
      nextLinks.splice(index, 1);
      return { ...prev, links: ensureLinkSlots(nextLinks) };
    });
  };

  const stats = useMemo(() => profile.stats || [], [profile]);
  const activity = useMemo(() => profile.activity || [], [profile]);
  const links = useMemo(() => (profile.links || []).filter((link) => link?.url), [profile]);

  const handleFitScore = async () => {
    setFitLoading(true);
    setFitError("");
    try {
      const result = await getSuitabilityScore({
        talent: {
          categories: ["lifestyle", "travel"],
          audienceInterests: ["fashion", "tech"],
          avgEngagementRate: 3.2,
          platforms: ["instagram", "tiktok"],
          brandSafetyFlags: []
        },
        brief: {
          industry: "travel",
          targetInterests: ["travel", "lifestyle"],
          goals: ["awareness", "ugc"],
          requiredPlatforms: ["instagram"],
          excludedCategories: []
        }
      });
      setFitResult(result);
    } catch (err) {
      setFitError(err instanceof Error ? err.message : "Unable to calculate fit");
    } finally {
      setFitLoading(false);
    }
  };

  return (
    <DashboardShell
      title={loading ? "Loading profile" : "My Profile"}
      subtitle="Update how you appear across the Break platform."
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 space-y-4">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Account</p>
            <h3 className="font-display text-2xl uppercase">{profile.name}</h3>
            <p className="text-sm text-brand-black/60">{email}</p>
            {error ? (
              <p className="mt-2 text-xs uppercase tracking-[0.35em] text-brand-red">{error}</p>
            ) : null}
          </div>
          <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">Name</label>
          <input
            type="text"
            value={formState.name}
            onChange={handleChange("name")}
            disabled={loading || saving}
            className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-60"
          />
          <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">Location</label>
          <input
            type="text"
            value={formState.location}
            onChange={handleChange("location")}
            disabled={loading || saving}
            className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-60"
          />
          <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">Timezone</label>
          <input
            type="text"
            value={formState.timezone}
            onChange={handleChange("timezone")}
            disabled={loading || saving}
            className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-60"
          />
          <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">Pronouns</label>
          <input
            type="text"
            value={formState.pronouns}
            onChange={handleChange("pronouns")}
            disabled={loading || saving}
            className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-60"
          />
          <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">Account type</label>
          <select
            value={formState.accountType}
            onChange={handleChange("accountType")}
            disabled={!isAdmin || loading || saving}
            className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-60"
          >
            <option value="">Select account type</option>
            {ACCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {!isAdmin ? (
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/50">
              Contact ops to update account type.
            </p>
          ) : null}
          <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">Bio</label>
          <textarea
            rows={4}
            value={formState.bio}
            onChange={handleChange("bio")}
            disabled={loading || saving}
            className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-60"
          />
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-[0.35em] text-brand-red">Profile links</label>
              <button
                type="button"
                onClick={addLinkRow}
                disabled={loading || saving}
                className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/70 disabled:opacity-50"
              >
                + Add link
              </button>
            </div>
            <div className="mt-2 space-y-3">
              {(formState.links || []).map((link, index) => {
                const labelText = link.label || `Link ${index + 1}`;
                const isPreset = SOCIAL_LINK_PRESETS.some(
                  (preset) => preset.toLowerCase() === labelText.trim().toLowerCase()
                );
                return (
                  <div
                    key={`${labelText}-${index}`}
                    className="flex flex-col gap-2 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-3 md:flex-row md:items-center"
                  >
                    {isPreset ? (
                      <div className="flex-1 text-xs font-semibold uppercase tracking-[0.35em] text-brand-black/70">
                        {labelText}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLink(index, "label", e.target.value)}
                        placeholder="Label"
                        disabled={loading || saving}
                        className="flex-1 rounded-xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-60"
                      />
                    )}
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateLink(index, "url", e.target.value)}
                      placeholder={getSocialPlaceholder(labelText)}
                      disabled={loading || saving}
                      className="flex-[1.6] rounded-xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-60"
                    />
                    {!isPreset ? (
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        disabled={loading || saving}
                        className="text-xs uppercase tracking-[0.3em] text-brand-black/60 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {statusMessage ? (
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/70">{statusMessage}</span>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={loading || saving}
              className="rounded-full bg-brand-black px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
        <div className="space-y-4">
          <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/80 p-5">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Snapshot</p>
            <div className="mt-4 grid gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{stat.label}</p>
                  <p className="font-display text-2xl uppercase text-brand-black">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-black/70">Suitability demo</p>
              <button
                type="button"
                onClick={handleFitScore}
                disabled={fitLoading}
                className="rounded-full border border-brand-black px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brand-black disabled:opacity-50"
              >
                {fitLoading ? "Scoring..." : "Score fit"}
              </button>
            </div>
            <p className="mt-1 text-xs text-brand-black/60">Pattern-based match vs sample travel brief (no identity inference).</p>
            {fitError ? <p className="text-xs text-brand-red">{fitError}</p> : null}
            {fitResult ? (
              <div className="mt-2">
                <SuitabilityScore {...fitResult} />
              </div>
            ) : null}
          </div>
          <div className="rounded-3xl border border-brand-black/10 bg-brand-white/90 p-5">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Recent activity</p>
            <ul className="mt-3 space-y-2 text-sm text-brand-black/70">
              {activity.length === 0 ? <li>No activity tracked.</li> : null}
              {activity.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-brand-black/10 bg-brand-white/90 p-5">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Live profile links</p>
            <ul className="mt-3 space-y-2 text-sm text-brand-black/80">
              {links.length === 0 ? <li>No links published yet.</li> : null}
              {links.map((link, idx) => (
                <li key={`${link.url}-${idx}`}>
                  <a href={link.url} target="_blank" rel="noreferrer" className="underline hover:text-brand-red">
                    {link.label || link.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
