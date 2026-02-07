/**
 * Quiz Detail Page (Server Component)
 * @module app/(dashboard)/quizzes/[id]/page
 */

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { QuizDetailContent } from "@/features/quizzes/components/QuizDetailContent"
import { getQuiz, getQuizAttempts } from "@/features/quizzes/actions"

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isSystemRole = session.user.isSystemRole ?? false
  const permissions = session.user.permissions ?? []
  if (!isSystemRole && !permissions.includes("quiz.view")) redirect("/unauthorized")

  const { id } = await params
  const [quizResult, attemptsResult] = await Promise.all([
    getQuiz(id),
    getQuizAttempts(id).catch(() => ({ success: false as const, data: undefined, error: "" })),
  ])

  if (!quizResult.success || !quizResult.data) redirect("/quizzes")

  return (
    <DashboardLayout title={quizResult.data.title} subtitle={`${quizResult.data.offering.course.nameAr} · ${quizResult.data.offering.semester.nameAr}`}>
      <QuizDetailContent
        quiz={quizResult.data}
        attempts={attemptsResult.data ?? []}
        permissions={{
          canEdit: isSystemRole || permissions.includes("quiz.edit"),
          canPublish: isSystemRole || permissions.includes("quiz.publish"),
          canGrade: isSystemRole || permissions.includes("quiz.grade"),
          canDelete: isSystemRole || permissions.includes("quiz.delete"),
        }}
      />
    </DashboardLayout>
  )
}
