# Architecture, Performance & Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the project management system with backend pagination/gzip, React Query data caching, component splitting, visual redesign, and unit tests — in that order, each phase buildable and runnable on its own.

**Architecture:** Big-bang refactor across 7 phases: (1) backend pagination + gzip, (2) test infrastructure, (3) React Query + TypeScript hooks, (4) shared components, (5) component splitting, (6) visual redesign + cleanup, (7) unit tests.

**Tech Stack:** React 18 + Vite 8 + TypeScript 6, @tanstack/react-query 5, Ant Design 5 (Token API), Fastify 5 + @fastify/compress, Prisma 7, Vitest + @testing-library/react + MSW 2.

---

## File Map

### New files
```
server/src/lib/pagination.ts
client/src/hooks/useWorkItems.ts
client/src/hooks/useWorkItem.ts
client/src/hooks/useWorkItemMutations.ts
client/src/hooks/useProjects.ts
client/src/hooks/useTickets.ts
client/src/hooks/useDashboard.ts
client/src/hooks/useUsers.ts
client/src/components/common/ErrorBoundary.tsx
client/src/components/common/PageSkeleton.tsx
client/src/components/common/StatusTag.tsx
client/src/components/work-item/WorkItemInfoPanel.tsx
client/src/components/work-item/WorkItemEditForm.tsx
client/src/components/work-item/AttachmentSection.tsx
client/src/components/work-item/CommentSection.tsx
client/src/components/work-item/ActivityTimeline.tsx
client/src/components/work-item/WorkItemFilters.tsx
client/src/components/work-item/WorkItemTable.tsx
client/src/components/dashboard/StatCards.tsx
client/src/components/dashboard/PendingItemsTable.tsx
client/src/components/dashboard/GanttSection.tsx
client/src/test/setup.ts
client/src/test/server.ts
client/src/test/handlers.ts
client/src/test/fixtures/workItems.ts
client/src/test/fixtures/projects.ts
client/src/test/fixtures/tickets.ts
client/src/hooks/__tests__/useWorkItems.test.ts
client/src/hooks/__tests__/useWorkItem.test.ts
client/src/hooks/__tests__/useWorkItemMutations.test.ts
client/src/components/common/__tests__/ErrorBoundary.test.tsx
client/src/components/common/__tests__/PageSkeleton.test.tsx
client/src/components/common/__tests__/StatusTag.test.tsx
client/src/contexts/__tests__/AuthContext.test.tsx
server/vitest.config.ts
server/src/lib/__tests__/pagination.test.ts
server/src/plugins/__tests__/auth.plugin.test.ts
```

### Modified files
```
server/src/app.ts                          — register @fastify/compress
server/src/routes/work-items/index.ts      — add pagination to GET /
server/src/routes/projects.ts              — add pagination to GET /
server/src/routes/users.ts                 — add pagination to GET /
server/src/routes/tickets.ts               — add pagination to GET / and GET /admin
server/src/routes/dashboard.ts             — add pagination to GET /pending-items
client/src/types/api.ts                    — extend PaginationMeta
client/src/utils/api.ts                    — add page/limit params to list functions
client/vite.config.ts                      — add test block
client/src/main.tsx                        — QueryClientProvider + ConfigProvider Token
client/src/App.tsx                         — ErrorBoundary per route
client/src/pages/WorkItemDetail.tsx        — rewrite as orchestrator
client/src/pages/Dashboard.tsx             — rewrite as orchestrator
client/src/pages/WorkItemList.tsx          — rewrite as orchestrator
client/src/pages/Login.tsx                 — left-right split redesign
client/src/pages/Register.tsx              — left-right split redesign
client/src/components/MainLayout.tsx       — dark sidebar, remove styled-components import
```

### Deleted files
```
client/src/components/MainLayoutStyles.tsx
client/src/utils/tagRenderers.tsx
docs/superpowers/specs/2026-04-30-project-refactor-design.md
```

---

## Phase 1 — Backend: Gzip + Pagination

### Task 1: Install @fastify/compress and register in app.ts

**Files:**
- Modify: `server/src/app.ts`

- [ ] **Step 1: Install the package**

```bash
# run from server/
npm install @fastify/compress
```

Expected: package added to `server/node_modules`, `server/package.json` dependencies updated.

- [ ] **Step 2: Register compress in app.ts — before all static registrations**

Open `server/src/app.ts`. After the `multipart` registration block and before the `authPlugin` registration, add:

```ts
import compress from '@fastify/compress'

// inside buildApp(), after the multipart block:
await app.register(compress, {
  global: true,
  threshold: 1024,
  encodings: ['gzip', 'deflate'],
})
```

The full import section at top of `app.ts` becomes:
```ts
import 'dotenv/config'
import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import compress from '@fastify/compress'
import path from 'path'
```

And the registration order inside `buildApp()`:
```ts
await app.register(cors, { ... })
await app.register(multipart, { ... })
await app.register(compress, {
  global: true,
  threshold: 1024,
  encodings: ['gzip', 'deflate'],
})
await app.register(authPlugin)
// ... rest unchanged
```

- [ ] **Step 3: Verify server starts**

```bash
# from server/
npm run dev
```

Expected: server starts on port 5000 with no errors. Check for `"Server listening at http://0.0.0.0:5000"` in output. Ctrl+C to stop.

- [ ] **Step 4: Commit**

```bash
git add server/src/app.ts server/package.json server/package-lock.json
git commit -m "feat(server): register @fastify/compress for gzip responses"
```

---

### Task 2: Create pagination helper

**Files:**
- Create: `server/src/lib/pagination.ts`

- [ ] **Step 1: Create the helper**

```ts
// server/src/lib/pagination.ts
export interface PaginationQuery {
  page?: string
  limit?: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function parsePagination(query: PaginationQuery): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10) || 20))
  return { page, limit, skip: (page - 1) * limit }
}

export function paginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return { total, page, limit, totalPages: Math.ceil(total / limit) }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/lib/pagination.ts
git commit -m "feat(server): add pagination helper"
```

---

### Task 3: Paginate GET /api/work-items

**Files:**
- Modify: `server/src/routes/work-items/index.ts`

- [ ] **Step 1: Import pagination helper at top of the file**

Add to imports in `server/src/routes/work-items/index.ts`:

```ts
import { parsePagination, paginationMeta, PaginationQuery } from '../../lib/pagination'
```

- [ ] **Step 2: Update the GET '/' handler to use pagination**

Find the `fastify.get('/', async (request, reply) => {` handler. The `request.query` destructuring currently reads filter fields. Add `page` and `limit` to the destructure and apply `parsePagination`:

```ts
fastify.get('/', async (request, reply) => {
  if (!await requireAuth(request, reply)) return

  const {
    title, projectId, type, status, priority,
    assigneeId, source, startDate, endDate, createdById,
    page: pageStr, limit: limitStr,
  } = request.query as Record<string, string | undefined>

  const { page, limit, skip } = parsePagination({ page: pageStr, limit: limitStr })

  const where: Record<string, unknown> = {}
  // ... all existing where-building logic unchanged ...

  const [workItems, total] = await Promise.all([
    prisma.workitems.findMany({
      where,
      include: {
        users_workitems_assigneeIdTousers: { select: { id: true, username: true, avatar: true } },
        users_workitems_createdByIdTousers: { select: { id: true, username: true, avatar: true } },
        projects: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.workitems.count({ where }),
  ])

  return reply.send({
    success: true,
    data: workItems.map(item => serializeWorkItem(item as any)),
    meta: paginationMeta(total, page, limit),
  })
})
```

- [ ] **Step 3: Verify server still starts and endpoint responds**

```bash
# from server/
npm run dev
```

In a separate terminal:
```bash
curl "http://localhost:5000/api/work-items?page=1&limit=5" -H "Authorization: Bearer <token>"
```

