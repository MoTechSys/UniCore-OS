"use client"

/**
 * User Form Component
 * 
 * Form for creating and editing users.
 * 
 * @module features/users/components/UserForm
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createUser, updateUser, getRoles, type UserWithRoles } from "../actions"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, X } from "lucide-react"
import { toast } from "sonner"

// ============================================
// SCHEMA
// ============================================

const userFormSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  firstNameAr: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  lastNameAr: z.string().min(2, "الاسم الأخير يجب أن يكون حرفين على الأقل"),
  academicId: z.string().min(1, "الرقم الأكاديمي مطلوب"),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").optional(),
  roleIds: z.array(z.string()).min(1, "يجب تحديد دور واحد على الأقل"),
})

type UserFormValues = z.infer<typeof userFormSchema>

// ============================================
// TYPES
// ============================================

interface UserFormProps {
  user?: UserWithRoles
  mode: "create" | "edit"
}

interface Role {
  id: string
  nameAr: string
  isSystem: boolean
}

// ============================================
// COMPONENT
// ============================================

export function UserForm({ user, mode }: UserFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(
      mode === "create"
        ? userFormSchema.extend({
            password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
          })
        : userFormSchema
    ),
    defaultValues: {
      email: user?.email ?? "",
      firstNameAr: user?.profile?.firstNameAr ?? "",
      lastNameAr: user?.profile?.lastNameAr ?? "",
      academicId: user?.academicId ?? "",
      nationalId: user?.nationalId ?? "",
      phone: user?.profile?.phone ?? "",
      password: "",
      roleIds: user?.roles.map((r) => r.role.id) ?? [],
    },
  })

  // Load roles
  useEffect(() => {
    async function loadRoles() {
      const result = await getRoles()
      if (result.success && result.data) {
        setRoles(result.data)
      }
      setLoadingRoles(false)
    }
    loadRoles()
  }, [])

  const onSubmit = async (values: UserFormValues) => {
    setLoading(true)
    try {
      if (mode === "create") {
        const result = await createUser({
          ...values,
          password: values.password!,
        })
        if (result.success) {
          toast.success("تم إنشاء المستخدم بنجاح")
          router.push("/users")
        } else {
          toast.error(result.error ?? "فشل في إنشاء المستخدم")
        }
      } else {
        const result = await updateUser({
          id: user!.id,
          ...values,
          password: values.password || undefined,
        })
        if (result.success) {
          toast.success("تم تحديث المستخدم بنجاح")
          router.push("/users")
        } else {
          toast.error(result.error ?? "فشل في تحديث المستخدم")
        }
      }
    } catch {
      toast.error("حدث خطأ غير متوقع")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstNameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الأول *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل الاسم الأول" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastNameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الأخير *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل الاسم الأخير" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@unicore.edu.sa"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="academicId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرقم الأكاديمي *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: 202312345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهوية</FormLabel>
                    <FormControl>
                      <Input placeholder="رقم الهوية الوطنية" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الجوال</FormLabel>
                    <FormControl>
                      <Input placeholder="05xxxxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      كلمة المرور {mode === "create" ? "*" : "(اتركها فارغة للإبقاء)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={
                          mode === "create" ? "أدخل كلمة المرور" : "كلمة مرور جديدة"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      يجب أن تكون 8 أحرف على الأقل
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الأدوار والصلاحيات</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRoles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <FormField
                control={form.control}
                name="roleIds"
                render={() => (
                  <FormItem>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {roles.map((role) => (
                        <FormField
                          key={role.id}
                          control={form.control}
                          name="roleIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={role.id}
                                className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md border p-4"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(role.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, role.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== role.id
                                            )
                                          )
                                    }}
                                    disabled={role.isSystem && mode === "edit"}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="cursor-pointer">
                                    {role.nameAr}
                                    {role.isSystem && (
                                      <span className="mr-2 text-xs text-primary">
                                        (نظام)
                                      </span>
                                    )}
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جارٍ الحفظ...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                {mode === "create" ? "إنشاء المستخدم" : "حفظ التغييرات"}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/users")}
          >
            <X className="ml-2 h-4 w-4" />
            إلغاء
          </Button>
        </div>
      </form>
    </Form>
  )
}
