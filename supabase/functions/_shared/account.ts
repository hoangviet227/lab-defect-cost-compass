export const LOCAL_EMAIL_DOMAIN = "xuongin.local";

export function normalizeUsername(input: string) {
  return (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
}

export function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test((v || "").trim());
}

/** Nhận email hoặc username -> email đăng nhập (username => username@xuongin.local) */
export function toLoginEmail(input: string) {
  const v = (input || "").trim().toLowerCase();
  if (v.includes("@")) return v;
  const u = normalizeUsername(v);
  return u ? `${u}@${LOCAL_EMAIL_DOMAIN}` : "";
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
