import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/backend', () => ({
  USE_BACKEND: true,
  api: vi.fn(),
  setToken: vi.fn(),
}))

import { api, setToken } from '../../lib/backend'
import { getUser, loginRequest, registerRequest } from './authStore'

const mockApi = vi.mocked(api)
const mockSetToken = vi.mocked(setToken)

function tokenFor(payload: { sub: string; email: string; role: string }) {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`
}

describe('backend authentication', () => {
  beforeEach(() => {
    localStorage.clear()
    mockApi.mockReset()
    mockSetToken.mockReset()
  })

  it('builds the session from the JWT because login returns only a token', async () => {
    mockApi.mockResolvedValueOnce({
      accessToken: tokenFor({ sub: '12', email: 'organizer@example.com', role: 'ORGANIZER' }),
      tokenType: 'Bearer',
    })

    const user = await loginRequest('organizer@example.com', 'password123')

    expect(mockApi).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { email: 'organizer@example.com', password: 'password123' },
    })
    expect(mockSetToken).toHaveBeenCalledTimes(1)
    expect(user).toMatchObject({
      id: '12',
      name: 'organizer',
      email: 'organizer@example.com',
      role: 'organizer',
    })
    expect(getUser()).toEqual(user)
  })

  it('keeps the name supplied during registration', async () => {
    mockApi.mockResolvedValueOnce({
      accessToken: tokenFor({ sub: '13', email: 'new@example.com', role: 'ATTENDEE' }),
      tokenType: 'Bearer',
    })

    const user = await registerRequest('New Customer', 'new@example.com', 'password123')

    expect(mockApi).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: {
        name: 'New Customer',
        email: 'new@example.com',
        password: 'password123',
        role: 'ATTENDEE',
      },
    })
    expect(user).toMatchObject({
      id: '13',
      name: 'New Customer',
      email: 'new@example.com',
      role: 'customer',
    })
  })
})
