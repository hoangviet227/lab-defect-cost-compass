import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  const { profile } = useAuth();
  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan</h1>
          <p className="text-sm text-muted-foreground">
            Xin chào {profile?.full_name || "bạn"}, chào mừng đến với Xưởng In Manager.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Đơn hôm nay", value: "0" },
            { label: "Đang sản xuất", value: "0" },
            { label: "Chờ giao", value: "0" },
            { label: "Vật tư sắp hết", value: "0" },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-bold mt-1">{s.value}</div>
            </Card>
          ))}
        </div>

        <div className="border border-dashed border-border rounded-md p-6 text-sm text-muted-foreground">
          Hệ thống đang ở <b>Giai đoạn 1: Nền tảng</b>. Các phân hệ Đơn hàng,
          Sản xuất, Kho, Tài chính sẽ được kích hoạt ở các giai đoạn tiếp theo.
        </div>
      </div>
    </AppLayout>
  );
}
