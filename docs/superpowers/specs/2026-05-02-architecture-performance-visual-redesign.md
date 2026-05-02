# 架构、性能与视觉全面优化设计文档

**日期：** 2026-05-02  
**方案：** 大爆炸重构（方案二）  
**范围：** 前端架构 + 后端分页/压缩 + 视觉重设计（不改动数据库 schema）

---

## 背景

当前系统为企业项目管理工具，功能完整但存在以下主要问题：

- 页面组件过大（WorkItemDetail 856行、Dashboard 836行），混合了数据获取、状态、UI 逻辑
- 无数据缓存，每次路由切换重新请求全部数据
- 所有列表接口全量返回，无分页，不可扩展
- TypeScript 类型弱（大量 `any`），API 响应类型不明确
- 视觉风格基础，缺乏层次感和现代感

---

## 实施策略

大爆炸重构：分四个阶段顺序推进，每阶段完成后可独立验证。

---

## 阶段一：数据层架构（React Query + TypeScript）

### 依赖安装

```
@tanstack/react-query
@tanstack/react-query-devtools
```

### QueryClient 配置

在 `client/src/main.tsx` 中配置并注入：

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5分钟内不重新发起请求
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

用 `QueryClientProvider` 包裹整个 `App`。开发环境挂载 `ReactQueryDevtools`（position: bottom-right）。

### 自定义 Hook 层

新建目录 `client/src/hooks/`，按业务域拆分：

| Hook 文件 | 导出 Hook | 对应原 API | 说明 |
|-----------|----------|-----------|------|
| `useWorkItems.ts` | `useWorkItems(filters, page, limit)` | `getWorkItems()` | 支持分页+筛选，queryKey 包含 filters |
| `useWorkItem.ts` | `useWorkItem(id)` | `getWorkItemDetail()` | 单条详情，id 为 undefined 时 disabled |
| `useWorkItemMutations.ts` | `useCreateWorkItem`, `useUpdateWorkItem`, `useDeleteWorkItem` | 对应 POST/PUT/DELETE | 成功后 invalidate `['work-items']` |
| `useProjects.ts` | `useProjects(filters, page, limit)` | `getProjects()` | — |
| `useDashboard.ts` | `useDashboardStats(filters)` | `getDashboardStats()` | — |
| `useTickets.ts` | `useTickets(filters, page, limit)` | `getTickets()` | — |
| `useUsers.ts` | `useUsers()` | `getUsers()` | 管理员用；后端接口统一支持分页参数，前端初期全量获取（数据量小），保留扩展能力 |

Mutation 成功后统一调用 `queryClient.invalidateQueries({ queryKey: [domain] })` 使列表缓存失效。

### TypeScript 类型改造

- `client/src/types/models.ts` 中已有 `User`, `Project`, `WorkItem`, `Ticket`, `Activity` 类型 — 以此为准
- `client/src/utils/api.ts` 所有函数返回类型从 `any` 改为泛型（`Promise<T>`）
- 所有页面组件中的 `useState<any>` 改为 `useState<WorkItem[]>` 等具体类型
- Hook 返回类型通过 `UseQueryResult<T>` 自动推断，无需手动标注

---

## 阶段二：组件拆分

### WorkItemDetail.tsx（856行 → 5 个文件）

```
client/src/pages/WorkItemDetail.tsx          # 编排器，~120行：调用 useWorkItem、组合布局
client/src/components/work-item/
├── WorkItemInfoPanel.tsx                    # 右栏：状态/优先级/负责人/项目/工时/日期
├── WorkItemEditForm.tsx                     # 编辑模态框表单（含字段联动逻辑）
├── AttachmentSection.tsx                    # 附件上传 + 列表（调用 useWorkItemMutations）
├── CommentSection.tsx                       # 评论输入框 + 评论列表
└── ActivityTimeline.tsx                     # 操作历史时间线（只读展示）
```

`WorkItemDetail.tsx` 职责：调用 `useWorkItem(id)`、渲染 `PageSkeleton` 或左右分栏布局，不含任何业务逻辑。

