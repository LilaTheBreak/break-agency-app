import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  snippet: string;
  receivedAt: Date;
  labels: string[];
}

export async function fetchGmailMessages(
  accessToken: string,
  refreshToken: string | null,
  days: number = 30,
  maxResults: number = 100
): Promise<GmailMessage[]> {
  try {
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    
    // Calculate date for filtering
    const afterDate = new Date();
    afterDate.setDate(afterDate.getDate() - days);
    const afterTimestamp = Math.floor(afterDate.getTime() / 1000);

    // Search query to filter emails
    const query = `after:${afterTimestamp} -label:spam -label:trash in:inbox`;

    // List messages
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults
    });

    const messages = listResponse.data.messages || [];
    
    // Fetch full message details
    const fullMessages: GmailMessage[] = [];
    
    for (const message of messages) {
      if (!message.id) continue;
      
      try {
        const msgResponse = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "full"
        });

        const parsed = parseGmailMessage(msgResponse.data);
        if (parsed) {
          fullMessages.push(parsed);
        }
      } catch (error) {
        console.error(`Error fetching message ${message.id}:`, error);
      }
    }

    return fullMessages;
  } catch (error: any) {
    // Handle token refresh
    if (error.code === 401 && refreshToken) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        if (credentials.access_token) {
          // Recursively retry with new token
          return fetchGmailMessages(
            credentials.access_token,
            refreshToken,
            days,
            maxResults
          );
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        throw new Error("Gmail authentication expired");
      }
    }
    
    throw error;
  }
}

function parseGmailMessage(data: any): GmailMessage | null {
  try {
    const headers = data.payload?.headers || [];
    const subject = headers.find((h: any) => h.name === "Subject")?.value || "(No Subject)";
    const from = headers.find((h: any) => h.name === "From")?.value || "";
    const to = headers.find((h: any) => h.name === "To")?.value || "";
    const date = headers.find((h: any) => h.name === "Date")?.value;
    
    const body = extractBody(data.payload);
    const snippet = data.snippet || "";
    
    return {
      id: data.id,
      threadId: data.threadId,
      subject,
      from,
      to,
      body,
      snippet,
      receivedAt: date ? new Date(date) : new Date(),
      labels: data.labelIds || []
    };
  } catch (error) {
    console.error("Error parsing message:", error);
    return null;
  }
}

function extractBody(payload: any): string {
  if (!payload) return "";
  
  // Try to get plain text body
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }
  
  // Try to get HTML body
  if (payload.mimeType === "text/html" && payload.body?.data) {
    const html = Buffer.from(payload.body.data, "base64").toString("utf-8");
    return stripHtml(html);
  }
  
  // Check parts for multipart messages
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      }
    }
    
    // Fallback to HTML
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        const html = Buffer.from(part.body.data, "base64").toString("utf-8");
        return stripHtml(html);
      }
    }
    
    // Recursively check nested parts
    for (const part of payload.parts) {
      const body = extractBody(part);
      if (body) return body;
    }
  }
  
  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function updateGmailToken(
  userId: string,
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  await prisma.gmailToken.upsert({
    where: { userId },
    create: {
      userId,
      accessToken,
      refreshToken: refreshToken || "",
      updatedAt: new Date()
    },
    update: {
      accessToken,
      refreshToken: refreshToken || undefined,
      updatedAt: new Date()
    }
  });
}
