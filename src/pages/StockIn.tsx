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
import { Plus, Trash2, Check } from "lucide-react";
import { useRoles } from "@/hooks/use-roles";

type Receipt = {
  id: string; code: string; supplier_id: string | null; warehouse_id: string;
  receipt_date: string; status: "draft" | "confirmed" | "cancelled"; total_amount: number; notes: string | null;
};
type Line = { id?: string; material_id: string; quantity: number; unit_cost: number; _tmp?: boolean };

export default function StockIn() {
  const { canManageStock } = useRoles();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Receipt | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [header, setHeader] = useState<Partial<Receipt>>({ receipt_date: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    const [{ data: rs }, { data: sp }, { data: ws }, { data: ms }] = await Promise.all([
      supabase.from("purchase_receipts").select("*").order("created_at", { ascending: false }),
      supabase.from("suppliers").select("id,code,name"),
      supabase.from("warehouses").select("id,code,name").eq("is_active", true),
      supabase.from("materials").select("id,code,name,unit").eq("is_active", true).order("code"),
    ]);
    setReceipts((rs ?? []) as Receipt[]);
    setSuppliers(sp ?? []); setWarehouses(ws ?? []); setMaterials(ms ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setCurrent(null); setLines([]);
    setHeader({ receipt_date: new Date().toISOString().slice(0, 10), warehouse_id: warehouses[0]?.id });
    setOpen(true);
  };

  const openEdit = async (r: Receipt) => {
    setCurrent(r); setHeader(r);
    const { data } = await supabase.from("purchase_receipt_items").select("*").eq("receipt_id", r.id);
    setLines((data ?? []) as Line[]); setOpen(true);
  };

  const addLine = () => setLines([...lines, { material_id: materials[0]?.id, quantity: 1, unit_cost: 0, _tmp: true }]);
  const updateLine = (i: number, patch: Partial<Line>) => setLines(lines.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  const genCode = async () => {
    const period = new Date().toISOString().slice(0, 7).replace("-", "");
    const { data, error } = await supabase.rpc("next_sequence", { _prefix: "PN", _period: period, _pad: 4 });
    if (error) throw error;
    return data as string;
  };

  const save = async () => {
    if (!header.warehouse_id) return toast.error("Chọn kho");
    if (lines.length === 0) return toast.error("Thêm ít nhất một dòng");
    for (const l of lines) if (!l.material_id || !(l.quantity > 0)) return toast.error("Dòng không hợp lệ");

    let receiptId = current?.id;
    if (!receiptId) {
      const code = await genCode();
      const { data, error } = await supabase.from("purchase_receipts").insert({
        code, supplier_id: header.supplier_id || null, warehouse_id: header.warehouse_id,
        receipt_date: header.receipt_date, notes: header.notes || null,
      }).select().single();
      if (error) return toast.error(error.message);
      receiptId = data.id;
    } else {
      const { error } = await supabase.from("purchase_receipts").update({
        supplier_id: header.supplier_id || null, warehouse_id: header.warehouse_id,
        receipt_date: header.receipt_date, notes: header.notes || null,
      }).eq("id", receiptId);
      if (error) return toast.error(error.message);
      await supabase.from("purchase_receipt_items").delete().eq("receipt_id", receiptId);
    }
    const { error: liErr } = await supabase.from("purchase_receipt_items").insert(
      lines.map((l) => ({ receipt_id: receiptId!, material_id: l.material_id, quantity: l.quantity, unit_cost: l.unit_cost }))
    );
    if (liErr) return toast.error(liErr.message);
    toast.success("Đã lưu phiếu nhập"); setOpen(false); load();
  };

  const confirm = async (r: Receipt) => {
    if (!confirm_(`Xác nhận phiếu ${r.code}? Tồn kho và giá vốn sẽ được cập nhật.`)) return;
    const { error } = await supabase.rpc("confirm_purchase_receipt", { _receipt_id: r.id });
    if (error) return toast.error(error.message);
    toast.success("Đã xác nhận phiếu nhập"); load();
  };
  const confirm_ = (m: string) => window.confirm(m);

  const total = lines.reduce((s, l) => s + (l.quantity || 0) * (l.unit_cost || 0), 0);

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Nhập kho</h1>
            <p className="text-sm text-muted-foreground">Phiếu nhập vật tư từ nhà cung cấp</p>
          </div>
          {canManageStock && <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Phiếu mới</Button>}
        </div>

        <Card>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Mã phiếu</TableHead><TableHead>Ngày</TableHead><TableHead>Nhà cung cấp</TableHead>
              <TableHead>Kho</TableHead><TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead><TableHead className="w-32"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {receipts.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Chưa có phiếu</TableCell></TableRow>
              ) : receipts.map((r) => {
                const sup = suppliers.find((s) => s.id === r.supplier_id);
                const w = warehouses.find((x) => x.id === r.warehouse_id);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell>{r.receipt_date}</TableCell>
                    <TableCell>{sup?.name || "—"}</TableCell>
                    <TableCell>{w?.name || "—"}</TableCell>
                    <TableCell className="text-right">{r.total_amount?.toLocaleString("vi-VN")}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "confirmed" ? "default" : r.status === "cancelled" ? "destructive" : "secondary"}>
                        {r.status === "draft" ? "Nháp" : r.status === "confirmed" ? "Đã xác nhận" : "Đã hủy"}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-1">
                      {r.status === "draft" && canManageStock && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Sửa</Button>
                          <Button size="sm" onClick={() => confirm(r)}><Check className="h-3 w-3 mr-1" />Xác nhận</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>{current ? `Phiếu ${current.code}` : "Phiếu nhập mới"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Ngày</Label><Input type="date" value={header.receipt_date} onChange={(e) => setHeader({ ...header, receipt_date: e.target.value })} /></div>
              <div><Label>Nhà cung cấp</Label>
                <Select value={header.supplier_id || "none"} onValueChange={(v) => setHeader({ ...header, supplier_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn NCC" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Không —</SelectItem>
                    {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Kho *</Label>
                <Select value={header.warehouse_id} onValueChange={(v) => setHeader({ ...header, warehouse_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn kho" /></SelectTrigger>
                  <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Dòng vật tư</h3>
                <Button size="sm" variant="outline" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Thêm dòng</Button>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Vật tư</TableHead><TableHead className="w-28">SL</TableHead>
                  <TableHead className="w-32">Đơn giá</TableHead><TableHead className="w-32 text-right">Thành tiền</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {lines.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Select value={l.material_id} onValueChange={(v) => updateLine(i, { material_id: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.code} — {m.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input type="number" step="0.001" value={l.quantity} onChange={(e) => updateLine(i, { quantity: num(e.target.value) })} /></TableCell>
                      <TableCell><Input type="number" value={l.unit_cost} onChange={(e) => updateLine(i, { unit_cost: num(e.target.value) })} /></TableCell>
                      <TableCell className="text-right">{(l.quantity * l.unit_cost).toLocaleString("vi-VN")}</TableCell>
                      <TableCell><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeLine(i)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {lines.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">Chưa có dòng nào</TableCell></TableRow>}
                </TableBody>
              </Table>
              <div className="text-right mt-2 text-sm">Tổng: <b>{total.toLocaleString("vi-VN")} đ</b></div>
            </div>

            <div><Label>Ghi chú</Label><Input value={header.notes || ""} onChange={(e) => setHeader({ ...header, notes: e.target.value })} /></div>
            <DialogFooter><Button onClick={save}>Lưu nháp</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
