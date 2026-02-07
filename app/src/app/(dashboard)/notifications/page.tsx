/**
 * Notifications Page (Server Component)
 */
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { NotificationsPageContent } from "@/features/notifications/components/NotificationsPageContent"
import { getNotifications } from "@/features/notifications/actions"

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/notifications")

  const result = await getNotifications()

  return (
    <DashboardLayout title="الإشعارات" subtitle="جميع الإشعارات والتنبيهات">
      <NotificationsPageContent
        notifications={result.data?.notifications ?? []}
        total={result.data?.total ?? 0}
        unreadCount={result.data?.unreadCount ?? 0}
      />
    </DashboardLayout>
  )
}
