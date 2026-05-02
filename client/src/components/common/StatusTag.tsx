import { Tag } from 'antd'
import type { WorkItemStatus, WorkItemPriority, TicketStatus, TicketPriority, ProjectStatus } from '@/types/models'

const workItemStatusMap: Record<WorkItemStatus, { color: string; label: string }> = {
  todo:        { color: 'default',     label: '待处理' },
  in_progress: { color: 'processing',  label: '进行中' },
  in_review:   { color: 'warning',     label: '审核中' },
  done:        { color: 'success',     label: '已完成' },
  cancelled:   { color: 'error',       label: '已取消' },
}

const workItemPriorityMap: Record<WorkItemPriority, { color: string; label: string }> = {
  low:    { color: 'cyan',   label: '低' },
  medium: { color: 'gold',   label: '中' },
  high:   { color: 'orange', label: '高' },
  urgent: { color: 'red',    label: '紧急' },
}

const ticketStatusMap: Record<TicketStatus, { color: string; label: string }> = {
  open:        { color: 'blue',       label: '待处理' },
  in_progress: { color: 'processing', label: '处理中' },
  resolved:    { color: 'success',    label: '已解决' },
  closed:      { color: 'default',    label: '已关闭' },
}

const ticketPriorityMap: Record<TicketPriority, { color: string; label: string }> = {
  low:    { color: 'cyan',   label: '低' },
  medium: { color: 'gold',   label: '中' },
  high:   { color: 'orange', label: '高' },
  urgent: { color: 'red',    label: '紧急' },
}

const projectStatusMap: Record<ProjectStatus, { color: string; label: string }> = {
  '待处理': { color: 'default',    label: '待处理' },
  '进行中': { color: 'processing', label: '进行中' },
  '已完成': { color: 'success',    label: '已完成' },
  '关闭':   { color: 'warning',    label: '已关闭' },
}

const workItemTypeColorMap: Record<string, string> = {
  '规划': 'purple',
  '需求': 'blue',
  '事务': 'cyan',
  '缺陷': 'red',
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

export function ProjectStatusTag({ status }: { status: ProjectStatus }) {
  const cfg = projectStatusMap[status] ?? { color: 'default', label: status }
  return <Tag color={cfg.color}>{cfg.label}</Tag>
}

export function WorkItemTypeTag({ type }: { type: string }) {
  const color = workItemTypeColorMap[type] ?? 'default'
  return <Tag color={color}>{type}</Tag>
}
