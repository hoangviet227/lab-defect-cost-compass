import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Check } from "lucide-react";
import { useRoles } from "@/hooks/use-roles";

type Issue = { id: string; code: string; warehouse_id: string; production_order_id: string | null; status: "draft" | "confirmed" | "cancelled"; total_amount: number; notes: string | null };
type Line = { id?: string; material_id: string; quantity: number };

export default function StockOut() {
  const { canManageStock } = useRoles();
  const [rows, setRows] = useState<Issue[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Issue | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [header, setHeader] = useState<Partial<Issue>>({});

  const load = async () => {
    const [{ data: rs }, { data: ws }, { data: ms }, { data: po }] = await Promise.all([
      supabase.from("stock_issues").select("*").order("created_at", { ascending: false }),
      supabase.from("warehouses").select("id,code,name").eq("is_active", true),
      supabase.from("materials").select("id,code,name,unit,avg_cost").eq("is_active", true).order("code"),
      supabase.from("production_orders").select("id,code").order("created_at", { ascending: false }),
    ]);
    setRows((rs ?? []) as Issue[]); setWarehouses(ws ?? []); setMaterials(ms ?? []); setPos(po ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setCurrent(null); setLines([]); setHeader({ warehouse_id: warehouses[0]?.id }); setOpen(true); };
  const openEdit = async (i: Issue) => {
    setCurrent(i); setHeader(i);
    const { data } = await supabase.from("stock_issue_items").select("*").eq("stock_issue_id", i.id);
    setLines((data ?? []) as Line[]); setOpen(true);
  };

  const addLine = () => setLines((ls) => [...ls, { material_id: materials[0]?.id, quantity: 1 }]);

  const save = async () => {
    if (!header.warehouse_id || lines.length === 0) return toast.error("Thiếu dữ liệu");
    try {
      let id = current?.id;
      if (!id) {
        const { data: code } = await supabase.rpc("next_sequence", { _prefix: "XK", _period: new Date().toISOString().slice(0, 7).replace("-", ""), _pad: 4 });
        const { data, error } = await supabase.from("stock_issues").insert({
          code: code!, warehouse_id: header.warehouse_id!, production_order_id: header.production_order_id ?? null,
          notes: header.notes ?? null, status: "draft",
        }).select().single();
        if (error) throw error; id = data.id;
      } else {
        await supabase.from("stock_issues").update({
          warehouse_id: header.warehouse_id!, production_order_id: header.production_order_id ?? null, notes: header.notes ?? null,
        }).eq("id", id);
        await supabase.from("stock_issue_items").delete().eq("stock_issue_id", id);
      }
      const { error: e2 } = await supabase.from("stock_issue_items").insert(lines.map((l) => ({
        stock_issue_id: id!, material_id: l.material_id, quantity: l.quantity,
      })));
      if (e2) throw e2;
      toast.success("Đã lưu phiếu xuất"); setOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
  };

  const confirmIssue = async (id: string) => {
    const { error } = await supabase.rpc("confirm_stock_issue", { _issue_id: id });
    if (error) return toast.error(error.message);
    toast.success("Đã xác nhận xuất kho"); load();
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Xuất kho</h1>
            <p className="text-sm text-muted-foreground">Xuất vật tư cho sản xuất, trừ tồn theo giá vốn bình quân.</p></div>
          {canManageStock && <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Tạo phiếu</Button>}
        </div>

        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Mã</TableHead><TableHead>Kho</TableHead><TableHead>LSX</TableHead>
              <TableHead className="text-right">Giá trị</TableHead><TableHead>Trạng thái</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => openEdit(r)}>
                  <TableCell className="font-mono text-xs">{r.code}</TableCell>
                  <TableCell>{warehouses.find(w => w.id === r.warehouse_id)?.name}</TableCell>
                  <TableCell>{pos.find(p => p.id === r.production_order_id)?.code ?? "-"}</TableCell>
                  <TableCell className="text-right">{Number(r.total_amount).toLocaleString("vi-VN")}</TableCell>
                  <TableCell><Badge variant={r.status === "confirmed" ? "default" : "secondary"}>{r.status === "confirmed" ? "Đã xuất" : "Nháp"}</Badge></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                    {canManageStock && r.status === "draft" && <Button size="sm" variant="outline" onClick={() => confirmIssue(r.id)}><Check className="h-3 w-3 mr-1" />Xác nhận</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có phiếu</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{current ? `Phiếu ${current.code}` : "Tạo phiếu xuất"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kho</Label>
                <Select value={header.warehouse_id ?? ""} onValueChange={(v) => setHeader({ ...header, warehouse_id: v })} disabled={current?.status === "confirmed"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Lệnh sản xuất</Label>
                <Select value={header.production_order_id ?? ""} onValueChange={(v) => setHeader({ ...header, production_order_id: v })} disabled={current?.status === "confirmed"}>
                  <SelectTrigger><SelectValue placeholder="Không" /></SelectTrigger>
                  <SelectContent>{pos.map((p) => <SelectItem key={p.id} value={p.id}>{p.code}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Ghi chú</Label><Input value={header.notes ?? ""} onChange={(e) => setHeader({ ...header, notes: e.target.value })} /></div>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <Label>Vật tư xuất</Label>
                {(current?.status ?? "draft") === "draft" && <Button size="sm" variant="outline" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Thêm</Button>}
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Vật tư</TableHead><TableHead className="w-24">SL</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {lines.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Select value={l.material_id} onValueChange={(v) => { const np = [...lines]; np[i].material_id = v; setLines(np); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.code} — {m.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input type="number" value={l.quantity} onChange={(e) => { const np = [...lines]; np[i].quantity = Number(e.target.value); setLines(np); }} /></TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => setLines(lines.filter((_, x) => x !== i))}><Trash2 className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>{(current?.status ?? "draft") === "draft" && <Button onClick={save}>Lưu</Button>}</DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
