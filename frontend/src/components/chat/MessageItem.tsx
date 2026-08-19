import { memo, useState } from 'react'
import { ChevronDown, ChevronRight, Copy, RefreshCw, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import { SourcesSection } from './SourcesSection'
import type { ChatMessage } from '@/types'
import { cn, formatSeconds } from '@/lib/utils'

interface MessageItemProps {
  message: ChatMessage
  sessionId: string
  onAskQuestion: (question: string) => void
}

export const MessageItem = memo(function MessageItem({
  message,
  sessionId,
  onAskQuestion,
}: MessageItemProps) {
  const [showThinking, setShowThinking] = useState(true)
  const [showSources, setShowSources] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null)
  const [vote, setVote] = useState<1 | -1 | null>(message.vote ?? null)
  const [copied, setCopied] = useState(false)

  const isUser = message.role === 'user'
  const isDone = message.status === 'complete' || message.status === 'interrupted'
  const hasThinking =
    message.status === 'thinking' || (message.thinkingContent && message.thinkingContent.length > 0)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 忽略 */
    }
  }

  function openCitation(index: number) {
    setShowSources(true)
    setHighlightIndex(index)
  }

  return (
    <div className="w-full py-4">
      {isUser ? (
        <div className="flex justify-end">
          <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-user-bubble px-5 py-3.5 leading-7">
            {message.content}
          </div>
        </div>
      ) : (
        <div>
          {/* 深度思考块 */}
          {hasThinking && (
            <div className="mb-3">
              <button
                onClick={() => setShowThinking((v) => !v)}
                className="thinking-toggle"
              >
                {showThinking ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {message.status === 'thinking' && !message.thinkingContent
                  ? '深度思考中'
                  : message.status === 'thinking'
                    ? '深度思考中…'
                    : `已深度思考（用时 ${formatSeconds(message.thinkingDuration)}）`}
                {message.status === 'thinking' && (
                  <span className="inline-flex gap-0.5">
                    <Dot delay="0s" />
                    <Dot delay="0.15s" />
                    <Dot delay="0.3s" />
                  </span>
                )}
              </button>
              {showThinking && message.thinkingContent && (
                <div className="mt-2.5 whitespace-pre-wrap rounded-xl bg-muted/70 p-4 text-base leading-7 text-muted-foreground">
                  {message.thinkingContent}
                </div>
              )}
            </div>
          )}

          {/* 正文 */}
          <div className="w-full">
            <MarkdownRenderer content={message.content} onCitation={openCitation} />
            {message.status === 'streaming' && <span className="stream-cursor" />}
          </div>

          {/* 错误提示 */}
          {message.status === 'error' && (
            <p className="mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-base text-destructive">
              {message.error || '生成失败，请重试'}
            </p>
          )}

          {/* 操作行 */}
          {isDone && (
            <div className="mt-3 flex items-center gap-1 text-muted-foreground">
              <ActionIcon title={copied ? '已复制' : '复制'} onClick={handleCopy}>
                {copied ? <CheckIcon /> : <Copy className="h-[18px] w-[18px]" />}
              </ActionIcon>
              <ActionIcon title="重新生成" onClick={() => useChatActions().regenerate()}>
                <RefreshCw className="h-[18px] w-[18px]" />
              </ActionIcon>
              <div className="mx-1 h-5 w-px bg-border" />
              <ActionIcon
                title="有帮助"
                onClick={() => setVote(vote === 1 ? null : 1)}
                className={cn(vote === 1 && 'text-primary')}
              >
                <ThumbsUp className="h-[18px] w-[18px]" />
              </ActionIcon>
              <ActionIcon
                title="没帮助"
                onClick={() => setVote(vote === -1 ? null : -1)}
                className={cn(vote === -1 && 'text-destructive')}
              >
                <ThumbsDown className="h-[18px] w-[18px]" />
              </ActionIcon>
              {message.messageId && !message.recommendedQuestions && !message.recStatus && (
                <>
                  <div className="mx-1 h-5 w-px bg-border" />
                  <button
                    onClick={() => useChatActions().loadRecommended(sessionId, message.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-base transition-all hover:bg-muted hover:text-foreground active:scale-95"
                  >
                    <Sparkles className="h-[18px] w-[18px]" />
                    推荐追问
                  </button>
                </>
              )}
            </div>
          )}

          {/* 推荐追问胶囊 */}
          {message.recStatus === 'loading' && (
            <div className="mt-3 text-base text-muted-foreground">正在生成推荐问题…</div>
          )}
          {message.recStatus === 'error' && !message.recommendedQuestions && (
            <div className="mt-3 flex items-center gap-2 text-base text-muted-foreground">
              <span>推荐问题生成失败</span>
              <button
                className="text-primary hover:underline"
                onClick={() => useChatActions().loadRecommended(sessionId, message.id)}
              >
                重试
              </button>
            </div>
          )}
          {message.recommendedQuestions && message.recommendedQuestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.recommendedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => onAskQuestion(q)}
                  className="max-w-full truncate rounded-full border border-border bg-background px-4 py-2 text-base transition-all hover:border-primary/50 hover:bg-accent hover:text-primary active:scale-[0.98]"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* 来源 */}
          {message.sources && message.sources.length > 0 && (
            <SourcesSection
              sources={message.sources}
              highlightIndex={highlightIndex}
              open={showSources}
              onToggle={setShowSources}
            />
          )}
        </div>
      )}
    </div>
  )
})

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1 w-1 animate-bounce rounded-full bg-muted-foreground"
      style={{ animationDelay: delay }}
    />
  )
}

function ActionIcon({
  title,
  onClick,
  className,
  children,
}: {
  title: string
  onClick?: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        'rounded-lg p-2 transition-all hover:bg-muted hover:text-foreground active:scale-95',
        className,
      )}
    >
      {children}
    </button>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// 延迟引用 chatStore，避免循环依赖导致的问题
import { useChatStore } from '@/stores/chatStore'
const useChatActions = () => useChatStore.getState()
