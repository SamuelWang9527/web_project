// client/src/hooks/__tests__/useWorkItemMutations.test.ts
import { renderHook, act, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'
import { useCreateWorkItem, useUpdateWorkItem, useDeleteWorkItem } from '../useWorkItemMutations'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  }
}

describe('useCreateWorkItem', () => {
  it('calls the create API and invalidates work-items cache on success', async () => {
    const { queryClient, wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateWorkItem(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ title: '新工作项', status: 'todo', priority: 'medium' } as any)
    })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['work-items'] })
    )
  })
})

describe('useUpdateWorkItem', () => {
  it('invalidates both list and detail queries on success', async () => {
    const { queryClient, wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateWorkItem(1), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ title: '更新后标题' } as any)
    })

    const calledKeys = invalidateSpy.mock.calls.map(c => JSON.stringify((c[0] as any)?.queryKey))
    expect(calledKeys).toContain(JSON.stringify(['work-items']))
    expect(calledKeys).toContain(JSON.stringify(['work-items', 1]))
  })
})

describe('useDeleteWorkItem', () => {
  it('invalidates work-items cache after deletion', async () => {
    const { queryClient, wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteWorkItem(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(1)
    })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['work-items'] })
    )
  })
})
