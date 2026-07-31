import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AppRole = "student" | "company" | "university" | "qa" | "admin";
export type Profile = Tables<"profiles">;

export const ROLE_LABELS: Record<AppRole, string> = {
  student: "Student",
  company: "Company",
  university: "University Lead",
  qa: "Quality Assurance",
  admin: "Administrator",
};

type AuthValue = {
  user: User | null;
  userId: string | null;
  initializing: boolean;
  profile: Profile | null;
  roles: AppRole[];
  role: AppRole | null;
  isLoadingIdentity: boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setInitializing(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") {
        return;
      }
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router, queryClient]);

  const identity = useQuery({
    queryKey: ["identity", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
      ]);
      if (profileRes.error) throw profileRes.error;
      if (rolesRes.error) throw rolesRes.error;
      return {
        profile: profileRes.data as Profile | null,
        roles: (rolesRes.data ?? []).map((r) => r.role as AppRole),
      };
    },
  });

  const value = useMemo<AuthValue>(() => {
    const roles = identity.data?.roles ?? [];
    return {
      user,
      userId: user?.id ?? null,
      initializing,
      profile: identity.data?.profile ?? null,
      roles,
      role: roles[0] ?? null,
      isLoadingIdentity: Boolean(user) && identity.isPending,
    };
  }, [user, initializing, identity.data, identity.isPending]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export async function signOutCompletely(queryClient: {
  cancelQueries: () => Promise<void>;
  clear: () => void;
}) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
}
