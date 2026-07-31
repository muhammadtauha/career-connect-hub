import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, Clock, MapPin, Users } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import type { ProjectWithCompany } from "@/lib/queries";

export function ProjectCard({
  project,
  bookmarked,
  onToggleBookmark,
  bookmarkPending,
}: {
  project: ProjectWithCompany;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  bookmarkPending?: boolean;
}) {
  return (
    <article className="panel group relative flex flex-col gap-4 p-5 transition-colors hover:border-primary/40">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            {project.company?.logo_url ? (
              <img
                src={project.company.logo_url}
                alt={`${project.company.name} logo`}
                className="size-5 shrink-0 rounded object-cover"
                loading="lazy"
              />
            ) : (
              <span className="grid size-5 shrink-0 place-items-center rounded bg-elevated text-[10px] font-semibold uppercase">
                {project.company?.name?.slice(0, 1) ?? "?"}
              </span>
            )}
            <span className="truncate">{project.company?.name ?? "Unknown company"}</span>
          </div>
          <h3 className="mt-2 truncate text-[15px] font-medium">
            <Link
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {project.title}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.summary}</p>
        </div>
        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <StatusBadge status={project.status} />
          {onToggleBookmark ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark project"}
              disabled={bookmarkPending}
              onClick={onToggleBookmark}
              className="size-8"
            >
              {bookmarked ? (
                <BookmarkCheck className="size-4 text-primary" />
              ) : (
                <Bookmark className="size-4" />
              )}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {project.skills.slice(0, 5).map((skill) => (
          <span
            key={skill}
            className="rounded-md border border-border bg-elevated px-2 py-0.5 text-xs text-muted-foreground"
          >
            {skill}
          </span>
        ))}
        {project.skills.length > 5 ? (
          <span className="text-xs text-muted-foreground">+{project.skills.length - 5}</span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" /> {project.duration_weeks} weeks
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" /> {project.openings} opening
          {project.openings === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" /> {project.is_remote ? "Remote" : "On-site"}
        </span>
        <span className="capitalize">{project.difficulty}</span>
      </div>
    </article>
  );
}
