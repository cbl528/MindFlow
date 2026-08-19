import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { queryTermMappingService } from '@/services/queryTermMappingService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { formatDateTime } from '@/lib/time'
import type { QueryTermMappingVO } from '@/types'

const PAGE_SIZE = 10

/** 匹配类型 1：精确匹配 2：前缀匹配 3：正则匹配 4：整词匹配 */
const MATCH_TYPE_OPTIONS = [
  { value: 1, label: '精确匹配' },
  { value: 2, label: '前缀匹配' },
  { value: 3, label: '正则匹配' },
  { value: 4, label: '整词匹配' },
]

function matchTypeLabel(type: number) {
  return MATCH_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? `类型${type}`
}

const emptyForm = {
  sourceTerm: '',
  targetTerm: '',
  matchType: 1,
  priority: 0,
  enabled: true,
  remark: '',
}

type FormState = typeof emptyForm

export default function QueryTermMappingPage() {
  const [list, setList] = useState<QueryTermMappingVO[]>([])
  const [total, setTotal] = useState(0)
  const [pageNo, setPageNo] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<QueryTermMappingVO | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await queryTermMappingService.list({
        pageNo,
        pageSize: PAGE_SIZE,
        keyword: keyword || undefined,
      })
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

  function handleSearch() {
    setPageNo(1)
    setKeyword(searchValue.trim())
  }

  function handleRefresh() {
    setSearchValue(keyword)
    setPageNo(1)
    load()
  }

  function openCreate() {
    setEditId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  function openEdit(item: QueryTermMappingVO) {
    setEditId(item.id)
    setForm({
      sourceTerm: item.sourceTerm,
      targetTerm: item.targetTerm,
      matchType: item.matchType,
      priority: item.priority,
      enabled: item.enabled,
      remark: item.remark ?? '',
    })
    setFormOpen(true)
  }

  async function handleSave() {
    if (!form.sourceTerm.trim()) {
      toast.error('请输入原始词')
      return
    }
    if (!form.targetTerm.trim()) {
      toast.error('请输入目标词')
      return
    }
    setSaving(true)
    try {
      const payload = {
        sourceTerm: form.sourceTerm.trim(),
        targetTerm: form.targetTerm.trim(),
        matchType: form.matchType,
        priority: form.priority,
        enabled: form.enabled,
        remark: form.remark.trim() || null,
      }
      if (editId) await queryTermMappingService.update(editId, payload)
      else await queryTermMappingService.create(payload)
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
      await queryTermMappingService.remove(deleteTarget.id)
      toast.success('已删除')
      setDeleteTarget(null)
      load()
    } catch {
      /* 已提示 */
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">关键词映射</h1>
          <p className="text-sm text-muted-foreground">配置查询归一化的关键词映射规则</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索原始词 / 目标词"
              className="w-[240px] pl-9"
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>
            搜索
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
          <Button onClick={openCreate}>
            <Plus />
            新增映射
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background shadow-sm">
        {!loading && list.length === 0 ? (
          <EmptyState icon={KeyRound} title="暂无映射规则" description="点击「新增映射」添加" />
        ) : (
          <Table className="[&_th]:px-4 [&_td]:px-4">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[170px]">原始词</TableHead>
                <TableHead className="w-[170px]">目标词</TableHead>
                <TableHead className="w-[100px]">匹配类型</TableHead>
                <TableHead className="w-[80px]">优先级</TableHead>
                <TableHead className="w-[80px]">状态</TableHead>
                <TableHead>备注</TableHead>
                <TableHead className="w-[170px] whitespace-nowrap">创建时间</TableHead>
                <TableHead className="w-[170px] whitespace-nowrap">更新时间</TableHead>
                <TableHead className="w-[110px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-[160px] truncate font-medium" title={item.sourceTerm}>
                    {item.sourceTerm}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate" title={item.targetTerm}>
                    {item.targetTerm}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{matchTypeLabel(item.matchType)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.priority}</TableCell>
                  <TableCell>
                    <Badge variant={item.enabled ? 'success' : 'outline'}>
                      {item.enabled ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground" title={item.remark ?? ''}>
                    {item.remark || '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(item.createTime)}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(item.updateTime)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}
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
            <Pagination pageNo={pageNo} pageSize={PAGE_SIZE} total={total} onChange={setPageNo} />
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editId ? '编辑映射规则' : '新增映射规则'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>原始词 *</Label>
              <Input
                value={form.sourceTerm}
                onChange={(e) => setForm((f) => ({ ...f, sourceTerm: e.target.value }))}
                placeholder="用户输入的原始关键词"
              />
            </div>
            <div className="space-y-1.5">
              <Label>目标词 *</Label>
              <Input
                value={form.targetTerm}
                onChange={(e) => setForm((f) => ({ ...f, targetTerm: e.target.value }))}
                placeholder="归一化后的目标关键词"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>匹配类型</Label>
                <Select
                  value={String(form.matchType)}
                  onValueChange={(v) => setForm((f) => ({ ...f, matchType: Number(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATCH_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>优先级</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                  placeholder="数值越小优先级越高"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-3.5 py-3">
              <div>
                <Label>启用状态</Label>
                <p className="text-sm text-muted-foreground">关闭后该规则将不参与查询归一化</p>
              </div>
              <Switch
                checked={form.enabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>备注</Label>
              <Input
                value={form.remark}
                onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
                placeholder="可选备注信息"
              />
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除映射规则</AlertDialogTitle>
            <AlertDialogDescription>删除后该映射规则将不再生效，是否继续？</AlertDialogDescription>
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
