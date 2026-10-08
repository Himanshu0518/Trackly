import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useCurrentUserQuery } from "@/services/auth.services";
import { setUser, clearUser } from "@/store/authSlice";
import { useAppDispatch } from "@/store/authSlice";
import { Loader2 } from "lucide-react";

export default function RootLayout() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isError } = useCurrentUserQuery();

  useEffect(() => {
    if (data?.data) {
      dispatch(setUser(data.data));
    } else if (isError) {
      dispatch(clearUser());
    }
  }, [data, isError, dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <Outlet />;
}
