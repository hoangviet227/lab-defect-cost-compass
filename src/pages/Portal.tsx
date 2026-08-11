import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/hooks/use-roles";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, LogOut, Plus, Upload, Trash2, ExternalLink } from "lucide-react";
import { StackedLogo } from "@/components/StackedLogo";

export default function Portal() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { has, loading: rolesLoading } = useRoles();
  const [customer, setCustomer] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: cust } = await supabase.from("customers").select("*").eq("user_id", user.id).maybeSingle();
    setCustomer(cust);
    if (cust) {
      const { data: os } = await supabase.from("orders").select("*").eq("customer_id", cust.id).order("created_at", { ascending: false });
      setOrders(os ?? []);
    }
    const { data: ps } = await supabase.from("products").select("*").eq("is_active", true).order("name");
    setProducts(ps ?? []);
    setLoading(false);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const openOrder = async (o: any) => {
    setSelectedOrder(o);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", o.id);
    setItems(data ?? []);
  };

  const createDraft = async () => {
    if (!customer) return;
    const code = `WEB-${Date.now().toString().slice(-6)}`;
    const { data, error } = await supabase.from("orders").insert({
      code, customer_id: customer.id, tier_id: customer.tier_id, status: "draft",
      source: "portal", order_date: new Date().toISOString().slice(0, 10),
      subtotal: 0, discount: 0, total_amount: 0,
    }).select().single();
    if (error) return toast.error(error.message);
    toast.success("Đã tạo đơn nháp");
    load(); openOrder(data);
  };

  const addItem = async () => {
    if (!selectedOrder || !form.product_id || !form.quantity) return toast.error("Chọn sản phẩm và SL");
    const p = products.find(x => x.id === form.product_id);
    const { error } = await supabase.from("order_items").insert({
      order_id: selectedOrder.id, product_id: form.product_id,
      quantity: Number(form.quantity), unit_price: Number(form.unit_price || p?.base_price || 0),
      width_cm: form.width_cm ? Number(form.width_cm) : null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    setForm({}); openOrder(selectedOrder);
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from("order_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    openOrder(selectedOrder);
  };

  const uploadDesign = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrder || !user) return;
    setUploading(true);
    const path = `${user.id}/${selectedOrder.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("design-files").upload(path, file);
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data: signed } = await supabase.storage.from("design-files").createSignedUrl(path, 60 * 60 * 24 * 7);
    await supabase.from("orders").update({ design_file_url: signed?.signedUrl ?? path }).eq("id", selectedOrder.id);
    toast.success("Đã tải lên file thiết kế");
    setUploading(false); load();
    openOrder({ ...selectedOrder, design_file_url: signed?.signedUrl ?? path });
  };

  const saveDrive = async (url: string, notes: string) => {
    if (!selectedOrder) return;
    const { error } = await supabase.from("orders").update({ design_file_url: url, design_notes: notes }).eq("id", selectedOrder.id);
    if (error) return toast.error(error.message);
    toast.success("Đã lưu");
    load();
    openOrder({ ...selectedOrder, design_file_url: url, design_notes: notes });
  };

  const submitOrder = async () => {
    if (!selectedOrder) return;
    if (items.length === 0) return toast.error("Cần ít nhất 1 dòng sản phẩm");
    const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);
    const { error } = await supabase.from("orders").update({ subtotal, total_amount: subtotal, notes: (selectedOrder.notes || "") + "\n[Gửi từ Portal]" }).eq("id", selectedOrder.id);
    if (error) return toast.error(error.message);
    toast.success("Đã gửi đơn — chờ xưởng xác nhận");
    setSelectedOrder(null); load();
  };

  if (authLoading || rolesLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!has("customer") && !has("admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-6 max-w-md text-center space-y-3">
          <h2 className="font-bold">Cổng khách hàng</h2>
          <p className="text-sm text-muted-foreground">Tài khoản của bạn chưa được cấp vai trò "Khách hàng". Liên hệ xưởng để được cấp quyền.</p>
          <Button variant="outline" onClick={signOut}>Đăng xuất</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <StackedLogo size={18} />
            <div>
              <div className="font-bold text-sm uppercase tracking-wide">Cổng khách hàng</div>
              <div className="text-xs text-muted-foreground">{customer?.name || profile?.full_name || user.email}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-1" />Đăng xuất</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-4">
        {!customer ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Tài khoản của bạn chưa được gắn vào hồ sơ khách hàng. Vui lòng liên hệ nhân viên kinh doanh.
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Đơn hàng của tôi</h1>
                <p className="text-xs text-muted-foreground">Mã KH: <span className="font-mono">{customer.code}</span></p>
              </div>
              <Button onClick={createDraft}><Plus className="h-4 w-4 mr-1" />Tạo đơn mới</Button>
            </div>

            <Card className="p-0 overflow-hidden">
              {loading ? (
                <div className="p-6 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Mã đơn</TableHead><TableHead>Ngày</TableHead>
                    <TableHead>Trạng thái</TableHead><TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead>Thiết kế</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {orders.map(o => (
                      <TableRow key={o.id} className="cursor-pointer" onClick={() => openOrder(o)}>
                        <TableCell className="font-mono text-xs">{o.code}</TableCell>
                        <TableCell>{o.order_date}</TableCell>
                        <TableCell><Badge variant={o.status === "draft" ? "secondary" : "default"}>{o.status}</Badge></TableCell>
                        <TableCell className="text-right">{Number(o.total_amount || 0).toLocaleString("vi-VN")}</TableCell>
                        <TableCell>{o.design_file_url ? <ExternalLink className="h-3 w-3" /> : "-"}</TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chưa có đơn</TableCell></TableRow>}
                  </TableBody>
                </Table>
              )}
            </Card>
          </>
        )}
      </main>

      <Dialog open={!!selectedOrder} onOpenChange={(v) => !v && setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Đơn {selectedOrder?.code} <Badge className="ml-2">{selectedOrder?.status}</Badge></DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedOrder?.status === "draft" && (
              <div className="border border-border rounded-md p-3 space-y-2">
                <div className="text-xs font-medium">Thêm sản phẩm</div>
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-2">
                    <Select value={form.product_id ?? ""} onValueChange={(v) => {
                      const p = products.find(x => x.id === v);
                      setForm({ ...form, product_id: v, unit_price: p?.base_price ?? 0 });
                    }}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Chọn sản phẩm" /></SelectTrigger>
                      <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Input type="number" placeholder="SL" className="h-8" value={form.quantity ?? ""} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                  <Input type="number" placeholder="Rộng cm" className="h-8" value={form.width_cm ?? ""} onChange={(e) => setForm({ ...form, width_cm: e.target.value })} />
                  <Input type="number" placeholder="Cao cm" className="h-8" value={form.height_cm ?? ""} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
                  <Button size="sm" onClick={addItem}>Thêm</Button>
                </div>
              </div>
            )}

            <Table>
              <TableHeader><TableRow>
                <TableHead>Sản phẩm</TableHead><TableHead>SL</TableHead><TableHead>Kích thước</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead><TableHead className="text-right">Thành tiền</TableHead>
                {selectedOrder?.status === "draft" && <TableHead></TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {items.map(i => {
                  const p = products.find(x => x.id === i.product_id);
                  return (
                    <TableRow key={i.id}>
                      <TableCell>{p?.name ?? "-"}</TableCell>
                      <TableCell>{i.quantity}</TableCell>
                      <TableCell>{i.width_cm && i.height_cm ? `${i.width_cm}×${i.height_cm}` : "-"}</TableCell>
                      <TableCell className="text-right">{Number(i.unit_price).toLocaleString("vi-VN")}</TableCell>
                      <TableCell className="text-right">{(Number(i.quantity) * Number(i.unit_price)).toLocaleString("vi-VN")}</TableCell>
                      {selectedOrder?.status === "draft" && (
                        <TableCell><Button size="icon" variant="ghost" onClick={() => removeItem(i.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">Chưa có dòng</TableCell></TableRow>}
              </TableBody>
            </Table>

            <div className="border border-border rounded-md p-3 space-y-2">
              <div className="text-xs font-medium">File thiết kế</div>
              {selectedOrder?.design_file_url && (
                <a href={selectedOrder.design_file_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline break-all block">
                  {selectedOrder.design_file_url}
                </a>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Tải file lên hệ thống</Label>
                  <Input type="file" onChange={uploadDesign} disabled={uploading || selectedOrder?.status !== "draft"} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Hoặc dán link Google Drive</Label>
                  <div className="flex gap-1">
                    <Input placeholder="https://drive.google.com/..." defaultValue={selectedOrder?.design_file_url ?? ""}
                      onBlur={(e) => e.target.value && e.target.value !== selectedOrder.design_file_url && saveDrive(e.target.value, selectedOrder?.design_notes ?? "")}
                      disabled={selectedOrder?.status !== "draft"} className="h-8 text-xs" />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs">Ghi chú thiết kế</Label>
                <Textarea defaultValue={selectedOrder?.design_notes ?? ""} rows={2}
                  disabled={selectedOrder?.status !== "draft"}
                  onBlur={(e) => saveDrive(selectedOrder?.design_file_url ?? "", e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            {selectedOrder?.status === "draft" && (
              <Button onClick={submitOrder}><Upload className="h-4 w-4 mr-1" />Gửi đơn</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
