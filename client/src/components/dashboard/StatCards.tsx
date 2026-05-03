import { Row, Col } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
} from '@ant-design/icons'
import type { Project } from '@/types/models'

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  border: '1px solid #ede9fe',
  boxShadow: '0 2px 12px rgba(99,102,241,0.07)',
  padding: '20px 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  transition: 'box-shadow .2s, transform .2s',
}

const cardHoverStyle: React.CSSProperties = {
  ...cardStyle,
  boxShadow: '0 6px 24px rgba(99,102,241,0.13)',
  transform: 'translateY(-2px)',
}

const valueStyle: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 700,
  color: '#1e1b4b',
  lineHeight: 1,
}

const descriptionStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#9ca3af',
  display: 'flex',
  gap: 12,
}

const dotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  display: 'inline-block',
  flexShrink: 0,
}

import React from 'react'

interface DashboardStats {
  completedCount?: number
  pendingCount?: number
  dailyAverage?: number | string
  totalDueItems?: number
}

interface Props {
  stats: DashboardStats
  projects: Project[]
  pendingItems: any[]
  loading: boolean
}

function StatCard({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <div
      style={{ ...(hovered ? cardHoverStyle : cardStyle), ...style }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  )
}

export function StatCards({ stats, projects, pendingItems, loading }: Props) {
  const inProgressCount = projects.filter(p => p.status === '进行中').length
  const completedProjectCount = projects.filter(p => p.status === '已完成').length
  const completionRate =
    (stats.totalDueItems ?? 0) > 0
      ? Math.round(((stats.completedCount ?? 0) / (stats.totalDueItems ?? 1)) * 100)
      : 0
  const urgentCount = pendingItems.filter(i => i.priority === '紧急').length
  const highPriorityCount = pendingItems.filter(i => i.priority === '高').length

  if (loading) {
    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[0, 1, 2].map(i => (
          <Col key={i} span={8}>
            <StatCard style={{ background: '#f5f5f5' }} />
          </Col>
        ))}
      </Row>
    )
  }

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      {/* Card 1: 总项目数 */}
      <Col span={8}>
        <StatCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ProjectOutlined style={{ color: '#6366f1', fontSize: 16 }} />
            </div>
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>总项目数</span>
          </div>
          <div style={valueStyle}>{projects.length}</div>
          <div style={descriptionStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <i style={{ ...dotStyle, background: '#6366f1' }} />
              进行中：{inProgressCount}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <i style={{ ...dotStyle, background: '#10b981' }} />
              已完成：{completedProjectCount}
            </span>
          </div>
        </StatCard>
      </Col>

      {/* Card 2: 工作项完成率 */}
      <Col span={8}>
        <StatCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleOutlined style={{ color: '#059669', fontSize: 16 }} />
            </div>
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>工作项完成率</span>
          </div>
          <div style={valueStyle}>{completionRate}%</div>
          <div style={descriptionStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <i style={{ ...dotStyle, background: '#10b981' }} />
              已完成：{stats.completedCount ?? 0}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <i style={{ ...dotStyle, background: '#e5e7eb' }} />
              应完成：{stats.totalDueItems ?? 0}
            </span>
          </div>
        </StatCard>
      </Col>

      {/* Card 3: 待处理工作项 */}
      <Col span={8}>
        <StatCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClockCircleOutlined style={{ color: '#d97706', fontSize: 16 }} />
            </div>
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>待处理工作项</span>
          </div>
          <div style={valueStyle}>{stats.pendingCount ?? 0}</div>
          <div style={descriptionStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <i style={{ ...dotStyle, background: '#ef4444' }} />
              紧急：{urgentCount}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <i style={{ ...dotStyle, background: '#f59e0b' }} />
              高优先级：{highPriorityCount}
            </span>
          </div>
        </StatCard>
      </Col>
    </Row>
  )
}
