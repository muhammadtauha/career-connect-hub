import { cn } from "@/lib/utils";

const TONES = {
  neutral: "border-border bg-elevated text-muted-foreground",
  info: "border-primary/30 bg-primary/12 text-primary",
  success: "border-success/30 bg-success/12 text-success",
  warning: "border-warning/30 bg-warning/12 text-warning",
  danger: "border-destructive/30 bg-destructive/12 text-destructive",
} as const;

type Tone = keyof typeof TONES;

const STATUS_TONES: Record<string, Tone> = {
  draft: "neutral",
  open: "success",
  paused: "warning",
  closed: "neutral",
  completed: "info",
  pending: "warning",
  shortlisted: "info",
  accepted: "success",
  rejected: "danger",
  withdrawn: "neutral",
  active: "info",
  cancelled: "neutral",
  locked: "neutral",
  submitted: "warning",
  changes_requested: "danger",
  approved: "success",
};

const STATUS_LABELS: Record<string, string> = {
  changes_requested: "Changes requested",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONES[status] ?? "neutral";
  const label = STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        TONES[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
