import { useNavigate } from "react-router-dom";
import { PriorityBadge, TypeBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { IssueData } from "@/types/user.types";
import { cn } from "@/lib/utils";

interface IssueCardProps {
  issue: IssueData;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function IssueCard({ issue }: IssueCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/issues/${issue._id}`)}
      className={cn(
        "group bg-card border border-border rounded-md p-3 cursor-pointer",
        "hover:border-zinc-300 hover:shadow-sm transition-all duration-150"
      )}
    >
      <p className="text-sm font-medium text-foreground line-clamp-2 mb-2.5 group-hover:text-foreground/80">
        {issue.title}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <TypeBadge type={issue.type} />
        <PriorityBadge priority={issue.priority} />
      </div>
      {issue.assignedTo && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px] bg-muted">
              {getInitials(issue.assignedTo.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{issue.assignedTo.name}</span>
        </div>
      )}
    </div>
  );
}
