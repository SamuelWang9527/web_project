// client/src/components/common/__tests__/StatusTag.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WorkItemStatusTag, WorkItemPriorityTag, TicketStatusTag } from '../StatusTag'

describe('WorkItemStatusTag', () => {
  it('renders "待处理" for todo status', () => {
    render(<WorkItemStatusTag status="todo" />)
    expect(screen.getByText('待处理')).toBeInTheDocument()
  })
  it('renders "已完成" for done status', () => {
    render(<WorkItemStatusTag status="done" />)
    expect(screen.getByText('已完成')).toBeInTheDocument()
  })
})

describe('WorkItemPriorityTag', () => {
  it('renders "紧急" for urgent priority', () => {
    render(<WorkItemPriorityTag priority="urgent" />)
    expect(screen.getByText('紧急')).toBeInTheDocument()
  })
})

describe('TicketStatusTag', () => {
  it('renders "已解决" for resolved status', () => {
    render(<TicketStatusTag status="resolved" />)
    expect(screen.getByText('已解决')).toBeInTheDocument()
  })
})
