import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, setToken } from '../../lib/backend'

vi.mock('../../lib/backend', () => ({
  api: vi.fn(),
  setToken: vi.fn(),
}))

import { loginRequest, logoutRequest, registerRequest } from './authStore'

const apiMock = vi.mocked(api)

function jwtWithClaims(claims: Record<string, unknown>): string {
  const payload = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `header.${payload}.signature`
}

describe('backend authentication', () => {
  beforeEach(() => {
    localStorage.clear()
    apiMock.mockReset()
    vi.mocked(setToken).mockReset()
  })

  it('creates a session from the backend login response', async () => {
    apiMock.mockResolvedValue({
      accessToken: 'backend-token',
      user: { id: '42', name: 'Customer One', email: 'customer@example.com', role: 'ATTENDEE' },
    })

    await expect(loginRequest(' customer@example.com ', 'secret123')).resolves.toEqual({
      id: '42',
      name: 'Customer One',
      email: 'customer@example.com',
      role: 'customer',
    })
    expect(apiMock).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { email: 'customer@example.com', password: 'secret123' },
    })
    expect(setToken).toHaveBeenCalledWith('backend-token')
  })

  it('sends registration to the backend with the requested role', async () => {
    apiMock.mockResolvedValue({
      accessToken: 'organizer-token',
      user: { id: '43', name: 'Organizer One', email: 'organizer@example.com', role: 'ORGANIZER' },
    })

    await expect(registerRequest(' Organizer One ', ' organizer@example.com ', 'secret123', 'organizer'))
      .resolves.toMatchObject({ id: '43', role: 'organizer' })
    expect(apiMock).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: {
        name: 'Organizer One',
        email: 'organizer@example.com',
        password: 'secret123',
        role: 'ORGANIZER',
      },
    })
  })

  it('accepts a flat user and snake-case token in the backend registration response', async () => {
    apiMock.mockResolvedValue({
      access_token: 'organizer-token',
      id: 44,
      name: 'Organizer Two',
      email: 'organizer2@example.com',
      role: 'ORGANIZER',
    })

    await expect(registerRequest('Organizer Two', 'organizer2@example.com', 'secret123', 'organizer'))
      .resolves.toEqual({
        id: '44',
        name: 'Organizer Two',
        email: 'organizer2@example.com',
        role: 'organizer',
      })
    expect(setToken).toHaveBeenCalledWith('organizer-token')
  })

  it('builds the session from identity claims when auth returns only a JWT and token type', async () => {
    apiMock.mockResolvedValue({
      accessToken: jwtWithClaims({ sub: '9', email: 'admin@example.com', role: 'ADMIN' }),
      tokenType: 'Bearer',
    })

    await expect(loginRequest('admin@example.com', 'secret123')).resolves.toEqual({
      id: '9',
      name: 'admin@example.com',
      email: 'admin@example.com',
      role: 'admin',
    })
    expect(setToken).toHaveBeenCalledWith(expect.stringContaining('.'))
  })

  it('shows a clear error when neither the response nor token has account claims', async () => {
    apiMock.mockResolvedValue({ accessToken: 'opaque-token', tokenType: 'Bearer' })

    await expect(registerRequest('Customer One', 'customer@example.com', 'secret123'))
      .rejects.toThrow('The backend did not return the account details required to start a session.')
    expect(localStorage.getItem('tm_user')).toBeNull()
    expect(setToken).not.toHaveBeenCalled()
  })

  it('clears only the saved backend session on logout', () => {
    localStorage.setItem('tm_user', JSON.stringify({ id: '42' }))
    logoutRequest()
    expect(localStorage.getItem('tm_user')).toBeNull()
    expect(setToken).toHaveBeenCalledWith(null)
  })
})
