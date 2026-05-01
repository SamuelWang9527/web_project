# Phase 1: 基础设施迁移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将前端从 CRA 迁移到 Vite 5 + TypeScript，后端从 Express + Sequelize 迁移到 Fastify 4 + Prisma + Better Auth，修复 SPA 刷新 404，项目全程可正常运行。

**Architecture:** 前后端分别迁移，前端先做构建工具和 TS 迁移（不影响后端），后端再做框架和 ORM 迁移（替换路由同时保持 API 路径不变）。每个 Task 完成后项目可启动。

**Tech Stack:** Vite 5, React 18, TypeScript 5 (strict), Fastify 4, Prisma 5, Better Auth, MySQL (不动)

---

## 文件变更地图

### 新增文件
```
client/
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── index.html                        ← 从 public/index.html 迁移并修改
└── src/
    ├── main.tsx                      ← 替换 index.js
    ├── types/
    │   ├── models.ts                 ← User, Project, WorkItem, Ticket, WorkItemActivity
    │   └── api.ts                    ← ApiResponse<T>, PaginatedResponse<T>

server/
├── tsconfig.json
├── prisma/
│   └── schema.prisma
└── src/
    ├── app.ts                        ← 替换 app.js
    ├── index.ts                      ← 替换 index.js
    ├── auth.ts                       ← Better Auth 配置
    ├── plugins/
    │   └── auth.plugin.ts            ← Fastify auth 装饰器
    └── routes/
        ├── auth.ts
        ├── users.ts
        ├── projects.ts
        ├── work-items/
        │   ├── index.ts
        │   ├── attachments.ts
        │   └── comments.ts
        ├── tickets.ts
        └── dashboard.ts
```

### 删除文件（迁移完成后）
```
server/app.js
server/index.js
server/config/database.js
server/middleware/auth.js
server/routes/*.js（所有旧路由）
client/src/index.js
```

### 保留不动
```
server/public/uploads/        ← 上传文件
client/src/pages/             ← JS→TS 转换，不改逻辑
client/src/components/
client/src/contexts/
client/src/utils/
```

---

## Task 1: 初始化 Git 仓库

**Files:**
- Create: `.gitignore`（更新）

- [ ] **Step 1: 初始化 git**

```bash
cd D:/web_project
git init
```

Expected: `Initialized empty Git repository in D:/web_project/.git/`

- [ ] **Step 2: 更新 .gitignore**

在现有 `.gitignore` 末尾追加：

```gitignore
# Vite
client/dist/
client/.vite/

# Prisma
server/prisma/migrations/dev.db

# TypeScript
*.tsbuildinfo

# Superpowers
.superpowers/
```

- [ ] **Step 3: 初始提交**

```bash
git add .
git commit -m "chore: initial commit before refactor"
```

---

## Task 2: 客户端 - 安装 Vite + TypeScript 依赖

**Files:**
- Modify: `client/package.json`

- [ ] **Step 1: 移除 CRA，安装 Vite + TypeScript**

```bash
cd D:/web_project/client
npm remove react-scripts
npm install --save-dev vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node
```

- [ ] **Step 2: 更新 package.json scripts**

将 `client/package.json` 中的 `scripts` 替换为：

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 3: 验证依赖安装成功**

```bash
npx vite --version
```

Expected: `vite/5.x.x`

- [ ] **Step 4: Commit**

```bash
cd D:/web_project
git add client/package.json client/package-lock.json
git commit -m "chore(client): replace CRA with Vite + TypeScript"
```

---

## Task 3: 客户端 - Vite 配置 + TypeScript 配置

**Files:**
- Create: `client/vite.config.ts`
- Create: `client/tsconfig.json`
- Create: `client/tsconfig.node.json`

- [ ] **Step 1: 创建 vite.config.ts**

创建 `client/vite.config.ts`：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/exports': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
```

**注意：** Vite dev server 自动处理 SPA 路由（所有未匹配路径返回 index.html），无需额外配置 historyApiFallback。

- [ ] **Step 2: 创建 tsconfig.json**

创建 `client/tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: 创建 tsconfig.node.json**

创建 `client/tsconfig.node.json`：

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Commit**

