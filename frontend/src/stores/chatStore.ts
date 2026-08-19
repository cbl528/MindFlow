import { create } from 'zustand'
import { recommendedQuestions, stopChat, streamChat } from '@/services/chatStream'
import {
  deleteConversation,
  listConversationMessages,
  listConversations,
  renameConversation,
} from '@/services/conversationService'
import { USE_BACKEND } from '@/config'
import { uid } from '@/lib/utils'
import type { ChatMessage, ChatMessageStatus, ChatSession, ConversationMessageVO } from '@/types'

const STORAGE_KEY = 'mf_sessions_v1'
const ACTIVE_KEY = 'mf_active_session'
const MAX_SESSIONS = 100
const MAX_MESSAGES = 500

interface ChatState {
  sessions: ChatSession[]
  activeId: string | null
  isStreaming: boolean
  streamTaskId: string | null
  controller: AbortController | null
  deepThinking: boolean
  /** init 是否已完成（会话列表已就绪），就绪前不激活会话避免竞态 */
  initialized: boolean

  init: () => Promise<void>
  toggleDeepThinking: () => void
  newSession: () => string | null
  deleteSession: (id: string) => void
  renameSession: (id: string, title: string) => void
  clearSessions: () => void
  /** 登出/切换账号时清空会话状态（内存 + localStorage），并复位 initialized 等待重新 init */
  reset: () => void
  setActive: (id: string | null) => void
  /** 从后端懒加载指定会话的消息历史 */
  loadConversationMessages: (sessionId: string) => Promise<void>
  sendMessage: (text: string) => Promise<void>
  regenerate: () => Promise<void>
  stopStreaming: () => void
  loadRecommended: (sessionId: string, messageId: string) => Promise<void>
  _persist: () => void
}

function persist(sessions: ChatSession[], activeId: string | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId)
    else localStorage.removeItem(ACTIVE_KEY)
  } catch {
    /* localStorage 满时静默丢弃 */
  }
}

function trimSessions(sessions: ChatSession[]): ChatSession[] {
  return sessions.slice(0, MAX_SESSIONS).map((s) => ({
    ...s,
    messages: s.messages.slice(-MAX_MESSAGES),
  }))
}

function appendMessages(sessionId: string, messages: ChatMessage[]) {
  useChatStore.setState((s) => ({
    sessions: s.sessions.map((x) =>
      x.id === sessionId
        ? { ...x, messages: [...x.messages, ...messages], updatedAt: Date.now() }
        : x,
    ),
  }))
}

/** 后端消息 VO → 前端消息模型 */
function toChatMessage(vo: ConversationMessageVO): ChatMessage {
  const status: ChatMessageStatus =
    vo.messageStatus === 'INTERRUPTED'
      ? 'interrupted'
      : vo.messageStatus === 'REJECTED'
        ? 'error'
        : 'complete'
  return {
    id: vo.id,
    messageId: vo.id,
    role: vo.role,
    content: vo.content,
    thinkingContent: vo.thinkingContent,
    thinkingDuration: vo.thinkingDuration,
    vote: vo.vote,
    sources: vo.sources ?? [],
    recommendedQuestions: vo.recommendedQuestions ?? null,
    recStatus: vo.recommendedQuestions && vo.recommendedQuestions.length > 0 ? 'ready' : 'idle',
    status,
    createTime: vo.createTime,
  }
}

