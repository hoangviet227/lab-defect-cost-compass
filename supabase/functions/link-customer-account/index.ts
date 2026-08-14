import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { toLoginEmail, isEmail } from "../_shared/account.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Chưa đăng nhập" }, 401);

    const caller = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await caller.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Phiên đăng nhập không hợp lệ" }, 401);

    const admin = createClient(url, service, { auth: { persistSession: false } });

    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Chỉ quản trị viên được cấp tài khoản khách hàng" }, 403);

    const body = await req.json().catch(() => ({}));
    const customerId: string = body.customer_id;
    const email: string = toLoginEmail(body.email ?? body.login ?? "");
    const password: string | undefined = body.password || undefined;
    const unlink: boolean = !!body.unlink;

    if (!customerId) return json({ error: "Thiếu customer_id" }, 400);

    const { data: customer, error: cErr } = await admin
      .from("customers")
      .select("id,name,user_id")
      .eq("id", customerId)
      .maybeSingle();
    if (cErr) return json({ error: cErr.message }, 400);
    if (!customer) return json({ error: "Không tìm thấy khách hàng" }, 404);

    if (unlink) {
      const { error } = await admin.from("customers").update({ user_id: null }).eq("id", customerId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, unlinked: true });
    }

    if (!email) return json({ error: "Nhập username hoặc email tài khoản" }, 400);
    if (!isEmail(email)) {
      return json({ error: `Tên đăng nhập không hợp lệ: "${body.email ?? ""}"` }, 400);
    }

    // Find existing auth user by email
    let userId: string | null = null;
    let created = false;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);

    if (existing) {
      userId = existing.id;
      if (password) {
        const { error } = await admin.auth.admin.updateUserById(userId, { password });
        if (error) return json({ error: error.message }, 400);
      }
    } else {
      if (!password || password.length < 6) {
        return json({ error: "Tài khoản chưa tồn tại — nhập mật khẩu tối thiểu 6 ký tự để tạo mới" }, 400);
      }
      const { data: newUser, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: customer.name },
      });
      if (error) return json({ error: error.message }, 400);
      userId = newUser.user!.id;
      created = true;
    }

    // Ensure profile exists
    await admin
      .from("profiles")
      .upsert({ user_id: userId!, full_name: customer.name }, { onConflict: "user_id" });

    // Ensure customer role
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId!)
      .eq("role", "customer")
      .maybeSingle();
    if (!roleRow) {
      const { error } = await admin.from("user_roles").insert({ user_id: userId!, role: "customer" });
      if (error) return json({ error: error.message }, 400);
    }

    // Make sure this auth user isn't linked to another customer
    await admin.from("customers").update({ user_id: null }).eq("user_id", userId!).neq("id", customerId);

    const { error: linkErr } = await admin
      .from("customers")
      .update({ user_id: userId })
      .eq("id", customerId);
    if (linkErr) return json({ error: linkErr.message }, 400);

    return json({ ok: true, user_id: userId, email, created });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
