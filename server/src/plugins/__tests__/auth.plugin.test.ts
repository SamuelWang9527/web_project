import { describe, it, expect, beforeAll } from 'vitest'
import Fastify from 'fastify'
import jwt from 'jsonwebtoken'
import authPlugin from '../auth.plugin'

const JWT_SECRET = 'test-secret'

async function buildTestApp() {
  process.env.JWT_SECRET = JWT_SECRET
  const app = Fastify()
  await app.register(authPlugin)
  app.get('/protected', async (request, reply) => {
    return { user: request.user }
  })
  return app
}

describe('auth plugin', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>

  beforeAll(async () => {
    app = await buildTestApp()
  })

  it('sets request.user to null when no Authorization header', async () => {
    const res = await app.inject({ method: 'GET', url: '/protected' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).user).toBeNull()
  })

  it('populates request.user with valid JWT', async () => {
    const token = jwt.sign({ id: 42, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' })
    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).user.id).toBe(42)
  })

  it('sets request.user to null for expired JWT', async () => {
    const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '-1s' })
    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).user).toBeNull()
  })

  it('sets request.user to null for malformed token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { Authorization: 'Bearer not-a-valid-jwt' },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).user).toBeNull()
  })
})
