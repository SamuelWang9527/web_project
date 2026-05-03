import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Upload,
  message,
  Modal,
  Spin
} from 'antd';
import {
  UploadOutlined,
  LockOutlined,
  LoadingOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../utils/api';

const { Option } = Select;

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>(user?.avatar || '');
  const [overlayHovered, setOverlayHovered] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        phone: (user as any).phone,
        brand: (user as any).brand
      });
      setImageUrl(user.avatar || '');
    }
  }, [user, profileForm]);

  // 更新个人资料
  const handleProfileUpdate = async (values: any) => {
    try {
      setLoading(true);
      await api.updateUser(user!.id, values);
      message.success('个人资料更新成功');
    } catch (error: any) {
      console.error('更新个人资料失败:', error);
      message.error('更新个人资料失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 自定义上传请求
  const customUploadRequest = async ({ file, onSuccess, onError }: any) => {
    try {
      const response = await api.uploadAvatar(file as File);
      const avatarUrl = (response.data as any)?.data?.avatarUrl;
      if (avatarUrl) {
        setImageUrl(avatarUrl);
      }
      onSuccess(response, file);
    } catch (error: any) {
      console.error('上传头像失败:', error);
      onError(error);
    }
  };

  // 处理头像变化
  const handleAvatarUpload = (info: any) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }

    if (info.file.status === 'done') {
      setLoading(false);
      message.success('头像上传成功');
    } else if (info.file.status === 'error') {
      setLoading(false);
      message.error('头像上传失败');
    }
  };

  // 打开修改密码模态框
  const showPasswordModal = () => {
    passwordForm.resetFields();
    setPasswordModalVisible(true);
  };

  // 关闭修改密码模态框
  const handlePasswordCancel = () => {
    setPasswordModalVisible(false);
  };

  // 提交修改密码
  const handlePasswordSubmit = async () => {
    try {
      const values = await passwordForm.validateFields();

      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiAny = api as any;
      await apiAny.updatePassword(user!.id, values);
      message.success('密码修改成功');

      setPasswordModalVisible(false);
    } catch (error: any) {
      console.error('修改密码失败:', error);
      message.error('修改密码失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片！');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB！');
    }
    return isJpgOrPng && isLt2M;
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Card title="个人资料" style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Avatar wrapper */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: '50%',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: overlayHovered ? 1 : 0,
                    transition: 'opacity 0.3s',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setOverlayHovered(true)}
                  onMouseLeave={() => setOverlayHovered(false)}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <UploadOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                  <span>更换头像</span>
                </div>
              </>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#fafafa',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '50%',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                {loading ? <LoadingOutlined /> : <PlusOutlined />}
                <div style={{ marginTop: 8 }}>上传头像</div>
              </div>
            )}
            <Upload
              id="avatar-upload"
              name="avatar"
              showUploadList={false}
              customRequest={customUploadRequest}
              beforeUpload={beforeUpload}
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            >
              <button style={{ display: 'none' }} type="button">上传</button>
            </Upload>
          </div>
        </div>

        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleProfileUpdate}
        >
          <Form.Item
            name="username"
            label="用户名"
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            name="brand"
            label="所属品牌"
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

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              保存修改
            </Button>
            <Button
              style={{ marginLeft: 16 }}
              onClick={showPasswordModal}
            >
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onOk={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={passwordForm}
          layout="vertical"
        >
          <Form.Item
            name="currentPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入当前密码"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入新密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请确认新密码"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
