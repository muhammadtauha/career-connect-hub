import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ListSkeleton, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — CareerCollab" },
      {
        name: "description",
        content:
          "Keep your skills, university details and portfolio links current so companies can evaluate your applications.",
      },
      { property: "og:title", content: "Your profile — CareerCollab" },
      { property: "og:description", content: "Manage your CareerCollab profile and skills." },
    ],
  }),
  component: ProfilePage,
});

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((value) => value === "" || /^https?:\/\/\S+$/.test(value), "Enter a full URL (https://…)");

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  headline: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(1000).optional(),
  university: z.string().trim().max(120).optional(),
  degree: z.string().trim().max(120).optional(),
  graduation_year: z.string().trim().max(4).optional(),
  location: z.string().trim().max(120).optional(),
  skills: z.string().trim().max(400).optional(),
  github_url: optionalUrl.optional(),
  linkedin_url: optionalUrl.optional(),
  portfolio_url: optionalUrl.optional(),
});

function ProfilePage() {
  const { userId, profile, role } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    initialData: profile ?? undefined,
  });

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      headline: "",
      bio: "",
      university: "",
      degree: "",
      graduation_year: "",
      location: "",
      skills: "",
      github_url: "",
      linkedin_url: "",
      portfolio_url: "",
    },
  });

  const { reset } = form;
  const data = query.data;

  useEffect(() => {
    if (!data) return;
    reset({
      full_name: data.full_name ?? "",
      headline: data.headline ?? "",
      bio: data.bio ?? "",
      university: data.university ?? "",
      degree: data.degree ?? "",
      graduation_year: data.graduation_year ? String(data.graduation_year) : "",
      location: data.location ?? "",
      skills: (data.skills ?? []).join(", "),
      github_url: data.github_url ?? "",
      linkedin_url: data.linkedin_url ?? "",
      portfolio_url: data.portfolio_url ?? "",
    });
  }, [data, reset]);

  const save = useMutation({
    mutationFn: async (values: z.infer<typeof profileSchema>) => {
      const year = values.graduation_year ? Number(values.graduation_year) : null;
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name,
          headline: values.headline || null,
          bio: values.bio || null,
          university: values.university || null,
          degree: values.degree || null,
          graduation_year: Number.isFinite(year) ? year : null,
          location: values.location || null,
          skills: (values.skills ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 25),
          github_url: values.github_url || null,
          linkedin_url: values.linkedin_url || null,
          portfolio_url: values.portfolio_url || null,
        })
        .eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (query.isPending) return <ListSkeleton rows={3} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your profile"
        description={
          role === "company"
            ? "This is the personal profile attached to your company account."
            : "Companies read this profile alongside every application you send."
        }
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => save.mutate(values))}
          className="space-y-4"
        >
          <div className="panel space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field control={form.control} name="full_name" label="Full name" />
              <Field
                control={form.control}
                name="headline"
                label="Headline"
                placeholder="Final-year CS student · backend"
              />
            </div>
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About</FormLabel>
                  <FormControl>
                    <Textarea rows={5} maxLength={1000} {...field} />
                  </FormControl>
                  <FormDescription>
                    What you build, what you're learning, and the kind of project you want next.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills</FormLabel>
                  <FormControl>
                    <Input placeholder="React, TypeScript, Postgres" maxLength={400} {...field} />
                  </FormControl>
                  <FormDescription>Comma separated, up to 25 skills.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="panel space-y-4 p-6">
            <h2 className="text-sm font-medium">Education & links</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field control={form.control} name="university" label="University" />
              <Field control={form.control} name="degree" label="Degree" />
              <Field
                control={form.control}
                name="graduation_year"
                label="Graduation year"
                placeholder="2027"
              />
              <Field control={form.control} name="location" label="Location" />
              <Field control={form.control} name="github_url" label="GitHub" placeholder="https://" />
              <Field
                control={form.control}
                name="linkedin_url"
                label="LinkedIn"
                placeholder="https://"
              />
              <Field
                control={form.control}
                name="portfolio_url"
                label="Portfolio"
                placeholder="https://"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

type FieldProps = {
  control: ReturnType<typeof useForm<z.infer<typeof profileSchema>>>["control"];
  name: keyof z.infer<typeof profileSchema>;
  label: string;
  placeholder?: string;
};

function Field({ control, name, label, placeholder }: FieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
