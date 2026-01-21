import React, { useState, useEffect } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

export function CreatorSocialsPage({ session }) {
  const { user } = useAuth();
  const [connectedPlatforms, setConnectedPlatforms] = useState({
    instagram: false,
    tiktok: false,
    youtube: false,
    twitter: false
  });
  const [isConnecting, setIsConnecting] = useState(null);
  const [platformData, setPlatformData] = useState({});

  // Load user's connected platforms on mount
  useEffect(() => {
    const loadConnectedPlatforms = async () => {
      try {
        const response = await fetch("/api/talent/socials", {
          headers: { "Content-Type": "application/json" }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.platforms) {
            const connected = {
              instagram: !!data.platforms.find(p => p.platform === "INSTAGRAM"),
              tiktok: !!data.platforms.find(p => p.platform === "TIKTOK"),
              youtube: !!data.platforms.find(p => p.platform === "YOUTUBE"),
              twitter: !!data.platforms.find(p => p.platform === "TWITTER")
            };
            setConnectedPlatforms(connected);
            setPlatformData(data.platforms || []);
          }
        }
      } catch (error) {
        console.error("Failed to load connected platforms:", error);
      }
    };
    loadConnectedPlatforms();
  }, []);

  const handleConnectPlatform = async (platform) => {
    setIsConnecting(platform);
    try {
      let endpoint = "";
      switch (platform) {
        case "instagram":
          endpoint = "/api/auth/instagram/connect";
          break;
        case "tiktok":
          endpoint = "/api/auth/tiktok/connect";
          break;
        case "youtube":
          endpoint = "/api/auth/youtube/connect";
          break;
        case "twitter":
          endpoint = "/api/auth/twitter/connect";
          break;
        default:
          throw new Error("Unknown platform");
      }

      // Call the auth endpoint to get OAuth URL
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to OAuth provider
        window.location.href = data.url;
      } else {
        toast.error(`Failed to connect ${platform}: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
      toast.error(`Error connecting ${platform}: ${error.message}`);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnectPlatform = async (platform) => {
    if (!window.confirm(`Are you sure you want to disconnect ${platform}?`)) return;

    try {
      const response = await fetch(`/api/talent/socials/${platform}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setConnectedPlatforms(prev => ({ ...prev, [platform]: false }));
        toast.success(`${platform} disconnected successfully`);
      } else {
        toast.error(`Failed to disconnect ${platform}`);
      }
    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error);
      toast.error(`Error disconnecting ${platform}`);
    }
  };

  const platforms = [
    {
      name: "Instagram",
      key: "instagram",
      icon: "📷",
      description: "Connect your Instagram account to sync campaigns and insights",
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "TikTok",
      key: "tiktok",
      icon: "🎵",
      description: "Connect your TikTok account for brand collaboration opportunities",
      color: "from-black to-gray-700"
    },
    {
      name: "YouTube",
      key: "youtube",
      icon: "▶️",
      description: "Connect your YouTube channel to showcase your portfolio",
      color: "from-red-600 to-red-700"
    },
    {
      name: "Twitter/X",
      key: "twitter",
      icon: "𝕏",
      description: "Connect your Twitter account for news and thought leadership",
      color: "from-black to-gray-800"
    }
  ];

  return (
    <DashboardShell
      title="Social Media Accounts"
      subtitle="Connect and manage your social media profiles"
      role={session?.user?.role}
    >
      <div className="space-y-6">
        <section className="section-wrapper elevation-1 p-6 transition-elevation">
          <h2 className="text-xl font-semibold text-brand-black">Connected Platforms</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Link your social media accounts to unlock exclusive opportunities and track your performance across platforms.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {platforms.map(platform => (
              <div
                key={platform.key}
                className="rounded-xl border border-brand-black/10 bg-brand-linen/20 p-4 transition hover:border-brand-black/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{platform.icon}</span>
                      <p className="font-semibold text-brand-black">{platform.name}</p>
                    </div>
                    <p className="mt-2 text-xs text-brand-black/60">{platform.description}</p>
                  </div>
                </div>
                {connectedPlatforms[platform.key] ? (
                  <div className="mt-4 space-y-2">
                    <button
                      disabled={isConnecting === platform.key}
                      className="w-full rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 transition disabled:opacity-50"
                    >
                      ✓ Connected
                    </button>
                    <button
                      onClick={() => handleDisconnectPlatform(platform.key)}
                      disabled={isConnecting === platform.key}
                      className="w-full rounded-lg border border-brand-black/20 px-3 py-2 text-xs font-medium text-brand-black hover:bg-brand-black/5 disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnectPlatform(platform.key)}
                    disabled={isConnecting !== null}
                    className={`mt-4 w-full rounded-lg px-3 py-2 text-xs font-medium transition ${
                      isConnecting === platform.key
                        ? "bg-brand-red/50 text-white"
                        : "bg-brand-red text-white hover:bg-brand-red/90 disabled:opacity-50"
                    }`}
                  >
                    {isConnecting === platform.key ? "Connecting..." : `Connect ${platform.name}`}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="section-wrapper elevation-1 p-6 transition-elevation">
          <h2 className="text-xl font-semibold text-brand-black">Platform Stats</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Your social media metrics help us match you with the best brand opportunities.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Total Followers</p>
              <p className="mt-2 text-2xl font-bold text-brand-black">
                {platformData.length > 0 
                  ? platformData.reduce((sum, p) => sum + (p.followers || 0), 0).toLocaleString()
                  : "0"}
              </p>
              <p className="text-xs text-brand-black/50">
                {Object.values(connectedPlatforms).filter(Boolean).length} platform(s) connected
              </p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Average Engagement Rate</p>
              <p className="mt-2 text-2xl font-bold text-brand-black">—</p>
              <p className="text-xs text-brand-black/50">Calculated from your platforms</p>
            </div>
          </div>
        </section>

        <section className="section-wrapper elevation-1 p-6 transition-elevation">
          <h2 className="text-xl font-semibold text-brand-black">Connected Account Details</h2>
          {platformData.length > 0 ? (
            <div className="mt-6 space-y-3">
              {platformData.map((platform, idx) => (
                <div key={idx} className="rounded-xl bg-brand-linen/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-brand-black capitalize">{platform.platform.toLowerCase()}</p>
                      <p className="text-sm text-brand-black/60">@{platform.handle}</p>
                      <p className="mt-1 text-xs text-brand-black/50">
                        {platform.followers ? `${platform.followers.toLocaleString()} followers` : "Followers loading..."}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600">✓ Connected</p>
                      <p className="mt-1 text-xs text-brand-black/50">
                        {new Date(platform.connectedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-brand-linen/40 p-4 text-center">
              <p className="text-sm text-brand-black/60">No connected accounts yet</p>
              <p className="mt-1 text-xs text-brand-black/50">Connect a platform above to get started</p>
            </div>
          )}
        </section>

        <section className="section-wrapper elevation-1 p-6 transition-elevation">
          <h2 className="text-xl font-semibold text-brand-black">Privacy & Permissions</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            We only access the information needed to match you with brand opportunities. Your data is never shared with third parties.
          </p>
          <div className="mt-6 space-y-3">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-sm font-medium text-brand-black">📊 Analytics Access</p>
              <p className="text-xs text-brand-black/60">View performance metrics and insights from connected platforms</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-sm font-medium text-brand-black">🔐 Secure Connection</p>
              <p className="text-xs text-brand-black/60">OAuth-secured authentication — we never store your passwords</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-sm font-medium text-brand-black">🔄 Disconnect Anytime</p>
              <p className="text-xs text-brand-black/60">Revoke access to any platform instantly from this page</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
