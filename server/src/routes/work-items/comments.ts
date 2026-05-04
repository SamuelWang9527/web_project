import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../lib/route-auth'

async function recordActivity(
  workItemId: number,
  userId: number,
  type: string,
  field: string | null = null,
  oldValue: string | null = null,
  newValue: string | null = null,
  description: string = ''
) {
  await prisma.workitem_activities.create({
    data: {
      workItemId,
      userId,
      type: type as any,
      field,
      oldValue: oldValue != null ? String(oldValue) : null,
      newValue: newValue != null ? String(newValue) : null,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })
}

const commentRoutes: FastifyPluginAsync = async (fastify) => {
  // 添加评论
  fastify.post<{ Params: { id: string } }>('/:id/comments', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)
    const { content } = request.body as { content: string }

    if (!content) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION', message: '评论内容不能为空' } })
    }

    const workItem = await prisma.workitems.findUnique({ where: { id } })
    if (!workItem) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '工作项不存在' } })
    }

    const newComment = {
      id: Date.now(),
      userId: request.user!.id,
      username: request.user!.username,
      content,
      createdAt: new Date()
    }

    const existing = Array.isArray(workItem.comments)
      ? (workItem.comments as unknown[])
      : (() => {
          try { return JSON.parse(String(workItem.comments || '[]')) } catch { return [] }
        })()

    await prisma.workitems.update({
      where: { id },
      data: {
        comments: [...existing, newComment],
        updatedAt: new Date()
      }
    })

    // Record comment activity
    await recordActivity(id, request.user!.id, 'comment', null, null, content, content)

    return reply.status(201).send({ success: true, data: { comment: newComment } })
  })
}

export default commentRoutes
