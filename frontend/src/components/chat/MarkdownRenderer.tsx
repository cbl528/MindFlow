import { memo, useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check } from 'lucide-react'
import { remarkCitations } from './citations'
import { cn } from '@/lib/utils'

/** 来源角标 [N] */
export function Citation({
  index,
  onOpen,
}: {
  index: number
  onOpen?: (index: number) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(index)}
      className="citation-ref"
      title={`参考来源 ${index}`}
    >
      {index}
    </button>
  )
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="group my-3 overflow-hidden rounded-xl border border-border bg-[#f6f7f9] dark:bg-[#262626]">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <span className="text-sm text-muted-foreground">{lang || 'code'}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          /* 忽略 */
        }
      }}
      className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

interface MarkdownRendererProps {
  content: string
  onCitation?: (index: number) => void
  className?: string
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  onCitation,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={cn('prose-chat', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkCitations]}
        components={
          {
            citation: ({ node }: { node?: { data?: { index?: number } } }) => {
              const index = node?.data?.index ?? 0
              return <Citation index={index} onOpen={onCitation} />
            },
          a: ({ href, children }: { href?: string; children?: ReactNode }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          pre: ({ children }: { children?: ReactNode }) => <>{children}</>,
          code: ({
            className: cl,
            children,
          }: {
            className?: string
            children?: ReactNode
          }) => {
            const match = /language-(\w+)/.exec(cl ?? '')
            const code = String(children ?? '').replace(/\n$/, '')
            if (match || (typeof children === 'string' && children.includes('\n'))) {
              return <CodeBlock lang={match?.[1] ?? ''} code={code} />
            }
            return <code className={cl}>{children}</code>
          },
          img: ({ src, alt }: { src?: string; alt?: string }) => (
            <img src={src} alt={alt ?? ''} className="max-h-96 rounded-lg" loading="lazy" />
          ),
          table: ({ children }: { children?: ReactNode }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }: { children?: ReactNode }) => (
            <th className="border-b border-border bg-muted/50 px-4 py-2.5 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }: { children?: ReactNode }) => (
            <td className="border-b border-border/60 px-4 py-2.5">{children}</td>
          ),
          } as never
        }
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
