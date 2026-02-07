"use server"

/**
 * Quiz Engine Server Actions
 * @module features/quizzes/actions
 */

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requirePermission, requireAuth } from "@/lib/auth/permissions"
import { auth } from "@/lib/auth"

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// ============================================
// TYPES
// ============================================

export interface QuizWithDetails {
  id: string
  title: string
  description: string | null
  status: string
  duration: number
  totalPoints: number
  passingScore: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  showResults: boolean
  allowReview: boolean
  startTime: Date | null
  endTime: Date | null
  createdAt: Date
  offering: {
    id: string
    code: string
    course: { nameAr: string; code: string }
    semester: { nameAr: string }
  }
  creator: { id: string; profile: { firstNameAr: string; lastNameAr: string } | null }
  _count: { questions: number; attempts: number }
}

export interface QuestionWithOptions {
  id: string
  type: string
  difficulty: string
  text: string
  explanation: string | null
  points: number
  order: number
  isAiGenerated: boolean
  options: {
    id: string
    text: string
    isCorrect: boolean
    order: number
  }[]
}

export interface AttemptWithDetails {
  id: string
  status: string
  score: number | null
  percentage: number | null
  startedAt: Date
  submittedAt: Date | null
  student: {
    id: string
    academicId: string
    profile: { firstNameAr: string; lastNameAr: string } | null
  }
}

// ============================================
// SCHEMAS
// ============================================

