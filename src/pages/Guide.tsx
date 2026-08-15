import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";

type Section = {
  path: string;
  title: string;
  role: string;
  logic: string[];
  rules?: string[];
};

const sections: Section[] = [
  {
    path: "/dashboard",
    title: "Tổng quan",
    role: "Mọi nhân viên",
    logic: [
      "Đọc trực tiếp số liệu thật: số đơn theo trạng thái, lệnh sản xuất đang chạy, doanh thu tháng, vật tư dưới định mức.",
      "Doanh thu tháng = tổng total_amount của đơn đã xác nhận trở lên trong tháng hiện tại.",
    ],
  },
  {
    path: "/orders",
    title: "Đơn hàng",
    role: "admin, sales",
    logic: [
      "Tạo đơn ở trạng thái Nháp — mã tự sinh dạng DH-YYYYMM-0001.",
      "Chọn khách hàng → hệ thống lấy cấp giá (tier) của khách → đơn giá tự điền theo bảng giá cấp; nếu chưa có giá cấp thì dùng giá gốc sản phẩm.",
      "Chỉ đơn Nháp mới sửa được dòng hàng. Bấm Xác nhận → RPC confirm_order tính lại thành tiền từng dòng, cộng tổng, trừ chiết khấu và khoá đơn.",
      "Đơn đã xác nhận → bấm Sản xuất → RPC create_production_from_order tạo lệnh sản xuất kèm các dòng sản phẩm, đơn chuyển trạng thái Đang SX.",
      "Khi giao xong bấm Đã giao để chốt vòng đời đơn.",
      "Nút In xuất phiếu báo giá/hoá đơn theo mẫu có thông tin xưởng lấy từ Cài đặt.",
    ],
    rules: ["Nháp → Đã xác nhận → Đang SX → Đã giao. Không nhảy bước ngược."],
  },
  {
    path: "/production",
    title: "Sản xuất",
    role: "admin, production",
    logic: [
      "Lệnh sản xuất sinh từ đơn hàng, giữ danh sách sản phẩm với số lượng kế hoạch.",
      "Tổ sản xuất cập nhật số lượng đã làm (produced_qty) và trạng thái lệnh.",
      "Vật tư tiêu hao được lấy ra bằng phiếu Xuất kho gắn với lệnh sản xuất.",
    ],
  },
  {
    path: "/customers",
    title: "Khách hàng & cấp giá",
    role: "admin, sales",
    logic: [
      "Mỗi khách thuộc một cấp giá (Lẻ / Đại lý 1-2-3) quyết định giá bán mặc định.",
      "Có thể gắn tài khoản đăng nhập cho khách bằng email hoặc username (tự sinh email nội bộ @xuongin.local) — khách nhận vai trò customer và chỉ vào được Cổng khách hàng.",
      "Gỡ liên kết sẽ bỏ user_id khỏi khách, tài khoản không còn thấy đơn của khách đó.",
    ],
  },
  {
    path: "/products",
    title: "Sản phẩm, BOM & bảng giá",
    role: "admin, sales (giá), production (BOM)",
    logic: [
      "Sản phẩm khai báo kích thước chuẩn, đơn vị và giá gốc.",
      "BOM: liệt kê vật tư cho 1 đơn vị sản phẩm kèm % hao hụt; giá vốn ước tính = Σ (định mức × (1+hao hụt) × giá vốn bình quân vật tư).",
      "Bảng giá theo cấp: đặt giá riêng cho từng cấp khách, ưu tiên hơn giá gốc khi lên đơn.",
    ],
  },
  {
    path: "/nesting",
    title: "Nesting 60cm",
    role: "admin, production",
    logic: [
      "Thuật toán xếp hình 2D (First-Fit Decreasing Height) trên cuộn khổ cố định (mặc định 60cm, đổi trong Cài đặt).",
      "Cho phép xoay chi tiết 90° và chừa mạch cắt (kerf) giữa các chi tiết.",
      "Kết quả trả về chiều dài cuộn cần dùng, tỉ lệ sử dụng và sơ đồ cắt trực quan để ước lượng vật tư trước khi báo giá.",
    ],
  },
  {
    path: "/materials",
    title: "Vật tư & kho",
    role: "admin, warehouse",
    logic: [
      "Vật tư có định mức tồn tối thiểu; tồn dưới mức sẽ cảnh báo ở Tổng quan và Báo cáo.",
      "Tồn kho tách theo từng kho (stock_balances), lịch sử ghi vào sổ stock_transactions — không sửa tay được, chỉ sinh từ phiếu.",
    ],
  },
  {
    path: "/stock-in",
    title: "Nhập kho",
    role: "admin, warehouse",
    logic: [
      "Tạo phiếu nhập Nháp → thêm dòng vật tư, số lượng, đơn giá nhập.",
      "Xác nhận → RPC confirm_purchase_receipt khoá dòng, cộng tồn kho, ghi sổ và tính lại giá vốn bình quân gia quyền toàn hệ thống cho vật tư.",
      "Giá vốn mới = (tồn cũ × giá cũ + SL nhập × giá nhập) / tổng tồn sau nhập.",
    ],
    rules: ["Phiếu đã xác nhận không sửa được — sai thì lập phiếu điều chỉnh."],
  },
  {
    path: "/stock-out",
    title: "Xuất kho",
    role: "admin, warehouse",
    logic: [
      "Xuất vật tư cho lệnh sản xuất. Xác nhận → kiểm tra đủ tồn, trừ tồn, ghi sổ theo giá vốn bình quân hiện hành.",
      "Thiếu tồn thì phiếu bị từ chối để tránh âm kho.",
    ],
  },
  {
    path: "/finance",
    title: "Thu chi & công nợ",
    role: "admin, accountant",
    logic: [
      "Quỹ/tài khoản ngân hàng có số dư đầu kỳ và số dư hiện tại.",
      "Phiếu thu/chi lập ở trạng thái Nháp; Xác nhận → RPC cộng (thu) hoặc trừ (chi) số dư tài khoản.",
      "Công nợ khách = tổng đơn đã xác nhận − tổng đã thu. Công nợ NCC = tổng phiếu nhập − tổng đã chi.",
    ],
  },
  {
    path: "/employees",
    title: "Nhân sự & lương",
    role: "admin, accountant",
    logic: [
      "Tạo nhân viên kèm tài khoản đăng nhập bằng username, gán vai trò và mức lương/phụ cấp.",
      "Chấm công ghi giờ theo ngày; sản lượng khoán ghi số lượng × đơn giá khoán.",
      "Tạo kỳ lương → Tạo bảng lương chạy RPC generate_payslips: lương = lương cơ bản + phụ cấp + tiền sản lượng + thưởng − khấu trừ − tạm ứng.",
      "Chốt kỳ khoá bảng lương, không tính lại được.",
    ],
  },
  {
    path: "/portal",
    title: "Cổng khách hàng",
    role: "customer",
    logic: [
      "Khách chỉ thấy đơn của chính mình (RLS lọc theo user_id gắn ở hồ sơ khách hàng).",
      "Khách tạo đơn Nháp, chọn sản phẩm/kích thước, tải file thiết kế lên kho riêng hoặc dán link Google Drive, rồi gửi cho xưởng xác nhận.",
    ],
  },
  {
    path: "/reports",
    title: "Báo cáo",
    role: "admin, accountant, sales",
    logic: [
      "Doanh thu theo tháng, tồn kho hiện tại kèm cảnh báo dưới định mức, top sản phẩm bán chạy.",
    ],
  },
  {
    path: "/settings",
    title: "Cài đặt & phân quyền",
    role: "admin",
    logic: [
      "Thông tin xưởng (dùng cho mẫu in), khổ cuộn mặc định, quy tắc làm tròn, cho phép/không cho phép âm kho.",
      "Gán vai trò cho từng tài khoản. Vai trò quyết định toàn bộ quyền đọc/ghi ở cả giao diện lẫn tầng dữ liệu.",
    ],
  },
  {
    path: "/activity",
    title: "Nhật ký hệ thống",
    role: "admin",
    logic: [
      "Ghi lại thao tác quan trọng: xác nhận đơn, xác nhận nhập/xuất kho, xác nhận thu chi, tạo lệnh sản xuất.",
      "Chỉ admin đọc được; không ai sửa/xoá được bản ghi.",
    ],
  },
];

