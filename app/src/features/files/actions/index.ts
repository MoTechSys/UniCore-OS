"use server"

/**
 * File Management Server Actions
 * @module features/files/actions
 */

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requirePermission } from "@/lib/auth/permissions"
import { auth } from "@/lib/auth"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface FileData {
  id: string
  name: string
  originalName: string
  mimeType: string
  size: number
  path: string
  url: string | null
  createdAt: Date
  offeringId: string | null
  offering: { code: string; course: { nameAr: string } } | null
  uploader: { profile: { firstNameAr: string; lastNameAr: string } | null }
}

// ============================================
// ACTIONS
// ============================================

export async function getFiles(params?: {
  offeringId?: string
  search?: string
  page?: number
}): Promise<ActionResult<{ files: FileData[]; total: number }>> {
  try {
    await requirePermission("file.view")
    const where: Record<string, unknown> = { deletedAt: null }
    if (params?.offeringId) where.offeringId = params.offeringId
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search } },
        { originalName: { contains: params.search } },
      ]
    }

    const page = params?.page ?? 1
    const pageSize = 20

    const [files, total] = await Promise.all([
      db.file.findMany({
        where,
        include: {
          offering: { select: { code: true, course: { select: { nameAr: true } } } },
          uploader: { select: { profile: { select: { firstNameAr: true, lastNameAr: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      db.file.count({ where }),
    ])

    return { success: true, data: { files: files as FileData[], total } }
  } catch (error) {
    return { success: false, error: "فشل في جلب الملفات" }
  }
}

export async function uploadFile(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("file.upload")
    const session = await auth()
    if (!session?.user) return { success: false, error: "غير مصرح" }

    const file = formData.get("file") as File
    if (!file) return { success: false, error: "لم يتم تحديد ملف" }

    const offeringId = formData.get("offeringId") as string | null

    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) return { success: false, error: "حجم الملف يتجاوز 10MB" }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "image/gif",
      "text/plain",
      "application/zip",
    ]

    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "نوع الملف غير مدعوم" }
    }

    // Save file
    const uploadDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${timestamp}_${safeName}`
    const filePath = join(uploadDir, fileName)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save to database
    const fileRecord = await db.file.create({
      data: {
        name: fileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: `/uploads/${fileName}`,
        url: `/uploads/${fileName}`,
        offeringId: offeringId || null,
        uploaderId: session.user.id,
      },
    })

    revalidatePath("/files")
    return { success: true, data: { id: fileRecord.id } }
  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, error: "فشل في رفع الملف" }
  }
}

export async function deleteFile(id: string): Promise<ActionResult> {
  try {
    await requirePermission("file.delete")

    const file = await db.file.findUnique({ where: { id } })
    if (!file) return { success: false, error: "الملف غير موجود" }

    // Soft delete from DB
    await db.file.update({ where: { id }, data: { deletedAt: new Date() } })

    // Try to delete physical file
    try {
      const filePath = join(process.cwd(), "public", file.path)
      if (existsSync(filePath)) await unlink(filePath)
    } catch {
      // File might not exist, that's ok
    }

    revalidatePath("/files")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في حذف الملف" }
  }
}
