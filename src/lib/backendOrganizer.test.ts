import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cancelOrganizerEvent,
  createOrganizerEvent,
  formatEventDate,
  listMyEvents,
  publishEvent,
  restoreOrganizerEvent,
  totalCapacity,
  type NewEventInput,
} from './backendOrganizer'

type Route = (url: string, init?: RequestInit) => unknown

function stubBackend(route: Route) {
  const calls: { url: string; method: string; body: unknown }[] = []
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined })
    const result = route(url, init)
    if (result instanceof Response) return result
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
  vi.stubGlobal('fetch', fetchMock)
  return calls
}

const INPUT: NewEventInput = {
  name: ' Sample Gig ',
  description: 'A sample event',
  venue: 'Bingu',
  location: 'Lilongwe, Malawi',
  startAt: '2026-12-20T18:00:00.000Z',
  endAt: '2026-12-20T22:00:00.000Z',
  ticketTypes: [
    { name: 'General', price: 5000, quantity: 80 },
    { name: 'VIP', price: 15000, quantity: 20 },
  ],
  status: 'Published',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('totalCapacity', () => {
  it('adds up the ticket types', () => {
    expect(totalCapacity(INPUT.ticketTypes)).toBe(100)
  })
})

describe('formatEventDate', () => {
  it('returns the original text when the date is not valid', () => {
    expect(formatEventDate('not a date')).toBe('not a date')
  })
})

describe('createOrganizerEvent', () => {
  it('creates the event, then publishes it, then generates its tickets', async () => {
    const calls = stubBackend((url) => (url.endsWith('/events') ? { id: '7' } : {}))
    const result = await createOrganizerEvent(INPUT)
    expect(result.id).toBe('7')
    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      'POST /be/events',
      'POST /be/events/7/publish',
      'POST /be/tickets/events/7/generate',
    ])
    expect(calls[0].body).toMatchObject({
      title: 'Sample Gig',
      capacity: 100,
      ticketTypes: [
        { name: 'General', price: 5000, currency: 'MWK', quantity: 80, perOrderLimit: 10 },
        { name: 'VIP', price: 15000, currency: 'MWK', quantity: 20, perOrderLimit: 10 },
      ],
    })
  })

  it('only saves a draft when the status is Draft', async () => {
    const calls = stubBackend(() => ({ id: '8' }))
    await createOrganizerEvent({ ...INPUT, status: 'Draft' })
    expect(calls).toHaveLength(1)
  })
})

describe('publishEvent', () => {
  it('tells the organizer to retry when tickets could not be generated', async () => {
    stubBackend((url) =>
      url.includes('/generate')
        ? new Response(JSON.stringify({ message: 'event has no active ticket types' }), { status: 409 })
        : {},
    )
    await expect(publishEvent('7')).rejects.toThrow(/published but its tickets could not be created/)
  })
})

describe('listMyEvents', () => {
  it('maps backend events and reads tickets sold from the sales summary', async () => {
    stubBackend((url) => {
      if (url.includes('/events/mine')) {
        return {
          data: [
            { id: '1', title: 'One', venue: 'A', startAt: '2026-12-20T18:00:00.000Z', status: 'PUBLISHED' },
            { id: '2', title: 'Two', venue: 'B', startAt: '2026-12-21T18:00:00.000Z', status: 'DRAFT' },
            { id: '3', title: 'Three', venue: 'C', startAt: '2026-12-22T18:00:00.000Z', status: 'CANCELLED', publishedAt: '2026-11-01T10:00:00.000Z' },
          ],
          meta: { totalPages: 1 },
        }
      }
      if (url.includes('/events/1/')) return { totals: { sold: 12 } }
      return new Response('{}', { status: 500 })
    })
    const events = await listMyEvents()
    expect(events.map((event) => [event.name, event.status, event.ticketsSold])).toEqual([
      ['One', 'Published', 12],
      ['Two', 'Draft', 0],
      ['Three', 'Cancelled', 0],
    ])
    expect(events[2].restoreStatus).toBe('Published')
  })
})

describe('cancelOrganizerEvent', () => {
  it('marks the event cancelled using the documented PATCH endpoint', async () => {
    const calls = stubBackend(() => ({}))
    await cancelOrganizerEvent('7')
    expect(`${calls[0].method} ${calls[0].url}`).toBe('PATCH /be/events/7')
    expect(calls[0].body).toEqual({ status: 'CANCELLED' })
  })
})

describe('restoreOrganizerEvent', () => {
  it('restores a previously published event through the update endpoint', async () => {
    const calls = stubBackend(() => ({}))
    await restoreOrganizerEvent('7', 'PUBLISHED')
    expect(`${calls[0].method} ${calls[0].url}`).toBe('PATCH /be/events/7')
    expect(calls[0].body).toEqual({ status: 'PUBLISHED' })
  })
})
