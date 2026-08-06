import { cn } from '@/lib/utils'

/** MindFlow 标志：渐变蓝紫圆角方块 + 三条波纹（象征流式知识） */
export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mf-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4D6BFE" />
          <stop offset="1" stopColor="#7B5CFF" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#mf-logo-g)" />
      <path d="M9 11h14v2.5H9zM9 16h14v2.5H9zM9 21h9v2.5H9z" fill="#fff" />
    </svg>
  )
}
