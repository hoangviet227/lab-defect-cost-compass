import { num } from "@/lib/utils";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRoles } from "@/hooks/use-roles";

type PO = { id: string; code: string; order_id: string | null; status: "pending" | "in_progress" | "completed" | "cancelled"; start_date: string | null; end_date: string | null; notes: string | null };
const statusLabel: Record<string, string> = { pending: "Chờ", in_progress: "Đang SX", completed: "Hoàn thành", cancelled: "Hủy" };

export default function Production() {
  const { has } = useRoles();
  const canManage = has("admin") || has("production");
  const [rows, setRows] = useState<PO[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<PO | null>(null);

  const load = async () => {
    const [{ data: p }, { data: o }, { data: pr }] = await Promise.all([
      supabase.from("production_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("id,code").order("created_at", { ascending: false }),
      supabase.from("products").select("id,code,name"),
    ]);
    setRows((p ?? []) as PO[]); setOrders(o ?? []); setProducts(pr ?? []);
  };
  useEffect(() => { load(); }, []);

  const openDetail = async (po: PO) => {
    setCurrent(po);
    const { data } = await supabase.from("production_order_items").select("*").eq("production_order_id", po.id);
    setItems(data ?? []); setOpen(true);
  };

  const updateStatus = async (po: PO, status: PO["status"]) => {
    const patch: any = { status };
    if (status === "in_progress" && !po.start_date) patch.start_date = new Date().toISOString().slice(0, 10);
    if (status === "completed" && !po.end_date) patch.end_date = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("production_orders").update(patch).eq("id", po.id);
    if (error) return toast.error(error.message);
    toast.success("Đã cập nhật"); load();
    if (current?.id === po.id) setCurrent({ ...po, ...patch });
  };

  const updateProduced = async (itemId: string, produced: number) => {
    const { error } = await supabase.from("production_order_items").update({ produced_qty: produced }).eq("id", itemId);
    if (error) return toast.error(error.message);
    if (current) openDetail(current);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div><h1 className="text-2xl font-bold">Lệnh sản xuất</h1>
          <p className="text-sm text-muted-foreground">Theo dõi tiến độ sản xuất từ các đơn đã xác nhận.</p></div>

        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Mã</TableHead><TableHead>Đơn hàng</TableHead>
              <TableHead>Bắt đầu</TableHead><TableHead>Kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => openDetail(p)}>
                  <TableCell className="font-mono text-xs">{p.code}</TableCell>
                  <TableCell>{orders.find(o => o.id === p.order_id)?.code ?? "-"}</TableCell>
                  <TableCell>{p.start_date ?? "-"}</TableCell>
                  <TableCell>{p.end_date ?? "-"}</TableCell>
                  <TableCell><Badge>{statusLabel[p.status]}</Badge></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-right space-x-1">
                    {canManage && p.status === "pending" && <Button size="sm" variant="outline" onClick={() => updateStatus(p, "in_progress")}>Bắt đầu</Button>}
                    {canManage && p.status === "in_progress" && <Button size="sm" variant="outline" onClick={() => updateStatus(p, "completed")}>Hoàn thành</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có lệnh</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Lệnh {current?.code}</DialogTitle></DialogHeader>
            <Table>
              <TableHeader><TableRow><TableHead>Sản phẩm</TableHead><TableHead className="w-24">KH</TableHead><TableHead className="w-32">Đã SX</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>{products.find(p => p.id === it.product_id)?.name ?? it.product_id}</TableCell>
                    <TableCell>{it.planned_qty}</TableCell>
                    <TableCell>
                      <Input type="number" defaultValue={it.produced_qty} onBlur={(e) => updateProduced(it.id, num(e.target.value))} disabled={!canManage} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
