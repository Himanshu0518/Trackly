/**
 * Socket.IO server setup
 *
 * HOW ROOMS WORK (important to understand before reading the code):
 *
 *   A "room" is just a named channel. A socket can join many rooms.
 *   When you call  io.to("roomName").emit("event", data)  every socket
 *   that has joined that room receives the message instantly.
 *
 *   We use two kinds of rooms:
 *     • user:<userId>   — private room, only that one user's sockets
 *     • team:<teamId>   — shared room, every connected member of that team
 *
 *   This lets us:
 *     • Send a notification to one specific user
 *     • Broadcast a new comment to everyone viewing the same issue
 *
 * EVENTS WE EMIT TO THE CLIENT (full catalog):
 *
 *   "notification:new"      → user:<userId>   payload: NotificationData
 *   "issue:created"         → team:<teamId>   payload: { issueId, issue }
 *   "issue:updated"         → team:<teamId>   payload: { issueId, issue }
 *   "issue:deleted"         → team:<teamId>   payload: { issueId }
 *   "comment:new"           → issue:<id> + team:<teamId>
 *                             payload: { issueId, comment }
 *   "comment:deleted"       → issue:<id> + team:<teamId>
 *                             payload: { issueId, commentIndex }
 */

import { Server as HttpServer } from "http";
import {
  Server as SocketServer,
  DefaultEventsMap,
} from "socket.io";
import { Types } from "mongoose";
import {
  verifySocket,
  AppSocket,
  AppSocketData,
} from "@/middlewares/verifySocket.middleware.js";
import env from "@/config/env.js";

/**
 * The Server generic that carries our authenticated socket.data shape.
 * With this in place `socket.data.user` is typed in every handler and
 * `io.use(verifySocket)` type-checks without casts.
 */
export type AppServer = SocketServer<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  AppSocketData
>;

// We export `io` so HTTP controllers can call io.to(...).emit(...)
// without needing to pass the io instance around via dependency injection.
let io: AppServer;

export function getIO(): AppServer {
  if (!io) throw new Error("Socket.IO not initialised — call initSocket first");
  return io;
}

export function initSocket(httpServer: HttpServer): AppServer {
  // Parse allowed origins exactly the same way index.ts does for CORS
  const rawOrigins = env.CLIENT_URL.split(",").map((o) => {
    try {
      const u = new URL(o.trim());
      return `${u.protocol}//${u.host}`;
    } catch {
      return o.trim();
    }
  });

  io = new SocketServer<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    AppSocketData
  >(httpServer, {
    cors: {
      origin: rawOrigins.length === 1 ? rawOrigins[0] : rawOrigins,
      credentials: true,
    },
    // How long Socket.IO waits before deciding a client is gone (ms)
    pingTimeout: 60_000,
    pingInterval: 25_000,
  });

  // ── Authentication: runs before ANY event handler ─────────────────────────
  // If verifySocket calls next(error) the connection is refused.
  io.use(verifySocket);

  // ── Connection handler ────────────────────────────────────────────────────
  io.on("connection", (socket: AppSocket) => {
    const { userId, teamId } = socket.data.user;

    // Join the user's private room and the shared team room
    socket.join(`user:${userId}`);
    if (teamId) socket.join(`team:${teamId}`);

    console.log(`[WS] connected  userId=${userId}  teamId=${teamId ?? "none"}  socketId=${socket.id}`);

    // ── Client wants to watch a specific issue ──────────────────────────────
    // The issue detail page emits this so it receives live comment/update
    // events scoped to that issue. ObjectId.isValid also rejects strings of
    // length 24 that aren't hex, which the old length check allowed through.
    socket.on("issue:join", (issueId: string) => {
      if (typeof issueId === "string" && Types.ObjectId.isValid(issueId)) {
        socket.join(`issue:${issueId}`);
      }
    });

    socket.on("issue:leave", (issueId: string) => {
      if (typeof issueId === "string" && Types.ObjectId.isValid(issueId)) {
        socket.leave(`issue:${issueId}`);
      }
    });

    // ── Cleanup on disconnect ───────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`[WS] disconnected  userId=${userId}  reason=${reason}`);
    });
  });

  return io;
}