Expected response shape:
```json
{ "success": true, "data": [...], "meta": { "total": 42, "page": 1, "limit": 5, "totalPages": 9 } }
```

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/work-items/index.ts
git commit -m "feat(server): paginate GET /api/work-items"
```

---

### Task 4: Paginate remaining list endpoints

**Files:**
- Modify: `server/src/routes/projects.ts`
- Modify: `server/src/routes/users.ts`
- Modify: `server/src/routes/tickets.ts`
- Modify: `server/src/routes/dashboard.ts`

Apply the same pattern as Task 3 to each file. The steps are identical — import `parsePagination` and `paginationMeta`, extract `page`/`limit` from query, wrap the `findMany` + `count` in `Promise.all`, return with `meta`.

- [ ] **Step 1: Paginate GET /api/projects**

In `server/src/routes/projects.ts`, find the list handler (likely `fastify.get('/', ...)`). Add import at top:

```ts
import { parsePagination, paginationMeta } from '../lib/pagination'
```

Update the handler:

```ts
fastify.get('/', async (request, reply) => {
  if (!await requireAuth(request, reply)) return

  const { status, name, page: pageStr, limit: limitStr } = request.query as Record<string, string | undefined>
  const { page, limit, skip } = parsePagination({ page: pageStr, limit: limitStr })

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (name) where.name = { contains: name }

  const [projects, total] = await Promise.all([
    prisma.projects.findMany({
      where,
      include: { users: { select: { id: true, username: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.projects.count({ where }),
  ])

  return reply.send({ success: true, data: projects, meta: paginationMeta(total, page, limit) })
})
```

> Note: Check the actual filter fields used in the existing handler and preserve them — the shape above may not match exactly. The pattern is the same.

- [ ] **Step 2: Paginate GET /api/users**

In `server/src/routes/users.ts`, list handler:

```ts
import { parsePagination, paginationMeta } from '../lib/pagination'

// inside the GET '/' handler:
const { role, username, page: pageStr, limit: limitStr } = request.query as Record<string, string | undefined>
const { page, limit, skip } = parsePagination({ page: pageStr, limit: limitStr })

const where: Record<string, unknown> = {}
if (role) where.role = role
if (username) where.username = { contains: username }

const [users, total] = await Promise.all([
  prisma.users.findMany({
    where,
    select: { id: true, username: true, email: true, role: true, avatar: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  }),
  prisma.users.count({ where }),
])

return reply.send({ success: true, data: users, meta: paginationMeta(total, page, limit) })
```

- [ ] **Step 3: Paginate GET /api/tickets (user list + admin list)**

In `server/src/routes/tickets.ts`:

```ts
import { parsePagination, paginationMeta } from '../lib/pagination'
```

For the user-facing list handler and the admin list handler, apply the same `parsePagination` + `Promise.all([findMany, count])` pattern. Both handlers get `page` and `limit` from query params.

- [ ] **Step 4: Paginate GET /api/dashboard/pending-items**

In `server/src/routes/dashboard.ts`, find the pending-items endpoint. Apply:

```ts
import { parsePagination, paginationMeta } from '../lib/pagination'

// inside handler:
const { page: pageStr, limit: limitStr } = request.query as Record<string, string | undefined>
const { page, limit, skip } = parsePagination({ page: pageStr, limit: limitStr })

const [items, total] = await Promise.all([
  prisma.workitems.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { ... } }),
  prisma.workitems.count({ where }),
])

return reply.send({ success: true, data: items.map(serializeWorkItem), meta: paginationMeta(total, page, limit) })
```

- [ ] **Step 5: Verify all routes still respond**

```bash
npm run dev
```

Spot-check two endpoints with curl (or browser). No 500 errors expected.

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/projects.ts server/src/routes/users.ts server/src/routes/tickets.ts server/src/routes/dashboard.ts
git commit -m "feat(server): paginate all list endpoints (projects, users, tickets, dashboard)"
```

---

## Phase 2 — Test Infrastructure

### Task 5: Set up Vitest for server

**Files:**
- Create: `server/vitest.config.ts`
- Modify: `server/package.json`

- [ ] **Step 1: Install Vitest**

```bash
# from server/
npm install -D vitest
```

- [ ] **Step 2: Create server/vitest.config.ts**

```ts
// server/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Add test script to server/package.json**

In `server/package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify Vitest is found**

```bash
# from server/
npx vitest --version
```

Expected: prints a version number (e.g. `3.x.x`).

- [ ] **Step 5: Commit**

```bash
git add server/vitest.config.ts server/package.json server/package-lock.json
git commit -m "chore(server): add Vitest test runner"
```

---

### Task 6: Set up Vitest + Testing Library + MSW for client

**Files:**
- Modify: `client/vite.config.ts`
- Modify: `client/package.json`
- Create: `client/src/test/setup.ts`
- Create: `client/src/test/server.ts`
- Create: `client/src/test/handlers.ts`
- Create: `client/src/test/fixtures/workItems.ts`
- Create: `client/src/test/fixtures/projects.ts`
- Create: `client/src/test/fixtures/tickets.ts`

- [ ] **Step 1: Install test dependencies**

```bash
# from client/
npm install -D vitest @vitest/coverage-v8 jsdom msw
```

> Note: `@testing-library/react`, `@testing-library/user-event`, and `@testing-library/jest-dom` are already in `package.json` (currently in `dependencies` — leave them there, they work from either section).

- [ ] **Step 2: Read existing vite.config.ts to see current content**

Open `client/vite.config.ts`. It likely looks like:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:5000' } },
  resolve: { alias: { '@': '/src' } },
})
```

- [ ] **Step 3: Add test block to vite.config.ts**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:5000' },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/hooks/**', 'src/components/common/**', 'src/contexts/**'],
    },
  },
})
```

- [ ] **Step 4: Add test script to client/package.json**

In `client/package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 5: Create client/src/test/setup.ts**

```ts
// client/src/test/setup.ts
import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

- [ ] **Step 6: Create client/src/test/server.ts**

```ts
// client/src/test/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

- [ ] **Step 7: Create client/src/test/fixtures/workItems.ts**

```ts
// client/src/test/fixtures/workItems.ts
import type { WorkItem } from '@/types/models'

export const workItemFixture: WorkItem = {
  id: 1,
  title: '测试工作项',
  status: 'todo',
  priority: 'medium',
  projectId: 1,
  creatorId: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export const workItemsFixture: WorkItem[] = [workItemFixture]
```

- [ ] **Step 8: Create client/src/test/fixtures/projects.ts**

```ts
// client/src/test/fixtures/projects.ts
import type { Project } from '@/types/models'

export const projectFixture: Project = {
  id: 1,
  name: '测试项目',
  status: 'in_progress',
  creatorId: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export const projectsFixture: Project[] = [projectFixture]
```

- [ ] **Step 9: Create client/src/test/fixtures/tickets.ts**

```ts
// client/src/test/fixtures/tickets.ts
import type { Ticket } from '@/types/models'

export const ticketFixture: Ticket = {
  id: 1,
  title: '测试工单',
  status: 'open',
  priority: 'medium',
  creatorId: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export const ticketsFixture: Ticket[] = [ticketFixture]
```

- [ ] **Step 10: Create client/src/test/handlers.ts**

```ts
// client/src/test/handlers.ts
import { http, HttpResponse } from 'msw'
import { workItemsFixture, workItemFixture } from './fixtures/workItems'
import { projectsFixture } from './fixtures/projects'
import { ticketsFixture } from './fixtures/tickets'

const paginatedMeta = { total: 1, page: 1, limit: 20, totalPages: 1 }

export const handlers = [
  http.get('/api/work-items', () =>
    HttpResponse.json({ success: true, data: workItemsFixture, meta: paginatedMeta })
  ),
  http.get('/api/work-items/:id', ({ params }) =>
    HttpResponse.json({ success: true, data: workItemFixture })
  ),
  http.post('/api/work-items', () =>
    HttpResponse.json({ success: true, data: workItemFixture }, { status: 201 })
  ),
  http.put('/api/work-items/:id', () =>
    HttpResponse.json({ success: true, data: workItemFixture })
  ),
  http.delete('/api/work-items/:id', () =>
    HttpResponse.json({ success: true, data: null })
  ),
  http.get('/api/projects', () =>
    HttpResponse.json({ success: true, data: projectsFixture, meta: paginatedMeta })
  ),
  http.get('/api/tickets', () =>
    HttpResponse.json({ success: true, data: ticketsFixture, meta: paginatedMeta })
  ),
  http.get('/api/users', () =>
    HttpResponse.json({ success: true, data: [], meta: paginatedMeta })
  ),
  http.get('/api/dashboard/stats', () =>
    HttpResponse.json({ success: true, data: { total: 10, completed: 5 } })
  ),
  http.get('/api/dashboard/pending-items', () =>
    HttpResponse.json({ success: true, data: workItemsFixture, meta: paginatedMeta })
  ),
]
```

- [ ] **Step 11: Verify test setup runs**

```bash
# from client/
npx vitest run --reporter=verbose 2>&1 | head -20
```

Expected: "No test files found" (not an error — infrastructure works, no tests yet).

- [ ] **Step 12: Commit**

```bash
git add client/vite.config.ts client/package.json client/package-lock.json client/src/test/
git commit -m "chore(client): add Vitest + Testing Library + MSW test infrastructure"
```

---

## Phase 3 — React Query + TypeScript Hooks

### Task 7: Update ApiSuccess type and update api.ts list functions

**Files:**
- Modify: `client/src/types/api.ts`
- Modify: `client/src/utils/api.ts`

- [ ] **Step 1: Update PaginationMeta in client/src/types/api.ts**

Replace the existing `ApiSuccess` interface:

```ts
// client/src/types/api.ts
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: PaginationMeta
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

- [ ] **Step 2: Add page/limit params to list API functions in api.ts**

In `client/src/utils/api.ts`, the list functions currently accept `Record<string, unknown>`. No change needed to their signatures — they already pass all params through. The calling hooks will pass `{ page, limit, ...filters }` as the params object. No code change needed in `api.ts` for this step.

- [ ] **Step 3: Commit**

```bash
git add client/src/types/api.ts
git commit -m "feat(client): extend ApiSuccess with typed PaginationMeta"
```

---

### Task 8: Install React Query and configure QueryClient

**Files:**
- Modify: `client/src/main.tsx`
- Modify: `client/src/App.tsx`
- Modify: `client/package.json`

- [ ] **Step 1: Install React Query**

```bash
# from client/
npm install @tanstack/react-query @tanstack/react-query-devtools
```

- [ ] **Step 2: Update client/src/main.tsx**

Replace entire file:

```tsx
// client/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN}>
        <App />
      </ConfigProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
)
```

- [ ] **Step 3: Verify client builds**

```bash
# from client/
npm run typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/main.tsx client/package.json client/package-lock.json
git commit -m "feat(client): add React Query with QueryClient and devtools"
```

---

### Task 9: Create useWorkItems and useWorkItem hooks

**Files:**
- Create: `client/src/hooks/useWorkItems.ts`
- Create: `client/src/hooks/useWorkItem.ts`

- [ ] **Step 1: Create client/src/hooks/useWorkItems.ts**

```ts
// client/src/hooks/useWorkItems.ts
import { useQuery } from '@tanstack/react-query'
import { getWorkItems } from '@/utils/api'
import type { WorkItem } from '@/types/models'
import type { ApiSuccess } from '@/types/api'

export interface WorkItemFilters {
  title?: string
  projectId?: number
  type?: string
  status?: string
  priority?: string
  assigneeId?: number
  source?: string
  startDate?: string
  endDate?: string
}

export function useWorkItems(filters: WorkItemFilters = {}, page = 1, limit = 20) {
  return useQuery<ApiSuccess<WorkItem[]>>({
    queryKey: ['work-items', filters, page, limit],
    queryFn: () =>
      getWorkItems({ ...filters, page, limit }).then(res => res.data),
  })
}
```

- [ ] **Step 2: Create client/src/hooks/useWorkItem.ts**

```ts
// client/src/hooks/useWorkItem.ts
import { useQuery } from '@tanstack/react-query'
import { getWorkItemById } from '@/utils/api'
import type { WorkItem } from '@/types/models'
import type { ApiSuccess } from '@/types/api'

export function useWorkItem(id: number | undefined) {
  return useQuery<ApiSuccess<WorkItem>>({
    queryKey: ['work-items', id],
    queryFn: () => getWorkItemById(id!).then(res => res.data),
    enabled: id !== undefined,
  })
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
# from client/
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/hooks/useWorkItems.ts client/src/hooks/useWorkItem.ts
git commit -m "feat(client): add useWorkItems and useWorkItem hooks"
```

---

### Task 10: Create useWorkItemMutations hook

**Files:**
- Create: `client/src/hooks/useWorkItemMutations.ts`

- [ ] **Step 1: Create the file**

```ts
// client/src/hooks/useWorkItemMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createWorkItem,
  updateWorkItem,
  deleteWorkItem,
  uploadAttachment,
  deleteWorkItemAttachment,
  addWorkItemComment,
} from '@/utils/api'
import type { WorkItem } from '@/types/models'

export function useCreateWorkItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<WorkItem>) => createWorkItem(data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work-items'] }),
  })
}

export function useUpdateWorkItem(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<WorkItem>) => updateWorkItem(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      queryClient.invalidateQueries({ queryKey: ['work-items', id] })
    },
  })
}

export function useDeleteWorkItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteWorkItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work-items'] }),
  })
}

export function useUploadAttachment(workItemId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadAttachment(workItemId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work-items', workItemId] }),
  })
}

export function useDeleteAttachment(workItemId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) => deleteWorkItemAttachment(workItemId, attachmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work-items', workItemId] }),
  })
}

export function useAddComment(workItemId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => addWorkItemComment(workItemId, { content }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work-items', workItemId] }),
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/useWorkItemMutations.ts
git commit -m "feat(client): add useWorkItemMutations hooks"
```

---

### Task 11: Create remaining hooks (useProjects, useTickets, useDashboard, useUsers)

**Files:**
- Create: `client/src/hooks/useProjects.ts`
- Create: `client/src/hooks/useTickets.ts`
- Create: `client/src/hooks/useDashboard.ts`
- Create: `client/src/hooks/useUsers.ts`

- [ ] **Step 1: Create client/src/hooks/useProjects.ts**

```ts
// client/src/hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, createProject, updateProject, deleteProject, getProjectById } from '@/utils/api'
import type { Project } from '@/types/models'
import type { ApiSuccess } from '@/types/api'

export interface ProjectFilters {
  name?: string
  status?: string
}

export function useProjects(filters: ProjectFilters = {}, page = 1, limit = 20) {
  return useQuery<ApiSuccess<Project[]>>({
    queryKey: ['projects', filters, page, limit],
    queryFn: () => getProjects({ ...filters, page, limit }).then(res => res.data),
  })
}

export function useProject(id: number | undefined) {
  return useQuery<ApiSuccess<Project>>({
    queryKey: ['projects', id],
    queryFn: () => getProjectById(id!).then(res => res.data),
    enabled: id !== undefined,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Project>) => createProject(data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Project>) => updateProject(id, data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}
```

- [ ] **Step 2: Create client/src/hooks/useTickets.ts**

```ts
// client/src/hooks/useTickets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTickets, getTicketById, createTicket, updateTicket, addTicketComment } from '@/utils/api'
import type { Ticket } from '@/types/models'
import type { ApiSuccess } from '@/types/api'

export interface TicketFilters {
  status?: string
  priority?: string
}

export function useTickets(filters: TicketFilters = {}, page = 1, limit = 20) {
  return useQuery<ApiSuccess<Ticket[]>>({
    queryKey: ['tickets', filters, page, limit],
    queryFn: () => getTickets({ ...filters, page, limit }).then(res => res.data),
  })
}

export function useTicket(id: number | undefined) {
  return useQuery<ApiSuccess<Ticket>>({
    queryKey: ['tickets', id],
    queryFn: () => getTicketById(id!).then(res => res.data),
    enabled: id !== undefined,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Ticket>) => createTicket(data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  })
}

export function useUpdateTicket(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Ticket>) => updateTicket(id, data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  })
}

export function useAddTicketComment(ticketId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => addTicketComment(ticketId, { content }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] }),
  })
}
```

- [ ] **Step 3: Create client/src/hooks/useDashboard.ts**

```ts
// client/src/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, getPendingItems } from '@/utils/api'
import type { WorkItem } from '@/types/models'
import type { ApiSuccess } from '@/types/api'

export function useDashboardStats(filters: Record<string, unknown> = {}) {
  return useQuery<ApiSuccess<Record<string, unknown>>>({
    queryKey: ['dashboard', 'stats', filters],
    queryFn: () => getDashboardStats(filters).then(res => res.data),
  })
}

export function usePendingItems(filters: Record<string, unknown> = {}, page = 1, limit = 20) {
  return useQuery<ApiSuccess<WorkItem[]>>({
    queryKey: ['dashboard', 'pending', filters, page, limit],
    queryFn: () => getPendingItems({ ...filters, page, limit }).then(res => res.data),
  })
}
```

- [ ] **Step 4: Create client/src/hooks/useUsers.ts**

```ts
// client/src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, updateUser, deleteUser, getAdmins } from '@/utils/api'
import type { User } from '@/types/models'
import type { ApiSuccess } from '@/types/api'

export function useUsers() {
  return useQuery<ApiSuccess<User[]>>({
    queryKey: ['users'],
    queryFn: () => getUsers().then(res => res.data),
  })
}

export function useAdmins() {
  return useQuery<ApiSuccess<User[]>>({
    queryKey: ['users', 'admins'],
    queryFn: () => getAdmins().then(res => res.data),
  })
}

export function useUpdateUser(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<User>) => updateUser(id, data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
```

- [ ] **Step 5: Typecheck**

```bash
# from client/
npm run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add client/src/hooks/
git commit -m "feat(client): add useProjects, useTickets, useDashboard, useUsers hooks"
```

---

## Phase 4 — Shared Components

### Task 12: Create ErrorBoundary and wire into App.tsx

**Files:**
- Create: `client/src/components/common/ErrorBoundary.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create ErrorBoundary**

```tsx
// client/src/components/common/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react'
import { Button, Result } from 'antd'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="页面加载出错"
          subTitle={this.state.message}
          extra={
            <Button type="primary" onClick={() => this.setState({ hasError: false, message: '' })}>
              重试
            </Button>
          }
        />
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 2: Wrap each lazy route in App.tsx with ErrorBoundary**

In `client/src/App.tsx`, import `ErrorBoundary`:

```tsx
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
```

Wrap the `<React.Suspense>` in `AppRoutes` with `ErrorBoundary`:

```tsx
function AppRoutes() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>加载中...</div>}>
        <Routes>
          {/* all routes unchanged */}
        </Routes>
      </React.Suspense>
    </ErrorBoundary>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/common/ErrorBoundary.tsx client/src/App.tsx
git commit -m "feat(client): add ErrorBoundary component and wrap routes"
```

---

### Task 13: Create PageSkeleton component

**Files:**
- Create: `client/src/components/common/PageSkeleton.tsx`

- [ ] **Step 1: Create the component**

```tsx
// client/src/components/common/PageSkeleton.tsx
import { Skeleton, Card, Row, Col } from 'antd'

interface Props {
  variant?: 'list' | 'detail'
}

export function PageSkeleton({ variant = 'list' }: Props) {
  if (variant === 'detail') {
    return (
      <Row gutter={24} style={{ padding: 24 }}>
        <Col flex={1}>
          <Skeleton active paragraph={{ rows: 4 }} />
          <Card style={{ marginTop: 16 }}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
          <Card style={{ marginTop: 16 }}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
        <Col style={{ width: 280 }}>
          <Card>
            <Skeleton active paragraph={{ rows: 8 }} title={false} />
          </Card>
        </Col>
      </Row>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Skeleton.Input active style={{ width: 300, marginBottom: 16 }} />
      <Skeleton active paragraph={{ rows: 5 }} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/common/PageSkeleton.tsx
git commit -m "feat(client): add PageSkeleton component with list and detail variants"
```

---

### Task 14: Create StatusTag and delete tagRenderers.tsx

**Files:**
- Create: `client/src/components/common/StatusTag.tsx`
- Delete: `client/src/utils/tagRenderers.tsx`

- [ ] **Step 1: Read tagRenderers.tsx to capture current logic**

Open `client/src/utils/tagRenderers.tsx` and note all exported functions/maps.

- [ ] **Step 2: Create StatusTag.tsx with equivalent logic**

```tsx
// client/src/components/common/StatusTag.tsx
import { Tag } from 'antd'
import type { WorkItemStatus, WorkItemPriority, TicketStatus, TicketPriority } from '@/types/models'

const workItemStatusMap: Record<WorkItemStatus, { color: string; label: string }> = {
  todo:        { color: 'default',  label: '待处理' },
  in_progress: { color: 'processing', label: '进行中' },
  in_review:   { color: 'warning',  label: '审核中' },
  done:        { color: 'success',  label: '已完成' },
  cancelled:   { color: 'error',    label: '已取消' },
}

const workItemPriorityMap: Record<WorkItemPriority, { color: string; label: string }> = {
  low:    { color: 'cyan',   label: '低' },
  medium: { color: 'gold',   label: '中' },
  high:   { color: 'orange', label: '高' },
  urgent: { color: 'red',    label: '紧急' },
}

const ticketStatusMap: Record<TicketStatus, { color: string; label: string }> = {
  open:        { color: 'blue',    label: '待处理' },
  in_progress: { color: 'processing', label: '处理中' },
  resolved:    { color: 'success', label: '已解决' },
  closed:      { color: 'default', label: '已关闭' },
}

const ticketPriorityMap: Record<TicketPriority, { color: string; label: string }> = {
  low:    { color: 'cyan',   label: '低' },
  medium: { color: 'gold',   label: '中' },
  high:   { color: 'orange', label: '高' },
  urgent: { color: 'red',    label: '紧急' },
}

export function WorkItemStatusTag({ status }: { status: WorkItemStatus }) {
  const cfg = workItemStatusMap[status] ?? { color: 'default', label: status }
  return <Tag color={cfg.color}>{cfg.label}</Tag>
}

export function WorkItemPriorityTag({ priority }: { priority: WorkItemPriority }) {
  const cfg = workItemPriorityMap[priority] ?? { color: 'default', label: priority }
  return <Tag color={cfg.color}>{cfg.label}</Tag>
}

export function TicketStatusTag({ status }: { status: TicketStatus }) {
  const cfg = ticketStatusMap[status] ?? { color: 'default', label: status }
  return <Tag color={cfg.color}>{cfg.label}</Tag>
}

export function TicketPriorityTag({ priority }: { priority: TicketPriority }) {
  const cfg = ticketPriorityMap[priority] ?? { color: 'default', label: priority }
  return <Tag color={cfg.color}>{cfg.label}</Tag>
}
```

> Note: Cross-check the color values against the actual tagRenderers.tsx to preserve existing visual behavior exactly.

- [ ] **Step 3: Find all imports of tagRenderers.tsx and update them**

```bash
# from project root
grep -r "tagRenderers" client/src --include="*.tsx" --include="*.ts" -l
```

For each file found, replace the import:
```ts
// Old:
import { renderStatus, renderPriority } from '@/utils/tagRenderers'
// New (adjust function names to match new exports):
import { WorkItemStatusTag, WorkItemPriorityTag } from '@/components/common/StatusTag'
```

Update all JSX usages accordingly (e.g., `{renderStatus(item.status)}` → `<WorkItemStatusTag status={item.status} />`).

- [ ] **Step 4: Delete tagRenderers.tsx**

```bash
rm client/src/utils/tagRenderers.tsx
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/common/StatusTag.tsx client/src/utils/
git commit -m "feat(client): replace tagRenderers with StatusTag component, delete old file"
```

---

## Phase 5 — Component Splitting

### Task 15: Split WorkItemDetail.tsx

**Files:**
- Modify: `client/src/pages/WorkItemDetail.tsx` (rewrite as orchestrator ~100 lines)
- Create: `client/src/components/work-item/WorkItemInfoPanel.tsx`
- Create: `client/src/components/work-item/WorkItemEditForm.tsx`
- Create: `client/src/components/work-item/AttachmentSection.tsx`
- Create: `client/src/components/work-item/CommentSection.tsx`
- Create: `client/src/components/work-item/ActivityTimeline.tsx`

- [ ] **Step 1: Read WorkItemDetail.tsx in full before making any changes**

Open `client/src/pages/WorkItemDetail.tsx` (856 lines). Identify:
- State variables → determine which sub-component owns each
- API calls → will be replaced by hooks
- JSX sections → which file each block moves to

- [ ] **Step 2: Create WorkItemInfoPanel.tsx**

This component renders the right-column metadata panel (status, priority, assignee, project, dates, hours).

```tsx
// client/src/components/work-item/WorkItemInfoPanel.tsx
import { Descriptions, Select, DatePicker, InputNumber, Avatar } from 'antd'
import type { WorkItem, User, Project } from '@/types/models'
import { WorkItemStatusTag, WorkItemPriorityTag } from '@/components/common/StatusTag'

interface Props {
  workItem: WorkItem
  users: User[]
  projects: Project[]
  canEdit: boolean
  onUpdate: (data: Partial<WorkItem>) => void
}

export function WorkItemInfoPanel({ workItem, users, projects, canEdit, onUpdate }: Props) {
  return (
    <Descriptions column={1} bordered size="small">
      <Descriptions.Item label="状态">
        {canEdit ? (
          <Select
            value={workItem.status}
            onChange={status => onUpdate({ status })}
            style={{ width: '100%' }}
            options={[
              { value: 'todo', label: '待处理' },
              { value: 'in_progress', label: '进行中' },
              { value: 'in_review', label: '审核中' },
              { value: 'done', label: '已完成' },
              { value: 'cancelled', label: '已取消' },
            ]}
          />
        ) : (
          <WorkItemStatusTag status={workItem.status} />
        )}
      </Descriptions.Item>
      <Descriptions.Item label="优先级">
        <WorkItemPriorityTag priority={workItem.priority} />
      </Descriptions.Item>
      <Descriptions.Item label="负责人">
        {workItem.assignee ? (
          <span>
            <Avatar src={workItem.assignee.avatar} size="small" style={{ marginRight: 6 }} />
            {workItem.assignee.username}
          </span>
        ) : '未分配'}
      </Descriptions.Item>
      <Descriptions.Item label="所属项目">
        {workItem.project?.name ?? '-'}
      </Descriptions.Item>
      <Descriptions.Item label="创建时间">
        {new Date(workItem.createdAt).toLocaleDateString('zh-CN')}
      </Descriptions.Item>
    </Descriptions>
  )
}
```

> Note: Copy any additional fields (estimatedHours, scheduledStartDate, etc.) from the original WorkItemDetail.tsx into this component. The above is a minimum skeleton — match what the original file displays.

- [ ] **Step 3: Create ActivityTimeline.tsx**

Extract the activity/history section from the original file:

```tsx
// client/src/components/work-item/ActivityTimeline.tsx
import { Timeline, Typography, Empty } from 'antd'
import type { WorkItemActivity } from '@/types/models'

interface Props {
  activities: WorkItemActivity[]
}

export function ActivityTimeline({ activities }: Props) {
  if (activities.length === 0) {
    return <Empty description="暂无操作记录" />
  }
  return (
    <Timeline
      items={activities.map(a => ({
        key: a.id,
        children: (
          <div>
            <Typography.Text strong>{a.user?.username ?? '系统'}</Typography.Text>
            {' '}{a.action}
            {a.field && <span>「{a.field}」</span>}
            {a.oldValue && a.newValue && (
              <span>从「{a.oldValue}」改为「{a.newValue}」</span>
            )}
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              {new Date(a.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
        ),
      }))}
    />
  )
}
```

- [ ] **Step 4: Create CommentSection.tsx**

```tsx
// client/src/components/work-item/CommentSection.tsx
import { useState } from 'react'
import { List, Input, Button, Avatar, Empty } from 'antd'

interface Comment {
  id: string
  content: string
  createdAt: string
  author: { username: string; avatar?: string | null }
}

interface Props {
  comments: Comment[]
  onSubmit: (content: string) => Promise<void>
  submitting?: boolean
}

export function CommentSection({ comments, onSubmit, submitting = false }: Props) {
  const [value, setValue] = useState('')

  const handleSubmit = async () => {
    if (!value.trim()) return
    await onSubmit(value.trim())
    setValue('')
  }

  return (
    <div>
      {comments.length === 0 ? (
        <Empty description="暂无评论" style={{ marginBottom: 16 }} />
      ) : (
        <List
          dataSource={comments}
          renderItem={c => (
            <List.Item key={c.id}>
              <List.Item.Meta
                avatar={<Avatar src={c.author.avatar}>{c.author.username[0]}</Avatar>}
                title={<span>{c.author.username} <span style={{ color: '#8c8c8c', fontSize: 12 }}>{new Date(c.createdAt).toLocaleString('zh-CN')}</span></span>}
                description={c.content}
              />
            </List.Item>
          )}
        />
      )}
      <Input.TextArea
        rows={3}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="添加评论..."
        style={{ marginBottom: 8 }}
      />
      <Button type="primary" onClick={handleSubmit} loading={submitting} disabled={!value.trim()}>
        提交评论
      </Button>
    </div>
  )
}
```

- [ ] **Step 5: Create AttachmentSection.tsx**

```tsx
// client/src/components/work-item/AttachmentSection.tsx
import { Upload, List, Button, Popconfirm } from 'antd'
import { UploadOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons'
import { downloadFile } from '@/utils/api'

interface Attachment {
  id: string
  originalName: string
  path: string
  size: number
  mimetype: string
}

interface Props {
  attachments: Attachment[]
  onUpload: (file: File) => Promise<void>
  onDelete: (id: string) => Promise<void>
  uploading?: boolean
  canEdit?: boolean
}

export function AttachmentSection({ attachments, onUpload, onDelete, uploading = false, canEdit = false }: Props) {
  return (
    <div>
      {canEdit && (
        <Upload
          beforeUpload={file => { onUpload(file); return false }}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>上传附件</Button>
        </Upload>
      )}
      <List
        dataSource={attachments}
        style={{ marginTop: 8 }}
        renderItem={a => (
          <List.Item
            key={a.id}
            actions={[
              <Button
                key="dl"
                type="link"
                icon={<DownloadOutlined />}
                onClick={() => downloadFile(a.path)}
              />,
              canEdit && (
                <Popconfirm key="del" title="确认删除？" onConfirm={() => onDelete(a.id)}>
                  <Button type="link" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
            ].filter(Boolean)}
          >
            <List.Item.Meta
              title={a.originalName}
              description={`${(a.size / 1024).toFixed(1)} KB`}
            />
          </List.Item>
        )}
      />
    </div>
  )
}
```

- [ ] **Step 6: Create WorkItemEditForm.tsx (modal form)**

This extracts the edit form modal from the original file. The form fields (title, description, type, status, priority, assignee, project, dates) come from the original form JSX.

```tsx
// client/src/components/work-item/WorkItemEditForm.tsx
import { Modal, Form, Input, Select } from 'antd'
import type { WorkItem, User, Project } from '@/types/models'

interface Props {
  open: boolean
  workItem: WorkItem
  users: User[]
  projects: Project[]
  submitting: boolean
  onSubmit: (values: Partial<WorkItem>) => void
  onCancel: () => void
}

export function WorkItemEditForm({ open, workItem, users, projects, submitting, onSubmit, onCancel }: Props) {
  const [form] = Form.useForm()

  return (
    <Modal
      title="编辑工作项"
      open={open}
      onOk={() => form.validateFields().then(onSubmit)}
      onCancel={() => { form.resetFields(); onCancel() }}
      confirmLoading={submitting}
      width={640}
    >
      <Form form={form} layout="vertical" initialValues={workItem}>
        <Form.Item name="title" label="标题" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true }]}>
          <Select options={[
            { value: 'todo', label: '待处理' },
            { value: 'in_progress', label: '进行中' },
            { value: 'in_review', label: '审核中' },
            { value: 'done', label: '已完成' },
            { value: 'cancelled', label: '已取消' },
          ]} />
        </Form.Item>
        <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
          <Select options={[
            { value: 'low', label: '低' },
            { value: 'medium', label: '中' },
            { value: 'high', label: '高' },
            { value: 'urgent', label: '紧急' },
          ]} />
        </Form.Item>
        {/* Add remaining fields from original edit form */}
      </Form>
    </Modal>
  )
}
```

> Note: Copy ALL form fields from the original WorkItemDetail.tsx edit modal into this component. The above is a structural skeleton.

- [ ] **Step 7: Rewrite WorkItemDetail.tsx as orchestrator**

```tsx
// client/src/pages/WorkItemDetail.tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Row, Col, Card, Typography, Button, message } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { useWorkItem } from '@/hooks/useWorkItem'
import { useUpdateWorkItem, useUploadAttachment, useDeleteAttachment, useAddComment } from '@/hooks/useWorkItemMutations'
import { useUsers } from '@/hooks/useUsers'
import { useProjects } from '@/hooks/useProjects'
import { useAuth } from '@/contexts/AuthContext'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { WorkItemInfoPanel } from '@/components/work-item/WorkItemInfoPanel'
import { WorkItemEditForm } from '@/components/work-item/WorkItemEditForm'
import { AttachmentSection } from '@/components/work-item/AttachmentSection'
import { CommentSection } from '@/components/work-item/CommentSection'
import { ActivityTimeline } from '@/components/work-item/ActivityTimeline'
import type { WorkItem } from '@/types/models'

export default function WorkItemDetail() {
  const { id } = useParams<{ id: string }>()
  const workItemId = Number(id)
  const { user, hasRole } = useAuth()
  const [editOpen, setEditOpen] = useState(false)

  const { data, isLoading } = useWorkItem(workItemId)
  const { data: usersData } = useUsers()
  const { data: projectsData } = useProjects()

  const updateMutation = useUpdateWorkItem(workItemId)
  const uploadMutation = useUploadAttachment(workItemId)
  const deleteAttachmentMutation = useDeleteAttachment(workItemId)
  const addCommentMutation = useAddComment(workItemId)

  if (isLoading) return <PageSkeleton variant="detail" />

  const workItem = data?.data
  if (!workItem) return null

  const canEdit = hasRole('admin') || workItem.creatorId === user?.id

  const attachments = (workItem as any).attachments ?? []
  const comments = (workItem as any).comments ?? []
  const activities = (workItem as any).activities ?? []

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>{workItem.title}</Typography.Title>
        {canEdit && (
          <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑</Button>
        )}
      </div>

      <Row gutter={24}>
        <Col flex={1} style={{ minWidth: 0 }}>
          <Card title="描述" style={{ marginBottom: 16 }}>
            <Typography.Paragraph>{workItem.description || '暂无描述'}</Typography.Paragraph>
          </Card>
          <Card title="附件" style={{ marginBottom: 16 }}>
            <AttachmentSection
              attachments={attachments}
              onUpload={file => uploadMutation.mutateAsync(file)}
              onDelete={id => deleteAttachmentMutation.mutateAsync(id)}
              uploading={uploadMutation.isPending}
              canEdit={canEdit}
            />
          </Card>
          <Card title="评论" style={{ marginBottom: 16 }}>
            <CommentSection
              comments={comments}
              onSubmit={content => addCommentMutation.mutateAsync(content)}
              submitting={addCommentMutation.isPending}
            />
          </Card>
          <Card title="操作历史">
            <ActivityTimeline activities={activities} />
          </Card>
        </Col>

        <Col style={{ width: 280 }}>
          <Card>
            <WorkItemInfoPanel
              workItem={workItem}
              users={usersData?.data ?? []}
              projects={projectsData?.data ?? []}
              canEdit={canEdit}
              onUpdate={data => updateMutation.mutate(data)}
            />
          </Card>
        </Col>
      </Row>

      <WorkItemEditForm
        open={editOpen}
        workItem={workItem}
        users={usersData?.data ?? []}
        projects={projectsData?.data ?? []}
        submitting={updateMutation.isPending}
        onSubmit={values => {
          updateMutation.mutate(values as Partial<WorkItem>, {
            onSuccess: () => { message.success('更新成功'); setEditOpen(false) },
          })
        }}
        onCancel={() => setEditOpen(false)}
      />
    </div>
  )
}
```

- [ ] **Step 8: Delete original large code from WorkItemDetail.tsx**

The original 856-line file has been replaced by the orchestrator above. All logic now lives in sub-components and hooks.

- [ ] **Step 9: Typecheck**

```bash
npm run typecheck
```

Fix any type errors before continuing.

- [ ] **Step 10: Commit**

```bash
git add client/src/pages/WorkItemDetail.tsx client/src/components/work-item/
git commit -m "refactor(client): split WorkItemDetail into sub-components + hooks"
```

---

### Task 16: Split Dashboard.tsx

**Files:**
- Modify: `client/src/pages/Dashboard.tsx` (rewrite as orchestrator ~80 lines)
- Create: `client/src/components/dashboard/StatCards.tsx`
- Create: `client/src/components/dashboard/PendingItemsTable.tsx`
- Create: `client/src/components/dashboard/GanttSection.tsx`

- [ ] **Step 1: Read Dashboard.tsx in full**

Open `client/src/pages/Dashboard.tsx` (836 lines). Identify the three main sections: stat cards, pending items table, gantt chart.

- [ ] **Step 2: Create StatCards.tsx**

```tsx
// client/src/components/dashboard/StatCards.tsx
import { Row, Col, Card, Statistic } from 'antd'

interface Stats {
  total?: number
  completed?: number
  inProgress?: number
  overdue?: number
  [key: string]: number | undefined
}

interface Props {
  stats: Stats
  loading: boolean
}

export function StatCards({ stats, loading }: Props) {
  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={6}>
        <Card loading={loading}>
          <Statistic title="工作项总数" value={stats.total ?? 0} />
        </Card>
      </Col>
      <Col span={6}>
        <Card loading={loading}>
          <Statistic title="已完成" value={stats.completed ?? 0} valueStyle={{ color: '#52c41a' }} />
        </Card>
      </Col>
      <Col span={6}>
        <Card loading={loading}>
          <Statistic title="进行中" value={stats.inProgress ?? 0} valueStyle={{ color: '#1890ff' }} />
        </Card>
      </Col>
      <Col span={6}>
        <Card loading={loading}>
          <Statistic title="已逾期" value={stats.overdue ?? 0} valueStyle={{ color: '#ff4d4f' }} />
        </Card>
      </Col>
    </Row>
  )
}
```

> Note: Cross-check the actual stat fields returned by the dashboard API (from the original Dashboard.tsx) and match the Statistic labels/values accordingly.

- [ ] **Step 3: Create PendingItemsTable.tsx**

```tsx
// client/src/components/dashboard/PendingItemsTable.tsx
import { Table, Select, Space } from 'antd'
import type { WorkItem } from '@/types/models'
import type { PaginationMeta } from '@/types/api'
import { WorkItemStatusTag, WorkItemPriorityTag } from '@/components/common/StatusTag'

interface Props {
  items: WorkItem[]
  meta: PaginationMeta | undefined
  loading: boolean
  page: number
  limit: number
  onPageChange: (page: number, pageSize: number) => void
  filters: Record<string, string>
  onFilterChange: (key: string, value: string) => void
}

export function PendingItemsTable({ items, meta, loading, page, limit, onPageChange, filters, onFilterChange }: Props) {
  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: WorkItem['status']) => <WorkItemStatusTag status={s} />,
    },
    {
      title: '优先级', dataIndex: 'priority', key: 'priority',
      render: (p: WorkItem['priority']) => <WorkItemPriorityTag priority={p} />,
    },
    { title: '负责人', key: 'assignee', render: (_: unknown, r: WorkItem) => r.assignee?.username ?? '-' },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="状态筛选"
          allowClear
          value={filters.status}
          onChange={v => onFilterChange('status', v)}
          options={[
            { value: 'todo', label: '待处理' },
            { value: 'in_progress', label: '进行中' },
          ]}
          style={{ width: 120 }}
        />
      </Space>
      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: limit,
          total: meta?.total ?? 0,
          onChange: onPageChange,
          showSizeChanger: true,
          showTotal: total => `共 ${total} 条`,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Create GanttSection.tsx**

```tsx
// client/src/components/dashboard/GanttSection.tsx
import { useState } from 'react'
import { Card, Button } from 'antd'
import { Gantt, Task as GanttTask } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import type { WorkItem } from '@/types/models'

interface Props {
  workItems: WorkItem[]
}

function toGanttTasks(items: WorkItem[]): GanttTask[] {
  return items
    .filter(i => i.startDate && i.dueDate)
    .map(i => ({
      id: String(i.id),
      name: i.title,
      start: new Date(i.startDate!),
      end: new Date(i.dueDate!),
      type: 'task',
      progress: i.status === 'done' ? 100 : i.status === 'in_progress' ? 50 : 0,
    }))
}

export function GanttSection({ workItems }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const tasks = toGanttTasks(workItems)

  return (
    <Card
      title="甘特图"
      extra={<Button type="link" onClick={() => setCollapsed(c => !c)}>{collapsed ? '展开' : '收起'}</Button>}
      style={{ marginTop: 24 }}
    >
      {!collapsed && tasks.length > 0 && (
        <Gantt tasks={tasks} />
      )}
      {!collapsed && tasks.length === 0 && (
        <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 24 }}>暂无排期数据</div>
      )}
    </Card>
  )
}
```

- [ ] **Step 5: Rewrite Dashboard.tsx as orchestrator**

```tsx
// client/src/pages/Dashboard.tsx
import { useState } from 'react'
import { useDashboardStats, usePendingItems } from '@/hooks/useDashboard'
import { useWorkItems } from '@/hooks/useWorkItems'
import { StatCards } from '@/components/dashboard/StatCards'
import { PendingItemsTable } from '@/components/dashboard/PendingItemsTable'
import { GanttSection } from '@/components/dashboard/GanttSection'

export default function Dashboard() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const { data: statsData, isLoading: statsLoading } = useDashboardStats()
  const { data: pendingData, isLoading: pendingLoading } = usePendingItems(filters, page, limit)
  const { data: workItemsData } = useWorkItems({}, 1, 100)

  const handleFilterChange = (key: string, value: string) => {
    setFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  return (
    <div style={{ padding: 24 }}>
      <StatCards
        stats={(statsData?.data ?? {}) as Record<string, number>}
        loading={statsLoading}
      />
      <PendingItemsTable
        items={pendingData?.data ?? []}
        meta={pendingData?.meta}
        loading={pendingLoading}
        page={page}
        limit={limit}
        onPageChange={(p, l) => { setPage(p); setLimit(l) }}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      <GanttSection workItems={workItemsData?.data ?? []} />
    </div>
  )
}
```

- [ ] **Step 6: Typecheck and commit**

```bash
npm run typecheck
git add client/src/pages/Dashboard.tsx client/src/components/dashboard/
git commit -m "refactor(client): split Dashboard into sub-components + hooks"
```

---

### Task 17: Split WorkItemList.tsx

**Files:**
- Modify: `client/src/pages/WorkItemList.tsx` (rewrite as orchestrator ~60 lines)
- Create: `client/src/components/work-item/WorkItemFilters.tsx`
- Create: `client/src/components/work-item/WorkItemTable.tsx`

- [ ] **Step 1: Read WorkItemList.tsx in full**

Open `client/src/pages/WorkItemList.tsx` (725 lines). Identify the filter bar and the table section.

- [ ] **Step 2: Create WorkItemFilters.tsx**

```tsx
// client/src/components/work-item/WorkItemFilters.tsx
import { Row, Col, Input, Select, Button, Space } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import type { WorkItemFilters } from '@/hooks/useWorkItems'

interface Props {
  filters: WorkItemFilters
  onChange: (filters: WorkItemFilters) => void
  onCreateClick: () => void
  canCreate: boolean
}

export function WorkItemFilters({ filters, onChange, onCreateClick, canCreate }: Props) {
  return (
    <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
      <Col>
        <Input
          placeholder="搜索标题"
          prefix={<SearchOutlined />}
          value={filters.title}
          onChange={e => onChange({ ...filters, title: e.target.value })}
          style={{ width: 200 }}
          allowClear
        />
      </Col>
      <Col>
        <Select
          placeholder="状态"
          value={filters.status}
          onChange={v => onChange({ ...filters, status: v })}
          allowClear
          style={{ width: 120 }}
          options={[
            { value: 'todo', label: '待处理' },
            { value: 'in_progress', label: '进行中' },
            { value: 'in_review', label: '审核中' },
            { value: 'done', label: '已完成' },
            { value: 'cancelled', label: '已取消' },
          ]}
        />
      </Col>
      <Col>
        <Select
          placeholder="优先级"
          value={filters.priority}
          onChange={v => onChange({ ...filters, priority: v })}
          allowClear
          style={{ width: 120 }}
          options={[
            { value: 'low', label: '低' },
            { value: 'medium', label: '中' },
            { value: 'high', label: '高' },
            { value: 'urgent', label: '紧急' },
          ]}
        />
      </Col>
      <Col flex="auto" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreateClick}>
            新建工作项
          </Button>
        )}
      </Col>
    </Row>
  )
}
```

- [ ] **Step 3: Create WorkItemTable.tsx**

```tsx
// client/src/components/work-item/WorkItemTable.tsx
import { Table } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { WorkItem } from '@/types/models'
import type { PaginationMeta } from '@/types/api'
import { WorkItemStatusTag, WorkItemPriorityTag } from '@/components/common/StatusTag'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

