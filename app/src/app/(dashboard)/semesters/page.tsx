/**
 * Semesters & Offerings Page (Server Component)
 * @module app/(dashboard)/semesters/page
 */

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { SemestersPageContent } from "@/features/semesters/components/SemestersPageContent"
import { getSemesters, getOfferings } from "@/features/semesters/actions"
import { prisma } from "@/lib/prisma"

export default async function SemestersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/semesters")

  const isSystemRole = session.user.isSystemRole ?? false
  const permissions = session.user.permissions ?? []
  if (!isSystemRole && !permissions.includes("semester.view")) redirect("/unauthorized")

  const [semResult, offResult, courses, instructorUsers] = await Promise.all([
    getSemesters(),
    getOfferings(),
    prisma.course.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, code: true, nameAr: true },
      orderBy: { code: "asc" },
    }),
    prisma.user.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        roles: { some: { role: { code: "INSTRUCTOR" } } },
      },
      select: { id: true, profile: { select: { firstNameAr: true, lastNameAr: true } } },
    }),
  ])

  const instructors = instructorUsers.map((u) => ({
    id: u.id,
    name: u.profile ? `${u.profile.firstNameAr} ${u.profile.lastNameAr}` : "بدون اسم",
  }))

  return (
    <DashboardLayout title="الفصول والشعب" subtitle="إدارة الفصول الدراسية والشعب وتسجيل الطلاب">
      <SemestersPageContent
        semesters={semResult.data ?? []}
        offerings={offResult.data?.offerings ?? []}
        courses={courses}
        instructors={instructors}
        permissions={{
          canManageSemesters: isSystemRole || permissions.includes("semester.manage"),
          canSetCurrent: isSystemRole || permissions.includes("semester.set_current"),
          canManageOfferings: isSystemRole || permissions.includes("offering.create"),
          canEnroll: isSystemRole || permissions.includes("offering.enroll_students"),
        }}
      />
    </DashboardLayout>
  )
}
