import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import eventsRouter from "./routes/events";
import { seedIfEmpty } from "./seed";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, same-origin) or matching origins
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, true); // Permissive for demo tracker script embedding across domains
    },
    credentials: true,
  })
);

// Parse both JSON and text/plain (used by navigator.sendBeacon)
app.use(express.json({ limit: "1mb" }));
app.use(express.text({ type: "text/plain", limit: "1mb" }));

// Serve standalone tracker.js
app.use(express.static(path.join(__dirname, "../public")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", eventsRouter);

async function start() {
  await connectDB();
  await seedIfEmpty();

  app.listen(PORT, () => {
    console.log(`[server] Analytics API listening on http://localhost:${PORT}`);
    console.log(`[server] Tracker SDK available at http://localhost:${PORT}/tracker.js`);
  });
}

start().catch((err) => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