interface Props {
  items: WorkItem[]
  meta: PaginationMeta | undefined
  loading: boolean
  page: number
  limit: number
  onPageChange: (page: number, pageSize: number) => void
}

export function WorkItemTable({ items, meta, loading, page, limit, onPageChange }: Props) {
  const navigate = useNavigate()

  const columns: ColumnsType<WorkItem> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record) => (
        <a onClick={() => navigate(`/work-items/${record.id}`)}>{title}</a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: WorkItem['status']) => <WorkItemStatusTag status={s} />,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (p: WorkItem['priority']) => <WorkItemPriorityTag priority={p} />,
    },
    {
      title: '负责人',
      key: 'assignee',
      render: (_: unknown, r: WorkItem) => r.assignee?.username ?? '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
  ]

  return (
    <Table
      dataSource={items}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{
        current: page,
        pageSize: limit,
        total: meta?.total ?? 0,
        onChange: onPageChange,
        showSizeChanger: true,
        showTotal: t => `共 ${t} 条`,
      }}
    />
  )
}
```

- [ ] **Step 4: Rewrite WorkItemList.tsx as orchestrator**

```tsx
// client/src/pages/WorkItemList.tsx
import { useState } from 'react'
import { Card } from 'antd'
import { useWorkItems, type WorkItemFilters as Filters } from '@/hooks/useWorkItems'
import { useCreateWorkItem } from '@/hooks/useWorkItemMutations'
import { useAuth } from '@/contexts/AuthContext'
import { WorkItemFilters } from '@/components/work-item/WorkItemFilters'
import { WorkItemTable } from '@/components/work-item/WorkItemTable'

