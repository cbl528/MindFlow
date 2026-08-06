import { useRef, useState } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (text: string) => void
  onStop: () => void
  streaming: boolean
  deepThinking: boolean
  onToggleDeepThinking: () => void
}

/** DeepSeek 风格输入框：圆角容器 + 深度思考开关 + 发送/停止 */
export function ChatInput({
  onSend,
  onStop,
  streaming,
  deepThinking,
  onToggleDeepThinking,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const composingRef = useRef(false)
  const taRef = useRef<HTMLTextAreaElement>(null)

  function resize() {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
  }

  function send() {
    const text = value.trim()
    if (!text || streaming) return
    onSend(text)
    setValue('')
    requestAnimationFrame(() => {
      if (taRef.current) {
        taRef.current.style.height = 'auto'
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-[780px] px-4 pb-4 pt-2 md:px-6">
      <div
        className={cn(
          'rounded-[20px] border bg-background transition-shadow',
          focused ? 'border-primary/40 shadow-chat-input-focus' : 'border-border shadow-chat-input',
        )}
      >
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          placeholder="给 MindFlow 发送消息…"
          className="max-h-[200px] w-full resize-none bg-transparent px-4 pb-0 pt-3.5 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setValue(e.target.value)
            resize()
          }}
          onCompositionStart={() => (composingRef.current = true)}
          onCompositionEnd={() => (composingRef.current = false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !composingRef.current) {
              e.preventDefault()
              send()
            }
          }}
        />
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          {/* 左：深度思考开关 */}
          <button
            onClick={onToggleDeepThinking}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm transition-colors',
              deepThinking
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                d="M9.6 3.5a1.2 1.2 0 0 1 2.2.6V5h.2a1.2 1.2 0 1 1 0 2.4h-.2v.9a1.2 1.2 0 1 1-2.2 0V7.4H9.4a1.2 1.2 0 1 1 0-2.4h.2V4.1Z"
                fill="currentColor"
                stroke="none"
              />
              <path
                d="M17 8.5h-.01M17 11.5h.01M17 14.5h-.01M6 18h12M8.5 21h7M5 21c-.6-1-1-2.4-1-4v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1c0 1.6-.4 3-1 4"
                strokeLinecap="round"
              />
            </svg>
            深度思考
          </button>

          {/* 右：发送 / 停止 */}
          {streaming ? (
            <button
              onClick={onStop}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/70"
              title="停止生成"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!value.trim()}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full transition-all',
                value.trim()
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'cursor-not-allowed bg-muted text-muted-foreground',
              )}
              title="发送"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        MindFlow 生成的内容仅供参考，请仔细甄别信息准确性
      </p>
    </div>
  )
}
