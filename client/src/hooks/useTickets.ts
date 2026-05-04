import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTickets, getTicketById, createTicket, updateTicket, addTicketComment } from '@/utils/api'
import type { Ticket } from '@/types/models'
import type { ApiSuccess } from '@/types/api'

export interface TicketFilters {
  status?: string
  priority?: string
}

export function useTickets(filters: TicketFilters = {}, page = 1, limit = 20) {
  return useQuery<ApiSuccess<Ticket[]>>({
    queryKey: ['tickets', filters, page, limit],
    queryFn: () => getTickets({ ...filters, page, limit }).then(res => res.data),
  })
}

export function useTicket(id: number | undefined) {
  return useQuery<ApiSuccess<Ticket>>({
    queryKey: ['tickets', id],
    queryFn: () => getTicketById(id!).then(res => res.data),
    enabled: id !== undefined,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Ticket>) => createTicket(data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  })
}

export function useUpdateTicket(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Ticket>) => updateTicket(id, data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  })
}

export function useAddTicketComment(ticketId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => addTicketComment(ticketId, { content }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] }),
  })
}
