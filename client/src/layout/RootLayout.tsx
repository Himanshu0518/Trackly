import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { userApi } from "@/services/auth.services";
import { setUser, clearUser, useAppDispatch, useAppSelector } from "@/store/authSlice";
import { Loader2 } from "lucide-react";

export default function RootLayout() {
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector((s) => s.auth.isInitialized);

  useEffect(() => {
    const request = dispatch(
      userApi.endpoints.currentUser.initiate(undefined, { subscribe: false })
    );

    request
      .unwrap()
      .then((res) => dispatch(setUser(res.data)))
      .catch(() => dispatch(clearUser()));
  }, [dispatch]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return <Outlet />;
}
