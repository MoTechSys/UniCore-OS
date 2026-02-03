"use client"

/**
 * Create User Modal Component
 * 
 * Modal dialog for creating new users with form validation.
 * Uses Server Actions for form submission.
 * 
 * @module features/users/components/CreateUserModal
 */

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createUser } from "../actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

// ============================================
// TYPES
// ============================================

interface RoleData {
  id: string
  nameAr: string
  code: string
  isSystem: boolean
}

interface CreateUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: RoleData[]
  onSuccess: () => void
}

// ============================================
// VALIDATION SCHEMA
// ============================================

const createUserSchema = z.object({
  academicId: z.string().min(1, "الرقم الأكاديمي مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير")
    .regex(/[a-z]/, "يجب أن تحتوي على حرف صغير")
    .regex(/[0-9]/, "يجب أن تحتوي على رقم"),
  firstNameAr: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  lastNameAr: z.string().min(2, "الاسم الأخير يجب أن يكون حرفين على الأقل"),
  firstNameEn: z.string().optional(),
  lastNameEn: z.string().optional(),
  phone: z.string().optional(),
  nationalId: z.string().optional(),
  roleIds: z.array(z.string()).min(1, "يجب تحديد دور واحد على الأقل"),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

// ============================================
// COMPONENT
// ============================================

export function CreateUserModal({
  open,
  onOpenChange,
  roles,
  onSuccess,
}: CreateUserModalProps) {
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      academicId: "",
      email: "",
      password: "",
      firstNameAr: "",
      lastNameAr: "",
      firstNameEn: "",
      lastNameEn: "",
      phone: "",
      nationalId: "",
      roleIds: [],
    },
  })

  const onSubmit = (data: CreateUserFormData) => {
    startTransition(async () => {
      try {
        const result = await createUser(data)
        if (result.success) {
          toast.success("تم إنشاء المستخدم بنجاح")
          form.reset()
          onOpenChange(false)
          onSuccess()
        } else {
          toast.error(result.error ?? "فشل في إنشاء المستخدم")
        }
      } catch {
        toast.error("حدث خطأ غير متوقع")
      }
    })
  }

  const handleClose = () => {
    if (!isPending) {
      form.reset()
      onOpenChange(false)
    }
  }

  // Filter out system roles from selection
  const availableRoles = roles.filter((role) => !role.isSystem)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            إضافة مستخدم جديد
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات المستخدم الجديد. جميع الحقول المميزة بـ (*) مطلوبة.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                المعلومات الأساسية
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstNameAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الأول (عربي) *</FormLabel>
                      <FormControl>
                        <Input placeholder="محمد" {...field} />
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
                      <FormLabel>الاسم الأخير (عربي) *</FormLabel>
                      <FormControl>
                        <Input placeholder="أحمد" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="firstNameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الأول (إنجليزي)</FormLabel>
                      <FormControl>
                        <Input placeholder="Mohammed" dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastNameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الأخير (إنجليزي)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ahmed" dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Account Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                معلومات الحساب
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="academicId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الرقم الأكاديمي *</FormLabel>
                      <FormControl>
                        <Input placeholder="STU001" dir="ltr" {...field} />
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
                        <Input placeholder="1234567890" dir="ltr" {...field} />
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
                          placeholder="user@unicore.edu.sa"
                          dir="ltr"
                          {...field}
                        />
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
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="05xxxxxxxx"
                          dir="ltr"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          dir="ltr"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، ورقم
                    </p>
                  </FormItem>
                )}
              />
            </div>

            {/* Role Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                الدور والصلاحيات
              </h3>

              <FormField
                control={form.control}
                name="roleIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدور *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange([value])}
                      value={field.value[0] ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الدور" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جارٍ الإنشاء...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 ml-2" />
                    إنشاء المستخدم
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
