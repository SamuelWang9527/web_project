# 项目管理系统 (Project Management System)

这是一个功能完整的项目管理系统，采用前后端分离的架构设计，适合团队协作和项目跟踪。

## 技术栈

### 前端 (client)
- React 18 + CRA (`react-scripts`)
- React Router v6
- Ant Design 5
- 图表/可视化：`@ant-design/charts`、`@ant-design/plots`
- 甘特图：`gantt-task-react`
- HTTP：Axios（前端 `package.json` 配了 `proxy` 指向 `http://localhost:5000`）
- 样式：Styled Components
- 认证：JWT（`jwt-decode`）
- 导出：`xlsx`、`file-saver`

### 后端 (server)
- Node.js + Express
- Sequelize + MySQL (`mysql2`)
- 参数校验：`express-validator`
- 文件上传：Multer
- Excel 导出：ExcelJS
- 环境变量：`.env`
- 生产部署：后端会托管 `client/build`（同一个服务对外提供前端页面 + `/api`）

## 项目结构

### 前端结构 (client)
- **src/components**: 包含可复用的UI组件，如MainLayout（主布局）
- **src/pages**: 包含所有页面组件，如Dashboard、Login、Register、ProjectList等
- **src/contexts**: 包含React上下文，如AuthContext（认证上下文）
- **src/api**: 包含API调用相关的工具
- **src/utils**: 包含各种工具函数

### 后端结构 (server)
- **routes**: 定义API路由，包括auth、projects、workItems、users、tickets、dashboard等
- **models**: 定义数据库模型，包括User、Project、WorkItem、Ticket等
- **controllers**: 包含业务逻辑处理（当前以路由内聚为主）
- **middleware**: 包含中间件，如认证中间件
- **config**: 包含配置文件，如数据库配置
- **public/uploads**: 用于存储上传的文件（图片/文档/头像），以及 **public/exports**（Excel 导出）

## 主要功能

1. **用户认证**：
   - 登录/注册
   - JWT认证
   - 用户权限管理
   - 角色：`user` / `admin` / `super_admin`

2. **项目管理**：
   - 项目创建、查看、编辑和删除
   - 项目详情页面
   - 项目导出 Excel（项目 + 工作项列表）
   - 权限：创建/编辑/删除主要由管理员和创建者控制（见后端中间件）

3. **工作项管理**：
   - 工作项创建、查看、编辑和删除
   - 工作项详情页面
   - 工作项状态跟踪
   - 附件上传（最多 5 个）：存到 `server/public/uploads/images` 或 `server/public/uploads/files`
   - 工作项活动日志（WorkItemActivity）：记录创建、字段变更、负责人变更、附件变更等
   - 工作项导出 Excel（全量导出 + 下载）

4. **工单管理**：
   - 工单创建、查看、编辑和删除
   - 工单详情页面
   - Ticket 与 Project / WorkItem **无关联**：仅关联创建人/负责人（User）
   - 普通用户默认仅能查看自己创建的工单；管理员可在后台统一处理

5. **仪表盘**：
   - 数据可视化
   - 项目和工作项统计
   - 用户活动跟踪
   - 甘特图数据接口（基于已排期的工作项）
   - 待完成工作项列表（按到期/未到期与角色权限筛选）

6. **文件上传**：
   - 支持图片、文档和头像上传
   - 文件存储和访问

7. **用户资料**：
   - 用户资料查看和编辑
   - 头像上传

## 数据模型

主要的数据模型包括：
- **User**: 用户信息
- **Project**: 项目信息
- **WorkItem**: 工作项信息
- **Ticket**: 工单信息
- **WorkItemActivity**: 工作项活动记录

## 路由结构

### 前端路由
- `/login`: 登录页面
- `/register`: 注册页面
- `/`: 主页/仪表盘
- `/projects`: 项目列表
- `/projects/:id`: 项目详情
- `/work-items/:id`: 工作项详情
- `/tickets`: 工单入口（普通用户进入“我的工单”，管理员自动跳转到后台工单管理）
- `/tickets/:id`: 工单详情
- `/admin/tickets`: 管理员工单管理
- `/admin/users`: 用户管理（管理员）
- `/profile`: 用户资料

### 后端API路由
- `/api/auth`: 认证相关API
- `/api/users`: 用户相关API
- `/api/projects`: 项目相关API
- `/api/work-items`: 工作项相关API
- `/api/tickets`: 工单相关API
- `/api/dashboard`: 仪表盘相关API

## 启动方式

> 说明：本仓库是 `client/` + `server/` 两个 Node 项目；根目录的 `package.json` 主要是 CRA 模板遗留，实际以 `client/package.json` 和 `server/package.json` 为准。

1. **后端（推荐先启动）**:

```
cd server
npm install

# 开发（自动重启）
npm run dev

# 或生产模式启动
npm start
```

2. **前端**:

```
cd client
npm install
npm start
```

## 环境要求
- Node.js 14+（建议 16/18+）
- npm 6+
- 现代浏览器（Chrome、Firefox、Safari、Edge等）

## 开发环境设置

1. 克隆仓库:
   ```
   git clone https://github.com/kmwang777889/web_project.git
   cd web_project
   ```

2. 安装依赖:
   ```
   # 安装前端依赖
   cd client
   npm install
   
   # 安装后端依赖
   cd ../server
   npm install
   ```

3. 配置环境变量:
   - 在 `server/.env` 中配置（示例）：
     - `JWT_SECRET`
     - 数据库（后端当前同时兼容两套命名，建议优先使用这一套）：
       - `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` / `DB_DIALECT`
     - `PORT`（默认 5000）
     - `CLIENT_URL`（用于 CORS 放行的前端域名；本地开发可不配）

4. 启动开发服务器:
   ```
   # 启动后端服务器
   cd server
   npm run dev
   
   # 在另一个终端启动前端服务器
   cd client
   npm start
   ```

## 贡献指南
欢迎贡献代码、报告问题或提出新功能建议。请遵循以下步骤：
1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证
[MIT](LICENSE) 