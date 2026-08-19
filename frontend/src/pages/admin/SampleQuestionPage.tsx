import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { sampleQuestionService } from '@/services/sampleQuestionService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDateTime } from '@/lib/time'
import type { SampleQuestionVO } from '@/types'

export default function SampleQuestionPage() {
  const [list, setList] = useState<SampleQuestionVO[]>([])
  const [total, setTotal] = useState(0)
  const [pageNo, setPageNo] = useState(1)
  const [loading, setLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', question: '' })
  const [deleteTarget, setDeleteTarget] = useState<SampleQuestionVO | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await sampleQuestionService.list({ pageNo, pageSize: 10 })
      setList(res.records)
      setTotal(res.total)
    } catch {
      /* 已提示 */
    } finally {
      setLoading(false)
    }
  }, [pageNo])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditId(null)
    setForm({ title: '', description: '', question: '' })
    setFormOpen(true)
  }

  function openEdit(q: SampleQuestionVO) {
    setEditId(q.id)
    setForm({ title: q.title, description: q.description ?? '', question: q.question })
    setFormOpen(true)
  }

  async function handleSave() {
    if (!form.question.trim()) {
      toast.error('请输入问题内容')
      return
    }
    setSaving(true)
    try {
      if (editId) await sampleQuestionService.update(editId, form)
      else await sampleQuestionService.create(form)
      toast.success('已保存')
      setFormOpen(false)
      load()
    } catch {
      /* 已提示 */
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await sampleQuestionService.remove(deleteTarget.id)
      toast.success('已删除')
      setDeleteTarget(null)
      load()
    } catch {
      /* 已提示 */
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">示例问题</h1>
          <p className="text-sm text-muted-foreground">配置欢迎页的推荐问题卡片</p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          新增示例
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-background shadow-sm">
        {!loading && list.length === 0 ? (
          <EmptyState icon={Sparkles} title="暂无示例问题" description="点击「新增示例」添加" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>问题</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.title || '—'}</TableCell>
                  <TableCell className="max-w-[260px] truncate text-muted-foreground">
                    {q.description || '—'}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">{q.question}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(q.createTime)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(q)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {list.length > 0 && (
          <div className="flex justify-end border-t border-border p-3">
            <Pagination pageNo={pageNo} pageSize={10} total={total} onChange={setPageNo} />
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? '编辑示例' : '新增示例'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>标题</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="卡片主标题，如「帮我总结」"
              />
            </div>
            <div className="space-y-1.5">
              <Label>描述</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="卡片副标题"
              />
            </div>
            <div className="space-y-1.5">
              <Label>问题 *</Label>
              <Textarea
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                rows={3}
                placeholder="点击卡片后发送给助手的问题"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除示例</AlertDialogTitle>
            <AlertDialogDescription>确定删除该示例问题吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
