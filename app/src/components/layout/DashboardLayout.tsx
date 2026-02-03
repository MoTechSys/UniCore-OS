"use client";

/**
 * التخطيط الرئيسي للوحة التحكم - UniCore-OS
 * 
 * - يحتوي على القائمة الجانبية والهيدر
 * - شريط تنقل سفلي للهاتف
 * - تصميم يشبه التطبيق الأصلي على الهاتف
 * - شريط التبويبات ثابت عند التمرير
 * - متوافق مع Next.js App Router
 */

import { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { LucideIcon, User, Settings, LogOut, Bell, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ============================================
// TYPES
// ============================================

export interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
}

interface TabsContextType {
  tabs: Tab[];
  activeTab: string;
  setTabs: (tabs: Tab[]) => void;
  setActiveTab: (tab: string) => void;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

// ============================================
// CONTEXT
// ============================================

const TabsContext = createContext<TabsContextType | null>(null);

export function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("useTabs must be used within DashboardLayout");
  }
  return context;
}

// ============================================
// HEADER COMPONENT (Desktop)
// ============================================

function Header({ 
  title, 
  subtitle, 
  onMobileMenuClick 
}: { 
  title: string; 
  subtitle?: string;
  onMobileMenuClick: () => void;
}) {
  const router = useRouter();
  const notificationCount = 3;

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-background/95 backdrop-blur-sm">
      {/* الجانب الأيمن */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMobileMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {/* الجانب الأيسر */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => router.push("/notifications")}
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {notificationCount}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-sm font-bold">أ</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">أحمد محمد</p>
              <p className="text-xs text-muted-foreground">admin@unicore.edu</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="h-4 w-4 ml-2" />
              الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="h-4 w-4 ml-2" />
              الإعدادات
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ============================================
// MOBILE HEADER
// ============================================

function MobileHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  const notificationCount = 3;

  return (
    <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold text-sm">U</span>
        </div>
        <div>
          <h1 className="font-semibold text-sm leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative"
          onClick={() => router.push("/notifications")}
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -left-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary">
              {notificationCount}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-xs font-bold">أ</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">أحمد محمد</p>
              <p className="text-xs text-muted-foreground">admin@unicore.edu</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="h-4 w-4 ml-2" />
              الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="h-4 w-4 ml-2" />
              الإعدادات
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ============================================
// BOTTOM NAVIGATION (Mobile)
// ============================================

import Link from "next/link";
import { 
  LayoutDashboard, 
  BookOpen, 
  Sparkles, 
  MoreHorizontal 
} from "lucide-react";

function BottomNavigation({ onMoreClick }: { onMoreClick: () => void }) {
  const pathname = usePathname();

  const items = [
    { id: "dashboard", label: "الرئيسية", icon: LayoutDashboard, href: "/dashboard" },
    { id: "courses", label: "المقررات", icon: BookOpen, href: "/courses" },
    { id: "ai", label: "AI", icon: Sparkles, href: "/ai" },
    { id: "more", label: "المزيد", icon: MoreHorizontal, href: "#" },
  ];

  return (
    <nav className="flex-shrink-0 h-16 border-t border-border bg-background/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around h-full px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.href !== "#" && pathname.startsWith(item.href);
          const isMore = item.id === "more";

          if (isMore) {
            return (
              <button
                key={item.id}
                onClick={onMoreClick}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-muted-foreground"
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn("text-[10px]", isActive && "font-medium")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================
// MOBILE DRAWER
// ============================================

import { sidebarItems } from "./Sidebar";

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  // العناصر التي لا تظهر في الشريط السفلي
  const drawerItems = sidebarItems.filter(
    item => !["dashboard", "courses", "ai"].includes(item.id)
  );

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-50 max-h-[70vh] overflow-y-auto safe-area-bottom">
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mt-3 mb-4" />
        <div className="px-4 pb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">المزيد من الخيارات</h3>
          <div className="grid grid-cols-4 gap-4">
            {drawerItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] text-center leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================
// MAIN LAYOUT COMPONENT
// ============================================

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState("");

  // قراءة حالة الطي من localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  // حفظ حالة الطي
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  // إغلاق القائمة عند تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
        setDrawerOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <TabsContext.Provider value={{ tabs, activeTab, setTabs, setActiveTab }}>
      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen bg-background flex-col">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div
          className={cn(
            "transition-all duration-300 flex flex-col flex-1",
            collapsed ? "lg:mr-20" : "lg:mr-72"
          )}
        >
          <div className="sticky top-0 z-40 bg-background">
            <Header
              title={title}
              subtitle={subtitle}
              onMobileMenuClick={() => setMobileOpen(true)}
            />
            
            {tabs.length > 0 && (
              <div className="border-b border-border bg-background/95 backdrop-blur-sm px-4 lg:px-6 py-2">
                <nav className="flex gap-1 overflow-x-auto pb-px -mb-px">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{tab.label}</span>
                        {tab.badge !== undefined && tab.badge > 0 && (
                          <span className={cn(
                            "px-2 py-0.5 text-xs rounded-full",
                            isActive 
                              ? "bg-primary/20 text-primary" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-[100svh] bg-background overflow-hidden">
        <MobileHeader title={title} subtitle={subtitle} />

        {tabs.length > 0 && (
          <div className="flex-shrink-0 border-b border-border bg-background">
            <div className="flex gap-1 overflow-x-auto px-2 py-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-all flex-shrink-0",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className={cn(
                        "px-1 py-0 text-[9px] rounded-full min-w-[14px] text-center",
                        isActive 
                          ? "bg-primary/20 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-auto overscroll-contain">
          <div className="p-3 pb-20">
            {children}
          </div>
        </main>

        <BottomNavigation onMoreClick={() => setDrawerOpen(true)} />
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </TabsContext.Provider>
  );
}
