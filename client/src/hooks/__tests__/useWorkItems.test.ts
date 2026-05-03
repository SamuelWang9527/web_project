// client/src/hooks/__tests__/useWorkItems.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { useWorkItems } from '../useWorkItems'
import { workItemsFixture } from '@/test/fixtures/workItems'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useWorkItems', () => {
  it('returns paginated work items on success', async () => {
    const { result } = renderHook(() => useWorkItems(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual(workItemsFixture)
    expect(result.current.data?.meta?.total).toBe(1)
    expect(result.current.data?.meta?.page).toBe(1)
  })

  it('is loading initially', () => {
    const { result } = renderHook(() => useWorkItems(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('includes filters in the query key (different filters = different cache entry)', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result: r1 } = renderHook(() => useWorkItems({ status: 'todo' }), { wrapper })
    const { result: r2 } = renderHook(() => useWorkItems({ status: 'done' }), { wrapper })

    await waitFor(() => expect(r1.current.isSuccess).toBe(true))
    await waitFor(() => expect(r2.current.isSuccess).toBe(true))

    const queries = queryClient.getQueryCache().getAll()
    const keys = queries.map(q => JSON.stringify(q.queryKey))
    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(2)
  })
})
