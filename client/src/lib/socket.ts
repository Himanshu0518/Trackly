/**
 * socket.ts — singleton Socket.IO client
 *
 * WHY A SINGLETON?
 *   We never want more than one WebSocket connection to the server per tab.
 *   If every component called io() on its own we'd open dozens of connections.
 *   Instead, one socket is created here and shared everywhere via import.
 *
 * LAZY CONNECTION:
 *   The socket is created with autoConnect: false.
 *   This means NO connection is opened when this module is first imported.
 *   We call socket.connect() / socket.disconnect() manually from the
 *   useSocket hook (see hooks/useSocket.ts) after the user logs in/out.
 *
 * TOKEN:
 *   We send the JWT explicitly in socket.handshake.auth so the server
 *   middleware can authenticate the connection — the httpOnly cookie is
 *   included automatically by the browser too, but some browsers block it
 *   for cross-origin WebSocket upgrades in strict-privacy mode.
 */

import { io, type Socket } from "socket.io-client";
import { tokenStore } from "@/lib/token-store";

const SOCKET_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)
    ?.replace("/api", "") ?? "http://localhost:5000";

// Create the socket but do NOT connect yet (autoConnect: false)
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,       // send cookies with the upgrade request
  auth: (cb) => {
    // This callback is called right before each connection attempt,
    // so we always send the freshest token even after a token refresh.
    cb({ token: tokenStore.get() ?? "" });
  },
});

// Dev-only connection logging — removed in production builds
if (import.meta.env.DEV) {
  socket.on("connect",           () => console.log("[WS] connected", socket.id));
  socket.on("disconnect", (r)   => console.log("[WS] disconnected", r));
  socket.on("connect_error", (e) => console.warn("[WS] connect error", e.message));
}
