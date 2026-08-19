import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  knowledgeChunkService,
  knowledgeDocumentService,
} from '@/services/knowledgeService'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import type { KnowledgeChunkVO, KnowledgeDocumentVO } from '@/types'

export default function KnowledgeChunksPage() {
  const { kbId, docId } = useParams<{ kbId: string; docId: string }>()
  const [doc, setDoc] = useState<KnowledgeDocumentVO | null>(null)
  const [list, setList] = useState<KnowledgeChunkVO[]>([])
  const [total, setTotal] = useState(0)
  const [pageNo, setPageNo] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const [editTarget, setEditTarget] = useState<KnowledgeChunkVO | null>(null)
  const [editContent, setEditContent] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createContent, setCreateContent] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeChunkVO | null>(null)

  const load = useCallback(async () => {
    if (!docId) return
    setLoading(true)
    try {
      const res = await knowledgeChunkService.list(docId, { pageNo, pageSize: 20 })
      setList(res.records)
      setTotal(res.total)
    } catch {
      /* 已提示 */
    } finally {
      setLoading(false)
    }
  }, [docId, pageNo])

  useEffect(() => {
    if (docId) knowledgeDocumentService.get(docId).then(setDoc).catch(() => undefined)
  }, [docId])

  useEffect(() => {
    load()
  }, [load])

  async function handleToggle(chunk: KnowledgeChunkVO, value: boolean) {
    try {
      await knowledgeChunkService.setEnabled(docId!, chunk.id, value)
      load()
    } catch {
      /* 已提示 */
    }
  }

  async function handleBatchToggle(value: boolean) {
    if (selected.length === 0) return
    try {
      await knowledgeChunkService.batchEnabled(docId!, value, selected)
      toast.success(`已${value ? '启用' : '禁用'} ${selected.length} 个分块`)
      setSelected([])
      load()
    } catch {
      /* 已提示 */
    }
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    try {
      await knowledgeChunkService.update(docId!, editTarget.id, { content: editContent })
      toast.success('已保存')
      setEditTarget(null)
      load()
    } catch {
      /* 已提示 */
    }
  }

  async function handleCreate() {
    if (!createContent.trim()) return
    try {
      await knowledgeChunkService.create(docId!, { content: createContent.trim(), index: total })
      toast.success('已创建分块')
      setCreateOpen(false)
      setCreateContent('')
      load()
    } catch {
      /* 已提示 */
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await knowledgeChunkService.remove(docId!, deleteTarget.id)
      toast.success('已删除')
      setDeleteTarget(null)
      load()
    } catch {
      /* 已提示 */
    }
  }

  const toggleAll = () => {
    if (selected.length === list.length) setSelected([])
    else setSelected(list.map((c) => c.id))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link to={`/admin/knowledge/${kbId}`} className="text-muted-foreground hover:text-primary">
          文档
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-2xl font-semibold tracking-tight">分块管理</h1>
        <span className="text-sm text-muted-foreground">· {doc?.docName}</span>
      </div>

      <div className="flex items-center gap-2">
        {selected.length > 0 && (
          <>
            <Button size="sm" onClick={() => handleBatchToggle(true)}>
              批量启用
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBatchToggle(false)}>
              批量禁用
            </Button>
          </>
        )}
        <Button size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus />
          新增分块
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-background shadow-sm">
        {!loading && list.length === 0 ? (
          <EmptyState title="暂无分块" description="上传文档后自动分块，或手动新增" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox checked={selected.length > 0 && selected.length === list.length} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="w-16">#</TableHead>
                <TableHead>内容</TableHead>
                <TableHead className="w-20">字符</TableHead>
                <TableHead className="w-20">Token</TableHead>
                <TableHead className="w-20">启用</TableHead>
                <TableHead className="w-28 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((chunk) => (
                <TableRow key={chunk.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(chunk.id)}
                      onCheckedChange={(v) =>
                        setSelected((prev) => (v ? [...prev, chunk.id] : prev.filter((x) => x !== chunk.id)))
                      }
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{chunk.chunkIndex}</TableCell>
                  <TableCell className="max-w-[480px]">
                    <p className="line-clamp-3 text-base leading-7">{chunk.content}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{chunk.charCount ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">{chunk.tokenCount ?? 0}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={chunk.enabled}
                      onCheckedChange={(v) => handleToggle(chunk, !!v)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditTarget(chunk)
                          setEditContent(chunk.content)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(chunk)}
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
            <Pagination pageNo={pageNo} pageSize={20} total={total} onChange={setPageNo} />
          </div>
        )}
      </div>

      {/* 编辑 */}
      <Dialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑分块</DialogTitle>
          </DialogHeader>
          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={10} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增分块</DialogTitle>
          </DialogHeader>
          <Textarea value={createContent} onChange={(e) => setCreateContent(e.target.value)} rows={8} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除分块</AlertDialogTitle>
            <AlertDialogDescription>确定删除该分块吗？此操作不可恢复。</AlertDialogDescription>
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
