import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  Briefcase,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { RatingSummaryBadge, ReviewList } from "@/components/rating";
import { ErrorState, ListSkeleton } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AVAILABILITY_LABELS, studentProfileQuery } from "@/lib/directory";
import { studentReviewsQuery, summarise } from "@/lib/reviews";

export const Route = createFileRoute("/_authenticated/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student profile — CareerCollab" },
      {
        name: "description",
        content:
          "A student's CareerCollab profile: skills, education, experience, portfolio projects and collaboration ratings.",
      },
      { property: "og:title", content: "Student profile — CareerCollab" },
      { property: "og:description", content: "Skills, experience and ratings at a glance." },
    ],
  }),
  component: StudentProfilePage,
});

type Entry = Record<string, string | undefined>;

function asEntries(value: unknown): Entry[] {
  return Array.isArray(value) ? (value as Entry[]) : [];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel space-y-3 p-5">
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Not provided.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-border bg-elevated px-2.5 py-0.5 text-xs text-muted-foreground"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function StudentProfilePage() {
  const { studentId } = Route.useParams();
  const profile = useQuery(studentProfileQuery(studentId));
  const reviews = useQuery(studentReviewsQuery(studentId));

  if (profile.isPending) return <ListSkeleton rows={3} />;
  if (profile.isError) {
    return <ErrorState message={(profile.error as Error).message} onRetry={profile.refetch} />;
  }
  if (!profile.data) return <ErrorState message="This profile isn't available." />;

  const p = profile.data;
  const summary = summarise(reviews.data);
  const experience = asEntries(p.experience);
  const certifications = asEntries(p.certifications);
  const portfolio = asEntries(p.portfolio);

  return (
    <div className="space-y-6">
      <div className="panel overflow-hidden">
        <div
          className="h-28 w-full bg-elevated bg-cover bg-center sm:h-36"
          style={p.cover_url ? { backgroundImage: `url(${p.cover_url})` } : undefined}
        />
        <div className="flex flex-wrap items-end gap-4 p-5 pt-0">
          <Avatar className="-mt-8 size-20 border-4 border-background">
            <AvatarImage src={p.avatar_url ?? undefined} alt="" />
            <AvatarFallback>{(p.full_name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold">{p.full_name || "Student"}</h1>
            <p className="truncate text-sm text-muted-foreground">{p.headline || "Student"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {p.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {p.location}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <Briefcase className="size-3.5" />{" "}
                {AVAILABILITY_LABELS[p.availability] ?? p.availability}
              </span>
              {p.verified ? <span className="text-success">Verified</span> : null}
            </div>
          </div>
          <RatingSummaryBadge summary={summary} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Section title="About">
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {p.bio || "No summary yet."}
            </p>
          </Section>

          <Section title="Experience">
            {experience.length === 0 ? (
              <p className="text-sm text-muted-foreground">No experience added.</p>
            ) : (
              <ul className="space-y-3">
                {experience.map((item, i) => (
                  <li key={i} className="border-l border-border pl-3">
                    <p className="text-sm font-medium">{item.role ?? "Role"}</p>
                    <p className="text-xs text-muted-foreground">
                      {[item.org, item.period].filter(Boolean).join(" · ")}
                    </p>
                    {item.summary ? (
                      <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Portfolio projects">
            {portfolio.length === 0 ? (
              <p className="text-sm text-muted-foreground">No portfolio projects added.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {portfolio.map((item, i) => (
                  <li key={i} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">{item.title ?? "Project"}</p>
                    {item.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                    ) : null}
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-2 inline-block text-xs text-primary underline underline-offset-4"
                      >
                        Open project
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={`Reviews (${summary.total})`}>
            {reviews.isPending ? (
              <ListSkeleton rows={1} />
            ) : (
              <ReviewList reviews={reviews.data ?? []} />
            )}
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Education">
            <dl className="space-y-2 text-sm">
              {[
                ["University", p.university],
                ["Department", p.department],
                ["Degree", p.degree],
                ["Semester", p.semester ? String(p.semester) : null],
                ["Graduation", p.graduation_year ? String(p.graduation_year) : null],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="truncate text-right">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="Technical skills">
            <Chips items={p.skills ?? []} />
          </Section>
          <Section title="Soft skills">
            <Chips items={p.soft_skills ?? []} />
          </Section>
          <Section title="Languages">
            <Chips items={p.languages ?? []} />
          </Section>

          <Section title="Certifications">
            {certifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">None added.</p>
            ) : (
              <ul className="space-y-2">
                {certifications.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Award className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      {item.name ?? "Certificate"}
                      <span className="block text-xs text-muted-foreground">
                        {[item.issuer, item.year].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Links & contact">
            <div className="space-y-2 text-sm">
              {[
                { icon: Github, label: "GitHub", href: p.github_url },
                { icon: Linkedin, label: "LinkedIn", href: p.linkedin_url },
                { icon: Globe, label: "Website", href: p.portfolio_url },
                { icon: GraduationCap, label: "Resume", href: p.cv_url },
              ]
                .filter((l) => l.href)
                .map((l) => (
                  <a
                    key={l.label}
                    href={l.href!}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-2 text-primary underline underline-offset-4"
                  >
                    <l.icon className="size-4" /> {l.label}
                  </a>
                ))}
              {p.contact_email ? (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4" /> {p.contact_email}
                </p>
              ) : null}
              {p.phone ? (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4" /> {p.phone}
                </p>
              ) : null}
              {!p.github_url && !p.linkedin_url && !p.portfolio_url && !p.cv_url && !p.contact_email ? (
                <p className="text-sm text-muted-foreground">No contact details shared.</p>
              ) : null}
            </div>
          </Section>

          {p.cv_url ? (
            <Button asChild variant="outline" className="w-full">
              <a href={p.cv_url} target="_blank" rel="noreferrer noopener">
                Download resume
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
