import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ExternalLink, FileText } from 'lucide-react'
import type { SourceRef } from '@/types'
import { cn } from '@/lib/utils'

interface SourcesSectionProps {
  sources: SourceRef[]
  highlightIndex?: number | null
  open?: boolean
  onToggle?: (open: boolean) => void
}

/** 参考来源列表（DeepSeek 式）：可折叠，角标点击可高亮对应来源 */
export function SourcesSection({ sources, highlightIndex, open, onToggle }: SourcesSectionProps) {
  const [innerOpen, setInnerOpen] = useState(false)
  const isOpen = open ?? innerOpen
  const setOpen = (v: boolean) => {
    setInnerOpen(v)
    onToggle?.(v)
  }
  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="font-medium">来源 {sources.length} 个</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {sources.map((s, i) => (
            <div
              key={s.docId + i}
              className={cn(
                'flex flex-col gap-1 rounded-lg border border-border p-3 text-sm transition-colors',
                highlightIndex === s.index && 'border-primary bg-accent',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                  {s.index}
                </span>
                <span className="truncate font-medium">{s.docName || '未命名文档'}</span>
              </div>
              {s.excerpt && (
                <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{s.excerpt}</p>
              )}
              <Link
                to={`/preview/doc/${s.docId}`}
                target="_blank"
                className="mt-1 inline-flex w-fit items-center gap-1 text-xs text-primary hover:underline"
              >
                <FileText className="h-3 w-3" />
                预览原文
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
