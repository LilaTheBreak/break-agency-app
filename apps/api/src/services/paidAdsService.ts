/**
 * Phase 4.5: Paid Ads API Service
 * 
 * Queries real paid campaign data from:
 * - Meta Ads API (Instagram, Facebook)
 * - TikTok Ads API
 * 
 * Uses OAuth tokens stored in SocialAccountConnection table
 */

import prisma from "../lib/prisma.js";

interface AdCampaign {
  id: string;
  name: string;
  platform: string;
  postType: string;
  reach: number;
  engagements: number;
  spend: number;
  costPerEngagement: number;
  performance: "Strong" | "Average" | "Underperforming";
  status: string;
}

/**
 * Query Instagram/Facebook Ads via Meta Ads API
 */
async function queryMetaAdsCampaigns(
  talentId: string,
  accessToken: string
): Promise<AdCampaign[]> {
  try {
    const metaApiVersion = "v18.0"; // Meta Graph API version
    const metaBaseUrl = `https://graph.instagram.com/${metaApiVersion}`;

    console.log("[PAID_ADS] Querying Meta Ads API for Instagram campaigns...");

    // Step 1: Get Instagram user's ad accounts
    const userResponse = await fetch(`${metaBaseUrl}/me/adaccounts?access_token=${accessToken}`, {
      method: "GET",
    });

    if (!userResponse.ok) {
      console.warn(`[PAID_ADS] Meta API error: ${userResponse.status} ${userResponse.statusText}`);
      return [];
    }

    const userData = await userResponse.json();
    const adAccounts = userData.data || [];

    if (adAccounts.length === 0) {
      console.log("[PAID_ADS] No ad accounts found for this token");
      return [];
    }

    // Step 2: Get campaigns from first ad account
    const firstAdAccountId = adAccounts[0].id;
    const campaignsResponse = await fetch(
      `${metaBaseUrl}/${firstAdAccountId}/campaigns?fields=id,name,status,spend,insights{impressions,clicks,actions}&access_token=${accessToken}`,
      { method: "GET" }
    );

    if (!campaignsResponse.ok) {
      console.warn("[PAID_ADS] Failed to fetch Meta campaigns");
      return [];
    }

    const campaignsData = await campaignsResponse.json();
    const campaigns = campaignsData.data || [];

    // Step 3: Transform to our format
    const formattedCampaigns = campaigns
      .filter((c: any) => c.status === "ACTIVE")
      .slice(0, 5) // Top 5 campaigns
      .map((campaign: any) => {
        const spend = parseFloat(campaign.spend || "0");
        const insights = campaign.insights?.data?.[0] || {};
        const impressions = parseInt(insights.impressions || "0");
        const clicks = parseInt(insights.clicks || "0");

        // Calculate engagements (clicks + actions)
        const actions = insights.actions || [];
        const actionCount = actions.reduce((sum: number, a: any) => sum + (a.value || 0), 0);
        const engagements = clicks + actionCount;

        // Calculate CPE
        const costPerEngagement = spend > 0 && engagements > 0 ? spend / engagements : 0;

        // Performance rating
        let performance: "Strong" | "Average" | "Underperforming" = "Average";
        if (costPerEngagement < 0.5) {
          performance = "Strong";
        } else if (costPerEngagement > 2.0) {
          performance = "Underperforming";
        }

        return {
          id: campaign.id,
          name: campaign.name,
          platform: "Instagram",
          postType: "Campaign",
          reach: impressions,
          engagements,
          spend: parseFloat(spend.toFixed(2)),
          costPerEngagement: parseFloat(costPerEngagement.toFixed(2)),
          performance,
          status: campaign.status,
        };
      });

    console.log(`[PAID_ADS] Found ${formattedCampaigns.length} active Instagram campaigns`);
    return formattedCampaigns;
  } catch (error) {
    console.error("[PAID_ADS] Error querying Meta Ads API:", error);
    return [];
  }
}

/**
 * Query TikTok Ads via TikTok Business API
 */
