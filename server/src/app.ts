import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import path from 'path'

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

  // 静态文件服务 - uploads
  const uploadsDir = path.join(__dirname, '../../public/uploads')
  await app.register(staticFiles, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
  })

  // 静态文件服务 - exports
  const exportsDir = path.join(__dirname, '../../public/exports')
  await app.register(staticFiles, {
    root: exportsDir,
    prefix: '/exports/',
    decorateReply: false,
  })

  // 全局错误处理
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error)
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500
    reply.status(statusCode).send({
      success: false,
      error: {
        code: (error as { code?: string }).code ?? 'INTERNAL_ERROR',
        message: error.message ?? 'Internal server error',
      },
    })
  })

  // API 路由在 Task 17 中注册

  // SPA fallback — 非 /api 路由返回前端 index.html
  const clientDistDir = path.join(__dirname, '../../../client/dist')
  await app.register(staticFiles, {
    root: clientDistDir,
    prefix: '/',
    decorateReply: false,
  })

  app.setNotFoundHandler((_request, reply) => {
    reply.sendFile('index.html', clientDistDir)
  })

  return app
}
