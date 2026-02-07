"use client"

/**
 * Quiz Detail Content - Questions management and attempts viewing
 * @module features/quizzes/components/QuizDetailContent
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus, Trash2, Loader2, HelpCircle, CheckCircle, XCircle, Clock, Users, Award,
  ListOrdered, ToggleLeft, MessageSquare,
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  addQuestion, deleteQuestion, publishQuiz, closeQuiz,
  type QuizWithDetails, type QuestionWithOptions, type AttemptWithDetails,
} from "../actions"

interface QuizDetailContentProps {
  quiz: QuizWithDetails & { questions: QuestionWithOptions[] }
  attempts: AttemptWithDetails[]
  permissions: {
    canEdit: boolean
    canPublish: boolean
    canGrade: boolean
    canDelete: boolean
  }
}

export function QuizDetailContent({ quiz, attempts, permissions }: QuizDetailContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [questionModal, setQuestionModal] = useState(false)
  const [tab, setTab] = useState<"questions" | "attempts">("questions")

  // Question form
  const [qType, setQType] = useState<"MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER">("MULTIPLE_CHOICE")
  const [qText, setQText] = useState("")
  const [qPoints, setQPoints] = useState(1)
  const [qDifficulty, setQDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM")
  const [qExplanation, setQExplanation] = useState("")
  const [options, setOptions] = useState([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ])

  const resetForm = () => {
    setQType("MULTIPLE_CHOICE"); setQText(""); setQPoints(1)
    setQDifficulty("MEDIUM"); setQExplanation("")
    setOptions([{ text: "", isCorrect: true }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }])
  }

  const handleAddQuestion = () => {
    startTransition(async () => {
      const questionOptions = qType === "MULTIPLE_CHOICE"
        ? options.filter(o => o.text.trim())
        : qType === "TRUE_FALSE"
          ? [{ text: "صح", isCorrect: true }, { text: "خطأ", isCorrect: false }]
          : undefined

      const result = await addQuestion({
        quizId: quiz.id, type: qType, text: qText, points: qPoints,
        difficulty: qDifficulty, explanation: qExplanation || undefined,
        options: questionOptions,
      })
      if (result.success) { toast.success("تم إضافة السؤال"); setQuestionModal(false); resetForm(); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  const handleDeleteQuestion = (id: string) => {
    startTransition(async () => {
      const result = await deleteQuestion(id)
      if (result.success) { toast.success("تم حذف السؤال"); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  const handlePublish = () => {
    startTransition(async () => {
      const result = await publishQuiz(quiz.id)
      if (result.success) { toast.success("تم نشر الاختبار"); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  const handleClose = () => {
    startTransition(async () => {
      const result = await closeQuiz(quiz.id)
      if (result.success) { toast.success("تم إغلاق الاختبار"); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE": return <ListOrdered className="h-4 w-4" />
      case "TRUE_FALSE": return <ToggleLeft className="h-4 w-4" />
      case "SHORT_ANSWER": return <MessageSquare className="h-4 w-4" />
      default: return <HelpCircle className="h-4 w-4" />
    }
  }

  const typeLabel = (type: string) => {
    switch (type) { case "MULTIPLE_CHOICE": return "اختيار"; case "TRUE_FALSE": return "صح/خطأ"; case "SHORT_ANSWER": return "مقالي"; default: return type }
  }

  return (
    <div className="space-y-6">
      {/* Quiz Info */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{quiz._count.questions}</p><p className="text-xs text-muted-foreground">سؤال</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{quiz.totalPoints}</p><p className="text-xs text-muted-foreground">درجة</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{quiz.duration}</p><p className="text-xs text-muted-foreground">دقيقة</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{quiz._count.attempts}</p><p className="text-xs text-muted-foreground">محاولة</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{quiz.passingScore}%</p><p className="text-xs text-muted-foreground">درجة النجاح</p></CardContent></Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {permissions.canPublish && quiz.status === "DRAFT" && (
          <Button onClick={handlePublish} disabled={isPending} className="bg-green-600 hover:bg-green-700">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}نشر الاختبار
          </Button>
        )}
        {permissions.canEdit && quiz.status === "PUBLISHED" && (
          <Button variant="outline" onClick={handleClose} disabled={isPending}>إغلاق الاختبار</Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button variant={tab === "questions" ? "default" : "ghost"} size="sm" onClick={() => setTab("questions")}>
          <HelpCircle className="h-4 w-4 ml-2" />الأسئلة ({quiz.questions.length})
        </Button>
        <Button variant={tab === "attempts" ? "default" : "ghost"} size="sm" onClick={() => setTab("attempts")}>
          <Users className="h-4 w-4 ml-2" />المحاولات ({attempts.length})
        </Button>
      </div>

      {/* Questions Tab */}
      {tab === "questions" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>الأسئلة</CardTitle>
            {permissions.canEdit && quiz.status === "DRAFT" && (
              <Button size="sm" onClick={() => setQuestionModal(true)}><Plus className="h-4 w-4 ml-2" />إضافة سؤال</Button>
            )}
          </CardHeader>
          <CardContent>
            {quiz.questions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">لا توجد أسئلة بعد</p>
            ) : (
              <div className="space-y-3">
                {quiz.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">{idx + 1}</Badge>
                          {typeIcon(q.type)}
                          <Badge variant="secondary" className="text-xs">{typeLabel(q.type)}</Badge>
                          <Badge variant="outline" className="text-xs">{q.points} درجة</Badge>
                          <Badge variant="outline" className="text-xs">{q.difficulty === "EASY" ? "سهل" : q.difficulty === "MEDIUM" ? "متوسط" : "صعب"}</Badge>
                        </div>
                        <p className="text-sm">{q.text}</p>
                        {q.options.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {q.options.map((opt) => (
                              <div key={opt.id} className={`flex items-center gap-2 text-xs p-1.5 rounded ${opt.isCorrect ? "bg-green-50 text-green-800" : ""}`}>
                                {opt.isCorrect ? <CheckCircle className="h-3 w-3 text-green-600" /> : <XCircle className="h-3 w-3 text-muted-foreground" />}
                                {opt.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {permissions.canEdit && quiz.status === "DRAFT" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteQuestion(q.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attempts Tab */}
      {tab === "attempts" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطالب</TableHead>
                  <TableHead>الرقم الأكاديمي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الدرجة</TableHead>
                  <TableHead>النسبة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد محاولات</TableCell></TableRow>
                ) : attempts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.student.profile ? `${a.student.profile.firstNameAr} ${a.student.profile.lastNameAr}` : "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{a.student.academicId}</TableCell>
                    <TableCell>
                      {a.status === "IN_PROGRESS" && <Badge variant="secondary">جاري</Badge>}
                      {a.status === "SUBMITTED" && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">مسلم</Badge>}
                      {a.status === "GRADED" && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">مصحح</Badge>}
                    </TableCell>
                    <TableCell>{a.score !== null ? a.score : "-"}</TableCell>
                    <TableCell>{a.percentage !== null ? `${Math.round(a.percentage)}%` : "-"}</TableCell>
                    <TableCell className="text-xs">{new Date(a.startedAt).toLocaleDateString("ar-SA")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Question Modal */}
      <Dialog open={questionModal} onOpenChange={setQuestionModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>إضافة سؤال</DialogTitle><DialogDescription>أضف سؤالاً جديداً للاختبار</DialogDescription></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>النوع</Label>
                <Select value={qType} onValueChange={(v) => setQType(v as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MULTIPLE_CHOICE">اختيار متعدد</SelectItem>
                    <SelectItem value="TRUE_FALSE">صح / خطأ</SelectItem>
                    <SelectItem value="SHORT_ANSWER">مقالي قصير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>الدرجة</Label><Input type="number" value={qPoints} onChange={(e) => setQPoints(parseFloat(e.target.value) || 1)} min={0.5} step={0.5} /></div>
              <div className="space-y-2"><Label>الصعوبة</Label>
                <Select value={qDifficulty} onValueChange={(v) => setQDifficulty(v as "EASY" | "MEDIUM" | "HARD")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">سهل</SelectItem>
                    <SelectItem value="MEDIUM">متوسط</SelectItem>
                    <SelectItem value="HARD">صعب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>نص السؤال</Label><Textarea value={qText} onChange={(e) => setQText(e.target.value)} rows={3} /></div>

            {qType === "MULTIPLE_CHOICE" && (
              <div className="space-y-3">
                <Label>الخيارات (حدد الإجابة الصحيحة)</Label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={opt.isCorrect} onChange={() => setOptions(options.map((o, i) => ({ ...o, isCorrect: i === idx })))} />
                    <Input value={opt.text} onChange={(e) => setOptions(options.map((o, i) => i === idx ? { ...o, text: e.target.value } : o))} placeholder={`الخيار ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}

            {qType === "TRUE_FALSE" && (
              <div className="space-y-2">
                <Label>الإجابة الصحيحة</Label>
                <Select defaultValue="true" onValueChange={(v) => {
                  setOptions([{ text: "صح", isCorrect: v === "true" }, { text: "خطأ", isCorrect: v === "false" }])
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">صح</SelectItem>
                    <SelectItem value="false">خطأ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2"><Label>شرح الإجابة (اختياري)</Label><Textarea value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionModal(false)}>إلغاء</Button>
            <Button onClick={handleAddQuestion} disabled={isPending || !qText}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
