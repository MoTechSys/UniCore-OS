/**
 * Reports Page
 */
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3, Users, GraduationCap, BookOpen, FileText, Award, TrendingUp,
} from "lucide-react"

export default async function ReportsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const isSystemRole = session.user.isSystemRole ?? false
  const permissions = session.user.permissions ?? []
  if (!isSystemRole && !permissions.includes("system.reports")) redirect("/unauthorized")

  // Aggregate stats
  const [
    totalUsers, activeUsers, totalStudents, totalInstructors,
    totalColleges, totalDepartments, totalCourses, totalQuizzes,
    totalAttempts, totalFiles,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.userRole.count({ where: { role: { code: "STUDENT" }, user: { deletedAt: null } } }),
    prisma.userRole.count({ where: { role: { code: "INSTRUCTOR" }, user: { deletedAt: null } } }),
    prisma.college.count({ where: { deletedAt: null } }),
    prisma.department.count({ where: { deletedAt: null } }),
    prisma.course.count({ where: { deletedAt: null } }),
    prisma.quiz.count({ where: { deletedAt: null } }),
    prisma.quizAttempt.count(),
    prisma.file.count({ where: { deletedAt: null } }),
  ])

  // Quiz performance
  const completedAttempts = await prisma.quizAttempt.findMany({
    where: { status: "GRADED" },
    select: { percentage: true },
  })
  const avgScore = completedAttempts.length > 0
    ? Math.round(completedAttempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / completedAttempts.length)
    : 0

  const stats = [
    { label: "إجمالي المستخدمين", value: totalUsers, icon: Users, color: "blue" },
    { label: "المستخدمين النشطين", value: activeUsers, icon: Users, color: "green" },
    { label: "الطلاب", value: totalStudents, icon: GraduationCap, color: "purple" },
    { label: "أعضاء هيئة التدريس", value: totalInstructors, icon: GraduationCap, color: "orange" },
    { label: "الكليات", value: totalColleges, icon: BookOpen, color: "blue" },
    { label: "الأقسام", value: totalDepartments, icon: BookOpen, color: "green" },
    { label: "المقررات", value: totalCourses, icon: BookOpen, color: "purple" },
    { label: "الاختبارات", value: totalQuizzes, icon: FileText, color: "orange" },
    { label: "المحاولات", value: totalAttempts, icon: Award, color: "blue" },
    { label: "الملفات", value: totalFiles, icon: FileText, color: "green" },
    { label: "متوسط الدرجات", value: `${avgScore}%`, icon: TrendingUp, color: "purple" },
    { label: "معدل النشاط", value: `${totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%`, icon: TrendingUp, color: "orange" },
  ]

  return (
    <DashboardLayout title="التقارير" subtitle="تقارير وإحصائيات النظام">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />إحصائيات عامة</CardTitle>
            <CardDescription>نظرة شاملة على بيانات النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <div key={idx} className="p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                        <Icon className={`h-4 w-4 text-${stat.color}-600`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
