import { num } from "@/lib/utils";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Check, Factory, Truck, Printer } from "lucide-react";
import { logActivity } from "@/lib/activity";
import { printHtml, docTemplate } from "@/lib/print";
import { useRoles } from "@/hooks/use-roles";

type Order = {
  id: string; code: string; customer_id: string; tier_id: string | null;
  order_date: string; delivery_date: string | null;
  status: "draft" | "design" | "approved" | "printing" | "packing" | "confirmed" | "in_production" | "delivered" | "cancelled";
  subtotal: number; discount: number; total_amount: number; notes: string | null;
  channel: string;
};
type Line = { id?: string; product_id: string; quantity: number; unit_price: number; width_cm?: number; height_cm?: number; print_size_id?: string | null };

// Quy trình 7 bước: Mới → Thiết kế → Duyệt → In → Đóng gói → Giao → Xong
const WORKFLOW: { status: string; label: string; next?: string; nextLabel?: string }[] = [
  { status: "draft", label: "Mới", next: "design", nextLabel: "Chuyển thiết kế" },
  { status: "design", label: "Thiết kế", next: "approved", nextLabel: "Duyệt file" },
  { status: "approved", label: "Đã duyệt", next: "printing", nextLabel: "Bắt đầu in" },
  { status: "printing", label: "Đang in", next: "packing", nextLabel: "Đóng gói" },
  { status: "packing", label: "Đóng gói", next: "delivered", nextLabel: "Giao hàng" },
  { status: "delivered", label: "Đã giao" },
];
const statusColor: Record<string, string> = {
  draft: "secondary", design: "outline", approved: "default", printing: "default",
  packing: "default", confirmed: "default", in_production: "default",
  delivered: "default", cancelled: "destructive",
};
const statusLabel: Record<string, string> = {
  draft: "Mới", design: "Thiết kế", approved: "Đã duyệt", printing: "Đang in",
  packing: "Đóng gói", confirmed: "Đã xác nhận", in_production: "Đang SX",
  delivered: "Đã giao", cancelled: "Đã hủy",
};
const CHANNELS = [
  { value: "direct", label: "Trực tiếp / Web" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "shopee", label: "Shopee" },
  { value: "lazada", label: "Lazada" },
];

