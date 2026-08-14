export const LOCAL_EMAIL_DOMAIN = "xuongin.local";

/** Chuẩn hoá username: bỏ dấu, chỉ giữ a-z 0-9 . _ - */
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

/**
 * Nhận email thật hoặc username -> trả về email đăng nhập.
 * Username sẽ được gán email nội bộ dạng `username@xuongin.local`.
 */
export function toLoginEmail(input: string) {
  const v = (input || "").trim().toLowerCase();
  if (v.includes("@")) return v;
  const u = normalizeUsername(v);
  return u ? `${u}@${LOCAL_EMAIL_DOMAIN}` : "";
}

/** Hiển thị: ẩn phần @xuongin.local cho tài khoản username nội bộ */
export function displayLogin(email?: string | null) {
  if (!email) return "-";
  return email.endsWith(`@${LOCAL_EMAIL_DOMAIN}`) ? email.split("@")[0] : email;
}
