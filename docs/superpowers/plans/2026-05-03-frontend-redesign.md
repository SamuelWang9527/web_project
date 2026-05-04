# Frontend UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有项目管理系统前端重设计为紫罗兰主题，保留顶部导航结构，仅改动样式层。

**Architecture:** 从 `main.tsx` 的 ConfigProvider Token 开始建立全局设计基础，再逐层向外应用到 `MainLayout`（顶栏）、核心页面（Dashboard、ProjectList、WorkItemList），最后收尾其余页面。所有改动仅限 CSS/样式，不触及组件 Props、路由和 API。

**Tech Stack:** React 18, Ant Design v5, TypeScript, 内联样式（React.CSSProperties）

---

## File Map

| 文件 | 改动类型 | 内容 |
|------|---------|------|
| `client/src/main.tsx` | Modify | 全局 ConfigProvider Token（主色、背景、圆角） |
| `client/src/index.css` | Modify | body 背景色、滚动条、全局字体 |
| `client/src/components/MainLayout.tsx` | Modify | 顶栏重设计：Logo 渐变块、导航下划线激活态、用户 chip |
| `client/src/components/dashboard/StatCards.tsx` | Modify | 统计卡片升级：图标块、大数字、阴影描边 |
| `client/src/pages/ProjectList.tsx` | Modify | 表格样式、用户头像单元格、按钮 |
| `client/src/pages/WorkItemList.tsx` | Modify | 表格样式对齐 |
| `client/src/components/work-item/WorkItemTable.tsx` | Modify | 用户单元格渐变头像 |
| `client/src/pages/ProjectDetail.tsx` | Modify | 卡片、详情描述面板 |
| `client/src/pages/WorkItemDetail.tsx` | Modify | 详情卡片样式 |
| `client/src/pages/Login.tsx` | Modify | 主色同步 #6366f1 |
| `client/src/pages/Register.tsx` | Modify | 主色同步 #6366f1 |
| `client/src/pages/PendingSchedule.tsx` | Modify | 卡片/表格样式 |
| `client/src/pages/TicketList.tsx` | Modify | 表格样式 |

---

## 共享样式常量（所有任务引用）

```ts
// 在各文件顶部定义，按需引用
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #10b981, #34d399)',
  'linear-gradient(135deg, #ef4444, #f87171)',
  'linear-gradient(135deg, #0ea5e9, #38bdf8)',
  'linear-gradient(135deg, #ec4899, #f472b6)',
]
const getAvatarGradient = (id: number) => AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length]

const VIOLET_CARD_STYLE: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #ede9fe',
  boxShadow: '0 2px 12px rgba(99,102,241,0.07)',
}
```

---

## Task 1: 全局 Token + 基础 CSS (P0)

**Files:**
- Modify: `client/src/main.tsx`
- Modify: `client/src/index.css`

- [ ] **Step 1: 更新 ConfigProvider Token**

打开 `client/src/main.tsx`，将 `theme` prop 替换为：

```tsx
theme={{
  token: {
    colorPrimary: '#6366f1',
    borderRadius: 8,
    fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f3f0ff',
    colorText: '#1e1b4b',
    colorTextSecondary: '#6b7280',
    colorBorder: '#ede9fe',
  },
  components: {
    Layout: { headerBg: '#ffffff', bodyBg: '#f3f0ff' },
    Card: { borderRadius: 14 },
    Table: { borderRadius: 8, headerBg: '#fdf4ff' },
    Button: { borderRadius: 7 },
    Menu: { horizontalItemSelectedColor: '#6366f1' },
  },
}}
```

- [ ] **Step 2: 更新 index.css 基础样式**

打开 `client/src/index.css`，在文件最前面追加（或替换现有 body 规则）：

```css
body {
  background: #f3f0ff;
  color: #1e1b4b;
  margin: 0;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #ddd6fe; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #6366f1; }
```

- [ ] **Step 3: 启动开发服务器验证**

```bash
cd client && npm run dev
```

访问 http://localhost:3000，页面背景应呈现 `#f3f0ff` 极浅紫色，Ant Design 主色变为紫罗兰。

- [ ] **Step 4: Commit**

```bash
git add client/src/main.tsx client/src/index.css
git commit -m "feat(ui): apply violet theme tokens and base CSS"
```

---

## Task 2: MainLayout 顶栏重设计 (P0)

**Files:**
- Modify: `client/src/components/MainLayout.tsx`