export default function WorkItemList() {
  const { hasRole } = useAuth()
  const [filters, setFilters] = useState<Filters>({})
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useWorkItems(filters, page, limit)
  const createMutation = useCreateWorkItem()

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters)
    setPage(1)
  }

  return (
    <Card title="工作项列表" style={{ margin: 24 }}>
      <WorkItemFilters
        filters={filters}
        onChange={handleFilterChange}
        onCreateClick={() => setCreateOpen(true)}
        canCreate={hasRole('admin')}
      />
      <WorkItemTable
        items={data?.data ?? []}
        meta={data?.meta}
        loading={isLoading}
        page={page}
        limit={limit}
        onPageChange={(p, l) => { setPage(p); setLimit(l) }}
      />
      {/* Create modal: extract from original file, wire to createMutation */}
    </Card>
  )
}
```

> Note: The create modal JSX from the original WorkItemList.tsx should be extracted into its own component or kept inline in the orchestrator — whichever keeps the orchestrator under 100 lines.

- [ ] **Step 5: Typecheck and commit**

```bash
npm run typecheck
git add client/src/pages/WorkItemList.tsx client/src/components/work-item/WorkItemFilters.tsx client/src/components/work-item/WorkItemTable.tsx
git commit -m "refactor(client): split WorkItemList into sub-components + hooks"
```

---

## Phase 6 — Visual Redesign + Cleanup

### Task 18: Configure Ant Design Token and upgrade MainLayout

**Files:**
- Modify: `client/src/main.tsx`
- Modify: `client/src/components/MainLayout.tsx`

- [ ] **Step 1: Add theme Token config to main.tsx**

In `client/src/main.tsx`, update `ConfigProvider`:

```tsx
import { ConfigProvider, theme } from 'antd'

