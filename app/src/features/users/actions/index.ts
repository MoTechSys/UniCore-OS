"use server"

/**
 * User Management Server Actions
 * 
 * Handles all user CRUD operations with permission checks.
 * 
 * @module features/users/actions
 */

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requirePermission } from "@/lib/auth/permissions"
import { hashPassword } from "@/lib/auth"

// ============================================
// SCHEMAS
// ============================================

const createUserSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  firstNameAr: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  lastNameAr: z.string().min(2, "الاسم الأخير يجب أن يكون حرفين على الأقل"),
  academicId: z.string().min(1, "الرقم الأكاديمي مطلوب"),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  roleIds: z.array(z.string()).min(1, "يجب تحديد دور واحد على الأقل"),
})

const updateUserSchema = z.object({
  id: z.string(),
  email: z.string().email("البريد الإلكتروني غير صالح").optional(),
  firstNameAr: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل").optional(),
  lastNameAr: z.string().min(2, "الاسم الأخير يجب أن يكون حرفين على الأقل").optional(),
  academicId: z.string().min(1, "الرقم الأكاديمي مطلوب").optional(),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").optional(),
  roleIds: z.array(z.string()).optional(),
})

// ============================================
// TYPES
// ============================================

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface UserWithRoles {
  id: string
  email: string | null
  academicId: string
  nationalId: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  profile: {
    firstNameAr: string
    lastNameAr: string
    phone: string | null
  } | null
  roles: {
    role: {
      id: string
      nameAr: string
      isSystem: boolean
    }
  }[]
}

export interface PaginatedUsers {
  users: UserWithRoles[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================
// GET USERS (with pagination, search, filter)
// ============================================

export async function getUsers(params: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  roleId?: string
}): Promise<ActionResult<PaginatedUsers>> {
  try {
    await requirePermission("user.view")

    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 10
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: Record<string, unknown> = {
      deletedAt: null, // Only non-deleted users
    }

    if (params.search) {
      where.OR = [
        { profile: { firstNameAr: { contains: params.search } } },
        { profile: { lastNameAr: { contains: params.search } } },
        { email: { contains: params.search } },
        { academicId: { contains: params.search } },
      ]
    }

    if (params.status && params.status !== "ALL") {
      where.status = params.status
    }

    if (params.roleId) {
      where.roles = {
        some: {
          roleId: params.roleId,
        },
      }
    }

    // Get users with roles
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          profile: {
            select: {
              firstNameAr: true,
              lastNameAr: true,
              phone: true,
            },
          },
          roles: {
            include: {
              role: {
                select: {
                  id: true,
                  nameAr: true,
                  isSystem: true,
                },
              },
            },
          },
        },
      }),
      db.user.count({ where }),
    ])

    return {
      success: true,
      data: {
        users: users as UserWithRoles[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("Error fetching users:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "فشل في جلب المستخدمين",
    }
  }
}

// ============================================
// GET SINGLE USER
// ============================================

export async function getUser(id: string): Promise<ActionResult<UserWithRoles>> {
  try {
    await requirePermission("user.view")

    const user = await db.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        profile: {
          select: {
            firstNameAr: true,
            lastNameAr: true,
            phone: true,
          },
        },
        roles: {
          include: {
            role: {
              select: {
                id: true,
                nameAr: true,
                isSystem: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return { success: false, error: "المستخدم غير موجود" }
    }

    return { success: true, data: user as UserWithRoles }
  } catch (error) {
    console.error("Error fetching user:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "فشل في جلب المستخدم",
    }
  }
}

// ============================================
// CREATE USER
// ============================================

export async function createUser(
  input: CreateUserInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("user.create")

    // Validate input
    const validated = createUserSchema.parse(input)

    // Check if email already exists
    if (validated.email) {
      const existingEmail = await db.user.findFirst({
        where: { email: validated.email, deletedAt: null },
      })
      if (existingEmail) {
        return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" }
      }
    }

    // Check if academicId already exists
    const existingAcademicId = await db.user.findFirst({
      where: { academicId: validated.academicId, deletedAt: null },
    })
    if (existingAcademicId) {
      return { success: false, error: "الرقم الأكاديمي مستخدم بالفعل" }
    }

    // Hash password
    const hashedPassword = await hashPassword(validated.password)

    // Create user with profile and roles
    const user = await db.user.create({
      data: {
        email: validated.email,
        academicId: validated.academicId,
        nationalId: validated.nationalId,
        passwordHash: hashedPassword,
        status: "ACTIVE",
        profile: {
          create: {
            firstNameAr: validated.firstNameAr,
            lastNameAr: validated.lastNameAr,
            phone: validated.phone,
          },
        },
        roles: {
          create: validated.roleIds.map((roleId) => ({
            role: { connect: { id: roleId } },
          })),
        },
      },
    })

    revalidatePath("/users")
    return { success: true, data: { id: user.id } }
  } catch (error) {
    console.error("Error creating user:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "فشل في إنشاء المستخدم",
    }
  }
}

// ============================================
// UPDATE USER
// ============================================

export async function updateUser(
  input: UpdateUserInput
): Promise<ActionResult<void>> {
  try {
    await requirePermission("user.edit")

    // Validate input
    const validated = updateUserSchema.parse(input)

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: validated.id, deletedAt: null },
      include: { roles: true, profile: true },
    })

    if (!existingUser) {
      return { success: false, error: "المستخدم غير موجود" }
    }

    // Check if email is taken by another user
    if (validated.email && validated.email !== existingUser.email) {
      const emailTaken = await db.user.findFirst({
        where: {
          email: validated.email,
          id: { not: validated.id },
          deletedAt: null,
        },
      })
      if (emailTaken) {
        return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" }
      }
    }

    // Check if academicId is taken by another user
    if (validated.academicId && validated.academicId !== existingUser.academicId) {
      const academicIdTaken = await db.user.findFirst({
        where: {
          academicId: validated.academicId,
          id: { not: validated.id },
          deletedAt: null,
        },
      })
      if (academicIdTaken) {
        return { success: false, error: "الرقم الأكاديمي مستخدم بالفعل" }
      }
    }

    // Prepare user update data
    const userUpdateData: Record<string, unknown> = {}
    if (validated.email !== undefined) userUpdateData.email = validated.email
    if (validated.academicId !== undefined) userUpdateData.academicId = validated.academicId
    if (validated.nationalId !== undefined) userUpdateData.nationalId = validated.nationalId
    if (validated.password) {
      userUpdateData.passwordHash = await hashPassword(validated.password)
    }

    // Update user
    await db.user.update({
      where: { id: validated.id },
      data: userUpdateData,
    })

    // Update profile if needed
    if (validated.firstNameAr || validated.lastNameAr || validated.phone !== undefined) {
      const profileData: Record<string, unknown> = {}
      if (validated.firstNameAr) profileData.firstNameAr = validated.firstNameAr
      if (validated.lastNameAr) profileData.lastNameAr = validated.lastNameAr
      if (validated.phone !== undefined) profileData.phone = validated.phone

      if (existingUser.profile) {
        await db.userProfile.update({
          where: { userId: validated.id },
          data: profileData,
        })
      }
    }

    // Update roles if provided
    if (validated.roleIds) {
      // Delete existing roles
      await db.userRole.deleteMany({
        where: { userId: validated.id },
      })

      // Create new roles
      await db.userRole.createMany({
        data: validated.roleIds.map((roleId) => ({
          userId: validated.id,
          roleId,
        })),
      })
    }

    revalidatePath("/users")
    return { success: true }
  } catch (error) {
    console.error("Error updating user:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "فشل في تحديث المستخدم",
    }
  }
}

