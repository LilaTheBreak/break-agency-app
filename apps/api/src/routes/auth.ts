import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../lib/prisma.js";
import { clearAuthCookie, setAuthCookie, createAuthToken, SESSION_COOKIE_NAME } from "../lib/jwt.js";
import { buildSessionUser, type SessionUser } from "../lib/session.js";
import { SignupSchema, LoginSchema } from "./authEmailSchemas.js";
import { googleOAuthConfig } from "../config/google.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimiter, sensitiveOperationLimiter } from "../middleware/rateLimiter.js";
import { logAuthEvent, logSuperAdminAction } from "../lib/auditLogger.js";
import { sendEmail } from "../services/emailService.js";

const router = Router();

// Google OAuth constants
const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events"
];

const FRONTEND_ORIGIN_RAW =
  process.env.FRONTEND_ORIGIN ||
  process.env.WEB_APP_URL ||
  "http://localhost:5173";

// Support comma-separated origins, use first for redirects
const FRONTEND_ORIGIN = FRONTEND_ORIGIN_RAW.split(',')[0].trim();

const DEFAULT_TEST_ADMIN_EMAIL = "lila@thebreakco.com";
const DEFAULT_TEST_ADMIN_PASSWORD = "password";
const TEST_LOGIN_EMAIL =
  process.env.TEST_LOGIN_EMAIL?.toLowerCase() ?? DEFAULT_TEST_ADMIN_EMAIL;
const TEST_LOGIN_PASSWORD = process.env.TEST_LOGIN_PASSWORD ?? DEFAULT_TEST_ADMIN_PASSWORD;

/* ---------------------------------------------------------
   1. GOOGLE AUTH URL (LOGIN)
--------------------------------------------------------- */
router.get("/google/url", (_req, res) => {
  console.log(">>> HIT /auth/google/url");

  const { clientId, clientSecret, redirectUri } = googleOAuthConfig;
  const maskedSecret = clientSecret ? `${clientSecret.slice(0, 4)}****` : "[MISSING]";

  console.log(">>> GOOGLE CLIENT ID =", clientId || "[MISSING]");
  console.log(">>> GOOGLE CLIENT SECRET =", maskedSecret);
  console.log(">>> REDIRECT URI =", redirectUri || "[MISSING]");

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: "Google OAuth not configured" });
  }

  const url = buildGoogleAuthUrl(clientId, redirectUri);
  console.log(">>> FINAL OAUTH URL =", url);

  res.json({ url });
});

