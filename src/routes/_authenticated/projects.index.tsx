import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { useState } from "react";

import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/project-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import {
  DIFFICULTIES,
  DURATION_BUCKETS,
  PROJECT_CATEGORIES,
  projectsFeedQuery,
} from "@/lib/queries";
import { useBookmarks } from "@/lib/use-bookmarks";

export const Route = createFileRoute("/_authenticated/projects/")({
  head: () => ({
    meta: [
      { title: "Project feed — CareerCollab" },
      {
        name: "description",
        content:
          "Browse real company projects open to university students. Filter by category, difficulty and skills, then apply in one step.",
      },
      { property: "og:title", content: "Project feed — CareerCollab" },
      {
        property: "og:description",
        content: "Discover live industry projects looking for student collaborators.",
      },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const { userId, role } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [skill, setSkill] = useState("");
  const [duration, setDuration] = useState("all");
  const [status, setStatus] = useState("all");

  const feed = useQuery(projectsFeedQuery({ search, category, difficulty, skill, duration, status }));
  const { bookmarkedIds, toggle } = useBookmarks(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project feed"
        description="Live problems published by companies. Apply to the ones that match your skills."
      />

      <div className="filter-bar grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search titles, summaries, categories…"
          maxLength={100}
          aria-label="Search projects"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {PROJECT_CATEGORIES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger aria-label="Filter by difficulty">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any difficulty</SelectItem>
            {DIFFICULTIES.map((item) => (
              <SelectItem key={item} value={item} className="capitalize">
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={skill}
          onChange={(event) => setSkill(event.target.value)}
          placeholder="Required skill (e.g. React)"
          maxLength={40}
          aria-label="Filter by required skill"
        />
        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger aria-label="Filter by duration">
            <SelectValue placeholder="Duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any duration</SelectItem>
            {DURATION_BUCKETS.map((bucket) => (
              <SelectItem key={bucket.value} value={bucket.value}>
                {bucket.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Open & running</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {feed.isPending ? (
        <ListSkeleton rows={4} />
      ) : feed.isError ? (
        <ErrorState message={(feed.error as Error).message} onRetry={feed.refetch} />
      ) : feed.data.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="No projects match those filters"
          description="Try a broader search term, or clear the category and difficulty filters."
        />
      ) : (
        <div className="grid gap-3">
          {feed.data.map((project, index) => (
            <div key={project.id} className="stagger-item" style={stagger(index)}>
            <ProjectCard
              project={project}
              bookmarked={bookmarkedIds.has(project.id)}
              bookmarkPending={toggle.isPending}
              onToggleBookmark={
                role === "student" ? () => toggle.mutate(project.id) : undefined
              }
            />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
