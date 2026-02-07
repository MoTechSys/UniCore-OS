"use client"

/**
 * Academic Page Content - Tree View for Colleges → Departments → Majors
 * 
 * @module features/academic/components/AcademicPageContent
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Building2,
  FolderTree,
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronDown,
  BookOpen,
  Users,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createCollege,
  updateCollege,
  deleteCollege,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createMajor,
  updateMajor,
  deleteMajor,
  type CollegeWithRelations,
  type DepartmentWithRelations,
  type MajorData,
} from "../actions"

// ============================================
// TYPES
// ============================================

interface AcademicPageContentProps {
  initialData: CollegeWithRelations[]
  permissions: {
    canManageColleges: boolean
    canManageDepartments: boolean
    canManageMajors: boolean
  }
}

type ModalType = "college" | "department" | "major"
type ModalMode = "create" | "edit"

interface ModalState {
  open: boolean
  type: ModalType
  mode: ModalMode
  data?: CollegeWithRelations | DepartmentWithRelations | MajorData
  parentId?: string
}

interface DeleteState {
  open: boolean
  type: ModalType
  id: string
  name: string
}

// ============================================
// STAT CARDS
// ============================================

function AcademicStats({ colleges }: { colleges: CollegeWithRelations[] }) {
  const totalDepartments = colleges.reduce((acc, c) => acc + c.departments.length, 0)
  const totalMajors = colleges.reduce(
    (acc, c) => acc + c.departments.reduce((a, d) => a + d.majors.length, 0),
    0
  )
  const totalStudents = colleges.reduce(
    (acc, c) =>
      acc +
      c.departments.reduce(
        (a, d) => a + d.majors.reduce((m, maj) => m + maj._count.students, 0),
        0
      ),
    0
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{colleges.length}</p>
              <p className="text-xs text-muted-foreground">كلية</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FolderTree className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDepartments}</p>
              <p className="text-xs text-muted-foreground">قسم</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalMajors}</p>
              <p className="text-xs text-muted-foreground">تخصص</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">طالب</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AcademicPageContent({
  initialData,
  permissions,
}: AcademicPageContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expandedColleges, setExpandedColleges] = useState<Set<string>>(new Set())
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: "college",
    mode: "create",
  })
  const [deleteState, setDeleteState] = useState<DeleteState>({
    open: false,
    type: "college",
    id: "",
    name: "",
  })

  // Form states
  const [formCode, setFormCode] = useState("")
  const [formNameAr, setFormNameAr] = useState("")
  const [formNameEn, setFormNameEn] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formParentId, setFormParentId] = useState("")
  const [formCredits, setFormCredits] = useState(0)

  const toggleCollege = (id: string) => {
    const next = new Set(expandedColleges)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedColleges(next)
  }

  const toggleDept = (id: string) => {
    const next = new Set(expandedDepts)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedDepts(next)
  }

  const openCreateModal = (type: ModalType, parentId?: string) => {
    setFormCode("")
    setFormNameAr("")
    setFormNameEn("")
    setFormDescription("")
    setFormParentId(parentId ?? "")
    setFormCredits(0)
    setModal({ open: true, type, mode: "create", parentId })
  }

  const openEditModal = (
    type: ModalType,
    data: CollegeWithRelations | DepartmentWithRelations | MajorData
  ) => {
    setFormCode(data.code)
    setFormNameAr(data.nameAr)
    setFormNameEn(data.nameEn ?? "")
    setFormDescription(data.description ?? "")
    if (type === "department") {
      setFormParentId((data as DepartmentWithRelations).collegeId)
    } else if (type === "major") {
      setFormParentId((data as MajorData).departmentId)
      setFormCredits((data as MajorData).totalCredits)
    }
    setModal({ open: true, type, mode: "edit", data })
  }

  const handleSubmit = () => {
    startTransition(async () => {
      let result
      if (modal.type === "college") {
        if (modal.mode === "create") {
          result = await createCollege({
            code: formCode,
            nameAr: formNameAr,
            nameEn: formNameEn || undefined,
            description: formDescription || undefined,
          })
        } else {
          result = await updateCollege({
            id: modal.data!.id,
            code: formCode,
            nameAr: formNameAr,
            nameEn: formNameEn || undefined,
            description: formDescription || undefined,
          })
        }
      } else if (modal.type === "department") {
        if (modal.mode === "create") {
          result = await createDepartment({
            code: formCode,
            nameAr: formNameAr,
            nameEn: formNameEn || undefined,
            description: formDescription || undefined,
            collegeId: formParentId || modal.parentId || "",
          })
        } else {
          result = await updateDepartment({
            id: modal.data!.id,
            code: formCode,
            nameAr: formNameAr,
            nameEn: formNameEn || undefined,
            description: formDescription || undefined,
            collegeId: formParentId,
          })
        }
      } else if (modal.type === "major") {
        if (modal.mode === "create") {
          result = await createMajor({
            code: formCode,
            nameAr: formNameAr,
            nameEn: formNameEn || undefined,
            description: formDescription || undefined,
            departmentId: formParentId || modal.parentId || "",
            totalCredits: formCredits,
          })
        } else {
          result = await updateMajor({
            id: modal.data!.id,
            code: formCode,
            nameAr: formNameAr,
            nameEn: formNameEn || undefined,
            description: formDescription || undefined,
            departmentId: formParentId,
            totalCredits: formCredits,
          })
        }
      }

      if (result?.success) {
        toast.success(
          modal.mode === "create" ? "تم الإنشاء بنجاح" : "تم التحديث بنجاح"
        )
        setModal({ ...modal, open: false })
        router.refresh()
      } else {
        toast.error(result?.error ?? "حدث خطأ")
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      let result
      if (deleteState.type === "college") {
        result = await deleteCollege(deleteState.id)
      } else if (deleteState.type === "department") {
        result = await deleteDepartment(deleteState.id)
      } else {
        result = await deleteMajor(deleteState.id)
      }

      if (result.success) {
        toast.success("تم الحذف بنجاح")
        setDeleteState({ ...deleteState, open: false })
        router.refresh()
      } else {
        toast.error(result.error ?? "حدث خطأ")
      }
    })
  }

  const getTypeLabel = (type: ModalType) => {
    switch (type) {
      case "college":
        return "كلية"
      case "department":
        return "قسم"
      case "major":
        return "تخصص"
    }
  }

  return (
    <div className="space-y-6">
      <AcademicStats colleges={initialData} />

      {/* Tree View */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            الهيكل الأكاديمي
          </CardTitle>
          {permissions.canManageColleges && (
            <Button size="sm" onClick={() => openCreateModal("college")}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة كلية
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {initialData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">لا توجد كليات بعد</p>
              <p className="text-sm">ابدأ بإضافة الكليات لبناء الهيكل الأكاديمي</p>
            </div>
          ) : (
            <div className="space-y-2">
              {initialData.map((college) => (
                <div key={college.id} className="border rounded-lg">
                  {/* College Level */}
                  <div
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => toggleCollege(college.id)}
                  >
                    {expandedColleges.has(college.id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronLeft className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="p-1.5 bg-blue-100 rounded-md">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{college.nameAr}</p>
                      <p className="text-xs text-muted-foreground">
                        {college.code} · {college.departments.length} قسم
                      </p>
                    </div>
                    {!college.isActive && (
                      <Badge variant="secondary">معطل</Badge>
                    )}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {permissions.canManageDepartments && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openCreateModal("department", college.id)}
                          title="إضافة قسم"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {permissions.canManageColleges && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditModal("college", college)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() =>
                              setDeleteState({
                                open: true,
                                type: "college",
                                id: college.id,
                                name: college.nameAr,
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Departments Level */}
                  {expandedColleges.has(college.id) && college.departments.length > 0 && (
                    <div className="pr-8 pb-2">
                      {college.departments.map((dept) => (
                        <div key={dept.id} className="border-r-2 border-muted mr-4">
                          <div
                            className="flex items-center gap-3 p-2.5 hover:bg-muted/30 cursor-pointer transition-colors mr-2 rounded-md"
                            onClick={() => toggleDept(dept.id)}
                          >
                            {expandedDepts.has(dept.id) ? (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="p-1.5 bg-green-100 rounded-md">
                              <FolderTree className="h-3.5 w-3.5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{dept.nameAr}</p>
                              <p className="text-xs text-muted-foreground">
                                {dept.code} · {dept.majors.length} تخصص · {dept._count.courses} مقرر
                              </p>
                            </div>
                            {!dept.isActive && (
                              <Badge variant="secondary" className="text-xs">معطل</Badge>
                            )}
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {permissions.canManageMajors && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openCreateModal("major", dept.id)}
                                  title="إضافة تخصص"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              )}
                              {permissions.canManageDepartments && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => openEditModal("department", dept)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() =>
                                      setDeleteState({
                                        open: true,
                                        type: "department",
                                        id: dept.id,
                                        name: dept.nameAr,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Majors Level */}
                          {expandedDepts.has(dept.id) && dept.majors.length > 0 && (
                            <div className="pr-8 pb-1">
                              {dept.majors.map((major) => (
                                <div
                                  key={major.id}
                                  className="flex items-center gap-3 p-2 mr-6 hover:bg-muted/20 rounded-md transition-colors"
                                >
                                  <div className="p-1.5 bg-purple-100 rounded-md">
                                    <GraduationCap className="h-3 w-3 text-purple-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{major.nameAr}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {major.code} · {major.totalCredits} ساعة · {major._count.students} طالب
                                    </p>
                                  </div>
                                  {!major.isActive && (
                                    <Badge variant="secondary" className="text-xs">معطل</Badge>
                                  )}
                                  {permissions.canManageMajors && (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => openEditModal("major", major)}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() =>
                                          setDeleteState({
                                            open: true,
                                            type: "major",
                                            id: major.id,
                                            name: major.nameAr,
                                          })
                                        }
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={modal.open} onOpenChange={(open) => setModal({ ...modal, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modal.mode === "create" ? "إضافة" : "تعديل"} {getTypeLabel(modal.type)}
            </DialogTitle>
            <DialogDescription>
              {modal.mode === "create"
                ? `أدخل بيانات ${getTypeLabel(modal.type)} الجديد`
                : `تعديل بيانات ${getTypeLabel(modal.type)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">الكود</Label>
              <Input
                id="code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="مثال: CS"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">الاسم بالعربية</Label>
              <Input
                id="nameAr"
                value={formNameAr}
                onChange={(e) => setFormNameAr(e.target.value)}
                placeholder="أدخل الاسم بالعربية"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameEn">الاسم بالإنجليزية (اختياري)</Label>
              <Input
                id="nameEn"
                value={formNameEn}
                onChange={(e) => setFormNameEn(e.target.value)}
                placeholder="Enter English name"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="وصف مختصر..."
                rows={3}
              />
            </div>
            {modal.type === "major" && (
              <div className="space-y-2">
                <Label htmlFor="credits">إجمالي الساعات المعتمدة</Label>
                <Input
                  id="credits"
                  type="number"
                  value={formCredits}
                  onChange={(e) => setFormCredits(parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal({ ...modal, open: false })}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !formCode || !formNameAr}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              {modal.mode === "create" ? "إنشاء" : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteState.open}
        onOpenChange={(open) => setDeleteState({ ...deleteState, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف {getTypeLabel(deleteState.type)} &quot;{deleteState.name}&quot;؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
