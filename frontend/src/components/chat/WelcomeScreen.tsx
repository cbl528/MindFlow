import { useEffect, useState } from 'react'
import { sampleQuestionService } from '@/services/sampleQuestionService'
import { Logo } from '@/components/shared/Logo'
import { Skeleton } from '@/components/ui/skeleton'
import type { SampleQuestionVO } from '@/types'

interface WelcomeScreenProps {
  onAsk: (question: string) => void
}

const FALLBACK: SampleQuestionVO[] = [
  { id: 'f1', title: '帮我总结', description: '如何高效使用知识库检索', question: '如何高效使用知识库检索？' },
  { id: 'f2', title: '告诉我', description: '系统支持哪些文档格式', question: '系统支持哪些文档格式？' },
  { id: 'f3', title: '演示一下', description: '输入一段内容并分块存储', question: '请演示文档分块的完整流程' },
  { id: 'f4', title: '查看', description: '如何配置意图识别树', question: '如何配置意图识别树？' },
  { id: 'f5', title: '了解', description: '如何开启深度思考模式', question: '如何开启深度思考模式？' },
]

export function WelcomeScreen({ onAsk }: WelcomeScreenProps) {
  const [questions, setQuestions] = useState<SampleQuestionVO[] | null>(null)

  useEffect(() => {
    let alive = true
    sampleQuestionService
      .random()
      .then((list) => {
        if (alive) setQuestions(list.length > 0 ? list : FALLBACK)
      })
      .catch(() => {
        if (alive) setQuestions(FALLBACK)
      })
    return () => {
      alive = false
    }
  }, [])

  // 上 3 下 2：前 3 个占满整行（各 1/3），后 2 个与前者同宽但居中缩进，整体呈上宽下窄梯形
  const colClass = (i: number) =>
    i < 3 ? 'sm:col-span-2' : i === 3 ? 'sm:col-start-2 sm:col-span-2' : 'sm:col-span-2'

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 pb-16">
      <div className="mb-6 animate-fade-in-up">
        <Logo size={56} />
      </div>
      <h1 className="mb-8 animate-fade-in-up text-2xl font-semibold tracking-tight text-foreground">
        有什么可以帮您？
      </h1>

      <div className="grid w-full max-w-[720px] grid-cols-1 gap-3 sm:grid-cols-6">
        {(questions ?? Array.from({ length: 5 })).map((q, i) =>
          !questions ? (
            <Skeleton key={i} className={`h-[72px] w-full rounded-xl ${colClass(i)}`} />
          ) : (
            <button
              key={q.id}
              onClick={() => onAsk(q.question)}
              className={`group animate-fade-in-up rounded-xl border border-border p-4 text-left transition-all hover:border-primary/40 hover:bg-accent/60 ${colClass(i)}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <p className="text-sm font-medium text-foreground group-hover:text-primary">
                {q.title || q.question}
              </p>
              {q.description && (
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{q.description}</p>
              )}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
