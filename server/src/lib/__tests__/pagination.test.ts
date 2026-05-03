import { describe, it, expect } from 'vitest'
import { parsePagination, paginationMeta } from '../pagination'

describe('parsePagination', () => {
  it('returns defaults when no params given', () => {
    const result = parsePagination({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
    expect(result.skip).toBe(0)
  })

  it('parses page and limit correctly', () => {
    const result = parsePagination({ page: '3', limit: '10' })
    expect(result.page).toBe(3)
    expect(result.limit).toBe(10)
    expect(result.skip).toBe(20)
  })

  it('clamps limit to maximum of 100', () => {
    const result = parsePagination({ page: '1', limit: '999' })
    expect(result.limit).toBe(100)
  })

  it('clamps page to minimum of 1 for invalid input', () => {
    const result = parsePagination({ page: '-1', limit: '20' })
    expect(result.page).toBe(1)
  })

  it('handles non-numeric strings gracefully', () => {
    const result = parsePagination({ page: 'abc', limit: 'xyz' })
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })
})

describe('paginationMeta', () => {
  it('calculates totalPages correctly', () => {
    const meta = paginationMeta(45, 1, 20)
    expect(meta.total).toBe(45)
    expect(meta.totalPages).toBe(3)
    expect(meta.page).toBe(1)
    expect(meta.limit).toBe(20)
  })

  it('rounds totalPages up', () => {
    const meta = paginationMeta(21, 2, 20)
    expect(meta.totalPages).toBe(2)
  })

  it('returns totalPages of 0 when total is 0', () => {
    const meta = paginationMeta(0, 1, 20)
    expect(meta.totalPages).toBe(0)
  })
})
