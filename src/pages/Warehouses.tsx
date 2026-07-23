import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { useRoles } from "@/hooks/use-roles";

type W = { id: string; code: string; name: string; address: string | null; notes: string | null; is_active: boolean };

export default function Warehouses() {
  const { canManageStock } = useRoles();
  const [items, setItems] = useState<W[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<W>>({ is_active: true });

  const load = async () => {
    const { data } = await supabase.from("warehouses").select("*").order("code");
    setItems((data ?? []) as W[]);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.code || !form.name) return toast.error("Nhập mã và tên kho");
    const payload = { code: form.code, name: form.name, address: form.address || null, notes: form.notes || null, is_active: form.is_active ?? true };
    const res = form.id
      ? await supabase.from("warehouses").update(payload).eq("id", form.id)
      : await supabase.from("warehouses").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Đã lưu"); setOpen(false); setForm({ is_active: true }); load();
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kho</h1>
            <p className="text-sm text-muted-foreground">Danh sách kho hàng</p>
          </div>
          {canManageStock && (
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm({ is_active: true }); }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Thêm kho</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{form.id ? "Sửa kho" : "Kho mới"}</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Mã *</Label><Input value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
                  <div><Label>Tên *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Địa chỉ</Label><Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                  <div><Label>Ghi chú</Label><Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={save}>Lưu</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Mã</TableHead><TableHead>Tên</TableHead><TableHead>Địa chỉ</TableHead>{canManageStock && <TableHead className="w-16"></TableHead>}</TableRow></TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Chưa có kho</TableCell></TableRow>
              ) : items.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono text-xs">{w.code}</TableCell>
                  <TableCell>{w.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{w.address || "—"}</TableCell>
                  {canManageStock && <TableCell><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setForm(w); setOpen(true); }}><Pencil className="h-3 w-3" /></Button></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
