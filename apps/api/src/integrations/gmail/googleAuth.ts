import { google } from "googleapis";

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || "";

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

export function getGmailAuthUrl(state: string) {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid"
    ],
    state
  });
}

export async function exchangeCodeForTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return {
    accessToken: tokens.access_token || "",
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.getAccessToken();
  return {
    accessToken: credentials?.token || "",
    refreshToken,
    expiresAt: credentials?.res?.data?.expiry_date ? new Date(credentials.res.data.expiry_date) : undefined
  };
}
