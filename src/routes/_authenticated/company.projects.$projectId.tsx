import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Inbox } from "lucide-react";

import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_MILESTONES,
  companyEngagementsQuery,
  projectApplicationsQuery,
  projectQuery,
} from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/company/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Review applicants — CareerCollab" },
      {
        name: "description",
        content:
          "Shortlist, accept or decline student applications and open the milestone workspace for accepted collaborators.",
      },
      { property: "og:title", content: "Review applicants — CareerCollab" },
      { property: "og:description", content: "Manage applications for your project." },
    ],
  }),
  component: ManageProjectPage,
});

function ManageProjectPage() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const project = useQuery(projectQuery(projectId));
  const applications = useQuery(projectApplicationsQuery(projectId));
  const companyId = project.data?.company_id;
  const engagements = useQuery({
    ...companyEngagementsQuery(companyId ?? ""),
    enabled: Boolean(companyId),
  });

  const setProjectStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ status: status as "draft" | "open" | "paused" | "closed" | "completed" })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project status updated");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const decide = useMutation({
    mutationFn: async ({
      applicationId,
      studentId,
      status,
    }: {
      applicationId: string;
      studentId: string;
      status: "shortlisted" | "accepted" | "rejected";
    }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", applicationId);
      if (error) throw error;

      if (status !== "accepted") return;

      const { data: existing, error: existingError } = await supabase
        .from("engagements")
        .select("id")
        .eq("project_id", projectId)
        .eq("student_id", studentId)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing) return;

      const { data: engagement, error: engagementError } = await supabase
        .from("engagements")
        .insert({ project_id: projectId, student_id: studentId })
        .select("id")
        .single();
      if (engagementError) throw engagementError;

      const { error: milestonesError } = await supabase.from("milestones").insert(
        DEFAULT_MILESTONES.map((milestone, index) => ({
          engagement_id: engagement.id,
          title: milestone.title,
          description: milestone.description,
          order_index: index,
          status: index === 0 ? ("active" as const) : ("locked" as const),
        })),
      );
      if (milestonesError) throw milestonesError;
    },
    onSuccess: () => {
      toast.success("Application updated");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (project.isPending) return <ListSkeleton rows={2} />;
  if (project.isError) {
    return <ErrorState message={(project.error as Error).message} onRetry={project.refetch} />;
  }
  if (!project.data) return <ErrorState message="Project not found." />;

  const engagementByStudent = new Map(
    (engagements.data ?? [])
      .filter((e) => e.project_id === projectId)
      .map((e) => [e.student_id, e.id]),
  );

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/company">
          <ArrowLeft className="size-4" /> Back to workspace
        </Link>
      </Button>

      <PageHeader
        title={project.data.title}
        description={project.data.summary}
        actions={
          <Select
            value={project.data.status}
            onValueChange={(value) => setProjectStatus.mutate(value)}
          >
            <SelectTrigger className="w-40" aria-label="Project status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["draft", "open", "paused", "closed", "completed"].map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <section className="space-y-3">
        <h2 className="text-base font-medium">Applicants</h2>
        {applications.isPending ? (
          <ListSkeleton rows={3} />
        ) : applications.isError ? (
          <ErrorState
            message={(applications.error as Error).message}
            onRetry={applications.refetch}
          />
        ) : applications.data.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-5" />}
            title="No applications yet"
            description="Applications appear here as soon as students apply from the feed."
          />
        ) : (
          <ul className="space-y-3">
            {applications.data.map((application) => {
              const engagementId = engagementByStudent.get(application.student_id);
              return (
                <li key={application.id} className="panel p-5">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium">
                        {application.student?.full_name ?? "Student"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {application.student?.headline ??
                          application.student?.university ??
                          "No headline yet"}
                      </p>
                      {application.student?.skills?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {application.student.skills.slice(0, 8).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-md border border-border bg-elevated px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {application.cover_letter ? (
                        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                          {application.cover_letter}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <StatusBadge status={application.status} />
                      {application.status === "accepted" && engagementId ? (
                        <Button asChild size="sm" variant="outline">
                          <Link to="/workspace/$engagementId" params={{ engagementId }}>
                            Open workspace
                          </Link>
                        </Button>
                      ) : application.status === "pending" ||
                        application.status === "shortlisted" ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          {application.status === "pending" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={decide.isPending}
                              onClick={() =>
                                decide.mutate({
                                  applicationId: application.id,
                                  studentId: application.student_id,
                                  status: "shortlisted",
                                })
                              }
                            >
                              Shortlist
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={decide.isPending}
                            onClick={() =>
                              decide.mutate({
                                applicationId: application.id,
                                studentId: application.student_id,
                                status: "rejected",
                              })
                            }
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            disabled={decide.isPending}
                            onClick={() =>
                              decide.mutate({
                                applicationId: application.id,
                                studentId: application.student_id,
                                status: "accepted",
                              })
                            }
                          >
                            Accept
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
