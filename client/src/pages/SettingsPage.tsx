import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogOut, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useUpdateMeMutation } from "@/services/auth.services";
import { useExitTeamMutation } from "@/services/team.services";
import { useAppSelector, useAppDispatch, setUser } from "@/store/authSlice";
import { toast } from "sonner";

const schema = z.object({ name: z.string().min(2, "Name must be at least 2 characters") });
type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();

  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();
  const [exitTeam, { isLoading: isExiting }] = useExitTeamMutation();
  const [showExitModal, setShowExitModal] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await updateMe(values).unwrap();
      dispatch(setUser(res.data));
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleExitTeam = async () => {
    try {
      await exitTeam().unwrap();
      // Clear teamId from Redux — token re-issued by server reflects this too
      dispatch(setUser({ ...user!, teamId: null, role: "MEMBER" }));
      toast.success("You have left the team");
      setShowExitModal(false);
      navigate("/onboarding/create-team");
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(message ?? "Failed to exit team");
      setShowExitModal(false);
    }
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="p-6 max-w-lg space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      {/* ── Profile card ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <p className="text-sm">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Role</p>
            <Badge variant="outline" className="text-xs">{user?.role ?? "—"}</Badge>
          </div>
          <Separator />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ── Danger zone ── */}
      {user?.teamId && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Leave team</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAdmin
                    ? "Admins cannot leave — delete the team or transfer ownership first."
                    : "You will lose access to all team issues and data. Another admin can re-add you later."}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0"
                disabled={isAdmin}
                onClick={() => setShowExitModal(true)}
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Leave team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Confirmation modal ── */}
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
              </div>
              <DialogTitle>Leave team?</DialogTitle>
            </div>
            <DialogDescription className="text-sm leading-relaxed">
              You will immediately lose access to all issues, the board, and team
              data. You won't be able to rejoin unless an admin invites you again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExitModal(false)}
              disabled={isExiting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleExitTeam}
              disabled={isExiting}
            >
              {isExiting ? "Leaving…" : "Yes, leave team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
