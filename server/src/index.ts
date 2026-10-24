/**
 * Entry point
 *
 * WHY http.createServer instead of app.listen?
 *   Express's app.listen() creates an HTTP server internally but never
 *   exposes it. Socket.IO needs to attach to the same server so both HTTP
 *   requests and WebSocket upgrade requests share the same port.
 *   By creating the server ourselves we can hand it to both Express and
 *   Socket.IO.
 */

import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import env from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import router from "./routers/index.js";
import { initSocket } from "./sockets/index.js";

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
const rawOrigins = env.CLIENT_URL.split(",").map((o) => {
  try {
    const u = new URL(o.trim());
    return `${u.protocol}//${u.host}`;
  } catch {
    return o.trim();
  }
});

app.use(
  cors({
    origin: rawOrigins.length === 1 ? rawOrigins[0] : rawOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Standard middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", router);

// ── Error handler (must be last Express middleware) ────────────────────────────
app.use(errorHandler);

// ── HTTP server + Socket.IO ────────────────────────────────────────────────────
// We create the HTTP server manually so Socket.IO can share the same port.
const httpServer = http.createServer(app);
initSocket(httpServer); // attaches Socket.IO to the HTTP server

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} (HTTP + WebSocket)`);
  });
};

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
