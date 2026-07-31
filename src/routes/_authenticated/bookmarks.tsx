import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";

import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { myBookmarksQuery } from "@/lib/queries";
import { useBookmarks } from "@/lib/use-bookmarks";

export const Route = createFileRoute("/_authenticated/bookmarks")({
  head: () => ({
    meta: [
      { title: "Saved projects — CareerCollab" },
      {
        name: "description",
        content: "Projects you bookmarked for later, kept in one shortlist you can act on anytime.",
      },
      { property: "og:title", content: "Saved projects — CareerCollab" },
      { property: "og:description", content: "Your shortlist of bookmarked company projects." },
    ],
  }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const { userId } = useAuth();
  const bookmarks = useQuery(myBookmarksQuery(userId!));
  const { toggle } = useBookmarks(userId);

  return (
    <div className="space-y-6">
      <PageHeader title="Saved projects" description="Your shortlist, ready when you are." />
      {bookmarks.isPending ? (
        <ListSkeleton rows={3} />
      ) : bookmarks.isError ? (
        <ErrorState message={(bookmarks.error as Error).message} onRetry={bookmarks.refetch} />
      ) : bookmarks.data.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="size-5" />}
          title="Nothing saved yet"
          description="Tap the bookmark icon on any project in the feed to keep it here."
          action={
            <Button asChild>
              <Link to="/projects">Browse projects</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {bookmarks.data.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              bookmarked
              bookmarkPending={toggle.isPending}
              onToggleBookmark={() => toggle.mutate(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
