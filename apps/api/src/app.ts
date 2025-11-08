import cookieParser from "cookie-parser";
import cors, { type CorsOptions } from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./env.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { problemDetailsHandler } from "./middlewares/problem-details.js";
import { apiRouter } from "./routes/api.js";
import { healthRouter } from "./routes/health.js";
import { interestRouter } from "./routes/interest.js";

export function createApp(): Express {
  const app = express();

  app.enable("trust proxy");
  app.disable("x-powered-by");

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  const allowedOrigins = ["https://www.home-ai.uk", "https://home-ai.uk"];
  if (env.WEB_APP_URL && !allowedOrigins.includes(env.WEB_APP_URL)) {
    allowedOrigins.push(env.WEB_APP_URL);
  }
  if (env.NODE_ENV !== "production") {
    allowedOrigins.push("http://localhost:5173");
  }
  const vercelPreview = /\.vercel\.app$/i;

  const corsOptions: CorsOptions = {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || vercelPreview.test(origin)) {
        return callback(null, true);
      }
      callback(new Error("CORS blocked"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  const defaultDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();
  delete defaultDirectives["upgrade-insecure-requests"];
  defaultDirectives["script-src"] = [
    ...(defaultDirectives["script-src"] || []),
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://cdn.tailwindcss.com"
  ];
  defaultDirectives["style-src"] = [
    ...(defaultDirectives["style-src"] || []),
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
    "https://cdn.tailwindcss.com"
  ];
  defaultDirectives["font-src"] = [
    ...(defaultDirectives["font-src"] || []),
    "https://fonts.gstatic.com",
    "data:"
  ];
  defaultDirectives["img-src"] = [
    ...(defaultDirectives["img-src"] || []),
    "data:",
    "blob:"
  ];

  if (env.WEB_APP_URL) {
    defaultDirectives["connect-src"] = [
      ...(defaultDirectives["connect-src"] || []),
      env.WEB_APP_URL,
      "ws:",
      "wss:"
    ];
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: defaultDirectives
      },
      crossOriginEmbedderPolicy: false
    })
  );

  if (env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      if (req.secure || req.headers["x-forwarded-proto"] === "https") return next();
      if (!req.headers.host) return next();
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    });
  }

  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use("/healthz", healthRouter);
  app.use("/interest", interestRouter);
  app.use("/api/interest", interestRouter);

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
