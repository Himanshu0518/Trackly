import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useLoginMutation, userFromAuth } from "@/services/auth.services";
import { resetSessionCaches } from "@/lib/session";
import { useAppDispatch, setUser } from "@/store/authSlice";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";
import { ShieldCheck, User } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

const TEST_ACCOUNTS = {
  admin: { email: "admin@trackly.dev", password: "Admin123!" },
  member: { email: "member@trackly.dev", password: "Member123!" },
} as const;

type TestRole = keyof typeof TEST_ACCOUNTS;

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  // null = picker hidden, "picking" = show role buttons, "loading" = autologging in
  const [testState, setTestState] = useState<"idle" | "picking" | "loading">("idle");
  const [testRole, setTestRole] = useState<TestRole | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  /** Shared login logic used by both manual form and test-account flow */
  const doLogin = async (email: string, password: string) => {
    const res = await login({ email, password }).unwrap();
    // Use the user data already returned by the login response —
    // no need for a second /users/me round-trip that races with RootLayout.
    const me = userFromAuth(res.data.user);
    resetSessionCaches(dispatch); // never show a previous user's cached issues/team
    dispatch(setUser(me));
    navigate(me.teamId ? "/dashboard" : "/onboarding/create-team", {
      replace: true,
    });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await doLogin(values.email, values.password);
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(message ?? "Login failed. Check your credentials.");
    }
  };

  const handleTestLogin = async (role: TestRole) => {
    setTestRole(role);
    setTestState("loading");
    try {
      const { email, password } = TEST_ACCOUNTS[role];
      await doLogin(email, password);
    } catch (err: unknown) {
      console.log(err)
      const message =
        typeof err === "object" && err !== null && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(message ?? "Test login failed");
      setTestState("picking");
      setTestRole(null);
    }
  };

  const isTestLoading = testState === "loading";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground text-sm font-bold">T</span>
          </div>
          <span className="font-semibold text-xl tracking-tight">Trackly</span>
        </div>

        <Card className="shadow-sm border-border">
          <CardHeader className="pb-5">
            <CardTitle className="text-xl font-semibold">Welcome back</CardTitle>
            <CardDescription>Sign in to continue to your workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* ── Manual login form ───────────────────────────── */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          disabled={isTestLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="••••••••"
                          autoComplete="current-password"
                          disabled={isTestLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading || isTestLoading}
                >
                  {isLoading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </Form>

            {/* ── Divider ─────────────────────────────────────── */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground tracking-wider">
                  or
                </span>
              </div>
            </div>

            {/* ── Test account section ────────────────────────── */}
            {testState === "idle" && (
              <Button
                variant="outline"
                className="w-full gap-2 text-muted-foreground"
                onClick={() => setTestState("picking")}
                disabled={isLoading}
              >
                Continue with a test account
              </Button>
            )}

            {testState === "picking" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  Pick a role to explore Trackly
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="flex flex-col h-auto py-3 gap-1.5 border-primary/30 hover:border-primary hover:bg-primary/5"
                    onClick={() => handleTestLogin("admin")}
                    disabled={isTestLoading}
                  >
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Admin</span>
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      Full access
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col h-auto py-3 gap-1.5 hover:border-border/80 hover:bg-muted/50"
                    onClick={() => handleTestLogin("member")}
                    disabled={isTestLoading}
                  >
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Member</span>
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      View &amp; edit issues
                    </span>
                  </Button>
                </div>
                <button
                  type="button"
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
                  onClick={() => setTestState("idle")}
                >
                  Cancel
                </button>
              </div>
            )}

            {testState === "loading" && (
              <div className="flex flex-col items-center gap-1.5 py-2">
                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-xs text-muted-foreground">
                  Signing in as {testRole}…
                </p>
              </div>
            )}

            {/* ── Sign up link ────────────────────────────────── */}
            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="text-primary font-medium hover:underline underline-offset-4"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
