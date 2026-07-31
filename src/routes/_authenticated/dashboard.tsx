import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bookmark,
  Briefcase,
  CheckCircle2,
  FolderKanban,
  Inbox,
  SendHorizonal,
  Users,
} from "lucide-react";

import { StatCard } from "@/components/app-shell";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  companyEngagementsQuery,
  companyProjectsQuery,
  myApplicationsQuery,
  myBookmarksQuery,
  myCompanyQuery,
  myEngagementsQuery,
  projectApplicationsQuery,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CareerCollab" },
      {
        name: "description",
        content:
          "Your CareerCollab dashboard: active collaborations, application status, milestone progress and open projects.",
      },
      { property: "og:title", content: "Dashboard — CareerCollab" },
      { property: "og:description", content: "Track your CareerCollab collaborations." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { role, profile, isLoadingIdentity } = useAuth();

  if (isLoadingIdentity) return <ListSkeleton rows={3} />;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        description={
          role === "company"
            ? "Your published projects, incoming applications and running collaborations."
            : "Your applications, active collaborations and saved projects."
        }
      />
      {role === "company" ? <CompanyDashboard /> : <StudentDashboard />}
    </div>
  );
}

function StudentDashboard() {
  const { userId } = useAuth();
  const applications = useQuery(myApplicationsQuery(userId!));
  const engagements = useQuery(myEngagementsQuery(userId!));
  const bookmarks = useQuery(myBookmarksQuery(userId!));

  if (applications.isError) {
    return <ErrorState message={(applications.error as Error).message} onRetry={applications.refetch} />;
  }

  const pending = (applications.data ?? []).filter((a) => a.status === "pending").length;
  const accepted = (applications.data ?? []).filter((a) => a.status === "accepted").length;

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications" value={applications.data?.length ?? 0} icon={SendHorizonal} />
        <StatCard label="Awaiting review" value={pending} icon={Inbox} />
        <StatCard label="Accepted" value={accepted} icon={CheckCircle2} />
        <StatCard label="Bookmarked" value={bookmarks.data?.length ?? 0} icon={Bookmark} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Active collaborations</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/projects">Find projects</Link>
          </Button>
        </div>
        {engagements.isPending ? (
          <ListSkeleton rows={2} />
        ) : (engagements.data ?? []).length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="size-5" />}
            title="No collaboration yet"
            description="Once a company accepts your application, a private workspace with milestones opens here."
            action={
              <Button asChild>
                <Link to="/projects">Browse the project feed</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {engagements.data!.map((engagement) => (
              <li key={engagement.id} className="panel p-5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium">
                      {engagement.project?.title ?? "Project"}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {engagement.project?.company?.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={engagement.status} />
                    <Button asChild size="sm" variant="outline">
                      <Link to="/workspace/$engagementId" params={{ engagementId: engagement.id }}>
                        Open workspace
                      </Link>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Recent applications</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/applications">View all</Link>
          </Button>
        </div>
        {applications.isPending ? (
          <ListSkeleton rows={2} />
        ) : (applications.data ?? []).length === 0 ? (
          <EmptyState
            icon={<SendHorizonal className="size-5" />}
            title="You haven't applied yet"
            description="Applications you send to company projects will be tracked here with their status."
          />
        ) : (
          <ul className="space-y-3">
            {applications.data!.slice(0, 4).map((application) => (
              <li key={application.id} className="panel flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{application.project?.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {application.project?.company?.name}
                  </p>
                </div>
                <StatusBadge status={application.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CompanyDashboard() {
  const { userId } = useAuth();
  const company = useQuery(myCompanyQuery(userId!));
  const companyId = company.data?.id;

  const projects = useQuery({
    ...companyProjectsQuery(companyId ?? ""),
    enabled: Boolean(companyId),
  });
  const engagements = useQuery({
    ...companyEngagementsQuery(companyId ?? ""),
    enabled: Boolean(companyId),
  });

  const applicationQueries = useQuery({
    queryKey: ["applications", "company-count", companyId],
    enabled: Boolean(companyId) && Boolean(projects.data),
    queryFn: async () => {
      const results = await Promise.all(
        (projects.data ?? []).map(async (project) => {
          const { queryFn } = projectApplicationsQuery(project.id);
          const rows = await (queryFn as () => Promise<{ status: string }[]>)();
          return rows;
        }),
      );
      const flat = results.flat();
      return {
        total: flat.length,
        pending: flat.filter((a) => a.status === "pending").length,
      };
    },
  });

  if (company.isPending) return <ListSkeleton rows={2} />;

  if (!company.data) {
    return (
      <EmptyState
        icon={<Briefcase className="size-5" />}
        title="Set up your company profile"
        description="Create your company page before publishing projects. Students see this page on every project you post."
        action={
          <Button asChild>
            <Link to="/company">Create company profile</Link>
          </Button>
        }
      />
    );
  }

  const openProjects = (projects.data ?? []).filter((p) => p.status === "open").length;

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Projects" value={projects.data?.length ?? 0} icon={FolderKanban} />
        <StatCard label="Open now" value={openProjects} icon={Briefcase} />
        <StatCard
          label="Applications"
          value={applicationQueries.data?.total ?? 0}
          hint={`${applicationQueries.data?.pending ?? 0} awaiting review`}
          icon={Inbox}
        />
        <StatCard label="Active students" value={engagements.data?.length ?? 0} icon={Users} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Your projects</h2>
          <Button asChild size="sm">
            <Link to="/company">Manage projects</Link>
          </Button>
        </div>
        {projects.isPending ? (
          <ListSkeleton rows={2} />
        ) : (projects.data ?? []).length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="size-5" />}
            title="No projects published"
            description="Publish a real business problem and students can start applying immediately."
            action={
              <Button asChild>
                <Link to="/company">Create a project</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {projects.data!.slice(0, 5).map((project) => (
              <li key={project.id} className="panel flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{project.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {project.category} · {project.duration_weeks} weeks
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={project.status} />
                  <Button asChild size="sm" variant="outline">
                    <Link
                      to="/company/projects/$projectId"
                      params={{ projectId: project.id }}
                    >
                      Review
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
