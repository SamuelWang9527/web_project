import React, { useState } from 'react';
import { Layout, Dropdown, Avatar, Modal, Button, Form, Input, Select, message } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../utils/api';

const { Header, Content, Footer } = Layout;
const { Option } = Select;

interface NavItemProps {
  to: string
  active: boolean
  children: React.ReactNode
}

const NavItem: React.FC<NavItemProps> = ({ to, active, children }) => {
  const [hovered, setHovered] = React.useState(false)
  return (
    <Link
      to={to}
      style={{
        height: '100%',
        padding: '0 18px',
        display: 'flex',
        alignItems: 'center',
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        color: (active || hovered) ? '#6366f1' : '#6b7280',
        position: 'relative',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        transition: 'color .15s',
        borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
        boxSizing: 'border-box',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </Link>
  )
}

const MainLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [ticketForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);

  // 获取管理员列表
  const fetchAdmins = async () => {
    try {
      const response = await api.getAdmins();
      const data = (response.data as any)?.data || [];
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取管理员列表失败:', error);
      message.error('获取管理员列表失败');
    }
  };

  // 处理登出
  const handleLogout = async () => {
    await logout();
    navigate('/login');
    message.success('已成功登出');
  };

  // 打开工单提交弹窗
  const showTicketModal = () => {
    setTicketModalVisible(true);
    fetchAdmins();
  };

  // 关闭工单提交弹窗
  const handleTicketCancel = () => {
    setTicketModalVisible(false);
    ticketForm.resetFields();
  };

  // 提交工单
  const handleTicketSubmit = async () => {
    try {
      const values = await ticketForm.validateFields();
      setSubmitting(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiAny = api as any;
      const response = await apiAny.createTicket(values);

      message.success('工单提交成功，工单编号: ' + response.ticket.ticketNumber);
      setTicketModalVisible(false);
      ticketForm.resetFields();
    } catch (error: any) {
      console.error('提交工单失败:', error);
      message.error('提交工单失败: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = () => hasRole('admin');

  const navItems = [
    { key: 'dashboard', to: '/', label: '概览' },
    { key: 'projects', to: '/projects', label: '项目管理' },
    ...(!isAdmin() ? [{ key: 'tickets', to: '/tickets', label: '我的工单' }] : []),
    ...(isAdmin() ? [{ key: 'admin-tickets', to: '/admin/tickets', label: '工单管理' }] : []),
    ...(isAdmin() ? [{ key: 'admin-users', to: '/admin/users', label: '用户管理' }] : []),
  ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">个人资料</Link>,
    },
    {
      key: 'ticket',
      icon: <QuestionCircleOutlined />,
      label: '提交工单',
      onClick: showTicketModal,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  // 获取当前选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/projects') || path.startsWith('/work-items')) return 'projects';

    // 对于管理员用户，所有工单相关路径都高亮"工单管理"菜单
    if ((user?.role === 'admin' || user?.role === 'super_admin') &&
        (path.startsWith('/tickets') || path.startsWith('/admin/tickets'))) {
      return 'admin-tickets';
    }

    // 对于用户管理页面
    if (path.startsWith('/admin/users')) return 'admin-users';

    // 对于普通用户，工单路径高亮"我的工单"菜单
    if (path.startsWith('/tickets')) return 'tickets';
    if (path.startsWith('/admin/tickets')) return 'admin-tickets';

    return 'dashboard';
  };

  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Header style={{
        background: '#fff',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #ede9fe',
        boxShadow: '0 1px 4px rgba(99,102,241,0.06)',
        height: 60,
        lineHeight: '60px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 17, fontWeight: 700, color: '#1e1b4b',
          marginRight: 36, flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 16, fontWeight: 800,
          }}>P</div>
          项目管理平台
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', flex: 1, height: '100%' }}>
          {navItems.map(item => (
            <NavItem key={item.key} to={item.to} active={getSelectedKey() === item.key}>
              {item.label}
            </NavItem>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: '#faf5ff', border: '1px solid #ede9fe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <BellOutlined style={{ color: '#6366f1', fontSize: 15 }} />
          </div>
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 12px 4px 4px', borderRadius: 100,
              border: '1px solid #ede9fe', background: '#faf5ff', cursor: 'pointer',
            }}>
              <Avatar
                size={28}
                style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', flexShrink: 0, fontSize: 12, fontWeight: 700 }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1e1b4b' }}>{user?.username}</span>
              <DownOutlined style={{ fontSize: 10, color: '#9ca3af' }} />
            </div>
          </Dropdown>
        </div>
      </Header>
      <Content style={{ padding: '24px', background: '#f3f0ff' }}>
        <Outlet />
      </Content>
      <Footer style={{
        textAlign: 'center',
        background: '#fff',
        borderTop: '1px solid #ede9fe',
        padding: '10px 24px',
        fontSize: 12,
        color: '#9ca3af',
      }}>
        项目管理平台 ©2024 Created by Samuel |{' '}
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>
          皖ICP备2025079298号
        </a>
      </Footer>

      {/* 提交工单弹窗 */}
      <Modal
        title="提交工单"
        open={ticketModalVisible}
        onCancel={handleTicketCancel}
        footer={[
          <Button key="cancel" onClick={handleTicketCancel}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleTicketSubmit}
          >
            提交
          </Button>
        ]}
      >
        <Form
          form={ticketForm}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入工单标题' }]}
          >
            <Input placeholder="请输入工单标题" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入工单描述' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细描述您的问题或需求" />
          </Form.Item>
          <Form.Item
            name="priority"
            label="紧急程度"
            initialValue="中"
          >
            <Select>
              <Option value="紧急">紧急</Option>
              <Option value="高">高</Option>
              <Option value="中">中</Option>
              <Option value="低">低</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="assigneeId"
            label="负责人"
          >
            <Select placeholder="请选择负责人（可选）">
              {admins.map((admin: any) => (
                <Option key={admin.id} value={admin.id}>
                  {admin.username} ({admin.role === 'super_admin' ? '超级管理员' : '管理员'})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default MainLayout;
