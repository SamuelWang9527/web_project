import type { ServerResponse } from 'http'
import { prisma } from './prisma'

const sseConnections = new Map<number, ServerResponse>()

export function registerSseClient(userId: number, res: ServerResponse): void {
  sseConnections.set(userId, res)
}

export function removeSseClient(userId: number): void {
  sseConnections.delete(userId)
}

export async function notifySseClient(userId: number): Promise<void> {
  const res = sseConnections.get(userId)
  if (!res || res.destroyed) return
  const unreadCount = await prisma.notifications.count({
    where: { userId, isRead: false },
  })
  try {
    res.write(`data: ${JSON.stringify({ unreadCount })}\n\n`)
  } catch {
    sseConnections.delete(userId)
  }
}
