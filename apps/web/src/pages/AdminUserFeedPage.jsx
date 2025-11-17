import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import {
  ACCOUNT_TYPES,
  ensureLinkSlots,
  getSocialPlaceholder,
  SOCIAL_LINK_PRESETS,
  DEFAULT_PROFILE
} from "../data/users.js";
import { fetchProfile, saveProfile } from "../services/profileClient.js";
import { Badge } from "../components/Badge.jsx";

export function AdminUserFeedPage() {
  const { email } = useParams();
  const decodedEmail = decodeURIComponent(email || "");
  const [profile, setProfile] = useState(() => ({ ...DEFAULT_PROFILE, email: decodedEmail }));
  const [accountType, setAccountType] = useState(profile.accountType || "");
  const [linkDrafts, setLinkDrafts] = useState(ensureLinkSlots(profile.links || []));
  const [saveNotice, setSaveNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!decodedEmail) return;
    let active = true;
    setLoading(true);
    setError("");
    fetchProfile(decodedEmail)
      .then((loaded) => {
        if (!active) return;
        setProfile(loaded);
        setAccountType(loaded.accountType || "");
        setLinkDrafts(ensureLinkSlots(loaded.links || []));
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load this user right now.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [decodedEmail]);

  const updateLink = (index, field, value) => {
    setLinkDrafts((prev) => {
      const nextLinks = [...(prev || [])];
      nextLinks[index] = { ...nextLinks[index], [field]: value };
      return nextLinks;
    });
  };

  const addLink = () => {
    setLinkDrafts((prev) => ensureLinkSlots([...(prev || []), { label: "Custom link", url: "" }]));
  };

  const removeLink = (index) => {
    setLinkDrafts((prev) => {
      const next = [...(prev || [])];
      next.splice(index, 1);
      return ensureLinkSlots(next);
    });
  };

  const handleAdminSave = async (event) => {
    event.preventDefault();
    if (!decodedEmail) return;
    try {
      const updated = await saveProfile(decodedEmail, { accountType, links: linkDrafts });
      setProfile(updated);
      setAccountType(updated.accountType || "");
      setLinkDrafts(ensureLinkSlots(updated.links || []));
      setSaveNotice("Saved · " + new Date().toLocaleTimeString());
      setTimeout(() => setSaveNotice(""), 4000);
    } catch (err) {
      console.error(err);
      setError("Couldn't save changes just now.");
    }
  };

  return (
    <DashboardShell
      title="User Feed"
      subtitle="Preview the platform surface for each persona, review actions, and jump into their console."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-brand">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
              Viewing profile
            </p>
            <h3 className="mt-1 font-display text-3xl uppercase">{profile.name}</h3>
            <p className="text-sm text-brand-black/60">{decodedEmail}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.25em] text-brand-black/70">
              <span>{profile.role}</span>
              <span>• {profile.location}</span>
              <span>• {profile.timezone}</span>
              <span>• {profile.pronouns}</span>
              {profile.accountType ? <span>• {profile.accountType}</span> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(profile.tags || []).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>
        <p className="mt-4 text-sm text-brand-black/80">{profile.bio}</p>
        {error ? (
          <p className="mt-3 text-xs uppercase tracking-[0.35em] text-brand-red">{error}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to={profile.personaRoute}
            className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-white"
          >
            Open {profile.personaLabel}
          </Link>
          <Link
            to="/admin/messaging"
            className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
          >
            Message user
          </Link>
          <Link
            to="/admin/users"
            className="rounded-full border border-brand-black/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/70"
          >
            Back to directory
          </Link>
        </div>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {profile.stats?.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-brand-black/10 bg-brand-linen/80 p-5 text-center"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{stat.label}</p>
            <p className="mt-2 font-display text-4xl uppercase text-brand-black">{stat.value}</p>
          </div>
        ))}
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
          <h4 className="font-display text-xl uppercase">Account status</h4>
          <p className="mt-2 text-sm text-brand-black/70">{profile.status}</p>
          <div className="mt-4 space-y-2 text-sm text-brand-black/70">
            <p>Location: {profile.location}</p>
            <p>Timezone: {profile.timezone}</p>
            <p>Pronouns: {profile.pronouns}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
          <h4 className="font-display text-xl uppercase">Recent actions</h4>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-brand-black/80">
            {profile.activity?.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
        <form
          onSubmit={handleAdminSave}
          className="rounded-3xl border border-brand-black/10 bg-brand-white p-5 space-y-4"
        >
          <h4 className="font-display text-xl uppercase">Edit profile</h4>
          <div>
            <label className="text-xs uppercase tracking-[0.35em] text-brand-red">Account type</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            >
              <option value="">Select type</option>
              {ACCOUNT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-[0.35em] text-brand-red">Profile links</label>
              <button
                type="button"
                onClick={addLink}
                className="text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/70"
              >
                + Add
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {(linkDrafts || []).map((link, index) => {
                const labelText = link.label || `Link ${index + 1}`;
                const isPreset = SOCIAL_LINK_PRESETS.some(
                  (preset) => preset.toLowerCase() === labelText.trim().toLowerCase()
                );
                return (
                  <div key={`${labelText}-${index}`} className="space-y-2 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-3">
                    {isPreset ? (
                      <div className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-black/70">
                        {labelText}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLink(index, "label", e.target.value)}
                        placeholder="Label"
                        className="w-full rounded-xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
                      />
                    )}
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateLink(index, "url", e.target.value)}
                        placeholder={getSocialPlaceholder(labelText)}
                        className="flex-1 rounded-xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
                      />
                      {!isPreset ? (
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className="rounded-xl border border-brand-black/20 px-3 py-2 text-xs uppercase tracking-[0.3em]"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between">
            {saveNotice ? (
              <span className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60">
                {saveNotice}
              </span>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
            >
              Save
            </button>
          </div>
        </form>
      </section>
      <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-5">
        <h4 className="font-display text-xl uppercase">Profile links</h4>
        <ul className="mt-3 space-y-2 text-sm text-brand-black/80">
          {(profile.links || []).length === 0 ? (
            <li>No links available.</li>
          ) : (
            profile.links.map((link, idx) => (
              <li key={`${link.url}-${idx}`}>
                <a href={link.url} target="_blank" rel="noreferrer" className="underline hover:text-brand-red">
                  {link.label || link.url}
                </a>
              </li>
            ))
          )}
        </ul>
      </section>
    </DashboardShell>
  );
}
