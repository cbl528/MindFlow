import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Boxes, Clock, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { knowledgeBaseService } from '@/services/knowledgeService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDateTime } from '@/lib/time'
import type { KnowledgeBaseVO } from '@/types'

/** 卡片右上角「⋯」悬浮菜单（重命名 / 删除） */
function CardActions({
  kb,
  onRename,
  onDelete,
}: {
  kb: KnowledgeBaseVO
  onRename: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enter = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }, [])

  const leave = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }, [])

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={enter}
        onMouseLeave={leave}
      >
        <button
          type="button"
          aria-label={`${kb.name} 操作`}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-70 transition-opacity hover:bg-muted hover:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} onMouseEnter={enter} onMouseLeave={leave}>
        <DropdownMenuItem
          onSelect={onRename}
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil />
          重命名
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
  const [createForm, setCreateForm] = useState({ name: '', embeddingModel: '', collectionName: '' })
  const [creating, setCreating] = useState(false)

  const [renameTarget, setRenameTarget] = useState<KnowledgeBaseVO | null>(null)
  const [renameValue, setRenameValue] = useState('')
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
    setCreating(true)
    try {
      const id = await knowledgeBaseService.create({
        name: createForm.name.trim(),
        embeddingModel: createForm.embeddingModel || undefined,
        collectionName: createForm.collectionName || undefined,
      })
      toast.success('知识库创建成功')
      setCreateOpen(false)
      setCreateForm({ name: '', embeddingModel: '', collectionName: '' })
      load()
      navigate(`/admin/knowledge/${id}`)
    } catch {
      /* 已提示 */
    } finally {
      setCreating(false)
    }
  }

  async function handleRename() {
    if (!renameTarget || !renameValue.trim()) return
    try {
      await knowledgeBaseService.update(renameTarget.id, { name: renameValue.trim() })
      toast.success('已重命名')
      setRenameTarget(null)
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
          <h1 className="text-xl font-semibold tracking-tight">知识库管理</h1>
          <p className="text-sm text-muted-foreground">创建与管理知识库，为 RAG 提供检索源</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
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
            <div key={i} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-start justify-between">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-md" />
              </div>
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-4 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* 新增卡片 */}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="group flex min-h-[176px] flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border bg-background text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 hover:text-primary"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium">新增知识库</span>
          </button>

          {/* 知识库卡片 */}
          {list.map((kb) => (
            <div
              key={kb.id}
              onClick={() => navigate(`/admin/knowledge/${kb.id}`)}
              className="group flex min-h-[176px] cursor-pointer flex-col rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </span>
                <CardActions
                  kb={kb}
                  onRename={() => {
                    setRenameTarget(kb)
                    setRenameValue(kb.name)
                  }}
                  onDelete={() => setDeleteTarget(kb)}
                />
              </div>
              <h3 className="mt-3 line-clamp-1 font-medium text-foreground">{kb.name}</h3>
              <div className="mt-auto space-y-1.5 pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1" title={kb.embeddingModel}>
                    {kb.embeddingModel || '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>{formatDateTime(kb.createTime)}</span>
                </div>
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
              <Label>Embedding 模型</Label>
              <Input
                value={createForm.embeddingModel}
                onChange={(e) => setCreateForm((f) => ({ ...f, embeddingModel: e.target.value }))}
                placeholder="留空使用默认模型"
              />
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

      {/* 重命名 */}
      <Dialog open={!!renameTarget} onOpenChange={(v) => !v && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名知识库</DialogTitle>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              取消
            </Button>
            <Button onClick={handleRename}>保存</Button>
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
