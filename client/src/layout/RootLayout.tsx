/**
 * RootLayout — top of the router tree
 *
 * Responsibilities:
 *  1. Fire ONE /users/me request on app boot to hydrate Redux auth state
 *  2. Connect / disconnect the WebSocket based on auth state (useSocket)
 *  3. Listen for pushed notifications and show toasts (useSocketNotifications)
 *  4. Keep issue lists / board / dashboard live via team-wide socket events
 *     (useSocketIssues)
 */

import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useCurrentUserQuery } from "@/services/auth.services";
import { setUser, clearUser, setInitialized } from "@/store/authSlice";
import { useAppDispatch } from "@/store/authSlice";
import { useSocket } from "@/hooks/useSocket";
import { useSocketNotifications } from "@/hooks/useSocketNotifications";
import { useSocketIssues } from "@/hooks/useSocketIssues";
import { Loader2 } from "lucide-react";

export default function RootLayout() {
  const dispatch = useAppDispatch();

  // ── 1. Auth hydration ─────────────────────────────────────────────────────
  const { data, isLoading, isFetching, isError } = useCurrentUserQuery(undefined, {
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (isLoading || isFetching) return;
    if (data?.data) {
      dispatch(setUser(data.data));
    } else if (isError) {
      dispatch(clearUser());
    }
  }, [data, isError, isLoading, isFetching, dispatch]);

  useEffect(() => {
    if (!isLoading && !isFetching && isError) {
      dispatch(setInitialized());
    }
  }, [isLoading, isFetching, isError, dispatch]);

  // ── 2–4. WebSocket lifecycle + live listeners ─────────────────────────────
  // These hooks watch the Redux user state themselves — no props needed.
  useSocket();
  useSocketNotifications();
  useSocketIssues();

  // ── Block rendering until we know the auth state ──────────────────────────
  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return <Outlet />;
}
