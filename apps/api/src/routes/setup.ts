import { Router, type Request, type Response } from "express";
import prisma from '../lib/prisma.js';
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const VerifyTokenSchema = z.object({
  token: z.string(),
  email: z.string().email(),
});

const CompleteSetupSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

// Verify setup token
router.post("/verify", async (req: Request, res: Response) => {
  const parsed = VerifyTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }

  try {
    const { token, email } = parsed.data;
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.admin_notes) {
      return res.status(404).json({ error: "Invalid setup link" });
    }

    // Parse token data from admin_notes
    let tokenData;
    try {
      tokenData = JSON.parse(user.admin_notes);
    } catch {
      return res.status(404).json({ error: "Invalid setup link" });
    }

    if (tokenData.setupToken !== token) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const tokenExpiry = new Date(tokenData.tokenExpiry);
    if (tokenExpiry < new Date()) {
      return res.status(401).json({ error: "Setup link has expired" });
    }

    return res.json({ 
      valid: true,
      name: user.name,
      email: user.email 
    });
  } catch (error) {
    console.error("Error verifying setup token:", error);
    return res.status(500).json({ error: "Failed to verify token" });
  }
});

// Complete account setup
router.post("/complete", async (req: Request, res: Response) => {
  const parsed = CompleteSetupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }

  try {
    const { token, email, password, name } = parsed.data;
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.admin_notes) {
      return res.status(404).json({ error: "Invalid setup link" });
    }

    // Parse and verify token
    let tokenData;
    try {
      tokenData = JSON.parse(user.admin_notes);
    } catch {
      return res.status(404).json({ error: "Invalid setup link" });
    }

    if (tokenData.setupToken !== token) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const tokenExpiry = new Date(tokenData.tokenExpiry);
    if (tokenExpiry < new Date()) {
      return res.status(401).json({ error: "Setup link has expired" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with password and mark as active
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        name: name || user.name,
        onboarding_status: "active",
        onboardingComplete: false, // Will be set to true after onboarding
        admin_notes: null, // Clear the token
        updatedAt: new Date()
      }
    });

    // Generate session token
    const sessionToken = jwt.sign(
      { 
        userId: updatedUser.id, 
        email: updatedUser.email,
        role: updatedUser.role 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie(process.env.SESSION_COOKIE_NAME || "break_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({ 
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error("Error completing setup:", error);
    return res.status(500).json({ error: "Failed to complete setup" });
  }
});

export default router;
