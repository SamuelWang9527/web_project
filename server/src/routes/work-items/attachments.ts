import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../lib/route-auth'
import type { Prisma } from '../../generated/prisma/client'
import path from 'path'
import fs from 'fs'
import { pipeline } from 'stream/promises'
import { randomUUID } from 'crypto'

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

function normalizeAttachments(raw: unknown): Record<string, unknown>[] {
  if (raw == null) return []
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  }
  return []
}

const attachmentRoutes: FastifyPluginAsync = async (fastify) => {
  // 上传附件到工作项（multipart）
  fastify.post<{ Params: { id: string } }>('/:id/attachments', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)

    const workItem = await prisma.workitems.findUnique({ where: { id } })
    if (!workItem) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '工作项不存在' } })
    }

    const isAdmin = ['admin', 'super_admin'].includes(request.user!.role)
    const isCreator = workItem.createdById === request.user!.id
    if (!isAdmin && !isCreator) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: '权限不足' } })
    }

    const parts = request.parts()
    const newAttachments: Record<string, unknown>[] = []

    for await (const part of parts) {
      if (part.type !== 'file') continue

      const mimetype = part.mimetype || 'application/octet-stream'
      const isImage = mimetype.startsWith('image/')
      const subDir = isImage ? 'images' : 'files'
      const uploadDir = path.join(__dirname, '../../../public/uploads', subDir)
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

      const ext = path.extname(part.filename || '')
      const filename = `${randomUUID()}${ext}`
      const dest = path.join(uploadDir, filename)

      await pipeline(part.file, fs.createWriteStream(dest))

      // Decode original filename (latin1 → utf8 for compatibility)
      let originalName = part.filename || '未命名文件'
      try {
        originalName = Buffer.from(originalName, 'latin1').toString('utf8')
      } catch { /* use as-is */ }

      const stat = fs.statSync(dest)
      const attachment = {
        filename,
        originalName,
        path: `/uploads/${subDir}/${filename}`,
        mimetype,
        size: stat.size
      }

      newAttachments.push(attachment)

      await recordActivity(id, request.user!.id, 'attachment_add', null, null, originalName, `添加了附件: ${originalName}`)
    }

    if (newAttachments.length === 0) {
      return reply.status(400).send({ success: false, error: { code: 'NO_FILE', message: '没有收到文件' } })
    }

    const current = normalizeAttachments(workItem.attachments)
    const merged = [...current, ...newAttachments]

    await prisma.workitems.update({
      where: { id },
      data: { attachments: merged as unknown as Prisma.InputJsonValue, updatedAt: new Date() }
    })

    return reply.status(201).send({ success: true, data: { attachments: merged } })
  })

  // 删除附件（按 filename 作为 attachmentId）
  fastify.delete<{ Params: { id: string; attachmentId: string } }>('/:id/attachments/:attachmentId', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)
    const { attachmentId } = request.params

    const workItem = await prisma.workitems.findUnique({ where: { id } })
    if (!workItem) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '工作项不存在' } })
    }

    const isAdmin = ['admin', 'super_admin'].includes(request.user!.role)
    const isCreator = workItem.createdById === request.user!.id
    if (!isAdmin && !isCreator) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: '没有权限修改此工作项' } })
    }

    const current = normalizeAttachments(workItem.attachments)
    const updated = current.filter(a => a.filename !== attachmentId)

    // Log deletion activity
    const deleted = current.find(a => a.filename === attachmentId)
    if (deleted) {
      await recordActivity(id, request.user!.id, 'attachment_delete', 'attachments',
        String(deleted.originalName || deleted.filename || ''), null,
        `删除了附件 "${deleted.originalName || deleted.filename || ''}"`)
    }

    await prisma.workitems.update({
      where: { id },
      data: { attachments: updated as unknown as Prisma.InputJsonValue, updatedAt: new Date() }
    })

    return reply.send({ success: true, data: { attachments: updated } })
  })
}

export default attachmentRoutes
