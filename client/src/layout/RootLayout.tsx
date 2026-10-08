import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useCurrentUserQuery } from "@/services/auth.services";
import { setUser, clearUser, setInitialized, useAppSelector, useAppDispatch } from "@/store/authSlice";
import { Loader2 } from "lucide-react";

/**
 * RootLayout — sits at the very top of the router tree.
 * It fires ONE /users/me request on app boot to hydrate
 * the Redux auth state, then renders all children.
 *
 * Once the user logs out (user === null, isInitialized === true),
 * the query is skipped entirely — no further 401 calls are made.
 * AuthLayout (below this) reads from Redux only — no duplicate requests.
 */
export default function RootLayout() {
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector((s) => s.auth.isInitialized);
  const user = useAppSelector((s) => s.auth.user);

  // Skip the query if we already know there's no session (post-logout or after first 401).
  // This prevents the spurious /users/me 401 calls after logout.
  const shouldSkip = isInitialized && !user;

  const { data, isLoading, isError, isFetching } = useCurrentUserQuery(undefined, {
    skip: shouldSkip,
    // Don't refetch on window focus — the cookie is stable until logout
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (isLoading || isFetching) return;

    if (data?.data) {
      dispatch(setUser(data.data));
    } else if (isError) {
      // 401 = no active session; mark initialized so auth guards can redirect
      dispatch(clearUser());
    }
  }, [data, isError, isLoading, isFetching, dispatch]);

  // Mark initialized when query is skipped (post-logout state)
  useEffect(() => {
    if (shouldSkip && !isInitialized) {
      dispatch(setInitialized());
    }
  }, [shouldSkip, isInitialized, dispatch]);

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
