import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "user" | "sales" | "warehouse" | "production" | "accountant" | "delivery" | "customer";

export function useRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRoles([]); setLoading(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      setRoles((data ?? []).map((r: any) => r.role as AppRole));
      setLoading(false);
    });
  }, [user]);

  const has = (r: AppRole) => roles.includes(r);
  const canManageStock = has("admin") || has("warehouse");
  return { roles, loading, has, canManageStock };
}
