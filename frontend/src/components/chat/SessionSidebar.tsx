import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  LogOut,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Search,
  Settings,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { sessionGroupLabel } from '@/lib/time'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/shared/Logo'
import type { ChatSession } from '@/types'

interface SessionSidebarProps {
  sessions: ChatSession[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  mobileOpen: boolean
  onMobileClose: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function SessionSidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapsed,
}: SessionSidebarProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter((s) => s.title.toLowerCase().includes(q))
  }, [sessions, query])

  const groups = useMemo(() => {
    const map = new Map<string, ChatSession[]>()
    for (const s of filtered) {
      const label = sessionGroupLabel(s.updatedAt)
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(s)
    }
    return Array.from(map.entries())
  }, [filtered])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const content = (
    <>
      {/* 顶栏：品牌 + 主题 + 收起侧栏 */}
      <div className="flex h-14 items-center justify-between gap-2 px-4 pb-1">
        <div className="flex min-w-0 items-center gap-2">
          <Logo size={30} />
          <span className="truncate text-base font-semibold tracking-tight">MindFlow</span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-muted active:scale-95"
            title="切换主题"
          >
            {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </button>
          <button
            onClick={onToggleCollapsed}
            className="hidden rounded-lg p-2 text-muted-foreground transition-all hover:bg-muted active:scale-95 lg:block"
            title="收起侧栏"
          >
            <PanelLeftClose className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* 搜索 */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索对话"
            className="h-10 w-full rounded-xl border border-transparent bg-muted pl-9 pr-3 text-base outline-none transition-all placeholder:text-muted-foreground hover:border-muted-foreground/30 focus:border-primary/40 focus:bg-background"
          />
        </div>
      </div>

      {/* 新对话：胶囊按钮 */}
      <div className="px-4 pb-4">
        <button
          onClick={() => {
            onNew()
            onMobileClose()
          }}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-base font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="h-[18px] w-[18px]" />
          新对话
        </button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.length === 0 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {query ? '没有匹配的对话' : '暂无历史对话'}
          </p>
        )}
        {groups.map(([label, list]) => (
          <div key={label} className="mb-4">
            <p className="px-2 pb-1 text-xs text-muted-foreground">{label}</p>
            <div className="space-y-1">
              {list.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelect(s.id)
                    onMobileClose()
                  }}
                  className={cn(
                    'group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 transition-all active:scale-[0.99]',
                    s.id === activeId ? 'ds-session-active' : 'hover:bg-chat-hover',
                  )}
                >
                  <span className="block min-w-0 flex-1 truncate text-base">{s.title}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-background/60 hover:opacity-100 group-hover:opacity-100"
                        title="更多操作"
                      >
                        <MoreHorizontal className="h-[18px] w-[18px]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          const title = window.prompt('重命名对话', s.title)
                          if (title) onRename(s.id, title)
                        }}
                      >
                        <Pencil />
                        重命名
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onClick={() => onDelete(s.id)}
                      >
                        <Trash2 />
                        删除对话
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 底部：用户 */}
      <div className="border-t border-border/50 p-4">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{user?.username?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium">{user?.username}</p>
            <p className="text-sm text-muted-foreground">{user?.role === 'admin' ? '管理员' : '用户'}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-muted active:scale-95">
                <Settings className="h-[18px] w-[18px]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {user?.role === 'admin' && (
                <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                  <LayoutDashboard />
                  管理后台
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )

  // 收起态：图标条（仅桌面端）
  const collapsedContent = (
    <div className="flex h-full flex-col items-center gap-1 px-2 py-3">
      <div className="pb-2">
        <Logo size={30} />
      </div>
      <button
        onClick={() => {
          onNew()
          onMobileClose()
        }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md active:scale-95"
        title="新对话"
      >
        <Plus className="h-[18px] w-[18px]" />
      </button>
      <button
        onClick={toggleTheme}
        className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-muted active:scale-95"
        title="切换主题"
      >
        {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
      </button>
      <button
        onClick={onToggleCollapsed}
        className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-muted active:scale-95"
        title="展开侧栏"
      >
        <PanelLeftOpen className="h-[18px] w-[18px]" />
      </button>
    </div>
  )

  return (
    <>
      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onMobileClose} />
      )}
      {/* 桌面端 */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col bg-sidebar transition-all duration-200 lg:flex',
          collapsed ? 'w-[60px]' : 'w-[264px]',
        )}
      >
        {collapsed ? collapsedContent : content}
      </aside>
      {/* 移动端抽屉 */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-sidebar transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          onClick={onMobileClose}
          className="absolute right-2 top-2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
        {content}
      </aside>
    </>
  )
}