export default function Orders() {
  const { has } = useRoles();
  const canManage = has("admin") || has("sales");
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [sizePrices, setSizePrices] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Order | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [header, setHeader] = useState<Partial<Order>>({ order_date: new Date().toISOString().slice(0, 10), channel: "direct" });

  const load = async () => {
    const [{ data: os }, { data: cs }, { data: ts }, { data: ps }, { data: pp }, { data: sz }, { data: sp }] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("customers").select("id,code,name,tier_id").eq("is_active", true),
      supabase.from("customer_tiers").select("*").order("sort_order"),
      supabase.from("products").select("id,code,name,base_price").eq("is_active", true).order("code"),
      supabase.from("product_prices").select("product_id,tier_id,price"),
      supabase.from("print_sizes").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("product_size_prices").select("product_id,size_id,tier_id,channel,sale_price"),
    ]);
    setOrders((os ?? []) as Order[]);
    setCustomers(cs ?? []); setTiers(ts ?? []); setProducts(ps ?? []); setPrices(pp ?? []);
    setSizes(sz ?? []); setSizePrices(sp ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setCurrent(null); setLines([]);
    setHeader({ order_date: new Date().toISOString().slice(0, 10), discount: 0, channel: "direct" });
    setOpen(true);
  };

  const openEdit = async (o: Order) => {
    setCurrent(o); setHeader(o);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", o.id).order("created_at");
    setLines((data ?? []) as Line[]);
    setOpen(true);
  };

  // Ưu tiên: giá theo khổ (đúng kênh + cấp KH) → giá theo khổ gốc kênh → giá cấp KH cũ → giá cơ bản
  const priceFor = (productId: string, tierId?: string | null, sizeId?: string | null, channel?: string) => {
    const ch = channel ?? header.channel ?? "direct";
    if (sizeId) {
      if (tierId) {
        const sp = sizePrices.find((p) => p.product_id === productId && p.size_id === sizeId && p.tier_id === tierId && p.channel === ch);
        if (sp) return Number(sp.sale_price);
      }
      const spBase = sizePrices.find((p) => p.product_id === productId && p.size_id === sizeId && p.tier_id === null && p.channel === ch);
      if (spBase) return Number(spBase.sale_price);
    }
    if (tierId) {
      const pp = prices.find((p) => p.product_id === productId && p.tier_id === tierId);
      if (pp) return Number(pp.price);
    }
    const p = products.find((x) => x.id === productId);
    return Number(p?.base_price ?? 0);
  };

  const onCustomerChange = (id: string) => {
    const c = customers.find((x) => x.id === id);
    setHeader((h) => ({ ...h, customer_id: id, tier_id: c?.tier_id ?? null }));
    setLines((ls) => ls.map((l) => ({ ...l, unit_price: priceFor(l.product_id, c?.tier_id, l.print_size_id) })));
  };

  const addLine = () => setLines((ls) => [...ls, { product_id: products[0]?.id, print_size_id: null, quantity: 1, unit_price: priceFor(products[0]?.id, header.tier_id) }]);

  const save = async () => {
    if (!header.customer_id) { toast.error("Chọn khách hàng"); return; }
    if (lines.length === 0) { toast.error("Thêm ít nhất 1 dòng"); return; }
    try {
      let orderId = current?.id;
      if (!orderId) {
        const { data: codeData } = await supabase.rpc("next_sequence", {
          _prefix: "DH", _period: new Date().toISOString().slice(0, 7).replace("-", ""), _pad: 4,
        });
        const { data, error } = await supabase.from("orders").insert({
          code: codeData!, customer_id: header.customer_id!, tier_id: header.tier_id ?? null,
          order_date: header.order_date!, delivery_date: header.delivery_date ?? null,
          discount: header.discount ?? 0, notes: header.notes ?? null, status: "draft",
          channel: header.channel ?? "direct",
        }).select().single();
        if (error) throw error;
        orderId = data.id;
      } else {
        const { error } = await supabase.from("orders").update({
          customer_id: header.customer_id!, tier_id: header.tier_id ?? null,
          delivery_date: header.delivery_date ?? null, discount: header.discount ?? 0, notes: header.notes ?? null,
          channel: header.channel ?? "direct",
        }).eq("id", orderId);
        if (error) throw error;
        await supabase.from("order_items").delete().eq("order_id", orderId);
      }
      const rows = lines.map((l) => ({
        order_id: orderId!, product_id: l.product_id, quantity: l.quantity,
        unit_price: l.unit_price, line_total: l.quantity * l.unit_price,
        width_cm: l.width_cm ?? null, height_cm: l.height_cm ?? null,
        print_size_id: l.print_size_id ?? null,
      }));
      const { error: e2 } = await supabase.from("order_items").insert(rows);
      if (e2) throw e2;
      toast.success("Đã lưu đơn");
      setOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
  };

  const confirmOrder = async (id: string) => {
    const { error } = await supabase.rpc("confirm_order", { _order_id: id });
    if (error) return toast.error(error.message);
    await logActivity({ action: "confirm", entity_table: "orders", entity_id: id });
    toast.success("Đã xác nhận đơn"); load();
  };

  const toProduction = async (id: string) => {
    const { error } = await supabase.rpc("create_production_from_order", { _order_id: id });
    if (error) return toast.error(error.message);
    await logActivity({ action: "create_production", entity_table: "orders", entity_id: id });
    toast.success("Đã tạo lệnh sản xuất"); load();
  };

  const markDelivered = async (o: Order) => {
    if (!window.confirm(`Đánh dấu đơn ${o.code} đã giao?`)) return;
    const { error } = await supabase.from("orders").update({ status: "delivered" }).eq("id", o.id);
    if (error) return toast.error(error.message);
    await logActivity({ action: "deliver", entity_table: "orders", entity_id: o.id, before_data: { status: o.status }, after_data: { status: "delivered" } });
    toast.success("Đã chuyển sang Đã giao"); load();
  };

  const advanceStep = async (o: Order) => {
    const step = WORKFLOW.find((w) => w.status === o.status);
    if (!step?.next) return;
    if (!window.confirm(`${step.nextLabel} cho đơn ${o.code}?`)) return;
    const { error } = await supabase.from("orders").update({ status: step.next as any }).eq("id", o.id);
    if (error) return toast.error(error.message);
    await logActivity({ action: "advance_step", entity_table: "orders", entity_id: o.id, before_data: { status: o.status }, after_data: { status: step.next } });
    toast.success(`Đã chuyển: ${step.nextLabel}`); load();
  };

  const printOrder = async (o: Order) => {
    const [{ data: items }, { data: st }] = await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", o.id).order("created_at"),
      supabase.from("app_settings").select("*").maybeSingle(),
    ]);
    const c = customers.find((x) => x.id === o.customer_id);
    printHtml(`Đơn ${o.code}`, docTemplate({
      workshop: {
        name: st?.workshop_name ?? "Xưởng In",
        address: st?.workshop_address,
        phone: st?.workshop_phone,
        tax_code: st?.workshop_tax_code,
      },
      docTitle: "PHIẾU ĐƠN HÀNG",
      code: o.code,
      date: o.order_date,
      party: { name: c?.name, phone: c?.phone, address: c?.address },
      lines: (items ?? []).map((it: any) => {
        const p = products.find((x) => x.id === it.product_id);
        return {
          name: p ? `${p.code} — ${p.name}` : "Sản phẩm",
          spec: [it.width_cm ? `R ${it.width_cm}cm` : "", it.height_cm ? `C ${it.height_cm}cm` : ""].filter(Boolean).join(" × "),
          qty: Number(it.quantity),
          price: Number(it.unit_price),
          total: Number(it.line_total),
        };
      }),
      discount: Number(o.discount ?? 0),
      notes: o.notes,
    }));
  };

  const total = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Đơn hàng</h1>
            <p className="text-sm text-muted-foreground">Tạo đơn, xác nhận và chuyển sang sản xuất.</p></div>
          {canManage && <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Tạo đơn</Button>}
        </div>

        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Mã</TableHead><TableHead>Ngày</TableHead><TableHead>Khách hàng</TableHead>
              <TableHead className="text-right">Tổng</TableHead><TableHead>Trạng thái</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {orders.map((o) => {
                const c = customers.find((x) => x.id === o.customer_id);
                return (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => openEdit(o)}>
                    <TableCell className="font-mono text-xs">{o.code}</TableCell>
                    <TableCell>{o.order_date}</TableCell>
                    <TableCell>{c?.name ?? "-"}</TableCell>
                    <TableCell className="text-right">{Number(o.total_amount).toLocaleString("vi-VN")}</TableCell>
                    <TableCell><Badge variant={statusColor[o.status] as any}>{statusLabel[o.status]}</Badge></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="text-right space-x-1">
                      {(() => { const step = WORKFLOW.find((w) => w.status === o.status); return canManage && step?.next && (
                        <Button size="sm" variant="outline" onClick={() => advanceStep(o)}><Check className="h-3 w-3 mr-1" />{step.nextLabel}</Button>
                      ); })()}
                      {canManage && o.status === "confirmed" && (
                        <Button size="sm" variant="outline" onClick={() => toProduction(o.id)}><Factory className="h-3 w-3 mr-1" />Sản xuất</Button>
                      )}
                      {canManage && (o.status === "confirmed" || o.status === "in_production") && (
                        <Button size="sm" variant="outline" onClick={() => markDelivered(o)}><Truck className="h-3 w-3 mr-1" />Đã giao</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => printOrder(o)}><Printer className="h-3 w-3 mr-1" />In</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {orders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có đơn</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{current ? `Đơn ${current.code}` : "Tạo đơn mới"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Khách hàng</Label>
                <Select value={header.customer_id ?? ""} onValueChange={onCustomerChange} disabled={current?.status !== "draft" && !!current}>
                  <SelectTrigger><SelectValue placeholder="Chọn KH" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Cấp giá</Label>
                <div className="h-10 px-3 flex items-center text-sm border rounded-md">{tiers.find(t => t.id === header.tier_id)?.name ?? "Mặc định"}</div>
              </div>
              <div><Label>Kênh bán</Label>
                <Select value={header.channel ?? "direct"} onValueChange={(v) => { setHeader({ ...header, channel: v }); setLines((ls) => ls.map((l) => ({ ...l, unit_price: priceFor(l.product_id, header.tier_id, l.print_size_id, v) }))); }} disabled={current?.status !== "draft" && !!current}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CHANNELS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Ngày đặt</Label><Input type="date" value={header.order_date ?? ""} onChange={(e) => setHeader({ ...header, order_date: e.target.value })} /></div>
              <div><Label>Ngày giao</Label><Input type="date" value={header.delivery_date ?? ""} onChange={(e) => setHeader({ ...header, delivery_date: e.target.value })} /></div>
              <div><Label>Chiết khấu</Label><Input type="number" value={header.discount ?? 0} onChange={(e) => setHeader({ ...header, discount: num(e.target.value) })} /></div>
              <div className="col-span-2"><Label>Ghi chú</Label><Input value={header.notes ?? ""} onChange={(e) => setHeader({ ...header, notes: e.target.value })} /></div>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <Label>Dòng sản phẩm</Label>
                {(current?.status ?? "draft") === "draft" && <Button size="sm" variant="outline" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Thêm</Button>}
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Sản phẩm</TableHead><TableHead className="w-36">Khổ in</TableHead><TableHead className="w-20">SL</TableHead>
                  <TableHead className="w-28">Đơn giá</TableHead><TableHead className="text-right w-32">Thành tiền</TableHead><TableHead className="w-10"></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {lines.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Select value={l.product_id} onValueChange={(v) => {
                          const np = [...lines]; np[i].product_id = v; np[i].unit_price = priceFor(v, header.tier_id, np[i].print_size_id); setLines(np);
                        }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={l.print_size_id ?? "none"} onValueChange={(v) => {
                          const sid = v === "none" ? null : v;
                          const np = [...lines]; np[i].print_size_id = sid;
                          np[i].unit_price = priceFor(np[i].product_id, header.tier_id, sid);
                          setLines(np);
                        }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">— Tự do —</SelectItem>
                            {sizes.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input type="number" value={l.quantity} onChange={(e) => { const np = [...lines]; np[i].quantity = num(e.target.value); setLines(np); }} /></TableCell>
                      <TableCell><Input type="number" value={l.unit_price} onChange={(e) => { const np = [...lines]; np[i].unit_price = num(e.target.value); setLines(np); }} /></TableCell>
                      <TableCell className="text-right">{(l.quantity * l.unit_price).toLocaleString("vi-VN")}</TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => setLines(lines.filter((_, x) => x !== i))}><Trash2 className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-2 gap-4 text-sm">
                <span className="text-muted-foreground">Tạm tính:</span><span className="font-semibold">{total.toLocaleString("vi-VN")}</span>
              </div>
            </div>
            <DialogFooter>
              {(current?.status ?? "draft") === "draft" && <Button onClick={save}>Lưu</Button>}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
