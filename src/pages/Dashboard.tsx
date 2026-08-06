import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

const vnd = (n: number) => n.toLocaleString("vi-VN") + "₫";

type LowStock = { name: string; unit: string; qty: number; min: number };

export default function Dashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ordersToday: 0,
    inProduction: 0,
    pendingDelivery: 0,
    lowStock: 0,
    revenueMonth: 0,
  });
  const [lowStockList, setLowStockList] = useState<LowStock[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = today.slice(0, 8) + "01";

      const [ordersToday, inProd, pending, monthOrders, materials, balances, recent] =
        await Promise.all([
          supabase.from("orders").select("id", { count: "exact", head: true }).eq("order_date", today),
          supabase.from("production_orders").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
          supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["confirmed", "in_production"]),
          supabase.from("orders").select("total_amount").gte("order_date", monthStart).neq("status", "cancelled").neq("status", "draft"),
          supabase.from("materials").select("id,name,unit,min_stock").eq("is_active", true),
          supabase.from("stock_balances").select("material_id,quantity"),
          supabase.from("orders").select("id,code,order_date,status,total_amount,customers(name)").order("created_at", { ascending: false }).limit(8),
        ]);

      const totals = new Map<string, number>();
      (balances.data ?? []).forEach((b: any) => {
        totals.set(b.material_id, (totals.get(b.material_id) ?? 0) + Number(b.quantity));
      });
      const low = (materials.data ?? [])
        .map((m: any) => ({ name: m.name, unit: m.unit, qty: totals.get(m.id) ?? 0, min: Number(m.min_stock) }))
        .filter((m) => m.min > 0 && m.qty <= m.min)
        .sort((a, b) => a.qty - b.qty);

      setLowStockList(low.slice(0, 8));
      setRecentOrders(recent.data ?? []);
      setStats({
        ordersToday: ordersToday.count ?? 0,
        inProduction: inProd.count ?? 0,
        pendingDelivery: pending.count ?? 0,
        lowStock: low.length,
        revenueMonth: (monthOrders.data ?? []).reduce((s: number, o: any) => s + Number(o.total_amount), 0),
      });
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: "Đơn hôm nay", value: String(stats.ordersToday), to: "/orders" },
    { label: "Đang sản xuất", value: String(stats.inProduction), to: "/production" },
    { label: "Chờ giao", value: String(stats.pendingDelivery), to: "/orders" },
    { label: "Vật tư sắp hết", value: String(stats.lowStock), to: "/materials" },
  ];

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan</h1>
          <p className="text-sm text-muted-foreground">
            Xin chào {profile?.full_name || "bạn"}, chào mừng đến với Xưởng In Manager.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {cards.map((s) => (
                <Link key={s.label} to={s.to}>
                  <Card className="p-4 hover:border-primary transition-colors">
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className="text-2xl font-bold mt-1">{s.value}</div>
                  </Card>
                </Link>
              ))}
            </div>

            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Doanh thu tháng này</div>
              <div className="text-3xl font-bold mt-1">{vnd(stats.revenueMonth)}</div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4">
                <h2 className="text-sm font-semibold mb-3">Đơn hàng gần đây</h2>
                {recentOrders.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Chưa có đơn hàng.</p>
                ) : (
                  <div className="space-y-1.5">
                    {recentOrders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between text-[13px]">
                        <span className="truncate">
                          <b>{o.code}</b> · {o.customers?.name ?? "—"}
                        </span>
                        <span className="text-muted-foreground shrink-0 ml-2">{vnd(Number(o.total_amount))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <h2 className="text-sm font-semibold mb-3">Vật tư dưới định mức</h2>
                {lowStockList.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Tồn kho ổn định.</p>
                ) : (
                  <div className="space-y-1.5">
                    {lowStockList.map((m) => (
                      <div key={m.name} className="flex items-center justify-between text-[13px]">
                        <span className="truncate">{m.name}</span>
                        <span className="text-destructive shrink-0 ml-2">
                          {m.qty} / {m.min} {m.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
