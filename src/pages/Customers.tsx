import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, KeyRound } from "lucide-react";
import { useRoles } from "@/hooks/use-roles";
import { toLoginEmail, isEmail, displayLogin } from "@/lib/account";

const FIELDS = [
  "code", "name", "phone", "email", "address", "contact_person",
  "tax_code", "tier_id", "credit_limit", "customer_type", "note", "is_active",
] as const;

export default function Customers() {
  const { has } = useRoles();
  const canManage = has("admin") || has("sales");
  const isAdmin = has("admin");
  const [rows, setRows] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [acc, setAcc] = useState({ email: "", password: "" });
  const [linking, setLinking] = useState(false);

  const load = async () => {
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
      supabase.from("customer_tiers").select("*").order("level"),
    ]);
    setRows(c ?? []); setTiers(t ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setCurrent(null);
    setForm({ is_active: true, tier_id: tiers[0]?.id, customer_type: "retail", credit_limit: 0 });
    setAcc({ email: "", password: "" });
    setOpen(true);
  };
  const openEdit = (r: any) => {
    setCurrent(r); setForm(r);
    setAcc({ email: displayLogin(r.email) === "-" ? "" : displayLogin(r.email), password: "" });
    setOpen(true);
  };

  const payload = () => {
    const p: any = {};
    FIELDS.forEach((f) => { if (form[f] !== undefined) p[f] = form[f]; });
    p.credit_limit = Number(p.credit_limit ?? 0);
    if (!p.tier_id) p.tier_id = null;
    return p;
  };

  const save = async () => {
    if (!form.name) return toast.error("Nhập tên khách hàng");
    try {
      if (current) {
        const { error } = await supabase.from("customers").update(payload()).eq("id", current.id);
        if (error) throw error;
      } else {
        const code = form.code || `KH${Date.now().toString().slice(-6)}`;
        const { data, error } = await supabase
          .from("customers").insert({ ...payload(), code, name: form.name }).select().single();
        if (error) throw error;
        setCurrent(data);
        setForm(data);
      }
      toast.success("Đã lưu");
      if (current) setOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const linkAccount = async (unlink = false) => {
    if (!current?.id) return toast.error("Lưu khách hàng trước khi cấp tài khoản");
    const email = toLoginEmail(acc.email);
    if (!unlink && !isEmail(email)) {
      return toast.error("Tên đăng nhập không hợp lệ (vd: khach01 hoặc khach@email.com)");
    }
    setLinking(true);
    const { data, error } = await supabase.functions.invoke("link-customer-account", {
      body: unlink
        ? { customer_id: current.id, unlink: true }
        : { customer_id: current.id, email, password: acc.password || undefined },
    });
    setLinking(false);
    const err = error?.message || (data as any)?.error;
    if (err) return toast.error(err);
    toast.success(unlink ? "Đã gỡ tài khoản" : "Đã gắn tài khoản cổng khách hàng");
    setAcc({ ...acc, password: "" });
    const { data: fresh } = await supabase.from("customers").select("*").eq("id", current.id).maybeSingle();
    if (fresh) { setCurrent(fresh); setForm(fresh); }
    load();
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Khách hàng</h1>
            <p className="text-sm text-muted-foreground">Danh sách khách, cấp giá và tài khoản cổng khách hàng.</p></div>
          {canManage && <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Thêm</Button>}
        </div>

        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Mã</TableHead><TableHead>Tên</TableHead><TableHead>SĐT</TableHead>
              <TableHead>Cấp</TableHead><TableHead>Tài khoản</TableHead><TableHead>Trạng thái</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => openEdit(r)}>
                  <TableCell className="font-mono text-xs">{r.code}</TableCell>
                  <TableCell>{r.name}</TableCell><TableCell>{r.phone ?? "-"}</TableCell>
                  <TableCell>{tiers.find(t => t.id === r.tier_id)?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={r.user_id ? "default" : "outline"}>{r.user_id ? "Đã gắn" : "Chưa gắn"}</Badge>
                  </TableCell>
                  <TableCell><Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Đang HĐ" : "Ngưng"}</Badge></TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có KH</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{current ? "Sửa khách hàng" : "Thêm khách hàng"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Mã</Label><Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Tự sinh" /></div>
              <div><Label>Tên *</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>SĐT</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="col-span-2"><Label>Địa chỉ</Label><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Cấp giá</Label>
                <Select value={form.tier_id ?? ""} onValueChange={(v) => setForm({ ...form, tier_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn cấp" /></SelectTrigger>
                  <SelectContent>{tiers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.is_active !== false} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="text-xs">Đang hoạt động</Label>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                <Label className="text-sm font-medium">Tài khoản cổng khách hàng</Label>
                {current?.user_id && <Badge variant="default">Đã gắn</Badge>}
              </div>
              {!isAdmin ? (
                <p className="text-xs text-muted-foreground">Chỉ quản trị viên được cấp tài khoản.</p>
              ) : !current ? (
                <p className="text-xs text-muted-foreground">Lưu khách hàng trước, sau đó cấp tài khoản đăng nhập.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Username hoặc email</Label>
                      <Input value={acc.email} onChange={(e) => setAcc({ ...acc, email: e.target.value })} placeholder="khach01 hoặc khach@email.com" /></div>
                    <div><Label className="text-xs">Mật khẩu</Label>
                      <Input type="password" value={acc.password} onChange={(e) => setAcc({ ...acc, password: e.target.value })} placeholder="Tối thiểu 6 ký tự" /></div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Nhập username sẽ tự gán email nội bộ <b>username@xuongin.local</b>. Nếu tài khoản chưa tồn tại, hệ thống sẽ tạo mới (cần mật khẩu) và cấp quyền <b>customer</b> để đăng nhập vào /portal.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={linking} onClick={() => linkAccount(false)}>
                      {linking ? "Đang xử lý..." : current.user_id ? "Cập nhật tài khoản" : "Cấp tài khoản"}
                    </Button>
                    {current.user_id && (
                      <Button size="sm" variant="ghost" disabled={linking} onClick={() => linkAccount(true)}>Gỡ tài khoản</Button>
                    )}
                  </div>
                </>
              )}
            </div>

            <DialogFooter><Button onClick={save}>Lưu</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