/* ---------------------------------------------------------
   2. GOOGLE OAUTH CALLBACK
--------------------------------------------------------- */
router.get("/google/callback", async (req: Request, res: Response) => {
  console.log("[INTEGRATION] Google OAuth callback received", {
    hasCode: !!req.query.code,
    timestamp: new Date().toISOString()
  });
  try {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    if (!code) {
      console.error("[INTEGRATION] Google OAuth failed: Missing authorization code");
      return res.status(400).json({ error: "Missing authorization code" });
    }

    // Minimal debug: show that we received a code and masked client config
    const { clientId, clientSecret, redirectUri } = googleOAuthConfig || {};
    const mask = (s?: string) => (s ? `${s.slice(0, 4)}****` : "[MISSING]");
    console.log(">>> Received auth code (len):", code.length);
    console.log(">>> Using Google clientId:", mask(clientId), " redirectUri:", redirectUri || "[MISSING]", " clientSecret:", clientSecret ? "[loaded]" : "[MISSING]");

    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.access_token) {
      return res.status(400).json({ error: "Failed to exchange authorization code" });
    }

    const profile = await fetchGoogleProfile(tokens.access_token, tokens.id_token);
    if (!profile?.email) {
      return res.status(400).json({ error: "Google profile missing email" });
    }

    const normalizedEmail = profile.email.toLowerCase();
    const adminEmails = [
      "lila@thebreakco.com", 
      "mo@thebreakco.com"
      // Add your email here if you want permanent admin access
    ];
    const isSuperAdmin = adminEmails.includes(normalizedEmail);

    /* ------------------------------------------
       Determine role for user
    ------------------------------------------ */
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // For admin emails, assign appropriate admin role
    // For existing users, keep their role
    // For new non-admin users, default to CREATOR (they can request role change later)
    let assignedRole: string;
    if (isSuperAdmin) {
      assignedRole = "SUPERADMIN";
      console.log("[AUTH] SUPERADMIN login detected:", normalizedEmail);
    } else if (existingUser) {
      assignedRole = existingUser.role;
    } else {
      // New user, default to CREATOR
      assignedRole = "CREATOR";
    }

    /* ------------------------------------------
       Fetch or create user with single role
    ------------------------------------------ */
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        name: profile.name || profile.given_name || normalizedEmail,
        avatarUrl: profile.picture || null,
        role: assignedRole as any, // Update role for admin emails
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        name: profile.name || profile.given_name || normalizedEmail,
        avatarUrl: profile.picture || null,
        role: assignedRole as any,
        updatedAt: new Date(),
      },
    });
    if (process.env.NODE_ENV !== 'production') {
      console.log("✔ Google OAuth user upsert completed:", normalizedEmail, "with role:", assignedRole);
    } else {
      console.log("[INFO] OAuth user authenticated", { role: assignedRole });
    }
    
    console.log("[INTEGRATION] Google OAuth successful", {
      email: normalizedEmail,
      role: assignedRole,
      isNewUser: !existingUser,
      timestamp: new Date().toISOString()
    });

    /* ------------------------------------------
       Store Google Account tokens for Calendar sync
       NOTE: GoogleAccount model doesn't exist in schema yet
       TODO: Add GoogleAccount model to schema for calendar sync
    ------------------------------------------ */
    // if (tokens.refresh_token || tokens.access_token) {
    //   await prisma.googleAccount.upsert({
    //     where: { userId: user.id },
    //     update: {
    //       email: normalizedEmail,
    //       accessToken: tokens.access_token || null,
    //       refreshToken: tokens.refresh_token || null,
    //       expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
    //       scope: tokens.scope || null,
    //       updatedAt: new Date(),
    //     },
    //     create: {
    //       userId: user.id,
    //       email: normalizedEmail,
    //       accessToken: tokens.access_token || null,
    //       refreshToken: tokens.refresh_token || null,
    //       expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
    //       scope: tokens.scope || null,
    //     },
    //   });
    //   console.log("✔ Google Account tokens stored for calendar sync");
    // }
    console.log("⚠ Google Account tokens NOT stored (GoogleAccount model not in schema)");

    /* ------------------------------------------
       Set JWT cookie for session
    ------------------------------------------ */
    const token = createAuthToken({ id: user.id });
    setAuthCookie(res, token);

    // Log SUPERADMIN login for security audit
    if (isSuperAdmin) {
      try {
        await logAuthEvent(req, {
          action: "SUPERADMIN_LOGIN_OAUTH",
          entityType: "User",
          entityId: user.id,
          metadata: {
            email: normalizedEmail,
            method: "google_oauth",
            role: assignedRole
          }
        });
        console.log("[AUDIT] SUPERADMIN login logged:", normalizedEmail);
      } catch (logError) {
        console.error("[AUDIT] Failed to log SUPERADMIN login:", logError);
      }
    }

    /* ------------------------------------------
       Redirect user to correct dashboard with token
    ------------------------------------------ */
    const sessionUser = buildSessionUser(user);
    const redirectUrl = buildPostAuthRedirect(sessionUser);
    
    // Append token to URL for cross-domain auth
    const urlWithToken = `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}token=${token}`;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(">>> REDIRECT INFO:", {
        email: user.email,
        role: user.role,
        sessionUserRole: sessionUser.role,
        redirectUrl: urlWithToken
      });
    } else {
      console.log("[INFO] OAuth redirect completed", { role: user.role });
    }
    res.redirect(urlWithToken);
  } catch (error) {
    console.error("Google OAuth callback error", error);
    // Surface the underlying error message for debugging (safe - does not expose secrets)
    const details = error instanceof Error ? error.message : JSON.stringify(error);
    res.status(500).json({ error: "OAuth failed", details });
  }
});

