import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Review = Tables<"reviews">;
export type Profile = Tables<"profiles">;
export type ReviewWithReviewer = Review & { reviewer: Profile | null };

export type RatingSummary = { average: number; total: number };

export function summarise(reviews: Review[] | undefined): RatingSummary {
  const rows = reviews ?? [];
  if (rows.length === 0) return { average: 0, total: 0 };
  const sum = rows.reduce((acc, r) => acc + r.rating, 0);
  return { average: Math.round((sum / rows.length) * 10) / 10, total: rows.length };
}

async function withReviewers(rows: Review[]): Promise<ReviewWithReviewer[]> {
  const ids = [...new Set(rows.map((r) => r.reviewer_id))];
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  const map = new Map((data ?? []).map((p) => [p.id, p as Profile]));
  return rows.map((r) => ({ ...r, reviewer: map.get(r.reviewer_id) ?? null }));
}

export const studentReviewsQuery = (studentId: string) =>
  queryOptions({
    queryKey: ["reviews", "student", studentId],
    queryFn: async (): Promise<ReviewWithReviewer[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("subject_user_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return withReviewers(data ?? []);
    },
  });

export const companyReviewsQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["reviews", "company", companyId],
    queryFn: async (): Promise<ReviewWithReviewer[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("subject_company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return withReviewers(data ?? []);
    },
  });

export const engagementReviewsQuery = (engagementId: string) =>
  queryOptions({
    queryKey: ["reviews", "engagement", engagementId],
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("engagement_id", engagementId);
      if (error) throw error;
      return data ?? [];
    },
  });