// Inside render:
<ConfigProvider
  locale={zhCN}
  theme={{
    token: {
      colorPrimary: '#4F6EF7',
      borderRadius: 8,
      fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      colorBgContainer: '#ffffff',
      colorBgLayout: '#f1f5f9',
    },
    components: {
      Layout: {
        siderBg: '#0f172a',
        headerBg: '#ffffff',
      },
      Menu: {
        darkItemBg: '#0f172a',
        darkSubMenuItemBg: '#1e293b',
        darkItemSelectedBg: '#1e3a8a',
      },
      Card: { borderRadius: 12 },
      Table: { borderRadius: 8 },
      Button: { borderRadius: 6 },
    },
  }}
>
```

- [ ] **Step 2: Read MainLayout.tsx current content**

Open `client/src/components/MainLayout.tsx` (254 lines) and `client/src/components/MainLayoutStyles.tsx` (160 lines).

- [ ] **Step 3: Remove styled-components from MainLayout**

In `MainLayout.tsx`:
- Remove the import of `MainLayoutStyles.tsx`
- Replace any styled components (e.g., `<StyledHeader>`, `<AnimatedIcon>`) with plain `<Layout.Header>` styled via `style` props or Ant Design component props
- The header becomes a white bar: `<Layout.Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8e8e8' }}>`

