import { useQuery } from '@tanstack/react-query'
import { getWorkItemActivities } from '@/utils/api'

export function useWorkItemActivities(id?: number) {
  return useQuery({
    queryKey: ['work-items', id, 'activities'],
    queryFn: () => getWorkItemActivities(id!).then((res) => res.data),
    enabled: id !== undefined,
  })
}
