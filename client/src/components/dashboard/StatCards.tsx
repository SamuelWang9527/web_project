import { Row, Col } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
} from '@ant-design/icons'
import type { Project } from '@/types/models'

const cardStyle: React.CSSProperties = {
  height: 140,
  borderRadius: 8,
  background: 'linear-gradient(to bottom right, #ffffff, #fafafa)',
  border: '1px solid #f0f0f0',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}

const cardHoverStyle: React.CSSProperties = {
  ...cardStyle,
  transform: 'translateY(-2px)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
}

const titleStyle: React.CSSProperties = {
  color: 'rgba(0, 0, 0, 0.65)',
  fontSize: 15,
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const iconStyle: React.CSSProperties = {
  fontSize: 20,
  padding: 6,
  borderRadius: 6,
}

const valueStyle: React.CSSProperties = {
  fontSize: 32,
  lineHeight: 1.2,
  fontWeight: 600,
  color: '#262626',
  margin: '8px 0',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
}

const descriptionStyle: React.CSSProperties = {
  color: 'rgba(0, 0, 0, 0.45)',
  fontSize: 13,
  display: 'flex',
  gap: 12,
}

const descSpanStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}

const dotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  display: 'inline-block',
  marginRight: 4,
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
  const urgentCount = pendingItems.filter(i => i.priority === 'urgent').length
  const highPriorityCount = pendingItems.filter(i => i.priority === 'high').length

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
      <Col span={8}>
        <StatCard>
          <div style={headerStyle}>
            <div style={titleStyle}>
              <ProjectOutlined
                style={{ ...iconStyle, backgroundColor: '#e6f7ff', color: '#1890ff' }}
              />
              <span>总项目数</span>
            </div>
          </div>
          <div style={valueStyle}>{projects.length}</div>
          <div style={descriptionStyle}>
            <span style={descSpanStyle}>
              <i style={{ ...dotStyle, backgroundColor: '#1890ff' }}></i>
              进行中：{inProgressCount}
            </span>
            <span style={descSpanStyle}>
              <i style={{ ...dotStyle, backgroundColor: '#52c41a' }}></i>
              已完成：{completedProjectCount}
            </span>
          </div>
        </StatCard>
      </Col>
      <Col span={8}>
        <StatCard>
          <div style={headerStyle}>
            <div style={titleStyle}>
              <CheckCircleOutlined
                style={{ ...iconStyle, backgroundColor: '#f6ffed', color: '#52c41a' }}
              />
              <span>工作项完成率</span>
            </div>
          </div>
          <div style={valueStyle}>{completionRate}%</div>
          <div style={descriptionStyle}>
            <span style={descSpanStyle}>
              <i style={{ ...dotStyle, backgroundColor: '#52c41a' }}></i>
              已完成：{stats.completedCount ?? 0}
            </span>
            <span style={descSpanStyle}>
              <i style={{ ...dotStyle, backgroundColor: '#8c8c8c' }}></i>
              应完成：{stats.totalDueItems ?? 0}
            </span>
          </div>
        </StatCard>
      </Col>
      <Col span={8}>
        <StatCard>
          <div style={headerStyle}>
            <div style={titleStyle}>
              <ClockCircleOutlined
                style={{ ...iconStyle, backgroundColor: '#fff7e6', color: '#fa8c16' }}
              />
              <span>待处理工作项</span>
            </div>
          </div>
          <div style={valueStyle}>{stats.pendingCount ?? 0}</div>
          <div style={descriptionStyle}>
            <span style={descSpanStyle}>
              <i style={{ ...dotStyle, backgroundColor: '#f5222d' }}></i>
              紧急：{urgentCount}
            </span>
            <span style={descSpanStyle}>
              <i style={{ ...dotStyle, backgroundColor: '#fa8c16' }}></i>
              高优先级：{highPriorityCount}
            </span>
          </div>
        </StatCard>
      </Col>
    </Row>
  )
}
