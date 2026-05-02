import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, getPendingItems } from '@/utils/api'
import type { WorkItem } from '@/types/models'
import type { ApiSuccess } from '@/types/api'

export function useDashboardStats(filters: Record<string, unknown> = {}) {
  return useQuery<ApiSuccess<Record<string, unknown>>>({
    queryKey: ['dashboard', 'stats', filters],
    queryFn: () => getDashboardStats(filters).then(res => res.data),
  })
}

export function usePendingItems(filters: Record<string, unknown> = {}, page = 1, limit = 20) {
  return useQuery<ApiSuccess<WorkItem[]>>({
    queryKey: ['dashboard', 'pending', filters, page, limit],
    queryFn: () => getPendingItems({ ...filters, page, limit }).then(res => res.data),
  })
}
