import axios from "axios";
import prisma from '../../lib/prisma.js';
import { generateId } from '../../lib/utils.js';

const DOCUSIGN_CLIENT_ID = process.env.DOCUSIGN_CLIENT_ID;
const DOCUSIGN_CLIENT_SECRET = process.env.DOCUSIGN_CLIENT_SECRET;
const DOCUSIGN_REDIRECT_URI = process.env.DOCUSIGN_REDIRECT_URI;
const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;
const DOCUSIGN_BASE_URL = process.env.DOCUSIGN_BASE_URL || "https://account.docusign.com";

const isConfigured = Boolean(
  DOCUSIGN_CLIENT_ID && 
  DOCUSIGN_CLIENT_SECRET && 
  DOCUSIGN_REDIRECT_URI
);

/**
 * Gets the DocuSign OAuth authorization URL
 */
export function getDocuSignAuthUrl(userId: string): string {
  if (!isConfigured) {
    throw new Error("DocuSign OAuth not configured");
  }

  const scope = "signature impersonation";
  const state = Buffer.from(JSON.stringify({ 
    userId,
    timestamp: Date.now()
  })).toString("base64");

  const params = new URLSearchParams({
    response_type: "code",
    scope,
    client_id: DOCUSIGN_CLIENT_ID!,
    redirect_uri: DOCUSIGN_REDIRECT_URI!,
    state
  });

  return `${DOCUSIGN_BASE_URL}/oauth/auth?${params.toString()}`;
}

/**
 * Exchanges authorization code for access token
 */
export async function exchangeDocuSignCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  accountId: string;
  baseUrl: string;
}> {
  if (!isConfigured) {
    throw new Error("DocuSign OAuth not configured");
  }

  // Exchange code for tokens
  const tokenResponse = await axios.post(
    `${DOCUSIGN_BASE_URL}/oauth/token`,
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: DOCUSIGN_REDIRECT_URI!
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${DOCUSIGN_CLIENT_ID}:${DOCUSIGN_CLIENT_SECRET}`).toString("base64")}`
      }
    }
  );

  const { access_token, refresh_token, expires_in } = tokenResponse.data;

  // Get account information
  const accountResponse = await axios.get(`${DOCUSIGN_BASE_URL}/oauth/userinfo`, {
    headers: {
      "Authorization": `Bearer ${access_token}`
    }
  });

  const accounts = accountResponse.data.accounts || [];
  if (accounts.length === 0) {
    throw new Error("No DocuSign accounts found");
  }

  // Use the first account (or use DOCUSIGN_ACCOUNT_ID if specified)
  const account = DOCUSIGN_ACCOUNT_ID 
    ? accounts.find((acc: any) => acc.account_id === DOCUSIGN_ACCOUNT_ID) || accounts[0]
    : accounts[0];

  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
    accountId: account.account_id,
    baseUrl: account.base_uri
  };
}

/**
 * Gets or refreshes DocuSign access token
 */
export async function getDocuSignToken(): Promise<{ 
  accessToken: string; 
  accountId: string; 
  baseUrl: string;
} | null> {
  // Check for stored connection (using a simple key-based approach)
  const connection = await prisma.xeroConnection.findFirst({
    where: { id: "docusign_main" } // Reusing XeroConnection model structure for simplicity
  });

  // For DocuSign, we'll use environment variables for account ID and base URL
  // In production, you might want a dedicated DocuSignConnection model
  const accountId = DOCUSIGN_ACCOUNT_ID;
  const baseUrl = process.env.DOCUSIGN_API_BASE_URL || "https://demo.docusign.net/restapi";

  if (!accountId) {
    return null;
  }

  // Check if we have a stored refresh token
  if (connection?.refreshToken) {
    // Check if token needs refresh (refresh if within 5 minutes of expiration)
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    if (connection.expiresAt && connection.expiresAt < fiveMinutesFromNow) {
      try {
        const refreshResponse = await axios.post(
          `${DOCUSIGN_BASE_URL}/oauth/token`,
          new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: connection.refreshToken
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": `Basic ${Buffer.from(`${DOCUSIGN_CLIENT_ID}:${DOCUSIGN_CLIENT_SECRET}`).toString("base64")}`
            }
          }
        );

        const { access_token, refresh_token, expires_in } = refreshResponse.data;

        await prisma.xeroConnection.upsert({
          where: { id: "docusign_main" },
          create: {
            id: "docusign_main",
            connected: true,
            accessToken: access_token,
            refreshToken: refresh_token || connection.refreshToken,
            expiresAt: new Date(Date.now() + expires_in * 1000),
            tenantId: accountId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          update: {
            accessToken: access_token,
            refreshToken: refresh_token || connection.refreshToken,
            expiresAt: new Date(Date.now() + expires_in * 1000),
            updatedAt: new Date()
          }
        });

        return {
          accessToken: access_token,
          accountId,
          baseUrl
        };
      } catch (error) {
        console.error("[DOCUSIGN] Token refresh failed:", error);
        // Mark connection as disconnected if refresh fails
        try {
          await prisma.xeroConnection.update({
            where: { id: "docusign_main" },
            data: {
              connected: false,
              updatedAt: new Date()
            }
          });
        } catch (updateError) {
          // Ignore update errors
        }
        return null;
      }
    }

    return {
      accessToken: connection.accessToken!,
      accountId,
      baseUrl
    };
  }

  return null;
}

/**
 * Stores DocuSign connection after OAuth
 */
export async function storeDocuSignConnection(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  accountId: string,
  baseUrl: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await prisma.xeroConnection.upsert({
    where: { id: "docusign_main" },
    create: {
      id: "docusign_main",
      connected: true,
      tenantId: accountId,
      accessToken,
      refreshToken,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    update: {
      connected: true,
      tenantId: accountId,
      accessToken,
      refreshToken,
      expiresAt,
      updatedAt: new Date()
    }
  });
}

