// client/src/test/fixtures/tickets.ts
import type { Ticket } from '@/types/models'

export const ticketFixture: Ticket = {
  id: 1,
  title: '测试工单',
  status: 'open',
  priority: 'medium',
  creatorId: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export const ticketsFixture: Ticket[] = [ticketFixture]
