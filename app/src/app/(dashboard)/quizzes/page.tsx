/**
 * Quizzes Page (Server Component)
 * @module app/(dashboard)/quizzes/page
 */

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { QuizzesPageContent } from "@/features/quizzes/components/QuizzesPageContent"
import { getQuizzes } from "@/features/quizzes/actions"
import { prisma } from "@/lib/prisma"

export default async function QuizzesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/quizzes")

  const isSystemRole = session.user.isSystemRole ?? false
  const permissions = session.user.permissions ?? []
  if (!isSystemRole && !permissions.includes("quiz.view")) redirect("/unauthorized")

  const [quizzesResult, offeringsRaw] = await Promise.all([
    getQuizzes(),
    prisma.courseOffering.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, code: true, course: { select: { nameAr: true } } },
      orderBy: { code: "desc" },
    }),
  ])

  const offerings = offeringsRaw.map((o) => ({
    id: o.id, code: o.code, courseName: o.course.nameAr,
  }))

  return (
    <DashboardLayout title="إدارة الاختبارات" subtitle="إنشاء وإدارة الاختبارات والأسئلة">
      <QuizzesPageContent
        quizzes={quizzesResult.data ?? []}
        offerings={offerings}
        permissions={{
          canCreate: isSystemRole || permissions.includes("quiz.create"),
          canEdit: isSystemRole || permissions.includes("quiz.edit"),
          canDelete: isSystemRole || permissions.includes("quiz.delete"),
          canPublish: isSystemRole || permissions.includes("quiz.publish"),
          canGrade: isSystemRole || permissions.includes("quiz.grade"),
        }}
      />
    </DashboardLayout>
  )
}
