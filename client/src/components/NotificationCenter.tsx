import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  UserCheck,
  AtSign,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from "@/services/notification.services";
import type { NotificationData, NotificationType } from "@/types/user.types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "TASK_ASSIGNED":
      return <UserCheck className="h-3.5 w-3.5 text-blue-500" />;
    case "MENTIONED_IN_COMMENT":
      return <AtSign className="h-3.5 w-3.5 text-purple-500" />;
    case "STATUS_CHANGED":
      return <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />;
    case "PRIORITY_CHANGED":
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    case "COMMENT_ADDED":
      return <MessageSquare className="h-3.5 w-3.5 text-sky-500" />;
    default:
      return <Bell className="h-3.5 w-3.5 text-primary" />;
  }
}

function getNotificationBadgeBg(type: NotificationType) {
  switch (type) {
    case "TASK_ASSIGNED":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "MENTIONED_IN_COMMENT":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    case "STATUS_CHANGED":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "PRIORITY_CHANGED":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "COMMENT_ADDED":
      return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Poll notifications and unread count every 15s for real-time updates
  const { data: countData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 15000,
  });
  const unreadCount = countData?.data?.count ?? 0;

  const { data: notificationsData, isLoading } = useGetNotificationsQuery(
    { unreadOnly: filter === "unread", limit: 30 },
    { pollingInterval: 15000 }
  );

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = notificationsData?.data?.notifications ?? [];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleNotificationClick = async (notif: NotificationData) => {
    if (!notif.read) {
      try {
        await markAsRead(notif._id).unwrap();
      } catch {
        // silent catch
      }
    }
    setOpen(false);
    if (notif.link) {
      navigate(notif.link);
    } else if (notif.issueId) {
      navigate(`/issues/${notif.issueId}`);
    }
  };

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAllAsRead().unwrap();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(id).unwrap();
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const handleSingleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await markAsRead(id).unwrap();
    } catch {
      // silent
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "relative h-9 w-9 rounded-full transition-colors",
          open && "bg-accent text-accent-foreground"
        )}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm animate-in fade-in zoom-in">
            {unreadCount > 99 ? "99+" : unreadCount}
            <span className="absolute -z-10 h-full w-full rounded-full bg-primary/40 animate-ping" />
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl shadow-black/10 duration-200 animate-in fade-in-0 zoom-in-95 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAll}
                disabled={isMarkingAll}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border/60 bg-muted/10 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors",
                filter === "all"
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5",
                filter === "unread"
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Unread
              {unreadCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Loading notifications…
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                  <Check className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-foreground">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  We'll notify you when tasks are assigned or you are mentioned.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.read;
                const senderInitials = notif.sender?.name
                  ? notif.sender.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "?";

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "group relative flex items-start gap-3 p-3 text-left transition-colors cursor-pointer hover:bg-muted/50",
                      isUnread && "bg-primary/[0.03]"
                    )}
                  >
                    {/* Unread indicator bar */}
                    {isUnread && (
                      <span className="absolute left-1 top-4 bottom-4 w-1 rounded-full bg-primary" />
                    )}

                    {/* Sender Avatar with type badge overlay */}
                    <div className="relative shrink-0 mt-0.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px] font-semibold bg-muted">
                          {senderInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "absolute -bottom-1 -right-1 p-0.5 rounded-full border bg-background",
                          getNotificationBadgeBg(notif.type)
                        )}
                      >
                        {getNotificationIcon(notif.type)}
                      </div>
                    </div>

                    {/* Notification content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold truncate text-foreground">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          · {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {/* Quick actions on hover */}
                    <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background/80 backdrop-blur-xs rounded-md p-0.5 shadow-xs border border-border/40">
                      {isUnread && (
                        <button
                          onClick={(e) => handleSingleMarkRead(e, notif._id)}
                          title="Mark as read"
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, notif._id)}
                        title="Delete notification"
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-border bg-muted/20 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  navigate("/issues");
                }}
                className="w-full text-xs text-muted-foreground hover:text-foreground h-7 gap-1"
              >
                <span>View all active issues</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
