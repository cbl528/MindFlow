import { useCallback, useEffect, useState } from 'react'
import { ClipboardList, Search } from 'lucide-react'
import { auditService, type ChangeLogQuery } from '@/services/auditService'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDateTime } from '@/lib/time'
import type { BizChangeLogVO } from '@/types'

export default function ChangeLogPage() {
  const [list, setList] = useState<BizChangeLogVO[]>([])
  const [total, setTotal] = useState(0)
  const [pageNo, setPageNo] = useState(1)
  const [filters, setFilters] = useState<ChangeLogQuery>({ pageNo: 1, pageSize: 15 })
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<BizChangeLogVO | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await auditService.list({ ...filters, pageNo, pageSize: 15 })
      setList(res.records)
      setTotal(res.total)
    } catch {
      /* 已提示 */
    } finally {
      setLoading(false)
    }
  }, [pageNo, filters])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">审计日志</h1>
        <p className="text-sm text-muted-foreground">业务操作变更记录，含变更前后快照与 Diff</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="操作人"
          value={filters.operatorName ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, operatorName: e.target.value }))}
          className="w-40"
        />
        <Input
          placeholder="业务类型"
          value={filters.bizType ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, bizType: e.target.value }))}
          className="w-40"
        />
        <Input
          placeholder="操作类型"
          value={filters.operationType ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, operationType: e.target.value }))}
          className="w-40"
        />
        <Select
          value={filters.success === undefined ? '' : String(filters.success)}
          onValueChange={(v) => setFilters((f) => ({ ...f, success: v === '' ? undefined : v === 'true' }))}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="全部结果" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部结果</SelectItem>
            <SelectItem value="true">成功</SelectItem>
            <SelectItem value="false">失败</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="secondary"
          onClick={() => {
            setPageNo(1)
            load()
          }}
        >
          <Search className="h-3.5 w-3.5" />
          查询
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-background">
        {!loading && list.length === 0 ? (
          <EmptyState icon={ClipboardList} title="暂无日志记录" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>操作描述</TableHead>
                <TableHead>业务</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead>结果</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="max-w-[300px] truncate font-medium">{log.actionDesc || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[log.bizType, log.operationType].filter(Boolean).join(' / ') || '—'}
                  </TableCell>
                  <TableCell>{log.operatorName || '—'}</TableCell>
                  <TableCell>
                    {log.success ? <Badge variant="success">成功</Badge> : <Badge variant="destructive">失败</Badge>}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.ip || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(log.createTime)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setDetail(log)}>
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
            <Pagination pageNo={pageNo} pageSize={15} total={total} onChange={setPageNo} />
          </div>
        )}
      </div>

      {/* 详情 */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.actionDesc || '操作详情'}</DialogTitle>
            <DialogDescription>
              操作人：{detail?.operatorName} · {formatDateTime(detail?.createTime)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <SnapshotBlock title="变更前" content={detail?.beforeSnapshot} />
            <SnapshotBlock title="变更后" content={detail?.afterSnapshot} />
          </div>
          {detail?.changeDiff && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">变更 Diff</p>
              <pre className="overflow-x-auto rounded-lg bg-muted/60 p-3 font-mono text-xs leading-5">
                {detail.changeDiff}
              </pre>
            </div>
          )}
          {detail?.errorMessage && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {detail.errorMessage}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SnapshotBlock({ title, content }: { title: string; content?: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      {content ? (
        <pre className="max-h-48 overflow-y-auto rounded-lg bg-muted/60 p-3 font-mono text-xs leading-5">
          {content}
        </pre>
      ) : (
        <p className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">—</p>
      )}
    </div>
  )
}
