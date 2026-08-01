import { Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { RatingSummary, ReviewWithReviewer } from "@/lib/reviews";
import { formatDate } from "@/lib/time";

export function Stars({
  value,
  size = 14,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i <= Math.round(value) ? "fill-warning text-warning" : "text-muted-foreground/40"
          }
        />
      ))}
    </span>
  );
}

export function RatingSummaryBadge({
  summary,
  className,
}: {
  summary: RatingSummary;
  className?: string;
}) {
  if (summary.total === 0) {
    return <span className={cn("text-xs text-muted-foreground", className)}>No reviews yet</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
      <Stars value={summary.average} />
      <span className="font-mono">{summary.average.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">
        ({summary.total} review{summary.total === 1 ? "" : "s"})
      </span>
    </span>
  );
}

export function StarInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i === 1 ? "" : "s"}`}
          disabled={disabled}
          onClick={() => onChange(i)}
          className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
        >
          <Star
            className={cn(
              "size-6",
              i <= value ? "fill-warning text-warning" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewList({ reviews }: { reviews: ReviewWithReviewer[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">No reviews yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li key={review.id} className="panel p-4">
          <div className="flex items-start gap-3">
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={review.reviewer?.avatar_url ?? undefined} alt="" />
              <AvatarFallback className="text-[11px]">
                {(review.reviewer?.full_name || "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium">
                  {review.reviewer?.full_name || "Member"}
                </p>
                <Stars value={review.rating} size={12} />
                <span className="text-xs text-muted-foreground">
                  {formatDate(review.created_at)}
                </span>
              </div>
              {review.comment ? (
                <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">
                  {review.comment}
                </p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