- [ ] **Step 4: Verify client renders correctly**

```bash
# from client/
npm run dev
```

Open browser at http://localhost:3000. Verify sidebar is dark, header is white, primary buttons are indigo (`#4F6EF7`).

- [ ] **Step 5: Commit**

```bash
git add client/src/main.tsx client/src/components/MainLayout.tsx
git commit -m "feat(client): apply Ant Design Token theme (dark sidebar, indigo primary)"
```

---

### Task 19: Redesign Login page

**Files:**
- Modify: `client/src/pages/Login.tsx`

- [ ] **Step 1: Read current Login.tsx**

Open `client/src/pages/Login.tsx` (203 lines).

- [ ] **Step 2: Rewrite Login.tsx with left-right split layout**

```tsx
// client/src/pages/Login.tsx
import { useState } from 'react'
import { Form, Input, Button, message, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { login } from '@/utils/api'

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      const res = await login(values)
      authLogin(res.data.data.token, res.data.data.user)
      navigate('/')
    } catch {
      message.error('邮箱或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left panel — brand */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          padding: 48,
        }}
      >
        <Title level={2} style={{ color: '#fff', margin: 0 }}>PipeCode</Title>
        <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 16, textAlign: 'center' }}>
          高效的项目与工作项管理平台
        </Text>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          width: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          padding: 48,
        }}
      >
        <div style={{ width: '100%', maxWidth: 360 }}>
          <Title level={3} style={{ marginBottom: 32 }}>登录</Title>
          <Form layout="vertical" onFinish={handleSubmit} size="large">
            <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
              <Input prefix={<UserOutlined />} placeholder="邮箱" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登录
              </Button>
            </Form.Item>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">还没有账号？</Text>{' '}
              <a href="/register">立即注册</a>
            </div>
          </Form>
        </div>
      </div>

      {/* Mobile fallback: hide left panel below 768px */}
      <style>{`
        @media (max-width: 768px) {
          [data-login-left] { display: none !important; }
          [data-login-right] { width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
```

> Note: Preserve the exact `authLogin` call signature from the current `AuthContext`. If `login` in AuthContext has different parameters, match them.

- [ ] **Step 3: Verify login page renders**

```bash
npm run dev
```

Open http://localhost:3000/login. Verify left dark panel + right form.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Login.tsx
git commit -m "feat(client): redesign Login with left-right split layout"
```

---

### Task 20: Redesign Register page

**Files:**
- Modify: `client/src/pages/Register.tsx`

- [ ] **Step 1: Apply the same left-right split layout as Login**

Open `client/src/pages/Register.tsx` (208 lines). Rewrite using the same outer shell (split div, left panel, right panel) but with the registration form fields (username, email, password, confirm password).

Left panel: identical to Login (brand name + tagline).
Right panel: `<Title level={3}>注册</Title>` + form with fields from the original Register.tsx.

Preserve all form validation rules from the original. Preserve the API call (`register()`) and redirect logic.

- [ ] **Step 2: Verify and commit**

```bash
npm run dev
# open http://localhost:3000/register
git add client/src/pages/Register.tsx
git commit -m "feat(client): redesign Register with left-right split layout"
```

---

### Task 21: Cleanup — delete redundant files, uninstall styled-components

**Files:**
- Delete: `client/src/components/MainLayoutStyles.tsx`
- Delete: `client/src/utils/tagRenderers.tsx` (already done in Task 14 — skip if already deleted)
- Delete: `docs/superpowers/specs/2026-04-30-project-refactor-design.md`

- [ ] **Step 1: Confirm no remaining imports of deleted files**

```bash
grep -r "MainLayoutStyles\|tagRenderers" client/src --include="*.tsx" --include="*.ts"
```

Expected: no output. If any imports remain, fix them before deleting.

- [ ] **Step 2: Delete the files**

```bash
rm client/src/components/MainLayoutStyles.tsx
rm docs/superpowers/specs/2026-04-30-project-refactor-design.md
```

`client/src/utils/tagRenderers.tsx` should already be gone from Task 14. Verify:

```bash
ls client/src/utils/tagRenderers.tsx 2>&1
```

Expected: `No such file or directory`.

- [ ] **Step 3: Uninstall styled-components**

```bash
# from client/
npm uninstall styled-components
npm uninstall @types/styled-components 2>/dev/null || true
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(client): remove styled-components and delete stale files"
```

---

## Phase 7 — Unit Tests

### Task 22: Test server pagination helper and auth plugin

**Files:**
- Create: `server/src/lib/__tests__/pagination.test.ts`
- Create: `server/src/plugins/__tests__/auth.plugin.test.ts`

- [ ] **Step 1: Write failing test for parsePagination**

```ts
// server/src/lib/__tests__/pagination.test.ts
import { describe, it, expect } from 'vitest'
import { parsePagination, paginationMeta } from '../pagination'

describe('parsePagination', () => {
  it('returns defaults when no params given', () => {
    const result = parsePagination({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
    expect(result.skip).toBe(0)
  })

  it('parses page and limit correctly', () => {
    const result = parsePagination({ page: '3', limit: '10' })
    expect(result.page).toBe(3)
    expect(result.limit).toBe(10)
    expect(result.skip).toBe(20)
  })

  it('clamps limit to maximum of 100', () => {
    const result = parsePagination({ page: '1', limit: '999' })
    expect(result.limit).toBe(100)
  })

  it('clamps page to minimum of 1 for invalid input', () => {
    const result = parsePagination({ page: '-1', limit: '20' })
    expect(result.page).toBe(1)
  })

  it('handles non-numeric strings gracefully', () => {
    const result = parsePagination({ page: 'abc', limit: 'xyz' })
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })
})

describe('paginationMeta', () => {
  it('calculates totalPages correctly', () => {
    const meta = paginationMeta(45, 1, 20)
    expect(meta.total).toBe(45)
    expect(meta.totalPages).toBe(3)
    expect(meta.page).toBe(1)
    expect(meta.limit).toBe(20)
  })

  it('rounds totalPages up', () => {
    const meta = paginationMeta(21, 2, 20)
    expect(meta.totalPages).toBe(2)
  })

  it('returns totalPages of 0 when total is 0', () => {
    const meta = paginationMeta(0, 1, 20)
    expect(meta.totalPages).toBe(0)
  })
})
```

- [ ] **Step 2: Run test — verify it FAILS**

```bash
# from server/
npm test
```

Expected: FAIL — `parsePagination` not implemented yet (it IS implemented — this test should PASS on first run since the helper exists; verify all assertions pass).

- [ ] **Step 3: Run test — confirm all pass**

```bash
npm test
```

Expected output:
```
✓ parsePagination > returns defaults when no params given
✓ parsePagination > parses page and limit correctly
✓ parsePagination > clamps limit to maximum of 100
✓ parsePagination > clamps page to minimum of 1 for invalid input
✓ parsePagination > handles non-numeric strings gracefully
✓ paginationMeta > calculates totalPages correctly
✓ paginationMeta > rounds totalPages up
✓ paginationMeta > returns totalPages of 0 when total is 0

Test Files: 1 passed (1)
Tests: 8 passed (8)
```

- [ ] **Step 4: Write auth plugin test**

```ts
// server/src/plugins/__tests__/auth.plugin.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import Fastify from 'fastify'
import jwt from 'jsonwebtoken'
import authPlugin from '../auth.plugin'

const JWT_SECRET = 'test-secret'

async function buildTestApp() {
  process.env.JWT_SECRET = JWT_SECRET
  const app = Fastify()
  await app.register(authPlugin)
  app.get('/protected', async (request, reply) => {
    return { user: request.user }
  })
  return app
}

describe('auth plugin', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>

  beforeAll(async () => {
    app = await buildTestApp()
  })

  it('sets request.user to null when no Authorization header', async () => {
    const res = await app.inject({ method: 'GET', url: '/protected' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).user).toBeNull()
  })

  it('populates request.user with valid JWT', async () => {
    const token = jwt.sign({ id: 42, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' })
    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).user.id).toBe(42)
  })

  it('sets request.user to null for expired JWT', async () => {
    const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '-1s' })
    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).user).toBeNull()
  })

  it('sets request.user to null for malformed token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { Authorization: 'Bearer not-a-valid-jwt' },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).user).toBeNull()
  })
})
```

> Note: The auth plugin may set `request.user` to null on invalid tokens, or it may throw 401. Adjust the expected status codes based on the actual behavior in `server/src/plugins/auth.plugin.ts`. Read that file first.

- [ ] **Step 5: Run server tests**

```bash
# from server/
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add server/src/lib/__tests__/ server/src/plugins/__tests__/
git commit -m "test(server): add unit tests for pagination helper and auth plugin"
```

---

### Task 23: Test useWorkItems and useWorkItem hooks

**Files:**
- Create: `client/src/hooks/__tests__/useWorkItems.test.ts`
- Create: `client/src/hooks/__tests__/useWorkItem.test.ts`

- [ ] **Step 1: Create wrapper helper**

Both test files need a `QueryClientProvider` wrapper. Create a shared helper inline in each test (do not create a shared file — tests should be self-contained):

```ts
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}
```

- [ ] **Step 2: Write useWorkItems.test.ts**

```ts
// client/src/hooks/__tests__/useWorkItems.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { useWorkItems } from '../useWorkItems'
import { workItemsFixture } from '@/test/fixtures/workItems'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useWorkItems', () => {
  it('returns paginated work items on success', async () => {
    const { result } = renderHook(() => useWorkItems(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data).toEqual(workItemsFixture)
    expect(result.current.data?.meta?.total).toBe(1)
    expect(result.current.data?.meta?.page).toBe(1)
  })

  it('is loading initially', () => {
    const { result } = renderHook(() => useWorkItems(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('includes filters in the query key (different filters = different cache entry)', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result: r1 } = renderHook(() => useWorkItems({ status: 'todo' }), { wrapper })
    const { result: r2 } = renderHook(() => useWorkItems({ status: 'done' }), { wrapper })

    await waitFor(() => expect(r1.current.isSuccess).toBe(true))
    await waitFor(() => expect(r2.current.isSuccess).toBe(true))

    const queries = queryClient.getQueryCache().getAll()
    const keys = queries.map(q => JSON.stringify(q.queryKey))
    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(2)
  })
})
```

- [ ] **Step 3: Write useWorkItem.test.ts**

```ts
// client/src/hooks/__tests__/useWorkItem.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { useWorkItem } from '../useWorkItem'
import { workItemFixture } from '@/test/fixtures/workItems'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useWorkItem', () => {
  it('fetches a single work item by id', async () => {
    const { result } = renderHook(() => useWorkItem(1), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data).toEqual(workItemFixture)
  })

  it('does not fetch when id is undefined', () => {
    const { result } = renderHook(() => useWorkItem(undefined), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isLoading).toBe(false)
  })
})
```

- [ ] **Step 4: Run tests**

```bash
# from client/
npm test
```

Expected: all tests in both files pass.

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/__tests__/
git commit -m "test(client): add hook tests for useWorkItems and useWorkItem"
```

---

### Task 24: Test useWorkItemMutations

**Files:**
- Create: `client/src/hooks/__tests__/useWorkItemMutations.test.ts`

- [ ] **Step 1: Write the test file**

```ts
// client/src/hooks/__tests__/useWorkItemMutations.test.ts
import { renderHook, act, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'
import { useCreateWorkItem, useUpdateWorkItem, useDeleteWorkItem } from '../useWorkItemMutations'
import { workItemFixture } from '@/test/fixtures/workItems'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  }
}

describe('useCreateWorkItem', () => {
  it('calls the create API and invalidates work-items cache on success', async () => {
    const { queryClient, wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateWorkItem(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ title: '新工作项', status: 'todo', priority: 'medium' } as any)
    })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['work-items'] })
    )
  })
})

