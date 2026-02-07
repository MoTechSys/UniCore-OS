/**
 * Files Page (Server Component)
 */
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { FilesPageContent } from "@/features/files/components/FilesPageContent"
import { getFiles } from "@/features/files/actions"

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/files")

  const isSystemRole = session.user.isSystemRole ?? false
  const permissions = session.user.permissions ?? []
  if (!isSystemRole && !permissions.includes("file.view")) redirect("/unauthorized")

  const params = await searchParams
  const result = await getFiles({ search: params.search, page: parseInt(params.page ?? "1") })

  return (
    <DashboardLayout title="إدارة الملفات" subtitle="رفع وتنزيل وإدارة الملفات">
      <FilesPageContent
        initialData={result.data ?? { files: [], total: 0 }}
        permissions={{
          canUpload: isSystemRole || permissions.includes("file.upload"),
          canDelete: isSystemRole || permissions.includes("file.delete"),
          canManageAll: isSystemRole || permissions.includes("file.manage_all"),
        }}
      />
    </DashboardLayout>
  )
}
