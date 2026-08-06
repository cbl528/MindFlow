import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Search, Trash2 } from 'lucide-react'
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
import type { KnowledgeBaseVO } from '@/types'

export default function KnowledgeListPage() {
  const navigate = useNavigate()
  const [list, setList] = useState<KnowledgeBaseVO[]>([])
  const [total, setTotal] = useState(0)
  const [pageNo, setPageNo] = useState(1)
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
      const res = await knowledgeBaseService.list({ pageNo, pageSize: 10, name: keyword || undefined })
      setList(res.records)
      setTotal(res.total)
    } catch {
      /* 拦截器已提示 */
    } finally {
      setLoading(false)
    }
  }, [pageNo, keyword])

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
      setPageNo(1)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">知识库管理</h1>
          <p className="text-sm text-muted-foreground">创建与管理知识库，为 RAG 提供检索源</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          新建知识库
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索知识库"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setPageNo(1)}
            className="pl-8"
          />
        </div>
        <Button variant="secondary" onClick={() => setPageNo(1)}>
          搜索
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-background">
        {!loading && list.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="暂无知识库"
            description="点击右上角「新建知识库」开始创建"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>Embedding 模型</TableHead>
                <TableHead>向量集合</TableHead>
                <TableHead>文档数</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((kb) => (
                <TableRow key={kb.id}>
                  <TableCell>
                    <button
                      className="font-medium text-foreground hover:text-primary"
                      onClick={() => navigate(`/admin/knowledge/${kb.id}`)}
                    >
                      {kb.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{kb.embeddingModel || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{kb.collectionName || '—'}</TableCell>
                  <TableCell>{kb.documentCount ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(kb.createTime)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/knowledge/${kb.id}`)}
                      >
                        管理
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRenameTarget(kb)
                          setRenameValue(kb.name)
                        }}
                      >
                        重命名
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(kb)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
