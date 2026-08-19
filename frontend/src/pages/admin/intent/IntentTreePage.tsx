import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, GitBranch, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { intentService } from '@/services/intentService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import type { IntentNodeTreeVO } from '@/types'

interface NodeForm {
  name: string
  intentCode: string
  kind: number
  level: number
  parentCode?: string
  description: string
  examples: string
  topK: number
  enabled: boolean
  promptSnippet: string
  promptTemplate: string
}

const KIND_LABEL = ['知识库', '系统', 'MCP']
const KIND_COLOR = ['default', 'success', 'warning'] as const

function emptyForm(): NodeForm {
  return {
    name: '',
    intentCode: '',
    kind: 0,
    level: 0,
    parentCode: '',
    description: '',
    examples: '',
    topK: 8,
    enabled: true,
    promptSnippet: '',
    promptTemplate: '',
  }
}

/**
 * examples 兼容两种形态：后端可能返回 string[]，也可能返回 JSON 数组字符串
 */
function examplesToList(examples?: string[] | string): string[] {
  if (Array.isArray(examples)) return examples
  if (typeof examples === 'string') {
    try {
      const parsed = JSON.parse(examples)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function formFromNode(node: IntentNodeTreeVO): NodeForm {
  return {
    name: node.name,
    intentCode: node.intentCode ?? '',
    kind: node.kind ?? 0,
    level: node.level ?? 0,
    parentCode: node.parentCode ?? undefined,
    description: node.description ?? '',
    examples: examplesToList(node.examples).join('\n'),
    topK: node.topK ?? 8,
    enabled: node.enabled ?? true,
    promptSnippet: node.promptSnippet ?? '',
    promptTemplate: node.promptTemplate ?? '',
  }
}

function findNode(nodes: IntentNodeTreeVO[], id: string): IntentNodeTreeVO | null {
  for (const n of nodes) {
    if (n.id === id) return n
    const found = findNode(n.children ?? [], id)
    if (found) return found
  }
  return null
}

export default function IntentTreePage() {
  const [tree, setTree] = useState<IntentNodeTreeVO[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // 选中节点 + 编辑弹窗
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<NodeForm>(emptyForm())
  const [saving, setSaving] = useState(false)

  // 新建（根节点 / 子节点）
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<NodeForm>(emptyForm())
  const [creating, setCreating] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<IntentNodeTreeVO | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setTree(await intentService.trees())
    } catch {
      /* 已提示 */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const selectedNode = selectedId ? findNode(tree, selectedId) : null

  function selectNode(node: IntentNodeTreeVO) {
    setSelectedId(node.id)
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ---------- 编辑弹窗 ----------

  function openEdit() {
    if (!selectedNode) return
    setEditForm(formFromNode(selectedNode))
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    if (!selectedId) return
    if (!editForm.name.trim()) {
      toast.error('请输入节点名称')
      return
    }
    setSaving(true)
    try {
      await intentService.update(selectedId, {
        name: editForm.name.trim(),
        intentCode: editForm.intentCode.trim() || undefined,
        kind: editForm.kind,
        level: editForm.level,
        parentCode: editForm.parentCode || undefined,
        description: editForm.description || undefined,
        examples: editForm.examples
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        topK: editForm.topK,
        enabled: editForm.enabled,
        promptSnippet: editForm.promptSnippet || undefined,
        promptTemplate: editForm.promptTemplate || undefined,
      })
      toast.success('节点已更新')
      setEditOpen(false)
      load()
    } catch {
      /* 已提示 */
    } finally {
      setSaving(false)
    }
  }

  // ---------- 新建节点 ----------

  function openCreateChild() {
    if (!selectedNode) return
    setCreateForm({
      ...emptyForm(),
      parentCode: selectedNode.intentCode ?? selectedNode.id,
      level: (selectedNode.level ?? 0) + 1,
    })
    setCreateOpen(true)
  }

  function openCreateRoot() {
    setCreateForm(emptyForm())
    setCreateOpen(true)
  }

  async function handleCreate() {
    if (!createForm.name.trim()) {
      toast.error('请输入节点名称')
      return
    }
    setCreating(true)
    try {
      await intentService.create({
        name: createForm.name.trim(),
        intentCode: createForm.intentCode.trim() || undefined,
        kind: createForm.kind,
        level: createForm.level,
        parentCode: createForm.parentCode || undefined,
        description: createForm.description || undefined,
        examples: createForm.examples
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        topK: createForm.topK,
        enabled: createForm.enabled,
      })
      toast.success('节点已创建')
      setCreateOpen(false)
      load()
    } catch {
      /* 已提示 */
    } finally {
      setCreating(false)
    }
  }

  // ---------- 删除 ----------

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await intentService.remove(deleteTarget.id)
      toast.success('已删除')
      setDeleteTarget(null)
      if (selectedId === deleteTarget.id) {
        setSelectedId(null)
      }
      load()
    } catch {
      /* 已提示 */
    }
  }

  // ---------- 左侧只读意图树 ----------

  function renderNode(node: IntentNodeTreeVO, depth: number) {
    const hasChildren = !!node.children?.length
    const isCollapsed = collapsed.has(node.id)
    const isSelected = selectedId === node.id
    return (
      <div key={node.id}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => selectNode(node)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectNode(node)}
          className={cn(
            'flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-2 transition-all active:scale-[0.99]',
            isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
          )}
          style={{ paddingLeft: `${depth * 20 + 10}px` }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleCollapse(node.id)
            }}
            className={cn('rounded p-0.5 text-muted-foreground hover:bg-muted/70', !hasChildren && 'invisible')}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <span className={cn('flex-1 truncate text-base', !node.enabled && 'text-muted-foreground line-through')}>
            {node.name}
          </span>
          <Badge variant={KIND_COLOR[node.kind ?? 0]}>
            {KIND_LABEL[node.kind ?? 0] ?? '未知'}
          </Badge>
        </div>
        {hasChildren && !isCollapsed && (
          <div className="border-l border-border/60" style={{ marginLeft: `${depth * 20 + 16}px` }}>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const examples = selectedNode ? examplesToList(selectedNode.examples) : []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">意图树配置</h1>
          <p className="text-sm text-muted-foreground">构建多级意图识别树，命中节点引导检索与回答</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            刷新
          </Button>
          <Button onClick={openCreateRoot}>
            <Plus />
            新建根节点
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* 左侧：只读意图树 */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-base font-medium text-muted-foreground">意图树</h2>
              <span className="text-sm text-muted-foreground">点击节点查看详情</span>
            </div>
            {loading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">加载中…</p>
            ) : tree.length === 0 ? (
              <EmptyState icon={GitBranch} title="暂无意图节点" description="点击「新建根节点」开始搭建意图树" />
            ) : (
              <div>{tree.map((node) => renderNode(node, 0))}</div>
            )}
          </div>
        </div>

        {/* 右侧：节点详情（只读）+ 操作 */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            {!selectedNode ? (
              <EmptyState
                icon={GitBranch}
                title="未选择节点"
                description="点击左侧意图树中的节点，查看详情并进行编辑"
              />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{selectedNode.name}</h2>
                    <Badge variant={KIND_COLOR[selectedNode.kind ?? 0]}>
                      {KIND_LABEL[selectedNode.kind ?? 0] ?? '未知'}
                    </Badge>
                    <Badge variant={selectedNode.enabled ? 'success' : 'secondary'}>
                      {selectedNode.enabled ? '已启用' : '已停用'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={openCreateChild}>
                      <Plus className="h-4 w-4" />
                      添加子节点
                    </Button>
                    <Button size="sm" variant="outline" onClick={openEdit}>
                      <Pencil className="h-4 w-4" />
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(selectedNode)}
                    >
                      <Trash2 className="h-4 w-4" />
                      删除
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                    <Detail label="类型" value={KIND_LABEL[selectedNode.kind ?? 0]} />
                    <Detail label="意图编码" value={selectedNode.intentCode} />
                    <Detail label="父节点" value={selectedNode.parentCode} />
                    <Detail label="层级" value={selectedNode.level ?? 0} />
                    <Detail label="TopK 检索条数" value={selectedNode.topK ?? '全局默认'} />
                    <Detail label="状态" value={selectedNode.enabled ? '已启用' : '已停用'} />
                  </div>

                  {selectedNode.collectionNames && selectedNode.collectionNames.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">关联知识库</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedNode.collectionNames.map((name) => (
                          <Badge key={name} variant="outline">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Detail label="描述" value={selectedNode.description} />

                  {examples.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">示例</p>
                      <div className="flex flex-wrap gap-1.5">
                        {examples.map((ex) => (
                          <Badge key={ex} variant="secondary">
                            {ex}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Detail label="提示词片段" value={selectedNode.promptSnippet} code />
                  <Detail label="提示词模板" value={selectedNode.promptTemplate} code />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 编辑节点 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑节点</DialogTitle>
            <DialogDescription>
              {editForm.parentCode ? `父节点：${editForm.parentCode}` : '根节点（level 0）'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>名称 *</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>意图编码</Label>
                <Input
                  value={editForm.intentCode}
                  onChange={(e) => setEditForm((f) => ({ ...f, intentCode: e.target.value }))}
                  placeholder="如 DOMAIN_HELLO"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>类型</Label>
              <div className="flex gap-2">
                {KIND_LABEL.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => setEditForm((f) => ({ ...f, kind: i }))}
                    className={cn(
                      'flex-1 cursor-pointer rounded-xl border px-4 py-2 text-base transition-all active:scale-[0.98]',
                      editForm.kind === i
                        ? 'border-primary bg-accent font-medium text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>描述</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>示例（每行一个，用于意图识别 Few-shot）</Label>
              <Textarea
                value={editForm.examples}
                onChange={(e) => setEditForm((f) => ({ ...f, examples: e.target.value }))}
                rows={3}
                placeholder={'你好\n嗨，在吗'}
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <div className="space-y-1.5">
                <Label>TopK 检索条数</Label>
                <Input
                  type="number"
                  value={editForm.topK}
                  onChange={(e) => setEditForm((f) => ({ ...f, topK: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch
                  checked={editForm.enabled}
                  onCheckedChange={(v) => setEditForm((f) => ({ ...f, enabled: v }))}
                />
                <span className="text-sm">启用</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>提示词片段（promptSnippet）</Label>
              <Textarea
                value={editForm.promptSnippet}
                onChange={(e) => setEditForm((f) => ({ ...f, promptSnippet: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>提示词模板（promptTemplate）</Label>
              <Textarea
                value={editForm.promptTemplate}
                onChange={(e) => setEditForm((f) => ({ ...f, promptTemplate: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditForm(formFromNode(selectedNode!))}>
              重置
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新建节点（根节点 / 子节点） */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建节点</DialogTitle>
            <DialogDescription>
              {createForm.parentCode ? `父节点：${createForm.parentCode}` : '根节点（level 0）'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>名称 *</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>意图编码</Label>
                <Input
                  value={createForm.intentCode}
                  onChange={(e) => setCreateForm((f) => ({ ...f, intentCode: e.target.value }))}
                  placeholder="如 DOMAIN_HELLO"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>类型</Label>
              <div className="flex gap-2">
                {KIND_LABEL.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => setCreateForm((f) => ({ ...f, kind: i }))}
                    className={cn(
                      'flex-1 cursor-pointer rounded-xl border px-4 py-2 text-base transition-all active:scale-[0.98]',
                      createForm.kind === i
                        ? 'border-primary bg-accent font-medium text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>描述</Label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>示例（每行一个，用于意图识别 Few-shot）</Label>
              <Textarea
                value={createForm.examples}
                onChange={(e) => setCreateForm((f) => ({ ...f, examples: e.target.value }))}
                rows={3}
                placeholder={'你好\n嗨，在吗'}
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <div className="space-y-1.5">
                <Label>TopK 检索条数</Label>
                <Input
                  type="number"
                  value={createForm.topK}
                  onChange={(e) => setCreateForm((f) => ({ ...f, topK: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch
                  checked={createForm.enabled}
                  onCheckedChange={(v) => setCreateForm((f) => ({ ...f, enabled: v }))}
                />
                <span className="text-sm">启用</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除意图节点</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除「{deleteTarget?.name}」及其全部子节点吗？
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

function Detail({
  label,
  value,
  code,
}: {
  label: string
  value?: React.ReactNode
  code?: boolean
}) {
  const blank = value === undefined || value === null || value === ''
  if (blank) {
    // 代码块（提示词）留空时整块隐藏
    if (code) return null
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base text-muted-foreground">—</p>
      </div>
    )
  }
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {code ? (
        <pre className="whitespace-pre-wrap rounded-xl bg-muted p-3.5 font-mono text-sm leading-relaxed">
          {value}
        </pre>
      ) : (
        <p className="text-base">{value}</p>
      )}
    </div>
  )
}
