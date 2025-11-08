import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),

  // Frontend origin; e.g. https://home-ai.uk in prod, http://localhost:5173 in dev
  WEB_APP_URL: z.string().url().default("http://localhost:5173"),

  // Email (SMTP) — all optional so dev can run without them
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  // Where notifications go (default is fine)
  NOTIFY_EMAIL: z.string().email().default("luxuryhomesbylila@gmail.com"),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,

  DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/home",
  JWT_SECRET: process.env.JWT_SECRET ?? "change-me-in-prod-please",

  WEB_APP_URL: process.env.WEB_APP_URL,

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  NOTIFY_EMAIL: process.env.NOTIFY_EMAIL,
});