describe('useUpdateWorkItem', () => {
  it('invalidates both list and detail queries on success', async () => {
    const { queryClient, wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateWorkItem(1), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ title: '更新后标题' } as any)
    })

    const calledKeys = invalidateSpy.mock.calls.map(c => JSON.stringify((c[0] as any)?.queryKey))
    expect(calledKeys).toContain(JSON.stringify(['work-items']))
    expect(calledKeys).toContain(JSON.stringify(['work-items', 1]))
  })
})

describe('useDeleteWorkItem', () => {
  it('invalidates work-items cache after deletion', async () => {
    const { queryClient, wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteWorkItem(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(1)
    })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['work-items'] })
    )
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add client/src/hooks/__tests__/useWorkItemMutations.test.ts
git commit -m "test(client): add mutation hook tests for work items"
```

---

### Task 25: Test ErrorBoundary, PageSkeleton, StatusTag, and AuthContext

**Files:**
- Create: `client/src/components/common/__tests__/ErrorBoundary.test.tsx`
- Create: `client/src/components/common/__tests__/PageSkeleton.test.tsx`
- Create: `client/src/components/common/__tests__/StatusTag.test.tsx`
- Create: `client/src/contexts/__tests__/AuthContext.test.tsx`

- [ ] **Step 1: Write ErrorBoundary.test.tsx**

```tsx
// client/src/components/common/__tests__/ErrorBoundary.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ErrorBoundary } from '../ErrorBoundary'

function BrokenComponent(): never {
  throw new Error('测试错误')
}

function WorkingComponent() {
  return <div>正常内容</div>
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('正常内容')).toBeInTheDocument()
  })

  it('renders error fallback UI when child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('页面加载出错')).toBeInTheDocument()
    expect(screen.getByText('测试错误')).toBeInTheDocument()
    consoleSpy.mockRestore()
  })

  it('recovers when retry button is clicked', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )

    const retryButton = screen.getByRole('button', { name: '重试' })
    await user.click(retryButton)

    expect(screen.queryByText('页面加载出错')).not.toBeInTheDocument()
    consoleSpy.mockRestore()
  })
})
```

- [ ] **Step 2: Write PageSkeleton.test.tsx**

```tsx
// client/src/components/common/__tests__/PageSkeleton.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PageSkeleton } from '../PageSkeleton'

