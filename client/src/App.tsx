import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

// 懒加载页面
const Login = React.lazy(() => import('@/pages/Login'))
const Register = React.lazy(() => import('@/pages/Register'))
const Dashboard = React.lazy(() => import('@/pages/Dashboard'))
const ProjectList = React.lazy(() => import('@/pages/ProjectList'))
const ProjectDetail = React.lazy(() => import('@/pages/ProjectDetail'))
const WorkItemList = React.lazy(() => import('@/pages/WorkItemList'))
const WorkItemDetail = React.lazy(() => import('@/pages/WorkItemDetail'))
const TicketList = React.lazy(() => import('@/pages/TicketList'))
const TicketDetail = React.lazy(() => import('@/pages/TicketDetail'))
const AdminTicketList = React.lazy(() => import('@/pages/AdminTicketList'))
const UserManagement = React.lazy(() => import('@/pages/UserManagement'))
const Profile = React.lazy(() => import('@/pages/Profile'))
const PendingSchedule = React.lazy(() => import('@/pages/PendingSchedule'))
const NotFound = React.lazy(() => import('@/pages/NotFound'))
const MainLayout = React.lazy(() => import('@/components/MainLayout'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div>加载中...</div>
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div>加载中...</div>
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { hasRole, isLoading } = useAuth()
  if (isLoading) return <div>加载中...</div>
  return hasRole('admin') ? <>{children}</> : <Navigate to="/" replace />
}

// 根据角色重定向到对应工单页面
function TicketRoute() {
  const { user } = useAuth()
  if (user?.role === 'admin' || user?.role === 'super_admin') {
    return <Navigate to="/admin/tickets" replace />
  }
  return <TicketList />
}

// 工单详情（路由层注入 isAdmin；id 由 TicketDetail 内 useParams 读取）
function TicketDetailRoute() {
  const { hasRole } = useAuth()
  return <TicketDetail isAdmin={hasRole('admin')} />
}

function AppRoutes() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>加载中...</div>}>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="work-items" element={<WorkItemList />} />
            <Route path="work-items/:id" element={<WorkItemDetail />} />
            <Route path="tickets" element={<TicketRoute />} />
            <Route path="tickets/:id" element={<TicketDetailRoute />} />
            <Route path="profile" element={<Profile />} />
            <Route path="pending" element={<PendingSchedule />} />
            <Route path="admin/tickets" element={<AdminRoute><AdminTicketList /></AdminRoute>} />
            <Route path="admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
