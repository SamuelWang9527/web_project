// client/src/test/fixtures/workItems.ts
import type { WorkItem } from '@/types/models'

export const workItemFixture: WorkItem = {
  id: 1,
  title: '测试工作项',
  status: 'todo',
  priority: 'medium',
  projectId: 1,
  creatorId: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export const workItemsFixture: WorkItem[] = [workItemFixture]
