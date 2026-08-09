import type { ReactNode } from 'react'
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import LoginPage from '@/pages/LoginPage'
import ChatPage from '@/pages/ChatPage'
import DocPreviewPage from '@/pages/DocPreviewPage'
import NotFoundPage from '@/pages/NotFoundPage'
import AdminLayout from '@/pages/admin/AdminLayout'
import DashboardPage from '@/pages/admin/DashboardPage'
import KnowledgeListPage from '@/pages/admin/knowledge/KnowledgeListPage'
import KnowledgeDocumentsPage from '@/pages/admin/knowledge/KnowledgeDocumentsPage'
import KnowledgeChunksPage from '@/pages/admin/knowledge/KnowledgeChunksPage'
import IntentTreePage from '@/pages/admin/intent/IntentTreePage'
import IntentListPage from '@/pages/admin/intent/IntentListPage'
import IntentEditPage from '@/pages/admin/intent/IntentEditPage'
import IngestionPage from '@/pages/admin/ingestion/IngestionPage'
import QueryTermMappingPage from '@/pages/admin/queryTermMapping/QueryTermMappingPage'
import RagTracePage from '@/pages/admin/traces/RagTracePage'
import RagTraceDetailPage from '@/pages/admin/traces/RagTraceDetailPage'
import ChangeLogPage from '@/pages/admin/ChangeLogPage'
import SampleQuestionPage from '@/pages/admin/SampleQuestionPage'
import UserListPage from '@/pages/admin/UserListPage'

function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.user?.role)
  if (role !== 'admin') return <Navigate to="/chat" replace />
  return <>{children}</>
}

function RedirectIfAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/chat" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RedirectIfAuth>
        <LoginPage />
      </RedirectIfAuth>
    ),
  },
  {
    element: <RequireAuth />,
    children: [
      { path: '/', element: <Navigate to="/chat" replace /> },
      { path: '/chat', element: <ChatPage /> },
      { path: '/chat/:sessionId', element: <ChatPage /> },
      { path: '/preview/doc/:docId', element: <DocPreviewPage /> },
      { path: '/change-logs', element: <ChangeLogPage /> },
      {
        path: '/admin',
        element: (
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        ),
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'knowledge', element: <KnowledgeListPage /> },
          { path: 'knowledge/:kbId', element: <KnowledgeDocumentsPage /> },
          { path: 'knowledge/:kbId/docs/:docId', element: <KnowledgeChunksPage /> },
          { path: 'intent-tree', element: <IntentTreePage /> },
          { path: 'intent-list', element: <IntentListPage /> },
          { path: 'intent-list/:id/edit', element: <IntentEditPage /> },
          { path: 'ingestion', element: <IngestionPage /> },
          { path: 'mappings', element: <QueryTermMappingPage /> },
          { path: 'traces', element: <RagTracePage /> },
          { path: 'traces/:traceId', element: <RagTraceDetailPage /> },
          { path: 'change-logs', element: <ChangeLogPage /> },
          { path: 'sample-questions', element: <SampleQuestionPage /> },
          { path: 'users', element: <UserListPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
