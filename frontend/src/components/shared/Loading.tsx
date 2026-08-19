import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Loading({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2.5 py-12 text-muted-foreground', className)}>
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-base">{label ?? '加载中…'}</span>
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin', className)} />
}
