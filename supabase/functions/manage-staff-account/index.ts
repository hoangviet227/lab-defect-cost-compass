import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { corsHeaders, json, toLoginEmail, isEmail } from "../_shared/account.ts";

const ALLOWED_ROLES = [
  "admin", "user", "sales", "warehouse", "production", "accountant", "delivery",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Chưa đăng nhập" }, 401);

    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await caller.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Phiên đăng nhập không hợp lệ" }, 401);

    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Chỉ quản trị viên được quản lý nhân viên" }, 403);

    const body = await req.json().catch(() => ({}));
    const action: string = body.action ?? "create";

    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const roles: string[] = Array.isArray(body.roles)
      ? body.roles.filter((r: string) => ALLOWED_ROLES.includes(r))
      : [];

    if (action === "update") {
      const employeeId: string = body.employee_id;
      if (!employeeId) return json({ error: "Thiếu employee_id" }, 400);

      const { data: emp } = await admin
        .from("employee_profiles").select("*").eq("id", employeeId).maybeSingle();
      if (!emp) return json({ error: "Không tìm thấy nhân viên" }, 404);

      const { error: upErr } = await admin.from("employee_profiles").update({
        employee_code: body.employee_code || emp.employee_code,
        base_salary: num(body.base_salary),
        allowance: num(body.allowance),
        daily_rate: num(body.daily_rate),
        shift_rate: num(body.shift_rate),
        bank_name: body.bank_name ?? null,
        bank_account: body.bank_account ?? null,
        note: body.note ?? null,
        is_active: body.is_active !== false,
      }).eq("id", employeeId);
      if (upErr) return json({ error: upErr.message }, 400);

      if (body.full_name || body.phone !== undefined) {
        await admin.from("profiles").upsert({
          user_id: emp.user_id,
          full_name: body.full_name || "",
          phone: body.phone ?? null,
          employee_code: body.employee_code || emp.employee_code,
        }, { onConflict: "user_id" });
      }

      if (body.password) {
        if (String(body.password).length < 6) return json({ error: "Mật khẩu tối thiểu 6 ký tự" }, 400);
        const { error } = await admin.auth.admin.updateUserById(emp.user_id, { password: body.password });
        if (error) return json({ error: error.message }, 400);
      }

      if (Array.isArray(body.roles)) {
        const { data: existing } = await admin.from("user_roles").select("role").eq("user_id", emp.user_id);
        const cur = (existing ?? []).map((r: any) => r.role).filter((r: string) => ALLOWED_ROLES.includes(r));
        const toAdd = roles.filter((r) => !cur.includes(r));
        const toRemove = cur.filter((r) => !roles.includes(r));
        if (toAdd.length) {
          await admin.from("user_roles").insert(toAdd.map((role) => ({ user_id: emp.user_id, role })));
        }
        for (const role of toRemove) {
          await admin.from("user_roles").delete().eq("user_id", emp.user_id).eq("role", role);
        }
      }

      return json({ ok: true, employee_id: employeeId });
    }

    // action === "create"
    const login: string = (body.login ?? "").trim();
    if (!login) return json({ error: "Nhập username hoặc email đăng nhập" }, 400);
    const email = toLoginEmail(login);
    if (!isEmail(email)) return json({ error: `Tên đăng nhập không hợp lệ: "${login}"` }, 400);

    const password: string = body.password ?? "";
    if (password.length < 6) return json({ error: "Mật khẩu tối thiểu 6 ký tự" }, 400);

    const fullName: string = (body.full_name ?? "").trim();
    if (!fullName) return json({ error: "Nhập họ tên nhân viên" }, 400);

    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let userId = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email)?.id ?? null;

    if (userId) {
      const { data: dup } = await admin
        .from("employee_profiles").select("id").eq("user_id", userId).maybeSingle();
      if (dup) return json({ error: "Tài khoản này đã gắn với một nhân viên khác" }, 400);
      await admin.auth.admin.updateUserById(userId, { password });
    } else {
      const { data: created, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name: fullName },
      });
      if (error) return json({ error: error.message }, 400);
      userId = created.user!.id;
    }

    let code: string = (body.employee_code ?? "").trim();
    if (!code) {
      const { data: seq } = await admin.rpc("next_sequence", { _prefix: "NV", _period: "", _pad: 4 });
      code = (seq as string) ?? `NV-${Date.now().toString().slice(-6)}`;
    }

    await admin.from("profiles").upsert({
      user_id: userId, full_name: fullName, phone: body.phone ?? null, employee_code: code,
    }, { onConflict: "user_id" });

    const { data: emp, error: empErr } = await admin.from("employee_profiles").insert({
      user_id: userId,
      employee_code: code,
      join_date: body.join_date || new Date().toISOString().slice(0, 10),
      base_salary: num(body.base_salary),
      allowance: num(body.allowance),
      daily_rate: num(body.daily_rate),
      shift_rate: num(body.shift_rate),
      bank_name: body.bank_name ?? null,
      bank_account: body.bank_account ?? null,
      note: body.note ?? null,
      is_active: body.is_active !== false,
      created_by: userData.user.id,
    }).select().single();
    if (empErr) return json({ error: empErr.message }, 400);

    const wanted = roles.length ? roles : ["user"];
    const { data: existing } = await admin.from("user_roles").select("role").eq("user_id", userId);
    const cur = (existing ?? []).map((r: any) => r.role);
    const toAdd = wanted.filter((r) => !cur.includes(r));
    if (toAdd.length) {
      await admin.from("user_roles").insert(toAdd.map((role) => ({ user_id: userId, role })));
    }

    return json({ ok: true, employee: emp, email, user_id: userId });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
