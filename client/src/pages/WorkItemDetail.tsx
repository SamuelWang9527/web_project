import React, { useState } from 'react'
import { Card, Button, Space, Form, Popconfirm, Typography, message } from 'antd'
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { useAuth } from '@/contexts/AuthContext'
import { useWorkItem } from '@/hooks/useWorkItem'
import {
  useUpdateWorkItem,
  useUploadAttachment,
  useDeleteAttachment,
  useAddComment,
} from '@/hooks/useWorkItemMutations'
import { useAdmins } from '@/hooks/useUsers'
import { useProjects } from '@/hooks/useProjects'
import { getWorkItemActivities, updateWorkItem as apiUpdateWorkItem } from '@/utils/api'
import { PageSkeleton } from '@/components/common/PageSkeleton'

import { WorkItemInfoPanel } from '@/components/work-item/WorkItemInfoPanel'
import { WorkItemEditForm } from '@/components/work-item/WorkItemEditForm'
import { AttachmentSection } from '@/components/work-item/AttachmentSection'
import { CommentSection } from '@/components/work-item/CommentSection'
import { ActivityTimeline } from '@/components/work-item/ActivityTimeline'

const { Title } = Typography

// Normalise attachments field which can arrive as a JSON string or array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normaliseAttachments = (raw: any): any[] => {
  if (!raw) return []
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((a: any) => a?.path) : []
    } catch {
      return []
    }
  }
  if (Array.isArray(raw)) return raw.filter((a: any) => a?.path)
  return []
}

const WorkItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const workItemId = id ? Number(id) : undefined
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()

  const [editOpen, setEditOpen] = useState(false)
  const [form] = Form.useForm()

  // ——— Data fetching ———
  const { data: workItemData, isLoading: loadingWorkItem } = useWorkItem(workItemId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workItem: any = (workItemData as any)?.data ?? workItemData

  const { data: activitiesData, isLoading: loadingActivities } = useQuery({
    queryKey: ['work-items', workItemId, 'activities'],
    queryFn: () => getWorkItemActivities(workItemId!).then((res) => res.data),
    enabled: workItemId !== undefined,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activities: any[] = (activitiesData as any)?.data ?? activitiesData ?? []

  const { data: adminsData } = useAdmins()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admins: any[] = (adminsData as any)?.data ?? adminsData ?? []

  const { data: projectsData } = useProjects()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects: any[] = (projectsData as any)?.data ?? projectsData ?? []

  // ——— Mutations ———
  const updateMutation     = useUpdateWorkItem(workItemId ?? 0)
  const uploadMutation     = useUploadAttachment(workItemId ?? 0)
  const deleteMutation     = useDeleteAttachment(workItemId ?? 0)
  const commentMutation    = useAddComment(workItemId ?? 0)

  // ——— Permissions ———
  const canEdit = hasRole('admin') || (workItem && user && workItem.createdById === user.id)

  // ——— Handlers ———
  const handleDelete = async () => {
    try {
      const { deleteWorkItem } = await import('@/utils/api')
      await deleteWorkItem(workItemId!)
      message.success('工作项删除成功')
      navigate('/projects?tab=workItems')
    } catch (err: any) {
      message.error('删除工作项失败: ' + (err.message ?? '未知错误'))
    }
  }

  const openEditModal = () => {
    if (!workItem) return
    form.resetFields()
    form.setFieldsValue({
      ...workItem,
      projectId: workItem.projectId,
      assigneeId: workItem.assigneeId,
      expectedCompletionDate: workItem.expectedCompletionDate ? dayjs(workItem.expectedCompletionDate) : null,
      scheduledStartDate: workItem.scheduledStartDate ? dayjs(workItem.scheduledStartDate) : null,
      scheduledEndDate: workItem.scheduledEndDate ? dayjs(workItem.scheduledEndDate) : null,
      completionDate: workItem.completionDate ? dayjs(workItem.completionDate) : null,
    })
    setEditOpen(true)
  }

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (values.expectedCompletionDate) values.expectedCompletionDate = values.expectedCompletionDate.format('YYYY-MM-DD')
      if (values.scheduledStartDate)     values.scheduledStartDate     = values.scheduledStartDate.format('YYYY-MM-DD')
      if (values.scheduledEndDate)       values.scheduledEndDate       = values.scheduledEndDate.format('YYYY-MM-DD')
      if (values.completionDate)         values.completionDate         = values.completionDate.format('YYYY-MM-DD')

      const formData = new FormData()
      Object.keys(values).forEach((key) => {
        if (key !== 'attachments' && values[key] !== undefined && values[key] !== null) {
          let changed = false
          if (key.includes('Date') && workItem[key]) {
            const oldFormatted = new Date(workItem[key]).toISOString().split('T')[0]
            changed = values[key] !== oldFormatted
          } else {
            changed = String(values[key]) !== String(workItem[key])
          }
          if (changed) formData.append(key, values[key])
        }
      })

      await apiUpdateWorkItem(workItemId!, formData as any)
      message.success('工作项更新成功')
      setEditOpen(false)
      updateMutation.reset()
    } catch (err: any) {
      message.error('更新工作项失败: ' + (err.message ?? '未知错误'))
    }
  }

  const handleUpload = (file: File) => {
    uploadMutation.mutate(file, {
      onSuccess: () => message.success(`文件 ${file.name} 上传成功`),
      onError: (err: any) => message.error('上传失败: ' + (err.message ?? '未知错误')),
    })
  }

  const handleDeleteAttachment = (filename: string) => {
    deleteMutation.mutate(filename, {
      onSuccess: () => message.success('附件删除成功'),
      onError: (err: any) => message.error('删除附件失败: ' + (err.message ?? '未知错误')),
    })
  }

  const handleAddComment = (content: string) => {
    commentMutation.mutate(content, {
      onSuccess: () => message.success('评论添加成功'),
      onError: (err: any) => message.error('添加评论失败: ' + (err.message ?? '未知错误')),
    })
  }

  // ——— Loading / empty states ———
  if (loadingWorkItem) {
    return <PageSkeleton variant="detail" />
  }

  if (!workItem) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects?tab=workItems')}>
          返回工作项列表
        </Button>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>工作项不存在或已被删除</div>
        </Card>
      </div>
    )
  }

  const attachments = normaliseAttachments(workItem.attachments)
  const comments: any[] = Array.isArray(workItem.comments) ? workItem.comments : []

  return (
    <div className="work-item-detail">
      {/* Top action bar */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects?tab=workItems')}>
          返回工作项列表
        </Button>
        {canEdit && (
          <Space>
            <Button icon={<EditOutlined />} onClick={openEditModal}>编辑工作项</Button>
            <Popconfirm
              title="确定要删除此工作项吗？"
              onConfirm={handleDelete}
              okText="确定"
              cancelText="取消"
            >
              <Button icon={<DeleteOutlined />} danger>删除工作项</Button>
            </Popconfirm>
          </Space>
        )}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* LEFT: main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + description */}
          <Card>
            <Title level={3} style={{ marginBottom: 8 }}>{workItem.title}</Title>
            <div style={{ whiteSpace: 'pre-wrap', color: workItem.description ? undefined : '#999' }}>
              {workItem.description || '无描述'}
            </div>
          </Card>

          {/* Attachments */}
          <Card title="附件" style={{ marginTop: 16 }}>
            <AttachmentSection
              attachments={attachments}
              onUpload={handleUpload}
              onDelete={handleDeleteAttachment}
              uploading={uploadMutation.isPending}
              canEdit={canEdit}
            />
          </Card>

          {/* Comments */}
          <Card title="评论" style={{ marginTop: 16 }}>
            <CommentSection
              comments={comments}
              onSubmit={handleAddComment}
              submitting={commentMutation.isPending}
            />
          </Card>

          {/* Activity timeline */}
          <Card title="活动记录" style={{ marginTop: 16 }}>
            <ActivityTimeline activities={activities} loading={loadingActivities} />
          </Card>
        </div>

        {/* RIGHT: info panel */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <Card>
            <WorkItemInfoPanel workItem={workItem} />
          </Card>
        </div>
      </div>

      {/* Edit modal */}
      <WorkItemEditForm
        open={editOpen}
        workItem={workItem}
        admins={admins}
        projects={projects}
        submitting={updateMutation.isPending}
        isAdmin={hasRole('admin')}
        form={form}
        onSubmit={handleEditSubmit}
        onCancel={() => setEditOpen(false)}
      />
    </div>
  )
}

export default WorkItemDetail
