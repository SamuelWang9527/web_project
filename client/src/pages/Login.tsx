import { useState } from 'react'
import { Form, Input, Button, message, Typography } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      await login(values.email, values.password)
      message.success('登录成功')
      navigate('/')
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.status === 401) {
        message.error('邮箱或密码错误')
      } else if (error?.message?.includes('pending')) {
        message.error('您的账户正在审核中，请稍后再试')
      } else if (error?.message?.includes('disabled')) {
        message.error('您的账户已被禁用，请联系管理员')
      } else {
        message.error('登录失败，请稍后再试')
      }
    } finally {
      setLoading(false)
    }
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
          <Title level={3} style={{ marginBottom: 32 }}>登录</Title>
          <Form layout="vertical" onFinish={handleSubmit} size="large">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="邮箱" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登录
              </Button>
            </Form.Item>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">还没有账户？</Text>{' '}
              <Link to="/register">立即注册</Link>
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
