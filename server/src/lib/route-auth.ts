import type { FastifyReply, FastifyRequest } from 'fastify'

/** 未登录时回复 401；已登录返回 true */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<boolean> {
  if (!request.user) {
    await reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '未登录' },
    })
    return false
  }
  return true
}

/** 非 admin / super_admin 时回复 403；否则返回 true */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<boolean> {
  if (!request.user || !['admin', 'super_admin'].includes(request.user.role)) {
    await reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: '权限不足' },
    })
    return false
  }
  return true
}

/** 非 super_admin 时回复 403；否则返回 true */
export async function requireSuperAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<boolean> {
  if (!request.user || request.user.role !== 'super_admin') {
    await reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: '权限不足' },
    })
    return false
  }
  return true
}
