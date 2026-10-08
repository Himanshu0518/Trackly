import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useGetIssuesQuery, useUpdateIssueMutation } from "@/services/issue.services";
import { useAppSelector } from "@/store/authSlice";
import NewIssueDialog from "@/components/issues/NewIssueDialog";
import { Button } from "@/components/ui/button";
import { PriorityBadge, TypeBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Loader2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IssueData, IssueStatus } from "@/types/user.types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// ─── Column config ────────────────────────────────────────────────────────────
const COLUMNS: { id: IssueStatus; label: string; color: string; bg: string }[] = [
  { id: "TODO",        label: "To Do",       color: "text-slate-500",   bg: "bg-slate-500/10" },
  { id: "IN_PROGRESS", label: "In Progress", color: "text-amber-500",   bg: "bg-amber-500/10" },
  { id: "DONE",        label: "Done",        color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Draggable Issue Card ─────────────────────────────────────────────────────
interface DraggableCardProps {
  issue: IssueData;
  isDragging?: boolean;
}

function DraggableCard({ issue, isDragging }: DraggableCardProps) {
  const navigate = useNavigate();
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging,
  } = useSortable({ id: issue._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-card border border-border rounded-lg p-3 transition-all duration-150",
        "hover:border-primary/30 hover:shadow-sm",
        isDragging && "shadow-xl border-primary/40 rotate-1 scale-102"
      )}
    >
      {/* Drag handle + title row */}
      <div className="flex items-start gap-1.5 mb-2.5">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 flex-shrink-0 p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/60 transition-colors cursor-grab active:cursor-grabbing focus:outline-none"
          tabIndex={-1}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <p
          className="text-sm font-medium text-foreground line-clamp-2 flex-1 cursor-pointer hover:text-primary transition-colors"
          onClick={() => navigate(`/issues/${issue._id}`)}
        >
          {issue.title}
        </p>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
        <TypeBadge type={issue.type} />
        <PriorityBadge priority={issue.priority} />
      </div>

      {/* Assignee */}
      {issue.assignedTo && (
        <div className="flex items-center gap-1.5">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
              {getInitials(issue.assignedTo.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{issue.assignedTo.name}</span>
        </div>
      )}
    </div>
  );
}

// ─── Drop Column ─────────────────────────────────────────────────────────────
interface ColumnProps {
  column: (typeof COLUMNS)[number];
  issues: IssueData[];
  isOver?: boolean;
}

function Column({ column, issues, isOver }: ColumnProps) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: "column" },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-h-0 rounded-xl border transition-colors duration-150",
        "bg-muted/30",
        isOver ? "border-primary/40 bg-primary/5" : "border-border/60"
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border/60">
        <span className={cn("w-2 h-2 rounded-full", column.bg.replace("/10", ""))} />
        <span className="text-sm font-semibold text-foreground">{column.label}</span>
        <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full leading-none ml-auto", column.bg, column.color)}>
          {issues.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext items={issues.map((i) => i._id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-2 flex-1 min-h-[120px]">
          {issues.length === 0 ? (
            <div className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center text-xs text-muted-foreground/60 transition-colors",
              isOver ? "border-primary/40" : "border-border/40"
            )}>
              Drop issues here
            </div>
          ) : (
            issues.map((issue) => (
              <DraggableCard key={issue._id} issue={issue} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Board Page ───────────────────────────────────────────────────────────────
export default function BoardPage() {
  const user = useAppSelector((s) => s.auth.user);
  // Re-uses the SAME cache key as DashboardPage → zero extra API call
  const { data, isLoading, isError } = useGetIssuesQuery(undefined, { skip: !user });
  const [updateIssue] = useUpdateIssueMutation();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<IssueStatus | null>(null);

  const issues = data?.data ?? [];

  const byStatus = useCallback(
    (status: IssueStatus) => issues.filter((i) => i.status === status),
    [issues]
  );

  const activeIssue = issues.find((i) => i._id === activeId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumnId(null);

    if (!over) return;

    const draggedIssue = issues.find((i) => i._id === active.id);
    if (!draggedIssue) return;

    // Determine target column: either a column id or derive from another issue's status
    let targetStatus: IssueStatus | null = null;
    const columnId = COLUMNS.find((c) => c.id === over.id);
    if (columnId) {
      targetStatus = columnId.id;
    } else {
      const overIssue = issues.find((i) => i._id === over.id);
      if (overIssue) targetStatus = overIssue.status;
    }

    if (!targetStatus || draggedIssue.status === targetStatus) return;

    try {
      await updateIssue({ id: draggedIssue._id, status: targetStatus }).unwrap();
      toast.success(`Moved to ${COLUMNS.find((c) => c.id === targetStatus)?.label}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDragOver = (event: { over: { id: string | number } | null }) => {
    if (!event.over) { setOverColumnId(null); return; }
    const col = COLUMNS.find((c) => c.id === event.over!.id);
    setOverColumnId(col ? col.id : null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full py-24 text-muted-foreground text-sm">
        Failed to load board.
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Board</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Drag and drop to change issue status
          </p>
        </div>
        <NewIssueDialog>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Issue
          </Button>
        </NewIssueDialog>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="grid grid-cols-3 gap-4 flex-1 min-h-0 overflow-y-auto pb-2">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              column={col}
              issues={byStatus(col.id)}
              isOver={overColumnId === col.id}
            />
          ))}
        </div>

        {/* Floating drag overlay */}
        <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
          {activeIssue ? (
            <DraggableCard issue={activeIssue} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
