import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Empty, Select, DatePicker } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  FilterOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { Bar } from '@ant-design/plots';
import dayjs from 'dayjs';
import * as api from '../utils/api';
import styled from 'styled-components';
import { renderPriorityTag, renderStatusTag, renderTypeTag } from '../utils/tagRenderers';

const { Option } = Select;
const { RangePicker } = DatePicker;

const StatisticCard = styled(Card)`
  height: 140px;
  border-radius: 8px;
  background: linear-gradient(to bottom right, #ffffff, #fafafa);
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .ant-card-body {
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
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
`;

interface DashboardStats {
  completedCount: number;
  pendingCount: number;
  dailyAverage: number;
  totalDueItems: number;
}

interface ProjectGanttChartProps {
  projects: any[];
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    completedCount: 0,
    pendingCount: 0,
    dailyAverage: 0,
    totalDueItems: 0
  });
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [filteredPendingItems, setFilteredPendingItems] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  // 筛选条件
  const [filters, setFilters] = useState<any>({
    projectId: '',
    brand: '',
    type: '',
    priority: '',
    createdById: '',
    assigneeId: '',
    dateRange: []
  });

  const navigate = useNavigate();

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await api.getDashboardStats();
      const data = (response.data as any)?.data || response.data;
      setStats(data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 获取待处理工作项
  const fetchPendingItems = async () => {
    try {
      const response = await api.getPendingItems({ status: '待处理' });
      const data: any[] = (response.data as any)?.data || response.data || [];

      const itemsWithDays = (data || []).map((item: any) => {
        const createdDate = new Date(item.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...item,
          daysFromCreation: diffDays
        };
      });

      setPendingItems(itemsWithDays);
      setFilteredPendingItems(itemsWithDays);
    } catch (error) {
      console.error('获取待处理工作项失败:', error);
      setPendingItems([]);
      setFilteredPendingItems([]);
    }
  };

  // 获取项目数据
  const fetchProjects = async () => {
    try {
      const response = await api.getProjects();
      const data = (response.data as any)?.data || response.data;
      const projectsData = Array.isArray(data) ? data : [];

      const projectsWithWorkItems = await Promise.all(
        projectsData.map(async (project: any) => {
          try {
            const wiResponse = await api.getWorkItems({ projectId: project.id });
            const workItems = (wiResponse.data as any)?.data || wiResponse.data;
            return {
              ...project,
              workItems: Array.isArray(workItems) ? workItems : []
            };
          } catch {
            return { ...project, workItems: [] };
          }
        })
      );

      setProjects(projectsWithWorkItems);
    } catch (error) {
      console.error('获取项目数据失败:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取用户数据
  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      const data = (response.data as any)?.data || response.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取用户数据失败:', error);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPendingItems();
    fetchProjects();
    fetchUsers();
  }, []);

  // 当筛选条件变化时，过滤待处理工作项
  useEffect(() => {
    let filtered = [...pendingItems];

    if (filters.projectId) {
      filtered = filtered.filter(item => item.projectId === filters.projectId);
    }

    if (filters.brand) {
      filtered = filtered.filter(item => {
        const creator = users.find((u: any) => u.id === item.createdById);
        return creator && creator.brand === filters.brand;
      });
    }

    if (filters.type) {
      filtered = filtered.filter(item => item.type === filters.type);
    }

    if (filters.priority) {
      filtered = filtered.filter(item => item.priority === filters.priority);
    }

    if (filters.createdById) {
      filtered = filtered.filter(item => item.createdById === filters.createdById);
    }

    if (filters.assigneeId) {
      filtered = filtered.filter(item => item.assigneeId === filters.assigneeId);
    }

    if (filters.dateRange && filters.dateRange.length === 2) {
      const startDate = filters.dateRange[0].startOf('day');
      const endDate = filters.dateRange[1].endOf('day');

      filtered = filtered.filter(item => {
        const itemDate = dayjs(item.createdAt);
        return itemDate.isAfter(startDate) && itemDate.isBefore(endDate);
      });
    }

    setFilteredPendingItems(filtered);
  }, [filters, pendingItems, users]);

  // 处理筛选条件变化
  const handleFilterChange = (name: string, value: any) => {
    setFilters((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      projectId: '',
      brand: '',
      type: '',
      priority: '',
      createdById: '',
      assigneeId: '',
      dateRange: []
    });
  };

  // 待处理工作项表格列配置
  const columns: any[] = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a: any, b: any) => a.id - b.id,
      sortDirections: ['ascend', 'descend']
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
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200,
      render: (text: any) => text || '-'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: renderTypeTag
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatusTag
    },
    {
      title: '紧急程度',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: renderPriorityTag
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 120,
      render: (creator: any) => creator?.username || '-'
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 120,
      render: (assignee: any) => assignee?.username || '未分配'
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      sortDirections: ['ascend', 'descend'],
      render: (date: any) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '创建距今天数',
      dataIndex: 'daysFromCreation',
      key: 'daysFromCreation',
      width: 120,
      render: (days: any) => <span style={{ color: days > 7 ? '#f5222d' : 'inherit' }}>{days} 天</span>
    }
  ];

  const inProgressCount = projects.filter(p => p.status === '进行中').length;
  const completedCount = projects.filter(p => p.status === '已完成').length;
  const completionRate = stats.totalDueItems > 0 ? Math.round((stats.completedCount / stats.totalDueItems) * 100) : 0;
  const urgentCount = pendingItems.filter(i => i.priority === '紧急').length;
  const highPriorityCount = pendingItems.filter(i => i.priority === '高').length;
  const brands = [...new Set(users.map((u: any) => u.brand).filter(Boolean))];

  return (
    <div className="dashboard">
      {/* 统计卡片 */}
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
                已完成：{completedCount}
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
                已完成：{stats.completedCount || 0}
              </span>
              <span>
                <i className="dot" style={{ backgroundColor: '#8c8c8c' }}></i>
                应完成：{stats.totalDueItems || 0}
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
            <div className="statistic-value">{stats.pendingCount || 0}</div>
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

      {/* 待处理工作项 */}
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
            onChange={(value) => handleFilterChange('projectId', value)}
            allowClear
          >
            {projects.map((project: any) => (
              <Option key={project.id} value={project.id}>{project.name}</Option>
            ))}
          </Select>

          <Select
            placeholder="品牌"
            style={{ width: 150 }}
            value={filters.brand || undefined}
            onChange={(value) => handleFilterChange('brand', value)}
            allowClear
          >
            {(brands as string[]).map((brand: string) => (
              <Option key={brand} value={brand}>{brand}</Option>
            ))}
          </Select>

          <Select
            placeholder="类型"
            style={{ width: 150 }}
            value={filters.type || undefined}
            onChange={(value) => handleFilterChange('type', value)}
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
            onChange={(value) => handleFilterChange('priority', value)}
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
            onChange={(value) => handleFilterChange('createdById', value)}
            allowClear
          >
            {users.map((u: any) => (
              <Option key={u.id} value={u.id}>{u.username}</Option>
            ))}
          </Select>

          <Select
            placeholder="负责人"
            style={{ width: 150 }}
            value={filters.assigneeId || undefined}
            onChange={(value) => handleFilterChange('assigneeId', value)}
            allowClear
          >
            {users.map((u: any) => (
              <Option key={u.id} value={u.id}>{u.username}</Option>
            ))}
          </Select>

          <RangePicker
            style={{ width: 250 }}
            value={filters.dateRange}
            onChange={(dates) => handleFilterChange('dateRange', dates)}
          />

          <Button
            icon={<FilterOutlined />}
            onClick={resetFilters}
          >
            重置筛选
          </Button>
        </div>

        {filteredPendingItems && filteredPendingItems.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredPendingItems}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="middle"
            scroll={{ x: 1300 }}
            bordered
          />
        ) : (
          <Empty description="暂无待处理工作项" />
        )}
      </Card>

      {/* 项目进度 */}
      <Card
        title="项目进度"
        bodyStyle={{ padding: '16px 24px' }}
      >
        {projects && projects.length > 0 ? (
          <div style={{ height: 400, width: '100%' }}>
            <ProjectGanttChart projects={projects} />
          </div>
        ) : (
          <Empty description="暂无项目" />
        )}
      </Card>
    </div>
  );
};

