import { Input, Select, Button, DatePicker } from 'antd'
import { SearchOutlined, FilterOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

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
        <Select
          placeholder="需求来源"
          style={{ width: 150 }}
          value={filters.source || undefined}
          onChange={value => onChange('source', value)}
          allowClear
        >
          <Option value="内部需求">内部需求</Option>
          <Option value="品牌需求">品牌需求</Option>
        </Select>
        <Select
          placeholder="创建人"
          style={{ width: 150 }}
          value={filters.createdById || undefined}
          onChange={value => onChange('createdById', value)}
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
        <RangePicker
          placeholder={['创建开始日期', '创建结束日期']}
          style={{ width: 260 }}
          value={[
            filters.startDate ? dayjs(filters.startDate) : null,
            filters.endDate ? dayjs(filters.endDate) : null,
          ] as [Dayjs | null, Dayjs | null]}
          onChange={dates => {
            onChange('startDate', dates?.[0] ? dates[0].format('YYYY-MM-DD') : '')
            onChange('endDate', dates?.[1] ? dates[1].format('YYYY-MM-DD') : '')
          }}
        />
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
