import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetIssueByIdQuery, useUpdateIssueMutation, useDeleteIssueMutation, useAddCommentMutation } from "@/services/issue.services";
import { useGetTeamMembersQuery } from "@/services/team.services";
import { useAppSelector } from "@/store/authSlice";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Trash2, CalendarIcon, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { IssueStatus, IssuePriority, IssueType } from "@/types/user.types";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const { data, isLoading } = useGetIssueByIdQuery(id!);
  const { data: membersData } = useGetTeamMembersQuery();
  const [updateIssue] = useUpdateIssueMutation();
  const [deleteIssue, { isLoading: isDeleting }] = useDeleteIssueMutation();
  const [addComment, { isLoading: isCommenting }] = useAddCommentMutation();

  const [commentText, setCommentText] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const issue = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!issue) {
    return <div className="p-6 text-muted-foreground text-sm">Issue not found.</div>;
  }

  const isCreator = issue.createdBy._id === user?._id;
  const isAdmin = user?.role === "ADMIN";
  const canReassign = isCreator || isAdmin;

  const handleUpdate = async (patch: Partial<{ title: string; description: string; type: IssueType; status: IssueStatus; priority: IssuePriority; assignedTo: string | null; dueDate: string | null }>) => {
    try {
      await updateIssue({ id: issue._id, ...patch }).unwrap();
      toast.success("Updated");
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteIssue(issue._id).unwrap();
      toast.success("Issue deleted");
      navigate("/dashboard");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment({ id: issue._id, text: commentText.trim() }).unwrap();
      setCommentText("");
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <Button variant="ghost" size="sm" className="gap-1.5 mb-6 -ml-1 text-muted-foreground" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="grid grid-cols-[1fr_220px] gap-8">
        {/* Main */}
        <div>
          <h1 className="text-xl font-semibold mb-1">{issue.title}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Opened by {issue.createdBy.name} · {new Date(issue.createdAt).toLocaleDateString()}
          </p>

          <div className="flex gap-2 mb-6">
            <TypeBadge type={issue.type} />
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
            {issue.dueDate && (
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
                issue.status !== "DONE" && new Date(issue.dueDate) < new Date()
                  ? "bg-red-500/10 border-red-500/30 text-red-500"
                  : "bg-muted border-border text-muted-foreground"
              }`}>
                <CalendarIcon className="h-3 w-3" />
                {new Date(issue.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {issue.status !== "DONE" && new Date(issue.dueDate) < new Date() && " · Overdue"}
              </span>
            )}
          </div>

          {issue.description && (
            <div className="text-sm text-muted-foreground leading-relaxed mb-8 p-4 bg-muted/30 rounded-md border border-border">
              {issue.description}
            </div>
          )}

          <Separator className="mb-6" />

          {/* Comments */}
          <h2 className="text-sm font-semibold mb-4">Comments ({issue.comments.length})</h2>
          <div className="space-y-3 mb-6">
            {issue.comments.map((c) => (
              <div key={c._id} className="flex gap-3">
                <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                  <AvatarFallback className="text-[10px] bg-muted">
                    {getInitials(c.userId.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{c.userId.name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.text}</p>
                </div>
              </div>
            ))}
            {issue.comments.length === 0 && (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            )}
          </div>

          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={handleComment} disabled={isCommenting || !commentText.trim()} className="self-end">
              {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="border border-border rounded-md p-4 space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Status</p>
              <Select value={issue.status} onValueChange={(v) => handleUpdate({ status: v as IssueStatus })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Priority</p>
              <Select value={issue.priority} onValueChange={(v) => handleUpdate({ priority: v as IssuePriority })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Type</p>
              <Select value={issue.type} onValueChange={(v) => handleUpdate({ type: v as IssueType })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUG">Bug</SelectItem>
                  <SelectItem value="FEATURE">Feature</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {canReassign && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Assigned to</p>
                <Select
                  value={issue.assignedTo?._id ?? "none"}
                  onValueChange={(v) => handleUpdate({ assignedTo: v === "none" ? null : v })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {membersData?.data?.map((m) => (
                      <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Due date */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Due date</p>
              {(() => {
                const isOverdue =
                  issue.status !== "DONE" &&
                  issue.dueDate &&
                  new Date(issue.dueDate) < new Date();
                const currentValue = issue.dueDate
                  ? new Date(issue.dueDate).toISOString().split("T")[0]
                  : "";
                return (
                  <div className="space-y-1">
                    <div className="relative">
                      <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        type="date"
                        className={`h-8 text-xs pl-7 pr-7 ${isOverdue ? "border-red-500/60 text-red-500 focus-visible:ring-red-500/30" : ""}`}
                        value={currentValue}
                        onChange={(e) => {
                          const v = e.target.value;
                          handleUpdate({
                            dueDate: v ? new Date(v).toISOString() : null,
                          });
                        }}
                      />
                      {currentValue && (
                        <button
                          type="button"
                          onClick={() => handleUpdate({ dueDate: null })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label="Clear due date"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {isOverdue && (
                      <p className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        Overdue
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {(isCreator || isAdmin) && (
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger render={
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5">
                  <Trash2 className="h-4 w-4" /> Delete issue
                </Button>
              } />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete issue?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
