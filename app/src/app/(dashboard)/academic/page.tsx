/**
 * Academic Structure Page (Server Component)
 * 
 * Displays the academic hierarchy: Colleges → Departments → Majors
 * 
 * @module app/(dashboard)/academic/page
 */

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { AcademicPageContent } from "@/features/academic/components/AcademicPageContent"
import { getColleges } from "@/features/academic/actions"

export default async function AcademicPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login?callbackUrl=/academic")
  }

  const isSystemRole = session.user.isSystemRole ?? false
  const permissions = session.user.permissions ?? []

  const hasViewPermission =
    isSystemRole ||
    permissions.includes("college.manage") ||
    permissions.includes("department.manage") ||
    permissions.includes("major.manage")

  if (!hasViewPermission) {
    redirect("/unauthorized")
  }

  const result = await getColleges()

  return (
    <DashboardLayout title="الهيكل الأكاديمي" subtitle="إدارة الكليات والأقسام والتخصصات">
      <AcademicPageContent
        initialData={result.data ?? []}
        permissions={{
          canManageColleges: isSystemRole || permissions.includes("college.manage"),
          canManageDepartments: isSystemRole || permissions.includes("department.manage"),
          canManageMajors: isSystemRole || permissions.includes("major.manage"),
        }}
      />
    </DashboardLayout>
  )
}
