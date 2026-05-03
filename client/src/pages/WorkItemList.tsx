import React, { useState, useEffect } from 'react'
import { Card, Modal, Form, Input, Select, DatePicker, message } from 'antd'
import dayjs from 'dayjs'
import { useAuth } from '../contexts/AuthContext'
import * as api from '../utils/api'
import { WorkItemFilters, WorkItemFilterState, defaultFilters } from '@/components/work-item/WorkItemFilters'
import { WorkItemTable } from '@/components/work-item/WorkItemTable'

const { Option } = Select

const WorkItemList: React.FC = () => {
  const [workItems, setWorkItems] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingWorkItem, setEditingWorkItem] = useState<any | null>(null)
  const [filters, setFilters] = useState<WorkItemFilterState>(defaultFilters)
  const [form] = Form.useForm()
  const { hasRole } = useAuth()

  const isAdmin = () => hasRole('admin')

  const fetchWorkItems = async () => {
    try {
      setLoading(true)
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
      )
      const response = await api.getWorkItems(params)
      const data = (response.data as any)?.data || response.data
      setWorkItems(Array.isArray(data) ? data : [])
    } catch {
      message.error('获取工作项列表失败')
      setWorkItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api.getProjects().then(r => {
      const data = (r.data as any)?.data || r.data
      setProjects(Array.isArray(data) ? data : [])
    }).catch(() => {})

    api.getAdmins().then(r => {
      const data = (r.data as any)?.data || []
      setAdmins(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])

  useEffect(() => { fetchWorkItems() }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (name: string, value: unknown) => {
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleReset = () => setFilters(defaultFilters)

  const showModal = (workItem: any = null) => {
    setEditingWorkItem(workItem)
    form.resetFields()
    if (workItem) {
      form.setFieldsValue({
        ...workItem,
        expectedCompletionDate: workItem.expectedCompletionDate ? dayjs(workItem.expectedCompletionDate) : null,
        scheduledStartDate: workItem.scheduledStartDate ? dayjs(workItem.scheduledStartDate) : null,
        scheduledEndDate: workItem.scheduledEndDate ? dayjs(workItem.scheduledEndDate) : null,
        completionDate: workItem.completionDate ? dayjs(workItem.completionDate) : null,
      })
    }
    setModalVisible(true)
  }

  const handleCancel = () => {
    setModalVisible(false)
    setEditingWorkItem(null)
    form.resetFields()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const dateFields = ['expectedCompletionDate', 'scheduledStartDate', 'scheduledEndDate', 'completionDate']
      dateFields.forEach(f => { if (values[f]) values[f] = values[f].format('YYYY-MM-DD') })

      if (values.status === '已完成' && !values.completionDate) {
        if (!editingWorkItem || editingWorkItem.status !== '已完成') {
          values.completionDate = new Date().toISOString().split('T')[0]
        }
      }

      if (editingWorkItem) {
        const result = await api.updateWorkItem(editingWorkItem.id, values)
        const updated = (result.data as any)?.data?.workItem || (result.data as any)?.workItem
        if (updated) {
          setWorkItems(prev => prev.map(item => item.id === editingWorkItem.id ? updated : item))
        } else {
          fetchWorkItems()
        }
        message.success('工作项更新成功')
      } else {
        const result = await api.createWorkItem(values)
        const created = (result.data as any)?.data?.workItem || (result.data as any)?.workItem
        if (created) setWorkItems(prev => [created, ...prev])
        else fetchWorkItems()
        message.success('工作项创建成功')
      }
      setModalVisible(false)
    } catch (error: any) {
      message.error('保存工作项失败: ' + (error.message ?? ''))
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.deleteWorkItem(id)
      message.success('工作项删除成功')
      fetchWorkItems()
    } catch (error: any) {
      message.error('删除工作项失败: ' + (error.message ?? ''))
    }
  }

  const handleUpload = async (workItemId: number) => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt'
    fileInput.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement
      if (!target.files?.length) return
      const file = target.files[0]
      const hide = message.loading('正在上传文件...', 0)
      try {
        await api.uploadAttachment(workItemId, file)
        hide()
        message.success(`文件 ${file.name} 上传成功`)
        fetchWorkItems()
      } catch (error: any) {
        hide()
        message.error('上传失败: ' + (error.message ?? '未知错误'))
      }
    }
    fileInput.click()
  }

  const handleExport = async () => {
    if (workItems.length === 0) {
      message.warning('没有工作项可导出，请先查询工作项')
      return
    }
    try {
      message.loading({ content: '正在导出工作项...', key: 'exportLoading' })
      const response = await (api as any).exportWorkItems(filters)
      if (response?.success && response?.downloadUrl) {
        api.downloadFile(response.downloadUrl)
        message.success({ content: response.message || '已成功导出工作项', key: 'exportLoading' })
      } else {
        throw new Error('导出失败，未获取到下载链接')
      }
    } catch (error: any) {
      message.error({ content: '导出工作项失败: ' + (error.message ?? ''), key: 'exportLoading', duration: 10 })
    }
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <WorkItemFilters
          filters={filters}
          projects={projects}
          admins={admins}
          onChange={handleFilterChange}
          onReset={handleReset}
          onCreateClick={() => showModal()}
          onExportClick={handleExport}
        />
      </Card>

      <Card>
        <WorkItemTable
          workItems={workItems}
          loading={loading}
          onEdit={showModal}
          onDelete={handleDelete}
          onUpload={handleUpload}
        />
      </Card>

      <Modal
        title={editingWorkItem ? '编辑工作项' : '创建工作项'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="保存"
        cancelText="取消"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="projectId" label="所属项目" style={{ flex: 1 }}>
              <Select allowClear placeholder="请选择项目">
                {projects.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]} style={{ flex: 1 }} initialValue="事务">
              <Select>
                <Option value="规划">规划</Option>
                <Option value="需求">需求</Option>
                <Option value="事务">事务</Option>
                <Option value="缺陷">缺陷</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="description" label="描述" style={{ marginBottom: 20 }}>
            <Input.TextArea rows={6} placeholder="请输入描述" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
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

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="source" label="需求来源" style={{ flex: 1 }}>
              <Select allowClear>
                <Option value="内部需求">内部需求</Option>
                <Option value="品牌需求">品牌需求</Option>
              </Select>
            </Form.Item>
            <Form.Item name="assigneeId" label="负责人" style={{ flex: 1 }}>
              <Select allowClear placeholder="请选择负责人">
                {admins.map(a => (
                  <Option key={a.id} value={a.id}>
                    {a.username} ({a.role === 'super_admin' ? '超级管理员' : '管理员'})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
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
            <div style={{ display: 'flex', gap: 16 }}>
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
  )
}

export default WorkItemList
