import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../auth'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // 登录 — 返回 JWT token（与现有前端兼容）
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string }

    const user = await prisma.users.findUnique({ where: { username } })
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' },
      })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' },
      })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role ?? 'user' },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'] }
    )

    return reply.send({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email ?? '',
          role: user.role ?? 'user',
          avatar: user.avatar,
        },
      },
    })
  })

  // 注册
  fastify.post('/register', async (request, reply) => {
    const { username, email, password, phone } = request.body as {
      username: string
      email: string
      password: string
      phone?: string
    }

    const existing = await prisma.users.findFirst({
      where: { OR: [{ username }, ...(email ? [{ email }] : [])] },
    })
    if (existing) {
      return reply.status(409).send({
        success: false,
        error: { code: 'USER_EXISTS', message: '用户名或邮箱已存在' },
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.users.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'user',
        phone: phone ?? '',
        brand: 'EL',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return reply.status(201).send({
      success: true,
      data: { id: user.id, username: user.username, email: user.email, role: user.role },
    })
  })

  // 获取当前用户
  fastify.get('/me', async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '未登录' },
      })
    }
    const user = await prisma.users.findUnique({
      where: { id: request.user.id },
      select: {
        id: true, username: true, email: true, role: true,
        avatar: true, createdAt: true,
      },
    })
    return reply.send({ success: true, data: user })
  })

  // 登出
  fastify.post('/logout', async (_request, reply) => {
    return reply.send({ success: true, data: null })
  })
}

export default authRoutes
