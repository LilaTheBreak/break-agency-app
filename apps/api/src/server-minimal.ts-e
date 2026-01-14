/**
 * MINIMAL SERVER FOR TESTING
 * Only loads essential middleware + devAuth + health
 * Used to identify startup blocking issue
 */

import "./instrument.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Load env
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

import { attachUserFromSession } from './middleware/auth';
import devAuthRouter from './routes/devAuth';
import adminAnalyticsRouter from './routes/admin/analytics';

const app = express();
const PORT = process.env.PORT || 5001;

console.log("[MINIMAL] Starting minimal server...");

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(cookieParser());
app.use(attachUserFromSession);

// Routes
app.use("/api/dev-auth", devAuthRouter);
app.use("/api/admin/analytics", adminAnalyticsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Minimal API is running" });
});

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Minimal Break Agency API" });
});

// Start
const server = app.listen(PORT, () => {
  console.log(`[MINIMAL] ✅ API listening on port ${PORT}`);
  console.log(`[MINIMAL] Available endpoints:`);
  console.log(`  - GET  /health`);
  console.log(`  - POST /api/dev-auth/login`);
  console.log(`  - POST /api/admin/analytics/analyze`);
});

process.on("SIGINT", () => {
  console.log("[MINIMAL] Shutting down...");
  server.close();
  process.exit(0);
});
