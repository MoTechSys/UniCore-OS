"use client"

/**
 * Quizzes Page Content
 * @module features/quizzes/components/QuizzesPageContent
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  FileText, Plus, Eye, Pencil, Trash2, Play, Lock, CheckCircle, Loader2,
  Clock, Users, HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  createQuiz, publishQuiz, closeQuiz, deleteQuiz, addQuestion, deleteQuestion,
  type QuizWithDetails, type CreateQuizInput, type AddQuestionInput,
} from "../actions"

interface QuizzesPageContentProps {
  quizzes: QuizWithDetails[]
  offerings: { id: string; code: string; courseName: string }[]
  permissions: {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canPublish: boolean
    canGrade: boolean
  }
}

export function QuizzesPageContent({ quizzes, offerings, permissions }: QuizzesPageContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [createModal, setCreateModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Form
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [offeringId, setOfferingId] = useState("")
  const [duration, setDuration] = useState(30)
  const [passingScore, setPassingScore] = useState(60)
  const [shuffleQ, setShuffleQ] = useState(false)
  const [shuffleO, setShuffleO] = useState(false)
  const [showResults, setShowResults] = useState(true)

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createQuiz({
        title, description: description || undefined, offeringId,
        duration, passingScore, shuffleQuestions: shuffleQ, shuffleOptions: shuffleO, showResults,
      })
      if (result.success) {
        toast.success("تم إنشاء الاختبار")
        setCreateModal(false)
        router.refresh()
      } else toast.error(result.error ?? "خطأ")
    })
  }

  const handlePublish = (id: string) => {
    startTransition(async () => {
      const result = await publishQuiz(id)
      if (result.success) { toast.success("تم نشر الاختبار"); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  const handleClose = (id: string) => {
    startTransition(async () => {
      const result = await closeQuiz(id)
      if (result.success) { toast.success("تم إغلاق الاختبار"); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  const handleDelete = () => {
    if (!deleteId) return
    startTransition(async () => {
      const result = await deleteQuiz(deleteId)
      if (result.success) { toast.success("تم الحذف"); setDeleteId(null); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <Badge variant="secondary"><Pencil className="h-3 w-3 ml-1" />مسودة</Badge>
      case "PUBLISHED": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><Play className="h-3 w-3 ml-1" />منشور</Badge>
      case "CLOSED": return <Badge variant="outline"><Lock className="h-3 w-3 ml-1" />مغلق</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><FileText className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{quizzes.length}</p><p className="text-xs text-muted-foreground">اختبار</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><Play className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{quizzes.filter(q => q.status === "PUBLISHED").length}</p><p className="text-xs text-muted-foreground">منشور</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-lg"><HelpCircle className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{quizzes.reduce((s, q) => s + q._count.questions, 0)}</p><p className="text-xs text-muted-foreground">سؤال</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-orange-100 rounded-lg"><Users className="h-5 w-5 text-orange-600" /></div><div><p className="text-2xl font-bold">{quizzes.reduce((s, q) => s + q._count.attempts, 0)}</p><p className="text-xs text-muted-foreground">محاولة</p></div></div></CardContent></Card>
      </div>

      {/* Quiz List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>الاختبارات</CardTitle><CardDescription>إدارة الاختبارات والأسئلة</CardDescription></div>
          {permissions.canCreate && (
            <Button onClick={() => setCreateModal(true)}><Plus className="h-4 w-4 ml-2" />اختبار جديد</Button>
          )}
        </CardHeader>
        <CardContent>
          {quizzes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>لا توجد اختبارات بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{quiz.title}</p>
                      {statusBadge(quiz.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {quiz.offering.course.nameAr} · {quiz.offering.semester.nameAr}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" />{quiz._count.questions} سؤال</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{quiz.duration} دقيقة</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{quiz._count.attempts} محاولة</span>
                      <span>{quiz.totalPoints} درجة</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/quizzes/${quiz.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {permissions.canPublish && quiz.status === "DRAFT" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handlePublish(quiz.id)}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {permissions.canEdit && quiz.status === "PUBLISHED" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleClose(quiz.id)}>
                        <Lock className="h-4 w-4" />
                      </Button>
                    )}
                    {permissions.canDelete && quiz.status === "DRAFT" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(quiz.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>إنشاء اختبار جديد</DialogTitle><DialogDescription>أدخل إعدادات الاختبار</DialogDescription></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2"><Label>العنوان</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>الوصف</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
            <div className="space-y-2"><Label>الشعبة</Label>
              <Select value={offeringId} onValueChange={setOfferingId}>
                <SelectTrigger><SelectValue placeholder="اختر الشعبة" /></SelectTrigger>
                <SelectContent>{offerings.map((o) => <SelectItem key={o.id} value={o.id}>{o.code} - {o.courseName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>المدة (دقائق)</Label><Input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 30)} min={5} /></div>
              <div className="space-y-2"><Label>درجة النجاح (%)</Label><Input type="number" value={passingScore} onChange={(e) => setPassingScore(parseInt(e.target.value) || 60)} min={0} max={100} /></div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>خلط الأسئلة</Label><Switch checked={shuffleQ} onCheckedChange={setShuffleQ} /></div>
              <div className="flex items-center justify-between"><Label>خلط الخيارات</Label><Switch checked={shuffleO} onCheckedChange={setShuffleO} /></div>
              <div className="flex items-center justify-between"><Label>عرض النتائج بعد التسليم</Label><Switch checked={showResults} onCheckedChange={setShowResults} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModal(false)}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={isPending || !title || !offeringId}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا الاختبار؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
