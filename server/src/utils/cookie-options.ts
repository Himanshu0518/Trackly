import { CookieOptions } from "express";
import env from "@/config/env.js";

export const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,                            // not accessible via JS
  secure: env.NODE_ENV === "production",     // HTTPS only in prod
  sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 24 * 60 * 60 * 1000,              // 1 day in ms
};
