"use client"

/**
 * Users Table Component
 * 
 * Displays users in a data table with actions.
 * Receives permissions from server component to avoid client-side permission issues.
 * 
 * @module features/users/components/UsersTable
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteUser, changeUserStatus } from "../actions"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Eye,
  Loader2,
  Shield,
  User,
} from "lucide-react"
import { toast } from "sonner"

// ============================================
// TYPES
// ============================================

interface UserData {
  id: string
  academicId: string
  email: string | null
  status: string
  createdAt: Date
  lastLoginAt: Date | null
  profile: {
    firstNameAr: string
    lastNameAr: string
    firstNameEn: string | null
    lastNameEn: string | null
    phone: string | null
  } | null
  roles: {
    role: {
      id: string
      nameAr: string
      code: string
      isSystem: boolean
    }
  }[]
}

interface UsersTableProps {
  users: UserData[]
  permissions: {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canFreeze: boolean
  }
  onRefresh: () => void
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getFullName(user: UserData): string {
  if (user.profile) {
    return `${user.profile.firstNameAr} ${user.profile.lastNameAr}`.trim()
  }
  return user.email ?? user.academicId
}

function getInitials(user: UserData): string {
  if (user.profile) {
    const first = user.profile.firstNameAr?.[0] ?? ""
    const last = user.profile.lastNameAr?.[0] ?? ""
    return `${first}${last}` || "?"
  }
  return user.email?.[0]?.toUpperCase() ?? "?"
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="default" className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
          نشط
        </Badge>
      )
    case "PENDING":
    case "PENDING_ACTIVATION":
      return (
        <Badge variant="default" className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">
          في الانتظار
        </Badge>
      )
    case "FROZEN":
      return (
        <Badge variant="default" className="bg-red-500/20 text-red-500 hover:bg-red-500/30">
          مجمد
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatDate(date: Date | null) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// ============================================
// COMPONENT
// ============================================

export function UsersTable({ users, permissions, onRefresh }: UsersTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null)

  const handleStatusChange = async (user: UserData, newStatus: "ACTIVE" | "FROZEN") => {
    setLoadingId(user.id)
    startTransition(async () => {
      try {
        const result = await changeUserStatus(user.id, newStatus)
        if (result.success) {
          toast.success(newStatus === "ACTIVE" ? "تم تفعيل المستخدم" : "تم تجميد المستخدم")
          onRefresh()
        } else {
          toast.error(result.error ?? "فشل في تغيير الحالة")
        }
      } catch {
        toast.error("حدث خطأ غير متوقع")
      } finally {
        setLoadingId(null)
      }
    })
  }

  const handleDelete = async () => {
    if (!userToDelete) return

    setLoadingId(userToDelete.id)
    startTransition(async () => {
      try {
        const result = await deleteUser(userToDelete.id)
        if (result.success) {
          toast.success("تم حذف المستخدم بنجاح")
          onRefresh()
        } else {
          toast.error(result.error ?? "فشل في حذف المستخدم")
        }
      } catch {
        toast.error("حدث خطأ غير متوقع")
      } finally {
        setLoadingId(null)
        setDeleteDialogOpen(false)
        setUserToDelete(null)
      }
    })
  }

  const confirmDelete = (user: UserData) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">لا يوجد مستخدمين</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right w-[250px]">المستخدم</TableHead>
              <TableHead className="text-right">الرقم الأكاديمي</TableHead>
              <TableHead className="text-right">البريد الإلكتروني</TableHead>
              <TableHead className="text-right">الدور</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">تاريخ الإنشاء</TableHead>
              <TableHead className="text-center w-[70px]">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSystemUser = user.roles.some((r) => r.role.isSystem)
              const isLoading = loadingId === user.id
              const fullName = getFullName(user)
              const primaryRole = user.roles[0]?.role

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={cn(
                          "text-primary",
                          isSystemUser ? "bg-primary/20" : "bg-primary/10"
                        )}>
                          {isSystemUser ? (
                            <Shield className="h-5 w-5" />
                          ) : (
                            getInitials(user)
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{fullName}</p>
                        {user.profile?.phone && (
                          <p className="text-sm text-muted-foreground">
                            {user.profile.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{user.academicId}</TableCell>
                  <TableCell>{user.email ?? "—"}</TableCell>
                  <TableCell>
                    {primaryRole ? (
                      <Badge
                        variant={isSystemUser ? "default" : "secondary"}
                        className={cn(isSystemUser && "bg-primary")}
                      >
                        {primaryRole.nameAr}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLoading || isPending}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/users/${user.id}`)}
                        >
                          <Eye className="h-4 w-4 ml-2" />
                          عرض التفاصيل
                        </DropdownMenuItem>

                        {permissions.canEdit && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/users/${user.id}/edit`)}
                          >
                            <Pencil className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                        )}

                        {permissions.canFreeze && !isSystemUser && (
                          <>
                            <DropdownMenuSeparator />
                            {user.status === "FROZEN" ? (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(user, "ACTIVE")}
                                className="text-green-600 focus:text-green-600"
                              >
                                <UserCheck className="h-4 w-4 ml-2" />
                                تفعيل الحساب
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(user, "FROZEN")}
                                className="text-orange-600 focus:text-orange-600"
                              >
                                <UserX className="h-4 w-4 ml-2" />
                                تجميد الحساب
                              </DropdownMenuItem>
                            )}
                          </>
                        )}

                        {permissions.canDelete && !isSystemUser && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => confirmDelete(user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المستخدم &quot;{userToDelete ? getFullName(userToDelete) : ""}&quot;؟
              <br />
              سيتم نقل المستخدم إلى سلة المحذوفات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? "جارٍ الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
