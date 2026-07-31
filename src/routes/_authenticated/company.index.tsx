import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderKanban, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState, ListSkeleton, PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { companyProjectsQuery, DIFFICULTIES, myCompanyQuery, PROJECT_CATEGORIES } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/company/")({
  head: () => ({
    meta: [
      { title: "Company workspace — CareerCollab" },
      {
        name: "description",
        content:
          "Publish real projects, manage your company profile and review student applications in one workspace.",
      },
      { property: "og:title", content: "Company workspace — CareerCollab" },
      {
        property: "og:description",
        content: "Publish projects and review student applicants.",
      },
    ],
  }),
  component: CompanyPage,
});

const companySchema = z.object({
  name: z.string().trim().min(2, "Enter your company name").max(120),
  industry: z.string().trim().max(80).optional(),
  location: z.string().trim().max(120).optional(),
  company_size: z.string().trim().max(40).optional(),
  website: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\/\S+$/.test(v), "Enter a full URL (https://…)")
    .optional(),
  description: z.string().trim().max(1000).optional(),
});

const projectSchema = z.object({
  title: z.string().trim().min(6, "Give the project a clear title").max(120),
  summary: z.string().trim().min(20, "Add a one-line summary").max(240),
  description: z.string().trim().min(60, "Describe the problem in detail").max(4000),
  category: z.string().min(1),
  difficulty: z.string().min(1),
  duration_weeks: z.coerce.number().int().min(1).max(52),
  openings: z.coerce.number().int().min(1).max(20),
  is_remote: z.boolean(),
  skills: z.string().trim().max(300).optional(),
  deadline: z.string().trim().optional(),
});

function CompanyPage() {
  const { userId } = useAuth();
  const company = useQuery(myCompanyQuery(userId!));
  const companyId = company.data?.id;
  const projects = useQuery({
    ...companyProjectsQuery(companyId ?? ""),
    enabled: Boolean(companyId),
  });

  if (company.isPending) return <ListSkeleton rows={3} />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Company workspace"
        description="Your public company page and the projects students can apply to."
        actions={companyId ? <NewProjectDialog companyId={companyId} /> : undefined}
      />

      <CompanyProfileForm />

      {companyId ? (
        <section className="space-y-3">
          <h2 className="text-base font-medium">Projects</h2>
          {projects.isPending ? (
            <ListSkeleton rows={2} />
          ) : (projects.data ?? []).length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="size-5" />}
              title="No projects yet"
              description="Publish a scoped, real business problem. Students apply, you shortlist, and a milestone workspace opens on acceptance."
              action={<NewProjectDialog companyId={companyId} />}
            />
          ) : (
            <ul className="space-y-3">
              {projects.data!.map((project) => (
                <li key={project.id} className="panel p-5">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium">{project.title}</p>
                      <p className="truncate text-sm text-muted-foreground">{project.summary}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {project.category} · {project.difficulty} · {project.duration_weeks} weeks ·{" "}
                        {project.openings} opening{project.openings > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={project.status} />
                      <Button asChild size="sm" variant="outline">
                        <Link to="/company/projects/$projectId" params={{ projectId: project.id }}>
                          Manage
                        </Link>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

function CompanyProfileForm() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const company = useQuery(myCompanyQuery(userId!));

  const form = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      industry: "",
      location: "",
      company_size: "",
      website: "",
      description: "",
    },
  });

  const { reset } = form;
  const data = company.data;
  useEffect(() => {
    if (!data) return;
    reset({
      name: data.name ?? "",
      industry: data.industry ?? "",
      location: data.location ?? "",
      company_size: data.company_size ?? "",
      website: data.website ?? "",
      description: data.description ?? "",
    });
  }, [data, reset]);

  const save = useMutation({
    mutationFn: async (values: z.infer<typeof companySchema>) => {
      const payload = {
        name: values.name,
        industry: values.industry || null,
        location: values.location || null,
        company_size: values.company_size || null,
        website: values.website || null,
        description: values.description || null,
      };
      if (data) {
        const { error } = await supabase.from("companies").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("companies")
          .insert({ ...payload, owner_id: userId! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(data ? "Company profile updated" : "Company profile created");
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
        className="panel space-y-4 p-6"
      >
        <div>
          <h2 className="text-sm font-medium">Company profile</h2>
          <p className="text-sm text-muted-foreground">
            Shown to students on every project you publish.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company name</FormLabel>
                <FormControl>
                  <Input maxLength={120} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <FormControl>
                  <Input placeholder="Fintech" maxLength={80} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input maxLength={120} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team size</FormLabel>
                <FormControl>
                  <Input placeholder="11-50" maxLength={40} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://" maxLength={300} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About the company</FormLabel>
              <FormControl>
                <Textarea rows={4} maxLength={1000} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : data ? "Save changes" : "Create company profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function NewProjectDialog({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      category: "Web Development",
      difficulty: "intermediate",
      duration_weeks: 8,
      openings: 1,
      is_remote: true,
      skills: "",
      deadline: "",
    },
  });

  const create = useMutation({
    mutationFn: async (values: z.infer<typeof projectSchema>) => {
      const { error } = await supabase.from("projects").insert({
        company_id: companyId,
        title: values.title,
        summary: values.summary,
        description: values.description,
        category: values.category,
        difficulty: values.difficulty,
        duration_weeks: values.duration_weeks,
        openings: values.openings,
        is_remote: values.is_remote,
        deadline: values.deadline || null,
        status: "open",
        skills: (values.skills ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 20),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project published");
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publish a project</DialogTitle>
          <DialogDescription>
            Scope one real problem. Students apply directly from the feed.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="new-project-form"
            onSubmit={form.handleSubmit((values) => create.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input maxLength={120} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>One-line summary</FormLabel>
                  <FormControl>
                    <Input maxLength={240} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full brief</FormLabel>
                  <FormControl>
                    <Textarea rows={8} maxLength={4000} {...field} />
                  </FormControl>
                  <FormDescription>
                    Context, expected deliverables, constraints and definition of done.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_CATEGORIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DIFFICULTIES.map((item) => (
                          <SelectItem key={item} value={item} className="capitalize">
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration_weeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (weeks)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={52} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="openings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Openings</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={20} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application deadline</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <Input placeholder="React, Postgres" maxLength={300} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="is_remote"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <FormLabel>Remote friendly</FormLabel>
                    <FormDescription>Students can collaborate from anywhere.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="new-project-form" disabled={create.isPending}>
            {create.isPending ? "Publishing…" : "Publish project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
