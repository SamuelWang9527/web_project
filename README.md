# 项目管理系统

全栈项目管理平台，支持项目、工作项、工单的全生命周期管理。紫罗兰主题 UI，响应式桌面端设计。

## 技术栈

### 前端 (client/)
- **框架**：React 18 + TypeScript + Vite
- **UI**：Ant Design v5（紫罗兰主题，`colorPrimary: #6366f1`）
- **路由**：React Router v6
- **数据请求**：Axios + TanStack Query (React Query)
- **图表**：`@ant-design/plots`
- **甘特图**：`gantt-task-react`
- **样式**：内联样式（React.CSSProperties）

### 后端 (server/)
- **框架**：Fastify + TypeScript
- **ORM**：Prisma（MariaDB / MySQL）
- **认证**：JWT 无状态认证（`@fastify/jwt`）
- **文件上传**：`@fastify/multipart`（最大 20MB）
- **静态服务**：`@fastify/static`（上传文件 + 生产环境 SPA）

## 项目结构

```
web_project/
├── client/                  # 前端（Vite + React）
│   └── src/
│       ├── components/      # 通用组件（MainLayout、StatusTag 等）
│       ├── pages/           # 页面组件
│       ├── contexts/        # React Context（AuthContext）
│       ├── hooks/           # 自定义 Hook（useWorkItem、useProjects 等）
│       ├── types/           # TypeScript 类型定义
│       └── utils/api.ts     # Axios 实例 + 所有 API 函数
└── server/                  # 后端（Fastify）
    └── src/
        ├── routes/          # 路由（auth、projects、work-items、users、tickets、dashboard）
        ├── plugins/         # Fastify 插件（auth.plugin.ts）
        ├── lib/prisma.ts    # Prisma 客户端单例
        └── utils/           # 工具函数（enumTransform 等）
```

## 主要功能

- **用户认证**：登录 / 注册（需管理员审核）、JWT、三级角色（`user` / `admin` / `super_admin`）
- **项目管理**：CRUD、项目详情、工作项挂载、Excel 导出
- **工作项管理**：CRUD、状态 / 优先级 / 类型标签、负责人指派、附件上传（最多 5 个）、评论、活动日志
- **工单管理**：普通用户提交工单，管理员统一处理；与项目 / 工作项无关联
- **仪表盘**：统计卡片、待完成工作项、甘特图（基于已排期工作项）
- **待排期列表**：筛选未安排截止日期的工作项并一键排期

## 路由

### 前端路由
| 路径 | 页面 |
|------|------|
| `/login` | 登录 |
| `/register` | 注册 |
| `/` | 仪表盘 |
| `/projects` | 项目列表（含工作项、待排期 Tab） |
| `/projects/:id` | 项目详情 |
| `/work-items/:id` | 工作项详情 |
| `/tickets` | 我的工单（普通用户）|
| `/admin/tickets` | 工单管理（管理员）|
| `/admin/users` | 用户管理（管理员）|
| `/profile` | 个人资料 |

### 后端 API
| 前缀 | 说明 |
|------|------|
| `/api/auth` | 登录 / 注册 |
| `/api/users` | 用户 CRUD + 管理员列表 |
| `/api/projects` | 项目 CRUD + 导出 |
| `/api/work-items` | 工作项 CRUD + 附件 + 评论 + 活动 |
| `/api/tickets` | 工单 CRUD |
| `/api/dashboard` | 统计数据 |

## 启动方式

### 环境要求
- Node.js 18+
- MariaDB / MySQL

### 后端

```bash
cd server
npm install

# 配置环境变量（复制并填写）
cp .env.example .env

# 初始化数据库
npm run prisma:generate
npm run prisma:migrate

# 开发模式（热重载，端口 5000）
npm run dev
```

`server/.env` 必填项：
```
DATABASE_URL="mysql://user:password@localhost:3306/dbname"
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_dbname
JWT_SECRET=your_secret
JWT_EXPIRES_IN=6h
```

### 前端

```bash
cd client
npm install

# 开发模式（热重载，端口 3000，/api 代理到 :5000）
npm run dev
```

### 创建初始管理员

```bash
cd server
npx ts-node scripts/createAdmin.ts
```

## 数据模型（Prisma）

| 模型 | 说明 |
|------|------|
| `users` | 用户（role、status） |
| `projects` | 项目（status、startDate、endDate） |
| `workitems` | 工作项（attachments / comments 存为 JSON） |
| `tickets` | 工单（独立，仅关联用户） |
| `workitem_activities` | 工作项操作审计日志 |

## 文件上传

上传文件存储于 `server/public/uploads/`：
- 图片（jpg/png/gif/webp）→ `uploads/images/`
- 其他文件 → `uploads/files/`

导出文件存储于 `server/public/exports/`，通过 `/exports/` 路由访问。非图片文件下载时服务端自动附加 `Content-Disposition: attachment`。
