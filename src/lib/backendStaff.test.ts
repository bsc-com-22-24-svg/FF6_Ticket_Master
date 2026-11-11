import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  assignStaffEvents,
  createStaff,
  listStaff,
  removeStaff,
  setStaffActive,
} from './backendStaff'

const STAFF = {
  staffId: '7',
  name: 'Gate One',
  email: 'gate@example.com',
  role: 'CHECK_IN_STAFF',
  isActive: true,
  createdAt: '2026-11-10T10:00:00.000Z',
  events: [{ eventId: '2', title: 'Staff Test Event' }],
}

function stubResponse(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => new Response(
    body === undefined ? null : JSON.stringify(body),
    { status, headers: { 'Content-Type': 'application/json' } },
  ))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('backend staff API', () => {
  it('lists the organizer staff with their assigned events', async () => {
    const fetchMock = stubResponse([STAFF])

    await expect(listStaff()).resolves.toEqual([STAFF])

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/be/organizers/me/staff')
    expect(init.method).toBe('GET')
  })

  it('creates a staff account with trimmed details', async () => {
    const fetchMock = stubResponse(STAFF, 201)

    await createStaff({ name: ' Gate One ', email: ' gate@example.com ', password: 'password123' })

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/be/organizers/me/staff')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({
      name: 'Gate One',
      email: 'gate@example.com',
      password: 'password123',
    })
  })

  it('replaces a staff member event assignments', async () => {
    const fetchMock = stubResponse(STAFF)

    await assignStaffEvents('7', ['2', '3'])

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/be/organizers/me/staff/7/events')
    expect(init.method).toBe('PUT')
    expect(JSON.parse(String(init.body))).toEqual({ eventIds: ['2', '3'] })
  })

  it('enables or disables a staff account', async () => {
    const fetchMock = stubResponse({ ...STAFF, isActive: false })

    await setStaffActive('7', false)

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/be/organizers/me/staff/7/active')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(String(init.body))).toEqual({ isActive: false })
  })

  it('removes a staff member', async () => {
    const fetchMock = stubResponse(undefined, 204)

    await expect(removeStaff('7')).resolves.toBeUndefined()

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/be/organizers/me/staff/7')
    expect(init.method).toBe('DELETE')
  })
})
