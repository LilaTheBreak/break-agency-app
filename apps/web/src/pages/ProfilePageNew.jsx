import React, { useEffect, useState, useMemo } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchProfile, saveProfile } from "../services/profileClient.js";
import { DEFAULT_PROFILE } from "../data/users.js";

// Professional link types with structured metadata
const LINK_TYPES = [
  { value: "calendly", label: "Calendly / Booking", icon: "📅", placeholder: "https://calendly.com/..." },
  { value: "portfolio", label: "Portfolio / Website", icon: "🌐", placeholder: "https://..." },
  { value: "instagram", label: "Instagram", icon: "📸", placeholder: "https://instagram.com/..." },
  { value: "tiktok", label: "TikTok", icon: "🎵", placeholder: "https://tiktok.com/@..." },
  { value: "youtube", label: "YouTube", icon: "🎬", placeholder: "https://youtube.com/@..." },
  { value: "linkedin", label: "LinkedIn", icon: "💼", placeholder: "https://linkedin.com/in/..." },
  { value: "other", label: "Custom Link", icon: "🔗", placeholder: "https://..." }
];

const VISIBILITY_OPTIONS = [
  { value: "team", label: "Visible to team" },
  { value: "clients", label: "Visible to clients/creators" },
  { value: "internal", label: "Internal only" }
];

function Section({ title, subtitle, children, className = "" }) {
  return (
    <section className={`rounded-3xl border border-brand-black/10 bg-brand-white p-6 ${className}`}>
      <div className="mb-4">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{title}</p>
        {subtitle && <p className="mt-1 text-xs text-brand-black/60">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, helper }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/70">
        {label}
        {helper && <span className="ml-2 text-brand-black/50">({helper})</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, disabled, placeholder, type = "text", readOnly = false }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`w-full rounded-2xl border px-4 py-2 text-sm focus:outline-none ${
        readOnly
          ? "border-brand-black/10 bg-brand-linen/30 text-brand-black/60 cursor-not-allowed"
          : "border-brand-black/20 focus:border-brand-black disabled:opacity-60"
      }`}
    />
  );
}

function Textarea({ value, onChange, disabled, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-60"
    />
  );
}

