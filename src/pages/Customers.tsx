import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useRoles } from "@/hooks/use-roles";

export default function Customers() {
  const { has } = useRoles();
  const canManage = has("admin") || has("sales");
  const [rows, setRows] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
      supabase.from("customer_tiers").select("*").order("level"),
    ]);
    setRows(c ?? []); setTiers(t ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setCurrent(null); setForm({ is_active: true, tier_id: tiers[0]?.id }); setOpen(true); };
  const openEdit = (r: any) => { setCurrent(r); setForm(r); setOpen(true); };

  const save = async () => {
    if (!form.name) return toast.error("Nhập tên");
    try {
      if (current) {
        const { error } = await supabase.from("customers").update(form).eq("id", current.id);
        if (error) throw error;
      } else {
        const code = form.code || `KH${Date.now().toString().slice(-6)}`;
        const { error } = await supabase.from("customers").insert({ ...form, code });
        if (error) throw error;
      }
      toast.success("Đã lưu"); setOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Khách hàng</h1>
            <p className="text-sm text-muted-foreground">Danh sách khách và cấp giá.</p></div>
          {canManage && <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Thêm</Button>}
        </div>

        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Mã</TableHead><TableHead>Tên</TableHead><TableHead>SĐT</TableHead>
              <TableHead>Cấp</TableHead><TableHead>Trạng thái</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => openEdit(r)}>
                  <TableCell className="font-mono text-xs">{r.code}</TableCell>
                  <TableCell>{r.name}</TableCell><TableCell>{r.phone ?? "-"}</TableCell>
                  <TableCell>{tiers.find(t => t.id === r.tier_id)?.name ?? "-"}</TableCell>
                  <TableCell><Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Đang HĐ" : "Ngưng"}</Badge></TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Chưa có KH</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{current ? "Sửa khách hàng" : "Thêm khách hàng"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Mã</Label><Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Tự sinh" /></div>
              <div><Label>Tên *</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>SĐT</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="col-span-2"><Label>Địa chỉ</Label><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Cấp giá</Label>
                <Select value={form.tier_id ?? ""} onValueChange={(v) => setForm({ ...form, tier_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{tiers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={save}>Lưu</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
