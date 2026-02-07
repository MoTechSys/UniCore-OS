"use server"

/**
 * Courses Management Server Actions
 * 
 * @module features/courses/actions
 */

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requirePermission } from "@/lib/auth/permissions"

// ============================================
// TYPES
// ============================================

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface CourseWithDetails {
  id: string
  code: string
  nameAr: string
  nameEn: string | null
  description: string | null
  credits: number
  isActive: boolean
  departmentId: string
  department: {
    id: string
    nameAr: string
    college: {
      id: string
      nameAr: string
    }
  }
  _count: {
    offerings: number
  }
}

export interface PaginatedCourses {
  courses: CourseWithDetails[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================
// SCHEMAS
// ============================================

const createCourseSchema = z.object({
  code: z.string().min(2, "كود المقرر مطلوب").max(20),
  nameAr: z.string().min(2, "اسم المقرر مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  departmentId: z.string().min(1, "يجب تحديد القسم"),
  credits: z.number().int().min(1).max(12),
})

const updateCourseSchema = createCourseSchema.extend({
  id: z.string(),
  isActive: z.boolean().optional(),
})

export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>

// ============================================
// ACTIONS
// ============================================

export async function getCourses(params?: {
  search?: string
  departmentId?: string
  page?: number
  pageSize?: number
}): Promise<ActionResult<PaginatedCourses>> {
  try {
    await requirePermission("course.view")

    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = { deletedAt: null }

    if (params?.search) {
      where.OR = [
        { code: { contains: params.search } },
        { nameAr: { contains: params.search } },
        { nameEn: { contains: params.search } },
      ]
    }

    if (params?.departmentId && params.departmentId !== "ALL") {
      where.departmentId = params.departmentId
    }

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          department: {
            select: {
              id: true,
              nameAr: true,
              college: { select: { id: true, nameAr: true } },
            },
          },
          _count: { select: { offerings: true } },
        },
        orderBy: { code: "asc" },
      }),
      db.course.count({ where }),
    ])

    return {
      success: true,
      data: {
        courses: courses as CourseWithDetails[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("Error fetching courses:", error)
    return { success: false, error: "فشل في جلب المقررات" }
  }
}

export async function createCourse(input: CreateCourseInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("course.create")
    const validated = createCourseSchema.parse(input)

    const existing = await db.course.findUnique({ where: { code: validated.code } })
    if (existing) return { success: false, error: "كود المقرر موجود مسبقاً" }

    const course = await db.course.create({ data: {
      code: validated.code,
      nameAr: validated.nameAr,
      nameEn: validated.nameEn ?? null,
      description: validated.description ?? null,
      departmentId: validated.departmentId,
      credits: validated.credits,
    }})

    revalidatePath("/courses")
    return { success: true, data: { id: course.id } }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message }
    return { success: false, error: "فشل في إنشاء المقرر" }
  }
}

export async function updateCourse(input: UpdateCourseInput): Promise<ActionResult> {
  try {
    await requirePermission("course.edit")
    const validated = updateCourseSchema.parse(input)

    const existing = await db.course.findUnique({ where: { id: validated.id } })
    if (!existing) return { success: false, error: "المقرر غير موجود" }

    if (validated.code !== existing.code) {
      const codeExists = await db.course.findUnique({ where: { code: validated.code } })
      if (codeExists) return { success: false, error: "كود المقرر موجود مسبقاً" }
    }

    await db.course.update({
      where: { id: validated.id },
      data: {
        code: validated.code,
        nameAr: validated.nameAr,
        nameEn: validated.nameEn ?? null,
        description: validated.description ?? null,
        departmentId: validated.departmentId,
        credits: validated.credits,
        isActive: validated.isActive,
      },
    })

    revalidatePath("/courses")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message }
    return { success: false, error: "فشل في تحديث المقرر" }
  }
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  try {
    await requirePermission("course.delete")

    const course = await db.course.findUnique({
      where: { id },
      include: { offerings: { where: { deletedAt: null } } },
    })
    if (!course) return { success: false, error: "المقرر غير موجود" }
    if (course.offerings.length > 0) return { success: false, error: "لا يمكن حذف المقرر لوجود شعب مرتبطة" }

    await db.course.update({ where: { id }, data: { deletedAt: new Date() } })
    revalidatePath("/courses")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في حذف المقرر" }
  }
}
