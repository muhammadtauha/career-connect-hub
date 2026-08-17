import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SendHorizonal } from "lucide-react";

import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { myApplicationsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [
      { title: "My applications — CareerCollab" },
      {
        name: "description",
        content:
          "Track every project application you've sent, from pending review to shortlisted and accepted.",
      },
      { property: "og:title", content: "My applications — CareerCollab" },
      { property: "og:description", content: "Follow the status of your project applications." },
    ],
  }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const { userId } = useAuth();
  const applications = useQuery(myApplicationsQuery(userId!));

  return (
    <div className="space-y-6">
      <PageHeader
        title="My applications"
        description="Every application you've sent, with its current status."
      />
      {applications.isPending ? (
        <ListSkeleton rows={3} />
      ) : applications.isError ? (
        <ErrorState
          message={(applications.error as Error).message}
          onRetry={applications.refetch}
        />
      ) : applications.data.length === 0 ? (
        <EmptyState
          icon={<SendHorizonal className="size-5" />}
          title="No applications yet"
          description="Browse the feed and apply to a project that matches your skills."
          action={
            <Button asChild>
              <Link to="/projects">Browse projects</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {applications.data.map((application) => (
            <li key={application.id} className="panel card-interactive p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">
                    {application.project?.title ?? "Project"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {application.project?.company?.name} · applied{" "}
                    {new Date(application.created_at).toLocaleDateString()}
                  </p>
                  {application.cover_letter ? (
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {application.cover_letter}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusBadge status={application.status} />
                  {application.project_id ? (
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: application.project_id }}
                      >
                        View project
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
