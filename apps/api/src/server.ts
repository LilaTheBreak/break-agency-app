import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import dotenv from "dotenv";
import { registerEmailQueueJob } from "./jobs/emailQueue.js";
import { registerCronJobs } from "./cron/index.js";
import { requestContextMiddleware } from "./middleware/requestContext.js";
import { auditMiddleware } from "./middleware/audit.js";
import { stripeWebhookHandler } from "./routes/webhooks.js";
import paymentsRouter from "./routes/payments.js";
import { attachUserFromSession } from "./middleware/auth.js";
import filesRouter from "./routes/files.js";
import gmailAuthRouter from "./routes/gmailAuth.js";
import gmailMessagesRouter from "./routes/gmailMessages.js";
import gmailAnalysisRouter from "./routes/gmailAnalysis.js";
import gmailInboxRouter from "./routes/gmailInbox.js";
import authenticityRouter from "./routes/authenticity.js";
import riskRouter from "./routes/risk.js";
import suitabilityRouter from "./routes/suitability.js";
import threadRouter from "./routes/threads.js";
import dealsRouter from "./routes/deals.js";
import dealTimelineRouter from "./routes/dealTimeline.js";
import dealInsightsRouter from "./routes/dealInsights.js";
import automationRouter from "./routes/automation.js";
import contractRouter from "./routes/contract.js";
import dealNegotiationRouter from "./routes/dealNegotiation.js";
import deliverablesRouter from "./routes/deliverables.js";
import inboxTriageRouter from "./routes/inboxTriage.js";
import dealExtractionRouter from "./routes/dealExtraction.js";
import negotiationRouter from "./routes/negotiation.js";
import campaignBuilderRouter from "./routes/campaignBuilder.js";
import insightRouter from "./routes/insights.js";
import outreachRouter from "./routes/outreach.js";
import agentRouter from "./routes/agent.js";
import signatureWebhookRouter from "./routes/signatureWebhooks.js";
import brandCRMRouter from "./routes/brandCRM.js";
import strategyRouter from "./routes/strategy.js";
import dealPackagesRouter from "./routes/dealPackages.js";
import creatorFitRouter from "./routes/creatorFit.js";
import bundlesRouter from "./routes/bundles.js";
import briefsRouter from "./routes/briefs.js";
import campaignAutoRouter from "./routes/campaignAuto.js";
import unifiedInboxRouter from "./routes/unifiedInbox.js";

dotenv.config();

console.log(">>> ENV LOADED FROM =", process.env?.ENV_FILE ?? ".env (default)");
console.log(">>> PROCESS CWD =", process.cwd());
console.log(">>> GOOGLE_CLIENT_ID =", process.env.GOOGLE_CLIENT_ID);
console.log(
  ">>> GOOGLE_CLIENT_SECRET =",
  process.env.GOOGLE_CLIENT_SECRET ? `${process.env.GOOGLE_CLIENT_SECRET.slice(0, 4)}****` : "[MISSING]"
);
console.log(">>> GOOGLE_REDIRECT_URI =", process.env.GOOGLE_REDIRECT_URI);

const app = express();
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.WEB_APP_URL || "http://localhost:5173";
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.post("/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.use("/api/payments", paymentsRouter);
app.use("/api/files", filesRouter);
app.use("/api", gmailAuthRouter);
app.use("/api", gmailMessagesRouter);
app.use("/api", gmailAnalysisRouter);
app.use("/api", gmailInboxRouter);
app.use(express.json({ limit: "350mb" }));
app.use(express.urlencoded({ extended: true, limit: "350mb" }));
app.use(attachUserFromSession);
app.use(requestContextMiddleware);
app.use(auditMiddleware);
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use("/api/authenticity", authenticityRouter);
app.use("/api/risk", riskRouter);
app.use("/api/suitability", suitabilityRouter);
app.use("/api/threads", threadRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/deal-timeline", dealTimelineRouter);
app.use("/api/deal-insights", dealInsightsRouter);
app.use("/api/automation", automationRouter);
app.use("/api/contracts", contractRouter);
app.use("/api/deal-negotiation", dealNegotiationRouter);
app.use("/api/deliverables", deliverablesRouter);
app.use("/api/inbox", inboxTriageRouter);
app.use("/api/deals/extract", dealExtractionRouter);
app.use("/api/negotiation", negotiationRouter);
app.use("/api/campaign-builder", campaignBuilderRouter);
app.use("/api/insights", insightRouter);
app.use("/api/outreach", outreachRouter);
app.use("/api/agent", agentRouter);
app.use("/webhooks", signatureWebhookRouter);
app.use("/api/brand-crm", brandCRMRouter);
app.use("/api/strategy", strategyRouter);
app.use("/api/deal-packages", dealPackagesRouter);
app.use("/api/creator-fit", creatorFitRouter);
app.use("/api/bundles", bundlesRouter);
app.use("/api/briefs", briefsRouter);
app.use("/api/campaign/auto-plan", campaignAutoRouter);
app.use("/api", unifiedInboxRouter);

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Break Agency API is running" });
});

app.use("/api", routes);

const PORT = process.env.PORT || 5001;

registerEmailQueueJob();
registerCronJobs();

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
