// Prisma enums use English names internally (e.g. "Pending") but the client
// sends and expects Chinese values (e.g. "待处理"). These helpers translate
// at the API boundary: incoming request values → Prisma, outgoing Prisma → client.

const STATUS_TO_ZH: Record<string, string> = {
  Pending: '待处理',
  InProgress: '进行中',
  Completed: '已完成',
  Closed: '关闭',
}

const STATUS_TO_EN: Record<string, string> = {
  '待处理': 'Pending',
  '进行中': 'InProgress',
  '已完成': 'Completed',
  '关闭': 'Closed',
}

const TYPE_TO_ZH: Record<string, string> = {
  Planning: '规划',
  Requirement: '需求',
  Task: '事务',
  Defect: '缺陷',
}

const TYPE_TO_EN: Record<string, string> = {
  '规划': 'Planning',
  '需求': 'Requirement',
  '事务': 'Task',
  '缺陷': 'Defect',
}

const PRIORITY_TO_ZH: Record<string, string> = {
  Urgent: '紧急',
  High: '高',
  Medium: '中',
  Low: '低',
}

const PRIORITY_TO_EN: Record<string, string> = {
  '紧急': 'Urgent',
  '高': 'High',
  '中': 'Medium',
  '低': 'Low',
}

const SOURCE_TO_ZH: Record<string, string> = {
  Internal: '内部需求',
  Brand: '品牌需求',
}

const SOURCE_TO_EN: Record<string, string> = {
  '内部需求': 'Internal',
  '品牌需求': 'Brand',
}

/** Chinese → Prisma enum name. Passes through if already English. */
export function toEnumStatus(v: string | undefined): string | undefined {
  if (!v) return v
  return STATUS_TO_EN[v] ?? v
}

export function toEnumType(v: string | undefined): string | undefined {
  if (!v) return v
  return TYPE_TO_EN[v] ?? v
}

export function toEnumPriority(v: string | undefined): string | undefined {
  if (!v) return v
  return PRIORITY_TO_EN[v] ?? v
}

export function toEnumSource(v: string | undefined): string | undefined {
  if (!v) return v
  return SOURCE_TO_EN[v] ?? v
}

/** Prisma enum name → Chinese display value. */
export function zhStatus(v: string | null | undefined): string {
  if (!v) return v as string
  return STATUS_TO_ZH[v] ?? v
}

export function zhPriority(v: string | null | undefined): string {
  if (!v) return v as string
  return PRIORITY_TO_ZH[v] ?? v
}

/** Transform a work item from Prisma format (English enums) to client format (Chinese). */
export function serializeWorkItem(item: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...item,
    status: item.status != null ? (STATUS_TO_ZH[item.status as string] ?? item.status) : item.status,
    type: item.type != null ? (TYPE_TO_ZH[item.type as string] ?? item.type) : item.type,
    priority: item.priority != null ? (PRIORITY_TO_ZH[item.priority as string] ?? item.priority) : item.priority,
    source: item.source != null ? (SOURCE_TO_ZH[item.source as string] ?? item.source) : item.source,
  }
  // Serialize nested project status
  if (result.projects && typeof result.projects === 'object' && !Array.isArray(result.projects)) {
    const proj = result.projects as Record<string, unknown>
    if (proj.status != null) {
      result.projects = { ...proj, status: STATUS_TO_ZH[proj.status as string] ?? proj.status }
    }
  }
  return result
}

/** Transform a project from Prisma format to client format. */
export function serializeProject(item: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...item,
    status: item.status != null ? (STATUS_TO_ZH[item.status as string] ?? item.status) : item.status,
  }
  if (Array.isArray(result.workitems)) {
    result.workitems = (result.workitems as Record<string, unknown>[]).map(serializeWorkItem)
  }
  return result
}

/** Transform a ticket from Prisma format to client format. */
export function serializeTicket(item: Record<string, unknown>): Record<string, unknown> {
  return {
    ...item,
    status: item.status != null ? (STATUS_TO_ZH[item.status as string] ?? item.status) : item.status,
    priority: item.priority != null ? (PRIORITY_TO_ZH[item.priority as string] ?? item.priority) : item.priority,
  }
}
