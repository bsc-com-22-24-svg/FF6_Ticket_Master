import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchBackendAttendees, filterAttendees } from './useAttendee'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchBackendAttendees', () => {
  it('loads attendees from the backend and excludes unowned or unsold tickets', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      let body: unknown
      if (url.includes('/events/mine')) {
        body = {
          data: [{
            id: '42',
            title: 'Organizer Test Fest',
            venue: 'Test Grounds',
            startAt: '2026-12-01T18:00:00.000Z',
            status: 'PUBLISHED',
          }],
          meta: { totalPages: 1 },
        }
      } else if (url.endsWith('/events/42/sales-summary')) {
        body = { totals: { sold: 2 } }
      } else if (url.endsWith('/tickets/events/42')) {
        body = [
          { ticketNumber: 'TKT-1', ticketTypeId: 'vip', customerId: 'customer-7', customerName: 'Alex Customer', customerEmail: 'alex@example.com', status: 'ISSUED', issuedAt: '2026-11-08T10:00:00.000Z', checkedInAt: null },
          { ticketNumber: 'TKT-2', ticketTypeId: 'vip', customerId: null, status: 'ISSUED', issuedAt: '2026-11-08T10:00:00.000Z', checkedInAt: null },
          { ticketNumber: 'TKT-3', ticketTypeId: 'vip', customerId: 'customer-8', status: 'CANCELLED', issuedAt: '2026-11-08T10:00:00.000Z', checkedInAt: null },
        ]
      } else if (url.endsWith('/events/42/ticket-types')) {
        body = [{ ticketTypeId: 'vip', name: 'VIP', price: 25000 }]
      } else {
        throw new Error(`Unexpected request: ${url}`)
      }

      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
    })
    vi.stubGlobal('fetch', fetchMock)

    const attendees = await fetchBackendAttendees()

    expect(attendees).toHaveLength(1)
    expect(attendees[0]).toMatchObject({
      id: 'TKT-1',
      name: 'Alex Customer',
      email: 'alex@example.com',
      event: 'Organizer Test Fest',
      eventId: '42',
      ticketType: 'VIP',
      quantity: 1,
      amount: 25000,
      status: 'Registered',
    })
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/tickets/events/42'))).toBe(true)
    expect(filterAttendees(attendees, { search: 'alex@example.com' })).toHaveLength(1)
  })
})
