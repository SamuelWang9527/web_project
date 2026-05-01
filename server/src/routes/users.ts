import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../auth'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'
import { pipeline } from 'stream/promises'
import { randomUUID } from 'crypto'

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

const requireSuperAdmin = async (
  request: import('fastify').FastifyRequest,
  reply: import('fastify').FastifyReply
): Promise<boolean> => {
  if (!request.user || request.user.role !== 'super_admin') {
    await reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: '权限不足' } })
    return false
  }
  return true
}

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // 获取所有用户（仅管理员）
  fastify.get('/', async (request, reply) => {
    if (!await requireAdmin(request, reply)) return

    const users = await prisma.users.findMany({
      select: {
        id: true, username: true, phone: true, email: true,
        brand: true, role: true, status: true, avatar: true,
        createdAt: true, updatedAt: true
      }
    })

    return reply.send({ success: true, data: users })
  })

  // 获取管理员用户列表（用于分配负责人）
  fastify.get('/admins', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const admins = await prisma.users.findMany({
      where: { role: { in: ['admin', 'super_admin'] } },
      select: { id: true, username: true, role: true, avatar: true }
    })

    return reply.send({ success: true, data: admins })
  })

  // 获取单个用户信息
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)

    // 普通用户只能查看自己
    if (request.user!.role === 'user' && request.user!.id !== id) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: '没有权限查看其他用户信息' } })
    }

    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true, username: true, phone: true, email: true,
        brand: true, role: true, status: true, avatar: true,
        createdAt: true, updatedAt: true
      }
    })

    if (!user) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } })
    }

    return reply.send({ success: true, data: user })
  })

  // 更新用户信息（支持头像上传 multipart）
  fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)

    if (request.user!.role === 'user' && request.user!.id !== id) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: '没有权限修改其他用户信息' } })
    }

    const user = await prisma.users.findUnique({ where: { id } })
    if (!user) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }

    const contentType = request.headers['content-type'] || ''

    if (contentType.includes('multipart/form-data')) {
      // Handle multipart (avatar upload + fields)
      const parts = request.parts()
      const fields: Record<string, string> = {}
      let avatarPath: string | undefined

      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'avatar') {
          const avatarDir = path.join(__dirname, '../../../public/uploads/images')
          if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true })

          const ext = path.extname(part.filename || '.jpg')
          const filename = `${randomUUID()}${ext}`
          const dest = path.join(avatarDir, filename)
          await pipeline(part.file, fs.createWriteStream(dest))
          avatarPath = `/uploads/images/${filename}`
        } else if (part.type === 'field') {
          fields[part.fieldname] = part.value as string
        }
      }

      if (avatarPath) updateData.avatar = avatarPath
      if (fields.phone) updateData.phone = fields.phone
      if (fields.email) updateData.email = fields.email
      if (fields.brand) updateData.brand = fields.brand

      const isAdmin = ['admin', 'super_admin'].includes(request.user!.role)
      if (isAdmin) {
        if (fields.role) {
          if (request.user!.role === 'super_admin' || fields.role !== 'super_admin') {
            updateData.role = fields.role
          }
        }
        if (fields.status) updateData.status = fields.status
      }
    } else {
      // JSON body
      const body = request.body as Record<string, unknown>
      if (body.phone) updateData.phone = body.phone
      if (body.email) updateData.email = body.email
      if (body.brand) updateData.brand = body.brand

      const isAdmin = ['admin', 'super_admin'].includes(request.user!.role)
      if (isAdmin) {
        if (body.role) {
          if (request.user!.role === 'super_admin' || body.role !== 'super_admin') {
            updateData.role = body.role
          }
        }
        if (body.status) updateData.status = body.status
      }
    }

    const updated = await prisma.users.update({ where: { id }, data: updateData })

    return reply.send({
      success: true,
      data: {
        id: updated.id,
        username: updated.username,
        phone: updated.phone,
        email: updated.email,
        brand: updated.brand,
        role: updated.role,
        status: updated.status,
        avatar: updated.avatar,
        updatedAt: updated.updatedAt
      }
    })
  })

  // 修改密码
  fastify.put<{ Params: { id: string } }>('/:id/password', async (request, reply) => {
    if (!await requireAuth(request, reply)) return

    const id = parseInt(request.params.id)

    if (request.user!.id !== id) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: '只能修改自己的密码' } })
    }

    const { currentPassword, newPassword, confirmPassword } = request.body as {
      currentPassword: string
      newPassword: string
      confirmPassword: string
    }

    if (!currentPassword || !newPassword) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION', message: '密码字段不能为空' } })
    }

    if (newPassword.length < 6) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION', message: '新密码至少需要6个字符' } })
    }

    if (newPassword !== confirmPassword) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION', message: '新密码和确认密码不匹配' } })
    }

    const user = await prisma.users.findUnique({ where: { id } })
    if (!user) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } })
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return reply.status(401).send({ success: false, error: { code: 'WRONG_PASSWORD', message: '当前密码错误' } })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.users.update({ where: { id }, data: { password: hashed, updatedAt: new Date() } })

    return reply.send({ success: true, data: { message: '密码修改成功' } })
  })

  // 删除用户（仅超级管理员）
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!await requireSuperAdmin(request, reply)) return

    const id = parseInt(request.params.id)

    if (request.user!.id === id) {
      return reply.status(400).send({ success: false, error: { code: 'FORBIDDEN', message: '不能删除自己的账户' } })
    }

    const user = await prisma.users.findUnique({ where: { id } })
    if (!user) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } })
    }

    await prisma.users.delete({ where: { id } })

    return reply.send({ success: true, data: { message: '用户删除成功' } })
  })
}

export default userRoutes