const roleMatrix: { role: string; desc: string }[] = [
  { role: "admin", desc: "Toàn quyền, kể cả cài đặt và phân quyền." },
  { role: "sales", desc: "Khách hàng, đơn hàng, bảng giá, báo cáo bán hàng." },
  { role: "production", desc: "Lệnh sản xuất, BOM, nesting." },
  { role: "warehouse", desc: "Vật tư, kho, nhập/xuất kho." },
  { role: "accountant", desc: "Thu chi, công nợ, lương." },
  { role: "delivery", desc: "Theo dõi giao hàng." },
  { role: "customer", desc: "Chỉ Cổng khách hàng, chỉ dữ liệu của mình." },
];

const knownGaps: string[] = [
  "Module Giao hàng mới ở mức theo dõi trạng thái đơn, chưa có phiếu giao hàng riêng và lộ trình tài xế.",
  "Chưa có công nợ theo từng hoá đơn (đối trừ chi tiết) — công nợ đang tính tổng theo khách/NCC.",
  "Chưa có kiểm kê kho định kỳ và phiếu điều chỉnh tồn; sai lệch phải xử lý bằng phiếu nhập/xuất.",
  "Email nội bộ dạng username@xuongin.local không nhận được email thật — dùng cho tài khoản nội bộ, khách cần khôi phục mật khẩu nên dùng email thật.",
];

