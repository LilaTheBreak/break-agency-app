import "dotenv/config";

import { createApp } from "./app.js";
import { env } from "./env.js";

const app = createApp();

/* --- Add these basic routes --- */
app.get("/", (_req, res) => {
  res.type("text/plain").send("HOME AI API is running");
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// optional: silence favicon 404s
app.get("/favicon.ico", (_req, res) => res.status(204).end());
/* --- end add --- */

const server = app.listen(env.PORT, () => {
  console.log(`[home-api] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

const shutdown = (signal: string) => {
  console.log(`[home-api] received ${signal}, shutting down...`);
  server.close(() => {
    console.log("[home-api] server closed");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