- [ ] **Step 1: 在文件顶部（组件定义之前）插入 NavItem 组件**

找到 `const MainLayout` 定义行，在其前面插入：

```tsx
interface NavItemProps {
  to: string
  active: boolean
  children: React.ReactNode
}

const NavItem: React.FC<NavItemProps> = ({ to, active, children }) => {
  const [hovered, setHovered] = React.useState(false)
  return (
    <Link
      to={to}
      style={{
        height: '100%',
        padding: '0 18px',
        display: 'flex',
        alignItems: 'center',
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        color: (active || hovered) ? '#6366f1' : '#6b7280',
        position: 'relative',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        transition: 'color .15s',
        borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
        boxSizing: 'border-box',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </Link>
  )
}
```

- [ ] **Step 2: 在 MainLayout 内部定义 navItems 数组**

在组件内现有的 `const isAdmin = ...` 之后添加：

```tsx
const navItems = [
  { key: 'dashboard', to: '/', label: '概览' },
  { key: 'projects', to: '/projects', label: '项目管理' },
  ...(!isAdmin() ? [{ key: 'tickets', to: '/tickets', label: '我的工单' }] : []),
  ...(isAdmin() ? [{ key: 'admin-tickets', to: '/admin/tickets', label: '工单管理' }] : []),
  ...(isAdmin() ? [{ key: 'admin-users', to: '/admin/users', label: '用户管理' }] : []),
]

const getSelectedKey = () => {
  const path = location.pathname
  if (path === '/') return 'dashboard'
  if (path.startsWith('/projects')) return 'projects'
  if (path.startsWith('/admin/tickets')) return 'admin-tickets'
  if (path.startsWith('/tickets')) return 'tickets'
  if (path.startsWith('/admin/users')) return 'admin-users'
  return ''
}
```

(如果 `location` 未导入，从 `react-router-dom` 引入 `useLocation` 并调用：`const location = useLocation()`)

- [ ] **Step 3: 将 Header 内容替换为新顶栏结构**

找到 `<Header` 标签及其全部内容，替换为：

```tsx
<Header style={{
  background: '#fff',
  padding: '0 28px',
  display: 'flex',
  alignItems: 'center',
  borderBottom: '1px solid #ede9fe',
  boxShadow: '0 1px 4px rgba(99,102,241,0.06)',
  height: 60,
  lineHeight: '60px',
  position: 'sticky',
  top: 0,
  zIndex: 100,
}}>
  {/* Logo */}
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 17, fontWeight: 700, color: '#1e1b4b',
    marginRight: 36, flexShrink: 0,
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: 16, fontWeight: 800,
    }}>P</div>
    项目管理平台
  </div>

  {/* 导航 */}
  <div style={{ display: 'flex', flex: 1, height: '100%' }}>
    {navItems.map(item => (
      <NavItem key={item.key} to={item.to} active={getSelectedKey() === item.key}>
        {item.label}
      </NavItem>
    ))}
  </div>

  {/* 右侧操作区 */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
    <div style={{
      width: 34, height: 34, borderRadius: 8,
      background: '#faf5ff', border: '1px solid #ede9fe',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
    }}>
      <BellOutlined style={{ color: '#6366f1', fontSize: 15 }} />
    </div>
    <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 12px 4px 4px', borderRadius: 100,
        border: '1px solid #ede9fe', background: '#faf5ff', cursor: 'pointer',
      }}>
        <Avatar
          size={28}
          style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', flexShrink: 0, fontSize: 12, fontWeight: 700 }}
        >
          {user?.username?.charAt(0).toUpperCase()}
        </Avatar>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#1e1b4b' }}>{user?.username}</span>
        <DownOutlined style={{ fontSize: 10, color: '#9ca3af' }} />
      </div>
    </Dropdown>
  </div>
</Header>
```

(如果原来用的是 `overlay` prop，改为 `menu={{ items: userMenuItems }}`；`userMenuItems` 格式参考原有 `userMenu` Menu 内容改写为 items 数组)

- [ ] **Step 4: 更新 Footer 样式**

将 `<Footer` 样式更新为：

```tsx
<Footer style={{
  textAlign: 'center',
  background: '#fff',
  borderTop: '1px solid #ede9fe',
  padding: '10px 24px',
  fontSize: 12,
  color: '#9ca3af',
}}>
```

- [ ] **Step 5: 移除不再需要的 Menu import（若只用于顶部导航）**

