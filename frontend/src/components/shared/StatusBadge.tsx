import { Badge } from '@/components/ui/badge'

const STATUS_MAP: Record<string, string> = {
  success: 'success',
  running: 'warning',
  pending: 'secondary',
  failed: 'destructive',
  NORMAL: 'success',
  INTERRUPTED: 'warning',
  REJECTED: 'destructive',
  ENABLED: 'success',
  DISABLED: 'secondary',
  COMPLETED: 'success',
}

const LABEL_MAP: Record<string, string> = {
  pending: '待处理',
  running: '进行中',
  success: '成功',
  failed: '失败',
  NORMAL: '正常',
  INTERRUPTED: '已中断',
  REJECTED: '已拒绝',
}

/** 状态 → 徽章，未识别状态显示灰色 outline */
export function StatusBadge({ status }: { status?: string | null }) {
  const s = status ?? ''
  const variant = (STATUS_MAP[s.toUpperCase()] ?? 'outline') as
    | 'success'
    | 'warning'
    | 'secondary'
    | 'destructive'
    | 'outline'
  const label = LABEL_MAP[s.toLowerCase()] ?? s
  return <Badge variant={variant}>{label}</Badge>
}
