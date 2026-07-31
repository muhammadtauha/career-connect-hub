import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="grid size-7 shrink-0 place-items-center rounded-[7px] bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="none">
          <path
            d="M5 15.5 9.2 6l3.1 7 2-3.2L19 15.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">CareerCollab</span>
    </span>
  );
}
