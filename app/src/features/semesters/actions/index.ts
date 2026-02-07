"use server"

/**
 * Semesters & Offerings Server Actions
 * @module features/semesters/actions
 */

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requirePermission } from "@/lib/auth/permissions"

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface SemesterData {
  id: string
  code: string
  nameAr: string
  nameEn: string | null
  type: string
  year: number
  startDate: Date
  endDate: Date
  isActive: boolean
  isCurrent: boolean
  _count: { offerings: number }
}

export interface OfferingWithDetails {
  id: string
  code: string
  section: string
  maxStudents: number
  isActive: boolean
  instructorId: string
  course: { id: string; code: string; nameAr: string; credits: number }
  semester: { id: string; nameAr: string; code: string }
  _count: { enrollments: number; quizzes: number }
}

// Schemas
const createSemesterSchema = z.object({
  code: z.string().min(2, "الكود مطلوب"),
  nameAr: z.string().min(2, "الاسم مطلوب"),
  nameEn: z.string().optional(),
  type: z.enum(["FIRST", "SECOND", "SUMMER"]),
  year: z.number().int().min(2020).max(2050),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
})

const createOfferingSchema = z.object({
  courseId: z.string().min(1, "يجب تحديد المقرر"),
  semesterId: z.string().min(1, "يجب تحديد الفصل"),
  instructorId: z.string().min(1, "يجب تحديد المدرس"),
  section: z.string().min(1, "رقم الشعبة مطلوب"),
  maxStudents: z.number().int().min(1).max(500),
})

export type CreateSemesterInput = z.infer<typeof createSemesterSchema>
export type CreateOfferingInput = z.infer<typeof createOfferingSchema>

// ============================================
// SEMESTER ACTIONS
// ============================================

export async function getSemesters(): Promise<ActionResult<SemesterData[]>> {
  try {
    await requirePermission("semester.view")
    const semesters = await db.semester.findMany({
      include: { _count: { select: { offerings: true } } },
      orderBy: [{ year: "desc" }, { code: "desc" }],
    })
    return { success: true, data: semesters as SemesterData[] }
  } catch (error) {
    return { success: false, error: "فشل في جلب الفصول الدراسية" }
  }
}

export async function createSemester(input: CreateSemesterInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("semester.manage")
    const validated = createSemesterSchema.parse(input)
    
    const existing = await db.semester.findUnique({ where: { code: validated.code } })
    if (existing) return { success: false, error: "كود الفصل موجود مسبقاً" }

    const semester = await db.semester.create({
      data: {
        code: validated.code,
        nameAr: validated.nameAr,
        nameEn: validated.nameEn ?? null,
        type: validated.type,
        year: validated.year,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
      },
    })
    revalidatePath("/semesters")
    return { success: true, data: { id: semester.id } }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message }
    return { success: false, error: "فشل في إنشاء الفصل" }
  }
}

export async function setCurrentSemester(id: string): Promise<ActionResult> {
  try {
    await requirePermission("semester.set_current")
    await db.$transaction([
      db.semester.updateMany({ data: { isCurrent: false } }),
      db.semester.update({ where: { id }, data: { isCurrent: true, isActive: true } }),
    ])
    revalidatePath("/semesters")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في تعيين الفصل الحالي" }
  }
}

export async function toggleSemesterActive(id: string): Promise<ActionResult> {
  try {
    await requirePermission("semester.manage")
    const semester = await db.semester.findUnique({ where: { id } })
    if (!semester) return { success: false, error: "الفصل غير موجود" }
    await db.semester.update({ where: { id }, data: { isActive: !semester.isActive } })
    revalidatePath("/semesters")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في تغيير حالة الفصل" }
  }
}

// ============================================
// OFFERING ACTIONS
// ============================================

export async function getOfferings(params?: {
  semesterId?: string
  courseId?: string
  page?: number
}): Promise<ActionResult<{ offerings: OfferingWithDetails[]; total: number }>> {
  try {
    await requirePermission("offering.view")
    const where: Record<string, unknown> = { deletedAt: null }
    if (params?.semesterId) where.semesterId = params.semesterId
    if (params?.courseId) where.courseId = params.courseId

    const [offerings, total] = await Promise.all([
      db.courseOffering.findMany({
        where,
        include: {
          course: { select: { id: true, code: true, nameAr: true, credits: true } },
          semester: { select: { id: true, nameAr: true, code: true } },
          _count: { select: { enrollments: true, quizzes: true } },
        },
        orderBy: { createdAt: "desc" },
        take: params?.page ? 20 : 100,
        skip: params?.page ? (params.page - 1) * 20 : 0,
      }),
      db.courseOffering.count({ where }),
    ])
    return { success: true, data: { offerings: offerings as OfferingWithDetails[], total } }
  } catch (error) {
    return { success: false, error: "فشل في جلب الشعب" }
  }
}

