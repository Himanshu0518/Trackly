# WebSockets in Trackly — The Complete Guide

This document explains the real-time layer of Trackly from the ground up:
what WebSockets are, why this project uses them, and exactly how every piece
of code — server and client — fits together. You should finish reading it
knowing where every live update comes from and how to add a new one.

---

## 1. What problem do WebSockets solve?

HTTP is **request → response**. The client asks, the server answers, the
connection's job is done:

```
Client                                Server
  │  GET /api/issues     ──────────▶  │
  │  ◀────────────  200 OK (JSON)     │
  │  (connection closed / idle)       │
```

This works great for "fetch a page", but it's terrible for **live data**.
If Bob changes a ticket's status, Alice's screen has no idea. Her options
are:

| Approach | How it works | Problem |
|---|---|---|
| **Polling** | Alice's browser asks `/api/issues` every 5 seconds | 99% of responses are "nothing changed"; burns battery & bandwidth; still has up to 5s delay |
| **Long polling** | Alice asks, server *holds* the request until something happens | Better, but each update still opens/closes HTTP requests; messy in proxies |
| **WebSockets** | One connection is **upgraded** and then **stays open** | Server can *push* the instant anything happens. One connection, zero waste |

A WebSocket is a full-duplex tunnel: after a one-time HTTP "upgrade"
handshake, **either side can send messages at any moment** — no asking, no
waiting. That's the entire idea.

```
Client                                Server
  │  GET /api/issues     ──────────▶  │
  │  ◀────────────  200 OK (JSON)     │
  │                                   │
  │  GET /socket.io/  (Upgrade)  ───▶ │  ← handshake, still HTTP
  │  ◀──── 101 Switching Protocols    │
  │                                   │
  │  ══════════ OPEN TUNNEL ══════════ │
  │  ◀────  "issue:updated"           │  ← server pushes instantly
  │  ◀────  "notification:new"        │     whenever something happens
  │  ───▶   "issue:join"              │  ← client can send too
```

---

## 2. Why Socket.IO and not the raw `ws` library?

