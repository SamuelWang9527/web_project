import React from 'react'
import { Descriptions } from 'antd'
import { Link } from 'react-router-dom'
import { WorkItemStatusTag, WorkItemPriorityTag, WorkItemTypeTag } from '@/components/common/StatusTag'
import type { WorkItem } from '@/types/models'

interface WorkItemWithRelations extends WorkItem {
  type?: string | null
  source?: string | null
  estimatedHours?: number | null
  actualHours?: number | null
  scheduledStartDate?: string | null
  scheduledEndDate?: string | null
  expectedCompletionDate?: string | null
  completionDate?: string | null
  Project?: { id: number; name: string } | null
}

interface Props {
  workItem: WorkItemWithRelations
}

export const WorkItemInfoPanel: React.FC<Props> = ({ workItem }) => {
  return (
    <Descriptions bordered column={1} size="small">
      <Descriptions.Item label="状态">
        <WorkItemStatusTag status={workItem.status} />
      </Descriptions.Item>
      <Descriptions.Item label="紧急程度">
        <WorkItemPriorityTag priority={workItem.priority} />
      </Descriptions.Item>
      <Descriptions.Item label="类型">
        <WorkItemTypeTag type={workItem.type ?? ''} />
      </Descriptions.Item>
      <Descriptions.Item label="需求来源">
        {workItem.source || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="负责人">
        {workItem.assignee ? workItem.assignee.username : '未分配'}
      </Descriptions.Item>
      <Descriptions.Item label="所属项目">
        {workItem.Project ? (
          <Link to={`/projects/${workItem.Project.id}`}>{workItem.Project.name}</Link>
        ) : '-'}
      </Descriptions.Item>
      <Descriptions.Item label="创建者">
        {workItem.creator ? workItem.creator.username : '-'}
      </Descriptions.Item>
      <Descriptions.Item label="预估工时">
        {workItem.estimatedHours ? `${workItem.estimatedHours}小时` : '-'}
      </Descriptions.Item>
      <Descriptions.Item label="实际工时">
        {workItem.actualHours ? `${workItem.actualHours}小时` : '-'}
      </Descriptions.Item>
      <Descriptions.Item label="排期开始日期">
        {workItem.scheduledStartDate ? new Date(workItem.scheduledStartDate).toLocaleDateString() : '-'}
      </Descriptions.Item>
      <Descriptions.Item label="排期结束日期">
        {workItem.scheduledEndDate ? new Date(workItem.scheduledEndDate).toLocaleDateString() : '-'}
      </Descriptions.Item>
      <Descriptions.Item label="期望完成日期">
        {workItem.expectedCompletionDate ? new Date(workItem.expectedCompletionDate).toLocaleDateString() : '-'}
      </Descriptions.Item>
      <Descriptions.Item label="实际完成日期">
        {workItem.completionDate ? new Date(workItem.completionDate).toLocaleDateString() : '-'}
      </Descriptions.Item>
      <Descriptions.Item label="创建时间">
        {new Date(workItem.createdAt).toLocaleString()}
      </Descriptions.Item>
    </Descriptions>
  )
}
