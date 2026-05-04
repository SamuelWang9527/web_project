import { useQuery } from '@tanstack/react-query'
import { getWorkItemById } from '@/utils/api'
import type { WorkItem } from '@/types/models'
import type { ApiSuccess } from '@/types/api'

export function useWorkItem(id: number | undefined) {
  return useQuery<ApiSuccess<WorkItem>>({
    queryKey: ['work-items', id],
    queryFn: () => getWorkItemById(id!).then(res => res.data),
    enabled: id !== undefined,
  })
}
