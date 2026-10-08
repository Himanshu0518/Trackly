import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateTeamMutation } from "@/services/team.services";
import { useCurrentUserQuery } from "@/services/auth.services";
import { useAppDispatch } from "@/store/authSlice";
import { setUser } from "@/store/authSlice";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
  description: z.string().max(200, "Max 200 characters").optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateTeamPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [createTeam, { isLoading }] = useCreateTeamMutation();
  const { refetch } = useCurrentUserQuery();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createTeam(values).unwrap();
      const me = await refetch();
      if (me.data?.data) {
        dispatch(setUser(me.data.data));
      }
      toast.success("Team created!");
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(message ?? "Failed to create team");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-7 h-7 rounded bg-foreground flex items-center justify-center">
            <span className="text-background text-xs font-bold">T</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">Trackly</span>
        </div>
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Create your team</CardTitle>
            <CardDescription>Set up a workspace for your team to track issues.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team name</FormLabel>
                    <FormControl><Input placeholder="Acme Engineering" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Textarea placeholder="What does your team work on?" rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create team"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
