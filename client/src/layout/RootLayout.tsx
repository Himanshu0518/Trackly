import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { userApi } from "@/services/auth.services";
import { setUser, clearUser, useAppDispatch, useAppSelector } from "@/store/authSlice";
import { Loader2 } from "lucide-react";

/**
 * RootLayout — sits at the very top of the router tree.
 *
 * It restores the session ONCE per page load: the JWT lives in an httpOnly
 * cookie that JavaScript cannot read, so the only way to learn "am I logged in,
 * and as whom?" after a refresh is to ask the server (GET /users/me).
 *
 * This is a one-shot request, deliberately NOT a live query subscription:
 *  - nothing can invalidate/refetch it later (no spinner flashes, no unmounting
 *    of the app while a page is open)
 *  - after boot, Redux is the single source of truth. Login / signup / create
 *    team / update profile all set the user straight from their own responses.
 */
export default function RootLayout() {
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector((s) => s.auth.isInitialized);

  useEffect(() => {
    // subscribe:false → fire-and-forget; RTK also de-duplicates the request if
    // React StrictMode runs this effect twice in development.
    const request = dispatch(
      userApi.endpoints.currentUser.initiate(undefined, { subscribe: false })
    );

    request
      .unwrap()
      .then((res) => dispatch(setUser(res.data)))
      // 401 = no session. Marks the auth state as initialized so guards redirect.
      .catch(() => dispatch(clearUser()));
  }, [dispatch]);

  // Block rendering until we know the auth state
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return <Outlet />;
}
