/**
 * Courses Management Page (Server Component)
 * @module app/(dashboard)/courses/page
 */

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { CoursesPageContent } from "@/features/courses/components/CoursesPageContent"
import { getCourses } from "@/features/courses/actions"
import { getDepartmentsForSelect } from "@/features/academic/actions"

interface SearchParams {
  search?: string
  departmentId?: string
  page?: string
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/courses")

  const isSystemRole = session.user.isSystemRole ?? false
  const permissions = session.user.permissions ?? []
  if (!isSystemRole && !permissions.includes("course.view")) redirect("/unauthorized")

  const params = await searchParams
  const [coursesResult, deptsResult] = await Promise.all([
    getCourses({
      search: params.search,
      departmentId: params.departmentId,
      page: parseInt(params.page ?? "1"),
    }),
    getDepartmentsForSelect(),
  ])

  return (
    <DashboardLayout title="إدارة المقررات" subtitle="عرض وإدارة المقررات الدراسية">
      <CoursesPageContent
        initialData={{
          courses: coursesResult.data?.courses ?? [],
          total: coursesResult.data?.total ?? 0,
          page: coursesResult.data?.page ?? 1,
          totalPages: coursesResult.data?.totalPages ?? 1,
        }}
        departments={deptsResult.data ?? []}
        permissions={{
          canCreate: isSystemRole || permissions.includes("course.create"),
          canEdit: isSystemRole || permissions.includes("course.edit"),
          canDelete: isSystemRole || permissions.includes("course.delete"),
        }}
        searchParams={params}
      />
    </DashboardLayout>
  )
}