Trackly uses [Socket.IO](https://socket.io/), a library built *on top of*
WebSockets. It gives us things the raw protocol doesn't:

- **Rooms** — named channels. "Send this to everyone in team X" is one line
  (`io.to("team:X").emit(...)`). With raw WebSockets you'd build this yourself.
- **Automatic reconnection** — if the network blips, the client silently
  reconnects. Raw sockets die and you handle it manually.
- **Events, not frames** — you emit named events with JSON payloads
  (`socket.on("comment:new", fn)`) instead of juggling message types.
- **Authentication middleware** — `io.use(verifySocket)` runs once per
  connection, exactly like Express middleware runs per HTTP request.
- **Fallback transports** — can downgrade to HTTP long-polling if a corporate
  firewall blocks WebSockets.

Everything below still *is* WebSockets — Socket.IO just wraps the plumbing.

---

## 3. The big picture

```
┌──────────────────────────── CLIENT (React) ─────────────────────────────┐
│                                                                         │
│  lib/socket.ts ──── ONE shared socket.io-client (singleton)              │
│        ▲                                                                │
│        │ used by                                                        │
│  hooks/useSocket.ts ────────── connect/disconnect with login state      │
│  hooks/useSocketNotifications.ts  notification:new → toast + refetch    │
│  hooks/useSocketIssues.ts ──────── issue:{created,updated,deleted}      │
│  hooks/useSocketIssueSync.ts ───── joins issue:<id> room on detail page │
│        │                                                                │
│        ▼ invalidates RTK Query tags → UI re-fetches automatically       │
│  Redux store (issueApi / notificationApi)  →  components re-render      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │  WebSocket (same port as HTTP!)
┌───────────────────────────────▼──────────────────────── SERVER (Node) ──┐
│                                                                         │
│  index.ts ── http.createServer(app) ── Express gets the HTTP server     │
│        │                └──► initSocket(httpServer) — Socket.IO mounts  │
│        ▼                                                                │
│  sockets/index.ts ── auth (io.use) ── rooms ── event handlers           │
│        ▲                         (verifySocket.middleware.ts)           │
│        │ getIO()                                                             │
│  REST controllers ── after saving to MongoDB, broadcast to the right    │
│  (issue.controller.ts, utils/notification.util.ts)    room via getIO()  │
└─────────────────────────────────────────────────────────────────────────┘
```

Two rules make everything click:

1. **REST writes, sockets broadcast.** The HTTP request stays the only way to
   *change* data. After MongoDB confirms the write, the controller shouts
   into the right room. This means the database is always the source of
   truth and the socket is only a "something changed" signal.
2. **Clients react by invalidating caches, not by parsing payloads.** A live
   event tells RTK Query "your copy is stale", and RTK Query re-fetches the
   page it already knows how to render. More on why in §6.

---

## 4. Server side, file by file

### 4.1 `server/src/index.ts` — sharing one port

Normally Express is started with `app.listen()`, but that hides the HTTP
server inside Express. Socket.IO needs the **same** server so HTTP requests
and WebSocket upgrades share one port:

```ts
import http from "http";
const httpServer = http.createServer(app); // <- Express app handed to node's http
initSocket(httpServer);                     // <- Socket.IO attaches to it
httpServer.listen(env.PORT, () => { ... });
```

Both `GET /api/issues` and the WebSocket handshake now answer on, say,
`:3000`. Nothing else in Express changes.

### 4.2 `server/src/sockets/index.ts` — the hub

```ts
io = new SocketServer<...>(httpServer, {
  cors: { origin: rawOrigins, credentials: true },  // same CORS as Express
  pingTimeout: 60_000,   // server pings the client every 25s; if no pong
  pingInterval: 25_000,  // within 60s it declares the socket dead
});

io.use(verifySocket);    // ← authentication, runs ONCE per new connection
```

**Rooms.** A room is just a label attached to sockets. When a user connects:

```ts
socket.join(`user:${userId}`);            // private — only this user's tabs
if (teamId) socket.join(`team:${teamId}`);// shared — every teammate online now
```

Later `io.to("team:6512...").emit("issue:updated", payload)` reaches exactly
the sockets that joined that room — and nobody else. Rooms are **server-side
and in-memory**: they exist only while the socket is connected (see §7).

**Issue rooms.** The detail page wants updates for *one* issue, so the
client explicitly asks to join a third room:

```ts
socket.on("issue:join",   (issueId) => socket.join(`issue:${issueId}`));
socket.on("issue:leave",  (issueId) => socket.leave(`issue:${issueId}`));
```

(Both validate with `Types.ObjectId.isValid` so a garbage string can't join
a nonsense room.)

**Typed sockets.** `verifySocket` attaches `socket.data.user`. To make
`socket.data.user` fully typed on every handler, the `Server` is
instantiated with a 4th generic (`AppSocketData`), and handlers use the
`AppSocket` alias from the middleware file:

```ts
export type AppServer = SocketServer<DefaultEventsMap, DefaultEventsMap,
                                     DefaultEventsMap, AppSocketData>;
io.on("connection", (socket: AppSocket) => {
  const { userId, teamId } = socket.data.user; // typed, no casts
});
```

### 4.3 `server/src/middlewares/verifySocket.middleware.ts` — socket auth

This is the socket twin of `verifyJWT` for HTTP routes. It runs before any
event handler can fire.

**Where the token comes from** (tried in order):

1. `socket.handshake.auth.token` — the client sends this explicitly (the
   browser WebSocket API cannot set an `Authorization` header).
2. The `accessToken` httpOnly cookie, parsed from the handshake's `Cookie`
   header — same cookie Express uses.

**Then, in order:**

```
token present?  ── no ──▶  next(new Error("Unauthorized: no token"))
      │ yes
jwt.verify(token) ── expired ─▶ "Unauthorized: token expired"
      │ valid                       (invalid/tampered    ─▶ "...invalid token")
      ▼
User.findById(decoded.userId)   ← re-read role + teamId from the DATABASE,
      │                            not from the token. Tokens live up to a
      │                            day; roles/team membership change sooner.
      │                            (A DB outage here gets its own error —
      ▼                            a Mongo blip must not look like a bad token.)
socket.data.user = { userId, role, teamId }
next()  ── connection proceeds
```

Calling `next(err)` instead of `next()` **refuses the connection** — the
client's `connect_error` fires with that message, and no events are ever
delivered. Your app never runs with an unauthenticated socket.

> The token is checked on **every new connection**, which also means every
> reconnect gets fresh permissions. Remove someone from a team and their
> next (re)connect lands outside `team:<id>`.

### 4.4 Controllers — where broadcasts actually happen

Controllers keep doing normal REST work; after `await issue.save()` (so the
write is *persisted*), they broadcast:

```ts
getIO().to(`team:${teamId}`).emit("issue:updated", { issueId, issue });
```

`getIO()` is a tiny singleton accessor around the `io` instance created in
`initSocket` — that's how a controller in a different file can reach the
WebSocket server without threading it through every route. Every emit is
wrapped in `try/catch`: if the socket server hasn't started yet (tests,
scripts), the HTTP request must still succeed.

