import { Row, Col } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
} from '@ant-design/icons'
import styled from 'styled-components'
import type { Project } from '@/types/models'

const StatisticCard = styled.div`
  height: 140px;
  border-radius: 8px;
  background: linear-gradient(to bottom right, #ffffff, #fafafa);
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .statistic-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .statistic-title {
    color: rgba(0, 0, 0, 0.65);
    font-size: 15px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .statistic-icon {
    font-size: 20px;
    padding: 6px;
    border-radius: 6px;
  }

  .statistic-value {
    font-size: 32px;
    line-height: 1.2;
    font-weight: 600;
    color: #262626;
    margin: 8px 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  }

  .statistic-description {
    color: rgba(0, 0, 0, 0.45);
    font-size: 13px;
    display: flex;
    gap: 12px;

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 4px;
    }
  }
`

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
            <StatisticCard style={{ background: '#f5f5f5' }} />
          </Col>
        ))}
      </Row>
    )
  }

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={8}>
        <StatisticCard>
          <div className="statistic-header">
            <div className="statistic-title">
              <ProjectOutlined
                className="statistic-icon"
                style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }}
              />
              <span>总项目数</span>
            </div>
          </div>
          <div className="statistic-value">{projects.length}</div>
          <div className="statistic-description">
            <span>
              <i className="dot" style={{ backgroundColor: '#1890ff' }}></i>
              进行中：{inProgressCount}
            </span>
            <span>
              <i className="dot" style={{ backgroundColor: '#52c41a' }}></i>
              已完成：{completedProjectCount}
            </span>
          </div>
        </StatisticCard>
      </Col>
      <Col span={8}>
        <StatisticCard>
          <div className="statistic-header">
            <div className="statistic-title">
              <CheckCircleOutlined
                className="statistic-icon"
                style={{ backgroundColor: '#f6ffed', color: '#52c41a' }}
              />
              <span>工作项完成率</span>
            </div>
          </div>
          <div className="statistic-value">{completionRate}%</div>
          <div className="statistic-description">
            <span>
              <i className="dot" style={{ backgroundColor: '#52c41a' }}></i>
              已完成：{stats.completedCount ?? 0}
            </span>
            <span>
              <i className="dot" style={{ backgroundColor: '#8c8c8c' }}></i>
              应完成：{stats.totalDueItems ?? 0}
            </span>
          </div>
        </StatisticCard>
      </Col>
      <Col span={8}>
        <StatisticCard>
          <div className="statistic-header">
            <div className="statistic-title">
              <ClockCircleOutlined
                className="statistic-icon"
                style={{ backgroundColor: '#fff7e6', color: '#fa8c16' }}
              />
              <span>待处理工作项</span>
            </div>
          </div>
          <div className="statistic-value">{stats.pendingCount ?? 0}</div>
          <div className="statistic-description">
            <span>
              <i className="dot" style={{ backgroundColor: '#f5222d' }}></i>
              紧急：{urgentCount}
            </span>
            <span>
              <i className="dot" style={{ backgroundColor: '#fa8c16' }}></i>
              高优先级：{highPriorityCount}
            </span>
          </div>
        </StatisticCard>
      </Col>
    </Row>
  )
}
