import {
  MessageSquare,
  ArrowRight,
  UserCheck,
  AlertTriangle,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import type { CommentData, IssueActivityData, IssueStatus, IssuePriority } from "@/types/user.types";

interface IssueTimelineProps {
  comments: CommentData[];
  activities?: IssueActivityData[];
  currentUserId?: string;
  isAdmin?: boolean;
  onDeleteComment?: (index: number) => void;
  isDeletingComment?: boolean;
}

type TimelineItem =
  | { kind: "comment"; data: CommentData; index: number; date: Date }
  | { kind: "activity"; data: IssueActivityData; date: Date };

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeAgo(dateString: string | Date): string {
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
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Highlights @mentions within comment text with a styled chip badge
 */
function renderCommentBody(text: string) {
  // Matches @Word or @Word_Word or @word.word
  const mentionRegex = /(@[a-zA-Z0-9._-]+(?:\s+[a-zA-Z0-9._-]+)?)/g;
  const parts = text.split(mentionRegex);

  return (
    <p className="text-sm text-foreground/90 leading-relaxed break-words whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith("@") && part.length > 1) {
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mx-0.5"
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

export default function IssueTimeline({
  comments,
  activities = [],
  currentUserId,
  isAdmin,
  onDeleteComment,
  isDeletingComment,
}: IssueTimelineProps) {
  // Merge comments and activities in chronological order
  const timeline: TimelineItem[] = [
    ...comments.map((c, index) => ({
      kind: "comment" as const,
      data: c,
      index,
      date: new Date(c.createdAt),
    })),
    ...activities.map((a) => ({
      kind: "activity" as const,
      data: a,
      date: new Date(a.createdAt),
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (timeline.length === 0) {
    return (
      <div className="py-8 px-4 text-center border border-dashed border-border/80 rounded-lg bg-muted/10">
        <MessageSquare className="h-6 w-6 text-muted-foreground/60 mx-auto mb-2" />
        <p className="text-xs font-medium text-foreground">No activity yet</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Leave a comment or mention a teammate to start the conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-px before:bg-border/60">
      {timeline.map((item, idx) => {
        if (item.kind === "comment") {
          const { data: c, index } = item;
          const isAuthor = c.userId?._id === currentUserId;
          const canDelete = isAuthor || isAdmin;

          return (
            <div key={`comment-${c._id || index}`} className="relative group flex items-start gap-3">
              {/* Timeline marker avatar */}
              <div className="absolute -left-6 top-1 rounded-full ring-4 ring-background bg-background">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
                    {c.userId?.name ? getInitials(c.userId.name) : "?"}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Comment Card */}
              <div className="flex-1 rounded-lg border border-border/70 bg-card p-3 shadow-xs transition-shadow hover:shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {c.userId?.name || "Deleted User"}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>

                  {canDelete && onDeleteComment && (
                    <button
                      type="button"
                      disabled={isDeletingComment}
                      onClick={() => onDeleteComment(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                      title="Delete comment"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {renderCommentBody(c.text)}
              </div>
            </div>
          );
        }

        // Activity Log entry
        const { data: a } = item;
        const actorName = a.userId?.name || "A team member";

        return (
          <div key={`activity-${idx}`} className="relative flex items-center gap-2.5 text-xs text-muted-foreground py-1">
            {/* Timeline icon dot */}
            <div className="absolute -left-6 top-1.5 rounded-full ring-4 ring-background bg-background">
              {a.type === "CREATED" && (
                <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Sparkles className="h-3 w-3" />
                </div>
              )}
              {a.type === "STATUS_CHANGE" && (
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ArrowRight className="h-3 w-3" />
                </div>
              )}
              {a.type === "PRIORITY_CHANGE" && (
                <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <AlertTriangle className="h-3 w-3" />
                </div>
              )}
              {a.type === "ASSIGNMENT_CHANGE" && (
                <div className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <UserCheck className="h-3 w-3" />
                </div>
              )}
            </div>

            {/* Activity message */}
            <div className="flex-1 flex items-center flex-wrap gap-1.5">
              <span className="font-medium text-foreground">{actorName}</span>

              {a.type === "CREATED" && <span>created this issue</span>}

              {a.type === "STATUS_CHANGE" && (
                <>
                  <span>changed status from</span>
                  {a.oldValue && <StatusBadge status={a.oldValue as IssueStatus} />}
                  <span>to</span>
                  {a.newValue && <StatusBadge status={a.newValue as IssueStatus} />}
                </>
              )}

              {a.type === "PRIORITY_CHANGE" && (
                <>
                  <span>changed priority from</span>
                  {a.oldValue && <PriorityBadge priority={a.oldValue as IssuePriority} />}
                  <span>to</span>
                  {a.newValue && <PriorityBadge priority={a.newValue as IssuePriority} />}
                </>
              )}

              {a.type === "ASSIGNMENT_CHANGE" && (
                <>
                  <span>reassigned issue</span>
                </>
              )}

              <span className="text-[10px] text-muted-foreground/80">
                · {timeAgo(a.createdAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