---

## 5. The full event catalog

| Event | Direction | Room(s) | Payload | Emitted when |
|---|---|---|---|---|
| `notification:new` | server → client | `user:<id>` | full `Notification` (sender populated) | task assigned, status changed, priority changed, @mention, comment on your task |
| `issue:created` | server → client | `team:<id>` | `{ issueId, issue }` | POST /api/issues committed |
| `issue:updated` | server → client | `team:<id>` | `{ issueId, issue }` | PATCH /api/issues/:id committed |
| `issue:deleted` | server → client | `team:<id>` | `{ issueId }` | DELETE /api/issues/:id committed |
| `comment:new` | server → client | `issue:<id>` **+** `team:<id>` | `{ issueId, comment }` | POST /api/issues/:id/comments |
| `comment:deleted` | server → client | `issue:<id>` **+** `team:<id>` | `{ issueId, commentIndex }` | DELETE /api/issues/:id/comments/:index |
| `issue:join` | client → server | — | `issueId` (string) | detail page mounts (and on every reconnect) |
| `issue:leave` | client → server | — | `issueId` (string) | detail page unmounts |

Notes:

- `comment:new` goes to **both** the issue room and the team room, so a
  teammate on the board also sees the comment count tick up. A user on the
  detail page receives it twice (they're in both rooms) — harmless, because
  the client's reaction is idempotent cache invalidation (§6).
- Issue events are broadcast with the **full populated document** (creator
  and assignee names included), so any client can use it directly.
- Nothing is broadcast for a *failed* write — emits happen only after
  `issue.save()` resolves.

---

## 6. Client side, file by file

### 6.1 `client/src/lib/socket.ts` — one socket for the whole app

```ts
export const socket = io(SOCKET_URL, {
  autoConnect: false,        // created OFF; connect() is called deliberately
  withCredentials: true,     // send the httpOnly cookie with the handshake
  auth: (cb) => cb({ token: tokenStore.get() ?? "" }),  // freshest JWT each attempt
});
```

A **singleton**: every hook imports this same instance, so one tab = one
connection. `autoConnect: false` matters — importing the file must not open
a socket; only a logged-in app should. The `auth` **callback** re-runs on
every (re)connect attempt, so a refreshed token is always sent.

### 6.2 `hooks/useSocket.ts` — lifecycle = auth state

```ts
const user = useAppSelector((s) => s.auth.user);
useEffect(() => {
  if (!user) { socket.disconnect(); return; }
  if (!socket.connected) socket.connect();   // no-op if already up
  return () => socket.disconnect();
}, [user]);
```

Login → connect, logout → disconnect, mounted once in `RootLayout`. That's
the whole lifecycle.

### 6.3 `hooks/useSocketNotifications.ts` — inbox toasts

Listens for `notification:new` (targeted at `user:<id>`, so you only ever
get your own):

1. `dispatch(notificationApi.util.invalidateTags(["Notification"]))` → the
   notification panel and unread badge refetch;
2. shows a Sonner toast with the notification's title/message.

### 6.4 `hooks/useSocketIssues.ts` — live board / lists / dashboard

Mounted once in `RootLayout`. It listens for the three team-wide issue
events and on **any** of them:

```ts
dispatch(issueApi.util.invalidateTags(["Issue", "Dashboard"]));
```

That single line marks stale every cached issue list (Board, Issues page,
any filtered variant), every open issue detail, and the analytics
dashboard. RTK Query then refetches whatever is currently on screen and
drops whatever isn't.

**Why invalidate instead of patching the payload into the cache?** Lists
are filtered and sorted **server-side**. A teammate's change may make an
issue match (or stop matching) the filters this particular tab has active —
something the socket payload alone can't compute. Marking tags stale lets
RTK Query do the right thing in every case with one line of code.

**Self-echo:** the broadcast reaches *your own* tab too after your own
mutation. Your optimistic patch already updated the UI, so the invalidation
just triggers one extra, authoritative refetch. That's intentional — simple
code, and the cache always converges to server truth.

### 6.5 `hooks/useSocketIssueSync.ts` — the detail page's room

This is the only place `issue:join` is used:

```ts
const join = () => socket.emit("issue:join", issueId);
join();                    // mount (buffered if not yet connected)
socket.on("connect", join); // ← re-join after EVERY reconnect (see §7)
```

Then `comment:new`, `comment:deleted`, and `issue:updated` are filtered to
this `issueId` and invalidate the tag `{ type: "Issue", id }` — only the
open detail view refetches.

### 6.6 `RootLayout.tsx` — where it all activates

```ts
useSocket();               // connect/disconnect with auth
useSocketNotifications();  // toasts + inbox
useSocketIssues();         // live lists/board/dashboard
```

Plus `IssueDetailPage` calls `useSocketIssueSync(id)` for the issue room.

---

## 7. Edge cases & gotchas (the part that saves you at 2 a.m.)

**Reconnects lose rooms — except the ones we re-join.** Socket.IO's client
auto-reconnects after a network blip. The *server* sees a brand-new socket,
so `verifySocket` and the `connection` handler run again: `user:` and
`team:` rooms come back automatically. But `issue:<id>` rooms are requested
by the client — so `useSocketIssueSync` re-emits `issue:join` on every
`connect` event, not just once on mount. (Emitting while disconnected is
safe: socket.io-client buffers packets until the connection is up.)

**Auth on every reconnect.** Because `verifySocket` runs per connection, a
deleted user or revoked team membership takes effect on the next reconnect
without any extra bookkeeping.

**Rooms are in-memory.** They live in one process. If you ever scale to
several server instances you'll need a Socket.IO adapter (e.g.
`@socket.io/redis-adapter`) so `io.to("team:x")` reaches sockets connected
to *other* machines — or sticky sessions plus per-instance broadcasts.

