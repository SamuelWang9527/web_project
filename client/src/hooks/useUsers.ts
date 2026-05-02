import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, updateUser, deleteUser, getAdmins } from '@/utils/api'
import type { User } from '@/types/models'
import type { ApiSuccess } from '@/types/api'

export function useUsers() {
  return useQuery<ApiSuccess<User[]>>({
    queryKey: ['users'],
    queryFn: () => getUsers().then(res => res.data),
  })
}

export function useAdmins() {
  return useQuery<ApiSuccess<User[]>>({
    queryKey: ['users', 'admins'],
    queryFn: () => getAdmins().then(res => res.data),
  })
}

export function useUpdateUser(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<User>) => updateUser(id, data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
