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

  app.use(
    cors({
      origin: env.WEB_APP_URL,
      credentials: true
    })
  );
  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use("/healthz", healthRouter);

  app.get("/api/status", (_, res) => {
    res.json({
      status: "ok",
      service: "home-api",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(problemDetailsHandler);

  return app;
}
