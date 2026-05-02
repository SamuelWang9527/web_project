// client/src/test/handlers.ts
import { http, HttpResponse } from 'msw'
import { workItemsFixture, workItemFixture } from './fixtures/workItems'
import { projectsFixture } from './fixtures/projects'
import { ticketsFixture } from './fixtures/tickets'

const paginatedMeta = { total: 1, page: 1, limit: 20, totalPages: 1 }

export const handlers = [
  http.get('/api/work-items', () =>
    HttpResponse.json({ success: true, data: workItemsFixture, meta: paginatedMeta })
  ),
  http.get('/api/work-items/:id', () =>
    HttpResponse.json({ success: true, data: workItemFixture })
  ),
  http.post('/api/work-items', () =>
    HttpResponse.json({ success: true, data: workItemFixture }, { status: 201 })
  ),
  http.put('/api/work-items/:id', () =>
    HttpResponse.json({ success: true, data: workItemFixture })
  ),
  http.delete('/api/work-items/:id', () =>
    HttpResponse.json({ success: true, data: null })
  ),
  http.get('/api/projects', () =>
    HttpResponse.json({ success: true, data: projectsFixture, meta: paginatedMeta })
  ),
  http.get('/api/tickets', () =>
    HttpResponse.json({ success: true, data: ticketsFixture, meta: paginatedMeta })
  ),
  http.get('/api/users', () =>
    HttpResponse.json({ success: true, data: [], meta: paginatedMeta })
  ),
  http.get('/api/dashboard/stats', () =>
    HttpResponse.json({ success: true, data: { total: 10, completed: 5 } })
  ),
  http.get('/api/dashboard/pending-items', () =>
    HttpResponse.json({ success: true, data: workItemsFixture, meta: paginatedMeta })
  ),
  http.get('/api/auth/me', () =>
    HttpResponse.json(null, { status: 401 })
  ),
]
