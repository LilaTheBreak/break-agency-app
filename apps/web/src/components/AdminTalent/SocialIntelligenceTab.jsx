import React, { useState, useEffect } from "react";
import { TrendingUp, Eye, Users, MessageCircle, Share2, Heart, BarChart3, AlertCircle, Zap, MessageSquare, BookmarkIcon } from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * SocialIntelligenceTab Component
 * 
 * Enterprise-grade social analytics and community intelligence
 * Turns social media from noise into strategic business leverage
 * 
 * Core Philosophy:
 * - Executive summaries first, drill-down second
 * - Everything answers "What do we do next?"
 * - No vanity metrics, only strategic insights
 * - Calm, serious, professional tone
 * 
 * Sections:
 * 1. Social Overview - 4-6 high-signal cards
 * 2. Content Performance - What actually works (ranked list)
 * 3. Keywords & Themes - What audience cares about
 * 4. Community Health - Sentiment, engagement trends
 * 5. Paid/Boosted Performance - Ad review & ROI
 * 6. Agent Insights - Human intelligence layer
 */
export function SocialIntelligenceTab({ talent, talentId, onRefreshProfileImage }) {
  const [socialData, setSocialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agentNotes, setAgentNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Fetch social intelligence data
  useEffect(() => {
    const fetchSocialIntelligence = async () => {
      if (!talentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/admin/talent/${talentId}/social-intelligence`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // No social data available - set empty state
            setSocialData({
              connected: false,
              platforms: [],
              overview: null,
              contentPerformance: [],
              keywords: [],
              community: null,
              paidContent: [],
              notes: ""
            });
            setError(null);
            return;
          }
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const data = await response.json();
        setSocialData(data.data);
        setAgentNotes(data.data?.notes || "");
        setError(null);
      } catch (err) {
        console.error("Error fetching social intelligence:", err);
        setError(err.message);
        setSocialData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialIntelligence();
  }, [talentId]);

  const handleSaveNotes = async () => {
    if (!talentId) return;

    try {
      setSavingNotes(true);
      const response = await fetch(`/api/admin/talent/${talentId}/social-intelligence/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: agentNotes }),
      });

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      toast.success("Agent notes saved");
    } catch (err) {
      toast.error(err.message || "Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  if (!talent?.socialAccounts || talent.socialAccounts.length === 0) {
    return (
      <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-12 text-center">
        <MessageCircle className="h-12 w-12 text-brand-black/30 mx-auto mb-4" />
        <p className="text-sm uppercase tracking-[0.2em] text-brand-black/60 mb-2">No Connected Socials</p>
        <p className="text-xs text-brand-black/50 max-w-sm mx-auto">
          Connect Instagram, TikTok, or YouTube to unlock social intelligence, audience insights, and community analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PHASE 0: Demo Data Warning */}
      <div className="rounded-3xl border border-amber-400/50 bg-amber-50/80 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">Demo Data — Not Real Analytics</p>
          <p className="text-xs text-amber-800 mt-1">
            This tab displays sample data for visualization. Real social analytics are coming soon. Do not use for commercial decisions until upgraded.
          </p>
        </div>
      </div>

      {/* Section 1: Social Overview */}
      <SocialOverview data={socialData} loading={loading} talent={talent} />

      {/* Section 2: Content Performance */}
      <ContentPerformanceSection data={socialData} loading={loading} />

      {/* Section 3: Keywords & Themes */}
      <KeywordsThemesSection data={socialData} loading={loading} />

      {/* Section 4: Community Health */}
      <CommunityHealthSection data={socialData} loading={loading} />

      {/* Section 5: Paid / Boosted Performance */}
      <PaidPerformanceSection data={socialData} loading={loading} />

      {/* Section 6: Agent Insights & Notes */}
      <AgentInsightsSection 
        agentNotes={agentNotes}
        onNotesChange={setAgentNotes}
        onSave={handleSaveNotes}
        saving={savingNotes}
      />
    </div>
  );
}

/**
 * Section 1: Social Overview
 * Executive summary: 4-6 high-signal cards
 */
function SocialOverview({ data, loading, talent }) {
  if (loading || !data?.overview) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-4 w-4 text-brand-black/60" />
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Social Overview</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 animate-pulse">
              <div className="h-8 bg-brand-black/10 rounded w-16 mb-2" />
              <div className="h-4 bg-brand-black/10 rounded w-24" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const overview = data.overview || {};
  const cards = [
    {
      label: "Total Reach",
      value: formatNumber(overview.totalReach || 0),
      insight: "Last 30 days",
      icon: Eye,
    },
    {
      label: "Engagement Rate",
      value: `${(overview.engagementRate || 0).toFixed(1)}%`,
      insight: overview.engagementRate > 3 ? "Above average" : "Below average",
      icon: Heart,
    },
    {
      label: "Follower Growth",
      value: `${overview.followerGrowth >= 0 ? "+" : ""}${formatNumber(overview.followerGrowth || 0)}`,
      insight: "Last 30 days",
      icon: Users,
    },
    {
      label: "Content Frequency",
      value: `${overview.postCount || 0} posts`,
      insight: `Avg ${overview.avgPostsPerWeek || 0}/week`,
      icon: MessageCircle,
    },
    {
      label: "Top Platform",
      value: overview.topPlatform || "—",
      insight: overview.topPlatformFollowers ? `${formatNumber(overview.topPlatformFollowers)} followers` : "Connect social",
      icon: TrendingUp,
    },
    {
      label: "Community Sentiment",
      value: overview.sentimentScore ? `${(overview.sentimentScore * 100).toFixed(0)}%` : "—",
      insight: getSentimentLabel(overview.sentimentScore),
      icon: MessageSquare,
    },
  ];

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-4 w-4 text-brand-black/60" />
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Social Overview</p>
        <p className="text-xs text-brand-black/50 ml-auto">Last 30 days</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{card.label}</p>
                <Icon className="h-4 w-4 text-brand-black/40" />
              </div>
              <p className="font-semibold text-lg text-brand-black mb-1">{card.value}</p>
              <p className="text-xs text-brand-black/50">{card.insight}</p>
            </div>
          );
        })}
      </div>

      {/* Connected Platforms Row */}
      <div className="mt-6 pt-6 border-t border-brand-black/10 flex gap-4">
        {talent?.socialAccounts?.map((account) => (
          <div key={account.id} className="flex items-center gap-2 rounded-xl border border-brand-black/10 bg-brand-black/5 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-brand-black">
              {account.platform === "INSTAGRAM" && "Instagram"}
              {account.platform === "TIKTOK" && "TikTok"}
              {account.platform === "YOUTUBE" && "YouTube"}
              {account.platform === "X" && "X"}
            </span>
            <span className="text-xs text-brand-black/60">@{account.handle}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Section 2: Content Performance
 * Ranked list of what actually works
 */
function ContentPerformanceSection({ data, loading }) {
  if (loading || !data?.contentPerformance) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-4 w-4 text-brand-black/60" />
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Content Performance</p>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-brand-linen/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const posts = data.contentPerformance || [];

  if (posts.length === 0) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-4 w-4 text-brand-black/60" />
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Content Performance</p>
        </div>
        <p className="text-sm text-brand-black/50 text-center py-12">No content data available yet</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-4 w-4 text-brand-black/60" />
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Content Performance</p>
        <p className="text-xs text-brand-black/50 ml-auto">Top performers</p>
      </div>

      <div className="space-y-3">
        {posts.slice(0, 8).map((post, i) => (
          <ContentPerformanceCard key={post.id || i} post={post} rank={i + 1} />
        ))}
      </div>

      {posts.length > 8 && (
        <p className="text-xs text-brand-black/50 text-center mt-4">
          {posts.length - 8} more posts
        </p>
      )}
    </section>
  );
}

function ContentPerformanceCard({ post, rank }) {
  const format = post.format || "photo";
  const formatIcons = {
    video: "🎬",
    carousel: "📸",
    story: "💬",
    reels: "⚡",
    photo: "📷",
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-brand-black/10 bg-brand-linen/50 p-4 hover:bg-brand-linen transition">
      <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-brand-black/5">
        <span className="text-lg">{formatIcons[format] || "📱"}</span>
      </div>

      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-brand-red">#{rank}</span>
          <span className="text-xs text-brand-black/60">
            {post.caption && post.caption.substring(0, 60)}
            {post.caption && post.caption.length > 60 ? "..." : ""}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-brand-black/50">
          <span>📱 {post.platform}</span>
          <span>❤️ {formatNumber(post.likes || 0)}</span>
          <span>💬 {formatNumber(post.comments || 0)}</span>
          {post.saves && <span>🔖 {formatNumber(post.saves)}</span>}
        </div>
      </div>

      <div className="text-right">
        <div className="text-sm font-semibold text-brand-black">{post.engagementRate?.toFixed(1) || 0}%</div>
        <div className="text-xs text-brand-black/50">Engagement</div>
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="flex gap-1 flex-shrink-0">
          {post.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-brand-red/10 px-2 py-1 text-xs text-brand-red"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Section 3: Keywords & Themes
 * What the audience actually cares about
 */
function KeywordsThemesSection({ data, loading }) {
  if (loading || !data?.keywords) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="h-4 w-4 text-brand-black/60" />
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Keywords & Themes</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-brand-linen/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const keywords = data.keywords || [];
  const coreThemes = keywords.filter((k) => k.category === "core") || [];
  const emergingTopics = keywords.filter((k) => k.category === "emerging") || [];
  const decliningTopics = keywords.filter((k) => k.category === "declining") || [];

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="h-4 w-4 text-brand-black/60" />
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Keywords & Themes</p>
        <p className="text-xs text-brand-black/50 ml-auto">From comments & captions</p>
      </div>

      {coreThemes.length > 0 && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60 mb-3">Core Themes</p>
          <div className="flex flex-wrap gap-2">
            {coreThemes.slice(0, 8).map((keyword) => (
              <KeywordChip key={keyword.id || keyword.term} keyword={keyword} />
            ))}
          </div>
        </div>
      )}

      {emergingTopics.length > 0 && (
        <div className="mb-6 pb-6 border-b border-brand-black/10">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60 mb-3">Emerging Topics</p>
          <div className="flex flex-wrap gap-2">
            {emergingTopics.slice(0, 6).map((keyword) => (
              <KeywordChip key={keyword.id || keyword.term} keyword={keyword} highlight="brand-amber" />
            ))}
          </div>
        </div>
      )}

      {decliningTopics.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60 mb-3">Declining Interest</p>
          <div className="flex flex-wrap gap-2">
            {decliningTopics.slice(0, 4).map((keyword) => (
              <KeywordChip key={keyword.id || keyword.term} keyword={keyword} highlight="brand-gray" />
            ))}
          </div>
        </div>
      )}

      {keywords.length === 0 && (
        <p className="text-sm text-brand-black/50 text-center py-8">
          No keyword data available yet
        </p>
      )}
    </section>
  );
}

function KeywordChip({ keyword, highlight = "brand-black" }) {
  return (
    <div className={`rounded-full border px-3 py-2 flex items-center gap-2 text-xs transition cursor-default
      ${highlight === "brand-amber" ? "border-brand-amber/30 bg-brand-amber/10 text-brand-amber" : 
        highlight === "brand-gray" ? "border-brand-black/20 bg-brand-black/5 text-brand-black/60" :
        "border-brand-red/20 bg-brand-red/10 text-brand-red"}`}>
      <span className="font-medium">{keyword.term}</span>
      <span className="text-xs opacity-70">{keyword.frequency || 0}x</span>
    </div>
  );
}

/**
 * Section 4: Community Health
 * Sentiment, engagement trends, audience signals
 */
function CommunityHealthSection({ data, loading }) {
  if (loading || !data?.community) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-4 w-4 text-brand-black/60" />
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Community Health</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-brand-linen/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const community = data.community || {};

  const healthCards = [
    {
      label: "Comment Volume",
      value: `${formatNumber(community.commentVolume || 0)}`,
      trend: community.commentTrend,
      icon: MessageCircle,
    },
    {
      label: "Response Rate",
      value: community.responseRate ? `${(community.responseRate * 100).toFixed(0)}%` : "—",
      trend: community.responseTrend,
      icon: MessageSquare,
    },
    {
      label: "Sentiment",
      value: community.averageSentiment ? `${(community.averageSentiment * 100).toFixed(0)}%` : "—",
      insight: getSentimentLabel(community.averageSentiment),
      icon: Heart,
    },
    {
      label: "Engagement Consistency",
      value: community.consistencyScore ? `${(community.consistencyScore * 100).toFixed(0)}%` : "—",
      insight: "Post-to-post stability",
      icon: TrendingUp,
    },
  ];

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-4 w-4 text-brand-black/60" />
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Community Health</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {healthCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{card.label}</p>
                <Icon className="h-4 w-4 text-brand-black/40" />
              </div>
              <p className="font-semibold text-lg text-brand-black">{card.value}</p>
              {card.trend && (
                <p className={`text-xs mt-1 ${card.trend > 0 ? "text-green-600" : "text-orange-600"}`}>
                  {card.trend > 0 ? "↑" : "↓"} {Math.abs(card.trend)}%
                </p>
              )}
              {card.insight && <p className="text-xs text-brand-black/50 mt-1">{card.insight}</p>}
            </div>
          );
        })}
      </div>

      {/* Alerts / Flags */}
      {community.alerts && community.alerts.length > 0 && (
        <div className="border-t border-brand-black/10 pt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60 mb-3 flex items-center gap-2">
            <AlertCircle className="h-3 w-3" /> Attention
          </p>
          <div className="space-y-2">
            {community.alerts.slice(0, 3).map((alert, i) => (
              <div key={i} className="rounded-lg border-l-2 border-brand-amber bg-brand-amber/10 p-3">
                <p className="text-xs text-brand-black/70">{alert.message}</p>
                {alert.context && <p className="text-xs text-brand-black/50 mt-1">{alert.context}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Section 5: Paid / Boosted Performance
 * Ad & campaign review (read-only)
 */
function PaidPerformanceSection({ data, loading }) {
  if (loading || !data?.paidContent) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-4 w-4 text-brand-black/60" />
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Paid & Boosted Performance</p>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-brand-linen/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const paid = data.paidContent || [];

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-4 w-4 text-brand-black/60" />
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Paid & Boosted Performance</p>
        <p className="text-xs text-brand-black/50 ml-auto">Campaign review</p>
      </div>

      {paid.length === 0 ? (
        <p className="text-sm text-brand-black/50 text-center py-12">
          No paid content or campaign data detected
        </p>
      ) : (
        <div className="space-y-3">
          {paid.map((campaign, i) => (
            <div key={campaign.id || i} className="rounded-xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-brand-black">
                    {campaign.name || `Campaign ${i + 1}`}
                  </p>
                  <p className="text-xs text-brand-black/60 mt-1">
                    📱 {campaign.platform} • {campaign.postType || "boosted"}
                  </p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  campaign.performance === "Strong" ? "bg-green-100 text-green-700" :
                  campaign.performance === "Average" ? "bg-brand-black/10 text-brand-black" :
                  "bg-orange-100 text-orange-700"
                }`}>
                  {campaign.performance || "Average"}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-brand-black/5 p-2">
                  <p className="text-brand-black/60 mb-1">Reach</p>
                  <p className="font-semibold text-brand-black">{formatNumber(campaign.reach || 0)}</p>
                </div>
                <div className="rounded-lg bg-brand-black/5 p-2">
                  <p className="text-brand-black/60 mb-1">Engagement</p>
                  <p className="font-semibold text-brand-black">{formatNumber(campaign.engagements || 0)}</p>
                </div>
                <div className="rounded-lg bg-brand-black/5 p-2">
                  <p className="text-brand-black/60 mb-1">Cost / Engagement</p>
                  <p className="font-semibold text-brand-black">
                    {campaign.costPerEngagement ? `£${campaign.costPerEngagement.toFixed(2)}` : "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Section 6: Agent Insights & Notes
 * Human intelligence layer for strategic notes
 */
function AgentInsightsSection({ agentNotes, onNotesChange, onSave, saving }) {
  const [edited, setEdited] = useState(false);

  const handleChange = (e) => {
    onNotesChange(e.target.value);
    setEdited(true);
  };

  const handleSave = () => {
    onSave();
    setEdited(false);
  };

  const insightTags = [
    { id: "content-opportunity", label: "Content Opportunity", color: "bg-brand-blue/10 text-brand-blue border-brand-blue/30" },
    { id: "brand-pitch", label: "Brand Pitch Angle", color: "bg-brand-amber/10 text-brand-amber border-brand-amber/30" },
    { id: "community-risk", label: "Community Risk", color: "bg-orange-100 text-orange-700 border-orange-200" },
    { id: "product-opportunity", label: "Product Opportunity", color: "bg-green-100 text-green-700 border-green-200" },
    { id: "audience-shift", label: "Audience Shift", color: "bg-purple-100 text-purple-700 border-purple-200" },
    { id: "viral-moment", label: "Viral Moment", color: "bg-brand-red/10 text-brand-red border-brand-red/30" },
  ];

  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="mb-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-2">Agent Insights</p>
        <p className="text-xs text-brand-black/60">Strategic notes and intelligence from social activity</p>
      </div>

      <div className="mb-6">
        <textarea
          value={agentNotes}
          onChange={handleChange}
          placeholder="Add strategic notes, opportunities, risks, or brand pitch angles based on social intelligence..."
          className="w-full h-32 rounded-2xl border border-brand-black/10 p-4 text-sm focus:border-brand-black focus:outline-none focus:ring-2 focus:ring-brand-red/20 resize-none"
        />
      </div>

      <div className="flex items-center justify-between mb-6 pb-6 border-b border-brand-black/10">
        <div className="flex gap-2">
          {insightTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`text-xs rounded-full border px-3 py-1 transition hover:shadow-sm ${tag.color}`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!edited || saving}
          className={`text-xs uppercase tracking-[0.2em] font-semibold px-4 py-2 rounded-full transition ${
            edited && !saving
              ? "bg-brand-red text-white hover:bg-brand-red/90 cursor-pointer"
              : "bg-brand-black/10 text-brand-black/60 cursor-not-allowed"
          }`}
        >
          {saving ? "Saving..." : "Save Notes"}
        </button>
      </div>

      {/* Sample Intelligence Prompts */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-black/60">Intelligence Guide</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-brand-black/10 bg-brand-linen/50 p-3">
            <p className="text-xs font-semibold text-brand-black mb-1">📊 What worked?</p>
            <p className="text-xs text-brand-black/60">Identify top content patterns worth repeating</p>
          </div>
          <div className="rounded-lg border border-brand-black/10 bg-brand-linen/50 p-3">
            <p className="text-xs font-semibold text-brand-black mb-1">🎯 Brand angles?</p>
            <p className="text-xs text-brand-black/60">What topics could resonate with sponsors?</p>
          </div>
          <div className="rounded-lg border border-brand-black/10 bg-brand-linen/50 p-3">
            <p className="text-xs font-semibold text-brand-black mb-1">⚠️ Risks?</p>
            <p className="text-xs text-brand-black/60">Community sentiment shifts or red flags</p>
          </div>
          <div className="rounded-lg border border-brand-black/10 bg-brand-linen/50 p-3">
            <p className="text-xs font-semibold text-brand-black mb-1">🚀 Opportunities?</p>
            <p className="text-xs text-brand-black/60">Emerging audience interests, product ideas</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Utility Functions
 */
function formatNumber(num) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function getSentimentLabel(score) {
  if (!score) return "Unknown";
  if (score >= 0.7) return "Positive";
  if (score >= 0.4) return "Neutral";
  return "Negative";
}
