import 'dotenv/config'
import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import compress from '@fastify/compress'
import path from 'path'

import authPlugin from './plugins/auth.plugin'
import authRoutes from './routes/auth'
import projectRoutes from './routes/projects'
import userRoutes from './routes/users'
import workItemRoutes from './routes/work-items/index'
import attachmentRoutes from './routes/work-items/attachments'
import commentRoutes from './routes/work-items/comments'
import ticketRoutes from './routes/tickets'
import dashboardRoutes from './routes/dashboard'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'production',
  })

  // CORS
  await app.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://pipecode.asia']
      : true,
    credentials: true,
  })

  // Multipart (文件上传)
  await app.register(multipart, {
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE ?? '20971520'), // 20MB
    },
  })

  // Compression (gzip)
  await app.register(compress, {
    global: true,
    threshold: 1024,
    encodings: ['gzip', 'deflate'],
  })

  // Auth plugin（JWT 验证，注入 request.user）
  await app.register(authPlugin)

  // API 路由
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(projectRoutes, { prefix: '/api/projects' })
  await app.register(userRoutes, { prefix: '/api/users' })
  await app.register(workItemRoutes, { prefix: '/api/work-items' })
  await app.register(attachmentRoutes, { prefix: '/api/work-items' })
  await app.register(commentRoutes, { prefix: '/api/work-items' })
  await app.register(ticketRoutes, { prefix: '/api/tickets' })
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' })

  // 全局错误处理
  app.setErrorHandler((error: Error & { statusCode?: number; code?: string }, _request, reply) => {
    app.log.error(error)
    const statusCode = error.statusCode ?? 500
    reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        message: error.message ?? 'Internal server error',
      },
    })
  })

  // 静态文件服务 - uploads（首次注册 decorateReply 默认为 true，使 reply.sendFile 可用）
  const uploadsDir = path.join(__dirname, '../public/uploads')
  await app.register(staticFiles, {
    root: uploadsDir,
    prefix: '/uploads/',
  })

  // 静态文件服务 - exports
  const exportsDir = path.join(__dirname, '../public/exports')
  await app.register(staticFiles, {
    root: exportsDir,
    prefix: '/exports/',
    decorateReply: false,
  })

  // SPA fallback — 非 /api 路由返回前端 index.html (__dirname/../.. = project root)
  const clientDistDir = path.join(__dirname, '../../client/dist')
  await app.register(staticFiles, {
    root: clientDistDir,
    prefix: '/',
    decorateReply: false,
  })

  app.setNotFoundHandler((request, reply) => {
    const pathOnly = request.url.split('?')[0] ?? request.url
    if (pathOnly.startsWith('/api')) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '接口不存在' },
      })
    }
    return reply.sendFile('index.html', clientDistDir)
  })

  return app
}
