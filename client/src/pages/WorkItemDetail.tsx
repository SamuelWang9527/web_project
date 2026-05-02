import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Spin,
  Avatar,
  List,
  Divider,
  Typography,
  Tabs,
  Timeline
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileImageOutlined,
  DownloadOutlined,
  SendOutlined,
  UserOutlined,
  EyeOutlined,
  PlusOutlined,
  CommentOutlined,
  ClockCircleOutlined,
  TagOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../utils/api';
import { WorkItemStatusTag, WorkItemPriorityTag, WorkItemTypeTag } from '@/components/common/StatusTag';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 文件图标渲染
const renderFileIcon = (mimetype: string) => {
  if (mimetype.startsWith('image/')) {
    return <FileImageOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
  } else if (mimetype.includes('pdf')) {
    return <FilePdfOutlined style={{ fontSize: 24, color: '#f5222d' }} />;
  } else if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) {
    return <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
  } else if (mimetype.includes('word') || mimetype.includes('document')) {
    return <FileWordOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
  } else {
    return <FileOutlined style={{ fontSize: 24, color: '#faad14' }} />;
  }
};

const WorkItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const isAdmin = () => hasRole('admin');

  const [workItem, setWorkItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [commentValue, setCommentValue] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [form] = Form.useForm();

  // 图片预览状态
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('details');

  // 获取工作项详情
  const fetchWorkItem = async () => {
    try {
      setLoading(true);
      const response = await api.getWorkItemById(Number(id));
      const data: any = (response.data as any)?.data || response.data;

      if (data) {
        if (!data.attachments) {
          data.attachments = [];
        } else if (typeof data.attachments === 'string') {
          try {
            const parsed = JSON.parse(data.attachments);
            data.attachments = Array.isArray(parsed) ? parsed : [];
          } catch {
            data.attachments = [];
          }
        } else if (!Array.isArray(data.attachments)) {
          data.attachments = [];
        }

        data.attachments = data.attachments.map((a: any) => a?.path ? a : null).filter(Boolean);
      }

      setWorkItem(data);
    } catch (error) {
      console.error('获取工作项详情失败:', error);
      message.error('获取工作项详情失败');
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
      const response = await api.getAdmins();
      const data = (response.data as any)?.data || [];
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取管理员列表失败:', error);
    }
  };

  // 获取工作项活动历史
  const fetchActivities = async () => {
    try {
      setLoadingActivities(true);
      const response = await api.getWorkItemActivities(Number(id));
      const data: any[] = (response.data as any)?.data || response.data || [];
      setActivities(data);
    } catch (error) {
      console.error('获取活动历史失败:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchWorkItem();
    fetchProjects();
    fetchAdmins();
    if (id) {
      fetchActivities();
    }
  }, [id]);

  // 打开编辑工作项模态框
  const showEditModal = () => {
    try {
      form.resetFields();

      if (!workItem) return;

      const formValues: any = {
        ...workItem,
        projectId: workItem.projectId,
        assigneeId: workItem.assigneeId,
        expectedCompletionDate: workItem.expectedCompletionDate ? dayjs(workItem.expectedCompletionDate) : null,
        scheduledStartDate: workItem.scheduledStartDate ? dayjs(workItem.scheduledStartDate) : null,
        scheduledEndDate: workItem.scheduledEndDate ? dayjs(workItem.scheduledEndDate) : null,
        completionDate: workItem.completionDate ? dayjs(workItem.completionDate) : null,
      };

      form.setFieldsValue(formValues);
      setEditModalVisible(true);
    } catch (error: any) {
      message.error('打开编辑模态框失败: ' + (error.message || '未知错误'));
    }
  };

  // 关闭编辑模态框
  const handleEditCancel = () => {
    setEditModalVisible(false);
  };

  // 提交编辑表单
  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (values.expectedCompletionDate) values.expectedCompletionDate = values.expectedCompletionDate.format('YYYY-MM-DD');
      if (values.scheduledStartDate) values.scheduledStartDate = values.scheduledStartDate.format('YYYY-MM-DD');
      if (values.scheduledEndDate) values.scheduledEndDate = values.scheduledEndDate.format('YYYY-MM-DD');
      if (values.completionDate) values.completionDate = values.completionDate.format('YYYY-MM-DD');

      const formData = new FormData();

      Object.keys(values).forEach(key => {
        if (key !== 'attachments' && values[key] !== undefined && values[key] !== null) {
          let isChanged = false;
          if (key.includes('Date') && workItem[key]) {
            const formattedOldValue = new Date(workItem[key]).toISOString().split('T')[0];
            isChanged = values[key] !== formattedOldValue;
          } else {
            isChanged = String(values[key]) !== String(workItem[key]);
          }

          if (isChanged) {
            formData.append(key, values[key]);
          }
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await api.updateWorkItem(Number(id), formData as any);

      message.success('工作项更新成功');
      setEditModalVisible(false);

      setTimeout(() => {
        fetchWorkItem();
        fetchActivities();
      }, 1000);
    } catch (error: any) {
      console.error('更新工作项失败:', error);
      message.error('更新工作项失败: ' + (error.message || '未知错误'));
    }
  };

  // 删除工作项
  const handleDelete = async () => {
    try {
      await api.deleteWorkItem(Number(id));
      message.success('工作项删除成功');
      navigate('/projects');
    } catch (error: any) {
      console.error('删除工作项失败:', error);
      message.error('删除工作项失败: ' + error.message);
    }
  };

  // 提交评论
  const handleCommentSubmit = async () => {
    if (!commentValue.trim()) return;

    setSubmittingComment(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiAny = api as any;
      await apiAny.addWorkItemComment(id, { content: commentValue });
      message.success('评论添加成功');
      setCommentValue('');
      fetchWorkItem();
      fetchActivities();
    } catch (error: any) {
      console.error('添加评论失败:', error);
      message.error('添加评论失败: ' + error.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  // 删除附件
  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiAny = api as any;
      await apiAny.deleteWorkItemAttachment(id, attachmentId);
      message.success('附件删除成功');
      fetchWorkItem();
      fetchActivities();
    } catch (error: any) {
      console.error('删除附件失败:', error);
      message.error('删除附件失败: ' + error.message);
    }
  };

  // 检查用户是否有编辑权限
  const hasEditPermission = () => {
    if (!workItem || !user) return false;
    return isAdmin() || workItem.createdById === user.id;
  };

  // 处理图片预览
  const handlePreview = (attachment: any) => {
    const imageUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${attachment.path}`;
    setPreviewImage(imageUrl);
    setPreviewTitle(attachment.originalName);
    setPreviewVisible(true);
  };

  // 关闭图片预览
  const handlePreviewCancel = () => {
    setPreviewVisible(false);
  };

  // 渲染活动图标
  const renderActivityIcon = (type: string) => {
    switch (type) {
      case 'create': return <PlusOutlined style={{ color: '#52c41a' }} />;
      case 'update': return <EditOutlined style={{ color: '#1890ff' }} />;
      case 'status_change': return <TagOutlined style={{ color: '#722ed1' }} />;
      case 'assignee_change': return <UserOutlined style={{ color: '#fa8c16' }} />;
      case 'comment': return <CommentOutlined style={{ color: '#13c2c2' }} />;
      case 'attachment_add': return <FileOutlined style={{ color: '#1890ff' }} />;
      case 'attachment_delete': return <DeleteOutlined style={{ color: '#ff4d4f' }} />;
      default: return <ClockCircleOutlined />;
    }
  };

  // 字段名称翻译
  const translateFieldName = (fieldName: string): string => {
    const fieldMap: Record<string, string> = {
      'title': '标题', 'description': '描述', 'type': '类型', 'status': '状态',
      'priority': '紧急程度', 'source': '需求来源', 'estimatedHours': '预估工时',
      'actualHours': '实际工时', 'scheduledStartDate': '排期开始日期',
      'scheduledEndDate': '排期结束日期', 'expectedCompletionDate': '期望完成日期',
      'completionDate': '实际完成日期', 'projectId': '所属项目', 'assigneeId': '负责人'
    };
    return fieldMap[fieldName] || fieldName;
  };

  // 格式化活动描述
  const formatActivityDescription = (activity: any): string => {
    if (!activity.field) return activity.description;

    const fieldDisplayName = translateFieldName(activity.field);

    switch (activity.type) {
      case 'create': return '创建了工作项';
      case 'update':
        if (activity.field.includes('Date')) {
          const oldValue = activity.oldValue ? new Date(activity.oldValue).toLocaleDateString() : '空';
          const newValue = activity.newValue ? new Date(activity.newValue).toLocaleDateString() : '空';
          return `修改了 ${fieldDisplayName} 字段，从 "${oldValue}" 修改为 "${newValue}"`;
        }
        return `修改了 ${fieldDisplayName} 字段，从 "${activity.oldValue || '空'}" 修改为 "${activity.newValue}"`;
      case 'status_change': return `将状态从 "${activity.oldValue}" 修改为 "${activity.newValue}"`;
      case 'assignee_change': return activity.description.replace(activity.field, fieldDisplayName);
      case 'comment': return `添加了评论: "${activity.newValue}"`;
      case 'attachment_add': return `添加了附件: "${activity.newValue}"`;
      case 'attachment_delete': return `删除了附件: "${activity.oldValue}"`;
      default: return activity.description.replace(activity.field, fieldDisplayName);
    }
  };

  // 处理附件下载
  const handleDownloadAttachment = (attachment: any) => {
    try {
      api.downloadFile(attachment.path);
    } catch (error: any) {
      console.error('下载附件失败:', error);
      message.error('下载附件失败: ' + error.message);
    }
  };

  // 处理文件上传
  const handleUploadAttachment = async () => {
    try {
      setActiveTabKey('attachments');
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt';

      fileInput.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const file = target.files[0];
          const loadingMessage = message.loading('正在上传文件...', 0);

          try {
            const result = await api.uploadAttachment(Number(id), file);
            loadingMessage();
            message.success(`文件 ${file.name} 上传成功并添加到工作项`);
            fetchWorkItem();
            fetchActivities();
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!workItem) {
    return (
      <div>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/projects?tab=workItems')}
        >
          返回工作项列表
        </Button>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            工作项不存在或已被删除
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="work-item-detail">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/projects?tab=workItems')}
        >
          返回工作项列表
        </Button>

        <Space>
          {hasEditPermission() && (
            <>
              <Button icon={<EditOutlined />} onClick={showEditModal}>编辑工作项</Button>
              <Popconfirm
                title="确定要删除此工作项吗？"
                onConfirm={handleDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button icon={<DeleteOutlined />} danger>删除工作项</Button>
              </Popconfirm>
            </>
          )}
          {hasEditPermission() && (
            <Button icon={<UploadOutlined />} onClick={handleUploadAttachment}>上传附件</Button>
          )}
        </Space>
      </div>

      {/* 工作项详情 */}
      <Card className="work-item-detail-header">
        <div className="work-item-detail-title">
          <Title level={3}>{workItem.title}</Title>
        </div>

        <div className="work-item-detail-meta">
          <div className="work-item-detail-meta-item">
            <span className="work-item-detail-meta-label">类型:</span>
            <WorkItemTypeTag type={workItem.type} />
          </div>
          <div className="work-item-detail-meta-item">
            <span className="work-item-detail-meta-label">状态:</span>
            <WorkItemStatusTag status={workItem.status} />
          </div>
          <div className="work-item-detail-meta-item">
            <span className="work-item-detail-meta-label">紧急程度:</span>
            <WorkItemPriorityTag priority={workItem.priority} />
          </div>
          <div className="work-item-detail-meta-item">
            <span className="work-item-detail-meta-label">需求来源:</span>
            {workItem.source || '-'}
          </div>
          <div className="work-item-detail-meta-item">
            <span className="work-item-detail-meta-label">创建者:</span>
            {workItem.creator ? workItem.creator.username : '-'}
          </div>
          <div className="work-item-detail-meta-item">
            <span className="work-item-detail-meta-label">负责人:</span>
            {workItem.assignee ? workItem.assignee.username : '未分配'}
          </div>
          <div className="work-item-detail-meta-item">
            <span className="work-item-detail-meta-label">创建时间:</span>
            {new Date(workItem.createdAt).toLocaleString()}
          </div>
          {workItem.Project && (
            <div className="work-item-detail-meta-item">
              <span className="work-item-detail-meta-label">所属项目:</span>
              <Link to={`/projects/${workItem.Project.id}`}>{workItem.Project.name}</Link>
            </div>
          )}
        </div>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Tabs activeKey={activeTabKey} onChange={setActiveTabKey}>
          <TabPane tab="详情" key="details">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="预估工时" span={1}>
                {workItem.estimatedHours ? `${workItem.estimatedHours}小时` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="实际工时" span={1}>
                {workItem.actualHours ? `${workItem.actualHours}小时` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="排期开始日期" span={1}>
                {workItem.scheduledStartDate ? new Date(workItem.scheduledStartDate).toLocaleDateString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="排期结束日期" span={1}>
                {workItem.scheduledEndDate ? new Date(workItem.scheduledEndDate).toLocaleDateString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="期望完成日期" span={1}>
                {workItem.expectedCompletionDate ? new Date(workItem.expectedCompletionDate).toLocaleDateString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="实际完成日期" span={1}>
                {workItem.completionDate ? new Date(workItem.completionDate).toLocaleDateString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {workItem.description || '无描述'}
                </div>
              </Descriptions.Item>
            </Descriptions>
          </TabPane>

          <TabPane tab="活动" key="activities">
            {loadingActivities ? (
              <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>
            ) : (
              <Timeline>
                {activities.map((activity: any) => (
                  <Timeline.Item key={activity.id} dot={renderActivityIcon(activity.type)}>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ marginRight: 8 }}>
                        <strong>{activity.User?.username}</strong>
                      </span>
                      <span style={{ color: '#8c8c8c' }}>
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div>{formatActivityDescription(activity)}</div>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </TabPane>

          <TabPane tab="附件" key="attachments">
            {(() => {
              try {
                let attachments: any[] = [];

                if (workItem.attachments) {
                  if (typeof workItem.attachments === 'string') {
                    try {
                      const parsed = JSON.parse(workItem.attachments);
                      if (Array.isArray(parsed)) attachments = parsed;
                    } catch {}
                  } else if (Array.isArray(workItem.attachments)) {
                    attachments = workItem.attachments;
                  }
                }

                if (attachments.length > 0) {
                  return (
                    <div className="file-upload-list">
                      {attachments.map((attachment: any, index: number) => {
                        if (!attachment || !attachment.mimetype) return null;

                        return (
                          <div key={index} className="file-list-item" style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            borderBottom: '1px solid #f0f0f0',
                            borderRadius: '4px',
                            marginBottom: '8px',
                            backgroundColor: '#fafafa'
                          }}>
                            <div className="file-icon" style={{ marginRight: '12px' }}>
                              {attachment.mimetype.startsWith('image/') ? (
                                <div
                                  style={{
                                    width: '60px',
                                    height: '60px',
                                    overflow: 'hidden',
                                    borderRadius: '4px',
                                    border: '1px solid #d9d9d9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handlePreview(attachment)}
                                >
                                  <img
                                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${attachment.path}`}
                                    alt={attachment.originalName}
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                                  />
                                </div>
                              ) : (
                                renderFileIcon(attachment.mimetype)
                              )}
                            </div>
                            <div className="file-info" style={{ flex: 1 }}>
                              <div className="file-name" style={{ fontWeight: 'bold' }}>{attachment.originalName}</div>
                              <div className="file-size" style={{ color: '#888', fontSize: '12px' }}>
                                {(attachment.size / 1024).toFixed(2)} KB
                              </div>
                            </div>
                            <div className="file-actions">
                              {attachment.mimetype.startsWith('image/') && (
                                <Button type="link" icon={<EyeOutlined />} onClick={() => handlePreview(attachment)}>预览</Button>
                              )}
                              <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownloadAttachment(attachment)}>下载</Button>
                              {hasEditPermission() && (
                                <Popconfirm
                                  title="确定要删除此附件吗？"
                                  onConfirm={() => handleDeleteAttachment(attachment.filename)}
                                  okText="确定"
                                  cancelText="取消"
                                >
                                  <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
                                </Popconfirm>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                } else {
                  return (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                      暂无附件
                    </div>
                  );
                }
              } catch (error: any) {
                return (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#f5222d' }}>
                    加载附件失败: {error.message || '未知错误'}
                  </div>
                );
              }
            })()}
          </TabPane>
        </Tabs>
      </Card>

      {/* 评论 */}
      <Card title="评论" style={{ marginTop: 16 }} className="work-item-detail-comments">
        {workItem.comments && workItem.comments.length > 0 ? (
          <List
            dataSource={workItem.comments}
            itemLayout="horizontal"
            renderItem={(comment: any) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />}>{comment.username.charAt(0).toUpperCase()}</Avatar>}
                  title={<div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <a>{comment.username}</a>
                    <Text type="secondary">{new Date(comment.createdAt).toLocaleString()}</Text>
                  </div>}
                  description={<Paragraph className="comment-text">{comment.content}</Paragraph>}
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
            暂无评论
          </div>
        )}

        <Divider />

        <div style={{ display: 'flex', marginTop: 16 }}>
          <TextArea
            rows={4}
            value={commentValue}
            onChange={e => setCommentValue(e.target.value)}
            placeholder="添加评论..."
            style={{ marginRight: 16, flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={submittingComment}
            onClick={handleCommentSubmit}
            disabled={!commentValue.trim()}
          >
            发送
          </Button>
        </div>
      </Card>

      {/* 编辑工作项模态框 */}
      <Modal
        title="编辑工作项"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={handleEditCancel}
        okText="保存"
        cancelText="取消"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="projectId" label="所属项目" style={{ flex: 1 }}>
              <Select allowClear placeholder="请选择项目">
                {projects.map((project: any) => (
                  <Option key={project.id} value={project.id}>{project.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]} style={{ flex: 1 }}>
              <Select>
                <Option value="规划">规划</Option>
                <Option value="需求">需求</Option>
                <Option value="事务">事务</Option>
                <Option value="缺陷">缺陷</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="description" label="描述" style={{ marginBottom: '20px' }}>
            <Input.TextArea rows={6} placeholder="请输入描述" />
          </Form.Item>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Select>
                <Option value="待处理">待处理</Option>
                <Option value="进行中">进行中</Option>
                <Option value="已完成">已完成</Option>
                <Option value="关闭">关闭</Option>
              </Select>
            </Form.Item>

            <Form.Item name="priority" label="紧急程度" style={{ flex: 1 }}>
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

          {isAdmin() && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item name="completionDate" label="完成日期" style={{ flex: 1 }}
                extra="可手动设置完成日期，否则在状态变为已完成时自动设置为当天">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <div style={{ flex: 1 }}></div>
            </div>
          )}

          {isAdmin() && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item name="actualHours" label="实际工时(小时)" style={{ flex: 1 }}>
                <Input type="number" min={0} step={0.5} />
              </Form.Item>
              <div style={{ flex: 1 }}></div>
            </div>
          )}

          <div style={{ marginTop: 16, color: '#1890ff' }}>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            请使用"上传附件"按钮上传文件
          </div>
        </Form>
      </Modal>

      {/* 图片预览模态框 */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={handlePreviewCancel}
        width={800}
        style={{ top: 20 }}
        bodyStyle={{ padding: '24px', textAlign: 'center' }}
      >
        <img
          alt={previewTitle}
          style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', objectFit: 'contain' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

export default WorkItemDetail;
