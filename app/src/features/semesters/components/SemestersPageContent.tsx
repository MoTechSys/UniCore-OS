"use client"

/**
 * Semesters & Offerings Page Content
 * @module features/semesters/components/SemestersPageContent
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Calendar, Plus, Star, ToggleLeft, BookOpen, Users, Loader2, Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  createSemester, setCurrentSemester, toggleSemesterActive,
  createOffering, deleteOffering,
  type SemesterData, type OfferingWithDetails, type CreateOfferingInput,
} from "../actions"

interface SemestersPageContentProps {
  semesters: SemesterData[]
  offerings: OfferingWithDetails[]
  courses: { id: string; code: string; nameAr: string }[]
  instructors: { id: string; name: string }[]
  permissions: {
    canManageSemesters: boolean
    canSetCurrent: boolean
    canManageOfferings: boolean
    canEnroll: boolean
  }
}

export function SemestersPageContent({
  semesters, offerings, courses, instructors, permissions,
}: SemestersPageContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [semesterModal, setSemesterModal] = useState(false)
  const [offeringModal, setOfferingModal] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState<string>(
    semesters.find(s => s.isCurrent)?.id ?? semesters[0]?.id ?? ""
  )

  // Semester form
  const [semCode, setSemCode] = useState("")
  const [semNameAr, setSemNameAr] = useState("")
  const [semType, setSemType] = useState<"FIRST" | "SECOND" | "SUMMER">("FIRST")
  const [semYear, setSemYear] = useState(2025)
  const [semStart, setSemStart] = useState("")
  const [semEnd, setSemEnd] = useState("")

  // Offering form
  const [ofCourseId, setOfCourseId] = useState("")
  const [ofInstructorId, setOfInstructorId] = useState("")
  const [ofSection, setOfSection] = useState("1")
  const [ofMaxStudents, setOfMaxStudents] = useState(50)

  const filteredOfferings = selectedSemester
    ? offerings.filter((o) => o.semester.id === selectedSemester)
    : offerings

  const handleCreateSemester = () => {
    startTransition(async () => {
      const result = await createSemester({
        code: semCode, nameAr: semNameAr, type: semType, year: semYear,
        startDate: semStart, endDate: semEnd,
      })
      if (result.success) { toast.success("تم إنشاء الفصل"); setSemesterModal(false); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  const handleSetCurrent = (id: string) => {
    startTransition(async () => {
      const result = await setCurrentSemester(id)
      if (result.success) { toast.success("تم تعيين الفصل الحالي"); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  const handleToggleActive = (id: string) => {
    startTransition(async () => {
      const result = await toggleSemesterActive(id)
      if (result.success) { toast.success("تم تغيير الحالة"); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  const handleCreateOffering = () => {
    startTransition(async () => {
      const result = await createOffering({
        courseId: ofCourseId, semesterId: selectedSemester,
        instructorId: ofInstructorId, section: ofSection, maxStudents: ofMaxStudents,
      })
      if (result.success) { toast.success("تم إنشاء الشعبة"); setOfferingModal(false); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  const handleDeleteOffering = (id: string) => {
    startTransition(async () => {
      const result = await deleteOffering(id)
      if (result.success) { toast.success("تم حذف الشعبة"); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  const semesterTypeLabel = (type: string) => {
    switch (type) {
      case "FIRST": return "الأول"
      case "SECOND": return "الثاني"
      case "SUMMER": return "الصيفي"
      default: return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Semesters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />الفصول الدراسية</CardTitle>
            <CardDescription>إدارة الفصول الدراسية والشعب</CardDescription>
          </div>
          {permissions.canManageSemesters && (
            <Button size="sm" onClick={() => setSemesterModal(true)}><Plus className="h-4 w-4 ml-2" />فصل جديد</Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {semesters.map((sem) => (
              <div
                key={sem.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedSemester === sem.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                }`}
                onClick={() => setSelectedSemester(sem.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{sem.nameAr}</h3>
                  <div className="flex gap-1">
                    {sem.isCurrent && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">الحالي</Badge>}
                    <Badge variant={sem.isActive ? "default" : "secondary"} className="text-xs">{sem.isActive ? "نشط" : "معطل"}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{sem.code} · الفصل {semesterTypeLabel(sem.type)} · {sem.year}</p>
                <p className="text-xs text-muted-foreground">{sem._count.offerings} شعبة</p>
                {permissions.canManageSemesters && (
                  <div className="flex gap-1 mt-3" onClick={(e) => e.stopPropagation()}>
                    {permissions.canSetCurrent && !sem.isCurrent && (
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleSetCurrent(sem.id)}>
                        <Star className="h-3 w-3 ml-1" />تعيين كحالي
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleToggleActive(sem.id)}>
                      <ToggleLeft className="h-3 w-3 ml-1" />{sem.isActive ? "تعطيل" : "تفعيل"}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Offerings for selected semester */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />الشعب الدراسية</CardTitle>
          {permissions.canManageOfferings && selectedSemester && (
            <Button size="sm" onClick={() => setOfferingModal(true)}><Plus className="h-4 w-4 ml-2" />شعبة جديدة</Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>المقرر</TableHead>
                  <TableHead>الشعبة</TableHead>
                  <TableHead className="hidden md:table-cell">الطلاب</TableHead>
                  <TableHead className="hidden md:table-cell">الاختبارات</TableHead>
                  {permissions.canManageOfferings && <TableHead className="w-16">إجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOfferings.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد شعب في هذا الفصل</TableCell></TableRow>
                ) : filteredOfferings.map((off) => (
                  <TableRow key={off.id}>
                    <TableCell className="font-mono text-xs">{off.code}</TableCell>
                    <TableCell><p className="font-medium text-sm">{off.course.nameAr}</p><p className="text-xs text-muted-foreground">{off.course.code} · {off.course.credits} ساعات</p></TableCell>
                    <TableCell><Badge variant="outline">{off.section}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell"><div className="flex items-center gap-1"><Users className="h-3 w-3" />{off._count.enrollments}/{off.maxStudents}</div></TableCell>
                    <TableCell className="hidden md:table-cell">{off._count.quizzes}</TableCell>
                    {permissions.canManageOfferings && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteOffering(off.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Semester Modal */}
      <Dialog open={semesterModal} onOpenChange={setSemesterModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>إضافة فصل دراسي</DialogTitle><DialogDescription>أدخل بيانات الفصل الجديد</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>الكود</Label><Input value={semCode} onChange={(e) => setSemCode(e.target.value)} dir="ltr" placeholder="2025-2" /></div>
              <div className="space-y-2"><Label>السنة</Label><Input type="number" value={semYear} onChange={(e) => setSemYear(parseInt(e.target.value))} /></div>
            </div>
            <div className="space-y-2"><Label>الاسم</Label><Input value={semNameAr} onChange={(e) => setSemNameAr(e.target.value)} /></div>
            <div className="space-y-2"><Label>النوع</Label>
              <Select value={semType} onValueChange={(v) => setSemType(v as "FIRST" | "SECOND" | "SUMMER")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIRST">الفصل الأول</SelectItem>
                  <SelectItem value="SECOND">الفصل الثاني</SelectItem>
                  <SelectItem value="SUMMER">الفصل الصيفي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>تاريخ البداية</Label><Input type="date" value={semStart} onChange={(e) => setSemStart(e.target.value)} /></div>
              <div className="space-y-2"><Label>تاريخ النهاية</Label><Input type="date" value={semEnd} onChange={(e) => setSemEnd(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSemesterModal(false)}>إلغاء</Button>
            <Button onClick={handleCreateSemester} disabled={isPending || !semCode || !semNameAr}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Offering Modal */}
      <Dialog open={offeringModal} onOpenChange={setOfferingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>إضافة شعبة</DialogTitle><DialogDescription>أدخل بيانات الشعبة الجديدة</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>المقرر</Label>
              <Select value={ofCourseId} onValueChange={setOfCourseId}>
                <SelectTrigger><SelectValue placeholder="اختر المقرر" /></SelectTrigger>
                <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} - {c.nameAr}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>المدرس</Label>
              <Select value={ofInstructorId} onValueChange={setOfInstructorId}>
                <SelectTrigger><SelectValue placeholder="اختر المدرس" /></SelectTrigger>
                <SelectContent>{instructors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>رقم الشعبة</Label><Input value={ofSection} onChange={(e) => setOfSection(e.target.value)} /></div>
              <div className="space-y-2"><Label>الحد الأقصى</Label><Input type="number" value={ofMaxStudents} onChange={(e) => setOfMaxStudents(parseInt(e.target.value) || 50)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferingModal(false)}>إلغاء</Button>
            <Button onClick={handleCreateOffering} disabled={isPending || !ofCourseId || !ofInstructorId}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
