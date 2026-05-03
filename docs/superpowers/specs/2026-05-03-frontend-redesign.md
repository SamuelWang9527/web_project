# Frontend UI Redesign — Design Spec

**Date:** 2026-05-03  
**Scope:** 全局视觉重设计，保留现有路由和组件结构，仅改动样式层

---

## 1. 设计决策总结

| 维度 | 决策 |
|------|------|
| 布局结构 | 保留顶部水平导航（优化版），不引入侧边栏 |
| 主色 | `#6366f1`（紫罗兰）|
| 深色文字 | `#1e1b4b` |
| 页面底色 | `#f3f0ff`（极浅紫） |
| 卡片风格 | 白底 + `#ede9fe` 描边 + 轻阴影（`0 2px 12px rgba(99,102,241,0.07)`）|
| 圆角 | 卡片 14px，按钮 7px，标签 100px（药丸）|

---

## 2. 顶部导航栏 (MainLayout.tsx)

### 结构
```
[ Logo图标 + 文字 ]  [ 概览 | 项目管理 | 工单管理 | 用户管理 ]  [ 铃铛 | 用户chip ]
```

### 样式规格
- 高度：`60px`，背景 `#fff`，底边 `1px solid #ede9fe`，阴影 `0 1px 4px rgba(99,102,241,0.06)`
- **Logo**：渐变方块图标（`135deg, #6366f1 → #8b5cf6`，32×32px，圆角 8px）+ 加粗文字
- **导航项**：纯文字，无图标；高度撑满顶栏（`height: 100%`）；水平内边距 `18px`
  - 默认：`color: #6b7280`，`font-weight: 500`
  - 激活：`color: #6366f1`，`font-weight: 600`，底部 `2px solid #6366f1` 细线（`border-radius: 2px 2px 0 0`）
  - Hover：`color: #6366f1`（无背景）
- **铃铛按钮**：34×34px，`background: #faf5ff`，`border: 1px solid #ede9fe`，圆角 8px
- **用户 chip**：头像（28px 渐变圆形）+ 用户名 + 下拉箭头；整体 `border-radius: 100px`，`border: 1px solid #ede9fe`，`background: #faf5ff`

---

## 3. 全局 Token (main.tsx ConfigProvider)

```ts
token: {
  colorPrimary: '#6366f1',
  borderRadius: 8,
  fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  colorBgContainer: '#ffffff',
  colorBgLayout: '#f3f0ff',
  colorText: '#1e1b4b',
  colorTextSecondary: '#6b7280',
  colorBorder: '#ede9fe',
  boxShadow: '0 2px 12px rgba(99,102,241,0.07)',
}
components: {
  Layout: { headerBg: '#ffffff', bodyBg: '#f3f0ff' },
  Card: { borderRadius: 14, borderColor: '#ede9fe' },
  Table: { borderRadius: 8, headerBg: '#fdf4ff' },
  Button: { borderRadius: 7 },
  Menu: { /* 顶部水平 menu 激活用下划线，通过 CSS 覆盖实现 */ },
}
```

---

## 4. 卡片规格

所有 `<Card>` 统一：
- `border-radius: 14px`
- `border: 1px solid #ede9fe`
- `box-shadow: 0 2px 12px rgba(99,102,241,0.07)`
- Card Header：`border-bottom: 1px solid #f5f3ff`，背景 `#fff`

统计卡片额外：图标区域 34×34px 彩色圆角背景块（各卡片颜色不同），大数字 `font-size: 30px font-weight: 700`。

---

## 5. 表格规格

- 表头：`background: #fdf4ff`，文字 `#9ca3af`，字号 12px，全大写+字距
- 行底边：`1px solid #f9f5ff`
- Hover 行：`background: #faf5ff`
- 无外边框网格线（依靠行底边分隔）

---

## 6. 药丸标签规格 (StatusTag.tsx 已完成，确认沿用)

`border-radius: 100px`，`padding: 2px 10px`，`font-weight: 500`，Ant Design 预设色名：

| 状态/优先级 | 色名 |
|------------|------|
| 待处理 | `default` |
| 进行中 | `geekblue` |
| 已完成 | `green` |
| 已关闭 | `volcano` |
| 紧急 | `red` |
| 高 | `orange` |
| 中 | `gold` |
| 低 | `cyan` |

---

## 7. 按钮规格

- 主按钮：`background: #6366f1`，白色文字，`border-radius: 7px`
- 幽灵按钮：`background: #faf5ff`，`color: #6366f1`，`border: 1px solid #ddd6fe`，`border-radius: 7px`

---

## 8. 用户头像

表格内用户单元格：彩色渐变圆形头像（26px），每个用户取名字首字母，渐变色从预设调色板中按用户 ID 取余分配。

---

## 9. 实现范围与优先级

| 优先级 | 文件 | 改动内容 |
|--------|------|---------|
| P0 | `main.tsx` | 更新 ConfigProvider Token |
| P0 | `MainLayout.tsx` | 顶栏重新设计（Logo、导航下划线激活态、用户chip） |
| P0 | `index.css` | 全局基础样式（body 背景色、字体） |
| P1 | `Dashboard.tsx` / `StatCards.tsx` | 统计卡片样式升级 |
| P1 | `ProjectList.tsx` | 表格样式、用户头像单元格 |
| P1 | `WorkItemList.tsx` | 表格样式 |
| P2 | `ProjectDetail.tsx` | 卡片、表格 |
| P2 | `WorkItemDetail.tsx` | 详情面板卡片 |
| P2 | `Login.tsx` / `Register.tsx` | 主色同步更新（#6366f1） |
| P3 | 其余页面 | PendingSchedule、TicketList 等 |

---

## 10. 不在范围内

- 路由结构、组件 Props、API 不变动
- 不引入新的 CSS 框架或 UI 库
- 不改动 StatusTag 药丸形状（已完成）
- 不改动响应式断点（系统主要为桌面端）