export async function createOffering(input: CreateOfferingInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("offering.create")
    const validated = createOfferingSchema.parse(input)
    
    const course = await db.course.findUnique({ where: { id: validated.courseId } })
    if (!course) return { success: false, error: "المقرر غير موجود" }
    
    const semester = await db.semester.findUnique({ where: { id: validated.semesterId } })
    if (!semester) return { success: false, error: "الفصل غير موجود" }

    const offeringCode = `${course.code}-${semester.code}-${validated.section}`

    const existing = await db.courseOffering.findUnique({ where: { code: offeringCode } })
    if (existing) return { success: false, error: "هذه الشعبة موجودة مسبقاً" }

    const offering = await db.courseOffering.create({
      data: {
        code: offeringCode,
        courseId: validated.courseId,
        semesterId: validated.semesterId,
        instructorId: validated.instructorId,
        section: validated.section,
        maxStudents: validated.maxStudents,
      },
    })
    revalidatePath("/semesters")
    return { success: true, data: { id: offering.id } }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message }
    return { success: false, error: "فشل في إنشاء الشعبة" }
  }
}

export async function deleteOffering(id: string): Promise<ActionResult> {
  try {
    await requirePermission("offering.delete")
    const offering = await db.courseOffering.findUnique({
      where: { id },
      include: { _count: { select: { enrollments: true } } },
    })
    if (!offering) return { success: false, error: "الشعبة غير موجودة" }
    if (offering._count.enrollments > 0) return { success: false, error: "لا يمكن حذف شعبة بها طلاب مسجلين" }
    await db.courseOffering.update({ where: { id }, data: { deletedAt: new Date() } })
    revalidatePath("/semesters")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في حذف الشعبة" }
  }
}

// ============================================
// ENROLLMENT ACTIONS
// ============================================

export async function enrollStudent(input: { offeringId: string; studentId: string }): Promise<ActionResult> {
  try {
    await requirePermission("offering.enroll_students")
    const offering = await db.courseOffering.findUnique({
      where: { id: input.offeringId },
      include: { _count: { select: { enrollments: true } } },
    })
    if (!offering) return { success: false, error: "الشعبة غير موجودة" }
    if (offering._count.enrollments >= offering.maxStudents) return { success: false, error: "الشعبة ممتلئة" }

    const existing = await db.enrollment.findUnique({
      where: { studentId_offeringId: { studentId: input.studentId, offeringId: input.offeringId } },
    })
    if (existing) return { success: false, error: "الطالب مسجل بالفعل" }

    await db.enrollment.create({ data: { studentId: input.studentId, offeringId: input.offeringId } })
    revalidatePath("/semesters")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في تسجيل الطالب" }
  }
}

export async function unenrollStudent(input: { offeringId: string; studentId: string }): Promise<ActionResult> {
  try {
    await requirePermission("offering.enroll_students")
    const enrollment = await db.enrollment.findUnique({
      where: { studentId_offeringId: { studentId: input.studentId, offeringId: input.offeringId } },
    })
    if (!enrollment) return { success: false, error: "التسجيل غير موجود" }
    await db.enrollment.update({ where: { id: enrollment.id }, data: { droppedAt: new Date() } })
    revalidatePath("/semesters")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في إلغاء التسجيل" }
  }
}

export async function getEnrolledStudents(offeringId: string): Promise<ActionResult<{
  id: string; email: string | null; academicId: string; profile: { firstNameAr: string; lastNameAr: string } | null; enrolledAt: Date
}[]>> {
  try {
    await requirePermission("offering.view")
    const enrollments = await db.enrollment.findMany({
      where: { offeringId, droppedAt: null },
      include: {
        student: { select: { id: true, email: true, academicId: true, profile: { select: { firstNameAr: true, lastNameAr: true } } } },
      },
      orderBy: { enrolledAt: "desc" },
    })
    return {
      success: true,
      data: enrollments.map((e) => ({ ...e.student, enrolledAt: e.enrolledAt })),
    }
  } catch (error) {
    return { success: false, error: "فشل في جلب الطلاب" }
  }
}
