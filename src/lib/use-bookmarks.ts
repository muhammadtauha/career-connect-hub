import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export function useBookmarks(userId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["bookmarks", "ids", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("project_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return new Set((data ?? []).map((b) => b.project_id));
    },
  });

  const toggle = useMutation({
    mutationFn: async (projectId: string) => {
      if (!userId) throw new Error("You need to be signed in");
      if (query.data?.has(projectId)) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", userId)
          .eq("project_id", projectId);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase
        .from("bookmarks")
        .insert({ user_id: userId, project_id: projectId });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success(result === "added" ? "Saved to bookmarks" : "Removed from bookmarks");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    bookmarkedIds: query.data ?? new Set<string>(),
    isLoading: query.isPending,
    toggle,
  };
}
