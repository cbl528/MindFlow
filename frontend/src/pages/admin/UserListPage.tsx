import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { userService } from '@/services/userService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', role: 'user' })
  const [deleteTarget, setDeleteTarget] = useState<UserVO | null>(null)

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
      setDeleteTarget(null)
      load()
    } catch {
      /* 已提示 */
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">用户管理</h1>
          <p className="text-sm text-muted-foreground">管理登录用户与角色</p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          新增用户
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索用户名"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setPageNo(1)}
            className="pl-8"
          />
        </div>
        <Button variant="secondary" onClick={() => setPageNo(1)}>
          搜索
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-background">
        {!loading && list.length === 0 ? (
          <EmptyState icon={Users} title="暂无用户" description="点击「新增用户」创建" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户名</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((u) => (
                <TableRow key={u.id}>
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
                      <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(u)}
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
    </div>
  )
}
