import { CookieOptions } from "express";
import env from "@/config/env.js";

const isProd = env.NODE_ENV === "production";

export const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,          // HTTPS only in prod — required when sameSite is "none"
  sameSite: isProd
    ? "none"               // cross-origin (Vercel → Render) needs "none" + secure
    : "lax",               // local dev: lax is fine, same-host
  maxAge: 24 * 60 * 60 * 1000, // 1 day in ms
};
