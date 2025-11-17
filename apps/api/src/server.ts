import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import routes from "./routes/index.js";
import dotenv from "dotenv";
import { registerEmailQueueJob } from "./jobs/emailQueue.js";
import { registerCronJobs } from "./cron/index.js";
import { requestContextMiddleware } from "./middleware/requestContext.js";
import { auditMiddleware } from "./middleware/audit.js";
import { stripeWebhookHandler } from "./routes/webhooks.js";
import paymentsRouter from "./routes/payments.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.post("/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.use("/api/payments", paymentsRouter);
app.use(express.json({ limit: "350mb" }));
app.use(express.urlencoded({ extended: true, limit: "350mb" }));
app.use(requestContextMiddleware);
app.use(auditMiddleware);
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Break Agency API is running" });
});

app.use("/api", routes);

const PORT = process.env.PORT || 3001;

registerEmailQueueJob();
registerCronJobs();

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
