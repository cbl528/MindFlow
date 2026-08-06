import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <p className="text-5xl font-bold text-primary">404</p>
      <p className="text-muted-foreground">页面不存在或已被移除</p>
      <Link to="/chat" className="ds-btn-primary">
        返回对话
      </Link>
    </div>
  )
}
