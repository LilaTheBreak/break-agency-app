import axios from "axios";
import prisma from '../../lib/prisma';
import { generateId } from '../../lib/utils';

const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID;
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET;
const XERO_REDIRECT_URI = process.env.XERO_REDIRECT_URI;

const isConfigured = Boolean(
  XERO_CLIENT_ID && 
  XERO_CLIENT_SECRET && 
  XERO_REDIRECT_URI
);

/**
 * Gets the Xero OAuth authorization URL
 */
export function getXeroAuthUrl(): string {
  if (!isConfigured) {
    throw new Error("Xero OAuth not configured");
  }

  // Xero uses OAuth 2.0 with PKCE
  const scope = "accounting.transactions accounting.contacts offline_access";
  const state = Buffer.from(JSON.stringify({ 
    timestamp: Date.now()
  })).toString("base64");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: XERO_CLIENT_ID!,
    redirect_uri: XERO_REDIRECT_URI!,
    scope,
    state
  });

  return `https://login.xero.com/identity/connect/authorize?${params.toString()}`;
}

/**
 * Exchanges authorization code for access token and tenant ID
 */
export async function exchangeXeroCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tenantId: string;
  tenantName: string;
}> {
  if (!isConfigured) {
    throw new Error("Xero OAuth not configured");
  }

  // Exchange code for tokens
  const tokenResponse = await axios.post(
    "https://identity.xero.com/connect/token",
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: XERO_REDIRECT_URI!
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString("base64")}`
      }
    }
  );

  const { access_token, refresh_token, expires_in } = tokenResponse.data;

  // Get tenant information (Xero allows multiple tenants per connection)
  const tenantsResponse = await axios.get("https://api.xero.com/connections", {
    headers: {
      "Authorization": `Bearer ${access_token}`
    }
  });

  const tenants = tenantsResponse.data;
  if (!tenants || tenants.length === 0) {
    throw new Error("No Xero tenants found");
  }

  // Use the first tenant (in production, you might want to let user select)
  const tenant = tenants[0];

  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
    tenantId: tenant.tenantId,
    tenantName: tenant.tenantName
  };
}

/**
 * Gets or refreshes Xero access token
 */
export async function getXeroToken(): Promise<{ accessToken: string; tenantId: string } | null> {
  const connection = await prisma.xeroConnection.findFirst({
    where: { connected: true }
  });

  if (!connection?.accessToken || !connection.tenantId) {
    return null;
  }

  // Check if token needs refresh (refresh if within 5 minutes of expiration)
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  if (connection.expiresAt && connection.expiresAt < fiveMinutesFromNow && connection.refreshToken) {
    try {
      const refreshResponse = await axios.post(
        "https://identity.xero.com/connect/token",
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: connection.refreshToken
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString("base64")}`
          }
        }
      );

      const { access_token, refresh_token, expires_in } = refreshResponse.data;

      await prisma.xeroConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token || connection.refreshToken, // Keep old refresh token if not provided
          expiresAt: new Date(Date.now() + expires_in * 1000),
          updatedAt: new Date()
        }
      });

      return {
        accessToken: access_token,
        tenantId: connection.tenantId
      };
    } catch (error) {
      console.error("[XERO] Token refresh failed:", error);
      // Mark connection as disconnected if refresh fails
      await prisma.xeroConnection.update({
        where: { id: connection.id },
        data: {
          connected: false,
          updatedAt: new Date()
        }
      });
      return null;
    }
  }

  return {
    accessToken: connection.accessToken,
    tenantId: connection.tenantId
  };
}

/**
 * Stores Xero connection after OAuth
 */
export async function storeXeroConnection(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  tenantId: string,
  tenantName: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await prisma.xeroConnection.upsert({
    where: { id: "xero_main" }, // Single connection for now
    create: {
      id: "xero_main",
      connected: true,
      tenantId,
      accessToken,
      refreshToken,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    update: {
      connected: true,
      tenantId,
      accessToken,
      refreshToken,
      expiresAt,
      updatedAt: new Date()
    }
  });
}