export const useChatStore = create<ChatState>((set, get) => {
  /** 核心流式逻辑：追加一条助手占位消息并向 SSE 发起请求（sendMessage / regenerate 复用） */
  async function streamAssistant(activeId: string, question: string) {
    const state = useChatStore.getState()
    if (state.isStreaming) return
    const session = state.sessions.find((s) => s.id === activeId)
    if (!session) return

    const assistantId = uid('m')
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      status: 'thinking',
      createTime: new Date().toISOString(),
    }
    useChatStore.setState((s) => ({
      sessions: s.sessions.map((x) =>
        x.id === activeId ? { ...x, messages: [...x.messages, assistantMsg], updatedAt: Date.now() } : x,
      ),
      isStreaming: true,
      streamTaskId: null,
    }))

    const updateMessage = (id: string, patch: Partial<ChatMessage>) => {
      useChatStore.setState((s) => ({
        sessions: s.sessions.map((x) =>
          x.id === activeId ? { ...x, messages: x.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) } : x,
        ),
      }))
    }

    let thinkStartAt: number | null = null
    let responseStartedAt: number | null = null
    let thinkingAcc = ''
    let contentAcc = ''

    const controller = streamChat(
      {
        question,
        conversationId: session.conversationId,
        deepThinking: useChatStore.getState().deepThinking,
      },
      {
        onMeta: ({ conversationId, taskId }) => {
          useChatStore.setState({ streamTaskId: taskId })
          if (conversationId) {
            useChatStore.setState((s) => ({
              sessions: s.sessions.map((x) => (x.id === activeId ? { ...x, conversationId } : x)),
            }))
          }
        },
        onMessage: ({ type, delta }) => {
          if (type === 'think') {
            if (thinkStartAt == null) thinkStartAt = Date.now()
            thinkingAcc += delta
            updateMessage(assistantId, { thinkingContent: thinkingAcc, status: 'thinking' })
          } else {
            if (responseStartedAt == null) {
              responseStartedAt = Date.now()
              if (thinkStartAt != null) {
                updateMessage(assistantId, { thinkingDuration: (responseStartedAt - thinkStartAt) / 1000 })
              }
            }
            contentAcc += delta
            updateMessage(assistantId, { content: contentAcc, status: 'streaming' })
          }
        },
        onFinish: ({ messageId, title, sources, messageStatus }) => {
          const interrupted = messageStatus === 'INTERRUPTED'
          updateMessage(assistantId, {
            messageId,
            sources: sources ?? [],
            status: interrupted ? 'interrupted' : 'complete',
          })
          if (title) {
            useChatStore.setState((s) => ({
              sessions: s.sessions.map((x) => (x.id === activeId ? { ...x, title } : x)),
            }))
          }
        },
        onDone: () => {
          updateMessage(assistantId, { status: 'complete' })
          useChatStore.setState({ isStreaming: false, streamTaskId: null })
          useChatStore.getState()._persist()
        },
        onReject: () => {
          updateMessage(assistantId, { status: 'error', error: '请求被拒绝（限流或权限）' })
          useChatStore.setState({ isStreaming: false, streamTaskId: null })
          useChatStore.getState()._persist()
        },
        onError: (message) => {
          updateMessage(assistantId, { status: 'error', error: message })
          useChatStore.setState({ isStreaming: false, streamTaskId: null })
          useChatStore.getState()._persist()
        },
      },
    )
    useChatStore.setState({ controller })
  }

  return {
    sessions: [],
    activeId: null,
    isStreaming: false,
    streamTaskId: null,
    controller: null,
    deepThinking: false,
    initialized: false,

    init: async () => {
      if (!USE_BACKEND) {
        // 演示模式：从本地存储恢复
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          const sessions = raw ? (JSON.parse(raw) as ChatSession[]) : []
          const activeId = localStorage.getItem(ACTIVE_KEY)
          set({ sessions, activeId, initialized: true })
        } catch {
          set({ sessions: [], activeId: null, initialized: true })
        }
        return
      }
      // 真实模式：会话列表以后端为准，消息按需懒加载
      try {
        const list = await listConversations()
        const sessions: ChatSession[] = list.map((c) => {
          const lastTime = c.lastTime ? new Date(c.lastTime).getTime() : null
          return {
            id: c.conversationId,
            conversationId: c.conversationId,
            title: c.title || '新对话',
            createdAt: lastTime ?? Date.now(),
            updatedAt: lastTime ?? Date.now(),
            messages: [],
            messagesStatus: 'idle',
          }
        })
        set({ sessions, activeId: null, initialized: true })
      } catch {
        // 后端不可达时回退到本地缓存，保证页面可用
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          const sessions = raw ? (JSON.parse(raw) as ChatSession[]) : []
          set({ sessions, activeId: null, initialized: true })
        } catch {
          set({ sessions: [], activeId: null, initialized: true })
        }
      }
    },

    toggleDeepThinking: () => set((s) => ({ deepThinking: !s.deepThinking })),

    newSession: () => {
      if (get().isStreaming) get().stopStreaming()
      // 只清空当前会话、进入空白新对话页，不在列表中预创建会话；
      // 真正的新会话在发送首条消息时才创建（见 sendMessage）
      set({ activeId: null })
      get()._persist()
      return null
    },

    deleteSession: (id) => {
      if (get().isStreaming && get().activeId === id) get().stopStreaming()
      const session = get().sessions.find((s) => s.id === id)
      if (USE_BACKEND && session?.conversationId) {
        deleteConversation(session.conversationId).catch(() => undefined)
      }
      set((s) => {
        const sessions = s.sessions.filter((x) => x.id !== id)
        const activeId = s.activeId === id ? null : s.activeId
        return { sessions, activeId }
      })
      get()._persist()
    },

    renameSession: async (id, title) => {
      const session = get().sessions.find((s) => s.id === id)
      if (USE_BACKEND && session?.conversationId) {
        try {
          await renameConversation(session.conversationId, title)
        } catch {
          return // 后端失败则不同步本地
        }
      }
      set((s) => ({
        sessions: s.sessions.map((x) => (x.id === id ? { ...x, title, updatedAt: Date.now() } : x)),
      }))
      get()._persist()
    },

    clearSessions: () => {
      if (get().isStreaming) get().stopStreaming()
      set({ sessions: [], activeId: null })
      get()._persist()
    },

    reset: () => {
      if (get().isStreaming) get().stopStreaming()
      // 清掉本地持久化的会话缓存，避免切换账号后残留上一用户数据
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(ACTIVE_KEY)
      set({
        sessions: [],
        activeId: null,
        isStreaming: false,
        streamTaskId: null,
        controller: null,
        initialized: false,
      })
    },

    setActive: (id) => {
      set({ activeId: id })
      persist(get().sessions, id)
      if (id) void get().loadConversationMessages(id)
    },

    loadConversationMessages: async (sessionId) => {
      if (!USE_BACKEND) return
      const session = get().sessions.find((s) => s.id === sessionId)
      if (!session?.conversationId) return
      if (session.messagesStatus === 'loaded' || session.messagesStatus === 'loading') return
      // 会话已携带本地消息（当前会话刚流式生成）时，直接标记已加载，
      // 避免与后端历史消息重复合并
      if (session.messages.length > 0) {
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === sessionId ? { ...x, messagesStatus: 'loaded' } : x,
          ),
        }))
        return
      }
      set((s) => ({
        sessions: s.sessions.map((x) =>
          x.id === sessionId ? { ...x, messagesStatus: 'loading' } : x,
        ),
      }))
      try {
        const list = await listConversationMessages(session.conversationId!)
        set((s) => ({
          sessions: s.sessions.map((x) => {
            if (x.id !== sessionId) return x
            const backendMsgs = list.map(toChatMessage)
            // 加载期间若用户已抢先发送新消息，保留本地追加的部分，避免被覆盖
            const localTail = x.messages.length > 0 ? x.messages : []
            return {
              ...x,
              messages: localTail.length > 0 ? [...backendMsgs, ...localTail] : backendMsgs,
              messagesStatus: 'loaded',
            }
          }),
        }))
        get()._persist()
      } catch {
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === sessionId ? { ...x, messagesStatus: 'error' } : x,
          ),
        }))
      }
    },

    sendMessage: async (raw) => {
      const text = raw.trim()
      const state = get()
      if (!text || state.isStreaming) return

      let activeId = state.activeId
      let session = state.sessions.find((s) => s.id === activeId) ?? null
      if (!session) {
        activeId = uid('sess')
        session = {
          id: activeId,
          title: text.length > 24 ? `${text.slice(0, 24)}…` : text,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        }
        set({ sessions: [session, ...state.sessions], activeId })
      }
      if (!activeId) return

      const userMsg: ChatMessage = {
        id: uid('m'),
        role: 'user',
        content: text,
        status: 'complete',
        createTime: new Date().toISOString(),
      }
      appendMessages(activeId, [userMsg])
      await streamAssistant(activeId, text)
    },

    regenerate: async () => {
      const { activeId, sessions, isStreaming } = get()
      if (!activeId || isStreaming) return
      const session = sessions.find((s) => s.id === activeId)
      if (!session) return
      const lastUserIdx = session.messages.map((m) => m.role).lastIndexOf('user')
      if (lastUserIdx < 0) return
      const lastUser = session.messages[lastUserIdx]
      set((s) => ({
        sessions: s.sessions.map((x) =>
          x.id === activeId ? { ...x, messages: x.messages.slice(0, lastUserIdx + 1) } : x,
        ),
      }))
      await streamAssistant(activeId, lastUser.content)
    },

    stopStreaming: () => {
      const { controller, streamTaskId, activeId } = get()
      controller?.abort()
      if (streamTaskId) stopChat(streamTaskId).catch(() => undefined)
      if (activeId) {
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === activeId
              ? {
                  ...x,
                  messages: x.messages.map((m) =>
                    m.role === 'assistant' && (m.status === 'streaming' || m.status === 'thinking')
                      ? { ...m, status: 'interrupted' }
                      : m,
                  ),
                }
              : x,
            ),
          isStreaming: false,
          streamTaskId: null,
          controller: null,
        }))
        get()._persist()
      }
    },

    loadRecommended: async (sessionId, messageId) => {
      const session = get().sessions.find((s) => s.id === sessionId)
      const message = session?.messages.find((m) => m.id === messageId)
      if (!message?.messageId) return
      set((s) => ({
        sessions: s.sessions.map((x) =>
          x.id === sessionId
            ? {
                ...x,
                messages: x.messages.map((m) => (m.id === messageId ? { ...m, recStatus: 'loading' } : m)),
              }
            : x,
        ),
      }))
      try {
        const payload = await recommendedQuestions(message.messageId)
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === sessionId
              ? {
                  ...x,
                  messages: x.messages.map((m) =>
                    m.id === messageId
                      ? {
                          ...m,
                          recStatus: payload.status === 'SUCCESS' ? 'ready' : 'error',
                          recommendedQuestions: payload.status === 'SUCCESS' ? payload.questions : [],
                        }
                      : m,
                  ),
                }
              : x,
            ),
        }))
      } catch {
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === sessionId
              ? {
                  ...x,
                  messages: x.messages.map((m) => (m.id === messageId ? { ...m, recStatus: 'error' } : m)),
                }
              : x,
            ),
        }))
      }
    },

    _persist: () => {
      const { sessions, activeId } = get()
      persist(trimSessions(sessions), activeId)
    },
  }
})
