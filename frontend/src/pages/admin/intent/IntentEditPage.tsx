import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { intentService } from '@/services/intentService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Loading } from '@/components/shared/Loading'
import { cn } from '@/lib/utils'
import type { IntentNodeTreeVO } from '@/types'

const KIND_LABEL = ['知识库', '系统', 'MCP']

function findNode(nodes: IntentNodeTreeVO[], id: string): IntentNodeTreeVO | null {
  for (const n of nodes) {
    if (n.id === id) return n
    const found = findNode(n.children ?? [], id)
    if (found) return found
  }
  return null
}

export default function IntentEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    intentCode: '',
    kind: 0,
    parentCode: '',
    description: '',
    examples: '',
    topK: 8,
    enabled: true,
    promptSnippet: '',
    promptTemplate: '',
  })

  useEffect(() => {
    if (!id) return
    let alive = true
    intentService
      .trees()
      .then((tree) => {
        const node = findNode(tree, id!)
        if (!alive || !node) return
        setForm({
          name: node.name,
          intentCode: node.intentCode ?? '',
          kind: node.kind ?? 0,
          parentCode: node.parentCode ?? '',
          description: node.description ?? '',
          examples: (node.examples ?? []).join('\n'),
          topK: node.topK ?? 8,
          enabled: node.enabled ?? true,
          promptSnippet: node.promptSnippet ?? '',
          promptTemplate: node.promptTemplate ?? '',
        })
      })
      .catch(() => undefined)
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('请输入节点名称')
      return
    }
    setSaving(true)
    try {
      await intentService.update(id!, {
        name: form.name.trim(),
        intentCode: form.intentCode.trim() || undefined,
        kind: form.kind,
        parentCode: form.parentCode || undefined,
        description: form.description || undefined,
        examples: form.examples
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        topK: form.topK,
        enabled: form.enabled,
        promptSnippet: form.promptSnippet || undefined,
        promptTemplate: form.promptTemplate || undefined,
      })
      toast.success('已保存')
      navigate('/admin/intent-list')
    } catch {
      /* 已提示 */
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <button
        onClick={() => navigate('/admin/intent-list')}
        className="inline-flex items-center gap-1 text-base text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回意图列表
      </button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">编辑意图节点</h1>
        <p className="text-sm text-muted-foreground">父节点：{form.parentCode || '（根节点）'}</p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-background p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>名称 *</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>意图编码</Label>
            <Input value={form.intentCode} onChange={(e) => setForm((f) => ({ ...f, intentCode: e.target.value }))} />
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
                  'flex-1 cursor-pointer rounded-xl border px-4 py-2 text-base transition-all active:scale-[0.98]',
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
          <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
        </div>

        <div className="space-y-1.5">
          <Label>示例（每行一个）</Label>
          <Textarea value={form.examples} onChange={(e) => setForm((f) => ({ ...f, examples: e.target.value }))} rows={3} />
        </div>

        <div className="grid grid-cols-2 items-center gap-4">
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

        <div className="space-y-1.5">
          <Label>提示词片段（promptSnippet）</Label>
          <Textarea value={form.promptSnippet} onChange={(e) => setForm((f) => ({ ...f, promptSnippet: e.target.value }))} rows={3} />
        </div>

        <div className="space-y-1.5">
          <Label>提示词模板（promptTemplate）</Label>
          <Textarea value={form.promptTemplate} onChange={(e) => setForm((f) => ({ ...f, promptTemplate: e.target.value }))} rows={5} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/admin/intent-list')}>
          取消
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '保存中…' : '保存'}
        </Button>
      </div>
    </div>
  )
}
