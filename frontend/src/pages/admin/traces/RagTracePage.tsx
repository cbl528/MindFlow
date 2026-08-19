import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, Search } from 'lucide-react'
import { ragTraceService } from '@/services/ragTraceService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import type { RagTraceRunVO } from '@/types'

export default function RagTracePage() {
  const navigate = useNavigate()
  const [list, setList] = useState<RagTraceRunVO[]>([])
  const [total, setTotal] = useState(0)
  const [pageNo, setPageNo] = useState(1)
  const [traceId, setTraceId] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ragTraceService.runs({
        pageNo,
        pageSize: 10,
        traceId: traceId || undefined,
        status: status || undefined,
      })
      setList(res.records)
      setTotal(res.total)
    } catch {
      /* 已提示 */
    } finally {
      setLoading(false)
    }
  }, [pageNo, traceId, status])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">链路追踪</h1>
        <p className="text-sm text-muted-foreground">查看每次 RAG 请求的完整执行链路</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索 Trace ID"
            value={traceId}
            onChange={(e) => setTraceId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setPageNo(1)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPageNo(1) }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部状态</SelectItem>
            <SelectItem value="SUCCESS">成功</SelectItem>
            <SelectItem value="FAILED">失败</SelectItem>
            <SelectItem value="RUNNING">执行中</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="secondary" onClick={() => setPageNo(1)}>
          搜索
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-background shadow-sm">
        {!loading && list.length === 0 ? (
          <EmptyState icon={Activity} title="暂无追踪记录" description="发起 RAG 对话后会自动记录" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>问题</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>耗时</TableHead>
                <TableHead>首字延迟</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>开始时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((run) => (
                <TableRow key={run.traceId} className="cursor-pointer" onClick={() => navigate(`/admin/traces/${run.traceId}`)}>
                  <TableCell className="max-w-[280px] truncate font-medium">{run.question || '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={run.status} />
                  </TableCell>
                  <TableCell>{run.durationMs != null ? `${(run.durationMs / 1000).toFixed(1)}s` : '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {run.ttftMs != null ? `${(run.ttftMs / 1000).toFixed(2)}s` : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{run.username || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(run.startTime)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/traces/${run.traceId}`}>详情</Link>
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
    </div>
  )
}
