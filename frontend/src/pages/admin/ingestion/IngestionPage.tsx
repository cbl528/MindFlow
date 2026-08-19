import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { ingestionService } from '@/services/ingestionService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDateTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import type { IngestionPipelineNodeVO, IngestionPipelineVO, IngestionTaskNodeVO, IngestionTaskVO } from '@/types'

const NODE_TYPES = ['fetcher', 'parser', 'chunker', 'enhancer', 'enricher', 'indexer']
const NODE_LABEL: Record<string, string> = {
  fetcher: '抓取',
  parser: '解析',
  chunker: '分块',
  enhancer: '增强',
  enricher: '富化',
  indexer: '索引',
}

export default function IngestionPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">数据通道</h1>
        <p className="text-sm text-muted-foreground">配置摄入流水线并管理采集任务</p>
      </div>
      <Tabs defaultValue="pipelines">
        <TabsList>
          <TabsTrigger value="pipelines">流水线管理</TabsTrigger>
          <TabsTrigger value="tasks">流水线任务</TabsTrigger>
        </TabsList>
        <TabsContent value="pipelines">
          <PipelinesTab />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ---------------- 流水线管理 ---------------- */

function PipelinesTab() {
  const [list, setList] = useState<IngestionPipelineVO[]>([])
  const [total, setTotal] = useState(0)
  const [pageNo, setPageNo] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{ name: string; description: string; nodes: IngestionPipelineNodeVO[] }>({
    name: '',
    description: '',
    nodes: [],
  })
  const [deleteTarget, setDeleteTarget] = useState<IngestionPipelineVO | null>(null)
  const [viewTarget, setViewTarget] = useState<IngestionPipelineVO | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ingestionService.pipelines({ pageNo, pageSize: 10, keyword: keyword || undefined })
      setList(res.records)
      setTotal(res.total)
    } catch {
      /* 已提示 */
    } finally {
      setLoading(false)
    }
  }, [pageNo, keyword])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditId(null)
    setForm({ name: '', description: '', nodes: [] })
    setFormOpen(true)
  }

  function openEdit(p: IngestionPipelineVO) {
    setEditId(p.id)
    setForm({ name: p.name, description: p.description ?? '', nodes: p.nodes ?? [] })
    setFormOpen(true)
  }

  function addNode() {
    setForm((f) => ({
      ...f,
      nodes: [...f.nodes, { nodeId: `node-${f.nodes.length + 1}`, nodeType: 'parser' }],
    }))
  }

  function updateNode(i: number, patch: Partial<IngestionPipelineNodeVO>) {
    setForm((f) => ({
      ...f,
      nodes: f.nodes.map((n, idx) => (idx === i ? { ...n, ...patch } : n)),
    }))
  }

  function removeNode(i: number) {
    setForm((f) => ({ ...f, nodes: f.nodes.filter((_, idx) => idx !== i) }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('请输入流水线名称')
      return
    }
    if (form.nodes.length === 0) {
      toast.error('至少需要一个节点')
      return
    }
    setSaving(true)
    try {
      if (editId) await ingestionService.updatePipeline(editId, form)
      else await ingestionService.createPipeline(form)
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
      await ingestionService.removePipeline(deleteTarget.id)
      toast.success('已删除')
      setDeleteTarget(null)
      load()
    } catch {
      /* 已提示 */
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="搜索流水线"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setPageNo(1)}
          className="w-64"
        />
        <Button onClick={openCreate}>
          <Plus />
          新建流水线
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-background shadow-sm">
        {!loading && list.length === 0 ? (
          <EmptyState title="暂无流水线" description="点击「新建流水线」配置摄入流程" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>节点数</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="max-w-[260px] truncate text-muted-foreground">
                    {p.description || '—'}
                  </TableCell>
                  <TableCell>{p.nodes?.length ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(p.createTime)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setViewTarget(p)}>
                        节点
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(p)}
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

      {/* 新建/编辑 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? '编辑流水线' : '新建流水线'}</DialogTitle>
            <DialogDescription>节点按顺序执行：抓取 → 解析 → 分块 → 增强 → 富化 → 索引</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>名称 *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>描述</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>节点</Label>
                <Button size="sm" variant="outline" onClick={addNode}>
                  <Plus className="h-3.5 w-3.5" />
                  添加节点
                </Button>
              </div>
              <div className="space-y-2">
                {form.nodes.map((node, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl border border-border p-2.5">
                    <span className="text-sm text-muted-foreground">#{i + 1}</span>
                    <Select value={node.nodeType} onValueChange={(v) => updateNode(i, { nodeType: v })}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NODE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {NODE_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={node.nodeId ?? ''}
                      onChange={(e) => updateNode(i, { nodeId: e.target.value })}
                      placeholder="节点 ID"
                      className="w-36"
                    />
                    <Input
                      value={node.nextNodeId ?? ''}
                      onChange={(e) => updateNode(i, { nextNodeId: e.target.value || undefined })}
                      placeholder="下一节点"
                      className="w-32"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeNode(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {form.nodes.length === 0 && (
                  <p className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">
                    尚未添加节点
                  </p>
                )}
              </div>
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

      {/* 查看节点 */}
      <Dialog open={!!viewTarget} onOpenChange={(v) => !v && setViewTarget(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{viewTarget?.name} · 节点列表</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {viewTarget?.nodes?.map((n, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-border p-3.5 text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {i + 1}
                </span>
                <span className="font-medium">{NODE_LABEL[n.nodeType] ?? n.nodeType}</span>
                <span className="text-sm text-muted-foreground">({n.nodeId})</span>
                <span className="ml-auto text-sm text-muted-foreground">
                  → {n.nextNodeId || '结束'}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除流水线</AlertDialogTitle>
            <AlertDialogDescription>确定删除「{deleteTarget?.name}」吗？</AlertDialogDescription>
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

/* ---------------- 流水线任务 ---------------- */

function TasksTab() {
  const [list, setList] = useState<IngestionTaskVO[]>([])
  const [total, setTotal] = useState(0)
  const [pageNo, setPageNo] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pipelineId, setPipelineId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [pipelines, setPipelines] = useState<Array<{ id: string; name: string }>>([])

  const [detailTask, setDetailTask] = useState<IngestionTaskVO | null>(null)
  const [detailNodes, setDetailNodes] = useState<IngestionTaskNodeVO[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ingestionService.tasks({ pageNo, pageSize: 10, status: statusFilter || undefined })
      setList(res.records)
      setTotal(res.total)
    } catch {
      /* 已提示 */
    } finally {
      setLoading(false)
    }
  }, [pageNo, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    ingestionService
      .pipelines({ pageNo: 1, pageSize: 50 })
      .then((res) => setPipelines(res.records))
      .catch(() => undefined)
  }, [])

  async function handleUpload() {
    if (!pipelineId) {
      toast.error('请选择流水线')
      return
    }
    if (!file) {
      toast.error('请选择文件')
      return
    }
    setUploading(true)
    try {
      const res = await ingestionService.upload(pipelineId, file)
      toast.success(`任务已提交（${res.status}）`)
      setUploadOpen(false)
      setFile(null)
      load()
    } catch {
      /* 已提示 */
    } finally {
      setUploading(false)
    }
  }

  async function openDetail(task: IngestionTaskVO) {
    setDetailTask(task)
    setDetailNodes([])
    try {
      setDetailNodes(await ingestionService.taskNodes(task.id))
    } catch {
      /* 已提示 */
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPageNo(1) }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部状态</SelectItem>
            <SelectItem value="pending">待处理</SelectItem>
            <SelectItem value="running">进行中</SelectItem>
            <SelectItem value="success">成功</SelectItem>
            <SelectItem value="failed">失败</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload />
          上传执行
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-background shadow-sm">
        {!loading && list.length === 0 ? (
          <EmptyState title="暂无任务" description="选择流水线上传文件创建任务" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>文件名</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>分块数</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="max-w-[220px] truncate font-medium">
                    {task.sourceFileName || task.sourceLocation || task.id}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {task.sourceType === 'url' ? '远程链接' : task.sourceType === 'feishu' ? '飞书' : '本地文件'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={task.status} />
                  </TableCell>
                  <TableCell>{task.chunkCount ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(task.createTime)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(task)}>
                      详情
                    </Button>
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

      {/* 上传 */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建采集任务</DialogTitle>
            <DialogDescription>选择流水线并上传文件，立即执行</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>流水线 *</Label>
              <Select value={pipelineId} onValueChange={setPipelineId}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择流水线" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files?.[0]
                if (f) setFile(f)
              }}
              onClick={() => document.getElementById('task-file-input')?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-border p-8 text-center transition-all hover:border-primary/40 active:scale-[0.99]"
            >
              {file ? (
                <p className="text-sm text-foreground">{file.name}</p>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">点击或拖拽文件到此处</p>
                </>
              )}
              <input
                id="task-file-input"
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? '提交中…' : '执行'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 任务详情 */}
      <Dialog open={!!detailTask} onOpenChange={(v) => !v && setDetailTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>任务详情</DialogTitle>
          </DialogHeader>
          {detailTask && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <StatusBadge status={detailTask.status} />
                <span className="text-muted-foreground">
                  {detailTask.sourceFileName || detailTask.id}
                </span>
                {detailTask.errorMessage && (
                  <span className="text-destructive">{detailTask.errorMessage}</span>
                )}
              </div>
              <div className="space-y-2">
                {detailNodes.length === 0 && <p className="text-xs text-muted-foreground">暂无节点执行记录</p>}
                {detailNodes.map((n) => (
                  <div key={n.id} className="flex items-center gap-3 rounded-xl border border-border p-3.5 text-base">
                    <span className={cn('h-2 w-2 rounded-full', n.status === 'success' ? 'bg-emerald-500' : n.status === 'failed' ? 'bg-destructive' : 'bg-amber-500')} />
                    <span className="font-medium">{NODE_LABEL[n.nodeType] ?? n.nodeType}</span>
                    <span className="text-xs text-muted-foreground">
                      {n.durationMs != null ? `${(n.durationMs / 1000).toFixed(2)}s` : ''}
                    </span>
                    {n.errorMessage && <span className="ml-auto text-xs text-destructive">{n.errorMessage}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