检查 `Menu` 是否仍在其他地方使用（如 userMenu dropdown）。如只用于顶部导航，从 antd import 列表中删除 `Menu`。

- [ ] **Step 6: 运行 TypeScript 类型检查**

```bash
cd client && npx tsc --noEmit
```

预期：无类型错误。

- [ ] **Step 7: 验证顶栏效果**

浏览器检查：
- Logo 渐变方块（紫→紫蓝）+ "项目管理平台" 加粗文字
- 导航项无图标，纯文字
- 激活页面对应导航项显示 `color: #6366f1` + 底部 2px 紫线
- hover 时文字变紫（无背景）
- 铃铛按钮 34×34px 圆角方块
- 用户 chip 药丸形，头像渐变圆形

- [ ] **Step 8: Commit**

```bash
git add client/src/components/MainLayout.tsx
git commit -m "feat(ui): redesign topbar with gradient logo, underline nav, user chip"
```

---

## Task 3: StatCards 统计卡片升级 (P1)

**Files:**
- Modify: `client/src/components/dashboard/StatCards.tsx`

- [ ] **Step 1: 读取当前文件，确认组件结构和 props**

读取文件后确认：`StatCards` 接收哪些数据 props（`projects`, `stats` 等），以及当前渲染的是 `<Row><Col><Card>` 还是自定义 div。

- [ ] **Step 2: 更新三张卡片的 JSX**

将三张卡片的内容改为以下结构（按实际 props 调整数据引用）：

```tsx
{/* 卡片一：总项目数 */}
<Col span={8}>
  <div style={{
    background: '#fff', borderRadius: 14, border: '1px solid #ede9fe',
    boxShadow: '0 2px 12px rgba(99,102,241,0.07)', padding: '20px 22px',
    display: 'flex', flexDirection: 'column', gap: 10,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ProjectOutlined style={{ color: '#6366f1', fontSize: 16 }} />
      </div>
      <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>总项目数</span>
    </div>
    <div style={{ fontSize: 30, fontWeight: 700, color: '#1e1b4b', lineHeight: 1 }}>{totalProjects}</div>
    <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', gap: 12 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
        进行中：{inProgressCount}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
        已完成：{completedCount}
      </span>
    </div>
  </div>
</Col>

{/* 卡片二：工作项完成率 */}
<Col span={8}>
  <div style={{
    background: '#fff', borderRadius: 14, border: '1px solid #ede9fe',
    boxShadow: '0 2px 12px rgba(99,102,241,0.07)', padding: '20px 22px',
    display: 'flex', flexDirection: 'column', gap: 10,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircleOutlined style={{ color: '#059669', fontSize: 16 }} />
      </div>
      <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>工作项完成率</span>
    </div>
    <div style={{ fontSize: 30, fontWeight: 700, color: '#1e1b4b', lineHeight: 1 }}>{completionRate}%</div>
    <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', gap: 12 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
        已完成：{completedItemCount}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e5e7eb', display: 'inline-block' }} />
        总数：{totalItemCount}
      </span>
    </div>
  </div>
</Col>

{/* 卡片三：待处理工作项 */}
<Col span={8}>
  <div style={{
    background: '#fff', borderRadius: 14, border: '1px solid #ede9fe',
    boxShadow: '0 2px 12px rgba(99,102,241,0.07)', padding: '20px 22px',
    display: 'flex', flexDirection: 'column', gap: 10,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ClockCircleOutlined style={{ color: '#d97706', fontSize: 16 }} />
      </div>
      <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>待处理工作项</span>
    </div>
    <div style={{ fontSize: 30, fontWeight: 700, color: '#1e1b4b', lineHeight: 1 }}>{pendingCount}</div>
    <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', gap: 12 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
        紧急：{urgentCount}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
        高优：{highCount}
      </span>
    </div>
  </div>
</Col>
```

- [ ] **Step 3: 添加所需 Icon import**

在文件顶部确保 import：

```tsx
import { ProjectOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
```

- [ ] **Step 4: 运行 TypeScript 类型检查**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 5: 验证 Dashboard 统计卡片**

访问 http://localhost:3000，三个卡片应有彩色图标块、30px 粗体数字、小圆点 footer。

- [ ] **Step 6: Commit**

```bash
git add client/src/components/dashboard/StatCards.tsx
git commit -m "feat(ui): upgrade stat cards with icon blocks and violet shadow"
```

