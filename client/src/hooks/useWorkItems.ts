import { useQuery } from '@tanstack/react-query'
import { getWorkItems } from '@/utils/api'
import type { WorkItem } from '@/types/models'
import type { ApiSuccess } from '@/types/api'

export interface WorkItemFilters {
  title?: string
  projectId?: number
  type?: string
  status?: string
  priority?: string
  assigneeId?: number
  source?: string
  startDate?: string
  endDate?: string
}

export function useWorkItems(filters: WorkItemFilters = {}, page = 1, limit = 20) {
  return useQuery<ApiSuccess<WorkItem[]>>({
    queryKey: ['work-items', filters, page, limit],
    queryFn: () =>
      getWorkItems({ ...filters, page, limit }).then(res => res.data),
  })
}
