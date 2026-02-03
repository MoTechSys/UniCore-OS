/**
 * نظام المصادقة - UniCore-OS
 * @description إعداد NextAuth v5 مع Credentials Provider بمعايير MAX
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { ExtendedUser, UserStatus } from "@/types/auth";
import type { JWT } from "next-auth/jwt";

/**
 * رسائل الخطأ المعرفة
 */
const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  ACCOUNT_PENDING: "حسابك في انتظار التفعيل. يرجى تفعيل حسابك أولاً",
  ACCOUNT_FROZEN: "حسابك مجمد. يرجى التواصل مع الإدارة",
  UNKNOWN_ERROR: "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً",
} as const;

/**
 * جلب صلاحيات المستخدم من قاعدة البيانات
 */
async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  // استخراج جميع الصلاحيات من جميع الأدوار
  const permissions = new Set<string>();
  
  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.permissions) {
      permissions.add(rolePermission.permission.code);
    }
  }

  return Array.from(permissions);
}

/**
 * التحقق من وجود دور نظامي (Super Admin)
 */
async function hasSystemRole(userId: string): Promise<boolean> {
  const systemRole = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        isSystem: true,
      },
    },
  });

  return systemRole !== null;
}

/**
 * إعداد NextAuth
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 ساعة
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        // التحقق من وجود البيانات
        if (!credentials?.email || !credentials?.password) {
          throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // البحث عن المستخدم
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            profile: true,
          },
        });

        if (!user) {
          throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
        }

        // التحقق من كلمة المرور
        const isPasswordValid = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
        if (!isPasswordValid) {
          throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
        }

        // التحقق من حالة الحساب
        const status = user.status as UserStatus;
        
        if (status === "PENDING") {
          throw new Error(AUTH_ERRORS.ACCOUNT_PENDING);
        }

        if (status === "FROZEN") {
          throw new Error(AUTH_ERRORS.ACCOUNT_FROZEN);
        }

        // جلب الصلاحيات
        const permissions = await getUserPermissions(user.id);
        const isSystemRole = await hasSystemRole(user.id);

        // إرجاع بيانات المستخدم
        return {
          id: user.id,
          email: user.email ?? "",
          name: `${user.profile?.firstNameAr ?? ""} ${user.profile?.lastNameAr ?? ""}`.trim() || (user.email ?? ""),
          academicId: user.academicId,
          status: status,
          permissions: permissions,
          isSystemRole: isSystemRole,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * Callback لتحديث JWT Token
     */
    async jwt({ token, user }) {
      if (user) {
        // أول تسجيل دخول - إضافة البيانات للـ Token
        token.id = user.id ?? "";
        token.academicId = (user as ExtendedUser).academicId;
        token.status = (user as ExtendedUser).status;
        token.permissions = (user as ExtendedUser).permissions;
        token.isSystemRole = (user as ExtendedUser).isSystemRole;
      }
      return token;
    },
    /**
     * Callback لتحديث Session
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.academicId = token.academicId;
        session.user.status = token.status;
        session.user.permissions = token.permissions;
        session.user.isSystemRole = token.isSystemRole;
      }
      return session;
    },
  },
});

/**
 * التحقق من صلاحية معينة
 */
export function hasPermission(
  permissions: string[],
  requiredPermission: string,
  isSystemRole: boolean = false
): boolean {
  // السوبر أدمن يتجاوز كل الصلاحيات
  if (isSystemRole) return true;
  
  return permissions.includes(requiredPermission);
}

/**
 * التحقق من مجموعة صلاحيات (أي واحدة منها)
 */
export function hasAnyPermission(
  permissions: string[],
  requiredPermissions: string[],
  isSystemRole: boolean = false
): boolean {
  if (isSystemRole) return true;
  
  return requiredPermissions.some((p) => permissions.includes(p));
}

/**
 * التحقق من جميع الصلاحيات
 */
/**
 * تشفير كلمة المرور
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * التحقق من كلمة المرور
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function hasAllPermissions(
  permissions: string[],
  requiredPermissions: string[],
  isSystemRole: boolean = false
): boolean {
  if (isSystemRole) return true;
  
  return requiredPermissions.every((p) => permissions.includes(p));
}
