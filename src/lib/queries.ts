import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Company = Tables<"companies">;
export type Project = Tables<"projects">;
export type Application = Tables<"applications">;
export type Engagement = Tables<"engagements">;
export type Milestone = Tables<"milestones">;
export type Profile = Tables<"profiles">;

export type ProjectWithCompany = Project & { company: Company | null };
export type ApplicationWithStudent = Application & { student: Profile | null };
export type ApplicationWithProject = Application & { project: ProjectWithCompany | null };
export type EngagementWithProject = Engagement & { project: ProjectWithCompany | null };

export type FeedFilters = {
  search?: string;
  category?: string;
  difficulty?: string;
  skill?: string;
  duration?: string;
  status?: string;
};

async function attachProfiles<T extends { student_id: string }>(rows: T[]) {
  const ids = [...new Set(rows.map((r) => r.student_id))];
  if (ids.length === 0) return new Map<string, Profile>();
  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  return new Map((data ?? []).map((p) => [p.id, p as Profile]));
}

export const DURATION_BUCKETS = [
  { value: "short", label: "Up to 6 weeks", max: 6 },
  { value: "medium", label: "6–12 weeks", min: 6, max: 12 },
  { value: "long", label: "12+ weeks", min: 12 },
] as const;

export const projectsFeedQuery = (filters: FeedFilters = {}) =>
  queryOptions({
    queryKey: ["projects", "feed", filters],
    queryFn: async (): Promise<ProjectWithCompany[]> => {
      let query = supabase
        .from("projects")
        .select("*, company:companies(*)")
        .order("created_at", { ascending: false });

      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status as Project["status"]);
      } else {
        query = query.in("status", ["open", "paused", "completed"]);
      }

      if (filters.search?.trim()) {
        const term = `%${filters.search.trim()}%`;
        query = query.or(`title.ilike.${term},summary.ilike.${term},category.ilike.${term}`);
      }
      if (filters.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters.difficulty && filters.difficulty !== "all") {
        query = query.eq("difficulty", filters.difficulty);
      }
      if (filters.skill?.trim()) {
        query = query.contains("skills", [filters.skill.trim()]);
      }
      const bucket = DURATION_BUCKETS.find((b) => b.value === filters.duration);
      if (bucket) {
        if ("min" in bucket && bucket.min) query = query.gte("duration_weeks", bucket.min);
        if ("max" in bucket && bucket.max) query = query.lte("duration_weeks", bucket.max);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ProjectWithCompany[];
    },
  });

export const projectQuery = (projectId: string) =>
  queryOptions({
    queryKey: ["projects", projectId],
    queryFn: async (): Promise<ProjectWithCompany | null> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, company:companies(*)")
        .eq("id", projectId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ProjectWithCompany | null;
    },
  });

export const myCompanyQuery = (userId: string) =>
  queryOptions({
    queryKey: ["company", "mine", userId],
    queryFn: async (): Promise<Company | null> => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

export const companyProjectsQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["projects", "company", companyId],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const projectApplicationsQuery = (projectId: string) =>
  queryOptions({
    queryKey: ["applications", "project", projectId],
    queryFn: async (): Promise<ApplicationWithStudent[]> => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const profiles = await attachProfiles(rows);
      return rows.map((r) => ({ ...r, student: profiles.get(r.student_id) ?? null }));
    },
  });

export const myApplicationsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["applications", "mine", userId],
    queryFn: async (): Promise<ApplicationWithProject[]> => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, project:projects(*, company:companies(*))")
        .eq("student_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApplicationWithProject[];
    },
  });

export const myBookmarksQuery = (userId: string) =>
  queryOptions({
    queryKey: ["bookmarks", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*, project:projects(*, company:companies(*))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (Tables<"bookmarks"> & { project: ProjectWithCompany | null })[];
    },
  });

export const myEngagementsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["engagements", "student", userId],
    queryFn: async (): Promise<EngagementWithProject[]> => {
      const { data, error } = await supabase
        .from("engagements")
        .select("*, project:projects(*, company:companies(*))")
        .eq("student_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EngagementWithProject[];
    },
  });

export const companyEngagementsQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["engagements", "company", companyId],
    queryFn: async (): Promise<(EngagementWithProject & { student: Profile | null })[]> => {
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id")
        .eq("company_id", companyId);
      if (projectsError) throw projectsError;
      const ids = (projects ?? []).map((p) => p.id);
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from("engagements")
        .select("*, project:projects(*, company:companies(*))")
        .in("project_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as EngagementWithProject[];
      const profiles = await attachProfiles(rows);
      return rows.map((r) => ({ ...r, student: profiles.get(r.student_id) ?? null }));
    },
  });

export const engagementQuery = (engagementId: string) =>
  queryOptions({
    queryKey: ["engagements", engagementId],
    queryFn: async (): Promise<(EngagementWithProject & { student: Profile | null }) | null> => {
      const { data, error } = await supabase
        .from("engagements")
        .select("*, project:projects(*, company:companies(*))")
        .eq("id", engagementId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as EngagementWithProject;
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", row.student_id)
        .maybeSingle();
      return { ...row, student: (profile as Profile) ?? null };
    },
  });

export const milestonesQuery = (engagementId: string) =>
  queryOptions({
    queryKey: ["milestones", engagementId],
    queryFn: async (): Promise<Milestone[]> => {
      const { data, error } = await supabase
        .from("milestones")
        .select("*")
        .eq("engagement_id", engagementId)
        .order("order_index");
      if (error) throw error;
      return data ?? [];
    },
  });

export const PROJECT_CATEGORIES = [
  "Web Development",
  "Mobile",
  "Data Science",
  "Machine Learning",
  "Cybersecurity",
  "Cloud & DevOps",
  "Embedded / IoT",
  "Product Design",
  "Research",
  "General",
] as const;

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

export const DEFAULT_MILESTONES = [
  {
    title: "Discovery & requirements",
    description:
      "Meet the company team, review the problem statement, and submit a written scope with success criteria.",
  },
  {
    title: "Technical design",
    description:
      "Submit architecture, data model, and tooling decisions with a short rationale for each choice.",
  },
  {
    title: "Working prototype",
    description: "Deliver a running prototype covering the core user journey, plus a demo link.",
  },
  {
    title: "Testing & hardening",
    description: "Add tests, handle edge cases, and submit a QA report with known limitations.",
  },
  {
    title: "Final handover",
    description: "Ship documentation, deployment notes, and a recorded walkthrough of the solution.",
  },
] as const;
