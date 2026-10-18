import { num } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Ruler, Save } from "lucide-react";
import { useRoles } from "@/hooks/use-roles";

type PrintSize = { id: string; code: string; name: string; width_cm: number | null; height_cm: number | null; sort_order: number; is_active: boolean };
type Product = { id: string; code: string; name: string };
type Tier = { id: string; code: string; name: string };
type SizePrice = {
  id: string; product_id: string; size_id: string; tier_id: string | null;
  channel: string; sale_price: number; production_cost: number;
};

const CHANNELS = [
  { value: "direct", label: "Trực tiếp / Web" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "shopee", label: "Shopee" },
  { value: "lazada", label: "Lazada" },
];

export default function ProductPricing() {
  const { canManagePrices } = useRoles();
  const [sizes, setSizes] = useState<PrintSize[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [prices, setPrices] = useState<SizePrice[]>([]);
  const [productId, setProductId] = useState<string>("");
  const [channel, setChannel] = useState("direct");
  const [loading, setLoading] = useState(true);

  const [sizeOpen, setSizeOpen] = useState(false);
  const [sizeForm, setSizeForm] = useState<{ id?: string; code: string; name: string; width_cm: string; height_cm: string }>({ code: "", name: "", width_cm: "", height_cm: "" });

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: p }, { data: t }, { data: pr }] = await Promise.all([
      supabase.from("print_sizes").select("*").order("sort_order"),
      supabase.from("products").select("id,code,name").eq("is_active", true).order("code"),
      supabase.from("customer_tiers").select("id,code,name").order("sort_order"),
      supabase.from("product_size_prices").select("*"),
    ]);
    setSizes((s ?? []) as PrintSize[]);
    setProducts((p ?? []) as Product[]);
    setTiers((t ?? []) as Tier[]);
    setPrices((pr ?? []) as SizePrice[]);
    if (!productId && p && p.length > 0) setProductId(p[0].id);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const grid = useMemo(() => {
    const map = new Map<string, SizePrice>();
    for (const pr of prices) {
      if (pr.product_id === productId && pr.channel === channel) {
        map.set(`${pr.size_id}|${pr.tier_id ?? "base"}`, pr);
      }
    }
    return map;
  }, [prices, productId, channel]);

  const getPrice = (sizeId: string, tierId: string | null) => grid.get(`${sizeId}|${tierId ?? "base"}`);

  const saveCell = async (sizeId: string, tierId: string | null, field: "sale_price" | "production_cost", value: number) => {
    const existing = getPrice(sizeId, tierId);
    const payload = {
      product_id: productId, size_id: sizeId, tier_id: tierId, channel,
      sale_price: field === "sale_price" ? value : (existing?.sale_price ?? 0),
      production_cost: field === "production_cost" ? value : (existing?.production_cost ?? 0),
    };
    const res = existing
      ? await supabase.from("product_size_prices").update(payload).eq("id", existing.id)
      : await supabase.from("product_size_prices").insert(payload);
    if (res.error) return toast.error(res.error.message);
    setPrices((prev) => {
      if (existing) return prev.map((x) => (x.id === existing.id ? { ...x, ...payload } : x));
      return prev; // reload to get id
    });
    if (!existing) load();
  };

  const saveSize = async () => {
    if (!sizeForm.code || !sizeForm.name) return toast.error("Nhập mã và tên khổ");
    const payload = {
      code: sizeForm.code, name: sizeForm.name,
      width_cm: sizeForm.width_cm ? num(sizeForm.width_cm) : null,
      height_cm: sizeForm.height_cm ? num(sizeForm.height_cm) : null,
    };
    const res = sizeForm.id
      ? await supabase.from("print_sizes").update(payload).eq("id", sizeForm.id)
      : await supabase.from("print_sizes").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Đã lưu khổ in"); setSizeOpen(false); setSizeForm({ code: "", name: "", width_cm: "", height_cm: "" }); load();
  };

  const removeSize = async (id: string) => {
    if (!confirm("Xóa khổ in này? Giá theo khổ cũng sẽ bị xóa.")) return;
    const { error } = await supabase.from("print_sizes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã xóa"); load();
  };

  const margin = (sale: number, cost: number) => sale - cost;

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Bảng giá theo khổ in</h1>
            <p className="text-sm text-muted-foreground">Giá bán và giá vốn sản xuất định mức cho từng sản phẩm theo khổ, kênh bán và cấp khách hàng</p>
          </div>
          {canManagePrices && (
            <Dialog open={sizeOpen} onOpenChange={(o) => { setSizeOpen(o); if (!o) setSizeForm({ code: "", name: "", width_cm: "", height_cm: "" }); }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Ruler className="h-4 w-4 mr-1" />Quản lý khổ in</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Khổ in</DialogTitle></DialogHeader>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {sizes.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-xs w-20">{s.code}</span>
                      <span className="flex-1">{s.name}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSizeForm({ id: s.id, code: s.code, name: s.name, width_cm: s.width_cm?.toString() ?? "", height_cm: s.height_cm?.toString() ?? "" })}><Pencil className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeSize(s.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <Input placeholder="Mã (vd: 10x15)" value={sizeForm.code} onChange={(e) => setSizeForm({ ...sizeForm, code: e.target.value })} />
                  <Input placeholder="Tên (vd: 10×15 cm)" value={sizeForm.name} onChange={(e) => setSizeForm({ ...sizeForm, name: e.target.value })} />
                  <Input placeholder="Rộng (cm)" type="number" value={sizeForm.width_cm} onChange={(e) => setSizeForm({ ...sizeForm, width_cm: e.target.value })} />
                  <Input placeholder="Cao (cm)" type="number" value={sizeForm.height_cm} onChange={(e) => setSizeForm({ ...sizeForm, height_cm: e.target.value })} />
                </div>
                <DialogFooter><Button onClick={saveSize}>Lưu khổ in</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <div className="w-72">
            <Label>Sản phẩm</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Chọn sản phẩm" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Tabs value={channel} onValueChange={setChannel}>
            <TabsList>
              {CHANNELS.map((c) => <TabsTrigger key={c.value} value={c.value}>{c.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khổ in</TableHead>
                <TableHead className="text-right">Giá vốn SX (VNĐ)</TableHead>
                <TableHead className="text-right">Giá bán gốc (VNĐ)</TableHead>
                <TableHead className="text-right">Lãi gộp</TableHead>
                {tiers.map((t) => <TableHead key={t.id} className="text-right">{t.name}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4 + tiers.length} className="text-center text-muted-foreground py-8">Đang tải...</TableCell></TableRow>
              ) : !productId ? (
                <TableRow><TableCell colSpan={4 + tiers.length} className="text-center text-muted-foreground py-8">Chọn sản phẩm để nhập giá</TableCell></TableRow>
              ) : sizes.map((s) => {
                const base = getPrice(s.id, null);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-right">
                      <PriceCell value={base?.production_cost} disabled={!canManagePrices}
                        onSave={(v) => saveCell(s.id, null, "production_cost", v)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <PriceCell value={base?.sale_price} disabled={!canManagePrices}
                        onSave={(v) => saveCell(s.id, null, "sale_price", v)} />
                    </TableCell>
                    <TableCell className={`text-right font-medium ${(base && margin(base.sale_price, base.production_cost) < 0) ? "text-destructive" : "text-emerald-600"}`}>
                      {base ? margin(base.sale_price, base.production_cost).toLocaleString("vi-VN") : "—"}
                    </TableCell>
                    {tiers.map((t) => {
                      const tp = getPrice(s.id, t.id);
                      return (
                        <TableCell key={t.id} className="text-right">
                          <PriceCell value={tp?.sale_price} disabled={!canManagePrices} placeholder={base?.sale_price?.toLocaleString("vi-VN")}
                            onSave={(v) => saveCell(s.id, t.id, "sale_price", v)} />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
        <p className="text-xs text-muted-foreground">Ô cấp khách để trống sẽ dùng giá bán gốc. Giá vốn sản xuất chỉ admin/kế toán/sale được sửa; nhân viên sản xuất không thấy trang này.</p>
      </div>
    </AppLayout>
  );
}

function PriceCell({ value, onSave, disabled, placeholder }: { value?: number; onSave: (v: number) => void; disabled?: boolean; placeholder?: string }) {
  const [val, setVal] = useState(value?.toString() ?? "");
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setVal(value?.toString() ?? ""); setDirty(false); }, [value]);
  return (
    <div className="flex items-center gap-1 justify-end">
      <Input
        type="number"
        className="h-7 w-28 text-right text-xs"
        value={val}
        placeholder={placeholder ?? "0"}
        disabled={disabled}
        onChange={(e) => { setVal(e.target.value); setDirty(true); }}
        onBlur={() => { if (dirty) { onSave(num(val)); setDirty(false); } }}
        onKeyDown={(e) => { if (e.key === "Enter" && dirty) { onSave(num(val)); setDirty(false); } }}
      />
      {dirty && !disabled && <Save className="h-3 w-3 text-primary" />}
    </div>
  );
}
