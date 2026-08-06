import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function Activity() {
  const [logs, setLogs] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const PAGE = 50;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      setLogs(data ?? []);
      const ids = [...new Set((data ?? []).map((l: any) => l.user_id).filter(Boolean))];
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id,full_name")
          .in("user_id", ids as string[]);
        const map: Record<string, string> = {};
        (profiles ?? []).forEach((p: any) => (map[p.user_id] = p.full_name));
        setNames(map);
      }
      setLoading(false);
    })();
  }, [page]);

  const filtered = logs.filter((l) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      l.action?.toLowerCase().includes(s) ||
      l.entity_table?.toLowerCase().includes(s) ||
      (names[l.user_id] ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Nhật ký hệ thống</h1>
          <p className="text-sm text-muted-foreground">Lịch sử thao tác của toàn hệ thống.</p>
        </div>

        <Input
          placeholder="Tìm theo hành động, bảng, người dùng..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        <Card className="p-4 space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground">Chưa có nhật ký.</p>
          ) : (
            filtered.map((l) => (
              <div
                key={l.id}
                className="flex items-start justify-between gap-3 border-b border-border last:border-0 pb-2 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="text-[13px] flex items-center gap-1.5 flex-wrap">
                    <Badge variant="secondary">{l.action}</Badge>
                    <span className="font-medium">{l.entity_table}</span>
                    {l.entity_id && (
                      <span className="text-muted-foreground text-xs font-mono">{String(l.entity_id).slice(0, 8)}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {names[l.user_id] || "Hệ thống"}
                    {l.reason ? ` · ${l.reason}` : ""}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {new Date(l.created_at).toLocaleString("vi-VN")}
                </div>
              </div>
            ))
          )}
        </Card>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Trước
          </Button>
          <span className="text-xs text-muted-foreground">Trang {page + 1}</span>
          <Button size="sm" variant="outline" disabled={logs.length < PAGE} onClick={() => setPage((p) => p + 1)}>
            Sau
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
