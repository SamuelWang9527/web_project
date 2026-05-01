# 项目全面重构设计规格

**日期**：2026-04-30  
**范围**：全栈重构（前端 + 后端 + UI）  
**推进方式**：4 阶段分步迁移，每阶段完成后项目可正常运行

---

## 一、目标与背景

当前项目为 React 18 + CRA + Express + Sequelize + MySQL 全栈项目管理系统，存在以下核心问题：

- **CRA 已废弃**，构建速度慢，SPA 刷新路由 404
- **无 TypeScript**，大型文件缺乏类型保护（WorkItemDetail.js 1282 行，workItems.js 1714 行）
- **路由即逻辑**，后端无分层，业务逻辑、验证、数据库操作混在路由文件
- **前端状态混乱**，15 个页面各自 useState + useEffect，大量重复代码
- **UI 为 Ant Design 默认样式**，无设计系统，缺乏企业级精致感

重构目标：可维护性、性能、UI 精致感全面提升。

---

## 二、技术栈决策

| 维度 | 现状 | 目标 | 理由 |
|------|------|------|------|
| 构建工具 | CRA | Vite 5 | 极速 HMR，官方推荐替代方案 |
| 语言 | JavaScript | TypeScript（严格模式） | 全量迁移，最大化类型安全收益 |
| 后端框架 | Express 4 | Fastify 4 | 原生 TS 支持，性能更强，插件模式清晰 |
| ORM | Sequelize 6 | Prisma | TS 类型推断最佳，schema 即文档 |
| 认证 | 手写 JWT + bcryptjs | Better Auth | 内置 session 管理、角色权限，减少自维护安全代码 |
| 前端状态 | useState（分散） | Zustand + React Query | Zustand 管 UI 状态，React Query 管服务端数据 |
| UI 设计 | Ant Design 默认 | Ant Design v5 深度定制 | 对标阿里妈妈风格，保留组件库降低迁移成本 |
| 数据库 | MySQL | MySQL（不动） | 无需数据迁移，降低风险 |

---

## 三、阶段 ① · 基础设施迁移

**目标**：完成技术栈骨架切换，项目可正常启动运行，修复 SPA 404。

### 前端

**Vite 5 迁移（替换 CRA）**
- 新建 `vite.config.ts`，配置 `@vitejs/plugin-react`
- `index.html` 移至项目根目录，入口改为 `src/main.tsx`
- 配置 `server.proxy` 将 `/api/*` 转发至 `:5000`
- 开启 `historyApiFallback`，**修复 SPA 刷新 404 问题**
- 环境变量从 `REACT_APP_*` 全部改为 `VITE_*`

**TypeScript 全量迁移**
- `tsconfig.json` 启用 `strict: true`
- 所有 `.js/.jsx` → `.ts/.tsx`
- 新增 `src/types/` 目录存放全局类型定义（User、Project、WorkItem、Ticket、WorkItemActivity）
- 路径别名：`@/` 指向 `src/`

**新增目录结构**
```
client/src/
├── types/          ← 新增：全局 TypeScript 类型
├── hooks/          ← 新增：自定义 Hooks（阶段③填充）
├── api/            ← 保留，改为 TypeScript
├── components/     ← 保留，扩充（阶段③填充）
├── contexts/       ← 保留
├── pages/          ← 保留，逐步拆分（阶段③）
└── utils/          ← 保留
```

### 后端

**Express → Fastify 4**
- `@fastify/cors` 替换 Express CORS 中间件
- `@fastify/multipart` 替换 Multer（文件上传逻辑保留）
- `@fastify/static` 服务 `client/dist` 静态文件，配置 SPA fallback（所有非 `/api` 路由返回 `index.html`）
- 路由改为 `fastify.register()` 插件模式，每个路由模块独立注册
- 全局错误处理改为 `fastify.setErrorHandler()`

**Sequelize → Prisma**
- 运行 `prisma db pull` 从现有 MySQL 反向生成 `schema.prisma`（保留现有数据）
- 校验生成的 schema 与现有 5 个 Model 一致（User、Project、WorkItem、Ticket、WorkItemActivity）
- 运行 `prisma migrate dev` 建立迁移历史基准
- Prisma Client 类型自动覆盖所有模型字段，替换 Sequelize 类型

