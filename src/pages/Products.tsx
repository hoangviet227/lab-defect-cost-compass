import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Layers, Tags } from "lucide-react";
import { Link } from "react-router-dom";
import { useRoles } from "@/hooks/use-roles";

type Product = {
  id: string; code: string; name: string; unit: string;
  width_cm: number | null; height_cm: number | null;
  base_price: number; is_active: boolean; category_id: string | null; notes: string | null;
};
type Category = { id: string; code: string; name: string };

const empty: Partial<Product> = { code: "", name: "", unit: "cái", base_price: 0, is_active: true };

export default function Products() {
  const { canManageProducts } = useRoles();
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [catForm, setCatForm] = useState<{ id?: string; code: string; name: string }>({ code: "", name: "" });
  const [form, setForm] = useState<Partial<Product>>(empty);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").order("code"),
      supabase.from("product_categories").select("id,code,name").order("name"),
    ]);
    setItems((prods ?? []) as Product[]);
    setCategories((cats ?? []) as Category[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.code || !form.name) return toast.error("Nhập mã và tên sản phẩm");
    const payload: any = {
      code: form.code, name: form.name, unit: form.unit || "cái",
      width_cm: form.width_cm || null, height_cm: form.height_cm || null,
      base_price: form.base_price ?? 0, category_id: form.category_id || null,
      notes: form.notes || null, is_active: form.is_active ?? true,
    };
    const res = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(form.id ? "Đã cập nhật" : "Đã tạo sản phẩm");
    setOpen(false); setForm(empty); load();
  };

  const saveCat = async () => {
    if (!catForm.code || !catForm.name) return toast.error("Nhập mã và tên danh mục");
    const res = catForm.id
      ? await supabase.from("product_categories").update({ code: catForm.code, name: catForm.name }).eq("id", catForm.id)
      : await supabase.from("product_categories").insert({ code: catForm.code, name: catForm.name });
    if (res.error) return toast.error(res.error.message);
    toast.success("Đã lưu danh mục"); setCatOpen(false); setCatForm({ code: "", name: "" }); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Xóa sản phẩm này?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã xóa"); load();
  };

  const filtered = items.filter((p) =>
    !q || p.code.toLowerCase().includes(q.toLowerCase()) || p.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Sản phẩm</h1>
            <p className="text-sm text-muted-foreground">Sản phẩm gia công, kích thước, giá cơ bản, BOM, bảng giá</p>
          </div>
          {canManageProducts && (
            <div className="flex gap-2">
              <Dialog open={catOpen} onOpenChange={(o) => { setCatOpen(o); if (!o) setCatForm({ code: "", name: "" }); }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Tags className="h-4 w-4 mr-1" />Danh mục</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Danh mục sản phẩm</DialogTitle></DialogHeader>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {categories.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs w-20">{c.code}</span>
                        <span className="flex-1">{c.name}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCatForm(c)}><Pencil className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <Input placeholder="Mã" value={catForm.code} onChange={(e) => setCatForm({ ...catForm, code: e.target.value })} />
                    <Input placeholder="Tên" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
                  </div>
                  <DialogFooter><Button onClick={saveCat}>Lưu danh mục</Button></DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(empty); }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" />Thêm sản phẩm</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>{form.id ? "Sửa sản phẩm" : "Sản phẩm mới"}</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Mã *</Label><Input value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
                    <div><Label>Tên *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                    <div><Label>Danh mục</Label>
                      <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? null : v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Không —</SelectItem>
                          {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Đơn vị</Label><Input value={form.unit || ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
                    <div><Label>Rộng (cm)</Label><Input type="number" step="0.1" value={form.width_cm ?? ""} onChange={(e) => setForm({ ...form, width_cm: e.target.value ? +e.target.value : null })} /></div>
                    <div><Label>Cao (cm)</Label><Input type="number" step="0.1" value={form.height_cm ?? ""} onChange={(e) => setForm({ ...form, height_cm: e.target.value ? +e.target.value : null })} /></div>
                    <div className="col-span-2"><Label>Giá cơ bản (VNĐ)</Label><Input type="number" value={form.base_price ?? 0} onChange={(e) => setForm({ ...form, base_price: +e.target.value })} /></div>
                    <div className="col-span-2"><Label>Ghi chú</Label><Textarea rows={2} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                  </div>
                  <DialogFooter><Button onClick={save}>Lưu</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <Input placeholder="Tìm theo mã hoặc tên..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead><TableHead>Tên</TableHead><TableHead>ĐV</TableHead>
                <TableHead className="text-right">Rộng×Cao</TableHead>
                <TableHead className="text-right">Giá</TableHead>
                <TableHead className="w-40"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Đang tải...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có sản phẩm</TableCell></TableRow>
              ) : filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.code}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell className="text-right">{p.width_cm && p.height_cm ? `${p.width_cm}×${p.height_cm}` : "—"}</TableCell>
                  <TableCell className="text-right">{p.base_price?.toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" asChild className="h-7 px-2 text-xs">
                      <Link to={`/products/${p.id}/bom`}><Layers className="h-3 w-3 mr-1" />BOM</Link>
                    </Button>
                    {canManageProducts && <>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setForm(p); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3" /></Button>
                    </>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
