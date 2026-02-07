"use client"

/**
 * Courses Page Content
 * @module features/courses/components/CoursesPageContent
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  BookOpen, Plus, Pencil, Trash2, Search, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  createCourse, updateCourse, deleteCourse,
  type CourseWithDetails,
} from "../actions"

interface DeptOption {
  id: string
  nameAr: string
  collegeNameAr: string
}

interface CoursesPageContentProps {
  initialData: {
    courses: CourseWithDetails[]
    total: number
    page: number
    totalPages: number
  }
  departments: DeptOption[]
  permissions: {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
  }
  searchParams: { search?: string; departmentId?: string; page?: string }
}

export function CoursesPageContent({
  initialData, departments, permissions, searchParams,
}: CoursesPageContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseWithDetails | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState("")
  const [searchValue, setSearchValue] = useState(searchParams.search ?? "")

  // Form
  const [formCode, setFormCode] = useState("")
  const [formNameAr, setFormNameAr] = useState("")
  const [formNameEn, setFormNameEn] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formDeptId, setFormDeptId] = useState("")
  const [formCredits, setFormCredits] = useState(3)

  const openCreate = () => {
    setEditingCourse(null)
    setFormCode(""); setFormNameAr(""); setFormNameEn(""); setFormDesc("")
    setFormDeptId(""); setFormCredits(3)
    setModalOpen(true)
  }

  const openEdit = (c: CourseWithDetails) => {
    setEditingCourse(c)
    setFormCode(c.code); setFormNameAr(c.nameAr); setFormNameEn(c.nameEn ?? "")
    setFormDesc(c.description ?? ""); setFormDeptId(c.departmentId); setFormCredits(c.credits)
    setModalOpen(true)
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const result = editingCourse
        ? await updateCourse({ id: editingCourse.id, code: formCode, nameAr: formNameAr, nameEn: formNameEn || undefined, description: formDesc || undefined, departmentId: formDeptId, credits: formCredits })
        : await createCourse({ code: formCode, nameAr: formNameAr, nameEn: formNameEn || undefined, description: formDesc || undefined, departmentId: formDeptId, credits: formCredits })
      if (result.success) {
        toast.success(editingCourse ? "تم تحديث المقرر" : "تم إنشاء المقرر")
        setModalOpen(false)
        router.refresh()
      } else toast.error(result.error ?? "حدث خطأ")
    })
  }

  const handleDelete = () => {
    if (!deleteId) return
    startTransition(async () => {
      const result = await deleteCourse(deleteId)
      if (result.success) { toast.success("تم حذف المقرر"); setDeleteId(null); router.refresh() }
      else toast.error(result.error ?? "حدث خطأ")
    })
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchValue) params.set("search", searchValue)
    if (searchParams.departmentId) params.set("departmentId", searchParams.departmentId)
    router.push(`/courses?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><BookOpen className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{initialData.total}</p><p className="text-xs text-muted-foreground">مقرر</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <Input placeholder="بحث بالكود أو الاسم..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
              <Button variant="outline" onClick={handleSearch}><Search className="h-4 w-4" /></Button>
            </div>
            {permissions.canCreate && (
              <Button onClick={openCreate}><Plus className="h-4 w-4 ml-2" />إضافة مقرر</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead className="hidden md:table-cell">القسم</TableHead>
                  <TableHead className="hidden md:table-cell">الكلية</TableHead>
                  <TableHead>الساعات</TableHead>
                  <TableHead>الحالة</TableHead>
                  {(permissions.canEdit || permissions.canDelete) && <TableHead className="w-24">إجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialData.courses.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">لا توجد مقررات</TableCell></TableRow>
                ) : (
                  initialData.courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-mono text-sm">{course.code}</TableCell>
                      <TableCell><div><p className="font-medium">{course.nameAr}</p>{course.nameEn && <p className="text-xs text-muted-foreground">{course.nameEn}</p>}</div></TableCell>
                      <TableCell className="hidden md:table-cell">{course.department.nameAr}</TableCell>
                      <TableCell className="hidden md:table-cell">{course.department.college.nameAr}</TableCell>
                      <TableCell><Badge variant="outline">{course.credits}</Badge></TableCell>
                      <TableCell>{course.isActive ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">نشط</Badge> : <Badge variant="secondary">معطل</Badge>}</TableCell>
                      {(permissions.canEdit || permissions.canDelete) && (
                        <TableCell>
                          <div className="flex gap-1">
                            {permissions.canEdit && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(course)}><Pencil className="h-3.5 w-3.5" /></Button>}
                            {permissions.canDelete && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDeleteId(course.id); setDeleteName(course.nameAr) }}><Trash2 className="h-3.5 w-3.5" /></Button>}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "تعديل مقرر" : "إضافة مقرر"}</DialogTitle>
            <DialogDescription>{editingCourse ? "تعديل بيانات المقرر" : "أدخل بيانات المقرر الجديد"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>الكود</Label><Input value={formCode} onChange={(e) => setFormCode(e.target.value)} dir="ltr" placeholder="CS101" /></div>
            <div className="space-y-2"><Label>الاسم بالعربية</Label><Input value={formNameAr} onChange={(e) => setFormNameAr(e.target.value)} /></div>
            <div className="space-y-2"><Label>الاسم بالإنجليزية</Label><Input value={formNameEn} onChange={(e) => setFormNameEn(e.target.value)} dir="ltr" /></div>
            <div className="space-y-2"><Label>القسم</Label>
              <Select value={formDeptId} onValueChange={setFormDeptId}>
                <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                <SelectContent>{departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.nameAr} - {d.collegeNameAr}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>الساعات المعتمدة</Label><Input type="number" value={formCredits} onChange={(e) => setFormCredits(parseInt(e.target.value) || 3)} min={1} max={12} /></div>
            <div className="space-y-2"><Label>الوصف</Label><Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={isPending || !formCode || !formNameAr || !formDeptId}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              {editingCourse ? "حفظ" : "إنشاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف المقرر &quot;{deleteName}&quot;؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