async function queryTikTokAdsCampaigns(
  talentId: string,
  accessToken: string
): Promise<AdCampaign[]> {
  try {
    const tiktokApiVersion = "v1.3";
    const tiktokBaseUrl = `https://business-api.tiktok.com/open_api/${tiktokApiVersion}`;

    console.log("[PAID_ADS] Querying TikTok Ads API for campaigns...");

    // Step 1: Get advertiser ID (TikTok requires this)
    const advertiserResponse = await fetch(`${tiktokBaseUrl}/oauth2/advertiser/get/`, {
      method: "GET",
      headers: {
        "Access-Token": accessToken,
      },
    });

    if (!advertiserResponse.ok) {
      console.warn(`[PAID_ADS] TikTok API error: ${advertiserResponse.status}`);
      return [];
    }

    const advertiserData = await advertiserResponse.json();
    const advertiserId = advertiserData.data?.advertiser_ids?.[0];

    if (!advertiserId) {
      console.log("[PAID_ADS] No advertiser found for TikTok token");
      return [];
    }

    // Step 2: Get campaigns
    const campaignsResponse = await fetch(
      `${tiktokBaseUrl}/campaign/get/?advertiser_id=${advertiserId}&campaign_ids=[]&page_size=100`,
      {
        method: "GET",
        headers: {
          "Access-Token": accessToken,
        },
      }
    );

    if (!campaignsResponse.ok) {
      console.warn("[PAID_ADS] Failed to fetch TikTok campaigns");
      return [];
    }

    const campaignsData = await campaignsResponse.json();
    const campaigns = campaignsData.data?.campaigns || [];

    // Step 3: Get campaign insights
    const campaignIds = campaigns.slice(0, 5).map((c: any) => c.campaign_id);

    if (campaignIds.length === 0) {
      return [];
    }

    // Fetch insights for each campaign
    const formattedCampaigns = await Promise.all(
      campaignIds.map(async (campaignId: string) => {
        try {
          const insightsResponse = await fetch(
            `${tiktokBaseUrl}/campaign/insight/?advertiser_id=${advertiserId}&campaign_ids=[${campaignId}]&fields=campaign_id,campaign_name,budget,status,impressions,clicks,conversions,spend`,
            {
              method: "GET",
              headers: {
                "Access-Token": accessToken,
              },
            }
          );

          if (!insightsResponse.ok) {
            return null;
          }

          const insightsData = await insightsResponse.json();
          const campaign = insightsData.data?.campaigns?.[0];

          if (!campaign) {
            return null;
          }

          const spend = parseFloat(campaign.spend || "0");
          const impressions = parseInt(campaign.impressions || "0");
          const clicks = parseInt(campaign.clicks || "0");
          const conversions = parseInt(campaign.conversions || "0");

          const engagements = clicks + conversions;
          const costPerEngagement = spend > 0 && engagements > 0 ? spend / engagements : 0;

          let performance: "Strong" | "Average" | "Underperforming" = "Average";
          if (costPerEngagement < 0.5) {
            performance = "Strong";
          } else if (costPerEngagement > 2.0) {
            performance = "Underperforming";
          }

          return {
            id: campaign.campaign_id,
            name: campaign.campaign_name,
            platform: "TikTok",
            postType: "Campaign",
            reach: impressions,
            engagements,
            spend: parseFloat(spend.toFixed(2)),
            costPerEngagement: parseFloat(costPerEngagement.toFixed(2)),
            performance,
            status: campaign.status,
          };
        } catch (err) {
          console.error(`[PAID_ADS] Error fetching TikTok campaign insights:`, err);
          return null;
        }
      })
    );

    const validCampaigns = formattedCampaigns.filter((c) => c !== null) as AdCampaign[];
    console.log(`[PAID_ADS] Found ${validCampaigns.length} active TikTok campaigns`);
    return validCampaigns;
  } catch (error) {
    console.error("[PAID_ADS] Error querying TikTok Ads API:", error);
    return [];
  }
}

/**
 * Query YouTube Ads via Google Ads API
 */
