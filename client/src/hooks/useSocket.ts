/**
 * useSocket — manages the socket lifecycle
 *
 * WHAT THIS DOES:
 *   • When a logged-in user is present → connects the socket
 *   • When the user logs out (user becomes null) → disconnects
 *   • Cleans up on unmount so hot-reload in dev doesn't stack connections
 *
 * WHERE TO USE:
 *   Call this once, high in the tree — inside RootLayout is perfect because
 *   it already knows whether the user is authenticated.
 */

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useAppSelector } from "@/store/authSlice";

export function useSocket() {
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (!user) {
      // User logged out — close the connection
      if (socket.connected) socket.disconnect();
      return;
    }

    // User is logged in — open (or re-open) the connection.
    // socket.connect() is a no-op if already connected, so this is safe
    // to call repeatedly.
    if (!socket.connected) socket.connect();

    return () => {
      // Cleanup on unmount (mainly useful during dev hot-reload)
      socket.disconnect();
    };
  }, [user]);
}
