import { supabase } from "@/integrations/supabase/client";

/** Ghi nhật ký thao tác. Không chặn luồng chính nếu lỗi. */
export async function logActivity(params: {
  action: string;
  entity_table: string;
  entity_id?: string | null;
  before_data?: unknown;
  after_data?: unknown;
  reason?: string | null;
}) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase.from("activity_logs").insert({
      user_id: auth.user.id,
      action: params.action,
      entity_table: params.entity_table,
      entity_id: params.entity_id ?? null,
      before_data: (params.before_data ?? null) as never,
      after_data: (params.after_data ?? null) as never,
      reason: params.reason ?? null,
    });
  } catch {
    /* nhật ký không được làm hỏng nghiệp vụ */
  }
}
