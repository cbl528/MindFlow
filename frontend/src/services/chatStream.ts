import { request } from './api'
import { API_BASE } from './api'
import { USE_BACKEND } from '@/config'
import { buildDemoStream, seed } from '@/data/seed'
import type { CompletionPayload, MessageDelta, MetaPayload, RecommendedQuestionsPayload } from '@/types'

export interface StreamHandlers {
  onMeta?: (payload: MetaPayload) => void
  onMessage?: (payload: MessageDelta) => void
  onFinish?: (payload: CompletionPayload) => void
  onDone?: () => void
  onReject?: () => void
  onError?: (message: string) => void
}

export interface StreamOptions {
  question: string
  conversationId?: string
  deepThinking?: boolean
  signal?: AbortSignal
}

/** 解析一个 SSE 事件块（event: 行 + data: 行），返回 {event, data} 或 null */
function parseEventBlock(block: string): { event: string; data: string } | null {
  let event = 'message'
  const dataLines: string[] = []
  for (const line of block.split('\n')) {
    const trimmed = line.replace(/\r$/, '')
    if (trimmed.startsWith('event:')) {
      event = trimmed.slice(6).trim()
    } else if (trimmed.startsWith('data:')) {
      dataLines.push(trimmed.slice(5).trimStart())
    }
  }
  if (dataLines.length === 0) return null
  return { event, data: dataLines.join('\n') }
}

/** 演示模式：按预设节奏模拟流式输出（支持中止） */
function demoStreamChat(options: StreamOptions, handlers: StreamHandlers): AbortController {
  const controller = new AbortController()
  const timers: ReturnType<typeof setTimeout>[] = []
  const events = buildDemoStream(options.question, options.deepThinking === true)

  for (const { delay, emit } of events) {
    timers.push(
      setTimeout(() => {
        if (controller.signal.aborted) return
        const { event, data } = emit()
        switch (event) {
          case 'meta':
            handlers.onMeta?.(data as MetaPayload)
            break
          case 'message':
            handlers.onMessage?.(data as MessageDelta)
            break
          case 'finish':
            handlers.onFinish?.(data as CompletionPayload)
            break
          case 'reject':
            handlers.onReject?.()
            break
          case 'error':
            handlers.onError?.(String(data))
            break
          default:
            if (event === 'done') handlers.onDone?.()
            break
        }
      }, delay),
    )
  }
  const onAbort = () => timers.forEach((t) => clearTimeout(t))
  controller.signal.addEventListener('abort', onAbort)
  return controller
}

/** 真实后端：GET SSE 流式对话 */
function realStreamChat(options: StreamOptions, handlers: StreamHandlers): AbortController {
  const controller = new AbortController()
  const external = options.signal
  if (external) {
    if (external.aborted) controller.abort()
    else external.addEventListener('abort', () => controller.abort())
  }

  const params = new URLSearchParams({ question: options.question })
  if (options.conversationId) params.set('conversationId', options.conversationId)
  if (options.deepThinking) params.set('deepThinking', 'true')

  const url = `${API_BASE}/mindflow/rag/chat?${params.toString()}`
  const token = localStorage.getItem('mf_token')

  const processBlock = (block: string) => {
    const parsed = parseEventBlock(block)
    if (!parsed) return
    const { event, data } = parsed
    switch (event) {
      case 'meta': {
        try {
          handlers.onMeta?.(JSON.parse(data) as MetaPayload)
        } catch {
          /* 忽略脏数据 */
        }
        break
      }
      case 'message': {
        try {
          const payload = JSON.parse(data) as MessageDelta
          if (payload && typeof payload.delta === 'string') {
            handlers.onMessage?.(payload)
          }
        } catch {
          handlers.onMessage?.({ type: 'response', delta: data })
        }
        break
      }
      case 'finish': {
        try {
          handlers.onFinish?.(JSON.parse(data) as CompletionPayload)
        } catch {
          /* 忽略 */
        }
        break
      }
      case 'done':
        handlers.onDone?.()
        break
      case 'reject':
        handlers.onReject?.()
        break
      case 'error':
        handlers.onError?.(data)
        break
      default:
        break
    }
  }

  ;(async () => {
    try {
      const resp = await fetch(url, {
        headers: token ? { Authorization: token } : undefined,
        signal: controller.signal,
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      if (!resp.body) throw new Error('响应体为空')
      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const blocks = buffer.split('\n\n')
        buffer = blocks.pop() ?? ''
        for (const block of blocks) processBlock(block)
      }
      if (buffer.trim()) processBlock(buffer)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        handlers.onDone?.()
        return
      }
      handlers.onError?.(err instanceof Error ? err.message : '连接失败')
    }
  })()

  return controller
}

/**
 * 流式对话。演示模式模拟输出；真实模式走后端 SSE。
 * 事件：meta / message{type:think|response} / finish / done / cancel / reject / error
 */
export function streamChat(options: StreamOptions, handlers: StreamHandlers): AbortController {
  if (!USE_BACKEND) return demoStreamChat(options, handlers)
  return realStreamChat(options, handlers)
}

/** 停止生成任务 */
export function stopChat(taskId: string) {
  if (!USE_BACKEND) return Promise.resolve(undefined)
  return request<void>({ url: '/mindflow/rag/v1/stop', method: 'post', params: { taskId } })
}

/** 推荐追问 */
export function recommendedQuestions(messageId: string) {
  if (!USE_BACKEND) return Promise.resolve(seed.recommendedQuestions)
  return request<RecommendedQuestionsPayload>({
    url: `/conversations/messages/${messageId}/recommended-questions`,
    method: 'post',
  })
}
