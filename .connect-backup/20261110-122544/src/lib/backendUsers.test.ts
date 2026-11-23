import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createManagedUser,
  fetchManagedUsers,
  setManagedUserActive,
} from './backendUsers'

afterEach(() => {
  vi.unstubAllGlobals()
})

function respond(body: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })))
}

describe('fetchManagedUsers', () => {
  it('accepts a data list with root-level pagination metadata', async () => {
    respond({
      data: [{ id: 9, name: 'Admin', email: 'admin@example.com', role: 'ADMIN', isActive: true }],
      totalPages: 1,
      total: 1,
      page: 1,
    })

    await expect(fetchManagedUsers()).resolves.toEqual([{
      id: '9',
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: undefined,
      status: 'active',
    }])
  })

  it('treats a zero-page empty response as an empty user list', async () => {
    respond({ data: [], meta: { totalPages: 0 } })
    await expect(fetchManagedUsers()).resolves.toEqual([])
  })

  it('accepts an array response and maps snake-case creation dates', async () => {
    respond([{ id: '3', name: 'Member', email: 'member@example.com', role: 'ATTENDEE', created_at: '2026-01-01' }])

    await expect(fetchManagedUsers()).resolves.toMatchObject([
      { id: '3', name: 'Member', email: 'member@example.com', role: 'customer', createdAt: '2026-01-01' },
    ])
  })

  it('reports an invalid response envelope instead of hiding it', async () => {
    respond({ results: [] })
    await expect(fetchManagedUsers()).rejects.toThrow('The backend returned an invalid user list.')
  })

  it('creates users through the documented backend endpoint', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    await createManagedUser({
      name: ' New User ',
      email: ' new@example.com ',
      password: 'long-password',
      role: 'organizer',
    })

    expect(fetchMock).toHaveBeenCalledWith('/be/users', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        name: 'New User',
        email: 'new@example.com',
        password: 'long-password',
        role: 'ORGANIZER',
      }),
    }))
  })

  it('updates account status with the backend isActive field', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await setManagedUserActive('42', false)

    expect(fetchMock).toHaveBeenCalledWith('/be/users/42/status', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    }))
  })
})