describe('PageSkeleton', () => {
  it('renders without crashing in list variant', () => {
    const { container } = render(<PageSkeleton variant="list" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders without crashing in detail variant', () => {
    const { container } = render(<PageSkeleton variant="detail" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('defaults to list variant', () => {
    const { container } = render(<PageSkeleton />)
    expect(container.firstChild).toBeTruthy()
  })
})
```

- [ ] **Step 3: Write StatusTag.test.tsx**

```tsx
// client/src/components/common/__tests__/StatusTag.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WorkItemStatusTag, WorkItemPriorityTag, TicketStatusTag } from '../StatusTag'

describe('WorkItemStatusTag', () => {
  it('renders "待处理" for todo status', () => {
    render(<WorkItemStatusTag status="todo" />)
    expect(screen.getByText('待处理')).toBeInTheDocument()
  })

  it('renders "已完成" for done status', () => {
    render(<WorkItemStatusTag status="done" />)
    expect(screen.getByText('已完成')).toBeInTheDocument()
  })

  it('renders "进行中" for in_progress status', () => {
    render(<WorkItemStatusTag status="in_progress" />)
    expect(screen.getByText('进行中')).toBeInTheDocument()
  })
})

describe('WorkItemPriorityTag', () => {
  it('renders "紧急" for urgent priority', () => {
    render(<WorkItemPriorityTag priority="urgent" />)
    expect(screen.getByText('紧急')).toBeInTheDocument()
  })

  it('renders "低" for low priority', () => {
    render(<WorkItemPriorityTag priority="low" />)
    expect(screen.getByText('低')).toBeInTheDocument()
  })
})

describe('TicketStatusTag', () => {
  it('renders "已解决" for resolved status', () => {
    render(<TicketStatusTag status="resolved" />)
    expect(screen.getByText('已解决')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Write AuthContext.test.tsx**

```tsx
// client/src/contexts/__tests__/AuthContext.test.tsx
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'

// Note: AuthContext calls getCurrentUser() on mount via api.ts.
// The MSW handler for /api/auth/me must be added to handlers.ts
// or the test must set up a local override:

import { server } from '@/test/server'
import { http, HttpResponse } from 'msw'

function TestConsumer() {
  const { isAuthenticated, hasRole, user } = useAuth()
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="has-admin">{hasRole('admin') ? 'yes' : 'no'}</span>
      <span data-testid="username">{user?.username ?? 'none'}</span>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('is not authenticated when no token in localStorage', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json(null, { status: 401 }))
    )

    await act(async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>)
    })

    expect(screen.getByTestId('auth').textContent).toBe('no')
  })

  it('hasRole returns false for insufficient role', async () => {
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json({ success: true, data: { id: 1, username: 'user', role: 'user', email: 'a@b.com', createdAt: '', updatedAt: '' } })
      )
    )
    localStorage.setItem('token', 'fake-token')

    await act(async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>)
    })

    expect(screen.getByTestId('has-admin').textContent).toBe('no')
  })
})
```

> Note: Read `client/src/contexts/AuthContext.tsx` before writing this test. Adjust the `AuthProvider` and `useAuth` import paths and the mock response shape to match the actual implementation.

- [ ] **Step 5: Add /api/auth/me handler to handlers.ts**

Open `client/src/test/handlers.ts` and add:

```ts
http.get('/api/auth/me', () =>
  HttpResponse.json(null, { status: 401 })
),
```

(Default to 401; individual tests override with `server.use(...)` as needed.)

- [ ] **Step 6: Run all client tests**

```bash
# from client/
npm test
```

Expected: all tests across all test files pass with no failures.

- [ ] **Step 7: Final commit**

```bash
git add client/src/components/common/__tests__/ client/src/contexts/__tests__/ client/src/test/handlers.ts
git commit -m "test(client): add component and context unit tests"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Covered by task |
|-----------------|----------------|
| @fastify/compress | Task 1 |
| Pagination helper | Task 2 |
| Paginate all 5 list endpoints | Tasks 3–4 |
| Update ApiSuccess meta type | Task 7 |
| Install React Query | Task 8 |
| useWorkItems + useWorkItem | Task 9 |
| useWorkItemMutations | Task 10 |
| useProjects, useTickets, useDashboard, useUsers | Task 11 |
| ErrorBoundary + wrap App routes | Task 12 |
| PageSkeleton | Task 13 |
| StatusTag (replace tagRenderers) | Task 14 |
| WorkItemDetail split (5 files) | Task 15 |
| Dashboard split (4 files) | Task 16 |
| WorkItemList split (3 files) | Task 17 |
| Ant Design Token | Task 18 |
| Login redesign | Task 19 |
| Register redesign | Task 20 |
| Remove styled-components + delete files | Task 21 |
| Server tests (pagination, auth) | Task 22 |
| Hook tests (useWorkItems, useWorkItem) | Task 23 |
| Mutation hook tests | Task 24 |
| Component + context tests | Task 25 |

**Gap found:** WorkItemDetail left-right layout is described in the spec but merged into Task 15 (the orchestrator file itself IS the left-right layout). Covered.

**Gap found:** GanttSection in `client/src/types/models.ts` uses `startDate`/`dueDate` but Prisma schema uses `scheduledStartDate`/`scheduledEndDate`. The GanttSection.tsx in Task 16 uses `startDate`/`dueDate` to match the existing frontend types. If the server `serializeWorkItem()` maps these fields differently, the implementing engineer must check `server/src/utils/enumTransform.ts` → `serializeWorkItem` and update the field names in GanttSection accordingly.

**Gap found:** `WorkItemEditForm` in Task 15 Step 6 notes "copy ALL form fields" but doesn't show dates/hours fields. Engineer must read the original `WorkItemDetail.tsx` carefully and copy those fields in.

No other coverage gaps found.
