import React, { useState, useMemo, useCallback } from "react";
import { Search, Plus, Zap, Link2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiFetch } from "../../services/apiClient.js";
import { parseProfileUrl, validateProfile, formatHandle, getPlatformName } from "../../lib/urlParser.js";

/**
 * ProfileInputSelector
 * 
 * Allows three ways to select a profile:
 * 1. Search existing talents in CRM
 * 2. Search connected social profiles
 * 3. Paste any social URL (Instagram, TikTok, YouTube)
 */
export default function ProfileInputSelector({ onProfileSelect, disabled }) {
  const [searchTab, setSearchTab] = useState("talent"); // "talent", "connected", "external"
  const [talentSearch, setTalentSearch] = useState("");
  const [talents, setTalents] = useState([]);
  const [connectedProfiles, setConnectedProfiles] = useState([]);
  const [talentLoading, setTalentLoading] = useState(false);
  const [connectedLoading, setConnectedLoading] = useState(false);
  const [showTalentResults, setShowTalentResults] = useState(false);
  const [showConnectedResults, setShowConnectedResults] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [externalLoading, setExternalLoading] = useState(false);

  /**
   * Search for talents
   */
  const searchTalents = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setTalents([]);
      setShowTalentResults(false);
      return;
    }

    try {
      setTalentLoading(true);
      const response = await apiFetch(`/api/admin/talent?search=${encodeURIComponent(query)}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        const talentList = Array.isArray(data.talents) ? data.talents : [];
        setTalents(talentList);
        setShowTalentResults(true);
      }
    } catch (err) {
      console.error("Error searching talents:", err);
    } finally {
      setTalentLoading(false);
    }
  }, []);

  /**
   * Fetch connected profiles
   */
  const fetchConnectedProfiles = useCallback(async () => {
    try {
      setConnectedLoading(true);
      const response = await apiFetch("/api/admin/analytics/connected-profiles");
      
      if (response.ok) {
        const data = await response.json();
        const profiles = Array.isArray(data.profiles) ? data.profiles : [];
        setConnectedProfiles(profiles);
        setShowConnectedResults(true);
      }
    } catch (err) {
      console.error("Error fetching connected profiles:", err);
      toast.error("Failed to load connected profiles");
    } finally {
      setConnectedLoading(false);
    }
  }, []);

  /**
   * Handle external URL submission
   */
  const handleSubmitExternalUrl = useCallback(async () => {
    if (!externalUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    try {
      setExternalLoading(true);
      
      // Parse the URL
      const parsed = parseProfileUrl(externalUrl);
      
      if (!parsed || !validateProfile(parsed)) {
        toast.error("Could not parse URL. Please check the format and try again.");
        return;
      }

      // Profile object for external profile
      const profile = {
        type: "external",
        id: `${parsed.platform}:${parsed.handle}`,
        name: formatHandle(parsed.handle),
        platform: parsed.platform,
        handle: parsed.handle,
        external: true,
      };

      // Call parent handler
      onProfileSelect(profile);
      
      // Clear input
      setExternalUrl("");
      
      toast.success(`Loaded ${getPlatformName(parsed.platform)} profile`);
    } catch (err) {
      console.error("Error with external URL:", err);
      toast.error("Failed to load profile");
    } finally {
      setExternalLoading(false);
    }
  }, [externalUrl, onProfileSelect]);

  /**
   * Handle talent selection
   */
  const handleSelectTalent = useCallback((talent) => {
    const profile = {
      type: "talent",
      id: talent.id,
      name: talent.displayName || talent.name,
      representationType: talent.representationType,
    };
    
    onProfileSelect(profile);
    setTalentSearch("");
    setShowTalentResults(false);
    toast.success(`Selected ${profile.name}`);
  }, [onProfileSelect]);

  /**
   * Handle connected profile selection
   */
  const handleSelectConnected = useCallback((profile) => {
    const selectedProfile = {
      type: "connected",
      id: profile.id,
      name: profile.handle,
      platform: profile.platform,
      handle: profile.handle,
    };
    
    onProfileSelect(selectedProfile);
    setShowConnectedResults(false);
    toast.success(`Selected @${profile.handle}`);
  }, [onProfileSelect]);

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-red font-semibold mb-2">
          Select Profile
        </p>
        <p className="text-sm text-brand-black/60">
          Choose a talent, connected profile, or paste any social URL
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 border-b border-brand-black/10">
        {[
          { id: "talent", label: "Talent", icon: Search },
          { id: "connected", label: "Connected", icon: Link2 },
          { id: "external", label: "Paste URL", icon: Plus },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSearchTab(tab.id);
                setShowTalentResults(false);
                setShowConnectedResults(false);
                
                // Fetch connected profiles when switching to that tab
                if (tab.id === "connected" && connectedProfiles.length === 0) {
                  fetchConnectedProfiles();
                }
              }}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs uppercase tracking-[0.2em] font-semibold transition ${
                searchTab === tab.id
                  ? "border-brand-red text-brand-red"
                  : "border-transparent text-brand-black/60 hover:text-brand-black"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {searchTab === "talent" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-black/40" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={talentSearch}
              onChange={(e) => {
                setTalentSearch(e.target.value);
                searchTalents(e.target.value);
              }}
              onFocus={() => talentSearch.length >= 2 && setShowTalentResults(true)}
              disabled={disabled || talentLoading}
              className="w-full rounded-full border border-brand-black/10 bg-white pl-12 pr-4 py-3 text-sm placeholder-brand-black/40 focus:outline-none focus:ring-2 focus:ring-brand-red/50 disabled:opacity-50"
            />
          </div>

          {talentLoading && (
            <div className="py-4 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-brand-black/10 border-t-brand-red"></div>
            </div>
          )}

          {showTalentResults && talents.length > 0 && (
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 divide-y divide-brand-black/10 max-h-64 overflow-y-auto">
              {talents.map((talent) => (
                <button
                  key={talent.id}
                  onClick={() => handleSelectTalent(talent)}
                  disabled={disabled}
                  className="w-full px-4 py-3 text-left hover:bg-brand-linen/50 transition disabled:opacity-50 text-sm"
                >
                  <p className="font-semibold text-brand-black">{talent.displayName || talent.name}</p>
                  <p className="text-xs text-brand-black/60">{talent.primaryEmail || talent.email}</p>
                  {talent.representationType && (
                    <p className="text-[0.7rem] text-brand-red uppercase tracking-[0.1em] mt-1">
                      {talent.representationType}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {showTalentResults && talentSearch.length >= 2 && talents.length === 0 && !talentLoading && (
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 text-center">
              <p className="text-sm text-brand-black/60">No talents found</p>
            </div>
          )}
        </div>
      )}

      {searchTab === "connected" && (
        <div className="space-y-4">
          {connectedLoading ? (
            <div className="py-8 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-brand-black/10 border-t-brand-red"></div>
              <p className="mt-3 text-xs text-brand-black/60 uppercase tracking-[0.1em]">
                Loading connected profiles...
              </p>
            </div>
          ) : connectedProfiles.length > 0 ? (
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 divide-y divide-brand-black/10 max-h-64 overflow-y-auto">
              {connectedProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleSelectConnected(profile)}
                  disabled={disabled}
                  className="w-full px-4 py-3 text-left hover:bg-brand-linen/50 transition disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-brand-black">@{profile.handle}</p>
                      <p className="text-xs text-brand-black/60">{getPlatformName(profile.platform)}</p>
                    </div>
                    {profile.followerCount && (
                      <div className="text-right">
                        <p className="text-xs font-semibold text-brand-black">
                          {(profile.followerCount / 1000).toFixed(0)}K
                        </p>
                        <p className="text-[0.7rem] text-brand-black/60">followers</p>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 text-center">
              <Zap className="h-8 w-8 text-brand-black/20 mx-auto mb-2" />
              <p className="text-sm text-brand-black/60">No connected profiles yet</p>
              <p className="text-xs text-brand-black/50 mt-1">Add social profiles to talents to get started</p>
            </div>
          )}
        </div>
      )}

      {searchTab === "external" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.1em] font-semibold text-brand-black/80">
              Paste Social URL
            </label>
            <input
              type="text"
              placeholder="https://instagram.com/username or https://tiktok.com/@username"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSubmitExternalUrl();
                }
              }}
              disabled={disabled || externalLoading}
              className="w-full rounded-full border border-brand-black/10 bg-white px-4 py-3 text-sm placeholder-brand-black/40 focus:outline-none focus:ring-2 focus:ring-brand-red/50 disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleSubmitExternalUrl}
            disabled={disabled || externalLoading || !externalUrl.trim()}
            className={`w-full rounded-full px-4 py-3 text-sm uppercase tracking-[0.2em] font-semibold transition ${
              disabled || externalLoading || !externalUrl.trim()
                ? "bg-brand-black/10 text-brand-black/60 cursor-not-allowed"
                : "bg-brand-red text-white hover:bg-brand-red/90"
            }`}
          >
            {externalLoading ? "Analyzing..." : "Analyze Profile"}
          </button>

          <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4">
            <p className="text-xs uppercase tracking-[0.1em] font-semibold text-brand-black/80 mb-2">
              Supported Formats
            </p>
            <ul className="text-xs text-brand-black/60 space-y-1">
              <li>✓ instagram.com/username or @username</li>
              <li>✓ tiktok.com/@username</li>
              <li>✓ youtube.com/@channelname</li>
              <li>✓ Works with www. prefix or direct links</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
