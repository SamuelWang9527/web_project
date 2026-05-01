import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma'
import type { Prisma } from '../generated/prisma/client'
import { toEnumStatus, toEnumPriority, serializeTicket } from '../utils/enumTransform'

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

const requireAdmin = async (
  request: import('fastify').FastifyRequest,
  reply: import('fastify').FastifyReply
): Promise<boolean> => {
  if (!request.user || !['admin', 'super_admin'].includes(request.user.role)) {
    await reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: '权限不足' } })
    return false
  }
  return true
}

const ticketRoutes: FastifyPluginAsync = async (fastify) => {
  // 获取工单列表
  fastify.get('/', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const {
      status, priority, search, createdById, assigneeId,
      unassigned, startDate, endDate
    } = request.query as {
      status?: string
      priority?: string
      search?: string
      createdById?: string
      assigneeId?: string
      unassigned?: string
      startDate?: string
      endDate?: string
    }

    const where: Record<string, unknown> = {}

    if (status) where.status = toEnumStatus(status)
    if (priority) where.priority = toEnumPriority(priority)
    if (search) where.title = { contains: search }
    if (createdById) where.createdById = parseInt(createdById)
    if (unassigned === 'true') {
      where.assigneeId = null
    } else if (assigneeId) {
      where.assigneeId = parseInt(assigneeId)
    }

    // Date range filter
    if (startDate || endDate) {
      const createdAtFilter: Record<string, Date> = {}
      if (startDate) createdAtFilter.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        createdAtFilter.lte = end
      }
      where.createdAt = createdAtFilter
    }

    // Non-admin users can only see their own tickets
    if (request.user!.role === 'user') {
      where.createdById = request.user!.id
    }

    const tickets = await prisma.tickets.findMany({
      where,
      include: {
        users_tickets_assigneeIdTousers: {
          select: { id: true, username: true, avatar: true, role: true }
        },
        users_tickets_createdByIdTousers: {
          select: { id: true, username: true, avatar: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return reply.send({ success: true, data: tickets.map(t => serializeTicket(t as any)) })
  })

  // 创建工单
  fastify.post('/', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const { title, description, priority, assigneeId } = request.body as {
      title: string
      description?: string
      priority?: string
      assigneeId?: number
    }

    if (!title) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION', message: '标题不能为空' } })
    }

    // Validate assignee is admin
    if (assigneeId) {
      const assignee = await prisma.users.findUnique({ where: { id: assigneeId } })
      if (!assignee) {
        return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '指定的负责人不存在' } })
      }
      if (!['admin', 'super_admin'].includes(assignee.role ?? '')) {
        return reply.status(400).send({ success: false, error: { code: 'VALIDATION', message: '负责人必须是管理员或超级管理员' } })
      }
    }

    // Generate ticket number: TK-YYMMDD-NNN
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const count = await prisma.tickets.count({
      where: { createdAt: { gte: startOfDay } }
    })
    const ticketNumber = `TK-${year}${month}${day}-${String(count + 1).padStart(3, '0')}`

    const ticket = await prisma.tickets.create({
      data: {
        ticketNumber,
        title,
        description: description || '',
        priority: (priority as any) ?? 'Medium',
        status: 'Pending',
        assigneeId: assigneeId ?? null,
        createdById: request.user!.id,
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    return reply.status(201).send({ success: true, data: serializeTicket(ticket as any) })
  })

  // 获取单个工单详情
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)

    const ticket = await prisma.tickets.findUnique({
      where: { id },
      include: {
        users_tickets_assigneeIdTousers: {
          select: { id: true, username: true, avatar: true, role: true }
        },
        users_tickets_createdByIdTousers: {
          select: { id: true, username: true, avatar: true, role: true }
        }
      }
    })

    if (!ticket) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '工单不存在' } })
    }

    // Non-admin can only view own tickets
    if (request.user!.role === 'user' && ticket.createdById !== request.user!.id) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: '没有权限查看此工单' } })
    }

    return reply.send({ success: true, data: serializeTicket(ticket as any) })
  })

  // 更新工单（仅管理员）
  fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return

    const id = parseInt(request.params.id)
    const { status, assigneeId, comment } = request.body as {
      status?: string
      assigneeId?: number
      comment?: string
    }

    const ticket = await prisma.tickets.findUnique({ where: { id } })
    if (!ticket) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '工单不存在' } })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (status) updateData.status = status
    if (assigneeId) updateData.assigneeId = assigneeId

    if (comment) {
      const newComment = {
        id: Date.now(),
        userId: request.user!.id,
        username: request.user!.username,
        content: comment,
        createdAt: new Date()
      }
      const existing = Array.isArray(ticket.comments) ? ticket.comments as unknown[] : []
      updateData.comments = [...existing, newComment]
    }

    await prisma.tickets.update({ where: { id }, data: updateData })

    const updated = await prisma.tickets.findUnique({
      where: { id },
      include: {
        users_tickets_assigneeIdTousers: { select: { id: true, username: true, avatar: true } },
        users_tickets_createdByIdTousers: { select: { id: true, username: true, avatar: true } }
      }
    })

    return reply.send({ success: true, data: serializeTicket(updated as any) })
  })

  // 添加评论
  fastify.post<{ Params: { id: string } }>('/:id/comments', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)
    const { content } = request.body as { content: string }

    if (!content) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION', message: '评论内容不能为空' } })
    }

    const ticket = await prisma.tickets.findUnique({ where: { id } })
    if (!ticket) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '工单不存在' } })
    }

    // Non-admin can only comment on own tickets
    if (request.user!.role === 'user' && ticket.createdById !== request.user!.id) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: '没有权限评论此工单' } })
    }

    const newComment = {
      id: Date.now(),
      userId: request.user!.id,
      username: request.user!.username,
      content,
      createdAt: new Date()
    }

    const existing = Array.isArray(ticket.comments) ? ticket.comments as unknown[] : []
    await prisma.tickets.update({
      where: { id },
      data: { comments: [...existing, newComment] as unknown as Prisma.InputJsonValue, updatedAt: new Date() }
    })

    return reply.status(201).send({ success: true, data: { comment: newComment } })
  })
}

export default ticketRoutes
