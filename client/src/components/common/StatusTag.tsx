import React from 'react'
import { Tag } from 'antd'
import type { WorkItemStatus, WorkItemPriority, TicketStatus, TicketPriority, ProjectStatus } from '@/types/models'

const pill: React.CSSProperties = { borderRadius: 100, fontWeight: 500, padding: '0 10px' }

const workItemStatusMap: Record<WorkItemStatus, { color: string; label: string }> = {
  '待处理': { color: 'default',  label: '待处理' },
  '进行中': { color: 'geekblue', label: '进行中' },
  '已完成': { color: 'green',    label: '已完成' },
  '关闭':   { color: 'volcano',  label: '已关闭' },
}

const workItemPriorityMap: Record<WorkItemPriority, { color: string; label: string }> = {
  '低':   { color: 'cyan',   label: '低' },
  '中':   { color: 'gold',   label: '中' },
  '高':   { color: 'orange', label: '高' },
  '紧急': { color: 'red',    label: '紧急' },
}

const ticketStatusMap: Record<TicketStatus, { color: string; label: string }> = {
  '待处理': { color: 'blue',    label: '待处理' },
  '进行中': { color: 'orange',  label: '处理中' },
  '已完成': { color: 'green',   label: '已解决' },
  '关闭':   { color: 'volcano', label: '已关闭' },
}

const ticketPriorityMap: Record<TicketPriority, { color: string; label: string }> = {
  '低':   { color: 'cyan',   label: '低' },
  '中':   { color: 'gold',   label: '中' },
  '高':   { color: 'orange', label: '高' },
  '紧急': { color: 'red',    label: '紧急' },
}

const projectStatusMap: Record<ProjectStatus, { color: string; label: string }> = {
  '待处理': { color: 'default',  label: '待处理' },
  '进行中': { color: 'geekblue', label: '进行中' },
  '已完成': { color: 'green',    label: '已完成' },
  '关闭':   { color: 'volcano',  label: '已关闭' },
}

const workItemTypeMap: Record<string, { color: string }> = {
  '规划': { color: 'purple' },
  '需求': { color: 'geekblue' },
  '事务': { color: 'cyan' },
  '缺陷': { color: 'magenta' },
}

export function WorkItemStatusTag({ status }: { status: WorkItemStatus }) {
  const cfg = workItemStatusMap[status] ?? { color: '#d9d9d9', label: status }
  return <Tag color={cfg.color} style={pill}>{cfg.label}</Tag>
}

export function WorkItemPriorityTag({ priority }: { priority: WorkItemPriority }) {
  const cfg = workItemPriorityMap[priority] ?? { color: '#d9d9d9', label: priority }
  return <Tag color={cfg.color} style={pill}>{cfg.label}</Tag>
}

export function TicketStatusTag({ status }: { status: TicketStatus }) {
  const cfg = ticketStatusMap[status] ?? { color: '#d9d9d9', label: status }
  return <Tag color={cfg.color} style={pill}>{cfg.label}</Tag>
}

export function TicketPriorityTag({ priority }: { priority: TicketPriority }) {
  const cfg = ticketPriorityMap[priority] ?? { color: '#d9d9d9', label: priority }
  return <Tag color={cfg.color} style={pill}>{cfg.label}</Tag>
}

export function ProjectStatusTag({ status }: { status: ProjectStatus }) {
  const cfg = projectStatusMap[status] ?? { color: '#d9d9d9', label: status }
  return <Tag color={cfg.color} style={pill}>{cfg.label}</Tag>
}

export function WorkItemTypeTag({ type }: { type: string }) {
  const cfg = workItemTypeMap[type] ?? { color: '#d9d9d9' }
  return <Tag color={cfg.color} style={pill}>{type}</Tag>
}
