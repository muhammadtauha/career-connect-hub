import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ErrorState, ListSkeleton, PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { engagementQuery, milestonesQuery, type Milestone } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/workspace/$engagementId")({
  head: () => ({
    meta: [
      { title: "Collaboration workspace — CareerCollab" },
      {
        name: "description",
        content:
          "A shared milestone timeline where students submit work and companies approve or request changes.",
      },
      { property: "og:title", content: "Collaboration workspace — CareerCollab" },
      { property: "og:description", content: "Track milestones from discovery to handover." },
    ],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const { engagementId } = Route.useParams();
  const { role } = useAuth();
  const engagement = useQuery(engagementQuery(engagementId));
  const milestones = useQuery(milestonesQuery(engagementId));

  if (engagement.isPending || milestones.isPending) return <ListSkeleton rows={3} />;
  if (engagement.isError) {
    return <ErrorState message={(engagement.error as Error).message} onRetry={engagement.refetch} />;
  }
  if (!engagement.data) return <ErrorState message="This collaboration isn't available." />;

  const approved = (milestones.data ?? []).filter((m) => m.status === "approved").length;
  const total = milestones.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={engagement.data.project?.title ?? "Collaboration"}
        description={`${engagement.data.project?.company?.name ?? "Company"} · ${
          engagement.data.student?.full_name ?? "Student"
        }`}
        actions={<StatusBadge status={engagement.data.status} />}
      />

      <div className="panel p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">
            {approved} of {total} milestones approved
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${total ? (approved / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      <ol className="space-y-3">
        {(milestones.data ?? []).map((milestone, index) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            index={index}
            isCompany={role === "company"}
            engagementId={engagementId}
            nextId={milestones.data?.[index + 1]?.id ?? null}
          />
        ))}
      </ol>
    </div>
  );
}

function MilestoneCard({
  milestone,
  index,
  isCompany,
  engagementId,
  nextId,
}: {
  milestone: Milestone;
  index: number;
  isCompany: boolean;
  engagementId: string;
  nextId: string | null;
}) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState(milestone.submission_url ?? "");
  const [note, setNote] = useState(milestone.submission_note ?? "");
  const [feedback, setFeedback] = useState(milestone.feedback ?? "");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["milestones", engagementId] });
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!/^https?:\/\/\S+$/.test(url.trim())) throw new Error("Add a valid submission link");
      const { error } = await supabase
        .from("milestones")
        .update({
          submission_url: url.trim(),
          submission_note: note.trim().slice(0, 1000) || null,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", milestone.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Milestone submitted for review");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const review = useMutation({
    mutationFn: async (decision: "approved" | "changes_requested") => {
      const { error } = await supabase
        .from("milestones")
        .update({
          status: decision,
          feedback: feedback.trim().slice(0, 1000) || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", milestone.id);
      if (error) throw error;

      if (decision === "approved" && nextId) {
        const { error: nextError } = await supabase
          .from("milestones")
          .update({ status: "active" })
          .eq("id", nextId)
          .eq("status", "locked");
        if (nextError) throw nextError;
      }
    },
    onSuccess: () => {
      toast.success("Review saved");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const locked = milestone.status === "locked";

  return (
    <li className="panel p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Milestone {index + 1}</p>
          <p className="mt-1 text-[15px] font-medium">{milestone.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{milestone.description}</p>
        </div>
        <StatusBadge status={milestone.status} />
      </div>

      {locked ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4" /> Unlocks when the previous milestone is approved.
        </p>
      ) : milestone.status === "approved" ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4" /> Approved
          {milestone.feedback ? ` — ${milestone.feedback}` : ""}
        </p>
      ) : isCompany ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {milestone.submission_url ? (
            <div className="text-sm">
              <a
                href={milestone.submission_url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary underline underline-offset-4"
              >
                View submission
              </a>
              {milestone.submission_note ? (
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                  {milestone.submission_note}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Waiting on the student's submission.</p>
          )}
          {milestone.status === "submitted" ? (
            <>
              <Textarea
                rows={3}
                maxLength={1000}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Feedback for the student"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={review.isPending}
                  onClick={() => review.mutate("changes_requested")}
                >
                  Request changes
                </Button>
                <Button size="sm" disabled={review.isPending} onClick={() => review.mutate("approved")}>
                  Approve
                </Button>
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {milestone.feedback ? (
            <p className="text-sm text-muted-foreground">Feedback: {milestone.feedback}</p>
          ) : null}
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://link-to-your-deliverable"
            maxLength={300}
            aria-label="Submission link"
          />
          <Textarea
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What you delivered, decisions taken, open questions"
          />
          <div className="flex justify-end">
            <Button size="sm" disabled={submit.isPending} onClick={() => submit.mutate()}>
              {submit.isPending
                ? "Submitting…"
                : milestone.status === "submitted"
                  ? "Resubmit"
                  : "Submit for review"}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
