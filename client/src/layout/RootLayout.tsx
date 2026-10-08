import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useCurrentUserQuery } from "@/services/auth.services";
import { setUser, clearUser, setInitialized } from "@/store/authSlice";
import { useAppDispatch } from "@/store/authSlice";
import { Loader2 } from "lucide-react";

/**
 * RootLayout — sits at the very top of the router tree.
 * It fires ONE /users/me request on app boot to hydrate
 * the Redux auth state, then renders all children.
 *
 * AuthLayout (below this) reads from Redux only — no duplicate requests.
 */
export default function RootLayout() {
  const dispatch = useAppDispatch();

  // Single auth-hydration call on app boot.
  // A 401 from /users/me means no active session — that's fine, not an error.
  const { data, isLoading, isError, isFetching } = useCurrentUserQuery(undefined, {
    // Don't refetch on window focus — the cookie is stable until logout
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (isLoading || isFetching) return;

    if (data?.data) {
      dispatch(setUser(data.data));
    } else if (isError) {
      // 401 = no session; mark as initialized so guards can redirect
      dispatch(clearUser());
    }
  }, [data, isError, isLoading, isFetching, dispatch]);

  // Mark initialized even when there's no user (isError covers 401)
  useEffect(() => {
    if (!isLoading && !isFetching && isError) {
      dispatch(setInitialized());
    }
  }, [isLoading, isFetching, isError, dispatch]);

  // Block rendering until we know the auth state
  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return <Outlet />;
}
