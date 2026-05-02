import { Table, Select, Button, Empty, DatePicker } from 'antd'
import { FilterOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from 'antd'
import dayjs from 'dayjs'
import type { WorkItem, Project, User } from '@/types/models'
import type { PaginationMeta } from '@/types/api'
import { WorkItemStatusTag, WorkItemPriorityTag, WorkItemTypeTag } from '@/components/common/StatusTag'

const { Option } = Select
const { RangePicker } = DatePicker

interface Filters {
  projectId?: number | string
  brand?: string
  type?: string
  priority?: string
  createdById?: number | string
  assigneeId?: number | string
  dateRange?: any[]
}

interface Props {
  items: any[]
  meta: PaginationMeta | undefined
  loading: boolean
  filters: Filters
  projects: Project[]
  users: User[]
  brands: string[]
  onFilterChange: (key: string, value: any) => void
  onResetFilters: () => void
}

export function PendingItemsTable({
  items,
  meta,
  loading,
  filters,
  projects,
  users,
  brands,
  onFilterChange,
  onResetFilters,
}: Props) {
  const navigate = useNavigate()

  const columns: any[] = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a: any, b: any) => a.id - b.id,
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true,
      sorter: (a: any, b: any) => a.title.localeCompare(b.title),
      sortDirections: ['ascend', 'descend'],
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
      render: (val: WorkItem['status']) => <WorkItemStatusTag status={val} />,
    },
    {
      title: '紧急程度',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (val: WorkItem['priority']) => <WorkItemPriorityTag priority={val} />,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 120,
      render: (creator: any) => creator?.username || '-',
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 120,
      render: (assignee: any) => assignee?.username || '未分配',
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      sortDirections: ['ascend', 'descend'],
      render: (date: any) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '创建距今天数',
      dataIndex: 'daysFromCreation',
      key: 'daysFromCreation',
      width: 120,
      render: (days: any) => (
        <span style={{ color: days > 7 ? '#f5222d' : 'inherit' }}>{days} 天</span>
      ),
    },
  ]

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>待处理工作项</span>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/projects?tab=workItems')}
          >
            返回工作项列表
          </Button>
        </div>
      }
      style={{ marginBottom: 24 }}
      bodyStyle={{ padding: '16px 24px' }}
    >
      {/* 筛选器 */}
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <Select
          placeholder="项目"
          style={{ width: 150 }}
          value={filters.projectId || undefined}
          onChange={(value) => onFilterChange('projectId', value)}
          allowClear
        >
          {projects.map((project) => (
            <Option key={project.id} value={project.id}>{project.name}</Option>
          ))}
        </Select>

        <Select
          placeholder="品牌"
          style={{ width: 150 }}
          value={filters.brand || undefined}
          onChange={(value) => onFilterChange('brand', value)}
          allowClear
        >
          {brands.map((brand) => (
            <Option key={brand} value={brand}>{brand}</Option>
          ))}
        </Select>

        <Select
          placeholder="类型"
          style={{ width: 150 }}
          value={filters.type || undefined}
          onChange={(value) => onFilterChange('type', value)}
          allowClear
        >
          <Option value="规划">规划</Option>
          <Option value="需求">需求</Option>
          <Option value="事务">事务</Option>
          <Option value="缺陷">缺陷</Option>
        </Select>

        <Select
          placeholder="紧急程度"
          style={{ width: 150 }}
          value={filters.priority || undefined}
          onChange={(value) => onFilterChange('priority', value)}
          allowClear
        >
          <Option value="紧急">紧急</Option>
          <Option value="高">高</Option>
          <Option value="中">中</Option>
          <Option value="低">低</Option>
        </Select>

        <Select
          placeholder="创建人"
          style={{ width: 150 }}
          value={filters.createdById || undefined}
          onChange={(value) => onFilterChange('createdById', value)}
          allowClear
        >
          {users.map((u) => (
            <Option key={u.id} value={u.id}>{u.username}</Option>
          ))}
        </Select>

        <Select
          placeholder="负责人"
          style={{ width: 150 }}
          value={filters.assigneeId || undefined}
          onChange={(value) => onFilterChange('assigneeId', value)}
          allowClear
        >
          {users.map((u) => (
            <Option key={u.id} value={u.id}>{u.username}</Option>
          ))}
        </Select>

        <RangePicker
          style={{ width: 250 }}
          value={filters.dateRange as any}
          onChange={(dates) => onFilterChange('dateRange', dates)}
        />

        <Button icon={<FilterOutlined />} onClick={onResetFilters}>
          重置筛选
        </Button>
      </div>

      {items && items.length > 0 ? (
        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 5 }}
          size="middle"
          scroll={{ x: 1300 }}
          bordered
        />
      ) : (
        <Empty description="暂无待处理工作项" />
      )}
    </Card>
  )
}
