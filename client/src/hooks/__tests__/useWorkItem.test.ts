// client/src/hooks/__tests__/useWorkItem.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { useWorkItem } from '../useWorkItem'
import { workItemFixture } from '@/test/fixtures/workItems'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useWorkItem', () => {
  it('fetches a single work item by id', async () => {
    const { result } = renderHook(() => useWorkItem(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual(workItemFixture)
  })

  it('does not fetch when id is undefined', () => {
    const { result } = renderHook(() => useWorkItem(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isLoading).toBe(false)
  })
})