function Badge({ children, variant = "default" }) {
  const variants = {
    default: "border-brand-black/20 bg-brand-linen/40 text-brand-black/70",
    role: "border-brand-red/30 bg-brand-red/10 text-brand-red",
    success: "border-green-500/30 bg-green-500/10 text-green-700"
  };
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-xs uppercase tracking-[0.25em] ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function ProfilePageNew() {
  const { user: session, hasRole } = useAuth();
  const email = session?.email || "";
  const role = session?.role || "USER";

  const [profile, setProfile] = useState(() => ({ ...DEFAULT_PROFILE, email, role }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  // Form state for identity section
  const [identity, setIdentity] = useState({
    name: "",
    avatarUrl: "",
    location: "",
    timezone: "",
    pronouns: "",
    bio: ""
  });

  // Form state for links
  const [links, setLinks] = useState([]);

  // Form state for preferences
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    calendarVisibility: "team",
    language: "en"
  });

  const isSuperadmin = hasRole("SUPERADMIN");
  const isAdmin = hasRole("ADMIN", "SUPERADMIN");
  const isAgent = hasRole("AGENT");
  const isCreator = hasRole("CREATOR");
  const isFounder = hasRole("FOUNDER");

  useEffect(() => {
    if (!email) return;
    let active = true;
    setLoading(true);
    setError("");
    
    fetchProfile(email)
      .then((loaded) => {
        if (!active) return;
        setProfile(loaded);
        setIdentity({
          name: loaded.name || "",
          avatarUrl: loaded.avatarUrl || loaded.profilePhoto || loaded.avatar || "",
          location: loaded.location || "",
          timezone: loaded.timezone || "",
          pronouns: loaded.pronouns || "",
          bio: loaded.bio || ""
        });
        setLinks(loaded.links || []);
        setPreferences({
          emailNotifications: loaded.emailNotifications ?? true,
          inAppNotifications: loaded.inAppNotifications ?? true,
          calendarVisibility: loaded.calendarVisibility || "team",
          language: loaded.language || "en"
        });
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load your profile. Please refresh the page.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [email]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!email) return;

    setSaving(true);
    setError("");
    
    try {
      const payload = {
        ...identity,
        links,
        ...preferences
      };
      
      const updated = await saveProfile(email, payload);
      setProfile(updated);
      setStatusMessage("Profile saved · " + new Date().toLocaleTimeString());
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setError("Unable to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    setLinks([...links, { type: "other", label: "", url: "", visibility: "team" }]);
  };

  const updateLink = (index, field, value) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
  };

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const heroImage = identity.avatarUrl || session?.avatarUrl || "/images/default-avatar.png";

  // Activity log (sanitized for non-admins)
  const activity = useMemo(() => {
    const raw = profile.activity || [];
    // For non-admins, show only high-level actions
    if (!isAdmin) {
      return raw.filter(item => 
        !item.toLowerCase().includes("permission") &&
        !item.toLowerCase().includes("admin") &&
        !item.toLowerCase().includes("role")
      ).slice(0, 5);
    }
    return raw.slice(0, 10);
  }, [profile.activity, isAdmin]);

  if (loading) {
    return (
      <DashboardShell title="Loading profile" subtitle="Please wait...">
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-12 text-center">
          <p className="text-sm text-brand-black/60">Loading your profile...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="My Profile"
      subtitle="Update your identity, preferences, and account settings"
    >
      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 1. IDENTITY SECTION */}
        <Section title="Identity" subtitle="Core information used across the platform">
          <div className="space-y-4">
            {/* Profile Photo */}
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-brand-black/10 bg-brand-linen/60">
                <img src={heroImage} alt="Profile" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <Field label="Profile photo" helper="Used everywhere">
                  <Input
                    value={identity.avatarUrl}
                    onChange={(val) => setIdentity({ ...identity, avatarUrl: val })}
                    disabled={saving}
                    placeholder="https://your-photo.jpg or upload URL"
                  />
                </Field>
              </div>
            </div>

            {/* Name */}
            <Field label="Full name">
              <Input
                value={identity.name}
                onChange={(val) => setIdentity({ ...identity, name: val })}
                disabled={saving}
                placeholder="Your full name"
              />
            </Field>

            {/* Email (read-only) */}
            <Field label="Email" helper="Read-only">
              <Input value={email} onChange={() => {}} readOnly />
            </Field>

            {/* Role (read-only badge) */}
            <Field label="Role" helper="Assigned by admin">
              <div className="flex items-center gap-2">
                <Badge variant="role">{role}</Badge>
                {isAdmin && <span className="text-xs text-brand-black/60">• Admin privileges enabled</span>}
              </div>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Location" helper="Optional">
                <Input
                  value={identity.location}
                  onChange={(val) => setIdentity({ ...identity, location: val })}
                  disabled={saving}
                  placeholder="City, Country"
                />
              </Field>

              <Field label="Timezone" helper="Optional">
                <Input
                  value={identity.timezone}
                  onChange={(val) => setIdentity({ ...identity, timezone: val })}
                  disabled={saving}
                  placeholder="America/New_York"
                />
              </Field>
            </div>

            <Field label="Pronouns" helper="Optional">
              <Input
                value={identity.pronouns}
                onChange={(val) => setIdentity({ ...identity, pronouns: val })}
                disabled={saving}
                placeholder="they/them, she/her, he/him, etc."
              />
            </Field>

            <Field label="Bio" helper="Internal-facing, not public">
              <Textarea
                value={identity.bio}
                onChange={(val) => setIdentity({ ...identity, bio: val })}
                disabled={saving}
                placeholder="Tell the team about yourself..."
                rows={4}
              />
            </Field>
          </div>
        </Section>

        {/* 2. PROFESSIONAL LINKS */}
        <Section title="Professional links" subtitle="Calendly, portfolio, social profiles">
          <div className="space-y-3">
            {links.map((link, index) => {
              const linkType = LINK_TYPES.find(t => t.value === link.type) || LINK_TYPES[6];
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-brand-black/10 bg-brand-linen/20 p-4 space-y-3"
                >
                  <div className="grid gap-3 md:grid-cols-[120px_1fr_auto]">
                    <select
                      value={link.type}
                      onChange={(e) => updateLink(index, "type", e.target.value)}
                      disabled={saving}
                      className="rounded-xl border border-brand-black/20 px-3 py-2 text-xs uppercase tracking-wider focus:border-brand-black focus:outline-none disabled:opacity-60"
                    >
                      {LINK_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                    
                    <Input
                      value={link.url}
                      onChange={(val) => updateLink(index, "url", val)}
                      disabled={saving}
                      placeholder={linkType.placeholder}
                    />

                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      disabled={saving}
                      className="text-xs uppercase tracking-wider text-brand-red hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Optional label for custom links */}
                  {link.type === "other" && (
                    <Input
                      value={link.label || ""}
                      onChange={(val) => updateLink(index, "label", val)}
                      disabled={saving}
                      placeholder="Link label (e.g., 'Brand bookings', 'Press kit')"
                    />
                  )}

                  {/* Visibility toggle */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-brand-black/60">Visibility:</span>
                    {VISIBILITY_OPTIONS.map(opt => (
                      <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`visibility-${index}`}
                          value={opt.value}
                          checked={link.visibility === opt.value}
                          onChange={(e) => updateLink(index, "visibility", e.target.value)}
                          disabled={saving}
                          className="cursor-pointer"
                        />
                        <span className="text-brand-black/70">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addLink}
              disabled={saving}
              className="w-full rounded-2xl border border-dashed border-brand-black/30 py-3 text-xs uppercase tracking-[0.3em] text-brand-black/70 hover:border-brand-black hover:text-brand-black disabled:opacity-50"
            >
              + Add link
            </button>
          </div>
        </Section>

        {/* 3. ROLE-SPECIFIC SECTIONS */}
        {(isAdmin || isSuperadmin) && (
          <Section title="Admin context" subtitle="Teams, permissions, and responsibilities">
            <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 text-sm text-brand-black/80">
              <p>• <strong>Role:</strong> {role}</p>
              <p>• <strong>Teams led:</strong> {profile.teamsLed || "None"}</p>
              <p>• <strong>Responsibilities:</strong> {profile.responsibilities || "Platform management"}</p>
              {isSuperadmin && (
                <>
                  <p className="mt-3 pt-3 border-t border-brand-black/10 text-xs text-brand-red">
                    Superadmin capabilities enabled: User impersonation, force sign-out, permission resets
                  </p>
                </>
              )}
            </div>
          </Section>
        )}

        {isAgent && (
          <Section title="Agent context" subtitle="Talent assignments and coverage">
            <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 text-sm text-brand-black/80">
              <p>• <strong>Talent assigned:</strong> {profile.talentAssigned || "0"}</p>
              <p>• <strong>Active briefs:</strong> {profile.activeBriefs || "0"}</p>
              <p>• <strong>Coverage regions:</strong> {profile.coverageRegions || "Global"}</p>
              <p>• <strong>Availability:</strong> {profile.availability || "Active"}</p>
            </div>
          </Section>
        )}

        {(isCreator || isFounder) && (
          <Section title="Creator/Founder context" subtitle="Account type and booking preferences">
            <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 text-sm text-brand-black/80">
              <p>• <strong>Account type:</strong> {profile.accountType || "Creator"}</p>
              <p>• <strong>Primary focus:</strong> {profile.primaryFocus || "Content creation"}</p>
              <p>• <strong>Booking preferences:</strong> {profile.bookingPreferences || "Direct inquiries"}</p>
              <p>• <strong>Availability:</strong> {profile.timeAvailability || "Open to opportunities"}</p>
            </div>
          </Section>
        )}

        {/* 4. PREFERENCES */}
        <Section title="Account preferences" subtitle="Notifications, calendar, and settings">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                  disabled={saving}
                  className="h-4 w-4 rounded border-brand-black/30 cursor-pointer"
                />
                <span className="text-sm text-brand-black/80">Email notifications</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.inAppNotifications}
                  onChange={(e) => setPreferences({ ...preferences, inAppNotifications: e.target.checked })}
                  disabled={saving}
                  className="h-4 w-4 rounded border-brand-black/30 cursor-pointer"
                />
                <span className="text-sm text-brand-black/80">In-app notifications</span>
              </label>
            </div>

            <Field label="Default calendar visibility">
              <select
                value={preferences.calendarVisibility}
                onChange={(e) => setPreferences({ ...preferences, calendarVisibility: e.target.value })}
                disabled={saving}
                className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-60"
              >
                <option value="team">Visible to team</option>
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </Field>

            <Field label="Language" helper="Future feature">
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                disabled={saving}
                className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-60"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* 5. SECURITY & ACCOUNT CONTROLS */}
        <Section title="Security & account" subtitle="Password, sessions, and account management">
          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/20 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/70 mb-2">Password</p>
              <button
                type="button"
                className="text-sm text-brand-red hover:underline"
                onClick={() => alert("Password change flow coming soon")}
              >
                Change password
              </button>
            </div>

            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/20 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/70 mb-2">Active sessions</p>
              <p className="text-sm text-brand-black/80 mb-2">• Last login: {profile.lastLogin || "Just now"}</p>
              <button
                type="button"
                className="text-sm text-brand-red hover:underline"
                onClick={() => alert("Sign out all devices - coming soon")}
              >
                Sign out of all devices
              </button>
            </div>

            {isSuperadmin && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-red-700 mb-3">Superadmin actions</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    className="block text-sm text-red-700 hover:underline"
                    onClick={() => alert("Impersonate user - coming soon")}
                  >
                    Impersonate user
                  </button>
                  <button
                    type="button"
                    className="block text-sm text-red-700 hover:underline"
                    onClick={() => alert("Force sign-out - coming soon")}
                  >
                    Force sign-out user
                  </button>
                  <button
                    type="button"
                    className="block text-sm text-red-700 hover:underline"
                    onClick={() => alert("Reset permissions - coming soon")}
                  >
                    Reset permissions
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-red-700 mb-2">Danger zone</p>
              <button
                type="button"
                className="text-sm text-red-700 hover:underline"
                onClick={() => alert("Delete account requires role-based approval")}
              >
                Delete account
              </button>
            </div>
          </div>
        </Section>

        {/* 6. ACTIVITY LOG */}
        <Section title="Account activity" subtitle="Recent high-level actions">
          <div className="space-y-2">
            {activity.length === 0 ? (
              <p className="text-sm text-brand-black/60">No recent activity</p>
            ) : (
              <ul className="space-y-2 text-sm text-brand-black/70">
                {activity.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-brand-red">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        {/* SAVE BUTTON */}
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          {statusMessage ? (
            <span className="text-xs uppercase tracking-[0.35em] text-green-700">{statusMessage}</span>
          ) : (
            <span className="text-xs text-brand-black/50">Changes are saved immediately when you click Save Profile</span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-white hover:bg-brand-black/90 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </DashboardShell>
  );
}
