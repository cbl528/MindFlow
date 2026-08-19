import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  pageNo: number
  pageSize: number
  total: number
  onChange: (pageNo: number) => void
  className?: string
}

/** 极简分页（仿 DeepSeek 风格）：共 N 条 + 上一页/页码/下一页 */
export function Pagination({ pageNo, pageSize, total, onChange, className }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))

  const items: (number | '…')[] = []
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) items.push(i)
  } else {
    items.push(1)
    if (pageNo > 3) items.push('…')
    for (let i = Math.max(2, pageNo - 1); i <= Math.min(pages - 1, pageNo + 1); i++) items.push(i)
    if (pageNo < pages - 2) items.push('…')
    items.push(pages)
  }

  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <span>共 {total} 条</span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={pageNo <= 1}
          onClick={() => onChange(pageNo - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {items.map((item, i) =>
          item === '…' ? (
            <span key={`e${i}`} className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onChange(item)}
              className={cn(
                'h-8 min-w-8 cursor-pointer rounded-lg px-2 text-sm transition-all active:scale-95',
                item === pageNo
                  ? 'bg-primary font-medium text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item}
            </button>
          ),
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={pageNo >= pages}
          onClick={() => onChange(pageNo + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