**CORS is separate but shared.** The handshake is an HTTP request, so
Socket.IO needs its own `cors` option — Trackly builds it from the same
`CLIENT_URL` env as Express so they can never drift apart.

**No sockets → still works.** Every emit is `try/catch`-guarded and the
REST response is the source of truth. If WebSocket is blocked entirely, the
app degrades to "no live updates" instead of breaking.

**Auth is connection-level, not event-level.** `verifySocket` proves *who
you are* once. Scoping is done with rooms (you can only receive `team:<id>`
events if you joined that room at connect time) plus REST checks
(every issue query is filtered by `teamId` in the controller). New
server-side event handlers should still re-check permissions if they act on
data, not just broadcast.

---

## 8. One feature end-to-end: "@alice mentioned you"

```
 Bob's browser        Express API            MongoDB          Socket.IO          Alice's browser
      │  POST /issues/123/comments                │                │                    │
      │────────────────────────────────────────▶  │                │                    │
      │              addComment controller        │                │                    │
      │              ① issue.comments.push ──────▶│ save()         │                    │
      │              ② findMentionedUsers("@alice")  finds Alice   │                    │
      │              ③ createNotification ───────▶│ insert         │                    │
      │                        └── populate sender │                │                    │
      │              ④ getIO().to("issue:123") ───────────────────▶│  comment:new       │
      │              ⑤ getIO().to("team:T1")   ───────────────────▶│  (Bob's tab too)   │
      │              ⑥ io.to("user:<alice>")   ───────────────────▶│───────────────────▶│ 7
      │  201 { comments } ◀──────────────────────│                │                    │    toast "Mentioned"
      │  RTK Query patches its own cache         │                │                    │    + inbox refetches
      │                                                          (same invalidation path)
```

