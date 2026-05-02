import { useState } from 'react'
import { Card, Select, Button, Empty } from 'antd'
import { FilterOutlined } from '@ant-design/icons'
import { Bar } from '@ant-design/plots'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import type { Project } from '@/types/models'

interface GanttWorkItem {
  id: number
  title: string
  type?: string | null
  status?: string | null
  scheduledStartDate?: string | null
  scheduledEndDate?: string | null
  projectName?: string | null
}

interface Props {
  projects: Project[]
  workItemsByProject: Record<number, GanttWorkItem[]>
}

function getStatusColor(status: string): string {
  if (status === '已完成') return '#52c41a'
  if (status === '进行中') return '#1890ff'
  if (status === '待处理') return '#faad14'
  if (status === '已延期') return '#f5222d'
  return '#d9d9d9'
}

export function GanttSection({ projects, workItemsByProject }: Props) {
  const [selectedProject, setSelectedProject] = useState<number | string>('')
  const [dateRange, setDateRange] = useState<any>([null, null])

  const prepareGanttData = () => {
    const ganttData: any[] = []
    const today = dayjs().startOf('day')

    let minDate: any = null
    let maxDate: any = null

    projects.forEach((project) => {
      if (selectedProject && project.id !== selectedProject) return

      const workItems = workItemsByProject[project.id] ?? []
      workItems.forEach((item) => {
        if (item.scheduledStartDate && item.scheduledEndDate) {
          const startDate = dayjs(item.scheduledStartDate).startOf('day')
          const endDate = dayjs(item.scheduledEndDate).endOf('day')

          if (dateRange[0] && dateRange[1]) {
            const filterStart = dayjs(dateRange[0]).startOf('day')
            const filterEnd = dayjs(dateRange[1]).endOf('day')
            if (endDate.isBefore(filterStart) || startDate.isAfter(filterEnd)) return
          }

          if (!minDate || startDate.isBefore(minDate)) minDate = startDate
          if (!maxDate || endDate.isAfter(maxDate)) maxDate = endDate

          let progressStatus = item.status ?? '待处理'
          if (progressStatus === '待处理' && startDate.isBefore(today)) {
            progressStatus = '已延期'
          }

          ganttData.push({
            name: item.title,
            project: project.name,
            type: item.type,
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
            status: progressStatus,
            category: 'workitem',
          })
        }
      })
    })

    ganttData.sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf())

    if (ganttData.length === 0) {
      return {
        data: [],
        minDate: today.format('YYYY-MM-DD'),
        maxDate: today.add(15, 'day').format('YYYY-MM-DD'),
      }
    }

    if (minDate && maxDate) {
      const diffDays = maxDate.diff(minDate, 'day')
      if (diffDays < 15) maxDate = minDate.add(15, 'day')
    }

    return {
      data: ganttData,
      minDate: minDate ? minDate.format('YYYY-MM-DD') : today.format('YYYY-MM-DD'),
      maxDate: maxDate ? maxDate.format('YYYY-MM-DD') : today.add(15, 'day').format('YYYY-MM-DD'),
    }
  }

  const { data: ganttData, minDate, maxDate } = prepareGanttData()

  const filterControls = (
    <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
      <Select
        placeholder="选择项目"
        style={{ width: 200 }}
        value={selectedProject || undefined}
        onChange={setSelectedProject}
        allowClear
      >
        {projects.map((project) => (
          <Select.Option key={project.id} value={project.id}>{project.name}</Select.Option>
        ))}
      </Select>

      <DatePicker.RangePicker
        placeholder={['开始日期', '结束日期']}
        value={dateRange}
        onChange={setDateRange}
        style={{ width: 300 }}
      />

      {ganttData.length > 0 && (
        <Button
          onClick={() => {
            setSelectedProject('')
            setDateRange([null, null])
          }}
          icon={<FilterOutlined />}
        >
          重置筛选
        </Button>
      )}
    </div>
  )

  if (ganttData.length === 0) {
    return (
      <Card title="项目进度" bodyStyle={{ padding: '16px 24px' }}>
        {filterControls}
        <Empty description="暂无排期数据" />
      </Card>
    )
  }

  const convertedData = ganttData.map((item: any) => {
    const start = dayjs(item.startDate).startOf('day')
    const end = dayjs(item.endDate).endOf('day')
    return {
      ...item,
      range: [start.toISOString(), end.toISOString()],
    }
  })

  const config: any = {
    data: convertedData,
    xField: 'range',
    yField: 'name',
    isRange: true,
    seriesField: 'status',
    height: 400,
    legend: { position: 'top-right' },
    label: false,
    tooltip: {
      customContent: (title: any, items: any[]) => {
        const item = items[0]
        if (!item) return ''
        const datum = item.data
        const startDate = dayjs(datum.startDate)
        const endDate = dayjs(datum.endDate)
        const duration = endDate.diff(startDate, 'day') + 1
        return `
          <div style="padding: 5px; font-size: 12px; line-height: 1.5;">
            <div><strong>${datum.name}</strong></div>
            <div>项目: ${datum.project}</div>
            <div>类型: ${datum.type}</div>
            <div>状态: ${datum.status}</div>
            <div>开始日期: ${startDate.format('YYYY-MM-DD')}</div>
            <div>结束日期: ${endDate.format('YYYY-MM-DD')}</div>
            <div>持续天数: ${duration} 天</div>
          </div>
        `
      },
      showTitle: false,
      showMarkers: false,
    },
    color: ({ status }: any) => getStatusColor(status),
    barStyle: { radius: 4, fillOpacity: 0.8 },
    padding: [40, 40, 120, 200],
    xAxis: {
      type: 'time',
      tickCount: 10,
      min: minDate,
      max: maxDate,
      label: {
        formatter: (text: any) => dayjs(text).format('MM-DD'),
        style: { fontSize: 12, fontWeight: 400 },
      },
      grid: { line: { style: { stroke: '#f0f0f0' } } },
    },
    yAxis: {
      label: {
        autoHide: false,
        autoEllipsis: false,
        style: { fontSize: 12, fontWeight: 400 },
        formatter: (text: any) => {
          if (text.length > 30) return text.substring(0, 30) + '...'
          return text
        },
      },
      grid: { line: { style: { stroke: 'transparent' } } },
    },
    meta: {
      range: {
        type: 'time',
        mask: 'YYYY-MM-DD',
        tickInterval: 86400000,
        nice: true,
        formatter: (value: any) => dayjs(value).format('YYYY-MM-DD'),
        parser: (value: any) => dayjs(value).valueOf(),
      },
    },
  }

  return (
    <Card title="项目进度" bodyStyle={{ padding: '16px 24px' }}>
      {filterControls}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.45)', marginBottom: 8 }}>
          工作项排期时间。
        </div>
      </div>
      <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', marginBottom: '24px' }}>
        <div style={{ minWidth: '800px', width: '100%', padding: '0 0 30px 0', position: 'relative' }}>
          <Bar {...config} onReady={() => { console.log('图表已加载') }} />
        </div>
      </div>
    </Card>
  )
}
