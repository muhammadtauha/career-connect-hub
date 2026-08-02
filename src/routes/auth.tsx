import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — CareerCollab" },
      {
        name: "description",
        content:
          "Sign in or create a CareerCollab account as a student or a company to publish, discover and deliver real industry projects.",
      },
      { property: "og:title", content: "Sign in — CareerCollab" },
      {
        property: "og:description",
        content: "Access your CareerCollab student or company workspace.",
      },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2, "Tell us your name").max(100),
  role: z.enum(["student", "company"]),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, initializing } = useAuth();
  const [tab, setTab] = useState(mode === "signup" ? "signup" : "signin");
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!initializing && user) navigate({ to: "/dashboard", replace: true });
  }, [user, initializing, navigate]);

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", role: "student" },
  });

  async function onSignIn(values: z.infer<typeof signInSchema>) {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Confirm your email address before signing in.");
      } else if (error.message.toLowerCase().includes("invalid login credentials")) {
        toast.error(
          "Invalid email or password. If you just signed up, make sure the account was confirmed.",
        );
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  }

  async function onSignUp(values: z.infer<typeof signUpSchema>) {
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: values.fullName, role: values.role },
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Check your email to confirm your account before signing in.");
      setTab("signin");
      return;
    }
    toast.success("Account created");
    navigate({ to: "/dashboard", replace: true });
  }

  async function onGoogle() {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setGoogleLoading(false);
      const isLocal = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
      toast.error(
        isLocal
          ? "Google sign-in is not available when running locally. Use email and password instead."
          : "Google sign-in failed. Please try again.",
      );
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }


  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="halo relative hidden flex-col justify-between border-r border-border p-10 lg:flex">
        <div className="grid-lines absolute inset-0 opacity-50" aria-hidden="true" />
        <Link to="/" className="relative">
          <Wordmark />
        </Link>
        <div className="relative max-w-sm">
          <h2 className="text-3xl leading-tight font-semibold">
            Real projects. Real reviewers. Real portfolios.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Students deliver industry work under company supervision. Companies get scoped delivery
            and a pipeline of graduates they have already worked with.
          </p>
        </div>
        <p className="relative text-xs text-muted-foreground">
          One account, one role, one workspace.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Link to="/">
              <Wordmark />
            </Link>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="mt-8 lg:mt-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" placeholder="you@university.edu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={signInForm.formState.isSubmitting}>
                    {signInForm.formState.isSubmitting ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I am joining as</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-2 gap-2"
                          >
                            {[
                              { value: "student", label: "Student" },
                              { value: "company", label: "Company" },
                            ].map((option) => (
                              <label
                                key={option.value}
                                className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2.5 text-sm has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/10"
                              >
                                <RadioGroupItem value={option.value} />
                                {option.label}
                              </label>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input autoComplete="name" placeholder="Ayesha Khan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={signUpForm.formState.isSubmitting}>
                    {signUpForm.formState.isSubmitting ? "Creating account…" : "Create account"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={onGoogle} disabled={googleLoading}>
            {googleLoading ? "Connecting…" : "Continue with Google"}
          </Button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Google sign-ups join as students. Companies should use the create-account form.
          </p>
        </div>
      </div>
    </div>
  );
}
