import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Bot, Clock, FileQuestion, Users } from 'lucide-react'
import { dashboardService } from '@/services/dashboardService'
import { Loading } from '@/components/shared/Loading'
import { EmptyState } from '@/components/shared/EmptyState'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DashboardOverviewVO, DashboardPerformanceVO, DashboardTrendsVO } from '@/types'
import { cn } from '@/lib/utils'

const METRICS = [
  { key: 'messages', label: '消息量' },
  { key: 'sessions', label: '会话数' },
  { key: 'users', label: '活跃用户' },
]

export default function DashboardPage() {
  const [window, setWindow] = useState('7d')
  const [overview, setOverview] = useState<DashboardOverviewVO | null>(null)
  const [performance, setPerformance] = useState<DashboardPerformanceVO | null>(null)
  const [trends, setTrends] = useState<DashboardTrendsVO | null>(null)
  const [metric, setMetric] = useState('messages')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      dashboardService.overview(window),
      dashboardService.performance(window),
      dashboardService.trends(metric, { window, granularity: 'day' }),
    ])
      .then(([ov, pf, tr]) => {
        if (!alive) return
        setOverview(ov)
        setPerformance(pf)
        setTrends(tr)
      })
      .catch(() => undefined)
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [window, metric])

  const kpis = overview?.kpis
  const chartData = (trends?.series ?? []).flatMap((s) =>
    s.data.map((p) => ({ ...p, [s.name]: p.value })),
  )

  const kpiCards = [
    { key: 'totalUsers', label: '总用户', icon: Users },
    { key: 'activeUsers', label: '活跃用户', icon: Activity },
    { key: 'totalSessions', label: '总会话数', icon: Bot },
    { key: 'totalMessages', label: '总消息数', icon: FileQuestion },
    { key: 'sessions24h', label: '近 24h 会话', icon: Clock },
    { key: 'messages24h', label: '近 24h 消息', icon: Activity },
  ] as const

  const perfItems = performance
    ? [
        { label: '平均延迟', value: `${performance.avgLatencyMs ?? '—'} ms` },
        { label: 'P95 延迟', value: `${performance.p95LatencyMs ?? '—'} ms` },
        { label: '成功率', value: `${((performance.successRate ?? 0) * 100).toFixed(1)}%` },
        { label: '错误率', value: `${((performance.errorRate ?? 0) * 100).toFixed(1)}%` },
        { label: '无知识命中', value: `${((performance.noDocRate ?? 0) * 100).toFixed(1)}%` },
        { label: '慢响应占比', value: `${((performance.slowRate ?? 0) * 100).toFixed(1)}%` },
      ]
    : []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">仪表盘</h1>
          <p className="text-sm text-muted-foreground">系统运行总览与质量指标</p>
        </div>
        <Select value={window} onValueChange={setWindow}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="时间范围" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">近 7 天</SelectItem>
            <SelectItem value="30d">近 30 天</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && !overview ? (
        <Loading />
      ) : (
        <>
          {/* KPI 卡片 */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {kpiCards.map((k) => {
              const kpi = kpis?.[k.key]
              return (
                <div key={k.key} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <k.icon className="h-3.5 w-3.5" />
                    <span className="text-xs">{k.label}</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{kpi?.value ?? '—'}</p>
                  {kpi && kpi.deltaPct != null && (
                    <p
                      className={cn(
                        'mt-0.5 text-xs',
                        kpi.deltaPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
                      )}
                    >
                      {kpi.deltaPct >= 0 ? '+' : ''}
                      {(kpi.deltaPct * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* 性能快照 */}
          <div className="rounded-xl border border-border bg-background p-5">
            <h2 className="mb-4 text-sm font-medium">质量快照</h2>
            {perfItems.length === 0 ? (
              <EmptyState title="暂无质量数据" />
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                {perfItems.map((p) => (
                  <div key={p.label}>
                    <p className="text-xs text-muted-foreground">{p.label}</p>
                    <p className="mt-1 text-lg font-medium">{p.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 趋势图 */}
          <div className="rounded-xl border border-border bg-background p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium">趋势</h2>
              <div className="flex gap-1 rounded-lg bg-muted p-0.5">
                {METRICS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMetric(m.key)}
                    className={cn(
                      'rounded-md px-3 py-1 text-xs transition-colors',
                      metric === m.key ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground',
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[280px]">
              {chartData.length === 0 ? (
                <EmptyState title="暂无趋势数据" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="ds-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4D6BFE" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#4D6BFE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="ts"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={trends?.series?.[0]?.name ?? 'value'}
                      stroke="#4D6BFE"
                      strokeWidth={2}
                      fill="url(#ds-grad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
