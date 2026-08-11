import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Reports() {
  const [stats, setStats] = useState({ ordersToday: 0, revenueMonth: 0, activeOrders: 0, lowStockCount: 0 });
  const [stock, setStock] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = new Date().toISOString().slice(0, 7) + "-01";

      const [{ count: ot }, { data: rev }, { count: ao }, { data: sb }, { data: mats }, { data: items }] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("order_date", today),
        supabase.from("orders").select("total_amount").gte("order_date", monthStart).in("status", ["confirmed", "in_production", "delivered"]),
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["confirmed", "in_production"]),
        supabase.from("stock_balances").select("material_id, quantity"),
        supabase.from("materials").select("id,code,name,unit,avg_cost,min_stock"),
        supabase.from("order_items").select("product_id, quantity, line_total"),
      ]);

      const revenue = (rev ?? []).reduce((s, r: any) => s + Number(r.total_amount), 0);
      const totals: Record<string, number> = {};
      (sb ?? []).forEach((b: any) => { totals[b.material_id] = (totals[b.material_id] ?? 0) + Number(b.quantity); });
      const stockRows = (mats ?? []).map((m: any) => ({ ...m, qty: totals[m.id] ?? 0 }));
      const low = stockRows.filter((r) => Number(r.min_stock ?? 0) > 0 && r.qty < Number(r.min_stock)).length;

      const prodMap: Record<string, { qty: number; total: number }> = {};
      (items ?? []).forEach((i: any) => {
        prodMap[i.product_id] ??= { qty: 0, total: 0 };
        prodMap[i.product_id].qty += Number(i.quantity);
        prodMap[i.product_id].total += Number(i.line_total);
      });
      const { data: prods } = await supabase.from("products").select("id,code,name");
      const top = Object.entries(prodMap).map(([id, v]) => ({
        id, ...v, name: prods?.find((p: any) => p.id === id)?.name ?? id,
      })).sort((a, b) => b.total - a.total).slice(0, 10);

      setStats({ ordersToday: ot ?? 0, revenueMonth: revenue, activeOrders: ao ?? 0, lowStockCount: low });
      setStock(stockRows); setTopProducts(top); setLoading(false);
    })();
  }, []);

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div><h1 className="text-2xl font-bold">Báo cáo{loading && <span className="ml-2 text-sm font-normal text-muted-foreground">Đang tải...</span>}</h1>
          <p className="text-sm text-muted-foreground">Tổng hợp doanh thu, tồn kho và top sản phẩm.</p></div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4"><div className="text-xs text-muted-foreground">Đơn hôm nay</div><div className="text-2xl font-bold mt-1">{stats.ordersToday}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Doanh thu tháng</div><div className="text-2xl font-bold mt-1">{stats.revenueMonth.toLocaleString("vi-VN")}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Đơn đang xử lý</div><div className="text-2xl font-bold mt-1">{stats.activeOrders}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Vật tư dưới mức</div><div className="text-2xl font-bold mt-1 text-destructive">{stats.lowStockCount}</div></Card>
        </div>

        <Tabs defaultValue="stock">
          <TabsList><TabsTrigger value="stock">Tồn kho</TabsTrigger><TabsTrigger value="top">Top sản phẩm</TabsTrigger></TabsList>
          <TabsContent value="stock">
            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Mã</TableHead><TableHead>Tên</TableHead><TableHead>ĐVT</TableHead><TableHead className="text-right">Tồn</TableHead><TableHead className="text-right">Giá vốn</TableHead><TableHead className="text-right">Giá trị</TableHead></TableRow></TableHeader>
                <TableBody>
                  {stock.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.code}</TableCell><TableCell>{s.name}</TableCell><TableCell>{s.unit}</TableCell>
                      <TableCell className="text-right">{s.qty.toLocaleString("vi-VN")}</TableCell>
                      <TableCell className="text-right">{Number(s.avg_cost).toLocaleString("vi-VN")}</TableCell>
                      <TableCell className="text-right">{(s.qty * Number(s.avg_cost)).toLocaleString("vi-VN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          <TabsContent value="top">
            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Sản phẩm</TableHead><TableHead className="text-right">SL bán</TableHead><TableHead className="text-right">Doanh thu</TableHead></TableRow></TableHeader>
                <TableBody>
                  {topProducts.map((t) => (
                    <TableRow key={t.id}><TableCell>{t.name}</TableCell>
                      <TableCell className="text-right">{t.qty.toLocaleString("vi-VN")}</TableCell>
                      <TableCell className="text-right">{t.total.toLocaleString("vi-VN")}</TableCell></TableRow>
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
