/**
 * Settings Page
 */
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Database, Shield, Sparkles, Clock } from "lucide-react"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const isSystemRole = session.user.isSystemRole ?? false
  const permissions = session.user.permissions ?? []
  if (!isSystemRole && !permissions.includes("system.settings")) redirect("/unauthorized")

  const settings = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } })

  const groupedSettings: Record<string, typeof settings> = {}
  settings.forEach((s) => {
    const group = s.key.split(".")[0]
    if (!groupedSettings[group]) groupedSettings[group] = []
    groupedSettings[group].push(s)
  })

  const groupLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    system: { label: "إعدادات النظام", icon: <Settings className="h-5 w-5" /> },
    ai: { label: "إعدادات الذكاء الاصطناعي", icon: <Sparkles className="h-5 w-5" /> },
    quiz: { label: "إعدادات الاختبارات", icon: <Clock className="h-5 w-5" /> },
    import: { label: "إعدادات الاستيراد", icon: <Database className="h-5 w-5" /> },
  }

  return (
    <DashboardLayout title="إعدادات النظام" subtitle="إعدادات وتكوين النظام">
      <div className="space-y-6">
        {Object.entries(groupedSettings).map(([group, items]) => (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {groupLabels[group]?.icon ?? <Settings className="h-5 w-5" />}
                {groupLabels[group]?.label ?? group}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{setting.key}</p>
                      {setting.description && <p className="text-xs text-muted-foreground">{setting.description}</p>}
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">{setting.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  )
}
