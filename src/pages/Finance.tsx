import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/use-roles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";
import { Plus, CheckCircle2 } from "lucide-react";

const fmt = (n: number) => Number(n || 0).toLocaleString("vi-VN");

export default function Finance() {
  const { has } = useRoles();
  const canManage = has("admin") || has("accountant");

  const [accounts, setAccounts] = useState<any[]>([]);
  const [txns, setTxns] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [cDebts, setCDebts] = useState<any[]>([]);
  const [sDebts, setSDebts] = useState<any[]>([]);

  const [accOpen, setAccOpen] = useState(false);
  const [accForm, setAccForm] = useState<any>({ code: "", name: "", kind: "cash", opening_balance: 0 });

  const [txnOpen, setTxnOpen] = useState(false);
  const [txnForm, setTxnForm] = useState<any>({
    txn_type: "receipt", category: "sales", txn_date: new Date().toISOString().slice(0, 10),
    cash_account_id: "", amount: 0, customer_id: "", supplier_id: "", notes: "",
  });

  const loadAll = async () => {
    const [{ data: a }, { data: t }, { data: c }, { data: s }, { data: cd }, { data: sd }] = await Promise.all([
      supabase.from("cash_accounts").select("*").order("code"),
      supabase.from("finance_transactions").select("*").order("txn_date", { ascending: false }).limit(200),
      supabase.from("customers").select("id,code,name").order("name"),
      supabase.from("suppliers").select("id,code,name").order("name"),
      supabase.from("v_customer_debts").select("*").order("balance", { ascending: false }),
      supabase.from("v_supplier_debts").select("*").order("balance", { ascending: false }),
    ]);
    setAccounts(a ?? []); setTxns(t ?? []);
    setCustomers(c ?? []); setSuppliers(s ?? []);
    setCDebts(cd ?? []); setSDebts(sd ?? []);
  };
  useEffect(() => { loadAll(); }, []);

  const saveAccount = async () => {
    if (!accForm.code || !accForm.name) return toast.error("Nhập mã và tên tài khoản");
    const { error } = await supabase.from("cash_accounts").insert({
      ...accForm,
      opening_balance: Number(accForm.opening_balance) || 0,
      current_balance: Number(accForm.opening_balance) || 0,
    });
    if (error) return toast.error(error.message);
    toast.success("Đã tạo tài khoản");
    setAccOpen(false); setAccForm({ code: "", name: "", kind: "cash", opening_balance: 0 });
    loadAll();
  };

  const saveTxn = async () => {
    if (!txnForm.cash_account_id) return toast.error("Chọn tài khoản");
    if (!(Number(txnForm.amount) > 0)) return toast.error("Nhập số tiền");
    const prefix = txnForm.txn_type === "receipt" ? "PT" : "PC";
    const { data: seq, error: seqErr } = await supabase.rpc("next_sequence", {
      _prefix: prefix, _period: new Date().toISOString().slice(0, 7).replace("-", ""), _pad: 4,
    });
    if (seqErr) return toast.error(seqErr.message);
    const payload: any = {
      code: seq, txn_type: txnForm.txn_type, category: txnForm.category,
      txn_date: txnForm.txn_date, cash_account_id: txnForm.cash_account_id,
      amount: Number(txnForm.amount), notes: txnForm.notes || null, status: "draft",
      customer_id: txnForm.customer_id || null, supplier_id: txnForm.supplier_id || null,
    };
    const { error } = await supabase.from("finance_transactions").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Đã tạo phiếu");
    setTxnOpen(false);
    setTxnForm({ ...txnForm, amount: 0, notes: "", customer_id: "", supplier_id: "" });
    loadAll();
  };

  const confirmTxn = async (id: string) => {
    const { error } = await supabase.rpc("confirm_finance_transaction", { _txn_id: id });
    if (error) return toast.error(error.message);
    await logActivity({ action: "confirm", entity_table: "finance_transactions", entity_id: id });
    toast.success("Đã xác nhận"); loadAll();
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold">Thu chi & Công nợ</h1>
            <p className="text-sm text-muted-foreground">Quản lý quỹ, phiếu thu/chi và công nợ khách hàng, nhà cung cấp.</p>
          </div>
        </div>

        <Tabs defaultValue="txns">
          <TabsList>
            <TabsTrigger value="txns">Phiếu thu/chi</TabsTrigger>
            <TabsTrigger value="accounts">Quỹ / Tài khoản</TabsTrigger>
            <TabsTrigger value="cdebt">Công nợ khách</TabsTrigger>
            <TabsTrigger value="sdebt">Công nợ NCC</TabsTrigger>
          </TabsList>

          <TabsContent value="txns" className="space-y-3">
            {canManage && (
              <Dialog open={txnOpen} onOpenChange={setTxnOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" />Tạo phiếu</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Phiếu thu/chi</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Loại</Label>
                      <Select value={txnForm.txn_type} onValueChange={(v) => setTxnForm({ ...txnForm, txn_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="receipt">Phiếu thu</SelectItem>
                          <SelectItem value="payment">Phiếu chi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Ngày</Label>
                      <Input type="date" value={txnForm.txn_date} onChange={(e) => setTxnForm({ ...txnForm, txn_date: e.target.value })} />
                    </div>
                    <div><Label>Tài khoản quỹ</Label>
                      <Select value={txnForm.cash_account_id} onValueChange={(v) => setTxnForm({ ...txnForm, cash_account_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Chọn quỹ" /></SelectTrigger>
                        <SelectContent>
                          {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Số tiền</Label>
                      <Input type="number" value={txnForm.amount} onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })} />
                    </div>
                    <div><Label>Danh mục</Label>
                      <Select value={txnForm.category} onValueChange={(v) => setTxnForm({ ...txnForm, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Bán hàng</SelectItem>
                          <SelectItem value="purchase">Mua hàng</SelectItem>
                          <SelectItem value="salary">Lương</SelectItem>
                          <SelectItem value="other">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {txnForm.txn_type === "receipt" ? (
                      <div><Label>Khách hàng</Label>
                        <Select value={txnForm.customer_id} onValueChange={(v) => setTxnForm({ ...txnForm, customer_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Không bắt buộc" /></SelectTrigger>
                          <SelectContent>
                            {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div><Label>Nhà cung cấp</Label>
                        <Select value={txnForm.supplier_id} onValueChange={(v) => setTxnForm({ ...txnForm, supplier_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Không bắt buộc" /></SelectTrigger>
                          <SelectContent>
                            {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="col-span-2"><Label>Ghi chú</Label>
                      <Textarea value={txnForm.notes} onChange={(e) => setTxnForm({ ...txnForm, notes: e.target.value })} />
                    </div>
                  </div>
                  <Button onClick={saveTxn}>Lưu phiếu (nháp)</Button>
                </DialogContent>
              </Dialog>
            )}

            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Mã</TableHead><TableHead>Ngày</TableHead><TableHead>Loại</TableHead>
                  <TableHead>Danh mục</TableHead><TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {txns.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.code}</TableCell>
                      <TableCell>{t.txn_date}</TableCell>
                      <TableCell>{t.txn_type === "receipt" ? "Thu" : "Chi"}</TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell className={`text-right font-semibold ${t.txn_type === "receipt" ? "text-emerald-500" : "text-destructive"}`}>
                        {t.txn_type === "receipt" ? "+" : "-"}{fmt(t.amount)}
                      </TableCell>
                      <TableCell><Badge variant={t.status === "confirmed" ? "default" : "secondary"}>{t.status}</Badge></TableCell>
                      <TableCell>
                        {canManage && t.status === "draft" && (
                          <Button size="sm" variant="outline" onClick={() => confirmTxn(t.id)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" />Xác nhận
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-3">
            {canManage && (
              <Dialog open={accOpen} onOpenChange={setAccOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" />Thêm tài khoản</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Tài khoản quỹ</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Mã</Label>
                      <Input value={accForm.code} onChange={(e) => setAccForm({ ...accForm, code: e.target.value })} /></div>
                    <div><Label>Tên</Label>
                      <Input value={accForm.name} onChange={(e) => setAccForm({ ...accForm, name: e.target.value })} /></div>
                    <div><Label>Loại</Label>
                      <Select value={accForm.kind} onValueChange={(v) => setAccForm({ ...accForm, kind: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Tiền mặt</SelectItem>
                          <SelectItem value="bank">Ngân hàng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Số dư đầu</Label>
                      <Input type="number" value={accForm.opening_balance} onChange={(e) => setAccForm({ ...accForm, opening_balance: e.target.value })} /></div>
                  </div>
                  <Button onClick={saveAccount}>Lưu</Button>
                </DialogContent>
              </Dialog>
            )}
            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Mã</TableHead><TableHead>Tên</TableHead><TableHead>Loại</TableHead>
                  <TableHead className="text-right">Số dư</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {accounts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.code}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.kind === "cash" ? "Tiền mặt" : "Ngân hàng"}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(a.current_balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="cdebt">
            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Mã</TableHead><TableHead>Khách hàng</TableHead>
                  <TableHead className="text-right">Tổng đơn</TableHead>
                  <TableHead className="text-right">Đã thu</TableHead>
                  <TableHead className="text-right">Còn nợ</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {cDebts.map((d) => (
                    <TableRow key={d.customer_id}>
                      <TableCell className="font-mono text-xs">{d.code}</TableCell>
                      <TableCell>{d.name}</TableCell>
                      <TableCell className="text-right">{fmt(d.total_orders)}</TableCell>
                      <TableCell className="text-right">{fmt(d.total_paid)}</TableCell>
                      <TableCell className={`text-right font-semibold ${Number(d.balance) > 0 ? "text-destructive" : ""}`}>{fmt(d.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="sdebt">
            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Mã</TableHead><TableHead>Nhà cung cấp</TableHead>
                  <TableHead className="text-right">Tổng nhập</TableHead>
                  <TableHead className="text-right">Đã trả</TableHead>
                  <TableHead className="text-right">Còn nợ</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {sDebts.map((d) => (
                    <TableRow key={d.supplier_id}>
                      <TableCell className="font-mono text-xs">{d.code}</TableCell>
                      <TableCell>{d.name}</TableCell>
                      <TableCell className="text-right">{fmt(d.total_purchases)}</TableCell>
                      <TableCell className="text-right">{fmt(d.total_paid)}</TableCell>
                      <TableCell className={`text-right font-semibold ${Number(d.balance) > 0 ? "text-destructive" : ""}`}>{fmt(d.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
