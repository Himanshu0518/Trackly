import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { userApi } from "@/services/auth.services";
import { setUser, clearUser, useAppDispatch, useAppSelector } from "@/store/authSlice";
import { Loader2 } from "lucide-react";

export default function RootLayout() {
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector((s) => s.auth.isInitialized);
  // Track whether we've already done the cold-boot fetch in this page session.
  // Using a ref means it persists across React re-renders but resets on a true
  // hard reload — which is the only time we actually need a fresh /users/me.
  const didFetch = useRef(false);

  useEffect(() => {
    // Skip if auth state is already known (set by login/signup) OR if we already
    // fired this request. Prevents the cross-origin cookie from being tested again
    // in incognito mode right after login, which would 401 and log the user out.
    if (isInitialized || didFetch.current) return;

    didFetch.current = true;

    const request = dispatch(
      userApi.endpoints.currentUser.initiate(undefined, { subscribe: false })
    );

    request
      .unwrap()
      .then((res) => dispatch(setUser(res.data)))
      .catch(() => dispatch(clearUser()));
  }, [dispatch, isInitialized]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return <Outlet />;
}
