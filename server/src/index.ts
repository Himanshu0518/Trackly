import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import env from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import router from "./routers/index.js";

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

// CLIENT_URL may be a single origin or a comma-separated list for multi-env
// Strip paths/trailing slashes so misconfigured values still work
const rawOrigins = env.CLIENT_URL.split(",").map((o) => {
  try {
    const u = new URL(o.trim());
    return `${u.protocol}//${u.host}`; // keep only scheme + host
  } catch {
    return o.trim();
  }
});

app.use(
  cors({
    origin: rawOrigins.length === 1 ? rawOrigins[0] : rawOrigins,
    credentials: true, // required for cookies (accessToken)
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", router);

// ─── Error handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

start();
