import crypto from "crypto";
import { safeEnv } from '../utils/safeEnv';

export function buildOAuthState(userId: string) {
  return Buffer.from(
    JSON.stringify({
      userId,
      nonce: crypto.randomUUID(),
      timestamp: Date.now()
    })
  ).toString("base64url");
}

export function parseOAuthState(state: string): { userId: string } {
  const decoded = Buffer.from(state, "base64url").toString("utf8");
  return JSON.parse(decoded);
}

export function buildOAuthUrl(base: string, params: Record<string, string>) {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

export function getOAuthConfig(prefix: string) {
  return {
    clientId: safeEnv(`${prefix}_CLIENT_ID`, "test-client"),
    clientSecret: safeEnv(`${prefix}_CLIENT_SECRET`, "test-secret"),
    redirectUri: safeEnv(`${prefix}_REDIRECT_URI`, "http://localhost:5000/oauth/callback")
  };
}