### Dashboard.tsx（836行 → 4 个文件）

```
client/src/pages/Dashboard.tsx               # 编排器，~80行：调用 useDashboardStats、组合布局
client/src/components/dashboard/
├── StatCards.tsx                            # 顶部4个统计卡片（接收 stats 数据作为 props）
├── PendingItemsTable.tsx                    # 待处理工作项表格 + 筛选条件
└── GanttSection.tsx                         # 甘特图 + 折叠控制
```

### WorkItemList.tsx（725行 → 3 个文件）

```
client/src/pages/WorkItemList.tsx            # 编排器，~60行：管理筛选状态、传递给子组件
client/src/components/work-item/
├── WorkItemFilters.tsx                      # 搜索栏 + 状态/优先级/类型/人员筛选
└── WorkItemTable.tsx                        # Ant Table + 受控分页（绑定 useWorkItems）
```

### 新增共享组件

| 文件 | 职责 |
|------|------|
| `components/common/PageSkeleton.tsx` | 通用骨架屏：list 变体（模拟表格行）、detail 变体（左右分栏骨架） |
| `components/common/ErrorBoundary.tsx` | 路由级错误边界，`componentDidCatch` 捕获，展示友好错误提示 |
| `components/common/StatusTag.tsx` | 从 `tagRenderers.tsx` 提取状态/优先级/类型标签，全局统一复用 |

`App.tsx` 中每个路由的 `React.lazy` 组件外包一层 `<ErrorBoundary>`。

---

## 阶段三：视觉重设计

### Ant Design Token 主题

在 `client/src/main.tsx` 的 `ConfigProvider` 中注入（不改任何页面组件）：

```tsx
theme={{
  token: {
    colorPrimary: '#4F6EF7',
    borderRadius: 8,
    fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f1f5f9',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    boxShadowSecondary: '0 4px 12px rgba(0,0,0,0.12)',
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
```

### Login / Register 页面重设计

左右分栏布局，替换现有居中单卡片：

- **左半屏（50%）：** 深色渐变背景（`#0f172a → #1e3a5f`）+ 居中的品牌 Logo + 一句话产品描述
- **右半屏（50%）：** 白色背景，居中表单，无外框卡片（背景本身提供层次）
- 表单输入框统一加 prefix 图标（`UserOutlined` / `LockOutlined` / `MailOutlined`）
- 移动端（< 768px）退化为单栏：隐藏左侧，全屏显示表单

### WorkItemDetail 左右分栏布局

```
┌─────────────────────────────────────────┬──────────────────────┐
│  标题（h3，可编辑）                        │  状态（Select）       │
│  描述（RichText 或 TextArea）             │  优先级              │
│  ─────────────────────────────────────  │  类型                │
│  附件区域（AttachmentSection）            │  负责人              │
│  ─────────────────────────────────────  │  所属项目            │
│  评论区（CommentSection）                 │  预计工时            │
│  ─────────────────────────────────────  │  开始日期            │
│  操作历史（ActivityTimeline）             │  截止日期            │
│  （左栏，flex: 1，min-width: 0）          │  （右栏，固定 280px）  │
└─────────────────────────────────────────┴──────────────────────┘
```

### 骨架屏替换 Spin

`PageSkeleton` 组件提供两种变体：

- **`list` 变体：** 顶部一行工具栏骨架 + 5行表格行骨架，用于 WorkItemList、ProjectList、TicketList 等
- **`detail` 变体：** 左右两栏骨架（左：3段段落骨架，右：6个字段骨架），用于 WorkItemDetail、TicketDetail 等

各页面 `isLoading` 为 true 时渲染 `<PageSkeleton variant="list|detail" />`，取代所有 `<Spin>`。

### MainLayout 侧边栏升级

- 侧边栏背景 `#0f172a`（深色），与 Token 一致，移除现有蓝紫渐变
- 菜单激活色 `#4F6EF7`（主色），未激活文字 `#94a3b8`（浅灰）
- Header 改为纯白，左侧显示当前页面标题，右侧保留用户头像下拉
- 移除 `MainLayoutStyles.tsx` 中的 styled-components 旋转动画，改为静态 Logo

