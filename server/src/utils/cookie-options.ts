import { CookieOptions } from "express";
import env from "@/config/env.js";

export const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production", // HTTPS in prod, HTTP ok locally
  sameSite: "lax",   // Same-origin via Vercel proxy — Lax works everywhere,
                     // incognito included. "none" was only needed cross-origin.
  maxAge: 24 * 60 * 60 * 1000, // 1 day in ms
};