① the write is persisted **before** anything is broadcast; ② mentions are
resolved against *team members only*; ③ the notification row is saved first
(so Alice's inbox has history even if she's offline), then pushed; ④⑤ the
comment event reaches detail viewers and teammates; ⑥ the notification is
room-scoped to Alice alone; ⑦ Alice's client reacts with a toast + cache
invalidation — if her tab was closed entirely, the notification simply
waits in MongoDB for her next page load.

---

## 9. How to see it live

1. Start the stack (`cd server && pnpm dev`, `cd client && pnpm dev`).
2. Open **two browsers** (one normal, one private window) and log in as two
   *different members of the same team*.
3. Open DevTools → Console: you'll see `[WS] connected userId=...` in both.
4. In window A, create / update / delete an issue or post a comment.
   Window B updates **without refreshing** — that's the whole system working.
5. The server console logs every connect/disconnect, and killing the network
   (DevTools → Offline) then releasing it shows the reconnect + room re-join.

---

## 10. Quick file map

| File | Role |
|---|---|
| `server/src/index.ts` | creates the shared HTTP server, calls `initSocket` |
| `server/src/sockets/index.ts` | Socket.IO setup, rooms, `issue:join/leave`, event catalog |
| `server/src/middlewares/verifySocket.middleware.ts` | per-connection auth; defines `SocketUser` / `AppSocket` |
| `server/src/controllers/issue.controller.ts` | CRUD + `issue:{created,updated,deleted}`, `comment:{new,deleted}` broadcasts |
| `server/src/utils/notification.util.ts` | saves + pushes `notification:new` to `user:<id>` |
| `client/src/lib/socket.ts` | the singleton socket (lazy connect, token callback) |
| `client/src/lib/token-store.ts` | sessionStorage-backed JWT the socket authenticates with |
| `client/src/hooks/useSocket.ts` | connect ↔ login state |
| `client/src/hooks/useSocketNotifications.ts` | `notification:new` → toast + inbox refetch |
| `client/src/hooks/useSocketIssues.ts` | team events → live board/lists/dashboard |
| `client/src/hooks/useSocketIssueSync.ts` | issue room join/leave → live detail page |
| `client/src/layout/RootLayout.tsx` | mounts the three always-on hooks |

---

## 11. Adding a new live event (recipe)

1. **Server:** after the DB write in your controller, broadcast to the
   narrowest correct room:

   ```ts
   try {
     getIO().to(`team:${teamId}`).emit("team:memberRemoved", { userId });
   } catch { /* socket server not up — HTTP response still succeeds */ }
   ```

2. **Client:** listen in the hook whose scope matches (a new team-wide
   event belongs in `useSocketIssues`; something user-specific belongs in
   `useSocketNotifications`; a single-issue event belongs in
   `useSocketIssueSync`), and invalidate the matching RTK Query tag:

   ```ts
   socket.on("team:memberRemoved", () =>
     dispatch(teamApi.util.invalidateTags(["TeamMembers"]))
   );
   ```

3. Document the event in §5's table.

That's it — REST remains the only writer, the socket is only the announcer,
and the UI heals itself through cache invalidation.
