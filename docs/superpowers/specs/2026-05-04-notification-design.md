# 通知系统设计规格

**日期：** 2026-05-04  
**范围：** 站内通知，覆盖工作项指派和评论两类事件；SSE 实时推送；铃铛下拉面板 UI

---

## 1. 触发场景

| 事件 | 触发时机 | 接收人 |
|------|---------|--------|
| `assigned` | PUT `/api/work-items/:id` 中 `assigneeId` 发生变更 | 新负责人（排除自己指派给自己） |
| `commented` | POST `/api/work-items/:id/comments` | 工作项创建者 + 当前负责人（排除评论者本人，去重） |

---

## 2. 数据模型

在 `server/prisma/schema.prisma` 新增：

```prisma
model notifications {
  id        Int      @id @default(autoincrement())
  userId    Int
  type      String   // "assigned" | "commented"
  title     String
  body      String
  linkPath  String   // 前端跳转路径，如 /work-items/42
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user      users    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([userId, createdAt])
}
```

`users` 模型添加反向关系：
```prisma
notifications notifications[]
```

---

## 3. 后端 API

路由文件：`server/src/routes/notifications.ts`，注册前缀 `/api/notifications`，所有端点需鉴权。

### 3.1 GET /api/notifications

返回当前用户最近 20 条通知（按 `createdAt DESC`），含已读和未读。

**响应：**
```json
{
  "data": [
    {
      "id": 1,
      "type": "assigned",
      "title": "工作项指派",
      "body": "张三 将「修复登录页 Bug」指派给你",
      "linkPath": "/work-items/42",
      "isRead": false,
      "createdAt": "2026-05-04T10:00:00Z"
    }
  ],
  "unreadCount": 3
}
```

### 3.2 PATCH /api/notifications/read-all

将当前用户所有 `isRead: false` 的通知设为 `true`。

**响应：** `{ "success": true }`

### 3.3 GET /api/notifications/sse

SSE 长连接。连接建立时立即推送当前未读数，之后每次有新通知时推送：

```
data: {"unreadCount":3}
```

**实现：** 服务端维护内存 Map `sseConnections: Map<userId, ServerResponse>`。工作项路由在创建通知后调用 `notifySseClient(userId)` 触发推送。连接断开时从 Map 中移除。

---

## 4. 通知创建逻辑

抽取工具函数 `server/src/utils/createNotification.ts`：

```ts
async function createNotification(params: {
  userId: number
  type: 'assigned' | 'commented'
  title: string
  body: string
  linkPath: string
}): Promise<void>
```

函数内部：
1. 写入 `notifications` 表
2. 调用 `notifySseClient(params.userId)` 推送 SSE

**指派通知触发位置：** `server/src/routes/work-items/index.ts` PUT 路由，在已有的 `assigneeChanging` 判断块内，确认新 `assigneeId !== createdById`（或 `!== request.user.id`）后调用。

**评论通知触发位置：** `server/src/routes/work-items/comments.ts` POST 路由，评论写入后，对 `[workItem.createdById, workItem.assigneeId]` 去重、排除评论者 ID，各创建一条 `commented` 通知。

---

## 5. SSE 连接管理

新增 `server/src/lib/sseConnections.ts`：

```ts
// 全局单例 Map，key = userId
const sseConnections = new Map<number, ServerResponse>()

export function registerSseClient(userId: number, res: ServerResponse): void
export function removeSseClient(userId: number): void
export function notifySseClient(userId: number): void  // 推送 unreadCount
```

`notifySseClient` 内部查询该用户当前未读数后推送。

---

## 6. 前端

### 6.1 useNotifications hook

文件：`client/src/hooks/useNotifications.ts`

职责：
- 初始调用 `GET /api/notifications` 加载列表和未读数
- 建立 `EventSource('/api/notifications/sse')`，收到消息后更新 `unreadCount` 并重新 fetch 列表
- 提供 `markAllRead()` 方法（调用 PATCH 后清零 `unreadCount`、刷新列表）
- 组件卸载时关闭 `EventSource`

### 6.2 NotificationDropdown 组件

文件：`client/src/components/NotificationDropdown.tsx`

使用 Ant Design `<Popover>` 渲染下拉面板，触发元素为铃铛按钮。

**面板结构：**
```
┌─────────────────────────────────┐
│ 通知                   [全部已读] │  ← 标题行
├─────────────────────────────────┤
│ 🔵 工作项指派                    │  ← 未读（左侧蓝点）
│    张三 将「修复 Bug」指派给你    │
│    2 分钟前                      │
├─────────────────────────────────┤
│    李四 评论了你的工作项          │  ← 已读（无蓝点）
│    首页改版 · 1 小时前           │
└─────────────────────────────────┘
```

- 面板宽度 360px，最多显示 20 条，超出内部滚动
- 每条点击后：`useNavigate` 跳转 `linkPath` → 关闭面板（不自动标记单条已读，已读状态仅通过"全部已读"按钮统一处理）
- 空状态：显示"暂无通知"

### 6.3 MainLayout.tsx 修改

将现有静态铃铛按钮替换为 `<NotificationDropdown />`，铃铛上叠加 Ant Design `<Badge count={unreadCount} />`。

---

## 7. 不在范围内

- 单条通知标记已读（只做全部已读）
- 通知中心独立页面（`/notifications`）
- 邮件 / 短信通知
- 通知偏好设置
- 多进程 / Redis 发布订阅（当前单进程已足够）

---

## 8. 文件变更清单

| 文件 | 类型 |
|------|------|
| `server/prisma/schema.prisma` | Modify |
| `server/src/lib/sseConnections.ts` | Create |
| `server/src/utils/createNotification.ts` | Create |
| `server/src/routes/notifications.ts` | Create |
| `server/src/app.ts` | Modify（注册 notifications 路由） |
| `server/src/routes/work-items/index.ts` | Modify（触发指派通知） |
| `server/src/routes/work-items/comments.ts` | Modify（触发评论通知） |
| `client/src/hooks/useNotifications.ts` | Create |
| `client/src/components/NotificationDropdown.tsx` | Create |
| `client/src/components/MainLayout.tsx` | Modify（替换铃铛按钮） |
| `client/src/utils/api.ts` | Modify（添加 notification API 函数） |
