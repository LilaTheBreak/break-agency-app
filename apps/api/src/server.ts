import "dotenv/config";

import { createApp } from "./app.js";
import { env } from "./env.js";

const app = createApp();

const PORT = env.PORT || 5000;
const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`[home-api] listening on http://${HOST}:${PORT} (${env.NODE_ENV})`);
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
