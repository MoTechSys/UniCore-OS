"use client"

/**
 * Dashboard Layout Component - UniCore-OS
 * 
 * Features:
 * - Sidebar with dynamic permissions
 * - Header with user menu
 * - Mobile bottom navigation
 * - Tabs context for page-specific tabs
 * - Session integration
 * 
 * @module components/layout/DashboardLayout
 */

import { useState, createContext, useContext, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Sidebar } from "./Sidebar"
import { getMobileNavItems, filterNavItems, type NavItem } from "@/config/navigation"
import { logout } from "@/features/auth/actions"
import {
  type LucideIcon,
  User,
  Settings,
  LogOut,
  Bell,
  Menu,
  MoreHorizontal,
  LayoutDashboard,
  BookOpen,
  Sparkles,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { sidebarNavItems } from "@/config/navigation"

// ============================================
// TYPES
// ============================================

export interface Tab {
  id: string
  label: string
  icon?: LucideIcon
  badge?: number
}

interface TabsContextType {
  tabs: Tab[]
  activeTab: string
  setTabs: (tabs: Tab[]) => void
  setActiveTab: (tab: string) => void
}

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

// ============================================
// CONTEXT
// ============================================

const TabsContext = createContext<TabsContextType | null>(null)

export function useTabs() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error("useTabs must be used within DashboardLayout")
  }
  return context
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getInitials(name: string): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
}

// ============================================
// HEADER COMPONENT (Desktop)
// ============================================

function Header({
  title,
  subtitle,
  onMobileMenuClick,
}: {
  title: string
  subtitle?: string
  onMobileMenuClick: () => void
}) {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user
  const notificationCount = 3 // TODO: Get from API

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-background/95 backdrop-blur-sm">
      {/* Right side */}
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

      {/* Left side */}
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
                <span className="text-primary text-sm font-bold">
                  {getInitials(user?.name ?? "")}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name ?? "مستخدم"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
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
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

// ============================================
// MOBILE HEADER
// ============================================

function MobileHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user
  const notificationCount = 3 // TODO: Get from API

  const handleLogout = async () => {
    await logout()
  }

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
                <span className="text-primary text-xs font-bold">
                  {getInitials(user?.name ?? "")}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name ?? "مستخدم"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
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
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

// ============================================
// BOTTOM NAVIGATION (Mobile)
// ============================================

function BottomNavigation({ onMoreClick }: { onMoreClick: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const permissions = session?.user?.permissions ?? []
  const isSystemRole = session?.user?.isSystemRole ?? false

  const mobileItems = getMobileNavItems()
  const visibleItems = filterNavItems(mobileItems, permissions, isSystemRole)

  return (
    <nav className="flex-shrink-0 h-16 border-t border-border bg-background/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around h-full px-2">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

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
              <span className={cn("text-[10px]", isActive && "font-medium")}>
                {item.label}
              </span>
            </Link>
          )
        })}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-muted-foreground"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px]">المزيد</span>
        </button>
      </div>
    </nav>
  )
}

// ============================================
// MOBILE DRAWER
// ============================================

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const permissions = session?.user?.permissions ?? []
  const isSystemRole = session?.user?.isSystemRole ?? false

  // Items not shown in bottom navigation
  const mobileItemIds = getMobileNavItems().map((i) => i.id)
  const drawerItems = sidebarNavItems.filter((item) => !mobileItemIds.includes(item.id))
  const visibleDrawerItems = filterNavItems(drawerItems, permissions, isSystemRole)

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-50 max-h-[70vh] overflow-y-auto safe-area-bottom">
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mt-3 mb-4" />
        <div className="px-4 pb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            المزيد من الخيارات
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {visibleDrawerItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs text-center">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================
// TABS BAR
// ============================================

function TabsBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  if (tabs.length === 0) return null

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="flex gap-1 p-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <Badge
                  variant={isActive ? "secondary" : "default"}
                  className="h-5 min-w-5 px-1"
                >
                  {tab.badge}
                </Badge>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// MAIN LAYOUT COMPONENT
// ============================================

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTab, setActiveTab] = useState("")

  return (
    <TabsContext.Provider value={{ tabs, activeTab, setTabs, setActiveTab }}>
      <div className="min-h-screen bg-background">
        {/* Sidebar (Desktop) */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Main content area */}
        <div
          className={cn(
            "transition-all duration-300",
            sidebarCollapsed ? "lg:mr-20" : "lg:mr-72"
          )}
        >
          {/* Desktop Header */}
          <div className="hidden lg:block">
            <Header
              title={title}
              subtitle={subtitle}
              onMobileMenuClick={() => setMobileMenuOpen(true)}
            />
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden">
            <MobileHeader title={title} subtitle={subtitle} />
          </div>

          {/* Tabs Bar */}
          <TabsBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Page Content */}
          <main className="p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>

          {/* Mobile Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 lg:hidden">
            <BottomNavigation onMoreClick={() => setMobileDrawerOpen(true)} />
          </div>

          {/* Mobile Drawer */}
          <MobileDrawer
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
          />
        </div>
      </div>
    </TabsContext.Provider>
  )
}
