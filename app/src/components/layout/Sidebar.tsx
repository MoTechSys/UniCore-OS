"use client";

/**
 * القائمة الجانبية الديناميكية - UniCore-OS
 * 
 * - تعرض العناصر حسب صلاحيات المستخدم
 * - قابلة للإخفاء والإظهار
 * - متجاوبة مع جميع الأجهزة
 * - متوافقة مع Next.js App Router
 */

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Shield,
  BookOpen,
  FolderOpen,
  GraduationCap,
  Bell,
  Sparkles,
  BarChart3,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
  Trash2,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

// ============================================
// TYPES
// ============================================

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  permission?: string;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

// ============================================
// SIDEBAR ITEMS (Dynamic based on permissions)
// ============================================

export const sidebarItems: MenuItem[] = [
  { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard, href: "/dashboard" },
  { id: "users", label: "إدارة المستخدمين", icon: Users, href: "/users", permission: "user.view" },
  { id: "roles", label: "الأدوار والصلاحيات", icon: Shield, href: "/roles", permission: "role.view" },
  { id: "courses", label: "إدارة المقررات", icon: BookOpen, href: "/courses", permission: "course.view" },
  { id: "files", label: "إدارة الملفات", icon: FolderOpen, href: "/files", permission: "file.view" },
  { id: "academic", label: "البيانات الأكاديمية", icon: GraduationCap, href: "/academic", permission: "academic.view" },
  { id: "notifications", label: "الإشعارات", icon: Bell, href: "/notifications" },
  { id: "ai", label: "الذكاء الاصطناعي", icon: Sparkles, href: "/ai", permission: "ai.use" },
  { id: "reports", label: "التقارير", icon: BarChart3, href: "/reports", permission: "report.view" },
  { id: "settings", label: "الإعدادات", icon: Settings, href: "/settings", permission: "setting.manage" },
  { id: "logs", label: "سجلات النظام", icon: FileText, href: "/logs", permission: "audit.view" },
  { id: "trash", label: "سلة المحذوفات", icon: Trash2, href: "/trash", permission: "trash.view" },
];

// ============================================
// TEMPORARY: Mock user and permission check
// TODO: Replace with real auth context
// ============================================

const mockUser = {
  id: "1",
  fullName: "أحمد محمد",
  roleName: "مدير النظام",
  permissions: ["*"], // Super Admin has all permissions
};

function hasPermission(permission: string): boolean {
  // Super Admin bypass
  if (mockUser.permissions.includes("*")) return true;
  return mockUser.permissions.includes(permission);
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2);
}

// ============================================
// SIDEBAR COMPONENT
// ============================================

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  // فلترة العناصر حسب الصلاحيات
  const visibleItems = sidebarItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Overlay للموبايل */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* القائمة الجانبية */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full bg-sidebar border-l border-sidebar-border z-50 transition-all duration-300 flex flex-col",
          collapsed ? "w-20" : "w-72",
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {/* الهيدر مع زر الطي */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {/* زر الطي/التوسيع */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                onClick={onToggle}
              >
                {collapsed ? (
                  <PanelRightOpen className="h-5 w-5" />
                ) : (
                  <PanelRightClose className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {collapsed ? "توسيع القائمة" : "طي القائمة"}
            </TooltipContent>
          </Tooltip>

          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">U</span>
              </div>
              <div>
                <h1 className="font-bold text-foreground">UniCore-OS</h1>
                <p className="text-xs text-muted-foreground">نظام إدارة جامعي</p>
              </div>
            </div>
          )}
          
          {collapsed && (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              <span className="text-primary font-bold text-lg">U</span>
            </div>
          )}

          {/* زر الإغلاق للموبايل */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMobileClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* عناصر القائمة */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              if (collapsed) {
                return (
                  <li key={item.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={item.href} onClick={onMobileClose}>
                          <div
                            className={cn(
                              "flex items-center justify-center h-12 rounded-lg transition-all duration-200",
                              active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-primary"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                            )}
                          >
                            <Icon className={cn("h-5 w-5", active && "text-primary")} />
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="bg-card border-border">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <Link href={item.href} onClick={onMobileClose}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", active && "text-primary")} />
                      <span className={cn(active && "text-primary font-medium")}>{item.label}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* معلومات المستخدم */}
        <div className="p-3 border-t border-sidebar-border">
          <Link href="/profile">
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors cursor-pointer",
              collapsed && "justify-center",
              isActive("/profile") && "bg-sidebar-accent border-r-2 border-primary"
            )}>
              <Avatar className="h-10 w-10 border-2 border-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(mockUser.fullName)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{mockUser.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{mockUser.roleName}</p>
                </div>
              )}
              {!collapsed && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // TODO: Implement logout
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>تسجيل الخروج</TooltipContent>
                </Tooltip>
              )}
            </div>
          </Link>
        </div>
      </aside>
    </TooltipProvider>
  );
}

// ============================================
// MOBILE MENU BUTTON
// ============================================

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={onClick}
    >
      <Menu className="h-6 w-6" />
    </Button>
  );
}
