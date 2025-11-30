import { Router, type Request, type Response } from "express";
import prisma from "../lib/prisma.js";
import { clearAuthCookie, setAuthCookie, createAuthToken } from "../lib/jwt.js";
import { buildSessionUser } from "../lib/session.js";
import { scoreCreator } from "../services/creatorScoringService.js";
// import { emailService } from "../services/emailService.js"; // Assume an email service exists

const router = Router();
const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_SCOPES = ["openid", "email", "profile"];
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.WEB_APP_URL || "http://localhost:5173";

router.get("/auth/google/url", (_req, res) => {
  console.log(">>> HIT /auth/google/url");
  const rawClientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientId = rawClientId.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const secret = process.env.GOOGLE_CLIENT_SECRET || "";
  const maskedSecret = secret ? `${secret.slice(0, 4)}****` : "[MISSING]";
  console.log(">>> GOOGLE CLIENT ID =", clientId || "[MISSING]");
  console.log(">>> GOOGLE CLIENT SECRET =", maskedSecret);
  console.log(">>> REDIRECT URI =", redirectUri || "[MISSING]");
  if (rawClientId !== clientId) {
    console.log(">>> WARNING: Client ID contains leading/trailing whitespace");
  }
  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: "Google OAuth is not configured" });
  }
  const url = buildGoogleAuthUrl(clientId, redirectUri);
  console.log(">>> FINAL OAUTH URL =", url);
  res.json({ url });
});

router.get("/auth/google/callback", async (req: Request, res: Response) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.access_token) {
      return res.status(400).json({ error: "Failed to exchange authorization code" });
    }
    const profile = await fetchGoogleProfile(tokens.access_token, tokens.id_token);
    if (!profile?.email) {
      return res.status(400).json({ error: "Google profile missing email" });
    }
    const normalizedEmail = profile.email.toLowerCase();
    const adminEmails = ["lila@thebreakco.com", "mo@thebreakco.com"];
    const isNewUser = !(await prisma.user.findUnique({ where: { email: normalizedEmail } }));
    const roleName = adminEmails.includes(normalizedEmail) ? "ADMIN" : "CREATOR";
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        name: profile.name || profile.given_name || normalizedEmail,
        avatarUrl: profile.picture || null,
        roles: {
          create: [{ role: { connect: { name: roleName } } }]
        }
      },
      update: {
        name: profile.name || profile.given_name || normalizedEmail,
        avatarUrl: profile.picture || null
      },
      include: {
        roles: {
          include: { role: true }
        }
      }
    });

    // If the user is newly created, trigger the AI scoring process.
    if (isNewUser && !adminEmails.includes(normalizedEmail)) {
      console.log(`New user created (${user.email}). Triggering AI scoring.`);
      const profilePayload = {
        name: profile.name,
        bio: 'Newly signed up user.', // In a real app, you'd get this from an onboarding form
        socials: [], // Or from social connections
      };
      const scoredUser = await scoreCreator(user, profilePayload);

      if (scoredUser.upgrade_suggested) {
        console.log(`Upgrade suggested for ${user.email}. Sending notification.`);
        // await emailService.sendUpgradeRecommendationEmail(scoredUser);
      }
    }

    const token = createAuthToken({ id: user.id });
    setAuthCookie(res, token);
    res.redirect(buildPostAuthRedirect());
  } catch (error) {
    console.error("Google OAuth callback error", error);
    res.status(500).json({ error: "OAuth failed" });
  }
});

router.get("/auth/me", async (req: Request, res: Response) => {
  if (!req.user) return res.json({ user: null });
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        roles: { include: { role: true } }
      }
    });
    res.json({ user: user ? buildSessionUser(user) : null });
  } catch (error) {
    console.error("/auth/me lookup failed", error);
    res.status(500).json({ error: "Failed to load session" });
  }
});

router.post("/auth/logout", (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

export default router;

function buildGoogleAuthUrl(clientId: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "select_account"
  });
  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

async function exchangeCodeForTokens(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth environment variables are not configured");
  }
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code with Google: ${error}`);
  }
  return (await response.json()) as GoogleTokenResponse;
}

async function fetchGoogleProfile(accessToken: string, idToken?: string | null) {
  if (idToken) {
    try {
      const payload = decodeJwt<GoogleProfile>(idToken);
      if (payload?.email) {
        return payload;
      }
    } catch {
      // continue to fetch userinfo endpoint
    }
  }
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to load Google profile: ${error}`);
  }
  return (await response.json()) as GoogleProfile;
}

async function getRoleNamesForUser(userId: string) {
  const assignments = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true }
  });
  return assignments.map((assignment) => assignment.role.name);
}

function buildPostAuthRedirect() {
  try {
    const url = new URL(FRONTEND_ORIGIN);
    if (!url.pathname || url.pathname === "/") {
      url.pathname = "/dashboard";
    }
    return url.toString();
  } catch {
    return "http://localhost:5173/dashboard";
  }
}

function decodeJwt<T>(token: string) {
  const [, payload] = token.split(".");
  if (!payload) return null;
  try {
    const json = Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

type GoogleTokenResponse = {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

type GoogleProfile = {
  sub?: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  picture?: string;
};
