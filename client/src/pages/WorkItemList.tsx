import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  message,
  Popconfirm,
  Space
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../utils/api';
import { renderPriorityTag, renderStatusTag, renderTypeTag } from '../utils/tagRenderers';

const { Option } = Select;
const { RangePicker } = DatePicker;

const WorkItemList: React.FC = () => {
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWorkItem, setEditingWorkItem] = useState<any | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [form] = Form.useForm();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const isAdmin = () => hasRole('admin');

  // 筛选条件
  const [filters, setFilters] = useState({
    title: '',
    projectId: '',
    type: '',
    status: '',
    priority: '',
    assigneeId: '',
    source: '',
    startDate: '',
    endDate: '',
    createdById: ''
  });

  // 获取工作项列表
  const fetchWorkItems = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
      );

      const response = await api.getWorkItems(params);
      const data = (response.data as any)?.data || response.data;

      if (Array.isArray(data)) {
        setWorkItems(data);
      } else {
        setWorkItems([]);
      }
    } catch (error) {
      console.error('获取工作项列表失败:', error);
      message.error('获取工作项列表失败');
      setWorkItems([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取项目列表
  const fetchProjects = async () => {
    try {
      const response = await api.getProjects();
      const data = (response.data as any)?.data || response.data;
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取项目列表失败:', error);
    }
  };

  // 获取管理员列表
  const fetchAdmins = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiAny = api as any;
      const data = await apiAny.getAdmins();
      setAdmins(data);
    } catch (error) {
      console.error('获取管理员列表失败:', error);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchWorkItems();
    fetchProjects();
    fetchAdmins();
  }, []);

  // 当筛选条件变化时重新获取数据
  useEffect(() => {
    fetchWorkItems();
  }, [filters]);

  // 处理筛选条件变化
  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理日期范围变化
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters(prev => ({
        ...prev,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        startDate: '',
        endDate: ''
      }));
    }
  };

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      title: '',
      projectId: '',
      type: '',
      status: '',
      priority: '',
      assigneeId: '',
      source: '',
      startDate: '',
      endDate: '',
      createdById: ''
    });
  };

  // 打开创建/编辑工作项模态框
  const showModal = (workItem: any = null) => {
    setEditingWorkItem(workItem);
    form.resetFields();

    if (workItem) {
      form.setFieldsValue({
        ...workItem,
        expectedCompletionDate: workItem.expectedCompletionDate ? dayjs(workItem.expectedCompletionDate) : null,
        scheduledStartDate: workItem.scheduledStartDate ? dayjs(workItem.scheduledStartDate) : null,
        scheduledEndDate: workItem.scheduledEndDate ? dayjs(workItem.scheduledEndDate) : null,
        completionDate: workItem.completionDate ? dayjs(workItem.completionDate) : null,
      });
    }

    setModalVisible(true);
  };

  // 关闭模态框
  const handleCancel = () => {
    setModalVisible(false);
    setEditingWorkItem(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (values.expectedCompletionDate) {
        values.expectedCompletionDate = values.expectedCompletionDate.format('YYYY-MM-DD');
      }
      if (values.scheduledStartDate) {
        values.scheduledStartDate = values.scheduledStartDate.format('YYYY-MM-DD');
      }
      if (values.scheduledEndDate) {
        values.scheduledEndDate = values.scheduledEndDate.format('YYYY-MM-DD');
      }
      if (values.completionDate) {
        values.completionDate = values.completionDate.format('YYYY-MM-DD');
      }

      if (values.status === '已完成' && !values.completionDate) {
        if (editingWorkItem && editingWorkItem.status !== '已完成') {
          values.completionDate = new Date().toISOString().split('T')[0];
        } else if (!editingWorkItem) {
          values.completionDate = new Date().toISOString().split('T')[0];
        }
      }

      if (editingWorkItem) {
        const result = await api.updateWorkItem(editingWorkItem.id, values);
        const updated = (result.data as any)?.data?.workItem || (result.data as any)?.workItem;
        if (updated) {
          setWorkItems(prev => prev.map(item =>
            item.id === editingWorkItem.id ? updated : item
          ));
        } else {
          fetchWorkItems();
        }
        message.success('工作项更新成功');
      } else {
        const result = await api.createWorkItem(values);
        const created = (result.data as any)?.data?.workItem || (result.data as any)?.workItem;
        if (created) {
          setWorkItems(prev => [created, ...prev]);
        } else {
          fetchWorkItems();
        }
        message.success('工作项创建成功');
      }

      setModalVisible(false);
    } catch (error: any) {
      console.error('保存工作项失败:', error);
      message.error('保存工作项失败: ' + error.message);
    }
  };

  // 删除工作项
  const handleDelete = async (id: number) => {
    try {
      await api.deleteWorkItem(id);
      message.success('工作项删除成功');
      fetchWorkItems();
    } catch (error: any) {
      console.error('删除工作项失败:', error);
      message.error('删除工作项失败: ' + error.message);
    }
  };

  // 导出工作项
  const handleExport = async () => {
    try {
      message.loading({ content: '正在导出工作项...', key: 'exportLoading' });

      if (workItems.length === 0) {
        message.warning({ content: '没有工作项可导出，请先查询工作项', key: 'exportLoading' });
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiAny = api as any;
      const response = await apiAny.exportWorkItems(filters);

      if (response && response.success && response.downloadUrl) {
        try {
          api.downloadFile(response.downloadUrl);
          message.success({ content: response.message || `已成功导出工作项`, key: 'exportLoading' });
        } catch (downloadError: any) {
          message.error({ content: `导出成功但下载失败: ${downloadError.message}`, key: 'exportLoading', duration: 10 });
        }
      } else {
        throw new Error('导出失败，未获取到下载链接');
      }
    } catch (error: any) {
      console.error('导出工作项失败:', error);
      message.error({ content: '导出工作项失败: ' + (error.message || ''), key: 'exportLoading', duration: 10 });
    }
  };

  // 处理附件上传
  const handleUploadAttachment = async (workItemId: number) => {
    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt';

      fileInput.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const file = target.files[0];
          const loadingMessage = message.loading('正在上传文件...', 0);

          try {
            const result = await api.uploadAttachment(workItemId, file);
            loadingMessage();
            message.success(`文件 ${file.name} 上传成功`);
            fetchWorkItems();
          } catch (error: any) {
            loadingMessage();
            message.error('上传失败: ' + (error.message || '未知错误'));
          }
        }
      };

      fileInput.click();
    } catch (error: any) {
      message.error('上传失败: ' + (error.message || '未知错误'));
    }
  };

  // 表格列定义
  const columns: any[] = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a: any, b: any) => a.id - b.id,
      sortDirections: ['descend', 'ascend']
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
      render: (creator: any) => creator ? creator.username : '-'
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 120,
      render: (assignee: any) => assignee ? assignee.username : '未分配'
    },
    {
      title: '需求来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: any) => source || '-'
    },
    {
      title: '期望完成日期',
      dataIndex: 'expectedCompletionDate',
      key: 'expectedCompletionDate',
      width: 120,
      render: (date: any) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '开始日期',
      dataIndex: 'scheduledStartDate',
      key: 'scheduledStartDate',
      width: 120,
      render: (date: any) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '结束日期',
      dataIndex: 'scheduledEndDate',
      key: 'scheduledEndDate',
      width: 120,
      render: (date: any) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '完成日期',
      dataIndex: 'completionDate',
      key: 'completionDate',
      width: 120,
      render: (date: any) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: any) => {
        const canEdit = isAdmin() || (record.creator && record.creator.id === user?.id);

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
                  onClick={() => showModal(record)}
                />
                <Button
                  icon={<UploadOutlined />}
                  size="small"
                  onClick={() => handleUploadAttachment(record.id)}
                />
                <Popconfirm
                  title="确定要删除此工作项吗？"
                  onConfirm={() => handleDelete(record.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                  />
                </Popconfirm>
              </>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div>
      {/* 筛选器 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
            flex: 1
          }}>
            <Input
              placeholder="搜索标题"
              value={filters.title}
              onChange={(e) => handleFilterChange('title', e.target.value)}
              style={{ width: 400 }}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Select
              placeholder="项目"
              style={{ width: 150 }}
              value={filters.projectId || undefined}
              onChange={(value) => handleFilterChange('projectId', value)}
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
              onChange={(value) => handleFilterChange('type', value)}
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
              onChange={(value) => handleFilterChange('status', value)}
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
              onChange={(value) => handleFilterChange('priority', value)}
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
              onChange={(value) => handleFilterChange('assigneeId', value)}
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
            <Button
              icon={<FilterOutlined />}
              onClick={resetFilters}
            >
              重置筛选
            </Button>
          </div>

          <div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
              style={{ marginRight: 12 }}
            >
              创建工作项
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
          </div>
        </div>
      </Card>

      {/* 工作项列表 */}
      <Card>
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
            position: ['bottomRight']
          }}
          scroll={{ x: 1800 }}
          size="middle"
          bordered
        />
      </Card>

      {/* 创建/编辑工作项模态框 */}
      <Modal
        title={editingWorkItem ? '编辑工作项' : '创建工作项'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="保存"
        cancelText="取消"
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="projectId"
              label="所属项目"
              style={{ flex: 1 }}
            >
              <Select allowClear placeholder="请选择项目">
                {projects.map((project: any) => (
                  <Option key={project.id} value={project.id}>{project.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="type"
              label="类型"
              rules={[{ required: true, message: '请选择类型' }]}
              style={{ flex: 1 }}
              initialValue="事务"
            >
              <Select>
                <Option value="规划">规划</Option>
                <Option value="需求">需求</Option>
                <Option value="事务">事务</Option>
                <Option value="缺陷">缺陷</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="描述"
            style={{ marginBottom: '20px' }}
          >
            <Input.TextArea rows={6} placeholder="请输入描述" />
          </Form.Item>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="status" label="状态" style={{ flex: 1 }} initialValue="待处理">
              <Select>
                <Option value="待处理">待处理</Option>
                <Option value="进行中">进行中</Option>
                <Option value="已完成">已完成</Option>
                <Option value="关闭">关闭</Option>
              </Select>
            </Form.Item>

            <Form.Item name="priority" label="紧急程度" style={{ flex: 1 }} initialValue="中">
              <Select>
                <Option value="紧急">紧急</Option>
                <Option value="高">高</Option>
                <Option value="中">中</Option>
                <Option value="低">低</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="source" label="需求来源" style={{ flex: 1 }}>
              <Select allowClear>
                <Option value="内部需求">内部需求</Option>
                <Option value="品牌需求">品牌需求</Option>
              </Select>
            </Form.Item>

            <Form.Item name="assigneeId" label="负责人" style={{ flex: 1 }}>
              <Select allowClear placeholder="请选择负责人">
                {admins.map((admin: any) => (
                  <Option key={admin.id} value={admin.id}>
                    {admin.username} ({admin.role === 'super_admin' ? '超级管理员' : '管理员'})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="expectedCompletionDate" label="期望完成日期" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            {isAdmin() && (
              <Form.Item name="estimatedHours" label="预估工时(小时)" style={{ flex: 1 }}>
                <Input type="number" min={0} step={0.5} />
              </Form.Item>
            )}
          </div>

          {isAdmin() && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item name="scheduledStartDate" label="排期开始日期" style={{ flex: 1 }}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="scheduledEndDate" label="排期结束日期" style={{ flex: 1 }}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default WorkItemList;