async function queryYouTubeAdsCampaigns(
  talentId: string,
  accessToken: string
): Promise<AdCampaign[]> {
  try {
    const googleAdsApiVersion = "v14";
    const googleAdsBaseUrl = `https://googleads.googleapis.com/${googleAdsApiVersion}/customers`;

    console.log("[PAID_ADS] Querying Google Ads API for YouTube campaigns...");

    // Get customer accounts
    const customersResponse = await fetch(`${googleAdsBaseUrl}:listAccessibleCustomers`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
      },
    });

    if (!customersResponse.ok) {
      console.warn(`[PAID_ADS] Google Ads API error: ${customersResponse.status}`);
      return [];
    }

    const customersData = await customersResponse.json();
    const customerIds = customersData.resourceNames || [];

    if (customerIds.length === 0) {
      console.log("[PAID_ADS] No Google Ads customers found");
      return [];
    }

    // Extract first customer ID
    const customerId = customerIds[0].replace("customers/", "");

    // Query campaigns with GAQL (Google Ads Query Language)
    const campaignsResponse = await fetch(
      `${googleAdsBaseUrl}/${customerId}/googleAds:search`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
        },
        body: JSON.stringify({
          query: `
            SELECT
              campaign.id,
              campaign.name,
              campaign.status,
              metrics.impressions,
              metrics.clicks,
              metrics.cost_micros,
              metrics.conversions
            FROM campaign
            WHERE campaign.status != "REMOVED"
            LIMIT 5
          `,
        }),
      }
    );

    if (!campaignsResponse.ok) {
      console.warn("[PAID_ADS] Failed to fetch Google Ads campaigns");
      return [];
    }

    const campaignsData = await campaignsResponse.json();
    const results = campaignsData.results || [];

    const formattedCampaigns = results
      .map((result: any) => {
        const campaign = result.campaign;
        const metrics = result.metrics;

        // Google Ads costs are in micros (divide by 1,000,000)
        const spend = (metrics?.costMicros || 0) / 1000000;
        const impressions = parseInt(metrics?.impressions || "0");
        const clicks = parseInt(metrics?.clicks || "0");
        const conversions = parseInt(metrics?.conversions || "0");

        const engagements = clicks + conversions;
        const costPerEngagement = spend > 0 && engagements > 0 ? spend / engagements : 0;

        let performance: "Strong" | "Average" | "Underperforming" = "Average";
        if (costPerEngagement < 0.5) {
          performance = "Strong";
        } else if (costPerEngagement > 2.0) {
          performance = "Underperforming";
        }

        return {
          id: campaign.id,
          name: campaign.name,
          platform: "YouTube",
          postType: "Campaign",
          reach: impressions,
          engagements,
          spend: parseFloat(spend.toFixed(2)),
          costPerEngagement: parseFloat(costPerEngagement.toFixed(2)),
          performance,
          status: campaign.status,
        };
      });

    console.log(`[PAID_ADS] Found ${formattedCampaigns.length} active YouTube campaigns`);
    return formattedCampaigns;
  } catch (error) {
    console.error("[PAID_ADS] Error querying Google Ads API:", error);
    return [];
  }
}

/**
 * Get paid campaigns from direct APIs for a talent
 * Falls back gracefully if tokens not available or APIs fail
 */
export async function getPaidCampaignsFromAPIs(talentId: string): Promise<AdCampaign[]> {
  try {
    // Get social account connections for this talent
    const connections = await prisma.socialAccountConnection.findMany({
      where: {
        creatorId: talentId,
        connected: true,
        accessToken: { not: null },
      },
    });

    if (connections.length === 0) {
      console.log(`[PAID_ADS] No connected social accounts with tokens for talent ${talentId}`);
      return [];
    }

    const allCampaigns: AdCampaign[] = [];

    // Query each connected platform
    for (const connection of connections) {
      try {
        let campaigns: AdCampaign[] = [];

        if (connection.platform === "INSTAGRAM" && connection.accessToken) {
          campaigns = await queryMetaAdsCampaigns(talentId, connection.accessToken);
        } else if (connection.platform === "TIKTOK" && connection.accessToken) {
          campaigns = await queryTikTokAdsCampaigns(talentId, connection.accessToken);
        } else if (connection.platform === "YOUTUBE" && connection.accessToken) {
          campaigns = await queryYouTubeAdsCampaigns(talentId, connection.accessToken);
        }

        allCampaigns.push(...campaigns);
      } catch (error) {
        console.error(
          `[PAID_ADS] Error querying ${connection.platform} for talent ${talentId}:`,
          error
        );
        // Continue with other platforms
      }
    }

    // Sort by recency/activity and return top 10
    const topCampaigns = allCampaigns.slice(0, 10);
    console.log(
      `[PAID_ADS] Returning ${topCampaigns.length} campaigns from direct APIs for talent ${talentId}`
    );
    return topCampaigns;
  } catch (error) {
    console.error("[PAID_ADS] Error in getPaidCampaignsFromAPIs:", error);
    return [];
  }
}

export default {
  getPaidCampaignsFromAPIs,
  queryMetaAdsCampaigns,
  queryTikTokAdsCampaigns,
  queryYouTubeAdsCampaigns,
};
