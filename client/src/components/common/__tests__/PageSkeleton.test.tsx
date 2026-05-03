// client/src/components/common/__tests__/PageSkeleton.test.tsx
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PageSkeleton } from '../PageSkeleton'

describe('PageSkeleton', () => {
  it('renders without crashing in list variant', () => {
    const { container } = render(<PageSkeleton variant="list" />)
    expect(container.firstChild).toBeTruthy()
  })
  it('renders without crashing in detail variant', () => {
    const { container } = render(<PageSkeleton variant="detail" />)
    expect(container.firstChild).toBeTruthy()
  })
  it('defaults to list variant', () => {
    const { container } = render(<PageSkeleton />)
    expect(container.firstChild).toBeTruthy()
  })
})
