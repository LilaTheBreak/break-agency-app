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
import { Roles } from "../constants/roles.js";
import { getSuitabilityScore } from "../hooks/useSuitability.js";
import SuitabilityScore from "../components/SuitabilityScore.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function pickEditableFields(profile = DEFAULT_PROFILE) {
  return {
    name: profile.name || "",
    avatarUrl: profile.avatarUrl || profile.profilePhoto || profile.avatar || "",
    location: profile.location || "",
    timezone: profile.timezone || "",
    pronouns: profile.pronouns || "",
    accountType: profile.accountType || profile.status || "",
    bio: profile.bio || "",
    links: ensureLinkSlots(profile.links || [])
  };
}

const VARIANT_META = {
  default: {
    title: "My Profile",
    subtitle: "Update how you appear across the Break platform."
  },
  admin: {
    title: "Admin profile",
    subtitle: "Control access, onboarding markers, and talent settings." 
  },
  founder: {
    title: "Founder profile",
    subtitle: "Showcase your brand, story, and GTM signals for partners."
  },
  ugc: {
    title: "UGC creator profile",
    subtitle: "Highlight your channels, rates, and creative safeguards."
  },
  brand: {
    title: "Brand profile",
    subtitle: "Set your preferences for creator match, campaigns, and teams."
  },
  exclusive: {
    title: "Exclusive talent profile",
    subtitle: "Display your representation tier, service mix, and availability." 
  }
};

export function ProfilePage({ variant = "default" }) {
  const { user: session } = useAuth();
  const email = session?.email || "";
  const [profile, setProfile] = useState(() => ({ ...DEFAULT_PROFILE, email }));
  const [formState, setFormState] = useState(() => pickEditableFields(DEFAULT_PROFILE));
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPERADMIN';
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

  const meta = VARIANT_META[variant] || VARIANT_META.default;
  const heroImage =
    formState.avatarUrl ||
    profile.avatarUrl ||
    profile.profilePhoto ||
    profile.avatar ||
    session?.avatarUrl ||
    "/images/default-avatar.png";
  const partnerLead = profile.partnerLead || "Lila Prasad";
  const contactEmail = profile.contactEmail || email;
  const statusLabel = profile.status || "Active";
  const heroCategory = profile.accountType || profile.role || "Talent";

  return (
    <DashboardShell
      title={loading ? "Loading profile" : meta.title}
      subtitle={meta.subtitle}
    >
      {variant === "exclusive" && (
        <section className="relative mb-8 overflow-hidden rounded-[40px] border border-brand-black/10 bg-gradient-to-r from-brand-black via-brand-black/80 to-brand-black text-white shadow-[0_25px_90px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(110deg, rgba(0,0,0,0.8), rgba(0,0,0,0.5))" }} />
          <div className="relative z-10 grid gap-6 px-8 py-10 md:grid-cols-[auto,1fr]">
            <div className="flex items-center">
              <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-brand-white/10 shadow-lg">
                <img src={heroImage} alt={profile.name || "Creator avatar"} className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-white/70">{heroCategory}</p>
                <span className="rounded-full border border-white/60 px-3 py-1 text-xs uppercase tracking-[0.35em]">
                  {statusLabel}
                </span>
              </div>
              <h2 className="text-3xl font-semibold uppercase tracking-[0.2em]">{profile.name}</h2>
              <p className="text-sm text-white/80">
                {profile.location ? profile.location : "Multiple markets"} · Partner lead: {partnerLead}
              </p>
              <div className="text-sm text-white/80">
                <p>Email: {contactEmail}</p>
                <p>Category: {heroCategory}</p>
              </div>
            </div>
          </div>
        </section>
      )}
      {variant === "exclusive" && (
        <section className="section-wrapper elevation-1 p-6 transition-elevation">
          <div className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">About / biography</p>
              <p className="mt-3 text-sm text-brand-black/80">
                {profile.bio ||
                  "Experienced creator with a signature mix of luxury, travel, and short-form storytelling."}
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="card p-4 transition-elevation">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/50">Creator style</p>
                  <p className="text-sm font-semibold text-brand-black">{profile.style || "Lifestyle + travel"}</p>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60 mt-2">Key differentiators</p>
                  <p className="text-sm text-brand-black/70">
                    {profile.differentiators || "AI-ready briefs, premium hospitality, hybrid IRL experiences."}
                  </p>
                </div>
                <div className="card p-4 transition-elevation\">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/50">AI summary</p>
                  <p className="text-sm text-brand-black/70">
                    {profile.aiSummary ||
                      "AI scoring places this creator in the top 5% for consistency and brand fit—strengths in storytelling and compliance."}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-4 transition-elevation space-y-3 rounded-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Category & contact</p>
              <p className="text-sm text-brand-black/70">
                {heroCategory} · Status: {statusLabel}
              </p>
              <p className="text-sm text-brand-black/70">Locations: {profile.location || "Multiple"}</p>
              <p className="text-sm text-brand-black/70">Partner lead: {partnerLead}</p>
              <p className="text-sm text-brand-black/70">Email: {contactEmail}</p>
              <p className="text-sm text-brand-black/70">Contact: {profile.contactNumber || "N/A"}</p>
            </div>
          </div>
        </section>
      )}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <form onSubmit={handleSubmit} className="card p-6 space-y-4 transition-elevation">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Account</p>
            <h3 className="font-display text-2xl uppercase">{profile.name}</h3>
            <p className="text-sm text-brand-black/60">{email}</p>
            {error ? (
              <p className="mt-2 text-xs uppercase tracking-[0.35em] text-brand-red">{error}</p>
            ) : null}
          </div>
          <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">Profile photo URL</label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-brand-black/10 bg-brand-linen/60">
              <img src={heroImage} alt="Profile preview" className="h-full w-full object-cover" />
            </div>
            <input
              type="url"
              value={formState.avatarUrl}
              onChange={handleChange("avatarUrl")}
              disabled={loading || saving}
              className="flex-1 min-w-[200px] rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-60"
              placeholder="https://your-photo.jpg"
            />
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
          {isAdmin && (
            <>
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">Account type</label>
              <select
                value={formState.accountType}
                onChange={handleChange("accountType")}
                disabled={loading || saving}
                className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-60"
              >
                <option value="">Select account type</option>
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </>
          )}
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
                    className="flex flex-col gap-2 card p-3 transition-elevation md:flex-row md:items-center"
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
              className="rounded-full bg-brand-red px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-brand-red/90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
        <div className="space-y-4">
          <div className="panel p-5 transition-elevation">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Snapshot</p>
            <div className="mt-4 grid gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="card p-3 transition-elevation">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{stat.label}</p>
                  <p className="font-display text-2xl uppercase text-brand-black">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5 transition-elevation">
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
          <div className="card p-5 transition-elevation">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Recent activity</p>
            <ul className="mt-3 space-y-2 text-sm text-brand-black/70">
              {activity.length === 0 ? <li>No activity tracked.</li> : null}
              {activity.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="card p-5 transition-elevation">
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