export default function Guide() {
  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Hướng dẫn & logic hệ thống</h1>
          <p className="text-sm text-muted-foreground">
            Tóm tắt cách vận hành từng phân hệ, luồng nghiệp vụ và những điểm còn giới hạn khi dùng thực tế.
          </p>
        </div>

        <Card className="p-4">
          <h2 className="font-semibold mb-2">Luồng nghiệp vụ chính</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Khách hàng (hoặc sale) tạo <b>Đơn hàng</b> → xác nhận đơn (chốt giá theo cấp khách) → sinh{" "}
            <b>Lệnh sản xuất</b> → <b>Xuất kho</b> vật tư theo BOM (trừ tồn theo giá vốn bình quân) → sản xuất xong →{" "}
            <b>Giao hàng</b> → <b>Phiếu thu</b> ghi nhận tiền về, phần còn lại nằm ở <b>Công nợ</b>. Song song:{" "}
            <b>Nhập kho</b> cập nhật tồn và giá vốn, <b>Nhân sự</b> tổng hợp công + sản lượng ra bảng lương.
          </p>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-3">Vai trò & quyền</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {roleMatrix.map((r) => (
              <div key={r.role} className="flex gap-2 text-sm">
                <Badge variant="secondary" className="h-fit font-mono">{r.role}</Badge>
                <span className="text-muted-foreground">{r.desc}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-1">Logic từng phân hệ</h2>
          <Accordion type="single" collapsible className="w-full">
            {sections.map((s) => (
              <AccordionItem key={s.path} value={s.path}>
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2 text-left">
                    {s.title}
                    <Badge variant="outline" className="font-normal">{s.role}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {s.logic.map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                  {s.rules && (
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-500">
                      {s.rules.map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                  )}
                  <Link to={s.path} className="inline-block mt-3 text-sm text-primary underline">
                    Mở {s.title}
                  </Link>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-2">Giới hạn còn lại khi dùng thực tế</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            {knownGaps.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </Card>
      </div>
    </AppLayout>
  );
}