// ============================================
// DELETE USER (Soft Delete)
// ============================================

export async function deleteUser(id: string): Promise<ActionResult<void>> {
  try {
    await requirePermission("user.delete")

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id, deletedAt: null },
      include: { roles: { include: { role: true } } },
    })

    if (!user) {
      return { success: false, error: "المستخدم غير موجود" }
    }

    // Prevent deleting system admin
    const hasSystemRole = user.roles.some((r) => r.role.isSystem)
    if (hasSystemRole) {
      return { success: false, error: "لا يمكن حذف مدير النظام" }
    }

    // Soft delete
    await db.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath("/users")
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "فشل في حذف المستخدم",
    }
  }
}

// ============================================
// CHANGE USER STATUS
// ============================================

export async function changeUserStatus(
  id: string,
  status: string
): Promise<ActionResult<void>> {
  try {
    await requirePermission("user.edit")

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id, deletedAt: null },
      include: { roles: { include: { role: true } } },
    })

    if (!user) {
      return { success: false, error: "المستخدم غير موجود" }
    }

    // Prevent changing system admin status
    const hasSystemRole = user.roles.some((r) => r.role.isSystem)
    if (hasSystemRole && status !== "ACTIVE") {
      return { success: false, error: "لا يمكن تغيير حالة مدير النظام" }
    }

    await db.user.update({
      where: { id },
      data: { status },
    })

    revalidatePath("/users")
    return { success: true }
  } catch (error) {
    console.error("Error changing user status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "فشل في تغيير حالة المستخدم",
    }
  }
}

// ============================================
// GET ROLES (for dropdown)
// ============================================

export async function getRoles(): Promise<
  ActionResult<{ id: string; nameAr: string; isSystem: boolean }[]>
> {
  try {
    const roles = await db.role.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        nameAr: true,
        isSystem: true,
      },
      orderBy: { nameAr: "asc" },
    })

    return { success: true, data: roles }
  } catch (error) {
    console.error("Error fetching roles:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "فشل في جلب الأدوار",
    }
  }
}
