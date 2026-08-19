import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { knowledgeBaseService } from '@/services/knowledgeService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDateTime } from '@/lib/time'
import type { KnowledgeBaseVO } from '@/types'

/** 卡片右上角「⋯」点击菜单（编辑 / 删除） */
function CardActions({
  kb,
  onEdit,
  onDelete,
}: {
  kb: KnowledgeBaseVO
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={`${kb.name} 操作`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-70 transition-all hover:bg-muted hover:opacity-100 active:scale-95"
        >
          <MoreHorizontal className="h-[18px] w-[18px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <DropdownMenuItem onSelect={onEdit} onClick={(e) => e.stopPropagation()}>
          <Pencil />
          编辑
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={onDelete}
          onClick={(e) => e.stopPropagation()}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <Trash2 />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function KnowledgeListPage() {
  const navigate = useNavigate()
  const [list, setList] = useState<KnowledgeBaseVO[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', remark: '', embeddingModel: 'bge-m3', collectionName: '' })
  const [creating, setCreating] = useState(false)

  const [editTarget, setEditTarget] = useState<KnowledgeBaseVO | null>(null)
  const [editForm, setEditForm] = useState({ name: '', remark: '' })
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBaseVO | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await knowledgeBaseService.list(keyword || undefined)
      setList(res)
    } catch {
      /* 拦截器已提示 */
    } finally {
      setLoading(false)
    }
  }, [keyword])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate() {
    if (!createForm.name.trim()) {
      toast.error('请输入知识库名称')
      return
    }
    if (!createForm.embeddingModel) {
      toast.error('请选择 Embedding 模型')
      return
    }
    setCreating(true)
    try {
      const id = await knowledgeBaseService.create({
        name: createForm.name.trim(),
        remark: createForm.remark.trim() || undefined,
        embeddingModel: createForm.embeddingModel,
        collectionName: createForm.collectionName || undefined,
      })
      toast.success('知识库创建成功')
      setCreateOpen(false)
      setCreateForm({ name: '', remark: '', embeddingModel: 'bge-m3', collectionName: '' })
      load()
      navigate(`/admin/knowledge/${id}`)
    } catch {
      /* 已提示 */
    } finally {
      setCreating(false)
    }
  }

  async function handleEdit() {
    if (!editTarget || !editForm.name.trim()) return
    try {
      await knowledgeBaseService.update(editTarget.id, {
        name: editForm.name.trim(),
        remark: editForm.remark.trim(),
      })
      toast.success('已保存')
      setEditTarget(null)
      load()
    } catch {
      /* 已提示 */
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await knowledgeBaseService.remove(deleteTarget.id)
      toast.success('已删除')
      setDeleteTarget(null)
      load()
    } catch {
      /* 已提示 */
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">知识库管理</h1>
          <p className="text-base text-muted-foreground">创建与管理知识库，为 RAG 提供检索源</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索知识库"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              className="pl-8"
            />
          </div>
          <Button variant="secondary" onClick={load}>
            搜索
          </Button>
          <Button variant="secondary" onClick={load} title="刷新列表">
            <RefreshCw />
            刷新
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            新增知识库
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-background p-5">
              <div className="flex items-start justify-between">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* 新增卡片 */}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="group flex min-h-[190px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-background text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/40 hover:text-primary hover:shadow-md active:translate-y-0 active:scale-[0.98]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10">
              <Plus className="h-6 w-6" />
            </span>
            <span className="text-base font-medium">新增知识库</span>
          </button>

          {/* 知识库卡片 */}
          {list.map((kb) => (
            <div
              key={kb.id}
              onClick={() => navigate(`/admin/knowledge/${kb.id}`)}
              className="group flex min-h-[190px] cursor-pointer flex-col rounded-2xl border border-border bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40 hover:shadow-md active:translate-y-0 active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 text-base font-semibold text-foreground">{kb.name}</h3>
                <CardActions
                  kb={kb}
                  onEdit={() => {
                    setEditTarget(kb)
                    setEditForm({ name: kb.name, remark: kb.remark ?? '' })
                  }}
                  onDelete={() => setDeleteTarget(kb)}
                />
              </div>
              <p className="mt-1.5 line-clamp-2 text-base text-muted-foreground">
                {kb.remark || '暂无备注'}
              </p>
              <div className="mt-auto space-y-1.5 pt-4 text-sm text-muted-foreground">
                <div className="line-clamp-1" title={kb.embeddingModel}>
                  {kb.embeddingModel || '—'}
                </div>
                <div>{formatDateTime(kb.createTime)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && list.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="暂无知识库"
          description="点击上方「新增知识库」卡片开始创建"
        />
      )}

      {/* 新建知识库 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建知识库</DialogTitle>
            <DialogDescription>填写基本信息，稍后可上传文档</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>名称 *</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例如：产品手册"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>备注</Label>
              <Input
                value={createForm.remark}
                onChange={(e) => setCreateForm((f) => ({ ...f, remark: e.target.value }))}
                placeholder="选填，例如：面向全体员工的规章制度"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Embedding 模型 *</Label>
              <Select
                value={createForm.embeddingModel}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, embeddingModel: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择 Embedding 模型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bge-m3">bge-m3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>向量集合名</Label>
              <Input
                value={createForm.collectionName}
                onChange={(e) => setCreateForm((f) => ({ ...f, collectionName: e.target.value }))}
                placeholder="留空自动生成"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? '创建中…' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑知识库 */}
      <Dialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑知识库</DialogTitle>
            <DialogDescription>修改知识库名称与备注</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>名称 *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例如：产品手册"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>备注</Label>
              <Textarea
                value={editForm.remark}
                onChange={(e) => setEditForm((f) => ({ ...f, remark: e.target.value.slice(0, 50) }))}
                placeholder="选填，例如：面向全体员工的规章制度"
                rows={3}
                maxLength={50}
              />
              <p className="text-right text-xs text-muted-foreground">{editForm.remark.length}/50</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              取消
            </Button>
            <Button onClick={handleEdit} disabled={!editForm.name.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除知识库</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除「{deleteTarget?.name}」吗？其下所有文档与分块将一并删除，且不可恢复。
            </AlertDialogDescription>
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