// -------------------------
// POST /auth/signup
// -------------------------
// POST /auth/signup
// -------------------------
router.post("/signup", authRateLimiter, async (req: Request, res: Response) => {
  try {
    console.log('[SIGNUP] Received request:', { email: req.body.email, role: req.body.role });
    const parsed = SignupSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('[SIGNUP] Validation failed:', parsed.error);
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { email, password, role } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();
    console.log('[SIGNUP] Normalized email:', normalizedEmail);

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    console.log('[SIGNUP] Existing user check:', existing ? 'FOUND' : 'NOT FOUND');
    if (existing) {
      console.log('[SIGNUP] User exists, returning 409');
      return res.status(409).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    console.log('[SIGNUP] Creating new user...');
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        password: hashed,
        role: role, // Required role from signup
        onboarding_status: "pending_review",
        updatedAt: new Date()
      }
    });
    console.log('[SIGNUP] User created successfully:', user.id);

    const token = createAuthToken({ id: user.id });
    setAuthCookie(res, token);

    return res.json({ user: buildSessionUser(user), token });
  } catch (err) {
    console.error("[SIGNUP] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// -------------------------
// POST /auth/login
// -------------------------
// POST /auth/login
// -------------------------
router.post("/login", authRateLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Check if user is a super admin (same list as Google OAuth)
    const adminEmails = [
      "lila@thebreakco.com", 
      "mo@thebreakco.com"
    ];
    const isSuperAdmin = adminEmails.includes(normalizedEmail);

    const isTestAdminLogin =
      TEST_LOGIN_EMAIL &&
      TEST_LOGIN_PASSWORD &&
      normalizedEmail === TEST_LOGIN_EMAIL &&
      password === TEST_LOGIN_PASSWORD;

    if (!user && isTestAdminLogin) {
      const hashed = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: normalizedEmail,
          password: hashed,
          name: "Lila",
          role: "SUPERADMIN",
          updatedAt: new Date(),
        },
      });
    }

    if (user && !user.password && isTestAdminLogin) {
      const hashed = await bcrypt.hash(password, 10);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashed,
          updatedAt: new Date(),
        },
      });
    }

    // If user exists and is an admin, upgrade their role to SUPERADMIN
    if (user && isSuperAdmin && user.role !== "SUPERADMIN") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          role: "SUPERADMIN",
          updatedAt: new Date(),
        },
      });
      if (process.env.NODE_ENV !== 'production') {
        console.log("[LOGIN] Upgraded user to SUPERADMIN:", normalizedEmail);
      } else {
        console.log("[INFO] User upgraded to SUPERADMIN");
      }
    }

    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = createAuthToken({ id: user.id });
    if (process.env.NODE_ENV !== 'production') {
      console.log("[LOGIN] Setting auth cookie for user:", user.email, "role:", user.role);
    } else {
      console.log("[INFO] Auth cookie set", { role: user.role });
    }
    setAuthCookie(res, token);
    console.log("[LOGIN] Cookie should be set, cookie name:", SESSION_COOKIE_NAME);

    return res.json({ user: buildSessionUser(user), token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* ---------------------------------------------------------
   3. /auth/me
--------------------------------------------------------- */
router.get("/me", async (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  if (!req.user) return res.json({ user: null });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    res.json({ user: user ? buildSessionUser(user) : null });
  } catch (error) {
    console.error("/auth/me error", error);
    res.status(500).json({ error: "Failed to load session" });
  }
});

/* ---------------------------------------------------------
   4. LOGOUT
--------------------------------------------------------- */
router.post("/logout", (_req: Request, res: Response) => {
  clearAuthCookie(res);
  return res.json({ success: true });
});

/* ---------------------------------------------------------
   PASSWORD RESET FLOW
--------------------------------------------------------- */

// POST /auth/forgot-password - Request password reset
router.post("/forgot-password", authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`[AUTH] Password reset requested for non-existent email: ${normalizedEmail}`);
      return res.json({ 
        success: true, 
        message: "If that email exists, a password reset link has been sent" 
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Hash token before storing
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Store hashed token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry
      }
    });

    // Send reset email
    const resetUrl = `${FRONTEND_ORIGIN}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: user.email,
      template: "password-reset",
      data: { resetUrl },
      userId: user.id
    });

    // Log password reset request
    await logAuthEvent(req, {
      action: "PASSWORD_RESET_REQUESTED",
      entityType: "User",
      entityId: user.id,
      metadata: {
        email: user.email,
        expiresAt: resetTokenExpiry.toISOString()
      }
    });

    console.log(`[AUTH] Password reset email sent to: ${normalizedEmail}`);
    
    return res.json({ 
      success: true, 
      message: "If that email exists, a password reset link has been sent" 
    });
  } catch (error) {
    console.error("[AUTH] Password reset request error:", error);
    return res.status(500).json({ error: "Failed to process password reset request" });
  }
});

// POST /auth/reset-password - Reset password with token
router.post("/reset-password", authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    
    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Reset token is required" });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date() // Token not expired
        }
      }
    });

    if (!user) {
      console.log(`[AUTH] Invalid or expired reset token attempted`);
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    // Log password reset completion
    await logAuthEvent(req, {
      action: "PASSWORD_RESET_COMPLETED",
      entityType: "User",
      entityId: user.id,
      metadata: {
        email: user.email,
        resetAt: new Date().toISOString()
      }
    });

    console.log(`[AUTH] Password successfully reset for: ${user.email}`);
    
    return res.json({ 
      success: true, 
      message: "Password has been reset successfully. You can now login." 
    });
  } catch (error) {
    console.error("[AUTH] Password reset error:", error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

// GET /auth/verify-reset-token - Verify if reset token is valid
router.get("/verify-reset-token", async (req: Request, res: Response) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : null;
    
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Hash the token to compare
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Check if token exists and is not expired
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        email: true
      }
    });

    if (!user) {
      return res.status(400).json({ 
        valid: false, 
        error: "Invalid or expired token" 
      });
    }

    return res.json({ 
      valid: true, 
      email: user.email 
    });
  } catch (error) {
    console.error("[AUTH] Token verification error:", error);
    return res.status(500).json({ error: "Failed to verify token" });
  }
});

export default router;

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */
function buildGoogleAuthUrl(clientId: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

async function exchangeCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = googleOAuthConfig;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google OAuth env vars");
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  if (typeof fetch === "undefined") {
    throw new Error("global fetch is not available on this Node runtime");
  }

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  // Read response text once so we can log and re-use it safely
  const respText = await response.text();
  try {
    const parsed = JSON.parse(respText);
    console.log("Google token response status:", response.status, parsed);
  } catch (e) {
    console.log("Google token response status:", response.status, "text:", respText);
  }

  if (!response.ok) {
    // Throw with full Google response to be surfaced by the caller
    throw new Error(`Google token error: ${respText}`);
  }

  return JSON.parse(respText) as GoogleTokenResponse;
}

async function fetchGoogleProfile(accessToken: string, idToken?: string | null) {
  if (idToken) {
    try {
      const payload = decodeJwt<GoogleProfile>(idToken);
      if (payload?.email) return payload;
    } catch {}
  }

  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to load Google profile: ${await response.text()}`);
  }

  return (await response.json()) as GoogleProfile;
}

