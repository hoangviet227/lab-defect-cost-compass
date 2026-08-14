import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { num } from "@/lib/utils";

const STAFF_ROLES = [
  { v: "admin", l: "Quản trị" },
  { v: "sales", l: "Kinh doanh" },
  { v: "warehouse", l: "Kho" },
  { v: "production", l: "Sản xuất" },
  { v: "accountant", l: "Kế toán" },
  { v: "delivery", l: "Giao hàng" },
  { v: "user", l: "Nhân viên" },
];

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));

const empty = {
  id: "", login: "", password: "", full_name: "", phone: "", employee_code: "",
  base_salary: "0", allowance: "0", daily_rate: "0", shift_rate: "0",
  bank_name: "", bank_account: "", note: "", is_active: true, roles: ["user"] as string[],
};

export function EmployeeManager({ isAdmin, onChanged }: { isAdmin: boolean; onChanged?: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const editing = !!form.id;

  const load = async () => {
    const [{ data: emps }, { data: profs }, { data: roles }] = await Promise.all([
      supabase.from("employee_profiles").select("*").order("employee_code"),
      supabase.from("profiles").select("user_id, full_name, phone"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const pm = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
    const rm = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => rm.set(r.user_id, [...(rm.get(r.user_id) ?? []), r.role]));
    setRows((emps ?? []).map((e: any) => ({
      ...e,
      full_name: pm.get(e.user_id)?.full_name ?? null,
      phone: pm.get(e.user_id)?.phone ?? null,
      roles: rm.get(e.user_id) ?? [],
    })));
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ ...empty }); setOpen(true); };
  const openEdit = (r: any) => {
    setForm({
      ...empty, id: r.id, full_name: r.full_name ?? "", phone: r.phone ?? "",
      employee_code: r.employee_code ?? "",
      base_salary: String(r.base_salary ?? 0), allowance: String(r.allowance ?? 0),
      daily_rate: String(r.daily_rate ?? 0), shift_rate: String(r.shift_rate ?? 0),
      bank_name: r.bank_name ?? "", bank_account: r.bank_account ?? "", note: r.note ?? "",
      is_active: r.is_active !== false, roles: r.roles?.length ? r.roles : ["user"],
    });
    setOpen(true);
  };

  const toggleRole = (v: string) =>
    setForm(f => ({ ...f, roles: f.roles.includes(v) ? f.roles.filter(x => x !== v) : [...f.roles, v] }));

  const save = async () => {
    if (!form.full_name.trim()) return toast.error("Nhập họ tên");
    if (!editing) {
      if (!form.login.trim()) return toast.error("Nhập tên đăng nhập");
      if (form.password.length < 6) return toast.error("Mật khẩu tối thiểu 6 ký tự");
    } else if (form.password && form.password.length < 6) {
      return toast.error("Mật khẩu tối thiểu 6 ký tự");
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("manage-staff-account", {
      body: {
        action: editing ? "update" : "create",
        employee_id: form.id || undefined,
        login: form.login, password: form.password || undefined,
        full_name: form.full_name.trim(), phone: form.phone || null,
        employee_code: form.employee_code || undefined,
        base_salary: num(form.base_salary), allowance: num(form.allowance),
        daily_rate: num(form.daily_rate), shift_rate: num(form.shift_rate),
        bank_name: form.bank_name || null, bank_account: form.bank_account || null,
        note: form.note || null, is_active: form.is_active, roles: form.roles,
      },
    });
    setSaving(false);
    const err = error?.message || (data as any)?.error;
    if (err) return toast.error(err);
    toast.success(editing ? "Đã cập nhật nhân viên" : "Đã tạo nhân viên và tài khoản");
    setOpen(false); load(); onChanged?.();
  };

  return (
    <div className="space-y-3">
      {isAdmin && <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Thêm nhân viên</Button>}
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Mã NV</TableHead><TableHead>Họ tên</TableHead><TableHead>SĐT</TableHead>
            <TableHead>Vai trò</TableHead><TableHead className="text-right">Lương CB</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} className={isAdmin ? "cursor-pointer" : ""} onClick={() => isAdmin && openEdit(r)}>
                <TableCell className="font-mono text-xs">{r.employee_code}</TableCell>
                <TableCell>{r.full_name || "-"}</TableCell>
                <TableCell>{r.phone || "-"}</TableCell>
                <TableCell className="space-x-1">
                  {(r.roles ?? []).map((x: string) => (
                    <Badge key={x} variant="secondary" className="text-[10px]">
                      {STAFF_ROLES.find(s => s.v === x)?.l ?? x}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell className="text-right">{fmt(r.base_salary)}</TableCell>
                <TableCell><Badge variant={r.is_active !== false ? "default" : "secondary"}>{r.is_active !== false ? "Đang làm" : "Nghỉ"}</Badge></TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Chưa có nhân viên</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Sửa nhân viên" : "Thêm nhân viên"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Họ tên *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
            <div><Label>Mã NV</Label><Input value={form.employee_code} onChange={e => setForm(f => ({ ...f, employee_code: e.target.value }))} placeholder="Tự sinh" /></div>
            {!editing && (
              <div><Label>Tên đăng nhập *</Label>
                <Input value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} placeholder="vietnv hoặc email" />
              </div>
            )}
            <div><Label>{editing ? "Đặt lại mật khẩu" : "Mật khẩu *"}</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Tối thiểu 6 ký tự" />
            </div>
            <div><Label>SĐT</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Lương cơ bản</Label><Input type="number" value={form.base_salary} onChange={e => setForm(f => ({ ...f, base_salary: e.target.value }))} /></div>
            <div><Label>Phụ cấp</Label><Input type="number" value={form.allowance} onChange={e => setForm(f => ({ ...f, allowance: e.target.value }))} /></div>
            <div><Label>Đơn giá ngày</Label><Input type="number" value={form.daily_rate} onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))} /></div>
            <div><Label>Đơn giá ca</Label><Input type="number" value={form.shift_rate} onChange={e => setForm(f => ({ ...f, shift_rate: e.target.value }))} /></div>
            <div><Label>Ngân hàng</Label><Input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} /></div>
            <div><Label>Số tài khoản</Label><Input value={form.bank_account} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Ghi chú</Label><Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <Label className="text-sm">Vai trò</Label>
            <div className="grid grid-cols-3 gap-2">
              {STAFF_ROLES.map(r => (
                <label key={r.v} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.roles.includes(r.v)} onCheckedChange={() => toggleRole(r.v)} />
                  {r.l}
                </label>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tên đăng nhập dạng username sẽ được gán email nội bộ <b>username@xuongin.local</b>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            <Label className="text-xs">Đang làm việc</Label>
          </div>

          <DialogFooter>
            <Button onClick={save} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
