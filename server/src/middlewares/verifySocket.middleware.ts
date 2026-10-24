/**
 * Socket.IO authentication middleware
 *
 * CONCEPT:
 *   HTTP routes use verifyJWT — before any controller runs it reads the
 *   cookie/header, validates the JWT and attaches the user to req.user.
 *   Socket.IO works the same way: this function is registered with io.use()
 *   and runs once per new connection. On success it attaches the user to
 *   socket.data.user so every event handler knows who is connected.
 *
 * TOKEN SOURCES (tried in order):
 *   1. socket.handshake.auth.token  — sent explicitly by the client
 *   2. Cookie header                — the httpOnly accessToken cookie
 *
 * TYPING NOTE (why there is no `declare module "socket.io"` here):
 *   Older socket.io versions typed `socket.data` as `any`, so you could
 *   augment the Socket interface to give `data` a shape. Since socket.io 4.8
 *   `Socket` is generic in `SocketData` (`class Socket<..., SocketData>`),
 *   and augmenting `data` with a concrete type is a TS2717 error.
 *   The supported approach is to thread the data type through the generics:
 *   `AppSocket` below, and `AppServer` in sockets/index.ts. That makes
 *   `socket.data.user` fully typed everywhere with no casts.
 */

import type { Socket, DefaultEventsMap } from "socket.io";
import { parseCookie } from "cookie"; // cookie v2: `parse` was renamed to `parseCookie`
import { verifyAuthToken } from "@/utils/user-utils.js";
import { User } from "@/models/index.js";

export interface SocketUser {
  userId: string;
  role: string;
  teamId: string | null;
}

/** The concrete shape of `socket.data` on every authenticated connection. */
export interface AppSocketData {
  user: SocketUser;
}

/**
 * A socket whose `data.user` is guaranteed to exist (verifySocket ran before
 * any event handler) and is fully typed.
 */
export type AppSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  AppSocketData
>;

export async function verifySocket(
  socket: AppSocket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    // 1. Extract token — explicit auth payload first, then the cookie header.
    //    Guard against non-string values (a client could send any JSON).
    const raw = socket.handshake.auth?.token;
    let token: string | undefined =
      typeof raw === "string" && raw.trim() ? raw.trim() : undefined;

    if (!token) {
      const rawCookie = socket.handshake.headers.cookie ?? "";
      token = parseCookie(rawCookie)["accessToken"];
    }

    if (!token) return next(new Error("Unauthorized: no token"));

    // 2. Verify JWT — jwt.verify throws on expired / tampered tokens
    const decoded = verifyAuthToken(token);
    if (!decoded?.userId) return next(new Error("Unauthorized: invalid token"));

    // 3. Read live role + teamId from DB (they can change after token was issued).
    //    A DB outage is NOT an auth failure, so it gets its own error path —
    //    otherwise a transient Mongo blip would look like a bad token to the
    //    client (and to our own logs).
    let dbUser;
    try {
      dbUser = await User.findById(decoded.userId).select("role teamId");
    } catch (err) {
      console.error("[WS] auth: failed to read user from DB:", err);
      return next(new Error("Authentication temporarily unavailable"));
    }

    if (!dbUser) return next(new Error("Unauthorized: user not found"));

    // 4. Attach to socket so every handler can read it
    socket.data.user = {
      userId: decoded.userId,
      role: dbUser.role,
      teamId: dbUser.teamId ? dbUser.teamId.toString() : null,
    };

    next(); // no argument = auth passed, connection proceeds
  } catch (err) {
    // Distinguish expired from invalid so the client can react differently
    // (expired → try a fresh login; invalid → token is garbage)
    const expired =
      err instanceof Error &&
      (err.name === "TokenExpiredError" || /expired/i.test(err.message));
    next(
      new Error(expired ? "Unauthorized: token expired" : "Unauthorized: invalid token")
    );
  }
}
