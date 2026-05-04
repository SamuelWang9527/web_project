import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, createProject, updateProject, deleteProject, getProjectById } from '@/utils/api'
import type { Project } from '@/types/models'
import type { ApiSuccess } from '@/types/api'

export interface ProjectFilters {
  name?: string
  status?: string
}

export function useProjects(filters: ProjectFilters = {}, page = 1, limit = 20) {
  return useQuery<ApiSuccess<Project[]>>({
    queryKey: ['projects', filters, page, limit],
    queryFn: () => getProjects({ ...filters, page, limit }).then(res => res.data),
  })
}

export function useProject(id: number | undefined) {
  return useQuery<ApiSuccess<Project>>({
    queryKey: ['projects', id],
    queryFn: () => getProjectById(id!).then(res => res.data),
    enabled: id !== undefined,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Project>) => createProject(data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Project>) => updateProject(id, data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}
