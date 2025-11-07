// apps/api/src/app.ts
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./env.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { problemDetailsHandler } from "./middlewares/problem-details.js";
import { apiRouter } from "./routes/api.js";
import { healthRouter } from "./routes/health.js";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");

  // ---- CORS (allow prod + www + local dev) ----
  const allowedOrigins = new Set<string>([
    env.WEB_APP_URL,                 // e.g. https://home-ai.uk
    "https://www.home-ai.uk",
    "http://localhost:5173",
  ]);
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || allowedOrigins.has(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  // ---- Security & parsers ----
  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  // ---- Simple root + health endpoints (before any catch-alls) ----
  app.get("/", (_req, res) => {
    res.type("text/plain").send("HOME AI API is running");
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // optional: silence favicon 404s
  app.get("/favicon.ico", (_req, res) => res.status(204).end());

  // ---- Existing health router (still available at /healthz) ----
  app.use("/healthz", healthRouter);

  // ---- Status + API routes ----
  app.get("/api/status", (_req, res) => {
    res.json({
      status: "ok",
      service: "home-api",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api", apiRouter);

  // ---- 404 + error handlers (must be last) ----
  app.use(notFoundHandler);
  app.use(problemDetailsHandler);

  return app;
}
