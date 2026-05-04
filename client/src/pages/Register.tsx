import { useState, useEffect } from 'react'
import { Form, Input, Button, Typography, Select, message, Alert } from 'antd'
import { UserOutlined, LockOutlined, PhoneOutlined, BankOutlined, MailOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import * as api from '@/utils/api'

const { Title, Text } = Typography
const { Option } = Select

export default function Register() {
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  // 如果用户已登录，重定向到首页
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  // 处理注册表单提交
  const handleSubmit = async (values: Record<string, any>) => {
    setLoading(true)
    try {
      await api.register(values as any)
      setRegistered(true)
      message.success('注册成功，请等待管理员审核')
    } catch (error: any) {
      console.error('注册失败:', error)
      if (error.response && error.response.data) {
        message.error('注册失败: ' + (error.response.data.message || '请检查您的输入'))
      } else {
        message.error('注册失败: ' + (error.message || '请稍后再试'))
      }
    } finally {
      setLoading(false)
    }
  }

  // 注册成功后显示等待审核页面
  if (registered) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Left panel — brand */}
        <div
          data-login-left=""
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            padding: 48,
          }}
        >
          <Title level={2} style={{ color: '#fff', margin: 0 }}>PipeCode</Title>
          <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 16, textAlign: 'center' }}>
            高效的项目与工作项管理平台
          </Text>
        </div>

        {/* Right panel — success message */}
        <div
          data-login-right=""
          style={{
            width: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            padding: 48,
          }}
        >
          <div style={{ width: '100%', maxWidth: 360 }}>
            <Title level={3} style={{ marginBottom: 24 }}>注册成功</Title>
            <Alert
              message="账户正在审核中"
              description={
                <div>
                  <p>您的账户已成功注册，但需要管理员审核通过后才能使用。</p>
                  <p>请耐心等待，审核通过后我们会通知您。</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />
            <Button type="primary" onClick={() => navigate('/login')} block>
              返回登录
            </Button>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            [data-login-left] { display: none !important; }
            [data-login-right] { width: 100% !important; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left panel — brand */}
      <div
        data-login-left=""
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          padding: 48,
        }}
      >
        <Title level={2} style={{ color: '#fff', margin: 0 }}>PipeCode</Title>
        <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 16, textAlign: 'center' }}>
          高效的项目与工作项管理平台
        </Text>
      </div>

      {/* Right panel — form */}
      <div
        data-login-right=""
        style={{
          width: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          padding: 48,
        }}
      >
        <div style={{ width: '100%', maxWidth: 360 }}>
          <Title level={3} style={{ marginBottom: 24 }}>注册</Title>

          <Alert
            message="用户须知"
            description="用户名请填写真实姓名，邮箱填写公司邮箱"
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />

          <Form
            name="register_form"
            initialValues={{ brand: 'EL' }}
            onFinish={handleSubmit}
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
              tooltip="请填写您的真实姓名"
            >
              <Input prefix={<UserOutlined />} placeholder="用户名（真实姓名）" />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="手机号" />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: false, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
              tooltip="请填写您的公司邮箱"
            >
              <Input prefix={<MailOutlined />} placeholder="公司邮箱" />
            </Form.Item>

            <Form.Item
              name="brand"
              rules={[{ required: true, message: '请选择所属品牌' }]}
            >
              <Select placeholder="请选择所属品牌">
                <Option value="EL">EL</Option>
                <Option value="CL">CL</Option>
                <Option value="MAC">MAC</Option>
                <Option value="DA">DA</Option>
                <Option value="LAB">LAB</Option>
                <Option value="OR">OR</Option>
                <Option value="Dr.jart+">Dr.jart+</Option>
                <Option value="IT">IT</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                注册
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">已有账户？</Text>{' '}
              <Link to="/login">立即登录</Link>
            </div>
          </Form>
        </div>
      </div>

      {/* Mobile fallback: hide left panel below 768px */}
      <style>{`
        @media (max-width: 768px) {
          [data-login-left] { display: none !important; }
          [data-login-right] { width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
