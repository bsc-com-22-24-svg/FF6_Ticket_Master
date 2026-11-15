// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AttendeeItem } from '../Data/Attendee'
import { fetchBackendAttendees, filterAttendees } from './useAttendee'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchBackendAttendees', () => {
  it('loads sold tickets for the organizer events and excludes unowned or unsold tickets', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      let body: unknown
      if (url.includes('/events/mine')) {
        body = {
          data: [{ id: '42', title: 'Organizer Test Fest', venue: 'Test Grounds', startAt: '2026-12-01T18:00:00.000Z', status: 'PUBLISHED' }],
          meta: { totalPages: 1 },
        }
      } else if (url.endsWith('/events/42/sales-summary')) {
        body = { totals: { sold: 2 } }
      } else if (url.endsWith('/tickets/events/42')) {
        body = [
          { ticketNumber: 'TKT-1', ticketTypeId: 'vip', customerId: 'customer-7', status: 'ISSUED', issuedAt: '2026-11-08T10:00:00.000Z', checkedInAt: null },
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
      name: 'Customer #customer-7',
      event: 'Organizer Test Fest',
      eventId: '42',
      ticketType: 'VIP',
      quantity: 1,
      amount: 25000,
      status: 'Registered',
    })
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/tickets/events/42'))).toBe(true)
  })
})

const attendees = [
  { id: 'TKT-1', name: 'Chimwemwe Banda', email: 'customer@example.com', event: 'Lake of Stars', eventId: '42', ticketType: 'General', quantity: 1, amount: 35000, purchaseDate: '', purchasedAt: '2026-11-08T10:00:00.000Z', status: 'Registered' },
  { id: 'TKT-2', name: 'Tendai Phiri', email: 'tendai@example.com', event: 'Dev Summit', eventId: '43', ticketType: 'VIP', quantity: 1, amount: 50000, purchaseDate: '', purchasedAt: '2026-11-09T10:00:00.000Z', status: 'Checked In' },
] as AttendeeItem[]

describe('filterAttendees', () => {
  it('filters by customer name, email and event title', () => {
    expect(filterAttendees(attendees, { search: 'chimwemwe' })).toHaveLength(1)
    expect(filterAttendees(attendees, { search: 'customer@example.com' })).toHaveLength(1)
    expect(filterAttendees(attendees, { search: 'dev summit' })).toHaveLength(1)
    expect(filterAttendees(attendees, { search: 'no such customer' })).toHaveLength(0)
  })

  it('filters by event and ticket type', () => {
    expect(filterAttendees(attendees, { eventId: '42' })).toHaveLength(1)
    expect(filterAttendees(attendees, { eventId: '99' })).toHaveLength(0)
    expect(filterAttendees(attendees, { ticketType: 'VIP' })).toHaveLength(1)
    expect(filterAttendees(attendees, { ticketType: 'Standard' })).toHaveLength(0)
    expect(filterAttendees(attendees, { eventId: 'all', ticketType: 'all' })).toHaveLength(2)
  })
})
