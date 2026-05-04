import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../lib/route-auth'
import { registerSseClient, removeSseClient } from '../lib/sseConnections'

const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/notifications — last 20 notifications + unread count
  fastify.get('/', async (request, reply) => {
    if (!await requireAuth(request, reply)) return
    const userId = request.user!.id

    const [data, unreadCount] = await Promise.all([
      prisma.notifications.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.notifications.count({ where: { userId, isRead: false } }),
    ])

    return reply.send({ data, unreadCount })
  })

  // PATCH /api/notifications/read-all — mark all as read
  fastify.patch('/read-all', async (request, reply) => {
    if (!await requireAuth(request, reply)) return
    const userId = request.user!.id

    await prisma.notifications.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })

    return reply.send({ success: true })
  })

  // GET /api/notifications/sse — SSE long connection
  fastify.get('/sse', async (request, reply) => {
    if (!await requireAuth(request, reply)) return
    const userId = request.user!.id

    // Hijack bypasses Fastify's response pipeline (incl. compression)
    reply.hijack()
    const res = reply.raw
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })

    const unreadCount = await prisma.notifications.count({
      where: { userId, isRead: false },
    })
    res.write(`data: ${JSON.stringify({ unreadCount })}\n\n`)

    registerSseClient(userId, res)

    request.raw.on('close', () => {
      removeSseClient(userId)
    })
  })
}

export default notificationRoutes