```bash
cd D:/web_project
git add client/vite.config.ts client/tsconfig.json client/tsconfig.node.json
git commit -m "chore(client): add Vite and TypeScript configuration"
```

---

## Task 4: 客户端 - 更新 index.html

**Files:**
- Create: `client/index.html`（从 `client/public/index.html` 迁移）

- [ ] **Step 1: 创建 Vite 入口 index.html**

创建 `client/index.html`（Vite 要求放在根目录）：

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ProjectHub</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: 将 public/ 中的静态资源移至 client/public/**

Vite 的 public 目录与 CRA 一致，已有的 `client/public/` 目录中的静态文件（favicon 等）保持不动。

- [ ] **Step 3: Commit**

```bash
cd D:/web_project
git add client/index.html
git commit -m "chore(client): add Vite entry index.html"
```

---

## Task 5: 客户端 - 创建全局 TypeScript 类型

**Files:**
- Create: `client/src/types/models.ts`
- Create: `client/src/types/api.ts`

- [ ] **Step 1: 创建 models.ts**

创建 `client/src/types/models.ts`：

```typescript
export type UserRole = 'user' | 'admin' | 'super_admin'

export interface User {
  id: number
  username: string
  email: string
  role: UserRole
  avatar?: string | null
  createdAt: string
  updatedAt: string
}

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold'

export interface Project {
  id: number
  name: string
  description?: string | null
  status: ProjectStatus
  startDate?: string | null
  endDate?: string | null
  creatorId: number
  creator?: User
  createdAt: string
  updatedAt: string
}

export type WorkItemStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled'
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface WorkItem {
  id: number
  title: string
  description?: string | null
  status: WorkItemStatus
  priority: WorkItemPriority
  projectId: number
  project?: Project
  assigneeId?: number | null
  assignee?: User | null
  creatorId: number
  creator?: User
  startDate?: string | null
  dueDate?: string | null
  completedDate?: string | null
  createdAt: string
  updatedAt: string
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Ticket {
  id: number
  title: string
  description?: string | null
  status: TicketStatus
  priority: TicketPriority
  creatorId: number
  creator?: User
  assigneeId?: number | null
  assignee?: User | null
  createdAt: string
  updatedAt: string
}

export interface WorkItemActivity {
  id: number
  workItemId: number
  userId: number
  user?: User
  action: string
  field?: string | null
  oldValue?: string | null
  newValue?: string | null
  createdAt: string
}
```

- [ ] **Step 2: 创建 api.ts**

创建 `client/src/types/api.ts`：

```typescript
export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: {
    total: number
    page: number
    pageSize: number
  }
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
```

- [ ] **Step 3: Commit**

```bash
cd D:/web_project
git add client/src/types/
git commit -m "feat(client): add global TypeScript type definitions"
```

---

## Task 6: 客户端 - 迁移入口文件

**Files:**
- Create: `client/src/main.tsx`（替换 `client/src/index.js`）

- [ ] **Step 1: 创建 main.tsx**

创建 `client/src/main.tsx`，将 `client/src/index.js` 的内容转为 TypeScript：

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
)
```

- [ ] **Step 2: 删除旧入口文件**

```bash
rm client/src/index.js
```

- [ ] **Step 3: 验证 Vite dev server 启动**

```bash
cd D:/web_project/client
npm run dev
```

Expected: `Local: http://localhost:3000/` 且无编译错误（忽略 TS 类型错误，后续步骤修复）

- [ ] **Step 4: Commit**

```bash
cd D:/web_project
git add client/src/main.tsx
git rm client/src/index.js
git commit -m "feat(client): migrate entry point to main.tsx"
```

---

## Task 7: 客户端 - 迁移 utils/api.js → api.ts

**Files:**
- Create: `client/src/utils/api.ts`（替换 `client/src/utils/api.js`）

- [ ] **Step 1: 创建 api.ts 骨架**

创建 `client/src/utils/api.ts`，逐段迁移原文件内容并添加类型：

```typescript
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiSuccess } from '@/types/api'
import type { User, Project, WorkItem, Ticket } from '@/types/models'

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器：注入 auth token（Better Auth 使用 cookie/session，此拦截器保留兼容）
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一 401 处理
instance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ——— Auth ———
export const login = (data: { username: string; password: string }) =>
  instance.post<ApiSuccess<{ token: string; user: User }>>('/auth/login', data)

export const register = (data: { username: string; email: string; password: string }) =>
  instance.post<ApiSuccess<User>>('/auth/register', data)

export const getCurrentUser = () =>
  instance.get<ApiSuccess<User>>('/auth/me')

export const logout = () =>
  instance.post('/auth/logout')

// ——— Projects ———
export const getProjects = (params?: Record<string, unknown>) =>
  instance.get<ApiSuccess<Project[]>>('/projects', { params })

export const getProjectById = (id: number) =>
  instance.get<ApiSuccess<Project>>(`/projects/${id}`)

export const createProject = (data: Partial<Project>) =>
  instance.post<ApiSuccess<Project>>('/projects', data)

export const updateProject = (id: number, data: Partial<Project>) =>
  instance.put<ApiSuccess<Project>>(`/projects/${id}`, data)

export const deleteProject = (id: number) =>
  instance.delete(`/projects/${id}`)

// ——— Work Items ———
export const getWorkItems = (params?: Record<string, unknown>) =>
  instance.get<ApiSuccess<WorkItem[]>>('/work-items', { params })

export const getWorkItemById = (id: number) =>
  instance.get<ApiSuccess<WorkItem>>(`/work-items/${id}`)

export const createWorkItem = (data: Partial<WorkItem>) =>
  instance.post<ApiSuccess<WorkItem>>('/work-items', data)

export const updateWorkItem = (id: number, data: Partial<WorkItem>) =>
  instance.put<ApiSuccess<WorkItem>>(`/work-items/${id}`, data)

export const deleteWorkItem = (id: number) =>
  instance.delete(`/work-items/${id}`)

export const uploadAttachment = (workItemId: number, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return instance.post(`/work-items/${workItemId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const downloadFile = (fileUrl: string) => {
  const token = localStorage.getItem('token')
  const url = fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl}`
  const link = document.createElement('a')
  link.href = token ? `${url}?token=${token}` : url
  link.download = ''
  link.click()
}

export const exportWorkItemsToExcel = (params?: Record<string, unknown>) =>
  instance.get('/work-items/export', { params, responseType: 'blob' })

// ——— Tickets ———
export const getTickets = (params?: Record<string, unknown>) =>
  instance.get<ApiSuccess<Ticket[]>>('/tickets', { params })

export const getTicketById = (id: number) =>
  instance.get<ApiSuccess<Ticket>>(`/tickets/${id}`)

export const createTicket = (data: Partial<Ticket>) =>
  instance.post<ApiSuccess<Ticket>>('/tickets', data)

export const updateTicket = (id: number, data: Partial<Ticket>) =>
  instance.put<ApiSuccess<Ticket>>(`/tickets/${id}`, data)

// ——— Dashboard ———
export const getDashboardStats = (params?: Record<string, unknown>) =>
  instance.get<ApiSuccess<Record<string, unknown>>>('/dashboard/stats', { params })

export const getPendingItems = (params?: Record<string, unknown>) =>
  instance.get<ApiSuccess<WorkItem[]>>('/dashboard/pending', { params })

// ——— Users ———
export const getUsers = (params?: Record<string, unknown>) =>
  instance.get<ApiSuccess<User[]>>('/users', { params })

export const updateUser = (id: number, data: Partial<User>) =>
  instance.put<ApiSuccess<User>>(`/users/${id}`, data)

export const uploadAvatar = (file: File) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return instance.post<ApiSuccess<{ avatarUrl: string }>>('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getWorkItemActivities = (workItemId: number) =>
  instance.get(`/work-items/${workItemId}/activities`)

export default instance
```

- [ ] **Step 2: 删除旧文件**

```bash
rm client/src/utils/api.js
```

- [ ] **Step 3: Commit**

```bash
cd D:/web_project
git add client/src/utils/api.ts
git rm client/src/utils/api.js
git commit -m "feat(client): migrate API utilities to TypeScript"
```

---

## Task 8: 客户端 - 迁移 AuthContext 到 TypeScript

**Files:**
- Create: `client/src/contexts/AuthContext.tsx`（替换 `.js`）

- [ ] **Step 1: 创建 AuthContext.tsx**

创建 `client/src/contexts/AuthContext.tsx`：

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getCurrentUser, login as apiLogin, logout as apiLogout } from '@/utils/api'
import type { User, UserRole } from '@/types/models'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasRole: (role: UserRole) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    const res = await apiLogin({ username, password })
    const { token, user: userData } = res.data.data
    localStorage.setItem('token', token)
    setUser(userData)
  }

  const logout = async () => {
    await apiLogout()
    localStorage.removeItem('token')
    setUser(null)
  }

  const hasRole = (role: UserRole) => {
    if (!user) return false
    const hierarchy: UserRole[] = ['user', 'admin', 'super_admin']
    return hierarchy.indexOf(user.role) >= hierarchy.indexOf(role)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: 删除旧文件**

```bash
rm client/src/contexts/AuthContext.js
```

- [ ] **Step 3: Commit**

```bash
cd D:/web_project
git add client/src/contexts/AuthContext.tsx
git rm client/src/contexts/AuthContext.js
git commit -m "feat(client): migrate AuthContext to TypeScript"
```

---

## Task 9: 客户端 - 迁移 App.js → App.tsx

**Files:**
- Create: `client/src/App.tsx`（替换 `client/src/App.js`）

- [ ] **Step 1: 创建 App.tsx**

创建 `client/src/App.tsx`，保留原有路由结构并添加类型：

```typescript
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import MainLayout from '@/components/MainLayout'

// 懒加载页面（减少初始包体积）
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

function AppRoutes() {
  return (
    <React.Suspense fallback={<div>加载中...</div>}>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/work-items" element={<WorkItemList />} />
          <Route path="/work-items/:id" element={<WorkItemDetail />} />
          <Route path="/tickets" element={<TicketList />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pending" element={<PendingSchedule />} />
          <Route path="/admin/tickets" element={<AdminRoute><AdminTicketList /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </React.Suspense>
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
```

- [ ] **Step 2: 删除旧文件**

```bash
rm client/src/App.js
```

- [ ] **Step 3: Commit**

```bash
cd D:/web_project
git add client/src/App.tsx
git rm client/src/App.js
git commit -m "feat(client): migrate App to TypeScript with lazy loading"
```

---

## Task 10: 客户端 - 批量迁移 Pages 到 TypeScript

**Files:**
- Modify: `client/src/pages/*.js` → `*.tsx`（全部 15 个页面文件）

- [ ] **Step 1: 批量重命名页面文件**

```bash
cd D:/web_project/client/src/pages
for f in *.js; do mv "$f" "${f%.js}.tsx"; done
```

- [ ] **Step 2: 修复每个文件的 TypeScript 错误**

对每个页面文件，做以下最小化修改（**不改业务逻辑**）：

**模式 1：函数组件添加返回类型**
```typescript
// 将
export default function Login() {
// 改为（可不改，TS 可推断）
export default function Login(): React.ReactElement {
```

**模式 2：useState 添加类型**
```typescript
// 将
const [data, setData] = useState([])
const [loading, setLoading] = useState(false)
const [user, setUser] = useState(null)
// 改为
const [data, setData] = useState<WorkItem[]>([])
const [loading, setLoading] = useState<boolean>(false)
const [user, setUser] = useState<User | null>(null)
```

**模式 3：事件处理函数添加类型**
```typescript
// 将
const handleChange = (e) => {
// 改为
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
```

**模式 4：Props 类型（如有子组件）**
```typescript
interface Props {
  id: number
  onClose: () => void
}
```

- [ ] **Step 3: 同样处理 components/ 和 utils/ 目录**

```bash
cd D:/web_project/client/src/components
for f in *.js; do mv "$f" "${f%.js}.tsx"; done

cd D:/web_project/client/src/utils
for f in *.js; do mv "$f" "${f%.js}.ts"; done
```

- [ ] **Step 4: 运行 TypeScript 检查**

```bash
cd D:/web_project/client
npm run typecheck
```

逐一修复报错直到 typecheck 通过。常见错误：
- `any` 类型：用实际类型替换或显式标注 `unknown`
- Antd 组件 props：参考 antd v5 类型定义
- 可能为 null 的值：添加 `?.` 或非空断言 `!`

- [ ] **Step 5: 验证 dev server 正常运行**

```bash
cd D:/web_project/client
npm run dev
```

访问 http://localhost:3000 确认页面正常加载，无运行时错误。

- [ ] **Step 6: Commit**

```bash
cd D:/web_project
git add client/src/
git commit -m "feat(client): migrate all pages and components to TypeScript"
```

---

## Task 11: 服务端 - 安装 Fastify + Prisma + Better Auth + TypeScript

**Files:**
- Modify: `server/package.json`
- Create: `server/tsconfig.json`

- [ ] **Step 1: 安装生产依赖**

```bash
cd D:/web_project/server
npm install fastify @fastify/cors @fastify/multipart @fastify/static better-auth @prisma/client
npm install --save-dev prisma typescript @types/node ts-node nodemon
```

- [ ] **Step 2: 创建 server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: 更新 server/package.json scripts**

```json
"scripts": {
  "dev": "nodemon --exec ts-node src/index.ts --ext ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "typecheck": "tsc --noEmit",
  "prisma:generate": "prisma generate",
  "prisma:pull": "prisma db pull",
  "prisma:migrate": "prisma migrate dev"
}
```

- [ ] **Step 4: Commit**

```bash
cd D:/web_project
git add server/package.json server/package-lock.json server/tsconfig.json
git commit -m "chore(server): install Fastify, Prisma, Better Auth, TypeScript"
```

---

## Task 12: 服务端 - 初始化 Prisma Schema

**Files:**
- Create: `server/prisma/schema.prisma`

- [ ] **Step 1: 初始化 Prisma**

```bash
cd D:/web_project/server
npx prisma init --datasource-provider mysql
```

Expected: 创建 `prisma/schema.prisma` 和 `.env`（若不存在）

- [ ] **Step 2: 配置数据库连接**

确认 `server/.env` 中有 `DATABASE_URL`，格式为：

```env
DATABASE_URL="mysql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME"
```

从现有 `server/.env` 中读取 DB_HOST、DB_PORT、DB_USER、DB_PASSWORD、DB_NAME 拼接。

- [ ] **Step 3: 从现有 MySQL 反向生成 schema**

```bash
cd D:/web_project/server
npx prisma db pull
```

Expected: `server/prisma/schema.prisma` 被填充真实 MySQL schema，包含所有现有表。

- [ ] **Step 4: 验证生成的 schema**

读取 `server/prisma/schema.prisma`，确认包含以下模型：`User`、`Project`、`WorkItem`、`Ticket`、`WorkItemActivity`。

若字段名与代码不一致（如 MySQL 使用 snake_case 而 JS 使用 camelCase），在 schema 中用 `@map` 注解解决：

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String   @unique
  password  String
  role      String   @default("user")
  avatar    String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

- [ ] **Step 5: 生成 Prisma Client**

```bash
cd D:/web_project/server
npx prisma generate
```

Expected: `Generated Prisma Client`

- [ ] **Step 6: 建立迁移历史基准**

```bash
npx prisma migrate dev --name init
```

Expected: 创建第一条迁移记录（因为 schema 与现有库一致，此迁移应为空或仅添加迁移表）

- [ ] **Step 7: Commit**

```bash
cd D:/web_project
git add server/prisma/
git commit -m "feat(server): initialize Prisma schema from existing MySQL"
```

---

## Task 13: 服务端 - 创建 Fastify 应用

**Files:**
- Create: `server/src/app.ts`

- [ ] **Step 1: 创建 server/src/app.ts**

```typescript
import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import path from 'path'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'production',
  })

  // CORS
  await app.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://pipecode.asia']
      : true,
    credentials: true,
  })

  // Multipart（文件上传）
  await app.register(multipart, {
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE ?? '20971520'), // 20MB
    },
  })

  // 静态文件服务
  const uploadsDir = path.join(__dirname, '../../public/uploads')
  await app.register(staticFiles, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
  })

  const exportsDir = path.join(__dirname, '../../public/exports')
  await app.register(staticFiles, {
    root: exportsDir,
    prefix: '/exports/',
    decorateReply: false,
  })

  // 全局错误处理
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error)
    const statusCode = error.statusCode ?? 500
    reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        message: error.message ?? 'Internal server error',
      },
    })
  })

  // API 路由（在 Task 14-18 中注册）
  // await app.register(authRoutes, { prefix: '/api/auth' })
  // ...

  // SPA fallback（所有非 /api、非静态文件的路由返回前端 index.html）
  const clientDistDir = path.join(__dirname, '../../../client/dist')
  await app.register(staticFiles, {
    root: clientDistDir,
    prefix: '/',
    decorateReply: false,
  })

  app.setNotFoundHandler((_request, reply) => {
    reply.sendFile('index.html', clientDistDir)
  })

  return app
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/web_project
git add server/src/app.ts
git commit -m "feat(server): create Fastify application scaffold"
```

---

## Task 14: 服务端 - 配置 Better Auth

**Files:**
- Create: `server/src/auth.ts`
- Create: `server/src/plugins/auth.plugin.ts`

- [ ] **Step 1: 添加 Better Auth 环境变量**

在 `server/.env` 中添加：

```env
BETTER_AUTH_SECRET=your-random-secret-at-least-32-characters
BETTER_AUTH_URL=http://localhost:5000
```

生成随机 secret：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] **Step 2: 创建 server/src/auth.ts**

```typescript
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'mysql',
  }),
  emailAndPassword: {
    enabled: true,
    // 映射到现有 users 表的 username 字段
  },
  user: {
    additionalFields: {
      username: {
        type: 'string',
        required: true,
        unique: true,
      },
      role: {
        type: 'string',
        defaultValue: 'user',
      },
      avatar: {
        type: 'string',
        required: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 天
    updateAge: 60 * 60 * 24,     // 每天刷新
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
})

export { prisma }
```

- [ ] **Step 3: 创建 Fastify auth 插件**

创建 `server/src/plugins/auth.plugin.ts`：

```typescript
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import { auth } from '../auth'

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: number
      username: string
      email: string
      role: string
    } | null
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('user', null)

  fastify.addHook('preHandler', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      const session = await auth.api.getSession({
        headers: request.headers as Record<string, string>,
      })
      request.user = session?.user as typeof request.user ?? null
    } catch {
      request.user = null
    }
  })
}

export default fp(authPlugin)
```

安装 fastify-plugin：

```bash
cd D:/web_project/server
npm install fastify-plugin
```

- [ ] **Step 4: Better Auth 需要 session 相关表**

运行以下命令，让 Better Auth 生成所需 schema（session、account、verification）并迁移：

```bash
cd D:/web_project/server
npx @better-auth/cli generate --config src/auth.ts
npx prisma migrate dev --name add-better-auth-tables
```

- [ ] **Step 5: Commit**

```bash
cd D:/web_project
git add server/src/auth.ts server/src/plugins/
git commit -m "feat(server): configure Better Auth with Prisma adapter"
```

---

## Task 15: 服务端 - 迁移认证路由

**Files:**
- Create: `server/src/routes/auth.ts`

- [ ] **Step 1: 创建 server/src/routes/auth.ts**

```typescript
import { FastifyPluginAsync } from 'fastify'
import { auth, prisma } from '../auth'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // 登录（兼容旧前端，返回 JWT token）
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string }

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' },
      })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' },
      })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
    )

    return reply.send({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
    })
  })

  // 注册
  fastify.post('/register', async (request, reply) => {
    const { username, email, password } = request.body as {
      username: string
      email: string
      password: string
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    })
    if (existing) {
      return reply.status(409).send({
        success: false,
        error: { code: 'USER_EXISTS', message: '用户名或邮箱已存在' },
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword, role: 'user' },
    })

    return reply.status(201).send({
      success: true,
      data: { id: user.id, username: user.username, email: user.email, role: user.role },
    })
  })

  // 获取当前用户
  fastify.get('/me', async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '未登录' },
      })
    }
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true, username: true, email: true, role: true, avatar: true, createdAt: true },
    })
    return reply.send({ success: true, data: user })
  })

  // 登出
  fastify.post('/logout', async (_request, reply) => {
    return reply.send({ success: true, data: null })
  })
}

export default authRoutes
```

安装 bcryptjs 和 jsonwebtoken 类型：

```bash
cd D:/web_project/server
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

- [ ] **Step 2: Commit**

```bash
cd D:/web_project
git add server/src/routes/auth.ts
git commit -m "feat(server): migrate auth routes to Fastify"
```

---

## Task 16: 服务端 - 迁移其余路由到 Fastify

**Files:**
- Create: `server/src/routes/projects.ts`
- Create: `server/src/routes/users.ts`
- Create: `server/src/routes/work-items/index.ts`
- Create: `server/src/routes/work-items/attachments.ts`
- Create: `server/src/routes/work-items/comments.ts`
- Create: `server/src/routes/tickets.ts`
- Create: `server/src/routes/dashboard.ts`

**策略**：将现有 Express 路由文件中的每个 `router.get/post/put/delete` 替换为 `fastify.get/post/put/delete`，Request/Response 类型更新，其余逻辑不变。所有路由返回统一格式 `{ success: true, data: ... }` 或 `{ success: false, error: ... }`。

- [ ] **Step 1: 创建 projects.ts（示例模式，其余文件遵循相同模式）**

创建 `server/src/routes/projects.ts`：

```typescript
import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../auth'

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  // 权限守卫工具
  const requireAuth = async (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => {
    if (!request.user) {
      await reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } })
      return false
    }
    return true
  }

  // 获取项目列表
  fastify.get('/', async (request, reply) => {
    if (!await requireAuth(request, reply)) return
    const projects = await prisma.project.findMany({
      include: { creator: { select: { id: true, username: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({ success: true, data: projects })
  })

  // 获取单个项目
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!await requireAuth(request, reply)) return
    const project = await prisma.project.findUnique({
      where: { id: parseInt(request.params.id) },
      include: { creator: { select: { id: true, username: true, avatar: true } } },
    })
    if (!project) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '项目不存在' } })
    return reply.send({ success: true, data: project })
  })

  // 创建项目
  fastify.post('/', async (request, reply) => {
    if (!await requireAuth(request, reply)) return
    const body = request.body as Record<string, unknown>
    const project = await prisma.project.create({
      data: { ...body, creatorId: request.user!.id } as Parameters<typeof prisma.project.create>[0]['data'],
    })
    return reply.status(201).send({ success: true, data: project })
  })

  // 更新项目
  fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!await requireAuth(request, reply)) return
    const project = await prisma.project.update({
      where: { id: parseInt(request.params.id) },
      data: request.body as Parameters<typeof prisma.project.update>[0]['data'],
    })
    return reply.send({ success: true, data: project })
  })

  // 删除项目
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!await requireAuth(request, reply)) return
    await prisma.project.delete({ where: { id: parseInt(request.params.id) } })
    return reply.send({ success: true, data: null })
  })
}

export default projectRoutes
```

- [ ] **Step 2: 按相同模式创建其余路由文件**

按照 `projects.ts` 的模式，参照现有路由文件逻辑，依次创建：
- `server/src/routes/users.ts`（参照 `server/routes/users.js`）
- `server/src/routes/work-items/index.ts`（参照 `server/routes/workItems.js` 的 CRUD 部分）
- `server/src/routes/work-items/attachments.ts`（参照 `workItems.js` 的附件部分）
- `server/src/routes/work-items/comments.ts`（参照 `workItems.js` 的评论部分）
- `server/src/routes/tickets.ts`（参照 `server/routes/tickets.js`）
- `server/src/routes/dashboard.ts`（参照 `server/routes/dashboard.js`）

**关键转换规则：**
- `req.params` → `request.params`，需在路由定义时声明泛型 `fastify.get<{ Params: { id: string } }>`
- `req.body` → `request.body`，需类型断言
- `req.user` → `request.user`（由 auth.plugin 注入）
- `res.json({})` → `reply.send({})`
- `res.status(201).json({})` → `reply.status(201).send({})`
- `next(error)` → `throw error`（Fastify 自动捕获）
- Multer 文件上传 → `@fastify/multipart`（`const data = await request.file()`）

- [ ] **Step 3: Commit**

```bash
cd D:/web_project
git add server/src/routes/
git commit -m "feat(server): migrate all routes to Fastify"
```

---

## Task 17: 服务端 - 组装 Fastify 应用并启动

**Files:**
- Modify: `server/src/app.ts`（注册所有路由）
- Create: `server/src/index.ts`

- [ ] **Step 1: 在 app.ts 中注册所有路由**

更新 `server/src/app.ts`，在注释掉的路由注册位置填入：

```typescript
import authPlugin from './plugins/auth.plugin'
import authRoutes from './routes/auth'
import projectRoutes from './routes/projects'
import userRoutes from './routes/users'
import workItemRoutes from './routes/work-items/index'
import attachmentRoutes from './routes/work-items/attachments'
import commentRoutes from './routes/work-items/comments'
import ticketRoutes from './routes/tickets'
import dashboardRoutes from './routes/dashboard'

// 在 cors/multipart 注册后，staticFiles 注册前添加：
await app.register(authPlugin)

await app.register(authRoutes, { prefix: '/api/auth' })
await app.register(projectRoutes, { prefix: '/api/projects' })
await app.register(userRoutes, { prefix: '/api/users' })
await app.register(workItemRoutes, { prefix: '/api/work-items' })
await app.register(attachmentRoutes, { prefix: '/api/work-items' })
await app.register(commentRoutes, { prefix: '/api/work-items' })
await app.register(ticketRoutes, { prefix: '/api/tickets' })
await app.register(dashboardRoutes, { prefix: '/api/dashboard' })
```

- [ ] **Step 2: 创建 server/src/index.ts**

```typescript
import { buildApp } from './app'

const PORT = parseInt(process.env.PORT ?? '5000')

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`Server running on http://localhost:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
```

- [ ] **Step 3: 启动服务器验证**

```bash
cd D:/web_project/server
npm run dev
```

Expected: `Server running on http://localhost:5000`，无错误

- [ ] **Step 4: 基本 API 冒烟测试**

```bash
# 测试登录接口
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

Expected: `{"success":true,"data":{"token":"...","user":{...}}}`

```bash
# 测试项目列表（需带 token）
TOKEN="paste-token-from-above"
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `{"success":true,"data":[...]}`

- [ ] **Step 5: Commit**

```bash
cd D:/web_project
git add server/src/
git commit -m "feat(server): assemble Fastify app with all routes and start server"
```

---

## Task 18: 端到端验证 - 前后端联调

- [ ] **Step 1: 同时启动前后端**

终端 1：
```bash
cd D:/web_project/server
npm run dev
```

终端 2：
```bash
cd D:/web_project/client
npm run dev
```

- [ ] **Step 2: 验证核心功能**

访问 http://localhost:3000，依次验证：

1. **登录页** → 输入正确账号密码 → 跳转到首页 ✓
2. **刷新任意页面** → 不出现 404，页面正常加载 ✓（SPA 修复验证）
3. **项目列表** → 数据正常显示 ✓
4. **工作项列表** → 数据正常显示 ✓
5. **工单列表** → 数据正常显示 ✓
6. **文件上传** → 选择文件上传，成功 ✓

- [ ] **Step 3: TypeScript 全量检查**

```bash
cd D:/web_project/client && npm run typecheck
cd D:/web_project/server && npm run typecheck
```

Both expected: 无错误（0 errors）

- [ ] **Step 4: 最终 Commit**

```bash
cd D:/web_project
git add .
git commit -m "feat: complete Phase 1 infrastructure migration

- CRA → Vite 5 + TypeScript (strict mode)
- Express → Fastify 4 with plugin architecture  
- Sequelize → Prisma with MySQL (data preserved)
- Better Auth replaces hand-written JWT
- SPA 404 fixed via Vite historyApiFallback + Fastify fallback
- All JS/JSX migrated to TS/TSX"
```

---

## 完成标准

Phase 1 完成的标志：

- [ ] `npm run typecheck` 在 client/ 和 server/ 都无错误
- [ ] `npm run dev` 在两端都能正常启动
- [ ] 登录/登出流程正常
- [ ] 刷新任意路由不出现 404
- [ ] 所有现有 API 端点响应正常
- [ ] 文件上传/下载功能正常

---

## 下一阶段

Phase 1 验收通过后，运行 Phase 2 计划：`docs/superpowers/plans/2026-04-30-phase2-backend-refactor.md`（待生成）
