import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../../lib/prisma'
import { requireAdmin, requireAuth } from '../../lib/route-auth'
import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'
import {
  toEnumStatus, toEnumType, toEnumPriority, toEnumSource,
  serializeWorkItem, zhStatus,
} from '../../utils/enumTransform'

// Field display name map for activity logging
function getFieldDisplayName(field: string): string {
  const fieldMap: Record<string, string> = {
    title: '标题',
    description: '描述',
    type: '类型',
    status: '状态',
    priority: '紧急程度',
    source: '需求来源',
    estimatedHours: '预估工时',
    actualHours: '实际工时',
    scheduledStartDate: '排期开始日期',
    scheduledEndDate: '排期结束日期',
    expectedCompletionDate: '期望完成日期',
    completionDate: '实际完成日期',
    projectId: '所属项目',
    assigneeId: '负责人'
  }
  return fieldMap[field] || field
}

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

const workItemRoutes: FastifyPluginAsync = async (fastify) => {
  // 获取工作项列表（支持筛选）
  fastify.get('/', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const {
      title, projectId, type, status, priority,
      assigneeId, source, startDate, endDate, createdById
    } = request.query as Record<string, string | undefined>

    const where: Record<string, unknown> = {}

    if (title) where.title = { contains: title }
    if (projectId) where.projectId = parseInt(projectId)
    if (type) where.type = toEnumType(type)
    if (status) where.status = toEnumStatus(status)
    if (priority) where.priority = toEnumPriority(priority)
    if (assigneeId) where.assigneeId = parseInt(assigneeId)
    if (source) where.source = toEnumSource(source)
    if (createdById) where.createdById = parseInt(createdById)

    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) }
    } else if (startDate) {
      where.createdAt = { gte: new Date(startDate) }
    } else if (endDate) {
      where.createdAt = { lte: new Date(endDate) }
    }

    const workItems = await prisma.workitems.findMany({
      where,
      include: {
        users_workitems_assigneeIdTousers: { select: { id: true, username: true, avatar: true } },
        users_workitems_createdByIdTousers: { select: { id: true, username: true, avatar: true } },
        projects: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return reply.send({ success: true, data: workItems.map(item => serializeWorkItem(item as any)) })
  })

  // 获取待排期工作项（仅管理员）
  fastify.get('/pending-schedule', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return

    const workItems = await prisma.workitems.findMany({
      where: {
        assigneeId: request.user!.id,
        OR: [
          { scheduledStartDate: null },
          { scheduledEndDate: null }
        ],
        status: { not: 'Completed' }
      },
      include: {
        users_workitems_createdByIdTousers: { select: { id: true, username: true, avatar: true } },
        projects: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return reply.send({ success: true, data: workItems.map(item => serializeWorkItem(item as any)) })
  })

  // 导出工作项为 Excel
  fastify.get('/export', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const where: Record<string, unknown> = {}
    if (request.user!.role === 'user') {
      where.createdById = request.user!.id
    }

    const workItems = await prisma.workitems.findMany({
      where,
      include: {
        users_workitems_assigneeIdTousers: { select: { id: true, username: true } },
        users_workitems_createdByIdTousers: { select: { id: true, username: true } },
        projects: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (workItems.length === 0) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '没有找到工作项，请先创建工作项' } })
    }

    const exportsDir = path.join(__dirname, '../../../public/exports')
    if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true })

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('工作项列表')

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '标题', key: 'title', width: 30 },
      { header: '类型', key: 'type', width: 15 },
      { header: '状态', key: 'status', width: 15 },
      { header: '优先级', key: 'priority', width: 15 },
      { header: '项目', key: 'project', width: 20 },
      { header: '创建者', key: 'creator', width: 15 },
      { header: '负责人', key: 'assignee', width: 15 },
      { header: '需求来源', key: 'source', width: 15 },
      { header: '创建日期', key: 'createdAt', width: 20 },
      { header: '期望完成日期', key: 'expectedCompletionDate', width: 20 },
      { header: '排期开始日期', key: 'scheduledStartDate', width: 20 },
      { header: '排期结束日期', key: 'scheduledEndDate', width: 20 },
      { header: '最后更新日期', key: 'updatedAt', width: 20 },
      { header: '描述', key: 'description', width: 40 }
    ]

    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }

    for (const item of workItems) {
      const s = serializeWorkItem(item as any)
      worksheet.addRow({
        id: item.id,
        title: item.title,
        type: s.type,
        status: s.status,
        priority: s.priority,
        project: item.projects?.name || '',
        creator: item.users_workitems_createdByIdTousers?.username || '',
        assignee: item.users_workitems_assigneeIdTousers?.username || '',
        source: s.source || '',
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : '',
        expectedCompletionDate: item.expectedCompletionDate ? new Date(item.expectedCompletionDate).toLocaleDateString() : '',
        scheduledStartDate: item.scheduledStartDate ? new Date(item.scheduledStartDate).toLocaleDateString() : '',
        scheduledEndDate: item.scheduledEndDate ? new Date(item.scheduledEndDate).toLocaleDateString() : '',
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '',
        description: item.description || ''
      })
    }

    const timestamp = Date.now()
    const filename = `工作项_${timestamp}.xlsx`
    const safeFilename = `workitems_export_${timestamp}.xlsx`
    const filepath = path.join(exportsDir, safeFilename)

    await workbook.xlsx.writeFile(filepath)

    return reply.send({
      success: true,
      data: {
        message: `已成功导出 ${workItems.length} 个工作项`,
        count: workItems.length,
        downloadUrl: `/exports/${safeFilename}`,
        filename
      }
    })
  })

  // 获取工作项详情
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)

    const workItem = await prisma.workitems.findUnique({
      where: { id },
      include: {
        users_workitems_assigneeIdTousers: { select: { id: true, username: true, avatar: true, role: true } },
        users_workitems_createdByIdTousers: { select: { id: true, username: true, avatar: true, role: true } },
        projects: { select: { id: true, name: true, status: true } }
      }
    })

    if (!workItem) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '工作项不存在' } })
    }

    // Normalize attachments to always be an array
    let attachments: unknown[] = []
    const raw = workItem.attachments
    if (raw == null) {
      attachments = []
    } else if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        attachments = Array.isArray(parsed) ? parsed : []
      } catch {
        attachments = []
      }
    } else if (Array.isArray(raw)) {
      attachments = raw as unknown[]
    }

    // Ensure each attachment has required fields
    attachments = attachments
      .filter((a): a is Record<string, unknown> => a != null && typeof a === 'object')
      .map(a => ({
        ...a,
        mimetype: a.mimetype || 'application/octet-stream',
        originalName: a.originalName || a.filename || '未命名文件',
        size: a.size || 0
      }))

    return reply.send({ success: true, data: serializeWorkItem({ ...workItem, attachments } as any) })
  })

  // 创建工作项
  fastify.post('/', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const {
      title, type, description, status, priority, source,
      expectedCompletionDate, projectId, assigneeId,
      estimatedHours, scheduledStartDate, scheduledEndDate
    } = request.body as Record<string, unknown>

    if (!title) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION', message: '标题不能为空' } })
    }

    // Validate assignee
    if (assigneeId) {
      const assignee = await prisma.users.findUnique({ where: { id: Number(assigneeId) } })
      if (!assignee) {
        return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '指定的负责人不存在' } })
      }
      if (!['admin', 'super_admin'].includes(assignee.role ?? '')) {
        return reply.status(400).send({ success: false, error: { code: 'VALIDATION', message: '负责人必须是管理员或超级管理员' } })
      }
    }

    // Validate project
    if (projectId) {
      const project = await prisma.projects.findUnique({ where: { id: Number(projectId) } })
      if (!project) {
        return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '指定的项目不存在' } })
      }
    }

    const workItem = await prisma.workitems.create({
      data: {
        title: String(title),
        type: (toEnumType(type as string | undefined) as any) || 'Task',
        description: description ? String(description) : '',
        status: (toEnumStatus(status as string | undefined) as any) || 'Pending',
        priority: (toEnumPriority(priority as string | undefined) as any) || 'Medium',
        source: source ? (toEnumSource(source as string) as any) : null,
        expectedCompletionDate: expectedCompletionDate ? new Date(String(expectedCompletionDate)) : null,
        projectId: projectId ? Number(projectId) : null,
        assigneeId: assigneeId ? Number(assigneeId) : null,
        createdById: request.user!.id,
        attachments: [],
        comments: [],
        estimatedHours: estimatedHours ? Number(estimatedHours) : null,
        scheduledStartDate: scheduledStartDate ? new Date(String(scheduledStartDate)) : null,
        scheduledEndDate: scheduledEndDate ? new Date(String(scheduledEndDate)) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    // Record create activity
    await recordActivity(workItem.id, request.user!.id, 'create', null, null, null, `创建了工作项 "${workItem.title}"`)

    // Record assignee activity if set
    if (assigneeId) {
      const assignee = await prisma.users.findUnique({ where: { id: Number(assigneeId) } })
      if (assignee) {
        await recordActivity(workItem.id, request.user!.id, 'assignee_change', 'assigneeId', null, String(assigneeId), `将工作项分配给 ${assignee.username}`)
      }
    }

    return reply.status(201).send({ success: true, data: serializeWorkItem(workItem as any) })
  })

  // 更新工作项
  fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)

    const workItem = await prisma.workitems.findUnique({ where: { id } })
    if (!workItem) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '工作项不存在' } })
    }

    // Only admin or creator can update
    const isAdmin = ['admin', 'super_admin'].includes(request.user!.role)
    const isCreator = workItem.createdById === request.user!.id
    if (!isAdmin && !isCreator) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: '权限不足' } })
    }

    const rawBody = request.body as Record<string, unknown>
    // Normalize Chinese enum values from client to Prisma enum names
    const body: Record<string, unknown> = {
      ...rawBody,
      ...(rawBody.status !== undefined && { status: toEnumStatus(String(rawBody.status)) }),
      ...(rawBody.type !== undefined && { type: toEnumType(String(rawBody.type)) }),
      ...(rawBody.priority !== undefined && { priority: toEnumPriority(String(rawBody.priority)) }),
      ...(rawBody.source !== undefined && { source: toEnumSource(String(rawBody.source)) }),
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }

    // Tracked fields for activity logging
    const trackedFields = [
      'title', 'type', 'description', 'status', 'priority', 'source',
      'expectedCompletionDate', 'scheduledStartDate', 'scheduledEndDate',
      'projectId', 'assigneeId', 'estimatedHours', 'actualHours'
    ]

    for (const field of trackedFields) {
      if (body[field] === undefined) continue
      if (String(body[field]) === String((workItem as any)[field] ?? '')) continue

      updateData[field] = field.toLowerCase().includes('date') && body[field]
        ? new Date(String(body[field]))
        : (field === 'projectId' || field === 'assigneeId' || field === 'estimatedHours' || field === 'actualHours')
          ? (body[field] ? Number(body[field]) : null)
          : body[field]

      // Activity logging per field
      if (field === 'status') {
        const oldStatusZh = zhStatus((workItem as any)[field] as string)
        const newStatusZh = zhStatus(String(body[field]))
        await recordActivity(id, request.user!.id, 'status_change', field,
          oldStatusZh, newStatusZh,
          `将状态从 "${oldStatusZh}" 修改为 "${newStatusZh}"`)

        // Auto-set completionDate when status → Completed
        if (body[field] === 'Completed' && (workItem as any)[field] !== 'Completed') {
          const today = new Date().toISOString().split('T')[0]
          updateData.completionDate = new Date(today)
          await recordActivity(id, request.user!.id, 'update', 'completionDate',
            workItem.completionDate ? String(workItem.completionDate) : null,
            today, `自动设置完成日期为 ${today}`)
        }
      } else if (field === 'assigneeId') {
        const oldAssignee = workItem.assigneeId ? await prisma.users.findUnique({ where: { id: workItem.assigneeId } }) : null
        const newAssignee = body[field] ? await prisma.users.findUnique({ where: { id: Number(body[field]) } }) : null
        await recordActivity(id, request.user!.id, 'assignee_change', field,
          workItem.assigneeId ? String(workItem.assigneeId) : null,
          body[field] ? String(body[field]) : null,
          `将负责人从 ${oldAssignee?.username ?? '未分配'} 修改为 ${newAssignee?.username ?? '未分配'}`)
      } else {
        // For date fields normalize before comparing
        let oldVal: string = String((workItem as any)[field] ?? '')
        let newVal: string = String(body[field])
        let different = true

        if (field.toLowerCase().includes('date') && oldVal && newVal) {
          try {
            oldVal = new Date(oldVal).toISOString().split('T')[0]
            newVal = new Date(newVal).toISOString().split('T')[0]
            different = oldVal !== newVal
          } catch { /* keep different=true */ }
        } else {
          different = oldVal !== newVal
        }

        if (different) {
          await recordActivity(id, request.user!.id, 'update', field, oldVal, newVal,
            `修改了 ${getFieldDisplayName(field)} 字段，从 "${oldVal || '空'}" 修改为 "${newVal}"`)
        }
      }
    }

    // Handle completionDate explicitly (client may provide it)
    if (body.completionDate !== undefined) {
      const oldDate = workItem.completionDate ? new Date(workItem.completionDate).toISOString().split('T')[0] : null
      const newDate = body.completionDate ? new Date(String(body.completionDate)).toISOString().split('T')[0] : null
      if (oldDate !== newDate) {
        updateData.completionDate = body.completionDate ? new Date(String(body.completionDate)) : null
        await recordActivity(id, request.user!.id, 'update', 'completionDate',
          oldDate, newDate, `修改了 完成日期 字段，从 "${oldDate || '空'}" 修改为 "${newDate}"`)
      }
    }

    // Handle attachments: merge existing + new (new ones handled by attachments route)
    // In this route we only accept existingAttachments (JSON array)
    if (body.existingAttachments !== undefined) {
      let existing: unknown[] = []
      try {
        existing = JSON.parse(String(body.existingAttachments))
        if (!Array.isArray(existing)) existing = []
      } catch { existing = [] }

      // Detect deleted attachments and log
      const currentAttachments: unknown[] = Array.isArray(workItem.attachments)
        ? (workItem.attachments as unknown[])
        : (() => {
            try { return JSON.parse(String(workItem.attachments || '[]')) } catch { return [] }
          })()

      const deleted = (currentAttachments as Record<string, unknown>[]).filter(
        a => !(existing as Record<string, unknown>[]).some(e => e.path === a.path)
      )
      for (const att of deleted) {
        await recordActivity(id, request.user!.id, 'attachment_delete', 'attachments',
          String(att.originalName || att.originalname || ''), null,
          `删除了附件 "${att.originalName || att.originalname || ''}"`)
      }

      updateData.attachments = existing
    }

    // Handle comment from body
    if (body.comment) {
      let commentContent: string
      try {
        const parsed = typeof body.comment === 'string' ? JSON.parse(body.comment) : body.comment
        commentContent = parsed.content || String(body.comment)
      } catch {
        commentContent = String(body.comment)
      }
      await recordActivity(id, request.user!.id, 'comment', null, null, commentContent, commentContent)
    }

    await prisma.workitems.update({ where: { id }, data: updateData })

    const updated = await prisma.workitems.findUnique({
      where: { id },
      include: {
        users_workitems_assigneeIdTousers: { select: { id: true, username: true, avatar: true } },
        users_workitems_createdByIdTousers: { select: { id: true, username: true, avatar: true } },
        projects: { select: { id: true, name: true } }
      }
    })

    return reply.send({ success: true, data: serializeWorkItem(updated as any) })
  })

  // 删除工作项
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)

    const workItem = await prisma.workitems.findUnique({ where: { id } })
    if (!workItem) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '工作项不存在' } })
    }

    if (request.user!.role === 'user' && workItem.createdById !== request.user!.id) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: '没有权限删除此工作项' } })
    }

    await prisma.workitems.delete({ where: { id } })

    return reply.send({ success: true, data: { message: '工作项删除成功' } })
  })

  // 获取工作项活动历史
  fastify.get<{ Params: { id: string } }>('/:id/activities', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)

    const activities = await prisma.workitem_activities.findMany({
      where: { workItemId: id },
      include: {
        users: { select: { id: true, username: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return reply.send({ success: true, data: activities })
  })

  // 下载导出文件
  fastify.get<{ Params: { filename: string } }>('/download/:filename', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const { filename } = request.params

    if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
      return reply.status(400).send({ success: false, error: { code: 'INVALID_FILENAME', message: '无效的文件名' } })
    }

    const baseDir = path.join(__dirname, '../../../../public')
    const possiblePaths = [
      path.join(baseDir, 'uploads/files', filename),
      path.join(baseDir, 'uploads/images', filename),
      path.join(baseDir, 'uploads', filename),
      path.join(baseDir, 'exports', filename)
    ]

    let filepath: string | null = null
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) { filepath = p; break }
    }

    if (!filepath) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '文件不存在或已被删除' } })
    }

    const stat = fs.statSync(filepath)
    const mimetype = path.extname(filepath).toLowerCase() === '.xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/octet-stream'

    reply.header('Content-Length', stat.size)
    reply.header('Content-Type', mimetype)
    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)

    return reply.send(fs.createReadStream(filepath))
  })
}

export default workItemRoutes
