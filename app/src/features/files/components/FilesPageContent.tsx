"use client"

/**
 * Files Page Content
 * @module features/files/components/FilesPageContent
 */

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  FileUp, Trash2, Download, Search, Loader2, File, FileText, Image, Archive,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { uploadFile, deleteFile, type FileData } from "../actions"

interface FilesPageContentProps {
  initialData: { files: FileData[]; total: number }
  permissions: { canUpload: boolean; canDelete: boolean; canManageAll: boolean }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <Image className="h-5 w-5 text-purple-500" />
  if (mimeType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />
  if (mimeType.includes("zip") || mimeType.includes("rar")) return <Archive className="h-5 w-5 text-yellow-500" />
  return <File className="h-5 w-5 text-blue-500" />
}

export function FilesPageContent({ initialData, permissions }: FilesPageContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append("file", file)
      const result = await uploadFile(formData)
      if (result.success) { toast.success("تم رفع الملف بنجاح"); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDelete = () => {
    if (!deleteId) return
    startTransition(async () => {
      const result = await deleteFile(deleteId)
      if (result.success) { toast.success("تم حذف الملف"); setDeleteId(null); router.refresh() }
      else toast.error(result.error ?? "خطأ")
    })
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><File className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{initialData.total}</p><p className="text-xs text-muted-foreground">ملف</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><FileUp className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{formatFileSize(initialData.files.reduce((s, f) => s + f.size, 0))}</p><p className="text-xs text-muted-foreground">إجمالي الحجم</p></div></div></CardContent></Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <Input placeholder="بحث..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
              <Button variant="outline" onClick={() => router.push(`/files?search=${searchValue}`)}><Search className="h-4 w-4" /></Button>
            </div>
            {permissions.canUpload && (
              <>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.zip" />
                <Button onClick={() => fileInputRef.current?.click()} disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <FileUp className="h-4 w-4 ml-2" />}
                  رفع ملف
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الملف</TableHead>
                  <TableHead className="hidden md:table-cell">النوع</TableHead>
                  <TableHead>الحجم</TableHead>
                  <TableHead className="hidden md:table-cell">رافع الملف</TableHead>
                  <TableHead className="hidden md:table-cell">المقرر</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="w-24">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialData.files.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground"><File className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>لا توجد ملفات</p></TableCell></TableRow>
                ) : initialData.files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell><div className="flex items-center gap-2">{getFileIcon(file.mimeType)}<p className="text-sm truncate max-w-[200px]">{file.originalName}</p></div></TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-xs">{file.mimeType.split("/")[1]}</Badge></TableCell>
                    <TableCell className="text-sm">{formatFileSize(file.size)}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{file.uploader.profile ? `${file.uploader.profile.firstNameAr} ${file.uploader.profile.lastNameAr}` : "-"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{file.offering ? file.offering.course.nameAr : "-"}</TableCell>
                    <TableCell className="text-xs">{new Date(file.createdAt).toLocaleDateString("ar-SA")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {file.url && <Button variant="ghost" size="icon" className="h-8 w-8" asChild><a href={file.url} download><Download className="h-3.5 w-3.5" /></a></Button>}
                        {permissions.canDelete && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(file.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف هذا الملف؟</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
