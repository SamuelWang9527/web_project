import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiSuccess } from '@/types/api'
import type { User, Project, WorkItem, Ticket } from '@/types/models'

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器：注入 auth token
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一 401 处理
instance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)

// ——— Auth ———
export const login = (data: { email: string; password: string }) =>
  instance.post<ApiSuccess<{ token: string; user: User }>>('/auth/login', data)

export const register = (data: { username: string; email: string; password: string }) =>
  instance.post<ApiSuccess<User>>('/auth/register', data)

export const getCurrentUser = () =>
  instance.get<ApiSuccess<User>>('/auth/me')

export const logout = () =>
  instance.post('/auth/logout')

// ——— Projects ———
export const getProjects = (params?: Record<string, unknown>) =>
  instance.get<ApiSuccess<Project[]>>('/projects', { params })

export const getProjectById = (id: number) =>
  instance.get<ApiSuccess<Project>>(`/projects/${id}`)

export const createProject = (data: Partial<Project>) =>
  instance.post<ApiSuccess<Project>>('/projects', data)

export const updateProject = (id: number, data: Partial<Project>) =>
  instance.put<ApiSuccess<Project>>(`/projects/${id}`, data)

export const deleteProject = (id: number) =>
  instance.delete(`/projects/${id}`)

// ——— Work Items ———
export const getWorkItems = (params?: Record<string, unknown>) =>
  instance.get<ApiSuccess<WorkItem[]>>('/work-items', { params })

export const getWorkItemById = (id: number) =>
  instance.get<ApiSuccess<WorkItem>>(`/work-items/${id}`)

export const createWorkItem = (data: Partial<WorkItem>) =>
  instance.post<ApiSuccess<WorkItem>>('/work-items', data)

export const updateWorkItem = (id: number, data: Partial<WorkItem>) =>
  instance.put<ApiSuccess<WorkItem>>(`/work-items/${id}`, data)

export const deleteWorkItem = (id: number) =>
  instance.delete(`/work-items/${id}`)

export const uploadAttachment = (workItemId: number, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return instance.post(`/work-items/${workItemId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const downloadFile = (fileUrl: string) => {
  const token = localStorage.getItem('token')
  const url = fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl}`
  const link = document.createElement('a')
  link.href = token ? `${url}?token=${token}` : url
  link.download = ''
  link.click()
}

export const exportWorkItems = (params?: Record<string, unknown>) =>
  instance.get('/work-items/export', { params, responseType: 'blob' })

// ——— Tickets ———
export const getTickets = (params?: Record<string, unknown>) =>
  instance.get<ApiSuccess<Ticket[]>>('/tickets', { params })

export const getTicketById = (id: number) =>
  instance.get<ApiSuccess<Ticket>>(`/tickets/${id}`)

export const createTicket = (data: Partial<Ticket>) =>
  instance.post<ApiSuccess<Ticket>>('/tickets', data)

export const updateTicket = (id: number, data: Partial<Ticket>) =>
  instance.put<ApiSuccess<Ticket>>(`/tickets/${id}`, data)

// ——— Dashboard ———
export const getDashboardStats = (params?: Record<string, unknown>) =>
  instance.get<ApiSuccess<Record<string, unknown>>>('/dashboard/stats', { params })

export const getPendingItems = (params?: Record<string, unknown>) =>
  instance.get<ApiSuccess<WorkItem[]>>('/dashboard/pending-items', { params })

// ——— Users ———
export const getUsers = (params?: Record<string, unknown>) =>
  instance.get<ApiSuccess<User[]>>('/users', { params })

export const getAdmins = () =>
  instance.get<ApiSuccess<User[]>>('/users/admins')

export const updateUser = (id: number, data: Partial<User>) =>
  instance.put<ApiSuccess<User>>(`/users/${id}`, data)

export const uploadAvatar = (file: File) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return instance.post<ApiSuccess<{ avatarUrl: string }>>('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getWorkItemActivities = (workItemId: number) =>
  instance.get(`/work-items/${workItemId}/activities`)

export const addWorkItemComment = (workItemId: number, data: { content: string }) =>
  instance.post(`/work-items/${workItemId}/comments`, data)

export const deleteWorkItemAttachment = (workItemId: number, attachmentId: string) =>
  instance.delete(`/work-items/${workItemId}/attachments/${attachmentId}`)

export const exportProject = (id: number) =>
  instance.get(`/projects/${id}/export`, { responseType: 'blob' })

export const addTicketComment = (ticketId: number, data: { content: string }) =>
  instance.post(`/tickets/${ticketId}/comments`, data)

export const updatePassword = (userId: number, data: { currentPassword: string; newPassword: string }) =>
  instance.put(`/users/${userId}/password`, data)

export const deleteUser = (userId: number) =>
  instance.delete(`/users/${userId}`)

export const getPendingScheduleItems = (params?: Record<string, unknown>) =>
  instance.get<ApiSuccess<WorkItem[]>>('/work-items/pending-schedule', { params })

export default instance
