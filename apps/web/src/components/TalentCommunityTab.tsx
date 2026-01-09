/**
 * TalentCommunityTab
 * 
 * Community Management tab for Talent profiles
 * Shows connected social accounts and engagement metrics
 */

import React, { useState, useEffect } from "react";
import type { FC } from "react";
import { TrendingUp, TrendingDown, Minus, Plus, AlertCircle } from "lucide-react";

interface CommunityConnection {
  id: string;
  talentId: string;
  platform: "instagram" | "tiktok" | "twitter" | "youtube" | "linkedin" | "discord" | "threads";
  status: "connected" | "pending" | "error" | "inactive";
  accountHandle?: string;
  followers: number;
  lastSyncedAt?: string;
  error?: string;
  metadata?: Record<string, any>;
}

interface Metric {
  id: string;
  connectionId: string;
  talentId: string;
  platform: string;
  metricType:
    | "engagement_rate"
    | "comments_vs_likes"
    | "saves_shares"
    | "repeat_commenters"
    | "response_velocity";
  value: number;
  period: "day" | "week" | "month" | "lifetime";
  data?: Record<string, any>;
  calculatedAt?: string;
}

interface CommunitySnapshot {
  connectedPlatforms: number;
  totalAudience: number;
  engagementHealth: "Low" | "Stable" | "Strong";
  avgEngagementRate: number;
  mostEngagedPlatform?: string;
  connections: CommunityConnection[];
  metrics: Metric[];
}

interface TalentCommunityTabProps {
  talentId: string;
}

const TalentCommunityTab: FC<TalentCommunityTabProps> = ({ talentId }) => {
  const [snapshot, setSnapshot] = useState<CommunitySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasConnectedAccounts, setHasConnectedAccounts] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    fetchCommunityData();
  }, [talentId]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/community/${talentId}/snapshot`);
      if (!response.ok) {
        if (response.status === 404) {
          setSnapshot(null);
          setHasConnectedAccounts(false);
        } else {
          throw new Error("Failed to fetch community data");
        }
      } else {
        const data = await response.json();
        setSnapshot(data.snapshot);
        setHasConnectedAccounts(data.snapshot.connections.some((c: any) => c.status === "connected"));
      }
    } catch (err) {
      console.error("Error fetching community data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (platform: string) => {
    // TODO: Replace with actual trend data from metrics
    const trends: Record<string, "up" | "down" | "stable"> = {};
    const trend = trends[platform] || "stable";
    
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "Strong":
        return "text-green-600";
      case "Stable":
        return "text-blue-600";
      case "Low":
        return "text-amber-600";
      default:
        return "text-gray-600";
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading community data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error loading community data</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no connected accounts
  if (!hasConnectedAccounts || !snapshot) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center max-w-sm">
          <div className="mb-4 inline-flex p-3 bg-blue-100 rounded-full">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect your social accounts</h3>
          <p className="text-gray-600 mb-6">
            Connect your Instagram, TikTok, Twitter, and other platforms to see engagement
            metrics, audience insights, and community signals in one place.
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Account
          </button>
        </div>

        {/* TODO: Implement connect modal */}
        {showConnectModal && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">
              Connection modal coming soon - will support Instagram, TikTok, Twitter, YouTube,
              LinkedIn, Discord, and Threads
            </p>
          </div>
        )}
      </div>
    );
  }

  // Connected state - show full dashboard
  return (
    <div className="space-y-6">
      {/* Community Snapshot Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm font-medium">Platforms Connected</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{snapshot.connectedPlatforms}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm font-medium">Total Audience</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatNumber(snapshot.totalAudience)}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm font-medium">Engagement Health</p>
          <p className={`text-2xl font-bold mt-1 ${getHealthColor(snapshot.engagementHealth)}`}>
            {snapshot.engagementHealth}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm font-medium">Avg Engagement Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {(snapshot.avgEngagementRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Connected Platforms */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Platforms</h3>
        <div className="space-y-4">
          {snapshot.connections
            .filter((c) => c.status === "connected")
            .map((connection) => (
              <div key={connection.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {connection.platform.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">{connection.platform}</p>
                    {connection.accountHandle && (
                      <p className="text-sm text-gray-600">@{connection.accountHandle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Followers</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatNumber(connection.followers)}
                    </p>
                  </div>
                  {getTrendIcon(connection.platform)}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Engagement Quality Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Quality</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-sm font-medium">Comments vs Likes</p>
            <p className="text-gray-700 text-sm mt-2">
              Measures audience interaction depth. Higher comment rates indicate more engaged
              community.
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-3">
              {snapshot.avgEngagementRate > 0 ? `${(snapshot.avgEngagementRate * 100).toFixed(1)}%` : "—"}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-sm font-medium">Saves & Shares</p>
            <p className="text-gray-700 text-sm mt-2">
              Tracks how often your content is saved or shared. Strong indicator of content
              value and reach.
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-3">—</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-sm font-medium">Repeat Commenters</p>
            <p className="text-gray-700 text-sm mt-2">
              Percentage of audience that comments multiple times. Shows loyal, invested
              community members.
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-3">—</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-sm font-medium">Response Velocity</p>
            <p className="text-gray-700 text-sm mt-2">
              How quickly your audience engages after you post. Fast velocity indicates
              dedicated followers.
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-3">—</p>
          </div>
        </div>
      </div>

      {/* Community Signals */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Signals</h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-gray-600 text-sm font-medium">Most Engaged Platform</p>
            {snapshot.mostEngagedPlatform ? (
              <p className="text-lg font-semibold text-gray-900 mt-2 capitalize">
                {snapshot.mostEngagedPlatform}
              </p>
            ) : (
              <p className="text-gray-500 text-sm mt-2">No engagement data yet</p>
            )}
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-gray-600 text-sm font-medium">Content Formats</p>
            <p className="text-gray-700 text-sm mt-2">
              Analysis of which content types (carousel, reels, stories, etc.) drive the most
              engagement coming soon.
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <p className="text-gray-600 text-sm font-medium">Community Moments</p>
            <p className="text-gray-700 text-sm mt-2">
              Highlights when your community is most active and engaged coming soon.
            </p>
          </div>
        </div>
      </div>

      {/* Audience Feedback (Foundation for future AI) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Audience Feedback</h3>
        <p className="text-gray-600 text-sm mb-4">
          Foundation for sentiment analysis and community health assessment
        </p>
        <div className="space-y-3">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-gray-600 text-sm font-medium">🔸 Highlight Posts</p>
            <p className="text-gray-700 text-sm mt-1">Flag high-performing posts for analysis</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-100">
            <p className="text-gray-600 text-sm font-medium">🚩 Flag Issues</p>
            <p className="text-gray-700 text-sm mt-1">
              Track negative sentiment or community concerns
            </p>
          </div>
        </div>
        <p className="text-gray-500 text-xs mt-4 p-3 bg-gray-50 rounded">
          💡 Sentiment analysis and advanced feedback coming in future releases
        </p>
      </div>

      {/* Admin/Manager Visibility */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Admin & Manager Visibility</p>
            <p className="text-sm text-blue-800 mt-1">
              Managers and admins can view community metrics for all talent accounts they oversee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalentCommunityTab;
