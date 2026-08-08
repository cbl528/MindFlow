import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import {
  knowledgeBaseService,
  knowledgeDocumentService,
} from '@/services/knowledgeService'
import { ingestionService } from '@/services/ingestionService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { formatBytes, cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/time'
import type { KnowledgeBaseVO, KnowledgeDocumentVO, KnowledgeDocumentChunkLogVO } from '@/types'

export default function KnowledgeDocumentsPage() {
  const { kbId } = useParams<{ kbId: string }>()
  const [kb, setKb] = useState<KnowledgeBaseVO | null>(null)
  const [list, setList] = useState<KnowledgeDocumentVO[]>([])
  const [total, setTotal] = useState(0)
  const [pageNo, setPageNo] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  // 上传
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    sourceType: 'file' as 'file' | 'url',
    sourceLocation: '',
    processMode: 'chunk' as 'chunk' | 'pipeline',
    pipelineId: '',
    scheduleEnabled: false,
    scheduleCron: '',
  })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [pipelines, setPipelines] = useState<Array<{ id: string; name: string }>>([])

  // 分块日志
  const [logsDoc, setLogsDoc] = useState<KnowledgeDocumentVO | null>(null)
  const [logs, setLogs] = useState<KnowledgeDocumentChunkLogVO[]>([])

  const [deleteTarget, setDeleteTarget] = useState<KnowledgeDocumentVO | null>(null)
  const [batchDelete, setBatchDelete] = useState(false)

  const load = useCallback(async () => {
    if (!kbId) return
    setLoading(true)
    try {
      const res = await knowledgeDocumentService.list(kbId, {
        pageNo,
        pageSize: 10,
        status: statusFilter || undefined,
        keyword: keyword || undefined,
      })
      setList(res.records)
      setTotal(res.total)
    } catch {
      /* 已提示 */
    } finally {
      setLoading(false)
    }
  }, [kbId, pageNo, statusFilter, keyword])

  useEffect(() => {
    if (kbId) knowledgeBaseService.get(kbId).then(setKb).catch(() => undefined)
  }, [kbId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (uploadForm.processMode === 'pipeline') {
      ingestionService
        .pipelines({ pageNo: 1, pageSize: 50 })
        .then((res) => setPipelines(res.records))
        .catch(() => undefined)
    }
  }, [uploadForm.processMode])

  async function handleUpload() {
    if (uploadForm.sourceType === 'file' && !uploadFile) {
      toast.error('请选择要上传的文件')
      return
    }
    if (uploadForm.sourceType === 'url' && !uploadForm.sourceLocation.trim()) {
      toast.error('请输入远程地址')
      return
    }
    setUploading(true)
    try {
      await knowledgeDocumentService.upload(kbId!, uploadFile, {
        sourceType: uploadForm.sourceType,
        sourceLocation:
          uploadForm.sourceType === 'url' ? uploadForm.sourceLocation.trim() : undefined,
        processMode: uploadForm.processMode,
        pipelineId: uploadForm.processMode === 'pipeline' ? uploadForm.pipelineId : undefined,
        scheduleEnabled: uploadForm.scheduleEnabled,
        scheduleCron: uploadForm.scheduleEnabled ? uploadForm.scheduleCron : undefined,
      })
      toast.success('文档已上传')
      setUploadOpen(false)
      setUploadFile(null)
      setUploadForm({
        sourceType: 'file',
        sourceLocation: '',
        processMode: 'chunk',
        pipelineId: '',
        scheduleEnabled: false,
        scheduleCron: '',
      })
      load()
    } catch {
      /* 已提示 */
    } finally {
      setUploading(false)
    }
  }

  async function handleChunk(doc: KnowledgeDocumentVO) {
    try {
      await knowledgeDocumentService.chunk(doc.id)
      toast.success(`已触发「${doc.docName}」分块`)
      load()
    } catch {
      /* 已提示 */
    }
  }

  async function handleToggle(doc: KnowledgeDocumentVO, value: boolean) {
    try {
      await knowledgeDocumentService.setEnabled(doc.id, value)
      load()
    } catch {
      /* 已提示 */
    }
  }

  async function handleDeleteOne() {
    if (!deleteTarget) return
    try {
      await knowledgeDocumentService.remove(deleteTarget.id)
      toast.success('已删除')
      setDeleteTarget(null)
      load()
    } catch {
      /* 已提示 */
    }
  }

  async function handleBatchDelete() {
    if (selected.length === 0) return
    setBatchDelete(false)
    try {
      await Promise.all(selected.map((id) => knowledgeDocumentService.remove(id)))
      toast.success(`已删除 ${selected.length} 个文档`)
      setSelected([])
      load()
    } catch {
      /* 已提示 */
    }
  }

  async function loadLogs(doc: KnowledgeDocumentVO) {
    setLogsDoc(doc)
    setLogs([])
    try {
      const res = await knowledgeDocumentService.chunkLogs(doc.id, { pageNo: 1, pageSize: 10 })
      setLogs(res.records)
    } catch {
      /* 已提示 */
    }
  }

  const toggleAll = () => {
    if (selected.length === list.length) setSelected([])
    else setSelected(list.map((d) => d.id))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/admin/knowledge" className="text-muted-foreground hover:text-primary">
            知识库
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-semibold tracking-tight">{kb?.name ?? '文档管理'}</h1>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload />
          上传文档
        </Button>
      </div>

      {/* 筛选 */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="搜索文档名"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setPageNo(1)}
          className="w-60"
        />
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
        {selected.length > 0 && (
          <Button variant="outline" size="sm" className="text-destructive" onClick={() => setBatchDelete(true)}>
            <Trash2 />
            删除所选 ({selected.length})
          </Button>
        )}
      </div>

      {/* 列表 */}
      <div className="rounded-xl border border-border bg-background">
        {!loading && list.length === 0 ? (
          <EmptyState icon={FileText} title="暂无文档" description="点击「上传文档」添加内容" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox checked={selected.length > 0 && selected.length === list.length} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="w-12">序号</TableHead>
                <TableHead>文档名</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>分块模式</TableHead>
                <TableHead>文件类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>分块</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>上传时间</TableHead>
                <TableHead>启用</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((doc, index) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(doc.id)}
                      onCheckedChange={(v) =>
                        setSelected((prev) =>
                          v ? [...prev, doc.id] : prev.filter((x) => x !== doc.id),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                    {(pageNo - 1) * 10 + index + 1}
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <button
                      className="flex items-center gap-1.5 font-medium hover:text-primary"
                      onClick={() => window.open(`/preview/doc/${doc.id}`, '_blank')}
                    >
                      <span className="truncate">{doc.docName}</span>
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {doc.sourceType === 'url' ? '远程链接' : '本地文件'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {doc.processMode === 'pipeline' ? '摄入流水线' : '直接分块'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {doc.fileType || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell>{doc.chunkCount ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">{formatBytes(doc.fileSize ?? 0)}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDateTime(doc.createTime)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={doc.enabled}
                      onCheckedChange={(v) => handleToggle(doc, v)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => loadLogs(doc)}>
                        日志
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleChunk(doc)}>
                        分块
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/knowledge/${kbId}/docs/${doc.id}`}>管理</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(doc)}
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

      {/* 上传弹窗 */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>上传文档</DialogTitle>
            <DialogDescription>支持本地文件或远程链接，可选处理模式</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 来源类型 */}
            <div className="flex gap-2">
              {(['file', 'url'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setUploadForm((f) => ({ ...f, sourceType: t }))}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm transition-colors',
                    uploadForm.sourceType === t
                      ? 'border-primary bg-accent font-medium text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  {t === 'file' ? '本地文件' : '远程 URL'}
                </button>
              ))}
            </div>

            {uploadForm.sourceType === 'file' ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) setUploadFile(file)
                }}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors',
                  dragOver ? 'border-primary bg-accent/60' : 'border-border hover:border-primary/40',
                )}
                onClick={() => document.getElementById('doc-file-input')?.click()}
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {uploadFile ? (
                    <span className="text-foreground">{uploadFile.name}</span>
                  ) : (
                    '点击或拖拽文件到此处'
                  )}
                </p>
                <input
                  id="doc-file-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </div>
            ) : (
              <Input
                placeholder="https://example.com/article.html"
                value={uploadForm.sourceLocation}
                onChange={(e) => setUploadForm((f) => ({ ...f, sourceLocation: e.target.value }))}
              />
            )}

            {/* 处理模式 */}
            <div className="flex gap-2">
              {(['chunk', 'pipeline'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setUploadForm((f) => ({ ...f, processMode: m }))}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm transition-colors',
                    uploadForm.processMode === m
                      ? 'border-primary bg-accent font-medium text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  {m === 'chunk' ? '直接分块' : '摄入流水线'}
                </button>
              ))}
            </div>

            {uploadForm.processMode === 'pipeline' && (
              <div className="space-y-1.5">
                <Label>选择流水线</Label>
                <Select
                  value={uploadForm.pipelineId}
                  onValueChange={(v) => setUploadForm((f) => ({ ...f, pipelineId: v }))}
                >
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
            )}

            {/* 定时 */}
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm">定时调度</p>
                <p className="text-xs text-muted-foreground">按 Cron 周期重新拉取/分块</p>
              </div>
              <Switch
                checked={uploadForm.scheduleEnabled}
                onCheckedChange={(v) => setUploadForm((f) => ({ ...f, scheduleEnabled: v }))}
              />
            </div>
            {uploadForm.scheduleEnabled && (
              <Input
                placeholder="Cron 表达式，如 0 0 2 * * ?"
                value={uploadForm.scheduleCron}
                onChange={(e) => setUploadForm((f) => ({ ...f, scheduleCron: e.target.value }))}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              上传
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分块日志 */}
      <Dialog open={!!logsDoc} onOpenChange={(v) => !v && setLogsDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>分块日志 · {logsDoc?.docName}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[420px] overflow-y-auto">
            {logs.length === 0 ? (
              <EmptyState title="暂无日志" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>状态</TableHead>
                    <TableHead>模式</TableHead>
                    <TableHead>分块数</TableHead>
                    <TableHead>耗时</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <StatusBadge status={l.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {l.processMode}
                        {l.chunkStrategy ? ` · ${l.chunkStrategy}` : ''}
                      </TableCell>
                      <TableCell>{l.chunkCount ?? 0}</TableCell>
                      <TableCell>{l.totalDuration != null ? `${(l.totalDuration / 1000).toFixed(1)}s` : '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(l.createTime)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除文档</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除「{deleteTarget?.docName}」及其所有分块吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOne}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除确认 */}
      <AlertDialog open={batchDelete} onOpenChange={setBatchDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>批量删除</AlertDialogTitle>
            <AlertDialogDescription>确定删除所选 {selected.length} 个文档及其分块吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
