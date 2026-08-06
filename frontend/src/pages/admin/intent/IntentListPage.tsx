import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GitBranch, Pencil, Search } from 'lucide-react'
import { toast } from 'sonner'
import { intentService } from '@/services/intentService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'
import type { IntentNodeTreeVO } from '@/types'

const KIND_LABEL = ['知识库', '系统', 'MCP']

function flatten(nodes: IntentNodeTreeVO[], depth = 0): Array<IntentNodeTreeVO & { depth: number }> {
  return nodes.flatMap((n) => [{ ...n, depth }, ...flatten(n.children ?? [], depth + 1)])
}

export default function IntentListPage() {
  const [list, setList] = useState<Array<IntentNodeTreeVO & { depth: number }>>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setList(flatten(await intentService.trees()))
    } catch {
      /* 已提示 */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (n) => n.name.toLowerCase().includes(q) || (n.intentCode ?? '').toLowerCase().includes(q),
    )
  }, [list, query])

  async function handleBatch(op: 'enable' | 'disable' | 'delete') {
    if (selected.length === 0) return
    try {
      if (op === 'enable') await intentService.batchEnable(selected)
      else if (op === 'disable') await intentService.batchDisable(selected)
      else await intentService.batchDelete(selected)
      toast.success('操作成功')
      setSelected([])
      load()
    } catch {
      /* 已提示 */
    }
  }

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([])
    else setSelected(filtered.map((n) => n.id))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">意图列表</h1>
          <p className="text-sm text-muted-foreground">扁平化浏览所有意图节点，支持批量启停与删除</p>
        </div>
        <Button variant="outline" onClick={load}>
          刷新
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索名称或编码"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        {selected.length > 0 && (
          <>
            <Button size="sm" onClick={() => handleBatch('enable')}>
              批量启用 ({selected.length})
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBatch('disable')}>
              批量禁用
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleBatch('delete')}>
              批量删除
            </Button>
          </>
        )}
      </div>

      <div className="rounded-xl border border-border bg-background">
        {!loading && filtered.length === 0 ? (
          <EmptyState icon={GitBranch} title="暂无意图节点" description="请先在「意图树配置」中创建节点" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox checked={selected.length > 0 && selected.length === filtered.length} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead>名称</TableHead>
                <TableHead>编码</TableHead>
                <TableHead>层级</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>TopK</TableHead>
                <TableHead>启用</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((node) => (
                <TableRow key={node.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(node.id)}
                      onCheckedChange={(v) =>
                        setSelected((prev) => (v ? [...prev, node.id] : prev.filter((x) => x !== node.id)))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2 font-medium">
                      <span style={{ paddingLeft: `${node.depth * 14}px` }} />
                      {node.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{node.intentCode || '—'}</TableCell>
                  <TableCell>{node.level ?? node.depth}</TableCell>
                  <TableCell>
                    <Badge variant={node.kind === 0 ? 'default' : node.kind === 1 ? 'success' : 'warning'}>
                      {KIND_LABEL[node.kind ?? 0] ?? '未知'}
                    </Badge>
                  </TableCell>
                  <TableCell>{node.topK ?? '—'}</TableCell>
                  <TableCell>
                    {node.enabled ? <Badge variant="success">启用</Badge> : <Badge variant="secondary">禁用</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/intent-list/${node.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                        编辑
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