**Better Auth 认证系统**
- 服务端：`server/src/auth.ts` 统一配置，接入 Prisma adapter
- 内置 session 管理，替换手写 JWT 签发/验证逻辑
- 保留三种角色：`user / admin / super_admin`，通过 Better Auth 插件实现
- Fastify 插件将 `request.user` 注入所有受保护路由
- 客户端：`AuthContext` 改为调用 Better Auth client SDK，自动处理 token 刷新

---

## 四、阶段 ② · 后端重构

**目标**：引入三层架构，拆分 1700 行路由文件，统一 API 响应格式。

### 三层分层架构

```
Routes 层  →  接收请求，解析参数，调用 Service，格式化响应（每文件 ≤ 150 行）
Services 层 →  所有业务逻辑：权限校验、状态流转、活动日志、Excel 生成（纯函数，可独立测试）
Prisma 层   →  只做数据库读写，Services 直接调用 prisma.model.method()
```

### 路由拆分方案

**拆分前**：`routes/workItems.js` 1714 行（验证 + 业务逻辑 + 数据库 + 文件处理 + Excel 导出混合）

**拆分后**：
```
server/src/
├── routes/
│   ├── work-items/
│   │   ├── index.ts         ← CRUD 主路由，~80 行
│   │   ├── attachments.ts   ← 附件上传/下载，~60 行
│   │   └── comments.ts      ← 评论 CRUD，~60 行
│   ├── projects.ts          ← ~100 行
│   ├── tickets.ts           ← ~100 行
│   ├── dashboard.ts         ← ~80 行
│   └── auth.ts              ← ~60 行
└── services/
    ├── workItem.service.ts  ← 工作项业务逻辑，~200 行
    ├── project.service.ts   ← 项目业务逻辑，~100 行
    ├── ticket.service.ts    ← 工单业务逻辑，~100 行
    ├── export.service.ts    ← Excel 导出逻辑，~80 行
    └── upload.service.ts    ← 文件处理逻辑，~60 行
```

### 统一 API 响应格式

```typescript
// 成功
{ success: true, data: T, meta?: { total: number, page: number } }

// 错误
{ success: false, error: { code: string, message: string } }
```

通过 Fastify `setErrorHandler` + 响应工具函数统一处理，前端 React Query 统一解析，消除各页面重复 catch 逻辑。

删除遗留测试端点（`/work-items/test-upload-simple`）。

---

## 五、阶段 ③ · 前端架构重构

**目标**：消灭重复的数据获取代码，拆分千行巨型组件，建立公共组件库。

### React Query（服务端状态）

每个数据实体对应一组自定义 Hook，彻底替换各页面手写的 `useState + useEffect + fetch`：

```typescript
useWorkItems(filters)       // 工作项列表 + 筛选
useWorkItemDetail(id)       // 工作项详情
useProjects()               // 项目列表
useProjectDetail(id)        // 项目详情
useDashboardStats(range)    // 仪表盘统计
useTickets(filters)         // 工单列表
```

所有 loading / error / 缓存 / 重试由 React Query 统一处理，各页面不再手写。

### Zustand（客户端 UI 状态）

三个 Store，职责严格分离：

- **authStore**：用户信息、角色、登录态（替换 AuthContext 中的状态部分）
- **uiStore**：侧边栏折叠、主题偏好、全局 loading
- **filterStore**：工作项/项目筛选条件，持久化到 localStorage

### 巨型组件拆分

**WorkItemDetail（1282 行）→**
```
pages/WorkItemDetail/
├── index.tsx               ← 布局组装，~80 行
├── WorkItemInfo.tsx         ← 基本信息面板，~120 行
├── WorkItemComments.tsx     ← 评论列表 + 发送，~100 行
├── WorkItemAttachments.tsx  ← 附件列表 + 上传，~90 行
├── WorkItemActivity.tsx     ← 操作历史，~80 行
└── useWorkItemDetail.ts     ← 页面级 Hook，~60 行
```

