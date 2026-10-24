/**
 * useSocketIssueSync
 *
 * Used on the IssueDetailPage to get live updates for a single issue.
 *
 * WHAT HAPPENS:
 *   1. On mount  → emits "issue:join" so the server adds this socket to the
 *                  issue-specific room (issue:<id>)
 *   2. Listens for "comment:new" → if it's for this issue, invalidates the
 *                  RTK Query cache so the comment list re-fetches
 *   3. Listens for "comment:deleted" → same, comment disappears live
 *   4. Listens for "issue:updated" → same, invalidates the issue cache
 *   5. On unmount → emits "issue:leave" to clean up the server-side room
 *
 * WHY NOT PATCH THE CACHE DIRECTLY?
 *   We could use updateQueryData to surgically insert the new comment, but
 *   that requires duplicating the server's populate logic on the client.
 *   Invalidating and re-fetching is simpler and always correct — the extra
 *   round-trip is negligible for a single-issue fetch.
 */

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useAppDispatch } from "@/store/authSlice";
import { issueApi } from "@/services/issue.services";

interface Payload {
  issueId: string;
  [key: string]: unknown;
}

export function useSocketIssueSync(issueId: string | undefined) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!issueId) return;

    // Tell the server we want issue-room messages for this issue.
    // Socket.IO RECONNECTS create a brand-new server-side socket, which only
    // re-joins the user: and team: rooms (that happens in the connection
    // handler). The issue room would be lost — so we re-join on every
    // "connect" event, not just once on mount. (Emitting while disconnected
    // is safe: socket.io-client buffers packets until the connection is up.)
    const join = () => socket.emit("issue:join", issueId);
    join();
    socket.on("connect", join);

    const invalidate = (payload: Payload) => {
      if (payload.issueId !== issueId) return;
      // Bust the cached single-issue query → RTK Query will re-fetch
      dispatch(issueApi.util.invalidateTags([{ type: "Issue", id: issueId }]));
    };

    socket.on("comment:new",     invalidate);
    socket.on("comment:deleted", invalidate);
    socket.on("issue:updated",   invalidate);

    return () => {
      socket.off("connect", join);
      socket.emit("issue:leave", issueId);
      socket.off("comment:new",     invalidate);
      socket.off("comment:deleted", invalidate);
      socket.off("issue:updated",   invalidate);
    };
  }, [issueId, dispatch]);
}