---

## 阶段四：后端改造

### 分页接口规范

所有列表接口统一支持查询参数 `?page=1&limit=20`（`limit` 最大值 100）。

响应格式统一：

```ts
{
  data: T[],
  total: number,
  page: number,
  limit: number,
  totalPages: number,
}
```

涉及路由文件：

| 文件 | 接口 |
|------|------|
| `routes/work-items/index.ts` | `GET /api/work-items` |
| `routes/projects.ts` | `GET /api/projects` |
| `routes/tickets.ts` | `GET /api/tickets`、`GET /api/admin/tickets` |
| `routes/users.ts` | `GET /api/users` |
| `routes/dashboard.ts` | `GET /api/dashboard/pending` |

Prisma 实现：`skip: (page - 1) * limit`、`take: limit`，同一事务中并行执行 `count()` 获取 `total`。

### Gzip 压缩

```
npm install @fastify/compress  （在 server/ 目录下）
```

在 `server/src/app.ts` 中，注册位置在 `@fastify/static` 之前：

```ts
await app.register(import('@fastify/compress'), {
  global: true,
  threshold: 1024,
  encodings: ['gzip', 'deflate'],
})
```

### 客户端分页适配

- 各 Hook 接收 `page: number`、`limit: number` 参数，包含在 queryKey 中
- `total` 和 `totalPages` 从响应中解构后透传给组件
- Ant Design Table `pagination` prop 改为受控：`{ current: page, pageSize: limit, total, onChange: setPage }`

---

## 文件变更概览

### 新增文件

```
client/src/hooks/
  useWorkItems.ts, useWorkItem.ts, useWorkItemMutations.ts
  useProjects.ts, useDashboard.ts, useTickets.ts, useUsers.ts

client/src/components/
  common/PageSkeleton.tsx
  common/ErrorBoundary.tsx
  common/StatusTag.tsx
  work-item/WorkItemInfoPanel.tsx
  work-item/WorkItemEditForm.tsx
  work-item/AttachmentSection.tsx
  work-item/CommentSection.tsx
  work-item/ActivityTimeline.tsx
  work-item/WorkItemFilters.tsx
  work-item/WorkItemTable.tsx
  dashboard/StatCards.tsx
  dashboard/PendingItemsTable.tsx
  dashboard/GanttSection.tsx
```

### 重大修改文件

```
client/src/main.tsx               — QueryClientProvider + ConfigProvider Token
client/src/App.tsx                — ErrorBoundary 包裹每个路由
client/src/utils/api.ts           — 返回类型泛型化，分页参数支持
client/src/pages/WorkItemDetail.tsx  — 重写为编排器
client/src/pages/Dashboard.tsx       — 重写为编排器
client/src/pages/WorkItemList.tsx    — 重写为编排器
client/src/pages/Login.tsx           — 左右分栏重设计
client/src/pages/Register.tsx        — 左右分栏重设计
server/src/app.ts                 — 注册 @fastify/compress
server/src/routes/work-items/index.ts  — 分页
server/src/routes/projects.ts         — 分页
server/src/routes/tickets.ts          — 分页
server/src/routes/users.ts            — 分页
server/src/routes/dashboard.ts        — 分页
```

---

### 移除 styled-components

`MainLayoutStyles.tsx` 改为普通 CSS / Ant Design Token 后，`styled-components` 在 client 中无其他使用点。在 `client/package.json` 中一并卸载：

```
npm uninstall styled-components @types/styled-components  （在 client/ 目录下）
```

---

## 阶段五：单元测试

所有前四阶段实施完成后补充单元测试。

### 测试框架（前端）

| 包 | 用途 |
|----|------|
| `vitest` | 测试运行器（Vite 原生，与项目构建配置共享） |
| `@testing-library/react` | React 组件渲染与交互断言 |
| `@testing-library/user-event` | 模拟真实用户交互（输入、点击） |
| `@testing-library/jest-dom` | 扩展 DOM 断言（`toBeInTheDocument` 等） |
| `msw` | Mock Service Worker，拦截 HTTP 请求，为 React Query Hook 提供 mock API |

