import "dotenv/config";
import path from "path";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB, disconnectDB } from "./config/db";
import eventsRouter from "./routes/events";
import sitesRouter from "./routes/sites";
import { seedIfEmpty } from "./seed";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Security headers (allow cross-origin embedding for tracker.js and /api/preview)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
    frameguard: false,
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Rate-limit event ingestion to protect against bursts/abuse
const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded. Slow down event ingestion." },
});

app.use("/api/events", ingestLimiter);

// Parse both JSON and text/plain (used by navigator.sendBeacon)
app.use(express.json({ limit: "512kb" }));
app.use(express.text({ type: "text/plain", limit: "512kb" }));

// Serve standalone tracker.js with short cache header
app.use(
  express.static(path.join(__dirname, "../public"), {
    maxAge: "5m",
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", eventsRouter);
app.use("/api", sitesRouter);

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[unhandled error]", err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  await connectDB();
  await seedIfEmpty();

  const server = app.listen(PORT, () => {
    console.log(`[server] Analytics API listening on http://localhost:${PORT}`);
    console.log(`[server] Tracker SDK available at http://localhost:${PORT}/tracker.js`);
  });

  const shutdown = async () => {
    console.log("[server] Shutting down gracefully...");
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
