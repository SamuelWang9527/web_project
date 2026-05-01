import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import jwt from 'jsonwebtoken'

interface JwtPayload {
  id: number
  username: string
  role: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: number
      username: string
      email: string
      role: string
    } | null
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('user', null)

  fastify.addHook('preHandler', async (request) => {
    try {
      const authHeader = request.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        request.user = null
        return
      }
      const token = authHeader.slice(7)
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
      request.user = {
        id: payload.id,
        username: payload.username,
        email: '',
        role: payload.role,
      }
    } catch {
      request.user = null
    }
  })
}

export default fp(authPlugin)