// 项目甘特图组件
const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({ projects }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [dateRange, setDateRange] = useState<any>([null, null]);

  const prepareGanttData = () => {
    const ganttData: any[] = [];
    const today = dayjs().startOf('day');

    let minDate: any = null;
    let maxDate: any = null;

    projects.forEach((project: any) => {
      if (selectedProject && project.id !== selectedProject) return;

      if (project.workItems && project.workItems.length > 0) {
        project.workItems.forEach((item: any) => {
          if (item.scheduledStartDate && item.scheduledEndDate) {
            const startDate = dayjs(item.scheduledStartDate).startOf('day');
            const endDate = dayjs(item.scheduledEndDate).endOf('day');

            if (dateRange[0] && dateRange[1]) {
              const filterStartDate = dayjs(dateRange[0]).startOf('day');
              const filterEndDate = dayjs(dateRange[1]).endOf('day');
              if (endDate.isBefore(filterStartDate) || startDate.isAfter(filterEndDate)) return;
            }

            if (!minDate || startDate.isBefore(minDate)) minDate = startDate;
            if (!maxDate || endDate.isAfter(maxDate)) maxDate = endDate;

            let progressStatus = item.status;
            if (item.status === '待处理' && startDate.isBefore(today)) progressStatus = '已延期';

            ganttData.push({
              name: item.title,
              project: project.name,
              type: item.type,
              startDate: startDate.format('YYYY-MM-DD'),
              endDate: endDate.format('YYYY-MM-DD'),
              status: progressStatus,
              category: 'workitem'
            });
          }
        });
      }
    });

    ganttData.sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf());

    if (ganttData.length === 0) {
      return {
        data: [],
        minDate: today.format('YYYY-MM-DD'),
        maxDate: today.add(15, 'day').format('YYYY-MM-DD')
      };
    }

    if (minDate && maxDate) {
      const diffDays = maxDate.diff(minDate, 'day');
      if (diffDays < 15) maxDate = minDate.add(15, 'day');
    }

    return {
      data: ganttData,
      minDate: minDate ? minDate.format('YYYY-MM-DD') : today.format('YYYY-MM-DD'),
      maxDate: maxDate ? maxDate.format('YYYY-MM-DD') : today.add(15, 'day').format('YYYY-MM-DD')
    };
  };

  const { data: ganttData, minDate, maxDate } = prepareGanttData();

  if (ganttData.length === 0) {
    return (
      <>
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
          <Select
            placeholder="选择项目"
            style={{ width: 200 }}
            value={selectedProject || undefined}
            onChange={setSelectedProject}
            allowClear
          >
            {projects.map((project: any) => (
              <Select.Option key={project.id} value={project.id}>{project.name}</Select.Option>
            ))}
          </Select>

          <DatePicker.RangePicker
            placeholder={['开始日期', '结束日期']}
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 300 }}
          />
        </div>
        <Empty description="暂无排期数据" />
      </>
    );
  }

  const getStatusColor = (status: string) => {
    if (status === '已完成') return '#52c41a';
    if (status === '进行中') return '#1890ff';
    if (status === '待处理') return '#faad14';
    if (status === '已延期') return '#f5222d';
    return '#d9d9d9';
  };

  const convertedData = ganttData.map((item: any) => {
    const start = dayjs(item.startDate).startOf('day');
    const end = dayjs(item.endDate).endOf('day');
    return {
      ...item,
      range: [start.toISOString(), end.toISOString()]
    };
  });

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customContent: (title: any, items: any[]) => {
        const item = items[0];
        if (!item) return '';
        const datum = item.data;
        const startDate = dayjs(datum.startDate);
        const endDate = dayjs(datum.endDate);
        const duration = endDate.diff(startDate, 'day') + 1;
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
        `;
      },
      showTitle: false,
      showMarkers: false,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    color: ({ status }: any) => getStatusColor(status),
    barStyle: { radius: 4, fillOpacity: 0.8 },
    padding: [40, 40, 120, 200],
    xAxis: {
      type: 'time',
      tickCount: 10,
      min: minDate,
      max: maxDate,
      label: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (text: any) => {
          if (text.length > 30) return text.substring(0, 30) + '...';
          return text;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (value: any) => dayjs(value).format('YYYY-MM-DD'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parser: (value: any) => dayjs(value).valueOf()
      },
    },
  };

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <Select
          placeholder="选择项目"
          style={{ width: 200 }}
          value={selectedProject || undefined}
          onChange={setSelectedProject}
          allowClear
        >
          {projects.map((project: any) => (
            <Select.Option key={project.id} value={project.id}>{project.name}</Select.Option>
          ))}
        </Select>

        <DatePicker.RangePicker
          placeholder={['开始日期', '结束日期']}
          value={dateRange}
          onChange={setDateRange}
          style={{ width: 300 }}
        />

        <Button
          onClick={() => {
            setSelectedProject('');
            setDateRange([null, null]);
          }}
          icon={<FilterOutlined />}
        >
          重置筛选
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.45)', marginBottom: 8 }}>
          工作项排期时间。
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', marginBottom: '24px' }}>
        <div style={{ minWidth: '800px', width: '100%', padding: '0 0 30px 0', position: 'relative' }}>
          <Bar
            {...config}
            onReady={() => {
              console.log('图表已加载');
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
