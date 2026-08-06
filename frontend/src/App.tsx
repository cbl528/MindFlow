import { Component, type ReactNode } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { router } from './router'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(err: unknown) {
    console.error('应用渲染错误:', err)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <p className="text-lg font-medium">页面出错了</p>
          <button className="ds-btn-secondary" onClick={() => window.location.reload()}>
            重新加载
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        richColors
        toastOptions={{ style: { fontFamily: 'inherit' } }}
      />
    </ErrorBoundary>
  )
}
