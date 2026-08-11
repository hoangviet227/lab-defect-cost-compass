import { num } from "@/lib/utils";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRoles } from "@/hooks/use-roles";

type Material = {
  id: string;
  code: string;
  name: string;
  unit: string;
  width_cm: number | null;
  thickness_mm: number | null;
  min_stock: number;
  avg_cost: number;
  is_active: boolean;
  category_id: string | null;
};
type Category = { id: string; code: string; name: string };

const empty: Partial<Material> = { code: "", name: "", unit: "cái", min_stock: 0, is_active: true };

export default function Materials() {
  const { canManageStock } = useRoles();
  const [items, setItems] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Material>>(empty);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: mats }, { data: cats }] = await Promise.all([
      supabase.from("materials").select("*").order("code"),
      supabase.from("material_categories").select("id,code,name").order("name"),
    ]);
    setItems((mats ?? []) as Material[]);
    setCategories((cats ?? []) as Category[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.code || !form.name) { toast.error("Nhập mã và tên vật tư"); return; }
    const payload: any = {
      code: form.code, name: form.name, unit: form.unit || "cái",
      width_cm: form.width_cm || null, thickness_mm: form.thickness_mm || null,
      min_stock: form.min_stock ?? 0, category_id: form.category_id || null,
      is_active: form.is_active ?? true,
    };
    const res = form.id
      ? await supabase.from("materials").update(payload).eq("id", form.id)
      : await supabase.from("materials").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(form.id ? "Đã cập nhật" : "Đã tạo vật tư");
    setOpen(false); setForm(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Xóa vật tư này?")) return;
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã xóa"); load();
  };

  const filtered = items.filter((m) =>
    !q || m.code.toLowerCase().includes(q.toLowerCase()) || m.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Vật tư</h1>
            <p className="text-sm text-muted-foreground">Danh mục nguyên vật liệu và giá vốn bình quân</p>
          </div>
          {canManageStock && (
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(empty); }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Thêm vật tư</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{form.id ? "Sửa vật tư" : "Vật tư mới"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Mã *</Label><Input value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
                  <div><Label>Tên *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Đơn vị</Label><Input value={form.unit || ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
                  <div><Label>Nhóm</Label>
                    <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? null : v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Không —</SelectItem>
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Khổ (cm)</Label><Input type="number" step="0.1" value={form.width_cm ?? ""} onChange={(e) => setForm({ ...form, width_cm: e.target.value ? num(e.target.value) : null })} /></div>
                  <div><Label>Độ dày (mm)</Label><Input type="number" step="0.01" value={form.thickness_mm ?? ""} onChange={(e) => setForm({ ...form, thickness_mm: e.target.value ? num(e.target.value) : null })} /></div>
                  <div><Label>Tồn tối thiểu</Label><Input type="number" value={form.min_stock ?? 0} onChange={(e) => setForm({ ...form, min_stock: num(e.target.value) })} /></div>
                </div>
                <DialogFooter><Button onClick={save}>Lưu</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Input placeholder="Tìm theo mã hoặc tên..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead><TableHead>Tên</TableHead><TableHead>ĐV</TableHead>
                <TableHead className="text-right">Khổ</TableHead><TableHead className="text-right">Tồn min</TableHead>
                <TableHead className="text-right">Giá vốn BQ</TableHead>
                {canManageStock && <TableHead className="w-24"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Đang tải...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Chưa có vật tư</TableCell></TableRow>
              ) : filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.code}</TableCell>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.unit}</TableCell>
                  <TableCell className="text-right">{m.width_cm ?? "—"}</TableCell>
                  <TableCell className="text-right">{m.min_stock}</TableCell>
                  <TableCell className="text-right">{m.avg_cost?.toLocaleString("vi-VN")}</TableCell>
                  {canManageStock && (
                    <TableCell className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setForm(m); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(m.id)}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