---

## Task 4: ProjectList 表格样式 + 用户头像 (P1)

**Files:**
- Modify: `client/src/pages/ProjectList.tsx`

- [ ] **Step 1: 在文件顶部添加头像工具函数**

在 imports 之后、组件定义之前添加：

```tsx
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #10b981, #34d399)',
  'linear-gradient(135deg, #ef4444, #f87171)',
  'linear-gradient(135deg, #0ea5e9, #38bdf8)',
  'linear-gradient(135deg, #ec4899, #f472b6)',
]
const getAvatarGradient = (id: number) => AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length]
```

- [ ] **Step 2: 更新 creator 列的 render 函数**

找到 columns 数组中的 creator/创建者 列，将 render 替换为：

```tsx
render: (creator: any) => creator ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{
      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
      background: getAvatarGradient(creator.id),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: '#fff',
    }}>
      {creator.username.charAt(0).toUpperCase()}
    </div>
    <span style={{ fontSize: 13 }}>{creator.username}</span>
  </div>
) : <span style={{ color: '#9ca3af' }}>-</span>
```

- [ ] **Step 3: 更新包裹 Table 的 Card 样式**

找到 `<Card` 组件，添加：

```tsx
<Card
  style={{ borderRadius: 14, border: '1px solid #ede9fe', boxShadow: '0 2px 12px rgba(99,102,241,0.07)' }}
  styles={{ body: { padding: 0 } }}
>
```

- [ ] **Step 4: 给 Table 添加 overflow hidden**

```tsx
<Table
  ...
  style={{ borderRadius: 14, overflow: 'hidden' }}
/>
```

- [ ] **Step 5: 验证项目列表页**

创建者列显示彩色渐变头像 + 用户名，卡片有紫色描边和阴影。

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/ProjectList.tsx
git commit -m "feat(ui): add gradient avatars and card shadow to ProjectList"
```

---

## Task 5: WorkItemList / WorkItemTable 样式 (P1)

**Files:**
- Modify: `client/src/pages/WorkItemList.tsx`
- Modify: `client/src/components/work-item/WorkItemTable.tsx`

- [ ] **Step 1: WorkItemTable.tsx — 添加 UserCell 组件和头像工具函数**

在文件顶部（imports 之后）插入：

```tsx
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #10b981, #34d399)',
  'linear-gradient(135deg, #ef4444, #f87171)',
  'linear-gradient(135deg, #0ea5e9, #38bdf8)',
  'linear-gradient(135deg, #ec4899, #f472b6)',
]

const UserCell: React.FC<{ user: any; fallback?: string }> = ({ user, fallback = '-' }) =>
  user ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: AVATAR_GRADIENTS[user.id % AVATAR_GRADIENTS.length],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#fff',
      }}>
        {user.username.charAt(0).toUpperCase()}
      </div>
      <span style={{ fontSize: 13 }}>{user.username}</span>
    </div>
  ) : <span style={{ color: '#9ca3af' }}>{fallback}</span>
```

- [ ] **Step 2: 更新 creator 列和 assignee 列的 render**

```tsx
// creator 列
render: (user: any) => <UserCell user={user} />

// assignee 列
render: (user: any) => <UserCell user={user} fallback="未分配" />
```

- [ ] **Step 3: WorkItemList.tsx — 更新外层 Card 样式**

```tsx
<Card
  style={{ borderRadius: 14, border: '1px solid #ede9fe', boxShadow: '0 2px 12px rgba(99,102,241,0.07)' }}
  styles={{ body: { padding: 0 } }}
>
```

- [ ] **Step 4: 运行 TypeScript 类型检查**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 5: 验证工作项列表页**

创建人和负责人列显示彩色渐变头像。

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/WorkItemList.tsx client/src/components/work-item/WorkItemTable.tsx
git commit -m "feat(ui): add gradient user cells and card style to WorkItemList"
```

---

## Task 6: Login / Register 主色同步 (P2)

**Files:**
- Modify: `client/src/pages/Login.tsx`
- Modify: `client/src/pages/Register.tsx`

- [ ] **Step 1: Login.tsx — 替换主色**

在 Login.tsx 中执行以下替换：
- `#4F6EF7` → `#6366f1`
- `#3a5bd9`（hover 色）→ `#4f46e5`
- 左侧 brand panel 的渐变：`linear-gradient(135deg, #4F6EF7 ...)` → `linear-gradient(135deg, #6366f1, #8b5cf6)`

