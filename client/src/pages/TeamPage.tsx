import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetMyTeamQuery, useGetTeamMembersQuery, useAddMemberMutation, useRemoveMemberMutation,
} from "@/services/team.services";
import { useAppSelector } from "@/store/authSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const addMemberSchema = z.object({ userId: z.string().min(1, "User ID is required") });
type AddMemberForm = z.infer<typeof addMemberSchema>;

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function TeamPage() {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const { data: teamData, isLoading: teamLoading } = useGetMyTeamQuery(undefined, { skip: !user });
  const { data: membersData, isLoading: membersLoading } = useGetTeamMembersQuery(undefined, { skip: !user });
  const [addMember, { isLoading: isAdding }] = useAddMemberMutation();
  const [removeMember] = useRemoveMemberMutation();

  const [addOpen, setAddOpen] = useState(false);

  const form = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { userId: "" },
  });

  const handleAdd = async (values: AddMemberForm) => {
    try {
      await addMember({ userId: values.userId }).unwrap();
      toast.success("Member added");
      form.reset();
      setAddOpen(false);
    } catch (err: unknown) {
      const msg = typeof err === "object" && err !== null && "data" in err
        ? (err as { data?: { message?: string } }).data?.message : undefined;
      toast.error(msg ?? "Failed to add member");
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await removeMember(memberId).unwrap();
      toast.success("Member removed");
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Team</h1>
        {isAdmin && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger render={
              <Button size="sm" className="gap-1.5">
                <UserPlus className="h-4 w-4" />
                Add member
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add team member</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAdd)} className="space-y-4">
                  <FormField control={form.control} name="userId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>User ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter user's MongoDB ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isAdding}>{isAdding ? "Adding..." : "Add member"}</Button>
                  </div>
                </form>
              </Form>
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

      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Members ({members.length})</CardTitle>
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
                    <AvatarFallback className="text-xs bg-muted">{getInitials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{m.role}</Badge>
                  {isAdmin && m.role !== "ADMIN" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(m._id)}
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
