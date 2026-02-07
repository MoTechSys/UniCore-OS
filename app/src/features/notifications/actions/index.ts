"use server"

/**
 * Notifications Server Actions
 * @module features/notifications/actions
 */

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requirePermission, requireAuth } from "@/lib/auth/permissions"
import { auth } from "@/lib/auth"

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface NotificationData {
  id: string
  title: string
  body: string
  type: string
  data: string | null
  isRead: boolean
  readAt: Date | null
  createdAt: Date
}

// ============================================
// GET NOTIFICATIONS
// ============================================

export async function getNotifications(params?: {
  unreadOnly?: boolean
  page?: number
}): Promise<ActionResult<{ notifications: NotificationData[]; total: number; unreadCount: number }>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "غير مصرح" }

    const where: Record<string, unknown> = { userId: session.user.id }
    if (params?.unreadOnly) where.isRead = false

    const page = params?.page ?? 1
    const pageSize = 20

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId: session.user.id, isRead: false } }),
    ])

    return { success: true, data: { notifications: notifications as NotificationData[], total, unreadCount } }
  } catch (error) {
    return { success: false, error: "فشل في جلب الإشعارات" }
  }
}

export async function getUnreadCount(): Promise<ActionResult<number>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: true, data: 0 }
    const count = await db.notification.count({ where: { userId: session.user.id, isRead: false } })
    return { success: true, data: count }
  } catch {
    return { success: true, data: 0 }
  }
}

// ============================================
// MARK AS READ
// ============================================

export async function markAsRead(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "غير مصرح" }

    await db.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    })

    revalidatePath("/notifications")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في تحديث الإشعار" }
  }
}

export async function markAllAsRead(): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "غير مصرح" }

    await db.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })

    revalidatePath("/notifications")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في تحديث الإشعارات" }
  }
}

// ============================================
// SEND NOTIFICATION
// ============================================

export async function sendNotification(input: {
  userId: string
  title: string
  body: string
  type: string
  data?: string
}): Promise<ActionResult> {
  try {
    await requirePermission("notification.send")
    await db.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        body: input.body,
        type: input.type,
        data: input.data ?? null,
      },
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في إرسال الإشعار" }
  }
}

export async function sendBulkNotification(input: {
  userIds: string[]
  title: string
  body: string
  type: string
}): Promise<ActionResult> {
  try {
    await requirePermission("notification.send")
    await db.notification.createMany({
      data: input.userIds.map((userId) => ({
        userId,
        title: input.title,
        body: input.body,
        type: input.type,
      })),
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في إرسال الإشعارات" }
  }
}

export async function deleteNotification(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "غير مصرح" }

    await db.notification.delete({ where: { id } })
    revalidatePath("/notifications")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في حذف الإشعار" }
  }
}
