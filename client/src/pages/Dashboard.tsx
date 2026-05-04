import { useState, useEffect, useMemo } from 'react'
import { useDashboardStats, usePendingItems } from '@/hooks/useDashboard'
import { useUsers } from '@/hooks/useUsers'
import * as api from '@/utils/api'
import { StatCards } from '@/components/dashboard/StatCards'
import { PendingItemsTable } from '@/components/dashboard/PendingItemsTable'
import { GanttSection } from '@/components/dashboard/GanttSection'
import type { Project } from '@/types/models'
import dayjs from 'dayjs'

interface PendingFilters {
  projectId?: number | string
  brand?: string
  type?: string
  priority?: string
  createdById?: number | string
  assigneeId?: number | string
  dateRange?: any[]
}

const EMPTY_FILTERS: PendingFilters = {
  projectId: '',
  brand: '',
  type: '',
  priority: '',
  createdById: '',
  assigneeId: '',
  dateRange: [],
}

export default function Dashboard() {
  const [filters, setFilters] = useState<PendingFilters>(EMPTY_FILTERS)

  // Projects with work items for Gantt (fetched imperatively to allow per-project WI loading)
  const [projectsWithItems, setProjectsWithItems] = useState<Project[]>([])
  const [workItemsByProject, setWorkItemsByProject] = useState<Record<number, any[]>>({})
  const [ganttLoading, setGanttLoading] = useState(true)

  // React Query hooks
  const { data: statsData, isLoading: statsLoading } = useDashboardStats()
  const { data: usersData } = useUsers()

  const users = usersData?.data ?? []
  const brands: string[] = useMemo(
    () => [...new Set(users.map((u: any) => u.brand).filter(Boolean))] as string[],
    [users]
  )

  // Build server-compatible filter params for pending items
  const serverFilters = useMemo(() => {
    const params: Record<string, unknown> = {}
    if (filters.type) params.type = filters.type
    if (filters.priority) params.priority = filters.priority
    if (filters.createdById) params.createdById = filters.createdById
    if (filters.assigneeId) params.assigneeId = filters.assigneeId
    return params
  }, [filters.type, filters.priority, filters.createdById, filters.assigneeId])

  const { data: pendingData, isLoading: pendingLoading } = usePendingItems(serverFilters, 1, 500)

  // Client-side filtering for brand, projectId, dateRange (not supported by server endpoint)
  const filteredItems = useMemo(() => {
    let items = pendingData?.data ?? []

    if (filters.projectId) {
      items = items.filter((item: any) => item.projectId === filters.projectId)
    }

    if (filters.brand) {
      items = items.filter((item: any) => {
        const creator = users.find((u: any) => u.id === item.createdById)
        return creator && (creator as any).brand === filters.brand
      })
    }

    if (filters.dateRange && filters.dateRange.length === 2) {
      const startDate = dayjs(filters.dateRange[0]).startOf('day')
      const endDate = dayjs(filters.dateRange[1]).endOf('day')
      items = items.filter((item: any) => {
        const itemDate = dayjs(item.createdAt)
        return itemDate.isAfter(startDate) && itemDate.isBefore(endDate)
      })
    }

    return items
  }, [pendingData, filters.projectId, filters.brand, filters.dateRange, users])

  // Fetch projects + their work items for Gantt chart
  useEffect(() => {
    let cancelled = false
    setGanttLoading(true)

    api.getProjects().then(async (res) => {
      if (cancelled) return
      const rawData = (res.data as any)?.data || res.data
      const projectsData: Project[] = Array.isArray(rawData) ? rawData : []

      if (cancelled) return
      setProjectsWithItems(projectsData)

      const byProject: Record<number, any[]> = {}
      await Promise.all(
        projectsData.map(async (project) => {
          try {
            const wiRes = await api.getWorkItems({ projectId: project.id })
            const workItems = (wiRes.data as any)?.data || wiRes.data
            byProject[project.id] = Array.isArray(workItems) ? workItems : []
          } catch {
            byProject[project.id] = []
          }
        })
      )

      if (!cancelled) {
        setWorkItemsByProject(byProject)
        setGanttLoading(false)
      }
    }).catch(() => {
      if (!cancelled) {
        setProjectsWithItems([])
        setWorkItemsByProject({})
        setGanttLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [])

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleResetFilters = () => {
    setFilters(EMPTY_FILTERS)
  }

  const stats = (statsData?.data ?? {}) as {
    completedCount?: number
    pendingCount?: number
    dailyAverage?: number | string
    totalDueItems?: number
  }

  return (
    <div className="dashboard">
      <StatCards
        stats={stats}
        projects={projectsWithItems}
        pendingItems={filteredItems}
        loading={statsLoading}
      />
      <PendingItemsTable
        items={filteredItems}
        meta={pendingData?.meta}
        loading={pendingLoading}
        filters={filters}
        projects={projectsWithItems}
        users={users}
        brands={brands}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />
      <GanttSection
        projects={projectsWithItems}
        workItemsByProject={workItemsByProject}
      />
    </div>
  )
}
