import prisma from '../../lib/prisma.js';
import { logError } from '../../lib/logger.js';
import { google } from "googleapis";

// Google OAuth2 configuration
const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  redirectUri: process.env.GOOGLE_REDIRECT_URI || ""
};

/**
 * Link external Google Drive file to CRM record
 */
export async function linkDriveFileToRecord(
  userId: string,
  fileId: string,
  recordType: "deal" | "brand" | "contract",
  recordId: string
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    const enabled = process.env.GOOGLE_DRIVE_INTEGRATION_ENABLED === "true";
    if (!enabled) {
      return { success: false, error: "Google Drive integration disabled" };
    }

    // Get user's Google Drive connection
    const connection = await prisma.integrationConnection.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: "google_drive"
        }
      }
    });

    if (!connection || !connection.connected || !connection.accessToken) {
      return {
        success: false,
        error: "Google Drive not connected"
      };
    }

    // Set up OAuth2 client with automatic token refresh
    const oauth2Client = new google.auth.OAuth2(
      googleConfig.clientId,
      googleConfig.clientSecret,
      googleConfig.redirectUri
    );
    oauth2Client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken
    });

    // Handle automatic token refresh
    oauth2Client.on("tokens", async (newTokens) => {
      try {
        await prisma.integrationConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: newTokens.access_token || connection.accessToken,
            refreshToken: newTokens.refresh_token || connection.refreshToken,
            expiresAt: newTokens.expiry_date ? new Date(newTokens.expiry_date) : connection.expiresAt,
            updatedAt: new Date()
          }
        });
      } catch (err) {
        console.error("[GOOGLE DRIVE] Token refresh save failed:", err);
      }
    });

    // Get file info from Google Drive
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const fileResponse = await drive.files.get({
      fileId,
      fields: "id, name, webViewLink, webContentLink, mimeType, size"
    });

    const file = fileResponse.data;

    // Store link in File model
    const fileRecord = await prisma.file.create({
      data: {
        id: `drive_${fileId}_${Date.now()}`,
        userId,
        filename: file.name || "Google Drive File",
        type: file.mimeType || "application/octet-stream",
        size: file.size ? parseInt(file.size as any) : 0,
        url: file.webViewLink || file.webContentLink || `https://drive.google.com/file/d/${fileId}/view`,
        key: fileId,
        folder: recordType
      } as any
    });

    // Update last synced
    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { lastSyncedAt: new Date() }
    });

    return {
      success: true,
      fileUrl: fileRecord.url
    };
  } catch (error: any) {
    logError("Google Drive link error", error, { userId, fileId, recordType, recordId });
    
    // Handle token expiry gracefully
    if (error.code === 401 || error.message?.includes("invalid_grant")) {
      // Disconnect integration
      await prisma.integrationConnection.update({
        where: {
          userId_platform: {
            userId,
            platform: "google_drive"
          }
        },
        data: {
          connected: false,
          accessToken: null,
          refreshToken: null
        }
      });
      
      return {
        success: false,
        error: "Google Drive connection expired. Please reconnect."
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * List Google Drive files for user
 */
export async function listDriveFiles(
  userId: string,
  query?: string
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    const enabled = process.env.GOOGLE_DRIVE_INTEGRATION_ENABLED === "true";
    if (!enabled) {
      return { success: false, error: "Google Drive integration disabled" };
    }

    // Get user's Google Drive connection
    const connection = await prisma.integrationConnection.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: "google_drive"
        }
      }
    });

    if (!connection || !connection.connected || !connection.accessToken) {
      return {
        success: false,
        error: "Google Drive not connected"
      };
    }

    // Set up OAuth2 client with automatic token refresh
    const oauth2Client = new google.auth.OAuth2(
      googleConfig.clientId,
      googleConfig.clientSecret,
      googleConfig.redirectUri
    );
    oauth2Client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken
    });

    // Handle automatic token refresh
    oauth2Client.on("tokens", async (newTokens) => {
      try {
        await prisma.integrationConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: newTokens.access_token || connection.accessToken,
            refreshToken: newTokens.refresh_token || connection.refreshToken,
            expiresAt: newTokens.expiry_date ? new Date(newTokens.expiry_date) : connection.expiresAt,
            updatedAt: new Date()
          }
        });
      } catch (err) {
        console.error("[GOOGLE DRIVE] Token refresh save failed:", err);
      }
    });

    // List files
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const response = await drive.files.list({
      q: query || "trashed=false",
      fields: "files(id, name, mimeType, webViewLink, modifiedTime)",
      pageSize: 50
    });

    return {
      success: true,
      files: response.data.files || []
    };
  } catch (error: any) {
    logError("Google Drive list error", error, { userId });
    
    // Handle token expiry gracefully
    if (error.code === 401 || error.message?.includes("invalid_grant")) {
      await prisma.integrationConnection.update({
        where: {
          userId_platform: {
            userId,
            platform: "google_drive"
          }
        },
        data: {
          connected: false,
          accessToken: null,
          refreshToken: null
        }
      });
      
      return {
        success: false,
        error: "Google Drive connection expired. Please reconnect."
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

