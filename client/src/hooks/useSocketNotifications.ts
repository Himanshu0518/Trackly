/**
 * useSocketNotifications
 *
 * Listens for "notification:new" events pushed by the server and:
 *   1. Invalidates the RTK Query "Notification" cache tag
 *      → the NotificationCenter re-fetches and shows the new item
 *   2. Shows a Sonner toast so the user gets an immediate visual cue
 *      even if the notification panel is closed
 *
 * Must be called inside a component that is mounted for the full app
 * session — AppShell is the right place.
 */

import { useEffect } from "react";
import { toast } from "sonner";
import { socket } from "@/lib/socket";
import { useAppDispatch } from "@/store/authSlice";
import { notificationApi } from "@/services/notification.services";
import type { NotificationData } from "@/types/user.types";

export function useSocketNotifications() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleNew = (notification: NotificationData) => {
      // Invalidate the cached notification list so it auto-refetches
      dispatch(
        notificationApi.util.invalidateTags(["Notification"])
      );

      // Show a toast with the notification message
      toast(notification.title, {
        description: notification.message,
        duration: 5000,
        action: notification.link
          ? {
              label: "View",
              onClick: () => {
                window.location.href = notification.link;
              },
            }
          : undefined,
      });
    };

    socket.on("notification:new", handleNew);

    // Cleanup: remove listener when the component unmounts
    return () => {
      socket.off("notification:new", handleNew);
    };
  }, [dispatch]);
}
