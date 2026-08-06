import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/** 相对时间：刚刚 / N 分钟前 / N 小时前 / 日期 */
export function relativeTime(input?: string | number | null): string {
  if (!input) return ''
  const ts = typeof input === 'number' ? input : new Date(input).getTime()
  if (Number.isNaN(ts)) return ''
  const diff = Date.now() - ts
  const min = 60_000
  const hour = 3_600_000
  const day = 86_400_000
  if (diff < min) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / min)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < day * 30) return `${Math.floor(diff / day)} 天前`
  return format(ts, 'yyyy-MM-dd', { locale: zhCN })
}

/** 分组标题：今天 / 昨天 / 近 7 天 / 更早 */
export function sessionGroupLabel(ts: number): string {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const day = 86_400_000
  if (ts >= startOfToday) return '今天'
  if (ts >= startOfToday - day) return '昨天'
  if (ts >= startOfToday - 7 * day) return '近 7 天'
  return '更早'
}

export function formatDateTime(input?: string | null): string {
  if (!input) return ''
  const ts = new Date(input).getTime()
  if (Number.isNaN(ts)) return ''
  return format(ts, 'yyyy-MM-dd HH:mm', { locale: zhCN })
}
