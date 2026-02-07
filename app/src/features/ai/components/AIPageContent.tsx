"use client"

/**
 * AI Tools Page Content
 * @module features/ai/components/AIPageContent
 */

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  Sparkles, FileText, Award, BookOpen, Loader2, Copy, Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { generateQuestions, gradeEssay, summarizeContent } from "../actions"

interface AIPageContentProps {
  permissions: {
    canGenerate: boolean
    canSummarize: boolean
    canChat: boolean
  }
}

export function AIPageContent({ permissions }: AIPageContentProps) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<"generate" | "grade" | "summarize">("generate")

  // Generate Questions
  const [genContent, setGenContent] = useState("")
  const [genCount, setGenCount] = useState(5)
  const [genType, setGenType] = useState<"MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER">("MULTIPLE_CHOICE")
  const [genDifficulty, setGenDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM")
  const [generatedQuestions, setGeneratedQuestions] = useState<{text: string; type: string; options?: {text: string; isCorrect: boolean}[]}[]>([])

  // Grade Essay
  const [gradeQuestion, setGradeQuestion] = useState("")
  const [gradeAnswer, setGradeAnswer] = useState("")
  const [gradeMaxPoints, setGradeMaxPoints] = useState(10)
  const [gradeResult, setGradeResult] = useState<{score: number; feedback: string; percentage: number} | null>(null)

  // Summarize
  const [sumContent, setSumContent] = useState("")
  const [sumResult, setSumResult] = useState<{summary: string; keyPoints: string[]} | null>(null)

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateQuestions({ content: genContent, count: genCount, type: genType, difficulty: genDifficulty })
      if (result.success && result.data) {
        setGeneratedQuestions(result.data)
        toast.success(`تم توليد ${result.data.length} سؤال`)
      } else toast.error(result.error ?? "خطأ")
    })
  }

  const handleGrade = () => {
    startTransition(async () => {
      const result = await gradeEssay({ question: gradeQuestion, answer: gradeAnswer, maxPoints: gradeMaxPoints })
      if (result.success && result.data) {
        setGradeResult(result.data)
        toast.success("تم التقييم")
      } else toast.error(result.error ?? "خطأ")
    })
  }

  const handleSummarize = () => {
    startTransition(async () => {
      const result = await summarizeContent({ content: sumContent })
      if (result.success && result.data) {
        setSumResult(result.data)
        toast.success("تم التلخيص")
      } else toast.error(result.error ?? "خطأ")
    })
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {permissions.canGenerate && (
          <Button variant={activeTab === "generate" ? "default" : "outline"} onClick={() => setActiveTab("generate")}>
            <Sparkles className="h-4 w-4 ml-2" />توليد أسئلة
          </Button>
        )}
        {permissions.canGenerate && (
          <Button variant={activeTab === "grade" ? "default" : "outline"} onClick={() => setActiveTab("grade")}>
            <Award className="h-4 w-4 ml-2" />تقييم إجابة
          </Button>
        )}
        {permissions.canSummarize && (
          <Button variant={activeTab === "summarize" ? "default" : "outline"} onClick={() => setActiveTab("summarize")}>
            <BookOpen className="h-4 w-4 ml-2" />تلخيص محتوى
          </Button>
        )}
      </div>

      {/* Generate Questions */}
      {activeTab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />توليد أسئلة من محتوى</CardTitle>
              <CardDescription>أدخل محتوى النص ليقوم الذكاء الاصطناعي بتوليد أسئلة منه</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>محتوى النص</Label><Textarea value={genContent} onChange={(e) => setGenContent(e.target.value)} rows={8} placeholder="ألصق هنا محتوى المقرر أو الدرس..." /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>العدد</Label><Input type="number" value={genCount} onChange={(e) => setGenCount(parseInt(e.target.value) || 5)} min={1} max={20} /></div>
                <div className="space-y-2"><Label>النوع</Label>
                  <Select value={genType} onValueChange={(v) => setGenType(v as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="MULTIPLE_CHOICE">اختيار متعدد</SelectItem><SelectItem value="TRUE_FALSE">صح/خطأ</SelectItem><SelectItem value="SHORT_ANSWER">مقالي</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>الصعوبة</Label>
                  <Select value={genDifficulty} onValueChange={(v) => setGenDifficulty(v as "EASY" | "MEDIUM" | "HARD")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="EASY">سهل</SelectItem><SelectItem value="MEDIUM">متوسط</SelectItem><SelectItem value="HARD">صعب</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={isPending || !genContent} className="w-full">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Sparkles className="h-4 w-4 ml-2" />}توليد الأسئلة
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>الأسئلة المولدة</CardTitle></CardHeader>
            <CardContent>
              {generatedQuestions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">لم يتم توليد أسئلة بعد</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {generatedQuestions.map((q, idx) => (
                    <div key={idx} className="p-3 rounded-lg border text-sm">
                      <p className="font-medium mb-2">{idx + 1}. {q.text}</p>
                      {q.options && q.options.map((opt, oidx) => (
                        <div key={oidx} className={`text-xs p-1 rounded ${opt.isCorrect ? "bg-green-50 text-green-800" : ""}`}>
                          {opt.isCorrect ? "✓" : "○"} {opt.text}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grade Essay */}
      {activeTab === "grade" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />تقييم إجابة مقالية</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>السؤال</Label><Textarea value={gradeQuestion} onChange={(e) => setGradeQuestion(e.target.value)} rows={3} /></div>
              <div className="space-y-2"><Label>الإجابة</Label><Textarea value={gradeAnswer} onChange={(e) => setGradeAnswer(e.target.value)} rows={5} /></div>
              <div className="space-y-2"><Label>الدرجة القصوى</Label><Input type="number" value={gradeMaxPoints} onChange={(e) => setGradeMaxPoints(parseInt(e.target.value) || 10)} /></div>
              <Button onClick={handleGrade} disabled={isPending || !gradeQuestion || !gradeAnswer} className="w-full">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Award className="h-4 w-4 ml-2" />}تقييم
              </Button>
            </CardContent>
          </Card>
          {gradeResult && (
            <Card>
              <CardHeader><CardTitle>نتيجة التقييم</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-muted rounded-lg">
                  <p className="text-4xl font-bold">{gradeResult.score}/{gradeMaxPoints}</p>
                  <p className="text-muted-foreground">{gradeResult.percentage}%</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg"><p className="text-sm">{gradeResult.feedback}</p></div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Summarize */}
      {activeTab === "summarize" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />تلخيص محتوى</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>المحتوى</Label><Textarea value={sumContent} onChange={(e) => setSumContent(e.target.value)} rows={10} placeholder="ألصق النص المراد تلخيصه..." /></div>
              <Button onClick={handleSummarize} disabled={isPending || !sumContent} className="w-full">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <BookOpen className="h-4 w-4 ml-2" />}تلخيص
              </Button>
            </CardContent>
          </Card>
          {sumResult && (
            <Card>
              <CardHeader><CardTitle>الملخص</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg"><p className="text-sm">{sumResult.summary}</p></div>
                <div><h4 className="font-medium mb-2">النقاط الرئيسية:</h4>
                  <ul className="space-y-1">{sumResult.keyPoints.map((p, i) => <li key={i} className="text-sm flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />{p}</li>)}</ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
