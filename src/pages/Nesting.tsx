import { num } from "@/lib/utils";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Play } from "lucide-react";
import { packStrip, type NestItem } from "@/lib/nesting";

const COLORS = ["#f97316","#3b82f6","#10b981","#a855f7","#ec4899","#f59e0b","#06b6d4","#84cc16","#ef4444","#8b5cf6"];

export default function Nesting() {
  const [rollWidth, setRollWidth] = useState(60);
  const [kerf, setKerf] = useState(0.2);
  const [items, setItems] = useState<NestItem[]>([
    { id: crypto.randomUUID(), label: "Tem A", width: 20, height: 15, qty: 8, allowRotate: true },
    { id: crypto.randomUUID(), label: "Tem B", width: 12, height: 10, qty: 12, allowRotate: true },
  ]);
  const [ran, setRan] = useState(false);

  const addRow = () => setItems([...items, { id: crypto.randomUUID(), label: `Item ${items.length + 1}`, width: 10, height: 10, qty: 1, allowRotate: true }]);
  const updateRow = (id: string, patch: Partial<NestItem>) => setItems(items.map((i) => i.id === id ? { ...i, ...patch } : i));
  const delRow = (id: string) => setItems(items.filter((i) => i.id !== id));

  const result = useMemo(() => ran ? packStrip(items, rollWidth, kerf) : null, [ran, items, rollWidth, kerf]);

  // Scale for SVG
  const svgW = 480;
  const scale = svgW / rollWidth;
  const svgH = result ? Math.max(120, result.usedLength * scale + 20) : 120;

  const colorFor = (id: string) => {
    const idx = items.findIndex((i) => i.id === id);
    return COLORS[idx % COLORS.length];
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Tính toán ép khổ (Nesting)</h1>
          <p className="text-sm text-muted-foreground">Sắp xếp sản phẩm lên cuộn vật liệu để tối ưu chiều dài sử dụng.</p>
        </div>

        <Card className="p-4 space-y-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div><Label>Khổ cuộn (cm)</Label><Input type="number" step="0.1" value={rollWidth} onChange={(e) => setRollWidth(num(e.target.value))} className="w-32" /></div>
            <div><Label>Khe cắt (cm)</Label><Input type="number" step="0.1" value={kerf} onChange={(e) => setKerf(num(e.target.value))} className="w-32" /></div>
            <Button onClick={() => setRan(true)}><Play className="h-4 w-4 mr-1" />Tính</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead className="text-right">Rộng (cm)</TableHead>
                <TableHead className="text-right">Cao (cm)</TableHead>
                <TableHead className="text-right">SL</TableHead>
                <TableHead className="text-center">Xoay</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: colorFor(i.id) }} />
                      <Input value={i.label} onChange={(e) => updateRow(i.id, { label: e.target.value })} className="h-8" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right"><Input type="number" step="0.1" value={i.width} onChange={(e) => updateRow(i.id, { width: num(e.target.value) })} className="h-8 w-24 text-right ml-auto" /></TableCell>
                  <TableCell className="text-right"><Input type="number" step="0.1" value={i.height} onChange={(e) => updateRow(i.id, { height: num(e.target.value) })} className="h-8 w-24 text-right ml-auto" /></TableCell>
                  <TableCell className="text-right"><Input type="number" value={i.qty} onChange={(e) => updateRow(i.id, { qty: num(e.target.value) })} className="h-8 w-20 text-right ml-auto" /></TableCell>
                  <TableCell className="text-center"><Checkbox checked={i.allowRotate !== false} onCheckedChange={(v) => updateRow(i.id, { allowRotate: !!v })} /></TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => delRow(i.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button size="sm" variant="outline" onClick={addRow}><Plus className="h-4 w-4 mr-1" />Thêm dòng</Button>
        </Card>

        {result && (
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><div className="text-muted-foreground">Khổ cuộn</div><div className="font-semibold">{result.rollWidth} cm</div></div>
              <div><div className="text-muted-foreground">Chiều dài dùng</div><div className="font-semibold">{result.usedLength.toFixed(1)} cm</div></div>
              <div><div className="text-muted-foreground">Diện tích sử dụng</div><div className="font-semibold">{(result.totalItemArea/10000).toFixed(3)} m²</div></div>
              <div><div className="text-muted-foreground">Hiệu suất</div><div className="font-semibold">{(result.utilization*100).toFixed(1)}%</div></div>
            </div>
            {result.unplaced.length > 0 && (
              <div className="text-sm text-destructive">
                Không xếp được (quá khổ): {result.unplaced.map((u) => `${u.label} ×${u.qty}`).join(", ")}
              </div>
            )}
            <div className="border rounded overflow-auto bg-muted/20 p-2">
              <svg width={svgW} height={svgH} className="mx-auto block">
                <rect x={0} y={0} width={rollWidth * scale} height={result.usedLength * scale} fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
                {result.placements.map((p, idx) => (
                  <g key={idx}>
                    <rect x={p.x * scale} y={p.y * scale} width={p.w * scale} height={p.h * scale}
                      fill={colorFor(p.id)} fillOpacity={0.75} stroke="#fff" strokeWidth={0.5} />
                    <text x={(p.x + p.w / 2) * scale} y={(p.y + p.h / 2) * scale + 3}
                      fontSize={9} fill="#fff" textAnchor="middle">{p.label}{p.rotated ? "↻" : ""}</text>
                  </g>
                ))}
              </svg>
              <div className="text-xs text-center text-muted-foreground mt-1">Cuộn dài {result.usedLength.toFixed(1)} cm × rộng {rollWidth} cm</div>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
