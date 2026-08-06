import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, GitBranch, Pencil, Plus, Trash2 } from 'lucide-react'
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
  }
}

export default function IntentTreePage() {
  const [tree, setTree] = useState<IntentNodeTreeVO[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<NodeForm>(emptyForm())
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
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

  function openCreate(parent?: IntentNodeTreeVO) {
    setEditId(null)
    setForm({
      ...emptyForm(),
      parentCode: parent?.intentCode,
      level: (parent?.level ?? 0) + 1,
    })
    setFormOpen(true)
  }

  function openEdit(node: IntentNodeTreeVO) {
    setEditId(node.id)
    setForm({
      name: node.name,
      intentCode: node.intentCode ?? '',
      kind: node.kind ?? 0,
      level: node.level ?? 0,
      parentCode: node.parentCode ?? undefined,
      description: node.description ?? '',
      examples: (node.examples ?? []).join('\n'),
      topK: node.topK ?? 8,
      enabled: node.enabled ?? true,
    })
    setFormOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('请输入节点名称')
      return
    }
    const payload = {
      name: form.name.trim(),
      intentCode: form.intentCode.trim() || undefined,
      kind: form.kind,
      level: form.level,
      parentCode: form.parentCode || undefined,
      description: form.description || undefined,
      examples: form.examples
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      topK: form.topK,
      enabled: form.enabled,
    }
    setSaving(true)
    try {
      if (editId) {
        await intentService.update(editId, payload)
        toast.success('节点已更新')
      } else {
        await intentService.create(payload)
        toast.success('节点已创建')
      }
      setFormOpen(false)
      load()
    } catch {
      /* 已提示 */
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(node: IntentNodeTreeVO) {
    try {
      await intentService.update(node.id, {
        name: node.name,
        kind: node.kind,
        level: node.level,
        parentCode: node.parentCode ?? undefined,
        topK: node.topK,
        enabled: !node.enabled,
      })
      load()
    } catch {
      /* 已提示 */
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await intentService.remove(deleteTarget.id)
      toast.success('已删除')
      setDeleteTarget(null)
      load()
    } catch {
      /* 已提示 */
    }
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function renderNode(node: IntentNodeTreeVO, depth: number) {
    const hasChildren = !!node.children?.length
    const isCollapsed = collapsed.has(node.id)
    return (
      <div key={node.id}>
        <div
          className="group flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          <button
            onClick={() => toggleCollapse(node.id)}
            className={cn('rounded p-0.5 text-muted-foreground', !hasChildren && 'invisible')}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <span
            className={cn(
              'flex-1 truncate text-sm',
              !node.enabled && 'text-muted-foreground line-through',
            )}
            onClick={() => hasChildren && toggleCollapse(node.id)}
          >
            {node.name}
          </span>
          <Badge variant={KIND_COLOR[node.kind ?? 0]}>
            {KIND_LABEL[node.kind ?? 0] ?? '未知'}
          </Badge>
          <Switch checked={node.enabled} onCheckedChange={() => handleToggle(node)} />
          <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <IconBtn title="添加子节点" onClick={() => openCreate(node)}>
              <Plus className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn title="编辑" onClick={() => openEdit(node)}>
              <Pencil className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn title="删除" danger onClick={() => setDeleteTarget(node)}>
              <Trash2 className="h-3.5 w-3.5" />
            </IconBtn>
          </div>
        </div>
        {hasChildren && !isCollapsed && (
          <div className="border-l border-border/60" style={{ marginLeft: `${depth * 20 + 16}px` }}>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">意图树配置</h1>
          <p className="text-sm text-muted-foreground">构建多级意图识别树，命中节点引导检索与回答</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            刷新
          </Button>
          <Button onClick={() => openCreate()}>
            <Plus />
            新建根节点
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">加载中…</p>
        ) : tree.length === 0 ? (
          <EmptyState icon={GitBranch} title="暂无意图节点" description="点击「新建根节点」开始搭建意图树" />
        ) : (
          <div>{tree.map((node) => renderNode(node, 0))}</div>
        )}
      </div>

      {/* 新建 / 编辑 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? '编辑节点' : '新建节点'}</DialogTitle>
            <DialogDescription>
              {form.parentCode ? `父节点：${form.parentCode}` : '根节点（level 0）'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>名称 *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>意图编码</Label>
                <Input
                  value={form.intentCode}
                  onChange={(e) => setForm((f) => ({ ...f, intentCode: e.target.value }))}
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
                    onClick={() => setForm((f) => ({ ...f, kind: i }))}
                    className={cn(
                      'flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                      form.kind === i
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
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>示例（每行一个，用于意图识别 Few-shot）</Label>
              <Textarea
                value={form.examples}
                onChange={(e) => setForm((f) => ({ ...f, examples: e.target.value }))}
                rows={3}
                placeholder={'你好\n嗨，在吗'}
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-3">
              <div className="space-y-1.5">
                <Label>TopK 检索条数</Label>
                <Input
                  type="number"
                  value={form.topK}
                  onChange={(e) => setForm((f) => ({ ...f, topK: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
                <span className="text-sm">启用</span>
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

function IconBtn({
  title,
  onClick,
  danger,
  children,
}: {
  title: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        'rounded p-1 text-muted-foreground transition-colors hover:bg-background',
        danger && 'hover:text-destructive',
      )}
    >
      {children}
    </button>
  )
}
