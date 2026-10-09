import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useCurrentUserQuery } from "@/services/auth.services";
import {
  setUser,
  clearUser,
  setInitialized,
  useAppSelector,
  useAppDispatch,
} from "@/store/authSlice";
import { Loader2 } from "lucide-react";

/**
 * RootLayout — fires ONE /users/me on cold boot to hydrate Redux.
 *
 * Skip conditions (no network call made):
 *   1. Already initialized AND no user  → post-logout or first 401 already handled
 *   2. Already initialized AND has user → login/signup already set the store;
 *      no need to re-fetch and risk a race overwriting the fresh state
 */
export default function RootLayout() {
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector((s) => s.auth.isInitialized);
  // const user = useAppSelector((s) => s.auth.user);

  // Skip whenever auth state is already known — covers both post-login and post-logout
  const shouldSkip = isInitialized;

  const { data, isLoading, isError, isFetching } = useCurrentUserQuery(
    undefined,
    {
      skip: shouldSkip,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  useEffect(() => {
    if (isLoading || isFetching) return;

    if (data?.data) {
      dispatch(setUser(data.data));
    } else if (isError) {
      dispatch(clearUser());
    }
  }, [data, isError, isLoading, isFetching, dispatch]);

  // Mark initialized immediately when the query is skipped
  useEffect(() => {
    if (shouldSkip && !isInitialized) {
      dispatch(setInitialized());
    }
  }, [shouldSkip, isInitialized, dispatch]);

  // Only block render on the cold-boot fetch (shouldSkip === false)
  if (!shouldSkip && (isLoading || isFetching)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return <Outlet />;
}
