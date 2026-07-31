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
import { DIFFICULTIES, PROJECT_CATEGORIES, projectsFeedQuery } from "@/lib/queries";
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

  const feed = useQuery(projectsFeedQuery({ search, category, difficulty }));
  const { bookmarkedIds, toggle } = useBookmarks(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project feed"
        description="Live problems published by companies. Apply to the ones that match your skills."
      />

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search titles, summaries, categories…"
          maxLength={100}
          aria-label="Search projects"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-52" aria-label="Filter by category">
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
          <SelectTrigger className="sm:w-44" aria-label="Filter by difficulty">
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
          {feed.data.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              bookmarked={bookmarkedIds.has(project.id)}
              bookmarkPending={toggle.isPending}
              onToggleBookmark={
                role === "student" ? () => toggle.mutate(project.id) : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
