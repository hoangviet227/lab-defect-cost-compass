import {
  LayoutDashboard,
  ShoppingCart,
  Factory,
  Truck,
  Users,
  Package,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  Receipt,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
  BookText,
  Scissors,
} from "lucide-react";
import { StackedLogo } from "./StackedLogo";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const navItems = [
  { icon: LayoutDashboard, label: "Tổng quan", path: "/dashboard" },
  { icon: ShoppingCart, label: "Đơn hàng", path: "/orders" },
  { icon: Factory, label: "Sản xuất", path: "/production" },
  { icon: Truck, label: "Giao hàng", path: "/deliveries" },
  { icon: Users, label: "Khách hàng", path: "/customers" },
  { icon: Package, label: "Sản phẩm", path: "/products" },
  { icon: Scissors, label: "Nesting 60cm", path: "/nesting" },
  { icon: Boxes, label: "Vật tư", path: "/materials" },
  { icon: Boxes, label: "Kho", path: "/warehouses" },
  { icon: ArrowDownToLine, label: "Nhập kho", path: "/stock-in" },
  { icon: ArrowUpFromLine, label: "Xuất kho", path: "/stock-out" },
  { icon: Wallet, label: "Thu chi", path: "/finance" },
  { icon: Receipt, label: "Nhà cung cấp", path: "/suppliers" },
  { icon: UserCog, label: "Nhân viên", path: "/employees" },
  { icon: BarChart3, label: "Báo cáo", path: "/reports" },
  { icon: BookText, label: "Nhật ký", path: "/activity" },
  { icon: Users, label: "Cổng khách hàng", path: "/portal" },
  { icon: Settings, label: "Cài đặt", path: "/settings" },
];

export function SidebarContent({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <>
      <div className="flex items-center gap-2 px-3 h-11 border-b border-sidebar-border">
        <StackedLogo size={16} color="currentColor" />
        {!collapsed && (
          <span className="font-bold uppercase tracking-[0.08em] text-[13px] text-sidebar-accent-foreground">
            Xưởng In
          </span>
        )}
      </div>

      <nav className="flex-1 py-1.5 px-1.5 space-y-px overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded text-[13px] transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <div className="flex items-center gap-2 px-1">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-[9px] leading-none">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <span className="text-[12px] text-sidebar-foreground truncate flex-1">
              {profile?.full_name || "Người dùng"}
            </span>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-sidebar-foreground hover:bg-sidebar-accent h-6 w-6"
              title="Đăng xuất"
            >
              <LogOut className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden md:flex flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0 w-52">
      <div className="flex flex-col flex-1 overflow-hidden">
        <SidebarContent />
      </div>
    </aside>
  );
}
