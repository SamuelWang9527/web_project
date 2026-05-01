export type UserRole = 'user' | 'admin' | 'super_admin'

export interface User {
  id: number
  username: string
  email: string
  role: UserRole
  avatar?: string | null
  createdAt: string
  updatedAt: string
}

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold'

export interface Project {
  id: number
  name: string
  description?: string | null
  status: ProjectStatus
  startDate?: string | null
  endDate?: string | null
  creatorId: number
  creator?: User
  createdAt: string
  updatedAt: string
}

export type WorkItemStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled'
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface WorkItem {
  id: number
  title: string
  description?: string | null
  status: WorkItemStatus
  priority: WorkItemPriority
  projectId: number
  project?: Project
  assigneeId?: number | null
  assignee?: User | null
  creatorId: number
  creator?: User
  startDate?: string | null
  dueDate?: string | null
  completedDate?: string | null
  createdAt: string
  updatedAt: string
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Ticket {
  id: number
  title: string
  description?: string | null
  status: TicketStatus
  priority: TicketPriority
  creatorId: number
  creator?: User
  assigneeId?: number | null
  assignee?: User | null
  createdAt: string
  updatedAt: string
}

export interface WorkItemActivity {
  id: number
  workItemId: number
  userId: number
  user?: User
  action: string
  field?: string | null
  oldValue?: string | null
  newValue?: string | null
  createdAt: string
}
