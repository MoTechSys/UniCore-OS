/**
 * AI Tools Page (Server Component)
 */

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { AIPageContent } from "@/features/ai/components/AIPageContent"

export default async function AIPage() {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/ai")

  const isSystemRole = session.user.isSystemRole ?? false
  const permissions = session.user.permissions ?? []
  const hasAccess = isSystemRole || permissions.includes("ai.generate_quiz") || permissions.includes("ai.summarize") || permissions.includes("ai.chat")
  if (!hasAccess) redirect("/unauthorized")

  return (
    <DashboardLayout title="الذكاء الاصطناعي" subtitle="أدوات الذكاء الاصطناعي المساعدة">
      <AIPageContent
        permissions={{
          canGenerate: isSystemRole || permissions.includes("ai.generate_quiz"),
          canSummarize: isSystemRole || permissions.includes("ai.summarize"),
          canChat: isSystemRole || permissions.includes("ai.chat"),
        }}
      />
    </DashboardLayout>
  )
}
