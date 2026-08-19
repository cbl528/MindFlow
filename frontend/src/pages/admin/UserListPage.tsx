import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import { userService } from '@/services/userService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import type { UserVO } from '@/types'

export default function UserListPage() {
  const [list, setList] = useState<UserVO[]>([])
  const [total, setTotal] = useState(0)
  const [pageNo, setPageNo] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', role: 'user' })
  const [deleteTarget, setDeleteTarget] = useState<UserVO | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userService.list({ pageNo, pageSize: 10, keyword: keyword || undefined })
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

  function toggleSelect(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  // 管理员行不可勾选，全选与选中态均只统计非管理员行
  const selectable = list.filter((u) => u.role !== 'admin')

  function toggleSelectAll(checked: boolean | 'indeterminate') {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked === true) {
        selectable.forEach((u) => next.add(u.id))
      } else {
        list.forEach((u) => next.delete(u.id))
      }
      return next
    })
  }

  const allSelected = selectable.length > 0 && selectable.every((u) => selected.has(u.id))
  const someSelected = selectable.some((u) => selected.has(u.id))

  function openCreate() {
    setEditId(null)
    setForm({ username: '', password: '', role: 'user' })
    setFormOpen(true)
  }

  function openEdit(u: UserVO) {
    setEditId(u.id)
    setForm({ username: u.username, password: '', role: u.role })
    setFormOpen(true)
  }

  async function handleSave() {
    if (!form.username.trim()) {
      toast.error('请输入用户名')
      return
    }
    if (!editId && !form.password) {
      toast.error('请输入初始密码')
      return
    }
    setSaving(true)
    try {
      if (editId) {
        await userService.update(editId, {
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        })
      } else {
        await userService.create(form)
      }
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
      await userService.remove(deleteTarget.id)
      toast.success('已删除')
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(deleteTarget.id)
        return next
      })
      setDeleteTarget(null)
      load()
    } catch {
      /* 已提示 */
    }
  }

  async function handleBatchDelete() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    setBatchDeleting(true)
    try {
      await userService.batchRemove(ids)
      toast.success(`已删除 ${ids.length} 个用户`)
      setBatchDeleteOpen(false)
      setSelected(new Set())
      load()
    } catch {
      /* 已提示 */
    } finally {
      setBatchDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">用户管理</h1>
        <p className="text-sm text-muted-foreground">管理登录用户与角色</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索用户名"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPageNo(1)}
              className="pl-9"
            />
          </div>
          <Button variant="secondary" onClick={() => setPageNo(1)}>
            搜索
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            disabled={selected.size === 0}
            onClick={() => setBatchDeleteOpen(true)}
          >
            批量删除{selected.size > 0 ? ` (${selected.size})` : ''}
          </Button>
          <Button onClick={openCreate}>
            <Plus />
            新增用户
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background shadow-sm">
        {!loading && list.length === 0 ? (
          <EmptyState icon={Users} title="暂无用户" description="点击「新增用户」创建" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleSelectAll}
                    aria-label="全选本页用户"
                  />
                </TableHead>
                <TableHead>头像</TableHead>
                <TableHead>用户名</TableHead>
                <TableHead>身份</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((u) => (
                <TableRow key={u.id} data-state={selected.has(u.id) ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(u.id)}
                      onCheckedChange={(v) => toggleSelect(u.id, v === true)}
                      disabled={u.role === 'admin'}
                      aria-label={`选择用户${u.username}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Avatar className="h-9 w-9">
                      {u.avatar ? <AvatarImage src={u.avatar} alt={u.username} /> : null}
                      <AvatarFallback>{u.username?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                      {u.role === 'admin' ? '管理员' : '用户'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(u.createTime)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(u.updateTime)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:bg-accent hover:text-primary"
                        onClick={() => openEdit(u)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={u.role === 'admin'}
                        onClick={() => setDeleteTarget(u)}
                      >
                        删除
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? '编辑用户' : '新增用户'}</DialogTitle>
            <DialogDescription>{editId ? '可修改角色或重置密码' : '创建新的登录账号'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>用户名 {!editId && '*'}</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                disabled={!!editId}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{editId ? '重置密码（留空不修改）' : '初始密码 *'}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label>角色</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
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
            <AlertDialogTitle>删除用户</AlertDialogTitle>
            <AlertDialogDescription>确定删除用户「{deleteTarget?.username}」吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>批量删除用户</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除选中的 {selected.size} 个用户吗？删除后不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} disabled={batchDeleting}>
              {batchDeleting ? '删除中…' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
