/**
 * useSocketIssues — team-wide live sync for issue lists / board / dashboard
 *
 * While this user is connected, ANY issue change made by a teammate
 * (created / updated / deleted over the REST API) is pushed by the server
 * into the team room, and this hook reacts by marking RTK Query caches
 * stale:
 *
 *   • "Issue" tag     → every cached issue list (Board, Issues page, any
 *                       filtered variant) and any open issue detail
 *   • "Dashboard" tag → analytics counters
 *
 * Mounted ONCE in RootLayout, next to useSocketNotifications. The single-
 * issue detail page has its own finer-grained hook (useSocketIssueSync)
 * that joins the issue room.
 *
 * WHY INVALIDATE INSTEAD OF PATCHING THE CACHE?
 *   Lists are filtered and sorted SERVER-SIDE. A teammate's change may make
 *   an issue match (or stop matching) the filters this tab has active, and
 *   the socket payload alone can't reproduce that logic. Marking tags stale
 *   lets RTK Query do the right thing automatically: refetch right now if a
 *   page is displaying the data, drop it from cache if nothing is mounted.
 *
 * NOTE ON SELF-ECHO: the server broadcasts to the whole team, including the
 * person who made the change. Their own mutation already patched the cache
 * optimistically, so this invalidation triggers one extra authoritative
 * refetch. That's intentional — it keeps the code simple and guarantees the
 * cache always converges to server state.
 */

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useAppDispatch } from "@/store/authSlice";
import { issueApi } from "@/services/issue.services";

export function useSocketIssues() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // One shared handler: any issue mutation anywhere in the team means
    // "whatever lists/dashboards you have cached may have changed".
    const refresh = () => {
      dispatch(issueApi.util.invalidateTags(["Issue", "Dashboard"]));
    };

    socket.on("issue:created", refresh);
    socket.on("issue:updated", refresh);
    socket.on("issue:deleted", refresh);

    return () => {
      socket.off("issue:created", refresh);
      socket.off("issue:updated", refresh);
      socket.off("issue:deleted", refresh);
    };
  }, [dispatch]);
}
