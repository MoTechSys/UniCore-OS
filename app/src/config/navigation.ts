/**
 * Navigation Configuration
 * 
 * Defines all navigation items with their required permissions.
 * Items are filtered dynamically based on user permissions.
 * 
 * @module config/navigation
 */

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
  Trash2,
  type LucideIcon,
} from "lucide-react"

/**
 * Navigation item structure
 */
export interface NavItem {
  /** Unique identifier */
  id: string
  /** Display label (Arabic) */
  label: string
  /** Lucide icon component */
  icon: LucideIcon
  /** Route path */
  href: string
  /** Required permission (optional - if not set, item is always visible) */
  permission?: string
  /** Alternative permissions (any of these grants access) */
  anyPermission?: string[]
  /** Show in mobile bottom navigation */
  showInMobile?: boolean
  /** Badge count (for notifications, etc.) */
  badge?: number
}

/**
 * Main sidebar navigation items
 * 
 * Order matters - items are displayed in this order
 */
export const sidebarNavItems: NavItem[] = [
  {
    id: "dashboard",
    label: "لوحة التحكم",
    icon: LayoutDashboard,
    href: "/dashboard",
    showInMobile: true,
    // No permission required - everyone can see dashboard
  },
  {
    id: "users",
    label: "إدارة المستخدمين",
    icon: Users,
    href: "/users",
    permission: "user.view",
  },
  {
    id: "roles",
    label: "الأدوار والصلاحيات",
    icon: Shield,
    href: "/roles",
    permission: "role.view",
  },
  {
    id: "courses",
    label: "إدارة المقررات",
    icon: BookOpen,
    href: "/courses",
    permission: "course.view",
    showInMobile: true,
  },
  {
    id: "files",
    label: "إدارة الملفات",
    icon: FolderOpen,
    href: "/files",
    permission: "file.view",
  },
  {
    id: "academic",
    label: "البيانات الأكاديمية",
    icon: GraduationCap,
    href: "/academic",
    anyPermission: ["college.manage", "department.manage", "major.manage", "semester.view"],
  },
  {
    id: "notifications",
    label: "الإشعارات",
    icon: Bell,
    href: "/notifications",
    // No permission required - everyone can see their notifications
  },
  {
    id: "ai",
    label: "الذكاء الاصطناعي",
    icon: Sparkles,
    href: "/ai",
    anyPermission: ["ai.generate_quiz", "ai.summarize", "ai.chat"],
    showInMobile: true,
  },
  {
    id: "reports",
    label: "التقارير",
    icon: BarChart3,
    href: "/reports",
    permission: "system.reports",
  },
  {
    id: "settings",
    label: "الإعدادات",
    icon: Settings,
    href: "/settings",
    permission: "system.settings",
  },
  {
    id: "logs",
    label: "سجلات النظام",
    icon: FileText,
    href: "/logs",
    permission: "system.audit_log",
  },
  {
    id: "trash",
    label: "سلة المحذوفات",
    icon: Trash2,
    href: "/trash",
    permission: "system.trash",
  },
]

/**
 * Get mobile bottom navigation items
 */
export function getMobileNavItems(): NavItem[] {
  return sidebarNavItems.filter(item => item.showInMobile)
}

/**
 * Check if user has access to a navigation item
 * 
 * @param item - Navigation item to check
 * @param permissions - User's permissions array
 * @param isSystemRole - Whether user has system role (Super Admin)
 */
export function hasNavAccess(
  item: NavItem,
  permissions: string[],
  isSystemRole: boolean = false
): boolean {
  // System role (Super Admin) has access to everything
  if (isSystemRole) return true
  
  // No permission required
  if (!item.permission && !item.anyPermission) return true
  
  // Check single permission
  if (item.permission) {
    return permissions.includes(item.permission)
  }
  
  // Check any permission
  if (item.anyPermission && item.anyPermission.length > 0) {
    return item.anyPermission.some(p => permissions.includes(p))
  }
  
  return false
}

/**
 * Filter navigation items based on user permissions
 * 
 * @param items - Navigation items to filter
 * @param permissions - User's permissions array
 * @param isSystemRole - Whether user has system role (Super Admin)
 */
export function filterNavItems(
  items: NavItem[],
  permissions: string[],
  isSystemRole: boolean = false
): NavItem[] {
  return items.filter(item => hasNavAccess(item, permissions, isSystemRole))
}