/* ---------------------------------------------------------
   POST /auth/onboarding/submit
   Save onboarding responses and submit for admin approval
--------------------------------------------------------- */
router.post("/onboarding/submit", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { responses, role, context } = req.body;
    
    if (!responses || typeof responses !== "object") {
      return res.status(400).json({ error: "Invalid onboarding responses" });
    }

    // Update user with onboarding data and set status to pending_review
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        onboarding_responses: responses,
        onboarding_status: "pending_review",
        role: role || undefined,
        updatedAt: new Date(),
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ONBOARDING] User ${user.email} submitted onboarding for approval`);
    } else {
      console.log(`[INFO] Onboarding submission received`, { role: user.role });
    }

    return res.json({ 
      success: true,
      user: buildSessionUser(user),
      message: "Onboarding submitted for review" 
    });
  } catch (err) {
    console.error("Onboarding submission error:", err);
    return res.status(500).json({ error: "Failed to submit onboarding" });
  }
});

/* ---------------------------------------------------------
   ROLE REDIRECT LOGIC
--------------------------------------------------------- */
function buildPostAuthRedirect(user: SessionUser): string {
  try {
    const url = new URL(FRONTEND_ORIGIN);
    const role = user.role;
    const isAdmin = role === "ADMIN" || role === "SUPERADMIN";
    const onboardingComplete =
      user.onboardingComplete === true ||
      user.onboardingStatus === "approved" ||
      user.onboardingStatus === "APPROVED";

    if (isAdmin) {
      url.pathname = "/admin/dashboard";
      return url.toString();
    }

    if (!onboardingComplete) {
      url.pathname = "/onboarding";
      return url.toString();
    }

    url.pathname = "/dashboard";
    return url.toString();
  } catch {
    return `${FRONTEND_ORIGIN}/dashboard`;
  }
}

/* ---------------------------------------------------------
   JWT DECODE
--------------------------------------------------------- */
function decodeJwt<T>(token: string) {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------
   UPDATE SOCIAL LINKS
--------------------------------------------------------- */
router.post("/social-links", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { platform, url } = req.body;

    if (!platform || !url) {
      return res.status(400).json({ error: "Platform and URL are required" });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get existing social links or initialize empty object
    const existingLinks = (user.socialLinks as any) || {};
    
    // Update with new platform link
    const updatedLinks = {
      ...existingLinks,
      [platform]: url,
    };

    // Save to database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        socialLinks: updatedLinks,
      },
    });

    return res.json({
      success: true,
      socialLinks: updatedUser.socialLinks,
    });
  } catch (error) {
    console.error("Error updating social links:", error);
    return res.status(500).json({ error: "Failed to update social links" });
  }
});

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */
type GoogleTokenResponse = {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

type GoogleProfile = {
  email: string;
  name?: string;
  given_name?: string;
  picture?: string;
};