在 `client/vite.config.ts` 中添加 `test` 配置（`environment: 'jsdom'`、`setupFiles`）。

### 测试框架（后端）

| 包 | 用途 |
|----|------|
| `vitest` | 与前端共用，在 `server/` 目录单独配置 |
| `@prisma/client` mock | 使用 `vitest` 的 `vi.mock` mock Prisma client，隔离数据库 |

### 测试覆盖范围与优先级

#### 高优先级（必须覆盖）

| 测试目标 | 类型 | 验证内容 |
|---------|------|---------|
| `useWorkItems` Hook | 单元 | 正确调用 API、返回分页数据、filter 参数变化时重新请求 |
| `useWorkItem` Hook | 单元 | id 为 undefined 时不发请求；id 有效时返回单条数据 |
| `useCreateWorkItem` / `useUpdateWorkItem` | 单元 | mutation 成功后 invalidate `['work-items']` 缓存 |
| `AuthContext` | 单元 | `hasRole()` 层级比较正确；401 响应清除 token |
| `ErrorBoundary` | 组件 | 子组件抛出错误时渲染 fallback UI |
| `PageSkeleton` | 组件 | `variant="list"` 和 `variant="detail"` 各渲染正确骨架结构 |
| `StatusTag` | 组件 | 每种状态/优先级值渲染对应颜色和文本 |

#### 中优先级（建议覆盖）

| 测试目标 | 类型 | 验证内容 |
|---------|------|---------|
| `WorkItemFilters` | 组件 | 筛选条件变化时调用 `onChange` 回调 |
| `WorkItemTable` | 组件 | 分页切换时更新 `page` 状态 |
| `CommentSection` | 组件 | 提交空评论时不发请求；提交有内容评论后清空输入框 |
| 后端分页逻辑 | 单元 | `page=2&limit=10` 时 Prisma 收到正确的 `skip=10, take=10` |
| 后端 auth 插件 | 单元 | 无 token 返回 401；过期 token 返回 401；有效 token 解析 `request.user` |

#### 低优先级（时间允许时覆盖）

| 测试目标 | 类型 | 验证内容 |
|---------|------|---------|
| `StatCards` | 组件 | 接收 stats props 后渲染正确数值 |
| `ActivityTimeline` | 组件 | 空活动列表时渲染空状态 |
| `api.ts` 拦截器 | 单元 | 401 响应时调用 `localStorage.removeItem('token')` |

### 测试文件组织

```
client/src/
├── hooks/
│   ├── useWorkItems.ts
│   └── __tests__/
│       ├── useWorkItems.test.ts
│       └── useWorkItem.test.ts
├── components/
│   ├── common/
│   │   └── __tests__/
│   │       ├── ErrorBoundary.test.tsx
│   │       ├── PageSkeleton.test.tsx
│   │       └── StatusTag.test.tsx
│   └── work-item/
│       └── __tests__/
│           ├── WorkItemFilters.test.tsx
│           └── CommentSection.test.tsx
└── contexts/
    └── __tests__/
        └── AuthContext.test.tsx

server/src/
├── routes/
│   └── __tests__/
│       ├── work-items.pagination.test.ts
│       └── auth.plugin.test.ts
```

### MSW 配置（前端 Hook 测试）

在 `client/src/test/` 下新建：

- `setup.ts` — 全局 `beforeAll(server.listen)`、`afterEach(server.resetHandlers)`、`afterAll(server.close)`
- `handlers.ts` — 所有 API 的 mock handler（返回固定 fixture 数据）
- `fixtures/` — `workItems.ts`、`projects.ts`、`tickets.ts`（mock 响应数据）

---

## 不在本次范围内

- 数据库 schema 变更（attachments/comments JSON 列不改为关系表）
- E2E 测试（Playwright / Cypress）
- i18n 国际化
- 图片懒加载 / CDN
- Rate limiting / 输入校验（Zod/Joi）
