"use client"

/**
 * Notifications Page Content
 * @module features/notifications/components/NotificationsPageContent
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Bell, CheckCheck, Trash2, Loader2, Info, AlertTriangle, CheckCircle, Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  markAsRead, markAllAsRead, deleteNotification, type NotificationData,
} from "../actions"

interface NotificationsPageContentProps {
  notifications: NotificationData[]
  total: number
  unreadCount: number
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "quiz_published": return <CheckCircle className="h-5 w-5 text-green-500" />
    case "grade_released": return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    case "announcement": return <Info className="h-5 w-5 text-blue-500" />
    default: return <Bell className="h-5 w-5 text-muted-foreground" />
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "الآن"
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `منذ ${days} يوم`
  return new Date(date).toLocaleDateString("ar-SA")
}

export function NotificationsPageContent({
  notifications, total, unreadCount,
}: NotificationsPageContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      const result = await markAsRead(id)
      if (result.success) router.refresh()
      else toast.error(result.error ?? "خطأ")
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const result = await markAllAsRead()
      if (result.success) { toast.success("تم قراءة جميع الإشعارات"); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteNotification(id)
      if (result.success) { toast.success("تم حذف الإشعار"); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><Bell className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">إجمالي الإشعارات</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-red-100 rounded-lg"><Mail className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold">{unreadCount}</p><p className="text-xs text-muted-foreground">غير مقروء</p></div></div></CardContent></Card>
      </div>

      {/* Actions */}
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={isPending}>
            <CheckCheck className="h-4 w-4 ml-2" />قراءة الكل
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">لا توجد إشعارات</p>
              <p className="text-sm">ستظهر الإشعارات هنا عند وجود تحديثات</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 transition-colors ${
                    !notification.isRead ? "bg-primary/5" : "hover:bg-muted/30"
                  }`}
                >
                  <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm ${!notification.isRead ? "font-bold" : "font-medium"}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <Badge className="bg-primary/20 text-primary text-xs">جديد</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notification.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.isRead && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkAsRead(notification.id)} title="قراءة">
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(notification.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
