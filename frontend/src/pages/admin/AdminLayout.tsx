import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ChevronRight,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  ListTree,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Sun,
  Users,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const MENUS: Array<{
  label: string
  items: Array<{ to: string; label: string; icon: React.ComponentType<{ className?: string }>; end?: boolean }>
}> = [
  {
    label: '导航',
    items: [
      { to: '/admin/dashboard', label: '仪表盘', icon: LayoutDashboard, end: true },
      { to: '/admin/knowledge', label: '知识库管理', icon: BookOpen },
      { to: '/admin/intent-tree', label: '意图树配置', icon: ListTree },
      { to: '/admin/intent-list', label: '意图列表', icon: GitBranch },
      { to: '/admin/ingestion', label: '数据通道', icon: Zap },
      { to: '/admin/mappings', label: '关键词映射', icon: KeyRound },
      { to: '/admin/traces', label: '链路追踪', icon: MessageSquare },
      { to: '/admin/change-logs', label: '审计日志', icon: Settings2 },
    ],
  },
  {
    label: '设置',
    items: [
      { to: '/admin/sample-questions', label: '示例问题', icon: Settings2 },
      { to: '/admin/users', label: '用户管理', icon: Users },
    ],
  },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  // 面包屑
  const crumbs: Array<{ to?: string; label: string }> = [{ label: '管理后台' }]
  const all = MENUS.flatMap((g) => g.items)
  const current = all.find((m) =>
    m.end ? location.pathname === m.to : location.pathname.startsWith(m.to),
  )
  if (current) crumbs.push({ to: current.to, label: current.label })

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* 侧边栏 */}
      <aside
        className={cn(
          'flex shrink-0 flex-col border-r border-border bg-background transition-all duration-200',
          collapsed ? 'w-[60px]' : 'w-[224px]',
        )}
      >
        <div className={cn('flex h-14 items-center gap-2 border-b border-border px-4', collapsed && 'justify-center px-0')}>
          <Logo size={28} />
          {!collapsed && (
            <Link to="/admin/dashboard" className="text-base font-semibold tracking-tight">
              MindFlow
            </Link>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {MENUS.map((group) => (
            <div key={group.label} className="mb-4">
              {!collapsed && (
                <p className="px-2 pb-1 text-xs text-muted-foreground">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                        collapsed && 'justify-center px-0',
                        isActive
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-2">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={collapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 shrink-0" />
                <span>收起</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* 主区域 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 顶栏 */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                {c.to ? (
                  <Link to={c.to} className="text-foreground hover:text-primary">
                    {c.label}
                  </Link>
                ) : (
                  <span>{c.label}</span>
                )}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Button asChild variant="secondary" className="gap-1.5">
              <Link to="/chat" title="回到对话">
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span>回到对话</span>
              </Link>
            </Button>
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
              title="切换主题"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-muted">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>{user?.username?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user?.username}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => navigate('/chat')}>
                  回到对话
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* 内容 */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-5 py-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
