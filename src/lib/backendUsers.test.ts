import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./backend', () => ({ api: vi.fn() }))

import { api } from './backend'
import { createUser, deleteUser, listUsers, setUserActive } from './backendUsers'

const apiMock = vi.mocked(api)

describe('backendUsers', () => {
  beforeEach(() => apiMock.mockReset())

  it('reads every page and maps roles and status', async () => {
    apiMock
      .mockResolvedValueOnce({
        data: [{ id: '1', name: 'A', email: 'a@x.com', role: 'ORGANIZER', isActive: true, createdAt: '2026-01-01' }],
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        data: [{ id: '2', name: 'B', email: 'b@x.com', role: 'CHECK_IN_STAFF', isActive: false, createdAt: '2026-01-02' }],
        totalPages: 2,
      })
    const users = await listUsers()
    expect(users.map((u) => [u.id, u.role, u.status])).toEqual([
      ['1', 'organizer', 'active'],
      ['2', 'staff', 'disabled'],
    ])
    expect(apiMock).toHaveBeenNthCalledWith(2, '/users?page=2&limit=100')
  })

  it('disables, deletes and creates with backend role names', async () => {
    apiMock.mockResolvedValue({})
    await setUserActive('5', false)
    await deleteUser('5')
    await createUser({ name: ' S ', email: 's@x.com', password: 'pass1234', role: 'staff', organizerId: '9' })
    expect(apiMock).toHaveBeenCalledWith('/users/5/active', { method: 'PATCH', body: { isActive: false } })
    expect(apiMock).toHaveBeenCalledWith('/users/5', { method: 'DELETE' })
    expect(apiMock).toHaveBeenCalledWith('/users', {
      method: 'POST',
      body: { name: 'S', email: 's@x.com', password: 'pass1234', role: 'CHECK_IN_STAFF', organizerId: '9' },
    })
  })
})
