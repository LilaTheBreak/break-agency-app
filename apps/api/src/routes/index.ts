import { Router } from "express";
import type { User } from "@prisma/client";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/profiles/:email", async (req, res) => {
  const email = (req.params.email || "").toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ profile: createDefaultProfile(email) });
    }
    res.json({ profile: formatProfile(user) });
  } catch (error) {
    console.error("Error fetching profile", error);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

router.put("/profiles/:email", async (req, res) => {
  const email = (req.params.email || "").toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    const payload = req.body as ProfileRequestBody;
    const links = normalizeLinks(payload.links);
    const data = {
      name: payload.name ?? null,
      location: payload.location ?? null,
      timezone: payload.timezone ?? null,
      pronouns: payload.pronouns ?? null,
      accountType: payload.accountType ?? payload.status ?? null,
      status: payload.status ?? payload.accountType ?? null,
      bio: payload.bio ?? null,
      socialLinks: links.length ? links : null
    };

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        password: null,
        ...data
      },
      update: data
    });

    res.json({ profile: formatProfile(user) });
  } catch (error) {
    console.error("Error saving profile", error);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

export default router;

type ProfileRequestBody = {
  name?: string;
  location?: string;
  timezone?: string;
  pronouns?: string;
  accountType?: string;
  status?: string;
  bio?: string;
  links?: Array<{ label?: string; url?: string }>;
};

function normalizeLinks(links?: Array<{ label?: string; url?: string }>) {
  if (!Array.isArray(links)) return [];
  return links
    .map((link) => ({
      label: typeof link.label === "string" ? link.label.trim() : "",
      url: typeof link.url === "string" ? link.url.trim() : ""
    }))
    .filter((link) => link.url.length > 0)
    .map((link) => ({
      label: link.label || link.url,
      url: link.url
    }));
}

function formatProfile(user: User) {
  return {
    email: user.email,
    name: user.name ?? user.email,
    location: user.location ?? "",
    timezone: user.timezone ?? "",
    pronouns: user.pronouns ?? "",
    accountType: user.accountType ?? "",
    status: user.status ?? "",
    bio: user.bio ?? "",
    links: Array.isArray(user.socialLinks) ? user.socialLinks : [],
    updatedAt: user.updatedAt
  };
}

function createDefaultProfile(email: string) {
  return {
    email,
    name: email,
    location: "",
    timezone: "",
    pronouns: "",
    accountType: "",
    status: "",
    bio: "",
    links: []
  };
}
