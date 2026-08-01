import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Globe, Mail, MapPin, Phone, Users } from "lucide-react";

import { ErrorState, ListSkeleton } from "@/components/page-header";
import { RatingSummaryBadge, ReviewList } from "@/components/rating";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { companyByIdQuery, companyPublicProjectsQuery } from "@/lib/directory";
import { companyReviewsQuery, summarise } from "@/lib/reviews";

export const Route = createFileRoute("/_authenticated/companies/$companyId")({
  head: () => ({
    meta: [
      { title: "Company profile — CareerCollab" },
      {
        name: "description",
        content:
          "A company's CareerCollab page: who they are, their open projects, hiring status and student ratings.",
      },
      { property: "og:title", content: "Company profile — CareerCollab" },
      { property: "og:description", content: "Open projects, hiring status and ratings." },
    ],
  }),
  component: CompanyPublicPage,
});

function CompanyPublicPage() {
  const { companyId } = Route.useParams();
  const company = useQuery(companyByIdQuery(companyId));
  const projects = useQuery(companyPublicProjectsQuery(companyId));
  const reviews = useQuery(companyReviewsQuery(companyId));

  if (company.isPending) return <ListSkeleton rows={3} />;
  if (company.isError) {
    return <ErrorState message={(company.error as Error).message} onRetry={company.refetch} />;
  }
  if (!company.data) return <ErrorState message="This company isn't available." />;

  const c = company.data;
  const summary = summarise(reviews.data);
  const all = projects.data ?? [];
  const active = all.filter((p) => p.status === "open" || p.status === "paused");
  const completed = all.filter((p) => p.status === "completed");

  return (
    <div className="space-y-6">
      <div className="panel overflow-hidden">
        <div
          className="h-28 w-full bg-elevated bg-cover bg-center sm:h-36"
          style={c.banner_url ? { backgroundImage: `url(${c.banner_url})` } : undefined}
        />
        <div className="flex flex-wrap items-end gap-4 p-5 pt-0">
          <Avatar className="-mt-8 size-20 rounded-xl border-4 border-background">
            <AvatarImage src={c.logo_url ?? undefined} alt="" />
            <AvatarFallback className="rounded-xl">
              <Building2 className="size-6" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
              {c.name}
              {c.verified ? (
                <span className="rounded-full border border-success/30 bg-success/12 px-2 py-0.5 text-[11px] font-medium text-success">
                  Verified
                </span>
              ) : null}
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  c.hiring
                    ? "border-primary/30 bg-primary/12 text-primary"
                    : "border-border bg-elevated text-muted-foreground"
                }`}
              >
                {c.hiring ? "Actively hiring" : "Not hiring"}
              </span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {c.industry ? <span>{c.industry}</span> : null}
              {c.company_size ? (
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3.5" /> {c.company_size}
                </span>
              ) : null}
              {c.founded_year ? <span>Founded {c.founded_year}</span> : null}
              {c.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {c.location}
                </span>
              ) : null}
            </div>
          </div>
          <RatingSummaryBadge summary={summary} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <section className="panel space-y-2 p-5">
            <h2 className="text-sm font-medium">About</h2>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {c.description || "No description yet."}
            </p>
          </section>

          <section className="panel space-y-3 p-5">
            <h2 className="text-sm font-medium">Projects ({all.length})</h2>
            {projects.isPending ? (
              <ListSkeleton rows={2} />
            ) : all.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published projects yet.</p>
            ) : (
              <ul className="space-y-2">
                {all.map((project) => (
                  <li key={project.id}>
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: project.id }}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{project.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {project.category} · {project.duration_weeks} weeks
                        </span>
                      </span>
                      <StatusBadge status={project.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel space-y-3 p-5">
            <h2 className="text-sm font-medium">Reviews ({summary.total})</h2>
            {reviews.isPending ? (
              <ListSkeleton rows={1} />
            ) : (
              <ReviewList reviews={reviews.data ?? []} />
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="panel space-y-3 p-5">
            <h2 className="text-sm font-medium">At a glance</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Active projects</dt>
                <dd className="font-mono">{active.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Completed projects</dt>
                <dd className="font-mono">{completed.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Average rating</dt>
                <dd className="font-mono">
                  {summary.total ? summary.average.toFixed(1) : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="panel space-y-2 p-5 text-sm">
            <h2 className="text-sm font-medium">Contact</h2>
            {c.website ? (
              <a
                href={c.website}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-2 text-primary underline underline-offset-4"
              >
                <Globe className="size-4" /> Website
              </a>
            ) : null}
            {c.contact_email ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4" /> {c.contact_email}
              </p>
            ) : null}
            {c.phone ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4" /> {c.phone}
              </p>
            ) : null}
            {!c.website && !c.contact_email && !c.phone ? (
              <p className="text-muted-foreground">No contact details shared.</p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
