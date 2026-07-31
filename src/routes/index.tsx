import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GitBranch, ListChecks, ShieldCheck, Sparkles } from "lucide-react";

import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareerCollab — Real company projects for university students" },
      {
        name: "description",
        content:
          "CareerCollab connects companies with university students through real business projects: apply, collaborate in a private workspace, ship milestones, and build a verified portfolio.",
      },
      { property: "og:title", content: "CareerCollab — Real company projects for students" },
      {
        property: "og:description",
        content:
          "Replace throwaway final year projects with real industry work. Companies publish problems, students apply, both ship milestones together.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    icon: Sparkles,
    title: "Companies publish real problems",
    body: "Scope, required skills, duration and openings — posted as a live project instead of a job ad.",
  },
  {
    icon: GitBranch,
    title: "Students apply and get matched",
    body: "One profile, one application. Companies shortlist, review, and accept the right student.",
  },
  {
    icon: ListChecks,
    title: "Work ships through milestones",
    body: "Accepting a student opens a private workspace with a milestone plan, submissions and feedback.",
  },
  {
    icon: ShieldCheck,
    title: "Portfolios become evidence",
    body: "Approved milestones and completed engagements form a track record a recruiter can trust.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Wordmark />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth" search={{ mode: "signup" }}>
              Get started
            </Link>
          </Button>
        </div>
      </header>

      <section className="halo relative overflow-hidden border-b border-border">
        <div className="grid-lines absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated px-3 py-1 text-xs text-muted-foreground">
            Industry collaboration, not another job board
          </span>
          <h1 className="text-balance-tight mt-6 text-4xl leading-[1.05] font-semibold sm:text-6xl">
            Final year projects that companies actually asked for
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            CareerCollab turns real business problems into supervised student projects — with
            applications, private workspaces, milestone reviews and portfolio-grade proof of work.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>
                Create your account <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">I already have one</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-2xl font-semibold">How a collaboration runs</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          The same lifecycle for every project, so students always know what happens next and
          companies always know what they are getting.
        </p>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <li key={step.title} className="panel p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg border border-border bg-elevated text-primary">
                  <step.icon className="size-4" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-base font-medium">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Wordmark className="text-foreground" />
          <p>Built for universities, companies and the students between them.</p>
        </div>
      </footer>
    </div>
  );
}
