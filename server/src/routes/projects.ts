import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../auth'
import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'

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

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  // 获取所有项目
  fastify.get('/', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const { status, search } = request.query as { status?: string; search?: string }

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) where.name = { contains: search }

    const projects = await prisma.projects.findMany({
      where,
      include: {
        users: {
          select: { id: true, username: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return reply.send({ success: true, data: projects })
  })

  // 创建新项目（仅管理员）
  fastify.post('/', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return

    const { name, description, startDate, endDate, status } = request.body as {
      name: string
      description?: string
      startDate?: string
      endDate?: string
      status?: string
    }

    if (!name) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION', message: '项目名称不能为空' } })
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION', message: '结束日期不能早于开始日期' } })
    }

    const project = await prisma.projects.create({
      data: {
        name,
        description: description ?? null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: (status as any) ?? 'Pending',
        createdById: request.user!.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    return reply.status(201).send({ success: true, data: project })
  })

  // 获取单个项目详情
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)

    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, username: true, avatar: true }
        },
        workitems: {
          include: {
            users_workitems_assigneeIdTousers: {
              select: { id: true, username: true, avatar: true }
            },
            users_workitems_createdByIdTousers: {
              select: { id: true, username: true, avatar: true }
            }
          }
        }
      }
    })

    if (!project) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '项目不存在' } })
    }

    return reply.send({ success: true, data: project })
  })

  // 更新项目（管理员或创建者）
  fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)
    const { name, description, startDate, endDate, status } = request.body as {
      name?: string
      description?: string
      startDate?: string
      endDate?: string
      status?: string
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION', message: '结束日期不能早于开始日期' } })
    }

    const project = await prisma.projects.findUnique({ where: { id } })
    if (!project) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '项目不存在' } })
    }

    // Only admin or creator can update
    const isAdmin = ['admin', 'super_admin'].includes(request.user!.role)
    const isCreator = project.createdById === request.user!.id
    if (!isAdmin && !isCreator) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: '权限不足' } })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (name !== undefined) updateData.name = name || project.name
    if (description !== undefined) updateData.description = description
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (status !== undefined) updateData.status = status

    const updated = await prisma.projects.update({ where: { id }, data: updateData })

    return reply.send({ success: true, data: updated })
  })

  // 删除项目（管理员或创建者）
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)

    const project = await prisma.projects.findUnique({ where: { id } })
    if (!project) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '项目不存在' } })
    }

    const isAdmin = ['admin', 'super_admin'].includes(request.user!.role)
    const isCreator = project.createdById === request.user!.id
    if (!isAdmin && !isCreator) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: '权限不足' } })
    }

    const workItemCount = await prisma.workitems.count({ where: { projectId: id } })
    if (workItemCount > 0) {
      return reply.status(400).send({
        success: false,
        error: { code: 'HAS_ITEMS', message: '无法删除项目，请先删除或转移项目中的工作项' },
        workItemCount
      })
    }

    await prisma.projects.delete({ where: { id } })

    return reply.send({ success: true, data: { message: '项目删除成功' } })
  })

  // 导出项目为Excel（保存到磁盘，返回下载URL）
  fastify.get<{ Params: { id: string } }>('/:id/export', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)

    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, username: true } },
        workitems: {
          include: {
            users_workitems_assigneeIdTousers: { select: { id: true, username: true } },
            users_workitems_createdByIdTousers: { select: { id: true, username: true } }
          }
        }
      }
    })

    if (!project) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '项目不存在' } })
    }

    const exportsDir = path.join(__dirname, '../../public/exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    const workbook = new ExcelJS.Workbook()
    const projectSheet = workbook.addWorksheet('项目信息')
    const workItemsSheet = workbook.addWorksheet('工作项列表')

    projectSheet.columns = [
      { header: '属性', key: 'property', width: 20 },
      { header: '值', key: 'value', width: 50 }
    ]
    projectSheet.getRow(1).font = { bold: true }
    projectSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }

    projectSheet.addRow({ property: '项目ID', value: project.id })
    projectSheet.addRow({ property: '项目名称', value: project.name })
    projectSheet.addRow({ property: '项目描述', value: project.description || '无' })
    projectSheet.addRow({ property: '项目状态', value: project.status })
    projectSheet.addRow({ property: '开始日期', value: project.startDate ? new Date(project.startDate).toLocaleDateString() : '未设置' })
    projectSheet.addRow({ property: '结束日期', value: project.endDate ? new Date(project.endDate).toLocaleDateString() : '未设置' })
    projectSheet.addRow({ property: '创建者', value: project.users?.username || '未知' })
    projectSheet.addRow({ property: '创建时间', value: new Date(project.createdAt).toLocaleString() })
    projectSheet.addRow({ property: '最后更新时间', value: new Date(project.updatedAt).toLocaleString() })
    projectSheet.addRow({ property: '工作项数量', value: project.workitems.length })

    workItemsSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '标题', key: 'title', width: 30 },
      { header: '类型', key: 'type', width: 15 },
      { header: '状态', key: 'status', width: 15 },
      { header: '优先级', key: 'priority', width: 15 },
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
    workItemsSheet.getRow(1).font = { bold: true }
    workItemsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }

    for (const item of project.workitems) {
      workItemsSheet.addRow({
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        priority: item.priority,
        creator: item.users_workitems_createdByIdTousers?.username || '',
        assignee: item.users_workitems_assigneeIdTousers?.username || '',
        source: item.source || '',
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : '',
        expectedCompletionDate: item.expectedCompletionDate ? new Date(item.expectedCompletionDate).toLocaleDateString() : '',
        scheduledStartDate: item.scheduledStartDate ? new Date(item.scheduledStartDate).toLocaleDateString() : '',
        scheduledEndDate: item.scheduledEndDate ? new Date(item.scheduledEndDate).toLocaleDateString() : '',
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '',
        description: item.description || ''
      })
    }

    const timestamp = Date.now()
    const filename = `项目_${project.name}_${timestamp}.xlsx`
    const safeFilename = `project_${project.id}_export_${timestamp}.xlsx`
    const filepath = path.join(exportsDir, safeFilename)

    await workbook.xlsx.writeFile(filepath)

    const downloadUrl = `/exports/${safeFilename}`
    return reply.send({
      success: true,
      data: {
        message: `已成功导出项目 "${project.name}" 及其 ${project.workitems.length} 个工作项`,
        downloadUrl,
        filename
      }
    })
  })
}

export default projectRoutes
