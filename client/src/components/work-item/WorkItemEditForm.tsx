import React from 'react'
import { Modal, Form, Input, Select, DatePicker } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

const { Option } = Select

interface User {
  id: number
  username: string
  role: string
}

interface Project {
  id: number
  name: string
}

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workItem: any
  admins: User[]
  projects: Project[]
  submitting: boolean
  isAdmin: boolean
  form: ReturnType<typeof Form.useForm>[0]
  onSubmit: () => void
  onCancel: () => void
}

export const WorkItemEditForm: React.FC<Props> = ({
  open,
  admins,
  projects,
  submitting,
  isAdmin,
  form,
  onSubmit,
  onCancel,
}) => {
  return (
    <Modal
      title="编辑工作项"
      open={open}
      onOk={onSubmit}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
      confirmLoading={submitting}
      width={700}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="请输入标题" />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item name="projectId" label="所属项目" style={{ flex: 1 }}>
            <Select allowClear placeholder="请选择项目">
              {projects.map((project) => (
                <Option key={project.id} value={project.id}>{project.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
            style={{ flex: 1 }}
          >
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
              {admins.map((admin) => (
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

          {isAdmin && (
            <Form.Item name="estimatedHours" label="预估工时(小时)" style={{ flex: 1 }}>
              <Input type="number" min={0} step={0.5} />
            </Form.Item>
          )}
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="scheduledStartDate" label="排期开始日期" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="scheduledEndDate" label="排期结束日期" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
        )}

        {isAdmin && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="completionDate"
              label="完成日期"
              style={{ flex: 1 }}
              extra="可手动设置完成日期，否则在状态变为已完成时自动设置为当天"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <div style={{ flex: 1 }} />
          </div>
        )}

        {isAdmin && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="actualHours" label="实际工时(小时)" style={{ flex: 1 }}>
              <Input type="number" min={0} step={0.5} />
            </Form.Item>
            <div style={{ flex: 1 }} />
          </div>
        )}

        <div style={{ marginTop: 16, color: '#1890ff' }}>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          请使用"上传附件"按钮上传文件
        </div>
      </Form>
    </Modal>
  )
}
