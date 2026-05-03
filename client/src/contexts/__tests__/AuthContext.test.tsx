// client/src/contexts/__tests__/AuthContext.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'
import { server } from '@/test/server'
import { http, HttpResponse } from 'msw'

function TestConsumer() {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth()
  if (isLoading) return <div data-testid="loading">loading</div>
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="has-admin">{hasRole('admin') ? 'yes' : 'no'}</span>
      <span data-testid="username">{user?.username ?? 'none'}</span>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => { localStorage.clear() })

  it('is not authenticated when no token in localStorage', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json(null, { status: 401 })))
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument())
    expect(screen.getByTestId('auth').textContent).toBe('no')
  })

  it('shows user as not having admin role when unauthenticated', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json(null, { status: 401 })))
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument())
    expect(screen.getByTestId('has-admin').textContent).toBe('no')
    expect(screen.getByTestId('username').textContent).toBe('none')
  })
})
