import { useState } from "react";
import {
  useGetMyTeamQuery,
  useGetTeamMembersQuery,
  useAddMemberMutation,
  useRemoveMemberMutation,
} from "@/services/team.services";
import { useAppSelector } from "@/store/authSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Trash2, AlertCircle } from "lucide-react";
import UserSearchCombobox from "@/components/UserSearchCombobox";
import type { UserSearchResult } from "@/types/user.types";
import { toast } from "sonner";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TeamPage() {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const { data: teamData, isLoading: teamLoading } = useGetMyTeamQuery(undefined, {
    skip: !user,
  });
  const { data: membersData, isLoading: membersLoading } = useGetTeamMembersQuery(undefined, {
    skip: !user,
  });
  const [addMember, { isLoading: isAdding }] = useAddMemberMutation();
  const [removeMember] = useRemoveMemberMutation();

  const [addOpen, setAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectError, setSelectError] = useState("");

  const handleOpenChange = (open: boolean) => {
    setAddOpen(open);
    if (!open) {
      setSelectedUser(null);
      setSelectError("");
    }
  };

  const handleAdd = async () => {
    if (!selectedUser?._id) {
      setSelectError("Please select a user from the list");
      return;
    }
    setSelectError("");
    try {
      await addMember({ userId: selectedUser._id }).unwrap();
      toast.success(`${selectedUser.name} added to the team`);
      handleOpenChange(false);
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(msg ?? "Failed to add member");
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    try {
      await removeMember(memberId).unwrap();
      toast.success(`${memberName} removed from the team`);
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const team = teamData?.data;
  const members = membersData?.data ?? [];

  if (teamLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Team</h1>

        {isAdmin && (
          <Dialog open={addOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger
              render={
                <Button size="sm" className="gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  Add member
                </Button>
              }
            />

            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Add team member</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-1">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Search by name or email
                  </label>
                  <UserSearchCombobox
                    selected={selectedUser}
                    onSelect={(u) => {
                      setSelectedUser(u._id ? u : null);
                      setSelectError("");
                    }}
                    disabled={isAdding}
                  />
                  {selectError && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {selectError}
                    </p>
                  )}
                </div>

                {/* Selected user preview */}
                {selectedUser?._id && (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border border-border">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {getInitials(selectedUser.name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedUser.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      Will be added as Member
                    </Badge>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenChange(false)}
                    disabled={isAdding}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    disabled={isAdding || !selectedUser?._id}
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Adding…
                      </>
                    ) : (
                      "Add to team"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team info */}
      {team && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{team.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {team.description ? (
              <p className="text-sm text-muted-foreground">{team.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Members list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Members{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({members.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {membersLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {members.map((m) => (
                <div key={m._id} className="flex items-center gap-3 px-6 py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                      {getInitials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      m.role === "ADMIN"
                        ? "text-xs border-primary/30 text-primary"
                        : "text-xs"
                    }
                  >
                    {m.role}
                  </Badge>
                  {isAdmin && m.role !== "ADMIN" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(m._id, m.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
