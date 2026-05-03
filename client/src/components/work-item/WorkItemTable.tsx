import React from 'react'
import { Table, Button, Space, Popconfirm } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import {
  EyeOutlined,
  EditOutlined,
  UploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '@/contexts/AuthContext'
import { WorkItemStatusTag, WorkItemPriorityTag, WorkItemTypeTag } from '@/components/common/StatusTag'

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

interface Props {
  workItems: any[]
  loading: boolean
  onEdit: (workItem: any) => void
  onDelete: (id: number) => void
  onUpload: (id: number) => void
}

export function WorkItemTable({ workItems, loading, onEdit, onDelete, onUpload }: Props) {
  const { user, hasRole } = useAuth()
  const navigate = useNavigate()
  const isAdmin = hasRole('admin')

  const columns: any[] = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a: any, b: any) => a.id - b.id,
      sortDirections: ['descend', 'ascend'],
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true,
      sorter: (a: any, b: any) => a.title.localeCompare(b.title),
      render: (text: any, record: any) => (
        <Link to={`/work-items/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200,
      render: (text: any) => text || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (val: any) => <WorkItemTypeTag type={val} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: any) => <WorkItemStatusTag status={val} />,
    },
    {
      title: '紧急程度',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (val: any) => <WorkItemPriorityTag priority={val} />,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 120,
      render: (creator: any) => <UserCell user={creator} />,
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 120,
      render: (assignee: any) => <UserCell user={assignee} fallback="未分配" />,
    },
    {
      title: '需求来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: any) => source || '-',
    },
    {
      title: '期望完成日期',
      dataIndex: 'expectedCompletionDate',
      key: 'expectedCompletionDate',
      width: 120,
      render: (date: any) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '开始日期',
      dataIndex: 'scheduledStartDate',
      key: 'scheduledStartDate',
      width: 120,
      render: (date: any) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '结束日期',
      dataIndex: 'scheduledEndDate',
      key: 'scheduledEndDate',
      width: 120,
      render: (date: any) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '完成日期',
      dataIndex: 'completionDate',
      key: 'completionDate',
      width: 120,
      render: (date: any) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: any) => {
        const canEdit = isAdmin || (record.creator && record.creator.id === user?.id)
        return (
          <Space size="small">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/work-items/${record.id}`)}
            />
            {canEdit && (
              <>
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => onEdit(record)}
                />
                <Button
                  icon={<UploadOutlined />}
                  size="small"
                  onClick={() => onUpload(record.id)}
                />
                <Popconfirm
                  title="确定要删除此工作项吗？"
                  onConfirm={() => onDelete(record.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button icon={<DeleteOutlined />} size="small" danger />
                </Popconfirm>
              </>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={workItems}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条记录`,
        position: ['bottomRight'],
      }}
      scroll={{ x: 1800 }}
      size="middle"
      bordered
    />
  )
}
