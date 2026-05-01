import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../auth'

const requireAuth = async (
  request: import('fastify').FastifyRequest,
  reply: import('fastify').FastifyReply
): Promise<boolean> => {
  if (!request.user) {
    await reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } })
    return false
  }
  return true
}

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  // 获取仪表盘统计数据
  fastify.get('/stats', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const baseWhere: Record<string, unknown> = {}
    if (request.user!.role === 'user') {
      baseWhere.createdById = request.user!.id
    }

    const now = new Date()

    // 已完成工作项数量
    const completedCount = await prisma.workitems.count({
      where: {
        ...baseWhere,
        status: 'Completed',
        OR: [
          { scheduledEndDate: { not: null, lte: now } },
          { expectedCompletionDate: { not: null, lte: now } },
          { AND: [{ scheduledEndDate: null }, { expectedCompletionDate: null }] }
        ]
      }
    })

    // 应完成工作项总数
    const totalDueItems = await prisma.workitems.count({
      where: {
        ...baseWhere,
        OR: [
          { scheduledEndDate: { not: null, lte: now } },
          { expectedCompletionDate: { not: null, lte: now } },
          { status: 'Completed' }
        ]
      }
    })

    // 待完成工作项数量（过期未完成 + 无时间未完成）
    const pendingCount = await prisma.workitems.count({
      where: {
        ...baseWhere,
        status: { notIn: ['Completed', 'Closed'] },
        OR: [
          {
            OR: [
              { scheduledEndDate: { not: null, lte: now } },
              { expectedCompletionDate: { not: null, lte: now } }
            ]
          },
          { AND: [{ scheduledEndDate: null }, { expectedCompletionDate: null }] }
        ]
      }
    })

    // 过去30天每日完成数（日均完成）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Use Prisma findMany then group in JS to avoid raw SQL complexity
    const recentCompletedItems = await prisma.workitems.findMany({
      where: {
        ...baseWhere,
        status: 'Completed',
        updatedAt: { gte: thirtyDaysAgo }
      },
      select: { updatedAt: true }
    })

    // Group by date in JS
    const dateMap = new Map<string, number>()
    for (const item of recentCompletedItems) {
      const date = new Date(item.updatedAt).toISOString().split('T')[0]
      dateMap.set(date, (dateMap.get(date) || 0) + 1)
    }

    const totalDays = dateMap.size || 1
    const totalCompleted = recentCompletedItems.length
    const dailyAverage = (totalCompleted / totalDays).toFixed(1)

    return reply.send({
      success: true,
      data: { completedCount, pendingCount, totalDueItems, dailyAverage }
    })
  })

  // 获取待完成工作项列表
  fastify.get('/pending-items', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const {
      title, type, status, priority, assigneeId, source, createdById
    } = request.query as {
      title?: string
      type?: string
      status?: string
      priority?: string
      assigneeId?: string
      source?: string
      createdById?: string
    }

    const where: Record<string, unknown> = {
      status: { notIn: ['Completed', 'Closed'] }
    }

    if (title) where.title = { contains: title }
    if (type) where.type = type
    // Allow status filter only if not a completed/closed status
    if (status && status !== 'Completed' && status !== 'Closed') where.status = status
    if (priority) where.priority = priority
    if (assigneeId) where.assigneeId = parseInt(assigneeId)
    if (source) where.source = source
    if (createdById) where.createdById = parseInt(createdById)

    // Non-admin users can only see their own items
    if (request.user!.role === 'user') {
      where.createdById = request.user!.id
    }

    const pendingItems = await prisma.workitems.findMany({
      where,
      include: {
        users_workitems_assigneeIdTousers: { select: { id: true, username: true, avatar: true } },
        users_workitems_createdByIdTousers: { select: { id: true, username: true, avatar: true } },
        projects: { select: { id: true, name: true } }
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Add daysFromCreation for each item
    const today = new Date()
    const result = pendingItems.map(item => {
      const diffTime = Math.abs(today.getTime() - new Date(item.createdAt).getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return { ...item, daysFromCreation: diffDays }
    })

    return reply.send({ success: true, data: result })
  })

  // 获取甘特图数据
  fastify.get('/gantt', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const { projectId, startDate, endDate } = request.query as {
      projectId?: string
      startDate?: string
      endDate?: string
    }

    const where: Record<string, unknown> = {
      scheduledStartDate: { not: null },
      scheduledEndDate: { not: null }
    }

    if (projectId) where.projectId = parseInt(projectId)

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      where.OR = [
        { scheduledStartDate: { gte: start, lte: end } },
        { scheduledEndDate: { gte: start, lte: end } },
        { AND: [{ scheduledStartDate: { lte: start } }, { scheduledEndDate: { gte: end } }] }
      ]
    }

    if (request.user!.role === 'user') {
      where.createdById = request.user!.id
    }

    const workItems = await prisma.workitems.findMany({
      where,
      include: {
        users_workitems_assigneeIdTousers: { select: { id: true, username: true, avatar: true } },
        projects: { select: { id: true, name: true } }
      },
      orderBy: { scheduledStartDate: 'asc' }
    })

    const ganttData = workItems.map(item => ({
      id: item.id,
      title: item.title,
      start: item.scheduledStartDate,
      end: item.scheduledEndDate,
      progress: item.status === 'Completed' ? 100 :
                item.status === 'InProgress' ? 50 : 0,
      type: item.type,
      priority: item.priority,
      status: item.status,
      project: item.projects?.name ?? null,
      assignee: item.users_workitems_assigneeIdTousers?.username ?? null
    }))

    const projects = await prisma.projects.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })

    return reply.send({ success: true, data: { ganttData, projects } })
  })
}

export default dashboardRoutes
