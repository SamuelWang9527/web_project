import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createWorkItem,
  updateWorkItem,
  deleteWorkItem,
  uploadAttachment,
  deleteWorkItemAttachment,
  addWorkItemComment,
} from '@/utils/api'
import type { WorkItem } from '@/types/models'

export function useCreateWorkItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<WorkItem>) => createWorkItem(data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work-items'] }),
  })
}

export function useUpdateWorkItem(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<WorkItem>) => updateWorkItem(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      queryClient.invalidateQueries({ queryKey: ['work-items', id] })
    },
  })
}

export function useDeleteWorkItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteWorkItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work-items'] }),
  })
}

export function useUploadAttachment(workItemId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadAttachment(workItemId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work-items', workItemId] }),
  })
}

export function useDeleteAttachment(workItemId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) => deleteWorkItemAttachment(workItemId, attachmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work-items', workItemId] }),
  })
}

export function useAddComment(workItemId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => addWorkItemComment(workItemId, { content }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work-items', workItemId] }),
  })
}
