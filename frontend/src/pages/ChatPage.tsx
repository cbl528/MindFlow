import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Download, Menu } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { Button } from '@/components/ui/button'
import { SessionSidebar } from '@/components/chat/SessionSidebar'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { WelcomeScreen } from '@/components/chat/WelcomeScreen'
import { Loading } from '@/components/shared/Loading'

export default function ChatPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chat-sidebar-collapsed') === '1'
    } catch {
      return false
    }
  })

  const sessions = useChatStore((s) => s.sessions)
  const activeId = useChatStore((s) => s.activeId)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const deepThinking = useChatStore((s) => s.deepThinking)

  const { setActive, toggleDeepThinking } = useChatStore.getState()

  // 路由 → 激活会话
  useEffect(() => {
    setActive(sessionId ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId],
  )

  // 安全网：init 异步加载会话列表期间若已选中会话（刷新/深链接），
  // 会话出现后补触发消息加载；loadConversationMessages 内部有幂等保护
  useEffect(() => {
    if (activeId && activeSession?.id === activeId && activeSession.messagesStatus === 'idle') {
      void useChatStore.getState().loadConversationMessages(activeId)
    }
  }, [activeId, activeSession?.id, activeSession?.messagesStatus])

  function handleNew() {
    const id = useChatStore.getState().newSession()
    navigate(`/chat/${id}`)
  }

  function handleToggleCollapsed() {
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem('chat-sidebar-collapsed', next ? '1' : '0')
      } catch {
        // 忽略 localStorage 不可用的情况
      }
      return next
    })
  }

  function handleSelect(id: string) {
    navigate(`/chat/${id}`)
  }

  function handleDelete(id: string) {
    useChatStore.getState().deleteSession(id)
    if (id === activeId) navigate('/chat', { replace: true })
  }

  function handleRename(id: string, title: string) {
    useChatStore.getState().renameSession(id, title)
  }

  async function handleSend(text: string) {
    const prev = useChatStore.getState().activeId
    await useChatStore.getState().sendMessage(text)
    const next = useChatStore.getState().activeId
    // 首条消息新建会话后同步路由
    if (!prev && next) navigate(`/chat/${next}`, { replace: true })
  }

  function handleAsk(question: string) {
    void handleSend(question)
  }

  // 后端会话消息尚未加载完成时，显示加载态，避免闪现欢迎页
  const sessionIsLoading =
    !!activeSession && (activeSession.messagesStatus === 'idle' || activeSession.messagesStatus === 'loading')
  const showWelcome =
    !activeSession || (!sessionIsLoading && activeSession.messages.length === 0)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SessionSidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={handleSelect}
        onNew={handleNew}
        onRename={handleRename}
        onDelete={handleDelete}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={handleToggleCollapsed}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* 顶部导航栏：仅在选择对话后显示 */}
        {!showWelcome && (
          <header className="flex h-12 shrink-0 items-center gap-2 px-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted lg:hidden"
              aria-label="打开会话列表"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="truncate text-sm font-medium">{activeSession?.title}</span>
            <div className="ml-auto flex items-center">
              <Button variant="ghost" size="icon" aria-label="导出对话">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </header>
        )}

        {/* 中间区域 */}
        <div className="flex-1 overflow-hidden">
          {sessionIsLoading ? (
            <Loading label="加载对话记录…" className="h-full" />
          ) : showWelcome ? (
            <WelcomeScreen onAsk={handleAsk} />
          ) : (
            <MessageList
              messages={activeSession.messages}
              sessionId={activeSession.id}
              onAskQuestion={handleAsk}
            />
          )}
        </div>

        {/* 输入框 */}
        <div className="shrink-0">
          <ChatInput
            onSend={handleSend}
            onStop={() => useChatStore.getState().stopStreaming()}
            streaming={isStreaming}
            deepThinking={deepThinking}
            onToggleDeepThinking={toggleDeepThinking}
          />
        </div>
      </main>
    </div>
  )
}
