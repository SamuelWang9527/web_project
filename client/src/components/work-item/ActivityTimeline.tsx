import React from 'react'
import { Timeline, Spin } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  TagOutlined,
  UserOutlined,
  CommentOutlined,
  FileOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'

interface Activity {
  id: number
  type: string
  field?: string | null
  oldValue?: string | null
  newValue?: string | null
  description?: string
  createdAt: string
  User?: { username: string }
}

interface Props {
  activities: Activity[]
  loading?: boolean
}

const renderActivityIcon = (type: string) => {
  switch (type) {
    case 'create':           return <PlusOutlined style={{ color: '#52c41a' }} />
    case 'update':           return <EditOutlined style={{ color: '#1890ff' }} />
    case 'status_change':    return <TagOutlined style={{ color: '#722ed1' }} />
    case 'assignee_change':  return <UserOutlined style={{ color: '#fa8c16' }} />
    case 'comment':          return <CommentOutlined style={{ color: '#13c2c2' }} />
    case 'attachment_add':   return <FileOutlined style={{ color: '#1890ff' }} />
    case 'attachment_delete':return <DeleteOutlined style={{ color: '#ff4d4f' }} />
    default:                 return <ClockCircleOutlined />
  }
}

const translateFieldName = (fieldName: string): string => {
  const fieldMap: Record<string, string> = {
    title: '标题', description: '描述', type: '类型', status: '状态',
    priority: '紧急程度', source: '需求来源', estimatedHours: '预估工时',
    actualHours: '实际工时', scheduledStartDate: '排期开始日期',
    scheduledEndDate: '排期结束日期', expectedCompletionDate: '期望完成日期',
    completionDate: '实际完成日期', projectId: '所属项目', assigneeId: '负责人',
  }
  return fieldMap[fieldName] ?? fieldName
}

const formatActivityDescription = (activity: Activity): string => {
  if (!activity.field) return activity.description ?? ''
  const fieldDisplayName = translateFieldName(activity.field)
  switch (activity.type) {
    case 'create': return '创建了工作项'
    case 'update':
      if (activity.field.includes('Date')) {
        const oldVal = activity.oldValue ? new Date(activity.oldValue).toLocaleDateString() : '空'
        const newVal = activity.newValue ? new Date(activity.newValue).toLocaleDateString() : '空'
        return `修改了 ${fieldDisplayName} 字段，从 "${oldVal}" 修改为 "${newVal}"`
      }
      return `修改了 ${fieldDisplayName} 字段，从 "${activity.oldValue ?? '空'}" 修改为 "${activity.newValue}"`
    case 'status_change':   return `将状态从 "${activity.oldValue}" 修改为 "${activity.newValue}"`
    case 'assignee_change': return (activity.description ?? '').replace(activity.field, fieldDisplayName)
    case 'comment':         return `添加了评论: "${activity.newValue}"`
    case 'attachment_add':  return `添加了附件: "${activity.newValue}"`
    case 'attachment_delete': return `删除了附件: "${activity.oldValue}"`
    default: return (activity.description ?? '').replace(activity.field, fieldDisplayName)
  }
}

export const ActivityTimeline: React.FC<Props> = ({ activities, loading }) => {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>
  }

  if (activities.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>暂无活动记录</div>
  }

  return (
    <Timeline
      items={activities.map((activity) => ({
        key: activity.id,
        dot: renderActivityIcon(activity.type),
        children: (
          <>
            <div style={{ marginBottom: 8 }}>
              <span style={{ marginRight: 8 }}>
                <strong>{activity.User?.username}</strong>
              </span>
              <span style={{ color: '#8c8c8c' }}>
                {new Date(activity.createdAt).toLocaleString()}
              </span>
            </div>
            <div>{formatActivityDescription(activity)}</div>
          </>
        ),
      }))}
    />
  )
}
