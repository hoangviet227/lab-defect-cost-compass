import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRoles, type AppRole } from "@/hooks/use-roles";
import { Loader2 } from "lucide-react";

const ROLES: AppRole[] = ["admin", "sales", "warehouse", "production", "accountant", "delivery", "customer", "user"];

export default function Settings() {
  const { has, loading: rolesLoading } = useRoles();
  const isAdmin = has("admin");

  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [roleMap, setRoleMap] = useState<Record<string, AppRole[]>>({});
  const [newRole, setNewRole] = useState<Record<string, AppRole>>({});

  const loadMembers = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("user_id,full_name,employee_code,job_title,phone,is_active").order("full_name"),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const map: Record<string, AppRole[]> = {};
    (roles ?? []).forEach((r: any) => {
      map[r.user_id] = [...(map[r.user_id] ?? []), r.role];
    });
    setRoleMap(map);
    setMembers(profiles ?? []);
  };

  useEffect(() => {
    supabase.from("app_settings").select("*").limit(1).maybeSingle().then(({ data }) => setSettings(data));
    loadMembers();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({
        workshop_name: settings.workshop_name,
        workshop_address: settings.workshop_address,
        workshop_phone: settings.workshop_phone,
        workshop_email: settings.workshop_email,
        workshop_tax_code: settings.workshop_tax_code,
        currency: settings.currency,
        roll_width_mm: Number(settings.roll_width_mm),
        roll_length_rounding_mm: Number(settings.roll_length_rounding_mm),
        low_price_variance_percent: Number(settings.low_price_variance_percent),
        allow_negative_stock: settings.allow_negative_stock,
      })
      .eq("id", settings.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Đã lưu cài đặt");
  };

  const addRole = async (userId: string) => {
    const role = newRole[userId];
    if (!role) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) toast.error(error.message);
    else {
      toast.success("Đã cấp quyền");
      loadMembers();
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) toast.error(error.message);
    else {
      toast.success("Đã gỡ quyền");
      loadMembers();
    }
  };

  const field = (key: string, label: string, type = "text") => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={settings?.[key] ?? ""}
        disabled={!isAdmin}
        onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
      />
    </div>
  );

  if (rolesLoading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Cài đặt</h1>
          <p className="text-sm text-muted-foreground">Thông tin xưởng, tham số hệ thống và phân quyền.</p>
        </div>

        <Tabs defaultValue="workshop">
          <TabsList>
            <TabsTrigger value="workshop">Thông tin xưởng</TabsTrigger>
            <TabsTrigger value="params">Tham số</TabsTrigger>
            <TabsTrigger value="team">Người dùng & quyền</TabsTrigger>
          </TabsList>

          <TabsContent value="workshop" className="mt-4">
            <Card className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {field("workshop_name", "Tên xưởng")}
                {field("workshop_tax_code", "Mã số thuế")}
                {field("workshop_phone", "Điện thoại")}
                {field("workshop_email", "Email")}
              </div>
              {field("workshop_address", "Địa chỉ")}
              {isAdmin && (
                <Button onClick={saveSettings} disabled={saving} size="sm">
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="params" className="mt-4">
            <Card className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {field("currency", "Tiền tệ")}
                {field("roll_width_mm", "Khổ cuộn (mm)", "number")}
                {field("roll_length_rounding_mm", "Làm tròn chiều dài (mm)", "number")}
                {field("low_price_variance_percent", "Ngưỡng cảnh báo giá thấp (%)", "number")}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!settings?.allow_negative_stock}
                  disabled={!isAdmin}
                  onCheckedChange={(v) => setSettings({ ...settings, allow_negative_stock: v })}
                />
                <Label className="text-xs">Cho phép tồn kho âm</Label>
              </div>
              {isAdmin && (
                <Button onClick={saveSettings} disabled={saving} size="sm">
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-4">
            <Card className="p-4 space-y-3">
              {members.length === 0 && <p className="text-xs text-muted-foreground">Chưa có người dùng.</p>}
              {members.map((m) => (
                <div key={m.user_id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <div className="text-sm font-medium">{m.full_name || "(chưa đặt tên)"}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.employee_code || "—"} · {m.job_title || "—"} · {m.phone || "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(roleMap[m.user_id] ?? []).map((r) => (
                        <Badge
                          key={r}
                          variant="secondary"
                          className={isAdmin ? "cursor-pointer" : ""}
                          onClick={() => isAdmin && removeRole(m.user_id, r)}
                          title={isAdmin ? "Bấm để gỡ quyền" : undefined}
                        >
                          {r}
                        </Badge>
                      ))}
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <Select
                            value={newRole[m.user_id] ?? ""}
                            onValueChange={(v) => setNewRole({ ...newRole, [m.user_id]: v as AppRole })}
                          >
                            <SelectTrigger className="h-7 w-32 text-xs">
                              <SelectValue placeholder="Thêm quyền" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.filter((r) => !(roleMap[m.user_id] ?? []).includes(r)).map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="outline" className="h-7" onClick={() => addRole(m.user_id)}>
                            +
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!isAdmin && (
                <p className="text-xs text-muted-foreground">Chỉ quản trị viên mới được cấp/gỡ quyền.</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
