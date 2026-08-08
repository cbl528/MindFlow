import { useEffect, useRef } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { MessageItem } from './MessageItem'
import type { ChatMessage } from '@/types'

interface MessageListProps {
  messages: ChatMessage[]
  sessionId: string
  onAskQuestion: (question: string) => void
}

/** 消息虚拟列表：流式时自动跟随到底部 */
export function MessageList({ messages, sessionId, onAskQuestion }: MessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const isStreaming = messages.some((m) => m.status === 'streaming' || m.status === 'thinking')

  // 会话切换后回到底部
  useEffect(() => {
    virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: 'end' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  return (
    <Virtuoso
      ref={virtuosoRef}
      className="h-full"
      data={messages}
      followOutput={isStreaming ? 'smooth' : 'auto'}
      initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
      itemContent={(_, message) => (
        <div className="mx-auto w-full max-w-[860px] px-4 md:px-6">
          <MessageItem message={message} sessionId={sessionId} onAskQuestion={onAskQuestion} />
        </div>
      )}
    />
  )
}
