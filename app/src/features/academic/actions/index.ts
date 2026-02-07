"use server"

/**
 * Academic Structure Server Actions
 * 
 * CRUD operations for Colleges, Departments, Majors, and Courses.
 * All actions require proper authentication and authorization.
 * 
 * @module features/academic/actions
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

export interface CollegeWithRelations {
  id: string
  code: string
  nameAr: string
  nameEn: string | null
  description: string | null
  isActive: boolean
  createdAt: Date
  departments: DepartmentWithRelations[]
}

export interface DepartmentWithRelations {
  id: string
  code: string
  nameAr: string
  nameEn: string | null
  description: string | null
  isActive: boolean
  collegeId: string
  majors: MajorData[]
  _count: {
    courses: number
  }
}

export interface MajorData {
  id: string
  code: string
  nameAr: string
  nameEn: string | null
  description: string | null
  isActive: boolean
  totalCredits: number
  departmentId: string
  _count: {
    students: number
  }
}

export interface CourseData {
  id: string
  code: string
  nameAr: string
  nameEn: string | null
  description: string | null
  credits: number
  isActive: boolean
  departmentId: string
  department: {
    nameAr: string
    college: {
      nameAr: string
    }
  }
}

// ============================================
// SCHEMAS
// ============================================

const createCollegeSchema = z.object({
  code: z.string().min(2, "الكود يجب أن يكون حرفين على الأقل").max(20, "الكود طويل جداً"),
  nameAr: z.string().min(2, "الاسم العربي مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
})

const updateCollegeSchema = z.object({
  id: z.string(),
  code: z.string().min(2, "الكود يجب أن يكون حرفين على الأقل").max(20, "الكود طويل جداً"),
  nameAr: z.string().min(2, "الاسم العربي مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

const createDepartmentSchema = z.object({
  code: z.string().min(2, "الكود يجب أن يكون حرفين على الأقل").max(20, "الكود طويل جداً"),
  nameAr: z.string().min(2, "الاسم العربي مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  collegeId: z.string().min(1, "يجب تحديد الكلية"),
})

const updateDepartmentSchema = z.object({
  id: z.string(),
  code: z.string().min(2, "الكود يجب أن يكون حرفين على الأقل").max(20, "الكود طويل جداً"),
  nameAr: z.string().min(2, "الاسم العربي مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  collegeId: z.string().min(1, "يجب تحديد الكلية"),
  isActive: z.boolean().optional(),
})

const createMajorSchema = z.object({
  code: z.string().min(2, "الكود يجب أن يكون حرفين على الأقل").max(20, "الكود طويل جداً"),
  nameAr: z.string().min(2, "الاسم العربي مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  departmentId: z.string().min(1, "يجب تحديد القسم"),
  totalCredits: z.number().int().min(0, "عدد الساعات لا يمكن أن يكون سالباً").optional(),
})

const updateMajorSchema = z.object({
  id: z.string(),
  code: z.string().min(2, "الكود يجب أن يكون حرفين على الأقل").max(20, "الكود طويل جداً"),
  nameAr: z.string().min(2, "الاسم العربي مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  departmentId: z.string().min(1, "يجب تحديد القسم"),
  totalCredits: z.number().int().min(0, "عدد الساعات لا يمكن أن يكون سالباً").optional(),
  isActive: z.boolean().optional(),
})

const createCourseSchema = z.object({
  code: z.string().min(2, "الكود يجب أن يكون حرفين على الأقل").max(20, "الكود طويل جداً"),
  nameAr: z.string().min(2, "الاسم العربي مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  departmentId: z.string().min(1, "يجب تحديد القسم"),
  credits: z.number().int().min(1, "عدد الساعات يجب أن يكون 1 على الأقل").max(12, "عدد الساعات يجب أن يكون أقل من 12"),
})

const updateCourseSchema = z.object({
  id: z.string(),
  code: z.string().min(2, "الكود يجب أن يكون حرفين على الأقل").max(20, "الكود طويل جداً"),
  nameAr: z.string().min(2, "الاسم العربي مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  departmentId: z.string().min(1, "يجب تحديد القسم"),
  credits: z.number().int().min(1, "عدد الساعات يجب أن يكون 1 على الأقل").max(12, "عدد الساعات يجب أن يكون أقل من 12"),
  isActive: z.boolean().optional(),
})

export type CreateCollegeInput = z.infer<typeof createCollegeSchema>
export type UpdateCollegeInput = z.infer<typeof updateCollegeSchema>
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>
export type CreateMajorInput = z.infer<typeof createMajorSchema>
export type UpdateMajorInput = z.infer<typeof updateMajorSchema>
export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>

// ============================================
// COLLEGE ACTIONS
// ============================================

export async function getColleges(): Promise<ActionResult<CollegeWithRelations[]>> {
  try {
    await requirePermission("college.manage")

    const colleges = await db.college.findMany({
      where: { deletedAt: null },
      include: {
        departments: {
          where: { deletedAt: null },
          include: {
            majors: {
              where: { deletedAt: null },
              include: {
                _count: { select: { students: true } },
              },
              orderBy: { nameAr: "asc" },
            },
            _count: { select: { courses: true } },
          },
          orderBy: { nameAr: "asc" },
        },
      },
      orderBy: { nameAr: "asc" },
    })

    return { success: true, data: colleges as CollegeWithRelations[] }
  } catch (error) {
    console.error("Error fetching colleges:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "فشل في جلب الكليات",
    }
  }
}

export async function createCollege(
  input: CreateCollegeInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("college.manage")
    const validated = createCollegeSchema.parse(input)

    const existing = await db.college.findUnique({ where: { code: validated.code } })
    if (existing) {
      return { success: false, error: "كود الكلية موجود مسبقاً" }
    }

    const college = await db.college.create({
      data: {
        code: validated.code,
        nameAr: validated.nameAr,
        nameEn: validated.nameEn ?? null,
        description: validated.description ?? null,
      },
    })

    revalidatePath("/academic")
    return { success: true, data: { id: college.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error creating college:", error)
    return { success: false, error: "فشل في إنشاء الكلية" }
  }
}

export async function updateCollege(
  input: UpdateCollegeInput
): Promise<ActionResult> {
  try {
    await requirePermission("college.manage")
    const validated = updateCollegeSchema.parse(input)

    const existing = await db.college.findUnique({ where: { id: validated.id } })
    if (!existing) {
      return { success: false, error: "الكلية غير موجودة" }
    }

    // Check code uniqueness
    if (validated.code !== existing.code) {
      const codeExists = await db.college.findUnique({ where: { code: validated.code } })
      if (codeExists) {
        return { success: false, error: "كود الكلية موجود مسبقاً" }
      }
    }

    await db.college.update({
      where: { id: validated.id },
      data: {
        code: validated.code,
        nameAr: validated.nameAr,
        nameEn: validated.nameEn ?? null,
        description: validated.description ?? null,
        isActive: validated.isActive,
      },
    })

    revalidatePath("/academic")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error updating college:", error)
    return { success: false, error: "فشل في تحديث الكلية" }
  }
}

export async function deleteCollege(id: string): Promise<ActionResult> {
  try {
    await requirePermission("college.manage")

    const college = await db.college.findUnique({
      where: { id },
      include: { departments: { where: { deletedAt: null } } },
    })

    if (!college) {
      return { success: false, error: "الكلية غير موجودة" }
    }

    if (college.departments.length > 0) {
      return { success: false, error: "لا يمكن حذف الكلية لوجود أقسام مرتبطة بها" }
    }

    await db.college.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath("/academic")
    return { success: true }
  } catch (error) {
    console.error("Error deleting college:", error)
    return { success: false, error: "فشل في حذف الكلية" }
  }
}

// ============================================
// DEPARTMENT ACTIONS
// ============================================

export async function createDepartment(
  input: CreateDepartmentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("department.manage")
    const validated = createDepartmentSchema.parse(input)

    const existing = await db.department.findUnique({ where: { code: validated.code } })
    if (existing) {
      return { success: false, error: "كود القسم موجود مسبقاً" }
    }

    const department = await db.department.create({
      data: {
        code: validated.code,
        nameAr: validated.nameAr,
        nameEn: validated.nameEn ?? null,
        description: validated.description ?? null,
        collegeId: validated.collegeId,
      },
    })

    revalidatePath("/academic")
    return { success: true, data: { id: department.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error creating department:", error)
    return { success: false, error: "فشل في إنشاء القسم" }
  }
}

export async function updateDepartment(
  input: UpdateDepartmentInput
): Promise<ActionResult> {
  try {
    await requirePermission("department.manage")
    const validated = updateDepartmentSchema.parse(input)

    const existing = await db.department.findUnique({ where: { id: validated.id } })
    if (!existing) {
      return { success: false, error: "القسم غير موجود" }
    }

    if (validated.code !== existing.code) {
      const codeExists = await db.department.findUnique({ where: { code: validated.code } })
      if (codeExists) {
        return { success: false, error: "كود القسم موجود مسبقاً" }
      }
    }

    await db.department.update({
      where: { id: validated.id },
      data: {
        code: validated.code,
        nameAr: validated.nameAr,
        nameEn: validated.nameEn ?? null,
        description: validated.description ?? null,
        collegeId: validated.collegeId,
        isActive: validated.isActive,
      },
    })

    revalidatePath("/academic")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error updating department:", error)
    return { success: false, error: "فشل في تحديث القسم" }
  }
}

export async function deleteDepartment(id: string): Promise<ActionResult> {
  try {
    await requirePermission("department.manage")

    const department = await db.department.findUnique({
      where: { id },
      include: {
        majors: { where: { deletedAt: null } },
        courses: { where: { deletedAt: null } },
      },
    })

    if (!department) {
      return { success: false, error: "القسم غير موجود" }
    }

    if (department.majors.length > 0 || department.courses.length > 0) {
      return { success: false, error: "لا يمكن حذف القسم لوجود تخصصات أو مقررات مرتبطة به" }
    }

    await db.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath("/academic")
    return { success: true }
  } catch (error) {
    console.error("Error deleting department:", error)
    return { success: false, error: "فشل في حذف القسم" }
  }
}

// ============================================
// MAJOR ACTIONS
// ============================================

export async function createMajor(
  input: CreateMajorInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("major.manage")
    const validated = createMajorSchema.parse(input)

    const existing = await db.major.findUnique({ where: { code: validated.code } })
    if (existing) {
      return { success: false, error: "كود التخصص موجود مسبقاً" }
    }

    const major = await db.major.create({
      data: {
        code: validated.code,
        nameAr: validated.nameAr,
        nameEn: validated.nameEn ?? null,
        description: validated.description ?? null,
        departmentId: validated.departmentId,
        totalCredits: validated.totalCredits ?? 0,
      },
    })

    revalidatePath("/academic")
    return { success: true, data: { id: major.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error creating major:", error)
    return { success: false, error: "فشل في إنشاء التخصص" }
  }
}

export async function updateMajor(
  input: UpdateMajorInput
): Promise<ActionResult> {
  try {
    await requirePermission("major.manage")
    const validated = updateMajorSchema.parse(input)

    const existing = await db.major.findUnique({ where: { id: validated.id } })
    if (!existing) {
      return { success: false, error: "التخصص غير موجود" }
    }

    if (validated.code !== existing.code) {
      const codeExists = await db.major.findUnique({ where: { code: validated.code } })
      if (codeExists) {
        return { success: false, error: "كود التخصص موجود مسبقاً" }
      }
    }

    await db.major.update({
      where: { id: validated.id },
      data: {
        code: validated.code,
        nameAr: validated.nameAr,
        nameEn: validated.nameEn ?? null,
        description: validated.description ?? null,
        departmentId: validated.departmentId,
        totalCredits: validated.totalCredits ?? 0,
        isActive: validated.isActive,
      },
    })

    revalidatePath("/academic")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error updating major:", error)
    return { success: false, error: "فشل في تحديث التخصص" }
  }
}

export async function deleteMajor(id: string): Promise<ActionResult> {
  try {
    await requirePermission("major.manage")

    const major = await db.major.findUnique({
      where: { id },
      include: { students: true },
    })

    if (!major) {
      return { success: false, error: "التخصص غير موجود" }
    }

    if (major.students.length > 0) {
      return { success: false, error: "لا يمكن حذف التخصص لوجود طلاب مسجلين فيه" }
    }

    await db.major.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath("/academic")
    return { success: true }
  } catch (error) {
    console.error("Error deleting major:", error)
    return { success: false, error: "فشل في حذف التخصص" }
  }
}

// ============================================
// COURSE ACTIONS
// ============================================

export async function getCourses(params?: {
  search?: string
  departmentId?: string
  page?: number
  pageSize?: number
}): Promise<ActionResult<{
  courses: CourseData[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}>> {
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
              nameAr: true,
              college: { select: { nameAr: true } },
            },
          },
        },
        orderBy: { code: "asc" },
      }),
      db.course.count({ where }),
    ])

    return {
      success: true,
      data: {
        courses: courses as CourseData[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("Error fetching courses:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "فشل في جلب المقررات",
    }
  }
}

export async function createCourse(
  input: CreateCourseInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("course.create")
    const validated = createCourseSchema.parse(input)

    const existing = await db.course.findUnique({ where: { code: validated.code } })
    if (existing) {
      return { success: false, error: "كود المقرر موجود مسبقاً" }
    }

    const course = await db.course.create({
      data: {
        code: validated.code,
        nameAr: validated.nameAr,
        nameEn: validated.nameEn ?? null,
        description: validated.description ?? null,
        departmentId: validated.departmentId,
        credits: validated.credits,
      },
    })

    revalidatePath("/courses")
    revalidatePath("/academic")
    return { success: true, data: { id: course.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error creating course:", error)
    return { success: false, error: "فشل في إنشاء المقرر" }
  }
}

export async function updateCourse(
  input: UpdateCourseInput
): Promise<ActionResult> {
  try {
    await requirePermission("course.edit")
    const validated = updateCourseSchema.parse(input)

    const existing = await db.course.findUnique({ where: { id: validated.id } })
    if (!existing) {
      return { success: false, error: "المقرر غير موجود" }
    }

    if (validated.code !== existing.code) {
      const codeExists = await db.course.findUnique({ where: { code: validated.code } })
      if (codeExists) {
        return { success: false, error: "كود المقرر موجود مسبقاً" }
      }
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
    revalidatePath("/academic")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error updating course:", error)
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

    if (!course) {
      return { success: false, error: "المقرر غير موجود" }
    }

    if (course.offerings.length > 0) {
      return { success: false, error: "لا يمكن حذف المقرر لوجود شعب مرتبطة به" }
    }

    await db.course.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath("/courses")
    revalidatePath("/academic")
    return { success: true }
  } catch (error) {
    console.error("Error deleting course:", error)
    return { success: false, error: "فشل في حذف المقرر" }
  }
}

// ============================================
// HELPER: Get departments for dropdown
// ============================================

export async function getDepartmentsForSelect(): Promise<
  ActionResult<{ id: string; nameAr: string; collegeNameAr: string }[]>
> {
  try {
    const departments = await db.department.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        nameAr: true,
        college: { select: { nameAr: true } },
      },
      orderBy: { nameAr: "asc" },
    })

    return {
      success: true,
      data: departments.map((d) => ({
        id: d.id,
        nameAr: d.nameAr,
        collegeNameAr: d.college.nameAr,
      })),
    }
  } catch (error) {
    console.error("Error fetching departments:", error)
    return { success: false, error: "فشل في جلب الأقسام" }
  }
}
