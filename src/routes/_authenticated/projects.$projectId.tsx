import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ErrorState, ListSkeleton } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { projectQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project details — CareerCollab" },
      {
        name: "description",
        content:
          "Full brief, required skills, timeline and application form for a company project on CareerCollab.",
      },
      { property: "og:title", content: "Project details — CareerCollab" },
      { property: "og:description", content: "Review the brief and apply to this project." },
    ],
  }),
  component: ProjectDetailPage,
});

const applySchema = z.object({
  coverLetter: z
    .string()
    .trim()
    .min(40, "Write at least 40 characters so the company can assess you")
    .max(2000, "Keep it under 2000 characters"),
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const { userId, role } = useAuth();
  const project = useQuery(projectQuery(projectId));
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const application = useQuery({
    queryKey: ["applications", projectId, userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("project_id", projectId)
        .eq("student_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<z.infer<typeof applySchema>>({
    resolver: zodResolver(applySchema),
    defaultValues: { coverLetter: "" },
  });

  const apply = useMutation({
    mutationFn: async (values: z.infer<typeof applySchema>) => {
      const { error } = await supabase.from("applications").insert({
        project_id: projectId,
        student_id: userId!,
        cover_letter: values.coverLetter,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application sent");
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const withdraw = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("applications")
        .update({ status: "withdrawn" })
        .eq("id", application.data!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application withdrawn");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (project.isPending) return <ListSkeleton rows={2} />;
  if (project.isError) {
    return <ErrorState message={(project.error as Error).message} onRetry={project.refetch} />;
  }
  if (!project.data) {
    return <ErrorState message="This project no longer exists or was unpublished." />;
  }

  const data = project.data;
  const existing = application.data;
  const canApply = role === "student" && data.status === "open" && !existing;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/projects">
          <ArrowLeft className="size-4" /> Back to feed
        </Link>
      </Button>

      <div className="panel p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="size-4 shrink-0" />
              <span className="truncate">{data.company?.name ?? "Unknown company"}</span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold">{data.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{data.summary}</p>
          </div>
          <StatusBadge status={data.status} />
        </div>

        <dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-4">
          <Meta icon={Clock} label="Duration" value={`${data.duration_weeks} weeks`} />
          <Meta icon={Users} label="Openings" value={String(data.openings)} />
          <Meta icon={MapPin} label="Mode" value={data.is_remote ? "Remote" : "On-site"} />
          <Meta
            icon={CalendarDays}
            label="Apply by"
            value={data.deadline ? new Date(data.deadline).toLocaleDateString() : "Rolling"}
          />
        </dl>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="panel p-6">
          <h2 className="text-base font-medium">The brief</h2>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {data.description || "The company has not added a detailed brief yet."}
          </p>
        </section>

        <aside className="space-y-4">
          <div className="panel p-5">
            <h2 className="text-sm font-medium">Required skills</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {data.skills.length === 0 ? (
                <span className="text-sm text-muted-foreground">Open to all skill sets</span>
              ) : (
                data.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-border bg-elevated px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))
              )}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Category: {data.category} · Level: {data.difficulty}
            </p>
          </div>

          <div className="panel p-5">
            {existing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Your application</span>
                  <StatusBadge status={existing.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Sent {new Date(existing.created_at).toLocaleDateString()}
                </p>
                {existing.status === "pending" || existing.status === "shortlisted" ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={withdraw.isPending}
                    onClick={() => withdraw.mutate()}
                  >
                    {withdraw.isPending ? "Withdrawing…" : "Withdraw application"}
                  </Button>
                ) : null}
              </div>
            ) : canApply ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">Apply to this project</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Apply to {data.title}</DialogTitle>
                    <DialogDescription>
                      Explain why you're a fit. The company sees this alongside your profile.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      id="apply-form"
                      onSubmit={form.handleSubmit((values) => apply.mutate(values))}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="coverLetter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cover letter</FormLabel>
                            <FormControl>
                              <Textarea rows={8} maxLength={2000} {...field} />
                            </FormControl>
                            <FormDescription>
                              Relevant experience, how you'd approach the problem, and your
                              availability.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" form="apply-form" disabled={apply.isPending}>
                      {apply.isPending ? "Sending…" : "Send application"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <p className="text-sm text-muted-foreground">
                {role === "company"
                  ? "You're viewing this as a company account."
                  : "This project isn't accepting applications right now."}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}
