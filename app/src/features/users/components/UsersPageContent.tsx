"use client"

/**
 * Users Page Content (Client Component)
 * 
 * Handles interactive features: search, filter, pagination, and actions.
 * Receives initial data from server component.
 * 
 * @module features/users/components/UsersPageContent
 */

import { useState, useTransition, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { UsersTable } from "./UsersTable"
import { CreateUserModal } from "./CreateUserModal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react"

// ============================================
// TYPES
// ============================================

interface UserData {
  id: string
  academicId: string
  email: string | null
  status: string
  createdAt: Date
  lastLoginAt: Date | null
  profile: {
    firstNameAr: string
    lastNameAr: string
    firstNameEn: string | null
    lastNameEn: string | null
    phone: string | null
  } | null
  roles: {
    role: {
      id: string
      nameAr: string
      code: string
      isSystem: boolean
    }
  }[]
}

interface RoleData {
  id: string
  nameAr: string
  code: string
  isSystem: boolean
}

interface UsersPageContentProps {
  initialData: {
    users: UserData[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    roles: RoleData[]
  }
  permissions: {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canFreeze: boolean
  }
  searchParams: {
    page?: string
    search?: string
    status?: string
    roleId?: string
  }
}

// ============================================
// STATS COMPONENT
// ============================================

function UsersStats({ users, total }: { users: UserData[]; total: number }) {
  const activeCount = users.filter((u) => u.status === "ACTIVE").length
  const pendingCount = users.filter(
    (u) => u.status === "PENDING" || u.status === "PENDING_ACTIVATION"
  ).length
  const frozenCount = users.filter((u) => u.status === "FROZEN").length

  const stats = [
    {
      title: "إجمالي المستخدمين",
      value: total,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "المستخدمين النشطين",
      value: activeCount,
      icon: UserCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "في الانتظار",
      value: pendingCount,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "المجمدين",
      value: frozenCount,
      icon: UserX,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function UsersPageContent({
  initialData,
  permissions,
  searchParams,
}: UsersPageContentProps) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Local state for filters
  const [search, setSearch] = useState(searchParams.search ?? "")
  const [statusFilter, setStatusFilter] = useState(searchParams.status ?? "ALL")
  const [roleFilter, setRoleFilter] = useState(searchParams.roleId ?? "ALL")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Update URL with filters
  const updateFilters = useCallback(
    (newParams: Record<string, string>) => {
      const params = new URLSearchParams(urlSearchParams.toString())
      
      Object.entries(newParams).forEach(([key, value]) => {
        if (value && value !== "ALL" && value !== "") {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })

      // Reset to page 1 when filters change
      if (!newParams.page) {
        params.delete("page")
      }

      startTransition(() => {
        router.push(`/users?${params.toString()}`)
      })
    },
    [router, urlSearchParams]
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (searchParams.search ?? "")) {
        updateFilters({ search })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, searchParams.search, updateFilters])

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    updateFilters({ status: value })
  }

  // Handle role filter change
  const handleRoleChange = (value: string) => {
    setRoleFilter(value)
    updateFilters({ roleId: value })
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() })
  }

  // Handle refresh
  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <UsersStats users={initialData.users} total={initialData.total} />

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              البحث والفلترة
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isPending}
              >
                <RefreshCw
                  className={`h-4 w-4 ml-2 ${isPending ? "animate-spin" : ""}`}
                />
                تحديث
              </Button>
              {permissions.canCreate && (
                <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
                  <UserPlus className="h-4 w-4 ml-2" />
                  إضافة مستخدم
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد أو الرقم الأكاديمي..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">جميع الحالات</SelectItem>
                <SelectItem value="ACTIVE">نشط</SelectItem>
                <SelectItem value="PENDING_ACTIVATION">في الانتظار</SelectItem>
                <SelectItem value="FROZEN">مجمد</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">جميع الأدوار</SelectItem>
                {initialData.roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          <UsersTable
            users={initialData.users}
            permissions={permissions}
            onRefresh={handleRefresh}
          />

          {/* Pagination */}
          {initialData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                عرض {(initialData.page - 1) * initialData.pageSize + 1} -{" "}
                {Math.min(
                  initialData.page * initialData.pageSize,
                  initialData.total
                )}{" "}
                من {initialData.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(initialData.page - 1)}
                  disabled={initialData.page === 1 || isPending}
                >
                  السابق
                </Button>
                <span className="text-sm">
                  صفحة {initialData.page} من {initialData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(initialData.page + 1)}
                  disabled={initialData.page === initialData.totalPages || isPending}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <CreateUserModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        roles={initialData.roles}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
