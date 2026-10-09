// In production the Vercel proxy rewrites /api/* → Render backend,
// so a relative URL keeps cookies first-party (same origin as the client).
// In local dev, point directly at the local server.
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "/api";
