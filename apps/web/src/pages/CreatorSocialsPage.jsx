import React, { useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";

export function CreatorSocialsPage({ session }) {
  const [connectedPlatforms, setConnectedPlatforms] = useState({
    instagram: false,
    tiktok: false,
    youtube: false,
    twitter: false
  });

  const handleConnectPlatform = async (platform) => {
    try {
      // TODO: Implement OAuth flow for each platform
      console.log(`Connecting ${platform}...`);
      // Simulating connection
      setConnectedPlatforms(prev => ({ ...prev, [platform]: true }));
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
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
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
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
                <button
                  onClick={() => handleConnectPlatform(platform.key)}
                  disabled={connectedPlatforms[platform.key]}
                  className={`mt-4 w-full rounded-lg px-3 py-2 text-xs font-medium transition ${
                    connectedPlatforms[platform.key]
                      ? "border border-green-300 bg-green-50 text-green-700"
                      : "bg-brand-red text-white hover:bg-brand-red/90"
                  }`}
                >
                  {connectedPlatforms[platform.key] ? "✓ Connected" : `Connect ${platform.name}`}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Platform Stats</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Your social media metrics help us match you with the best brand opportunities.
          </p>
          <div className="mt-6 grid gap-3">
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Total Followers</p>
              <p className="mt-2 text-2xl font-bold text-brand-black">0</p>
              <p className="text-xs text-brand-black/50">Connect platforms to sync follower data</p>
            </div>
            <div className="rounded-xl bg-brand-linen/40 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Average Engagement Rate</p>
              <p className="mt-2 text-2xl font-bold text-brand-black">—</p>
              <p className="text-xs text-brand-black/50">Automatically calculated from your platforms</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
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
