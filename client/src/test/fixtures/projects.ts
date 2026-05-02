// client/src/test/fixtures/projects.ts
import type { Project } from '@/types/models'

export const projectFixture: Project = {
  id: 1,
  name: '测试项目',
  status: 'in_progress',
  creatorId: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export const projectsFixture: Project[] = [projectFixture]
