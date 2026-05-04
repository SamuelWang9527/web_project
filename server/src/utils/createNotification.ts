import { prisma } from '../lib/prisma'
import { notifySseClient } from '../lib/sseConnections'

interface NotificationParams {
  userId: number
  type: 'assigned' | 'commented'
  title: string
  body: string
  linkPath: string
}

export async function createNotification(params: NotificationParams): Promise<void> {
  await prisma.notifications.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      linkPath: params.linkPath,
      isRead: false,
      createdAt: new Date(),
    },
  })
  await notifySseClient(params.userId)
}
