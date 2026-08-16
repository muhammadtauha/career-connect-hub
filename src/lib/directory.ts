import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Company = Tables<"companies">;

export const AVAILABILITY = ["open", "part_time", "unavailable"] as const;
export const AVAILABILITY_LABELS: Record<string, string> = {
  open: "Open to projects",
  part_time: "Part-time only",
  unavailable: "Not available",
};

export const INDUSTRIES = [
  "Software",
  "Fintech",
  "Healthcare",
  "E-commerce",
  "Education",
  "Manufacturing",
  "Energy",
  "Logistics",
  "Media",
  "Other",
] as const;

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;

const PROFILE_FIELDS: (keyof Profile)[] = [
  "full_name",
  "headline",
  "bio",
  "avatar_url",
  "cover_url",
  "university",
  "department",
  "degree",
  "graduation_year",
  "location",
  "phone",
  "contact_email",
  "cv_url",
  "github_url",
  "linkedin_url",
  "portfolio_url",
];

/** Percentage of the profile a student has filled in, used to nudge completion. */
export function profileCompletion(profile: Profile | null | undefined) {
  if (!profile) return 0;
  let filled = 0;
  const arrays: (keyof Profile)[] = [
    "skills",
    "soft_skills",
    "languages",
    "experience",
    "certifications",
    "portfolio",
  ];
  const total = PROFILE_FIELDS.length + arrays.length;

  for (const field of PROFILE_FIELDS) {
    const value = profile[field];
    if (value !== null && value !== undefined && String(value).trim() !== "") filled += 1;
  }
  for (const field of arrays) {
    const value = profile[field] as unknown;
    if (Array.isArray(value) && value.length > 0) filled += 1;
  }
  return Math.round((filled / total) * 100);
}

export type StudentFilters = {
  search?: string;
  skill?: string;
  university?: string;
  department?: string;
  location?: string;
  availability?: string;
};

export const studentsQuery = (filters: StudentFilters = {}) =>
  queryOptions({
    queryKey: ["students", "directory", filters],
    queryFn: async (): Promise<Profile[]> => {
      let query = supabase
     .from("profiles")
     .select("*")
     .eq("suspended", false)
     .eq("primary_role", "student")
     .order("updated_at", { ascending: false })
     .limit(60);
      if (filters.search?.trim()) {
        const term = `%${filters.search.trim()}%`;
        query = query.or(`full_name.ilike.${term},headline.ilike.${term},bio.ilike.${term}`);
      }
      if (filters.skill?.trim()) query = query.contains("skills", [filters.skill.trim()]);
      if (filters.university?.trim()) query = query.ilike("university", `%${filters.university.trim()}%`);
      if (filters.department?.trim()) query = query.ilike("department", `%${filters.department.trim()}%`);
      if (filters.location?.trim()) query = query.ilike("location", `%${filters.location.trim()}%`);
      if (filters.availability && filters.availability !== "all") {
        query = query.eq("availability", filters.availability);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

export const studentProfileQuery = (studentId: string) =>
  queryOptions({
    queryKey: ["profile", "public", studentId],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

export type CompanyFilters = {
  search?: string;
  industry?: string;
  location?: string;
  hiring?: string;
};

export const companiesQuery = (filters: CompanyFilters = {}) =>
  queryOptions({
    queryKey: ["companies", "directory", filters],
    queryFn: async (): Promise<Company[]> => {
      let query = supabase
        .from("companies")
        .select("*")
        .eq("suspended", false)
        .order("created_at", { ascending: false })
        .limit(60);

      if (filters.search?.trim()) {
        const term = `%${filters.search.trim()}%`;
        query = query.or(`name.ilike.${term},description.ilike.${term}`);
      }
      if (filters.industry && filters.industry !== "all") query = query.eq("industry", filters.industry);
      if (filters.location?.trim()) query = query.ilike("location", `%${filters.location.trim()}%`);
      if (filters.hiring === "yes") query = query.eq("hiring", true);
      if (filters.hiring === "no") query = query.eq("hiring", false);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

export const companyByIdQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["companies", companyId],
    queryFn: async (): Promise<Company | null> => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

export const companyPublicProjectsQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["projects", "public-company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("company_id", companyId)
        .neq("status", "draft")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
