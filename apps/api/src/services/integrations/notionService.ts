import prisma from "../../lib/prisma.js";
import { logError } from "../../lib/logger.js";

/**
 * Sync brand summary to Notion page
 */
export async function syncBrandToNotion(
  userId: string,
  brandId: string
): Promise<{ success: boolean; pageId?: string; error?: string }> {
  try {
    const enabled = process.env.NOTION_INTEGRATION_ENABLED === "true";
    if (!enabled) {
      return { success: false, error: "Notion integration disabled" };
    }

    // Get user's Notion connection
    const connection = await prisma.integrationConnection.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: "notion"
        }
      }
    });

    if (!connection || !connection.connected || !connection.accessToken) {
      return {
        success: false,
        error: "Notion not connected"
      };
    }

    // Check if token is expired (Notion tokens don't expire, but check for 401 errors)
    // Notion access tokens are long-lived, but we should handle revocation gracefully

    // Get brand data
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        Deal: {
          where: { stage: { in: ["PAYMENT_RECEIVED", "COMPLETED"] } },
          select: { value: true, currency: true, stage: true },
          take: 10
        }
      }
    });

    if (!brand) {
      return { success: false, error: "Brand not found" };
    }

    // Calculate summary
    const totalDeals = brand.Deal.length;
    const totalValue = brand.Deal.reduce((sum, d) => sum + (d.value || 0), 0);

    // Create or update Notion page
    // @ts-ignore
    const notionClient = await import("@notionhq/client").then(m => m.Client);
    const client = new notionClient({ auth: connection.accessToken });

    const pageContent = {
      parent: {
        database_id: connection.workspaceId || undefined
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: brand.name
              }
            }
          ]
        },
        "Total Deals": {
          number: totalDeals
        },
        "Total Value": {
          number: totalValue
        },
        "Last Updated": {
          date: {
            start: new Date().toISOString()
          }
        }
      },
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Brand Summary" } }]
          }
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: `Brand: ${brand.name}\nTotal Deals: ${totalDeals}\nTotal Value: $${totalValue.toLocaleString()}`
                }
              }
            ]
          }
        }
      ]
    };

    // Try to find existing page
    let pageId: string | undefined;
    try {
      const response = await client.pages.create(pageContent as any);
      pageId = response.id;
    } catch (error: any) {
      if (error.code === "object_not_found") {
        return {
          success: false,
          error: "Notion database not found. Please reconnect Notion."
        };
      }
      throw error;
    }

    // Update last synced
    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { lastSyncedAt: new Date() }
    });

    return { success: true, pageId };
  } catch (error) {
    logError("Notion sync error", error, { userId, brandId });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Sync deal summary to Notion page
 */
export async function syncDealToNotion(
  userId: string,
  dealId: string
): Promise<{ success: boolean; pageId?: string; error?: string }> {
  try {
    const enabled = process.env.NOTION_INTEGRATION_ENABLED === "true";
    if (!enabled) {
      return { success: false, error: "Notion integration disabled" };
    }

    // Get user's Notion connection
    const connection = await prisma.integrationConnection.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: "notion"
        }
      }
    });

    if (!connection || !connection.connected || !connection.accessToken) {
      return {
        success: false,
        error: "Notion not connected"
      };
    }

    // Check if token is expired (Notion tokens don't expire, but check for 401 errors)

    // Get deal data
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        Brand: { select: { name: true } },
        Talent: { select: { name: true } }
      }
    });

    if (!deal) {
      return { success: false, error: "Deal not found" };
    }

    // Create Notion page
    // @ts-ignore
    const notionClient = await import("@notionhq/client").then(m => m.Client);
    const client = new notionClient({ auth: connection.accessToken });

    const pageContent = {
      parent: {
        database_id: connection.workspaceId || undefined
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: `Deal: ${deal.brandName || deal.Brand?.name || "Unknown"}`
              }
            }
          ]
        },
        Value: {
          number: deal.value || 0
        },
        Stage: {
          select: {
            name: deal.stage
          }
        },
        "Last Updated": {
          date: {
            start: new Date().toISOString()
          }
        }
      },
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Deal Summary" } }]
          }
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: `Brand: ${deal.brandName || deal.Brand?.name || "Unknown"}\nTalent: ${deal.Talent?.name || "Unknown"}\nValue: ${deal.currency || "$"}${(deal.value || 0).toLocaleString()}\nStage: ${deal.stage}`
                }
              }
            ]
          }
        }
      ]
    };

    let pageId: string | undefined;
    try {
      const response = await client.pages.create(pageContent as any);
      pageId = response.id;
    } catch (error: any) {
      if (error.code === "object_not_found") {
        return {
          success: false,
          error: "Notion database not found. Please reconnect Notion."
        };
      }
      // Handle token expiry/revocation (401 Unauthorized)
      if (error.status === 401 || error.code === "unauthorized") {
        // Mark connection as disconnected
        await prisma.integrationConnection.update({
          where: { id: connection.id },
          data: {
            connected: false,
            accessToken: null,
            refreshToken: null
          }
        });
        return {
          success: false,
          error: "Notion connection expired. Please reconnect."
        };
      }
      throw error;
    }

    // Update last synced
    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { lastSyncedAt: new Date() }
    });

    return { success: true, pageId };
  } catch (error) {
    logError("Notion sync error", error, { userId, dealId });
    
    // Handle token expiry/revocation
    if (error && typeof error === 'object' && ('status' in error || 'code' in error)) {
      const errorStatus = (error as any).status;
      const errorCode = (error as any).code;
      if (errorStatus === 401 || errorCode === "unauthorized") {
        try {
          const connection = await prisma.integrationConnection.findUnique({
            where: {
              userId_platform: {
                userId,
                platform: "notion"
              }
            }
          });
          if (connection) {
            await prisma.integrationConnection.update({
              where: { id: connection.id },
              data: {
                connected: false,
                accessToken: null,
                refreshToken: null
              }
            });
          }
        } catch (updateError) {
          // Ignore update errors
        }
        return {
          success: false,
          error: "Notion connection expired. Please reconnect."
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

