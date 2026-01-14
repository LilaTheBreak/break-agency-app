import { google } from "googleapis";
import { googleConfig } from '../../config/env';

const clientId = googleConfig.clientId;
const clientSecret = googleConfig.clientSecret;

// Gmail auth uses a different callback URL than main OAuth
// Priority: GMAIL_REDIRECT_URI > derive from GOOGLE_REDIRECT_URI > fallback
const gmailRedirectUri = process.env.GMAIL_REDIRECT_URI || 
  (googleConfig.redirectUri 
    ? googleConfig.redirectUri.replace('/api/auth/google/callback', '/api/gmail/auth/callback')
    : 'http://localhost:5001/api/gmail/auth/callback');

console.log('[GMAIL AUTH] Configuration:', {
  clientId: clientId ? (clientId === 'test' ? 'TEST (invalid)' : '✓ Set') : '✗ Missing',
  clientSecret: clientSecret ? (clientSecret === 'test' ? 'TEST (invalid)' : '✓ Set') : '✗ Missing',
  redirectUri: gmailRedirectUri,
  source: process.env.GMAIL_REDIRECT_URI ? 'GMAIL_REDIRECT_URI' : 'derived from GOOGLE_REDIRECT_URI',
});

// Validate configuration
if (!clientId || clientId === 'test') {
  console.error('❌ [GMAIL AUTH] Invalid GOOGLE_CLIENT_ID - Gmail connection will fail');
}
if (!clientSecret || clientSecret === 'test') {
  console.error('❌ [GMAIL AUTH] Invalid GOOGLE_CLIENT_SECRET - Gmail connection will fail');
}
if (!gmailRedirectUri || gmailRedirectUri.includes('undefined')) {
  console.error('❌ [GMAIL AUTH] Invalid redirect URI - Gmail connection will fail');
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, gmailRedirectUri);

export function getGmailAuthUrl(state: string) {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid"
    ],
    state
  });
}

export async function exchangeCodeForTokens(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return {
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      scope: tokens.scope,
      tokenType: tokens.token_type,
      idToken: tokens.id_token
    };
  } catch (error) {
    console.error("[GMAIL AUTH] Token exchange failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: code ? "present" : "missing",
    });
    
    // Re-throw with more context
    if (error instanceof Error) {
      if (error.message.includes("redirect_uri_mismatch")) {
        throw new Error(`Gmail OAuth failed: Redirect URI mismatch. Check Google Cloud Console configuration. Original: ${error.message}`);
      } else if (error.message.includes("invalid_grant") || error.message.includes("Code was already redeemed")) {
        throw new Error(`Gmail OAuth failed: Authorization code invalid or expired. User needs to try connecting again. Original: ${error.message}`);
      } else if (error.message.includes("invalid_client")) {
        throw new Error(`Gmail OAuth failed: Invalid client credentials. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. Original: ${error.message}`);
      }
    }
    
    throw error;
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const client = new google.auth.OAuth2(clientId, clientSecret, gmailRedirectUri);
  client.setCredentials({ refresh_token: refreshToken });
  const response = await client.getAccessToken();
  const credentials = (response as any)?.credentials || client.credentials;
  return {
    accessToken: (credentials as any)?.token || "",
    refreshToken,
    expiresAt: (credentials as any)?.expiry_date ? new Date((credentials as any).expiry_date) : undefined
  };
}
