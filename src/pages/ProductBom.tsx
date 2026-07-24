import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { useRoles } from "@/hooks/use-roles";

type Product = { id: string; code: string; name: string; base_price: number };
type Bom = { id: string; material_id: string; quantity: number; waste_pct: number; notes: string | null };
type Material = { id: string; code: string; name: string; unit: string; avg_cost: number };
type Tier = { id: string; code: string; name: string; default_discount_pct: number };
type Price = { id?: string; tier_id: string; price: number; discount_pct: number };

export default function ProductBom() {
  const { id } = useParams<{ id: string }>();
  const { canManageProducts, canManagePrices } = useRoles();
  const [product, setProduct] = useState<Product | null>(null);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [newBom, setNewBom] = useState<Partial<Bom>>({ quantity: 1, waste_pct: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: p }, { data: b }, { data: m }, { data: t }, { data: pr }] = await Promise.all([
      supabase.from("products").select("id,code,name,base_price").eq("id", id).maybeSingle(),
      supabase.from("product_bom").select("*").eq("product_id", id),
      supabase.from("materials").select("id,code,name,unit,avg_cost").eq("is_active", true).order("code"),
      supabase.from("customer_tiers").select("id,code,name,default_discount_pct").order("sort_order"),
      supabase.from("product_prices").select("*").eq("product_id", id),
    ]);
    setProduct(p as Product);
    setBoms((b ?? []) as Bom[]);
    setMaterials((m ?? []) as Material[]);
    setTiers((t ?? []) as Tier[]);
    // build price rows for every tier (fill defaults)
    const existing = (pr ?? []) as Price[];
    const merged = (t ?? []).map((tier: any) => {
      const found = existing.find((x) => x.tier_id === tier.id);
      return found || { tier_id: tier.id, price: (p as any)?.base_price ?? 0, discount_pct: tier.default_discount_pct ?? 0 };
    });
    setPrices(merged);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const addBom = async () => {
    if (!newBom.material_id) return toast.error("Chọn vật tư");
    const { error } = await supabase.from("product_bom").insert({
      product_id: id, material_id: newBom.material_id, quantity: newBom.quantity ?? 1,
      waste_pct: newBom.waste_pct ?? 0, notes: newBom.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Đã thêm định mức"); setNewBom({ quantity: 1, waste_pct: 0 }); load();
  };
  const updateBom = async (b: Bom, patch: Partial<Bom>) => {
    const { error } = await supabase.from("product_bom").update(patch).eq("id", b.id);
    if (error) return toast.error(error.message);
    setBoms(boms.map((x) => x.id === b.id ? { ...x, ...patch } : x));
  };
  const delBom = async (bid: string) => {
    if (!confirm("Xóa dòng định mức?")) return;
    const { error } = await supabase.from("product_bom").delete().eq("id", bid);
    if (error) return toast.error(error.message);
    load();
  };

  const savePrices = async () => {
    const rows = prices.map((p) => ({ product_id: id, tier_id: p.tier_id, price: p.price, discount_pct: p.discount_pct }));
    const { error } = await supabase.from("product_prices").upsert(rows, { onConflict: "product_id,tier_id" });
    if (error) return toast.error(error.message);
    toast.success("Đã lưu bảng giá"); load();
  };

  const cost = boms.reduce((s, b) => {
    const m = materials.find((mm) => mm.id === b.material_id);
    if (!m) return s;
    return s + m.avg_cost * b.quantity * (1 + (b.waste_pct || 0) / 100);
  }, 0);

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild><Link to="/products"><ArrowLeft className="h-4 w-4 mr-1" />Sản phẩm</Link></Button>
        </div>
        {loading ? <p className="text-sm text-muted-foreground">Đang tải...</p> : !product ? (
          <p className="text-sm text-muted-foreground">Không tìm thấy sản phẩm</p>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <p className="text-sm text-muted-foreground font-mono">{product.code}</p>
            </div>

            <Tabs defaultValue="bom">
              <TabsList>
                <TabsTrigger value="bom">Định mức (BOM)</TabsTrigger>
                <TabsTrigger value="prices">Bảng giá theo cấp KH</TabsTrigger>
              </TabsList>

              <TabsContent value="bom" className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Giá vốn ước tính: <span className="font-semibold text-foreground">{cost.toLocaleString("vi-VN")} VNĐ</span></p>
                </div>
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vật tư</TableHead><TableHead>ĐV</TableHead>
                        <TableHead className="text-right">SL</TableHead>
                        <TableHead className="text-right">% hao hụt</TableHead>
                        <TableHead className="text-right">Giá vốn/SP</TableHead>
                        {canManageProducts && <TableHead className="w-10"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boms.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Chưa có định mức</TableCell></TableRow>
                      ) : boms.map((b) => {
                        const m = materials.find((x) => x.id === b.material_id);
                        const c = m ? m.avg_cost * b.quantity * (1 + (b.waste_pct || 0) / 100) : 0;
                        return (
                          <TableRow key={b.id}>
                            <TableCell>{m ? `${m.code} — ${m.name}` : "?"}</TableCell>
                            <TableCell>{m?.unit}</TableCell>
                            <TableCell className="text-right">
                              {canManageProducts ? (
                                <Input type="number" step="0.001" value={b.quantity} className="h-7 w-24 text-right ml-auto"
                                  onChange={(e) => setBoms(boms.map((x) => x.id === b.id ? { ...x, quantity: +e.target.value } : x))}
                                  onBlur={(e) => updateBom(b, { quantity: +e.target.value })} />
                              ) : b.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {canManageProducts ? (
                                <Input type="number" step="0.1" value={b.waste_pct} className="h-7 w-20 text-right ml-auto"
                                  onChange={(e) => setBoms(boms.map((x) => x.id === b.id ? { ...x, waste_pct: +e.target.value } : x))}
                                  onBlur={(e) => updateBom(b, { waste_pct: +e.target.value })} />
                              ) : `${b.waste_pct}%`}
                            </TableCell>
                            <TableCell className="text-right">{c.toLocaleString("vi-VN")}</TableCell>
                            {canManageProducts && (
                              <TableCell><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => delBom(b.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>

                {canManageProducts && (
                  <Card className="p-3">
                    <div className="flex items-end gap-2 flex-wrap">
                      <div className="flex-1 min-w-52">
                        <label className="text-xs text-muted-foreground">Vật tư</label>
                        <Select value={newBom.material_id || ""} onValueChange={(v) => setNewBom({ ...newBom, material_id: v })}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Chọn vật tư..." /></SelectTrigger>
                          <SelectContent>{materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.code} — {m.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="w-28"><label className="text-xs text-muted-foreground">SL</label><Input type="number" step="0.001" value={newBom.quantity ?? 1} onChange={(e) => setNewBom({ ...newBom, quantity: +e.target.value })} /></div>
                      <div className="w-24"><label className="text-xs text-muted-foreground">% hao</label><Input type="number" step="0.1" value={newBom.waste_pct ?? 0} onChange={(e) => setNewBom({ ...newBom, waste_pct: +e.target.value })} /></div>
                      <Button onClick={addBom}><Plus className="h-4 w-4 mr-1" />Thêm</Button>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="prices" className="space-y-3">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cấp khách</TableHead>
                        <TableHead className="text-right">Giá bán</TableHead>
                        <TableHead className="text-right">% Chiết khấu</TableHead>
                        <TableHead className="text-right">Giá sau CK</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiers.map((t) => {
                        const idx = prices.findIndex((p) => p.tier_id === t.id);
                        const p = prices[idx];
                        if (!p) return null;
                        const finalPrice = p.price * (1 - (p.discount_pct || 0) / 100);
                        return (
                          <TableRow key={t.id}>
                            <TableCell>{t.name}</TableCell>
                            <TableCell className="text-right">
                              {canManagePrices ? (
                                <Input type="number" value={p.price} className="h-8 w-32 text-right ml-auto"
                                  onChange={(e) => { const c = [...prices]; c[idx] = { ...p, price: +e.target.value }; setPrices(c); }} />
                              ) : p.price.toLocaleString("vi-VN")}
                            </TableCell>
                            <TableCell className="text-right">
                              {canManagePrices ? (
                                <Input type="number" step="0.1" value={p.discount_pct} className="h-8 w-24 text-right ml-auto"
                                  onChange={(e) => { const c = [...prices]; c[idx] = { ...p, discount_pct: +e.target.value }; setPrices(c); }} />
                              ) : `${p.discount_pct}%`}
                            </TableCell>
                            <TableCell className="text-right font-semibold">{finalPrice.toLocaleString("vi-VN")}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
                {canManagePrices && <Button onClick={savePrices}><Save className="h-4 w-4 mr-1" />Lưu bảng giá</Button>}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
}
