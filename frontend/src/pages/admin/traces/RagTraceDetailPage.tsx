import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'
import { ragTraceService } from '@/services/ragTraceService'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/shared/Loading'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/time'
import type { RagTraceDetailVO } from '@/types'

export default function RagTraceDetailPage() {
  const { traceId } = useParams<{ traceId: string }>()
  const [detail, setDetail] = useState<RagTraceDetailVO | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!traceId) return
    let alive = true
    ragTraceService
      .detail(traceId)
      .then((d) => alive && setDetail(d))
      .catch(() => undefined)
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [traceId])

  if (loading) return <Loading />
  if (!detail) return <EmptyState title="未找到追踪记录" />

  const { run, nodes } = detail
  const maxDuration = Math.max(...nodes.map((n) => n.durationMs ?? 0), 1)

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          to="/admin/traces"
          className="inline-flex items-center gap-1 rounded-lg p-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </Link>
      </div>

      {/* 概览 */}
      <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{run.question || 'RAG 请求'}</h1>
          <StatusBadge status={run.status} />
          {run.traceName && <Badge variant="secondary">{run.traceName}</Badge>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Meta label="Trace ID" value={run.traceId} mono />
          <Meta label="总耗时" value={run.durationMs != null ? `${(run.durationMs / 1000).toFixed(2)}s` : '—'} />
          <Meta label="首字延迟" value={run.ttftMs != null ? `${(run.ttftMs / 1000).toFixed(2)}s` : '—'} />
          <Meta label="开始时间" value={formatDateTime(run.startTime)} />
          <Meta label="用户" value={run.username || '—'} />
          <Meta label="会话" value={run.conversationId || '—'} mono />
          {run.errorMessage && <Meta label="错误" value={run.errorMessage} danger />}
        </div>
      </div>

      {/* 节点瀑布 */}
      <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
        <h2 className="mb-4 text-base font-medium">执行节点（{nodes.length}）</h2>
        {nodes.length === 0 ? (
          <EmptyState title="暂无节点记录" />
        ) : (
          <div className="space-y-2">
            {nodes.map((n, i) => {
              const nodeKey = n.nodeId
              const isExpanded = expanded.has(nodeKey)
              const duration = n.durationMs ?? 0
              const pct = Math.max((duration / maxDuration) * 100, 2)
              return (
                <div key={nodeKey}>
                  <button
                    onClick={() => toggleExpand(nodeKey)}
                    className="w-full rounded-xl border border-border p-3.5 text-left transition-all hover:bg-muted/50 active:scale-[0.995]"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">{i + 1}</span>
                      <span className="w-40 shrink-0 truncate text-base font-medium">{n.nodeName || n.nodeType}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            n.status === 'success'
                              ? 'bg-emerald-400'
                              : n.status === 'failed'
                                ? 'bg-destructive'
                                : 'bg-amber-400',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-20 shrink-0 text-right text-sm text-muted-foreground">
                        {duration > 0 ? `${(duration / 1000).toFixed(2)}s` : '—'}
                      </span>
                      <StatusBadge status={n.status} />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-1 ml-9 rounded-xl border border-border bg-muted/40 p-3.5 text-sm leading-6 text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">类型：</span>
                        {n.nodeType || '—'}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">方法：</span>
                        {[n.className, n.methodName].filter(Boolean).join('.') || '—'}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">时间：</span>
                        {formatDateTime(n.startTime)} → {formatDateTime(n.endTime)}
                      </p>
                      {n.errorMessage && (
                        <p className="text-destructive">
                          <span className="font-medium">错误：</span>
                          {n.errorMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Meta({ label, value, mono, danger }: { label: string; value: string; mono?: boolean; danger?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-0.5 truncate text-base font-medium',
          mono && 'font-mono text-sm',
          danger && 'text-destructive',
        )}
      >
        {value}
      </p>
    </div>
  )
}
