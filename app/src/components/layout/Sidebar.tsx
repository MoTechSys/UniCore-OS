"use client"

/**
 * Dynamic Sidebar Component - UniCore-OS
 * 
 * Features:
 * - Dynamic navigation based on user permissions
 * - Collapsible sidebar with tooltips
 * - Mobile responsive with drawer
 * - Real session integration
 * 
 * @module components/layout/Sidebar
 */

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { sidebarNavItems, filterNavItems } from "@/config/navigation"
import { logout } from "@/features/auth/actions"
import {
  LogOut,
  X,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"

// ============================================
// TYPES
// ============================================

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
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
// SIDEBAR COMPONENT
// ============================================

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  // Get user data from session
  const user = session?.user
  const permissions = user?.permissions ?? []
  const isSystemRole = user?.isSystemRole ?? false

  // Filter navigation items based on permissions
  const visibleItems = filterNavItems(sidebarNavItems, permissions, isSystemRole)

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/"
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <TooltipProvider delayDuration={0}>
      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full bg-sidebar border-l border-sidebar-border z-50 transition-all duration-300 flex flex-col",
          collapsed ? "w-20" : "w-72",
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header with collapse button */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {/* Collapse/Expand button */}
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

          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMobileClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {status === "loading" ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ul className="space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

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
                  )
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
                        <span className={cn(active && "text-primary font-medium")}>
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-sidebar-border">
          {status === "loading" ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : user ? (
            <Link href="/profile">
              <div
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors cursor-pointer",
                  collapsed && "justify-center",
                  isActive("/profile") && "bg-sidebar-accent border-r-2 border-primary"
                )}
              >
                <Avatar className="h-10 w-10 border-2 border-primary/30">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(user.name ?? "")}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {isSystemRole ? "مدير النظام" : "مستخدم"}
                    </p>
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
                          e.preventDefault()
                          e.stopPropagation()
                          handleLogout()
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
          ) : null}
        </div>
      </aside>
    </TooltipProvider>
  )
}

// Re-export for backward compatibility
export { sidebarNavItems as sidebarItems }
