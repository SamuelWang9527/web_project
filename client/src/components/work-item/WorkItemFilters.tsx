import { Input, Select, Button } from 'antd'
import { SearchOutlined, FilterOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons'

const { Option } = Select

export interface WorkItemFilterState {
  title: string
  projectId: string
  type: string
  status: string
  priority: string
  assigneeId: string
  source: string
  startDate: string
  endDate: string
  createdById: string
}

export const defaultFilters: WorkItemFilterState = {
  title: '',
  projectId: '',
  type: '',
  status: '',
  priority: '',
  assigneeId: '',
  source: '',
  startDate: '',
  endDate: '',
  createdById: '',
}

interface Props {
  filters: WorkItemFilterState
  projects: any[]
  admins: any[]
  onChange: (name: string, value: any) => void
  onReset: () => void
  onCreateClick: () => void
  onExportClick: () => void
}

export function WorkItemFilters({
  filters,
  projects,
  admins,
  onChange,
  onReset,
  onCreateClick,
  onExportClick,
}: Props) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 16,
    }}>
      <div style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
        flex: 1,
      }}>
        <Input
          placeholder="搜索标题"
          value={filters.title}
          onChange={e => onChange('title', e.target.value)}
          style={{ width: 400 }}
          prefix={<SearchOutlined />}
          allowClear
        />
        <Select
          placeholder="项目"
          style={{ width: 150 }}
          value={filters.projectId || undefined}
          onChange={value => onChange('projectId', value)}
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {projects.map((project: any) => (
            <Option key={project.id} value={project.id}>{project.name}</Option>
          ))}
        </Select>
        <Select
          placeholder="类型"
          style={{ width: 150 }}
          value={filters.type || undefined}
          onChange={value => onChange('type', value)}
          allowClear
        >
          <Option value="规划">规划</Option>
          <Option value="需求">需求</Option>
          <Option value="事务">事务</Option>
          <Option value="缺陷">缺陷</Option>
        </Select>
        <Select
          placeholder="状态"
          style={{ width: 150 }}
          value={filters.status || undefined}
          onChange={value => onChange('status', value)}
          allowClear
        >
          <Option value="待处理">待处理</Option>
          <Option value="进行中">进行中</Option>
          <Option value="已完成">已完成</Option>
          <Option value="关闭">关闭</Option>
        </Select>
        <Select
          placeholder="紧急程度"
          style={{ width: 150 }}
          value={filters.priority || undefined}
          onChange={value => onChange('priority', value)}
          allowClear
        >
          <Option value="紧急">紧急</Option>
          <Option value="高">高</Option>
          <Option value="中">中</Option>
          <Option value="低">低</Option>
        </Select>
        <Select
          placeholder="负责人"
          style={{ width: 150 }}
          value={filters.assigneeId || undefined}
          onChange={value => onChange('assigneeId', value)}
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {admins.map((admin: any) => (
            <Option key={admin.id} value={admin.id}>
              {admin.username} ({admin.role === 'super_admin' ? '超级管理员' : '管理员'})
            </Option>
          ))}
        </Select>
        <Button icon={<FilterOutlined />} onClick={onReset}>
          重置筛选
        </Button>
      </div>

      <div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreateClick}
          style={{ marginRight: 12 }}
        >
          创建工作项
        </Button>
        <Button icon={<DownloadOutlined />} onClick={onExportClick}>
          导出
        </Button>
      </div>
    </div>
  )
}
