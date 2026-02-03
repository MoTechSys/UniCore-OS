/**
 * Users Management Page (Server Component)
 * 
 * Displays list of users with search, filter, and CRUD operations.
 * Permission check happens on the server before rendering.
 * 
 * @module app/(dashboard)/users/page
 */

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { UsersPageContent } from "@/features/users/components/UsersPageContent"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// ============================================
// TYPES
// ============================================

interface SearchParams {
  page?: string
  search?: string
  status?: string
  roleId?: string
}

// ============================================
// DATA FETCHING
// ============================================

async function getUsersData(params: SearchParams) {
  const page = parseInt(params.page ?? "1", 10)
  const pageSize = 10
  const skip = (page - 1) * pageSize

  // Build where clause
  const where: Record<string, unknown> = {
    deletedAt: null,
  }

  if (params.search) {
    where.OR = [
      { profile: { firstNameAr: { contains: params.search } } },
      { profile: { lastNameAr: { contains: params.search } } },
      { email: { contains: params.search } },
      { academicId: { contains: params.search } },
    ]
  }

  if (params.status && params.status !== "ALL") {
    where.status = params.status
  }

  if (params.roleId && params.roleId !== "ALL") {
    where.roles = {
      some: { roleId: params.roleId },
    }
  }

  // Fetch users and count in parallel
  const [users, total, roles] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: {
            firstNameAr: true,
            lastNameAr: true,
            firstNameEn: true,
            lastNameEn: true,
            phone: true,
          },
        },
        roles: {
          include: {
            role: {
              select: {
                id: true,
                nameAr: true,
                code: true,
                isSystem: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
    prisma.role.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        nameAr: true,
        code: true,
        isSystem: true,
      },
      orderBy: { nameAr: "asc" },
    }),
  ])

  return {
    users,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    roles,
  }
}

// ============================================
// LOADING COMPONENT
// ============================================

function UsersLoading() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="mr-2 text-muted-foreground">جارٍ تحميل المستخدمين...</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// PAGE COMPONENT
// ============================================

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  // Check authentication and authorization on server
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/users")
  }

  // Check permission - system admin bypasses all checks
  const isSystemRole = session.user.isSystemRole ?? false
  const permissions = session.user.permissions ?? []
  const hasViewPermission = isSystemRole || permissions.includes("user.view")

  if (!hasViewPermission) {
    redirect("/unauthorized")
  }

  // Check other permissions for UI
  const canCreate = isSystemRole || permissions.includes("user.create")
  const canEdit = isSystemRole || permissions.includes("user.edit")
  const canDelete = isSystemRole || permissions.includes("user.delete")
  const canFreeze = isSystemRole || permissions.includes("user.freeze")

  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams

  // Fetch data
  const data = await getUsersData(params)

  return (
    <DashboardLayout title="إدارة المستخدمين" subtitle="إدارة حسابات المستخدمين والأدوار">
      <Suspense fallback={<UsersLoading />}>
        <UsersPageContent
          initialData={data}
          permissions={{
            canCreate,
            canEdit,
            canDelete,
            canFreeze,
          }}
          searchParams={params}
        />
      </Suspense>
    </DashboardLayout>
  )
}