- [ ] **Step 2: Register.tsx — 同样替换主色**

- `#4F6EF7` → `#6366f1`
- `#3a5bd9` → `#4f46e5`
- 渐变结束色改为 `#8b5cf6`

- [ ] **Step 3: 验证登录页**

访问 http://localhost:3000/login，左侧品牌区渐变从靛蓝变为紫蓝渐变。

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Login.tsx client/src/pages/Register.tsx
git commit -m "feat(ui): sync Login and Register to violet primary color"
```

---

## Task 7: ProjectDetail / WorkItemDetail 卡片样式 (P2)

**Files:**
- Modify: `client/src/pages/ProjectDetail.tsx`
- Modify: `client/src/pages/WorkItemDetail.tsx`

- [ ] **Step 1: ProjectDetail.tsx — 更新所有 Card 样式**

找到页面中所有 `<Card` 组件（通常有描述信息卡片和工作项列表卡片），统一添加：

```tsx
style={{ borderRadius: 14, border: '1px solid #ede9fe', boxShadow: '0 2px 12px rgba(99,102,241,0.07)', marginBottom: 16 }}
```

- [ ] **Step 2: ProjectDetail.tsx — 更新工作项表格的用户列渲染**

在 ProjectDetail.tsx 顶部添加头像渐变数组（同 Task 4），将 assignee/creator 列 render 改为内联头像渲染：

```tsx
render: (user: any) => user ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{
      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
      background: ['linear-gradient(135deg,#6366f1,#8b5cf6)','linear-gradient(135deg,#f59e0b,#fbbf24)','linear-gradient(135deg,#10b981,#34d399)','linear-gradient(135deg,#ef4444,#f87171)','linear-gradient(135deg,#0ea5e9,#38bdf8)','linear-gradient(135deg,#ec4899,#f472b6)'][user.id % 6],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: '#fff',
    }}>{user.username.charAt(0).toUpperCase()}</div>
    {user.username}
  </div>
) : '-'
```

- [ ] **Step 3: WorkItemDetail.tsx — 更新 Card 样式**

找到所有 `<Card` 添加相同 violet 卡片样式。

- [ ] **Step 4: 验证两个详情页**

项目详情页和工作项详情页卡片有紫色描边和阴影，用户列有头像。

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/ProjectDetail.tsx client/src/pages/WorkItemDetail.tsx
git commit -m "feat(ui): apply violet card style to detail pages"
```

---

## Task 8: 收尾页面 (P3)

**Files:**
- Modify: `client/src/pages/PendingSchedule.tsx`
- Modify: `client/src/pages/TicketList.tsx`

- [ ] **Step 1: PendingSchedule.tsx — 更新 Card 样式**

找到所有 `<Card` 组件添加：

```tsx
style={{ borderRadius: 14, border: '1px solid #ede9fe', boxShadow: '0 2px 12px rgba(99,102,241,0.07)', marginBottom: 16 }}
```

- [ ] **Step 2: TicketList.tsx — 更新 Card 和 Tabs 样式**

Card 添加 violet 样式，Tabs 的 `tabBarStyle` 更新：

```tsx
tabBarStyle={{ margin: '0 0 16px', borderBottom: '1px solid #ede9fe' }}
```

- [ ] **Step 3: 全量 TypeScript 类型检查**

```bash
cd client && npx tsc --noEmit
```

预期：无类型错误输出。

- [ ] **Step 4: 最终 Commit**

```bash
git add client/src/pages/PendingSchedule.tsx client/src/pages/TicketList.tsx
git commit -m "feat(ui): apply violet theme to remaining pages, complete redesign"
```

---

## 自查清单

- [ ] Task 1 Token 中的 `colorBgLayout: '#f3f0ff'` 是否在所有页面生效（body 背景为浅紫）
- [ ] MainLayout 顶栏高度固定 60px，导航下划线激活态用 `borderBottom` 而非伪元素
- [ ] StatCards 三张卡片图标色分别为 `#6366f1`（紫）、`#059669`（绿）、`#d97706`（琥珀）
- [ ] 所有用户头像使用 `user.id % 6` 映射渐变，不依赖随机数
- [ ] Login/Register 无 `#4F6EF7` 残留
- [ ] 所有 `<Card>` 的 `borderRadius` 为 14，`border` 用 `#ede9fe`
- [ ] TypeScript 无报错
