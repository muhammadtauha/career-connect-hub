import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold sm:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel stagger-item relative flex flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <div className="halo pointer-events-none absolute inset-x-0 top-0 h-32 opacity-40" aria-hidden />
      {icon ? (
        <div className="relative mb-4 grid size-12 place-items-center rounded-xl border border-border bg-elevated text-primary shadow-[0_0_0_6px_color-mix(in_oklab,var(--primary)_7%,transparent)]">
          {icon}
        </div>
      ) : null}
      <h3 className="relative text-base font-semibold">{title}</h3>
      {description ? (
        <p className="relative mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground/85">
          {description}
        </p>
      ) : null}
      {action ? <div className="relative mt-5">{action}</div> : null}
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="panel animate-pulse space-y-3 p-5">
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted/70" />
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-muted/60" />
            <div className="h-5 w-20 rounded-full bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="panel border-destructive/30 px-6 py-12 text-center">
      <h3 className="text-base font-medium text-destructive">Couldn't load this</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {message ?? "Something went wrong while fetching data."}
      </p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex h-9 items-center rounded-md border border-input px-3 text-sm font-medium hover:bg-accent"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