**Dashboard（963 行）→**
```
pages/Dashboard/
├── index.tsx               ← 布局组装，~60 行
├── StatsCards.tsx           ← 4 个数据卡片，~80 行
├── PendingList.tsx          ← 待处理工作项，~90 行
├── GanttSection.tsx         ← 甘特图，~80 行
├── ChartsSection.tsx        ← 图表区域，~100 行
└── useDashboard.ts          ← 页面级 Hook，~60 行
```

### 公共组件库

新增 `components/` 下的 8 个通用组件，消除各页面重复实现：

| 组件 | 替换内容 |
|------|---------|
| `PageLayout` | 统一页面骨架（顶部 Header + 面包屑 + 内容区） |
| `DataTable` | 带分页/排序/筛选的 Ant Design Table 封装 |
| `StatusBadge` | 统一状态标签（进行中/待评审/已完成等） |
| `ConfirmModal` | 统一删除/操作确认弹窗 |
| `FileUpload` | 统一文件上传组件（替换各页面手写） |
| `EmptyState` | 统一空数据提示 |
| `ErrorBoundary` | 全局错误边界，防止局部错误崩溃整页 |
| `UserAvatar` | 统一头像组件（支持图片 + 首字母 fallback） |

---

## 六、阶段 ④ · UI 重设计

**目标**：对标阿里妈妈企业数据平台风格，通过 Ant Design v5 主题定制实现全局一致性。

### 设计风格定义

- **参考**：阿里妈妈数据平台，企业级数据密集型界面
- **侧边栏**：深海蓝（`#001529`），白色文字图标，Ant Design Sider dark 模式
- **主内容区背景**：浅灰（`#f0f2f5`）
- **卡片**：白色背景（`#fff`），极细边框（`#f0f0f0`），浅阴影
- **主色**：`#1677ff`（Ant Design 5 官方蓝），进度条用蓝→浅蓝渐变
- **边框圆角**：`6px`（卡片），`4px`（按钮/标签）

### Ant Design v5 主题 Token

```typescript
theme: {
  token: {
    colorPrimary: '#1677ff',
    colorBgLayout: '#f0f2f5',
    colorBgContainer: '#ffffff',
    colorText: '#262626',
    colorTextSecondary: '#8c8c8c',
    borderRadius: 6,
    borderRadiusSM: 4,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  algorithm: theme.defaultAlgorithm,
}
```

Sider 组件单独使用 `theme.darkAlgorithm`。

### 布局结构

```
┌─────────────────────────────────────────────┐
│  深海蓝侧边栏 (180px)  │  顶部 Tab 导航栏    │
│  #001529              │  白色 + 蓝色下划线   │
│                       ├─────────────────────│
│  • 仪表盘（激活）     │  筛选栏（灰色下拉）  │
│  • 项目管理           ├─────────────────────│
│  • 工作项      [38]   │                     │
│  • 工单中心    [5]    │  页面内容区          │
│  • 待处理             │  #f0f2f5 背景        │
│                       │  白色卡片 + 浅阴影   │
│  ─────────────────    │                     │
│  系统管理             │                     │
│  • 用户管理           │                     │
│                       │                     │
│  [头像] 张三          │                     │
│        超级管理员     │                     │
└─────────────────────────────────────────────┘
```

### 页面改动范围

- 侧边栏重设计：折叠支持，Badge 显示待处理数量，当前路由精确高亮
- 顶部 Tab 切换：替换当前单层 Header，支持页面内视图切换
- 筛选栏：独立于内容区，灰色 Select 风格，贴近内容顶部
- 数据卡片：大数字 + 同环比涨跌标注（红/绿箭头）
- 表格：表头灰底，行高紧凑，状态标签统一色块
- 移动端：核心页面适配响应式（仪表盘、工作项列表）

---

## 七、关键约束

1. **数据库不动**：MySQL 现有数据全部保留，Prisma 通过 `db pull` 反向生成 schema
2. **每阶段可运行**：每个阶段完成后，项目必须能正常启动和使用，不允许长期处于不可用状态
3. **Ant Design 保留**：UI 库不更换，通过主题定制而非重写组件实现视觉升级
4. **SPA 404 修复**：阶段①必须修复，Vite dev server 和 Fastify 生产环境均需配置 fallback
5. **角色权限保留**：`user / admin / super_admin` 三种角色的路由守卫逻辑在迁移中保持不变
