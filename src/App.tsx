import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Materials from "./pages/Materials";
import Warehouses from "./pages/Warehouses";
import StockIn from "./pages/StockIn";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
              <Route path="/orders" element={<Protected><PlaceholderPage title="Đơn hàng" description="Danh sách đơn hàng, tạo đơn, chi tiết đơn." /></Protected>} />
              <Route path="/production" element={<Protected><PlaceholderPage title="Lệnh sản xuất" description="Theo dõi và quản lý lệnh sản xuất." /></Protected>} />
              <Route path="/deliveries" element={<Protected><PlaceholderPage title="Giao hàng" description="Phiếu giao và trạng thái giao hàng." /></Protected>} />
              <Route path="/customers" element={<Protected><PlaceholderPage title="Khách hàng" description="Quản lý khách hàng và cấp đại lý." /></Protected>} />
              <Route path="/products" element={<Protected><PlaceholderPage title="Sản phẩm" description="Sản phẩm, biến thể và BOM." /></Protected>} />
              <Route path="/materials" element={<Protected><Materials /></Protected>} />
              <Route path="/warehouses" element={<Protected><Warehouses /></Protected>} />
              <Route path="/stock-in" element={<Protected><StockIn /></Protected>} />
              <Route path="/stock-out" element={<Protected><PlaceholderPage title="Xuất kho" description="Xuất vật tư cho sản xuất và điều chỉnh kho." /></Protected>} />
              <Route path="/finance" element={<Protected><PlaceholderPage title="Thu chi" description="Phiếu thu, phiếu chi, quỹ và công nợ." /></Protected>} />
              <Route path="/suppliers" element={<Protected><PlaceholderPage title="Nhà cung cấp" description="Danh sách nhà cung cấp và công nợ." /></Protected>} />
              <Route path="/employees" element={<Protected><PlaceholderPage title="Nhân viên" description="Nhân viên, chấm công, sản lượng, lương." /></Protected>} />
              <Route path="/reports" element={<Protected><PlaceholderPage title="Báo cáo" description="Doanh thu, tồn kho, lợi nhuận, hiệu suất vật liệu." /></Protected>} />
              <Route path="/activity" element={<Protected><PlaceholderPage title="Nhật ký hệ thống" description="Lịch sử thao tác của toàn hệ thống." /></Protected>} />
              <Route path="/settings" element={<Protected><PlaceholderPage title="Cài đặt" description="Thông tin xưởng, người dùng và phân quyền." /></Protected>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
