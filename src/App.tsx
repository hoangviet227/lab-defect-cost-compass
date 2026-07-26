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
import StockOut from "./pages/StockOut";
import Products from "./pages/Products";
import ProductBom from "./pages/ProductBom";
import Nesting from "./pages/Nesting";
import Orders from "./pages/Orders";
import Production from "./pages/Production";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Reports from "./pages/Reports";
import Finance from "./pages/Finance";
import HR from "./pages/HR";
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
              <Route path="/orders" element={<Protected><Orders /></Protected>} />
              <Route path="/production" element={<Protected><Production /></Protected>} />
              <Route path="/deliveries" element={<Protected><PlaceholderPage title="Giao hàng" description="Phiếu giao và trạng thái giao hàng." /></Protected>} />
              <Route path="/customers" element={<Protected><Customers /></Protected>} />
              <Route path="/products" element={<Protected><Products /></Protected>} />
              <Route path="/products/:id/bom" element={<Protected><ProductBom /></Protected>} />
              <Route path="/nesting" element={<Protected><Nesting /></Protected>} />
              <Route path="/materials" element={<Protected><Materials /></Protected>} />
              <Route path="/warehouses" element={<Protected><Warehouses /></Protected>} />
              <Route path="/stock-in" element={<Protected><StockIn /></Protected>} />
              <Route path="/stock-out" element={<Protected><StockOut /></Protected>} />
              <Route path="/finance" element={<Protected><Finance /></Protected>} />
              <Route path="/suppliers" element={<Protected><Suppliers /></Protected>} />
              <Route path="/employees" element={<Protected><HR /></Protected>} />
              <Route path="/reports" element={<Protected><Reports /></Protected>} />
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
