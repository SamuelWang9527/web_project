// client/src/components/common/__tests__/StatusTag.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WorkItemStatusTag, WorkItemPriorityTag, TicketStatusTag } from '../StatusTag'

describe('WorkItemStatusTag', () => {
  it('renders "待处理"', () => {
    render(<WorkItemStatusTag status="待处理" />)
    expect(screen.getByText('待处理')).toBeInTheDocument()
  })
  it('renders "已完成"', () => {
    render(<WorkItemStatusTag status="已完成" />)
    expect(screen.getByText('已完成')).toBeInTheDocument()
  })
})

describe('WorkItemPriorityTag', () => {
  it('renders "紧急"', () => {
    render(<WorkItemPriorityTag priority="紧急" />)
    expect(screen.getByText('紧急')).toBeInTheDocument()
  })
})

describe('TicketStatusTag', () => {
  it('renders "已解决" for 已完成 status', () => {
    render(<TicketStatusTag status="已完成" />)
    expect(screen.getByText('已解决')).toBeInTheDocument()
  })
})
