import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRoles } from "@/hooks/use-roles";
import { Plus, Lock } from "lucide-react";

type Emp = { id: string; user_id: string | null; employee_code: string | null; base_salary: number | null; allowance: number | null; is_active: boolean | null; full_name?: string | null };
type Att = { id: string; employee_id: string; work_date: string; check_in: string | null; check_out: string | null; hours: number; shift: string | null; notes: string | null };
type Out = { id: string; employee_id: string; work_date: string; product_id: string | null; production_order_id: string | null; quantity: number; unit_rate: number; amount: number; notes: string | null };
type Period = { id: string; code: string; period_month: number; period_year: number; start_date: string; end_date: string; status: string };
type Slip = { id: string; employee_id: string; period_id: string; base_salary: number; allowance: number; worked_hours: number; output_amount: number; bonus: number; deduction: number; advance: number; net_pay: number };

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));

export default function HR() {
  const { has, loading: rolesLoading } = useRoles();
  const canManage = has("admin") || has("accountant");
  const [tab, setTab] = useState("attendance");
  const [emps, setEmps] = useState<Emp[]>([]);
  const [att, setAtt] = useState<Att[]>([]);
  const [outs, setOuts] = useState<Out[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [selPeriod, setSelPeriod] = useState<string>("");
  const [attOpen, setAttOpen] = useState(false);
  const [outOpen, setOutOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [attForm, setAttForm] = useState({ employee_id: "", work_date: today, hours: "8", shift: "", notes: "" });
  const [outForm, setOutForm] = useState({ employee_id: "", work_date: today, quantity: "", unit_rate: "", notes: "" });
  const [periodForm, setPeriodForm] = useState({ period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() });

  const loadAll = async () => {
    const [e, a, o, p, pr] = await Promise.all([
      supabase.from("employee_profiles").select("*").order("employee_code"),
      supabase.from("attendance").select("*").order("work_date", { ascending: false }).limit(200),
      supabase.from("production_outputs").select("*").order("work_date", { ascending: false }).limit(200),
      supabase.from("payroll_periods").select("*").order("start_date", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    const profMap = new Map((pr.data ?? []).map((r: any) => [r.user_id, r.full_name]));
    const empRows = ((e.data as any[]) ?? []).map(r => ({ ...r, full_name: profMap.get(r.user_id) ?? null })) as Emp[];
    setEmps(empRows);
    setAtt((a.data as Att[]) ?? []);
    setOuts((o.data as Out[]) ?? []);
    const ps = (p.data as Period[]) ?? [];
    setPeriods(ps);
    if (ps.length && !selPeriod) setSelPeriod(ps[0].id);
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => {
    if (!selPeriod) { setSlips([]); return; }
    supabase.from("payslips").select("*").eq("period_id", selPeriod).then(({ data }) => setSlips((data as Slip[]) ?? []));
  }, [selPeriod]);

  const empName = (id: string) => emps.find(e => e.id === id)?.full_name || emps.find(e => e.id === id)?.employee_code || id.slice(0, 8);

  const saveAtt = async () => {
    if (!attForm.employee_id) return toast.error("Chọn nhân viên");
    const { error } = await supabase.from("attendance").insert({
      employee_id: attForm.employee_id, work_date: attForm.work_date,
      hours: Number(attForm.hours) || 0, shift: attForm.shift || null, notes: attForm.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Đã lưu chấm công"); setAttOpen(false); loadAll();
  };

  const saveOut = async () => {
    if (!outForm.employee_id) return toast.error("Chọn nhân viên");
    const { error } = await supabase.from("production_outputs").insert({
      employee_id: outForm.employee_id, work_date: outForm.work_date,
      quantity: Number(outForm.quantity) || 0, unit_rate: Number(outForm.unit_rate) || 0, notes: outForm.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Đã lưu sản lượng"); setOutOpen(false); loadAll();
  };

  const savePeriod = async () => {
    const m = periodForm.period_month, y = periodForm.period_year;
    const start = new Date(y, m - 1, 1).toISOString().slice(0, 10);
    const end = new Date(y, m, 0).toISOString().slice(0, 10);
    const code = `LUONG-${y}${String(m).padStart(2, "0")}`;
    const { error } = await supabase.from("payroll_periods").insert({
      code, period_month: m, period_year: y, start_date: start, end_date: end, status: "draft",
    });
    if (error) return toast.error(error.message);
    toast.success("Đã tạo kỳ lương"); setPeriodOpen(false); loadAll();
  };

  const genSlips = async () => {
    if (!selPeriod) return;
    const { data, error } = await supabase.rpc("generate_payslips", { _period_id: selPeriod });
    if (error) return toast.error(error.message);
    toast.success(`Đã tạo ${data} phiếu lương`);
    const { data: s } = await supabase.from("payslips").select("*").eq("period_id", selPeriod);
    setSlips((s as Slip[]) ?? []);
  };

  const closePeriod = async () => {
    if (!selPeriod) return;
    const { error } = await supabase.rpc("close_payroll_period", { _period_id: selPeriod });
    if (error) return toast.error(error.message);
    toast.success("Đã chốt kỳ lương"); loadAll();
  };

  const currentPeriod = periods.find(p => p.id === selPeriod);
  const periodLocked = currentPeriod?.status === "closed";

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Nhân sự</h1>
          <p className="text-sm text-muted-foreground">Chấm công, sản lượng khoán và bảng lương.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="attendance">Chấm công</TabsTrigger>
            <TabsTrigger value="outputs">Sản lượng</TabsTrigger>
            <TabsTrigger value="payroll">Bảng lương</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-3">
            {canManage && (
              <Dialog open={attOpen} onOpenChange={setAttOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Thêm chấm công</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Chấm công</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Nhân viên</Label>
                      <Select value={attForm.employee_id} onValueChange={v => setAttForm(f => ({ ...f, employee_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                        <SelectContent>{emps.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name || e.employee_code}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>Ngày</Label><Input type="date" value={attForm.work_date} onChange={e => setAttForm(f => ({ ...f, work_date: e.target.value }))} /></div>
                      <div><Label>Giờ công</Label><Input type="number" step="0.25" value={attForm.hours} onChange={e => setAttForm(f => ({ ...f, hours: e.target.value }))} /></div>
                    </div>
                    <div><Label>Ca</Label><Input value={attForm.shift} onChange={e => setAttForm(f => ({ ...f, shift: e.target.value }))} placeholder="Ca 1 / Ca 2..." /></div>
                    <div><Label>Ghi chú</Label><Input value={attForm.notes} onChange={e => setAttForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  </div>
                  <DialogFooter><Button onClick={saveAtt}>Lưu</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Card>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Ngày</TableHead><TableHead>Nhân viên</TableHead><TableHead>Ca</TableHead>
                  <TableHead className="text-right">Giờ công</TableHead><TableHead>Ghi chú</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {att.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>{a.work_date}</TableCell>
                      <TableCell>{empName(a.employee_id)}</TableCell>
                      <TableCell>{a.shift || "-"}</TableCell>
                      <TableCell className="text-right">{a.hours}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.notes || ""}</TableCell>
                    </TableRow>
                  ))}
                  {!att.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Chưa có dữ liệu</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="outputs" className="space-y-3">
            {canManage && (
              <Dialog open={outOpen} onOpenChange={setOutOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Thêm sản lượng</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Sản lượng khoán</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Nhân viên</Label>
                      <Select value={outForm.employee_id} onValueChange={v => setOutForm(f => ({ ...f, employee_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                        <SelectContent>{emps.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name || e.employee_code}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><Label>Ngày</Label><Input type="date" value={outForm.work_date} onChange={e => setOutForm(f => ({ ...f, work_date: e.target.value }))} /></div>
                      <div><Label>Số lượng</Label><Input type="number" step="0.01" value={outForm.quantity} onChange={e => setOutForm(f => ({ ...f, quantity: e.target.value }))} /></div>
                      <div><Label>Đơn giá khoán</Label><Input type="number" value={outForm.unit_rate} onChange={e => setOutForm(f => ({ ...f, unit_rate: e.target.value }))} /></div>
                    </div>
                    <div><Label>Ghi chú</Label><Input value={outForm.notes} onChange={e => setOutForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  </div>
                  <DialogFooter><Button onClick={saveOut}>Lưu</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Card>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Ngày</TableHead><TableHead>Nhân viên</TableHead>
                  <TableHead className="text-right">SL</TableHead><TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {outs.map(o => (
                    <TableRow key={o.id}>
                      <TableCell>{o.work_date}</TableCell>
                      <TableCell>{empName(o.employee_id)}</TableCell>
                      <TableCell className="text-right">{o.quantity}</TableCell>
                      <TableCell className="text-right">{fmt(o.unit_rate)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(o.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {!outs.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Chưa có dữ liệu</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-3">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="min-w-[220px]">
                <Label className="text-xs">Kỳ lương</Label>
                <Select value={selPeriod} onValueChange={setSelPeriod}>
                  <SelectTrigger><SelectValue placeholder="Chọn kỳ" /></SelectTrigger>
                  <SelectContent>{periods.map(p => <SelectItem key={p.id} value={p.id}>{p.code} {p.status === "closed" ? "(đã chốt)" : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {canManage && (
                <>
                  <Dialog open={periodOpen} onOpenChange={setPeriodOpen}>
                    <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Kỳ mới</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Tạo kỳ lương</DialogTitle></DialogHeader>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label>Tháng</Label><Input type="number" min={1} max={12} value={periodForm.period_month} onChange={e => setPeriodForm(f => ({ ...f, period_month: Number(e.target.value) }))} /></div>
                        <div><Label>Năm</Label><Input type="number" value={periodForm.period_year} onChange={e => setPeriodForm(f => ({ ...f, period_year: Number(e.target.value) }))} /></div>
                      </div>
                      <DialogFooter><Button onClick={savePeriod}>Tạo</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" onClick={genSlips} disabled={!selPeriod || periodLocked}>Tạo/Cập nhật bảng lương</Button>
                  <Button size="sm" variant="secondary" onClick={closePeriod} disabled={!selPeriod || periodLocked}><Lock className="h-4 w-4 mr-1" />Chốt kỳ</Button>
                </>
              )}
            </div>
            <Card>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead className="text-right">Lương CB</TableHead>
                  <TableHead className="text-right">Phụ cấp</TableHead>
                  <TableHead className="text-right">Giờ</TableHead>
                  <TableHead className="text-right">Sản lượng</TableHead>
                  <TableHead className="text-right">Thưởng</TableHead>
                  <TableHead className="text-right">Khấu trừ</TableHead>
                  <TableHead className="text-right">Tạm ứng</TableHead>
                  <TableHead className="text-right">Thực lãnh</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {slips.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>{empName(s.employee_id)}</TableCell>
                      <TableCell className="text-right">{fmt(s.base_salary)}</TableCell>
                      <TableCell className="text-right">{fmt(s.allowance)}</TableCell>
                      <TableCell className="text-right">{s.worked_hours}</TableCell>
                      <TableCell className="text-right">{fmt(s.output_amount)}</TableCell>
                      <TableCell className="text-right">{fmt(s.bonus)}</TableCell>
                      <TableCell className="text-right">{fmt(s.deduction)}</TableCell>
                      <TableCell className="text-right">{fmt(s.advance)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(s.net_pay)}</TableCell>
                    </TableRow>
                  ))}
                  {!slips.length && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-6">Chưa có phiếu lương. Nhấn "Tạo/Cập nhật bảng lương".</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
        {rolesLoading && null}
      </div>
    </AppLayout>
  );
}
