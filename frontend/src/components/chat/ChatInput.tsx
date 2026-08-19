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
    <div className="mx-auto w-full max-w-[860px] px-4 pb-4 pt-2 md:px-6">
      <div
        className={cn(
          'rounded-[24px] border bg-background transition-all duration-200',
          focused ? 'border-primary/50 shadow-chat-input-focus' : 'border-border shadow-chat-input hover:border-muted-foreground/30',
        )}
      >
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          placeholder="给 MindFlow 发送消息…"
          className="max-h-[220px] w-full resize-none bg-transparent px-5 pb-0 pt-4 text-base leading-7 outline-none placeholder:text-muted-foreground"
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
        <div className="flex items-center justify-between px-3 pb-3 pt-1.5">
          {/* 左：深度思考开关 */}
          <button
            onClick={onToggleDeepThinking}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-base transition-all active:scale-95',
              deepThinking
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.25">
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
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition-all hover:bg-muted/70 active:scale-95"
              title="停止生成"
            >
              <Square className="h-[18px] w-[18px] fill-current" />
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!value.trim()}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95',
                value.trim()
                  ? 'bg-primary text-primary-foreground shadow-md hover:opacity-90'
                  : 'cursor-not-allowed bg-muted text-muted-foreground',
              )}
              title="发送"
            >
              <ArrowUp className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-2.5 text-center text-sm text-muted-foreground">
        MindFlow 生成的内容仅供参考，请仔细甄别信息准确性
      </p>
    </div>
  )
}
