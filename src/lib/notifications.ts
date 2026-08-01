import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Notification = Tables<"notifications">;

export const notificationsQuery = (userId: string, limit = 50) =>
  queryOptions({
    queryKey: ["notifications", userId, limit],
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });

/** Notifications for the signed-in user, kept live through Lovable Cloud realtime. */
export function useNotifications(userId: string | null, limit = 50) {
  const queryClient = useQueryClient();
  const query = useQuery({ ...notificationsQuery(userId ?? "", limit), enabled: Boolean(userId) });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const items = query.data ?? [];
  const unread = items.filter((n) => !n.read).length;

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId!)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });

  return { query, items, unread, markRead, markAllRead };
}