const createQuizSchema = z.object({
  title: z.string().min(2, "عنوان الاختبار مطلوب"),
  description: z.string().optional(),
  offeringId: z.string().min(1, "يجب تحديد الشعبة"),
  duration: z.number().int().min(5, "المدة يجب أن تكون 5 دقائق على الأقل").max(300),
  passingScore: z.number().min(0).max(100),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  showResults: z.boolean().optional(),
  allowReview: z.boolean().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

const addQuestionSchema = z.object({
  quizId: z.string(),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
  text: z.string().min(3, "نص السؤال مطلوب"),
  explanation: z.string().optional(),
  points: z.number().min(0.5, "يجب أن تكون الدرجة 0.5 على الأقل"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  options: z.array(z.object({
    text: z.string().min(1, "نص الخيار مطلوب"),
    isCorrect: z.boolean(),
  })).optional(),
})

const submitAnswerSchema = z.object({
  attemptId: z.string(),
  questionId: z.string(),
  selectedOptionId: z.string().optional(),
  textAnswer: z.string().optional(),
})

export type CreateQuizInput = z.infer<typeof createQuizSchema>
export type AddQuestionInput = z.infer<typeof addQuestionSchema>
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>

// ============================================
// QUIZ CRUD
// ============================================

export async function getQuizzes(params?: { offeringId?: string; status?: string }): Promise<ActionResult<QuizWithDetails[]>> {
  try {
    await requirePermission("quiz.view")
    const where: Record<string, unknown> = { deletedAt: null }
    if (params?.offeringId) where.offeringId = params.offeringId
    if (params?.status && params.status !== "ALL") where.status = params.status

    const quizzes = await db.quiz.findMany({
      where,
      include: {
        offering: {
          select: { id: true, code: true, course: { select: { nameAr: true, code: true } }, semester: { select: { nameAr: true } } },
        },
        creator: { select: { id: true, profile: { select: { firstNameAr: true, lastNameAr: true } } } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, data: quizzes as QuizWithDetails[] }
  } catch (error) {
    return { success: false, error: "فشل في جلب الاختبارات" }
  }
}

export async function getQuiz(id: string): Promise<ActionResult<QuizWithDetails & { questions: QuestionWithOptions[] }>> {
  try {
    await requirePermission("quiz.view")
    const quiz = await db.quiz.findUnique({
      where: { id, deletedAt: null },
      include: {
        offering: {
          select: { id: true, code: true, course: { select: { nameAr: true, code: true } }, semester: { select: { nameAr: true } } },
        },
        creator: { select: { id: true, profile: { select: { firstNameAr: true, lastNameAr: true } } } },
        questions: {
          include: { options: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        _count: { select: { questions: true, attempts: true } },
      },
    })
    if (!quiz) return { success: false, error: "الاختبار غير موجود" }
    return { success: true, data: quiz as QuizWithDetails & { questions: QuestionWithOptions[] } }
  } catch (error) {
    return { success: false, error: "فشل في جلب الاختبار" }
  }
}

export async function createQuiz(input: CreateQuizInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("quiz.create")
    const session = await auth()
    if (!session?.user) return { success: false, error: "غير مصرح" }
    const validated = createQuizSchema.parse(input)

    const quiz = await db.quiz.create({
      data: {
        title: validated.title,
        description: validated.description ?? null,
        offeringId: validated.offeringId,
        creatorId: session.user.id,
        duration: validated.duration,
        passingScore: validated.passingScore,
        shuffleQuestions: validated.shuffleQuestions ?? false,
        shuffleOptions: validated.shuffleOptions ?? false,
        showResults: validated.showResults ?? true,
        allowReview: validated.allowReview ?? true,
        startTime: validated.startTime ? new Date(validated.startTime) : null,
        endTime: validated.endTime ? new Date(validated.endTime) : null,
      },
    })
    revalidatePath("/quizzes")
    return { success: true, data: { id: quiz.id } }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message }
    return { success: false, error: "فشل في إنشاء الاختبار" }
  }
}

export async function publishQuiz(id: string): Promise<ActionResult> {
  try {
    await requirePermission("quiz.publish")
    const quiz = await db.quiz.findUnique({ where: { id }, include: { _count: { select: { questions: true } } } })
    if (!quiz) return { success: false, error: "الاختبار غير موجود" }
    if (quiz._count.questions === 0) return { success: false, error: "يجب إضافة أسئلة قبل النشر" }

    // Calculate total points
    const questions = await db.question.findMany({ where: { quizId: id }, select: { points: true } })
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

    await db.quiz.update({ where: { id }, data: { status: "PUBLISHED", totalPoints } })
    revalidatePath("/quizzes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في نشر الاختبار" }
  }
}

export async function closeQuiz(id: string): Promise<ActionResult> {
  try {
    await requirePermission("quiz.edit")
    await db.quiz.update({ where: { id }, data: { status: "CLOSED" } })
    revalidatePath("/quizzes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في إغلاق الاختبار" }
  }
}

export async function deleteQuiz(id: string): Promise<ActionResult> {
  try {
    await requirePermission("quiz.delete")
    const quiz = await db.quiz.findUnique({ where: { id }, include: { _count: { select: { attempts: true } } } })
    if (!quiz) return { success: false, error: "الاختبار غير موجود" }
    if (quiz._count.attempts > 0) return { success: false, error: "لا يمكن حذف اختبار لديه محاولات" }
    await db.quiz.update({ where: { id }, data: { deletedAt: new Date() } })
    revalidatePath("/quizzes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في حذف الاختبار" }
  }
}

// ============================================
// QUESTION MANAGEMENT
// ============================================

export async function addQuestion(input: AddQuestionInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("quiz.edit")
    const validated = addQuestionSchema.parse(input)

    const lastQuestion = await db.question.findFirst({
      where: { quizId: validated.quizId },
      orderBy: { order: "desc" },
      select: { order: true },
    })

    const question = await db.question.create({
      data: {
        quizId: validated.quizId,
        type: validated.type,
        text: validated.text,
        explanation: validated.explanation ?? null,
        points: validated.points,
        difficulty: validated.difficulty ?? "MEDIUM",
        order: (lastQuestion?.order ?? 0) + 1,
        options: validated.options ? {
          create: validated.options.map((opt, idx) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: idx + 1,
          })),
        } : undefined,
      },
    })

    // Update total points
    const questions = await db.question.findMany({ where: { quizId: validated.quizId }, select: { points: true } })
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
    await db.quiz.update({ where: { id: validated.quizId }, data: { totalPoints } })

    revalidatePath("/quizzes")
    return { success: true, data: { id: question.id } }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message }
    return { success: false, error: "فشل في إضافة السؤال" }
  }
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  try {
    await requirePermission("quiz.edit")
    const question = await db.question.findUnique({ where: { id }, select: { quizId: true } })
    if (!question) return { success: false, error: "السؤال غير موجود" }

    await db.question.delete({ where: { id } })

    // Update total points
    const questions = await db.question.findMany({ where: { quizId: question.quizId }, select: { points: true } })
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
    await db.quiz.update({ where: { id: question.quizId }, data: { totalPoints } })

    revalidatePath("/quizzes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في حذف السؤال" }
  }
}

// ============================================
// QUIZ TAKING
// ============================================

export async function startQuizAttempt(quizId: string): Promise<ActionResult<{ attemptId: string }>> {
  try {
    await requirePermission("quiz.take")
    const session = await auth()
    if (!session?.user) return { success: false, error: "غير مصرح" }

    const quiz = await db.quiz.findUnique({ where: { id: quizId } })
    if (!quiz) return { success: false, error: "الاختبار غير موجود" }
    if (quiz.status !== "PUBLISHED") return { success: false, error: "الاختبار غير متاح" }

    // Check time window
    const now = new Date()
    if (quiz.startTime && now < quiz.startTime) return { success: false, error: "الاختبار لم يبدأ بعد" }
    if (quiz.endTime && now > quiz.endTime) return { success: false, error: "انتهى وقت الاختبار" }

    // Check existing attempt
    const existing = await db.quizAttempt.findUnique({
      where: { quizId_studentId: { quizId, studentId: session.user.id } },
    })
    if (existing) {
      if (existing.status === "SUBMITTED" || existing.status === "GRADED") {
        return { success: false, error: "لقد قدمت هذا الاختبار مسبقاً" }
      }
      return { success: true, data: { attemptId: existing.id } }
    }

    const attempt = await db.quizAttempt.create({
      data: { quizId, studentId: session.user.id },
    })
    return { success: true, data: { attemptId: attempt.id } }
  } catch (error) {
    return { success: false, error: "فشل في بدء الاختبار" }
  }
}

export async function submitAnswer(input: SubmitAnswerInput): Promise<ActionResult> {
  try {
    await requirePermission("quiz.take")
    const validated = submitAnswerSchema.parse(input)

    const attempt = await db.quizAttempt.findUnique({ where: { id: validated.attemptId } })
    if (!attempt || attempt.status !== "IN_PROGRESS") return { success: false, error: "المحاولة غير متاحة" }

    // Check correctness for auto-grading
    let isCorrect: boolean | null = null
    let pointsEarned: number | null = null

    if (validated.selectedOptionId) {
      const option = await db.option.findUnique({ where: { id: validated.selectedOptionId } })
      const question = await db.question.findUnique({ where: { id: validated.questionId } })
      if (option && question) {
        isCorrect = option.isCorrect
        pointsEarned = option.isCorrect ? question.points : 0
      }
    }

    await db.answer.upsert({
      where: { attemptId_questionId: { attemptId: validated.attemptId, questionId: validated.questionId } },
      update: {
        selectedOptionId: validated.selectedOptionId ?? null,
        textAnswer: validated.textAnswer ?? null,
        isCorrect,
        pointsEarned,
      },
      create: {
        attemptId: validated.attemptId,
        questionId: validated.questionId,
        selectedOptionId: validated.selectedOptionId ?? null,
        textAnswer: validated.textAnswer ?? null,
        isCorrect,
        pointsEarned,
      },
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في حفظ الإجابة" }
  }
}

export async function submitQuizAttempt(attemptId: string): Promise<ActionResult> {
  try {
    await requirePermission("quiz.take")
    const attempt = await db.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { answers: true, quiz: { include: { questions: true } } },
    })
    if (!attempt || attempt.status !== "IN_PROGRESS") return { success: false, error: "المحاولة غير متاحة" }

    // Calculate score
    const totalScore = attempt.answers.reduce((sum, a) => sum + (a.pointsEarned ?? 0), 0)
    const totalPoints = attempt.quiz.totalPoints || 1
    const percentage = (totalScore / totalPoints) * 100

    // Check if there are short answer questions that need manual grading
    const hasShortAnswer = attempt.quiz.questions.some(q => q.type === "SHORT_ANSWER")
    const status = hasShortAnswer ? "SUBMITTED" : "GRADED"

    await db.quizAttempt.update({
      where: { id: attemptId },
      data: { status, score: totalScore, percentage, submittedAt: new Date(), gradedAt: hasShortAnswer ? null : new Date() },
    })

    revalidatePath("/quizzes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في تسليم الاختبار" }
  }
}

// ============================================
// GRADING
// ============================================

export async function gradeEssayAnswer(input: {
  answerId: string
  pointsEarned: number
  feedback?: string
}): Promise<ActionResult> {
  try {
    await requirePermission("quiz.grade")
    const answer = await db.answer.findUnique({
      where: { id: input.answerId },
      include: { question: true },
    })
    if (!answer) return { success: false, error: "الإجابة غير موجودة" }

    await db.answer.update({
      where: { id: input.answerId },
      data: {
        pointsEarned: input.pointsEarned,
        isCorrect: input.pointsEarned > 0,
      },
    })

    // Re-calculate attempt score
    const answers = await db.answer.findMany({ where: { attemptId: answer.attemptId } })
    const allGraded = answers.every(a => a.pointsEarned !== null)
    const totalScore = answers.reduce((sum, a) => sum + (a.pointsEarned ?? 0), 0)

    const attempt = await db.quizAttempt.findUnique({ where: { id: answer.attemptId }, include: { quiz: true } })
    if (attempt) {
      const percentage = (totalScore / (attempt.quiz.totalPoints || 1)) * 100
      await db.quizAttempt.update({
        where: { id: answer.attemptId },
        data: {
          score: totalScore,
          percentage,
          status: allGraded ? "GRADED" : "SUBMITTED",
          gradedAt: allGraded ? new Date() : null,
        },
      })
    }

    revalidatePath("/quizzes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "فشل في التصحيح" }
  }
}

export async function getQuizAttempts(quizId: string): Promise<ActionResult<AttemptWithDetails[]>> {
  try {
    await requirePermission("quiz.grade")
    const attempts = await db.quizAttempt.findMany({
      where: { quizId },
      include: {
        student: { select: { id: true, academicId: true, profile: { select: { firstNameAr: true, lastNameAr: true } } } },
      },
      orderBy: { startedAt: "desc" },
    })
    return { success: true, data: attempts as AttemptWithDetails[] }
  } catch (error) {
    return { success: false, error: "فشل في جلب المحاولات" }
  }
}
