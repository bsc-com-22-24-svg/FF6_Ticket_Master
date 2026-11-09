// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveEvent, type EventInput } from '../../../lib/events'
import { DEMO_CUSTOMER_ID, issueBooking } from '../../../lib/tickets'
import { buildAttendeePurchases, fetchBackendAttendees, filterAttendees } from './useAttendee'

const ORGANIZER = { id: 'u-2', name: 'Nyasa Events' }

const eventInput: EventInput = {
  title: 'Organizer Test Fest',
  description: 'A test event',
  category: 'Festivals',
  city: 'Lilongwe',
  venue: 'Test Grounds',
  date: '2026-12-01',
  time: '18:00',
  organizer: 'Nyasa Events',
  ownerId: ORGANIZER.id,
  image: '',
  status: 'Published',
  ticketTypes: [
    { id: 'general', name: 'General', price: 1000, capacity: 10, sold: 0 },
    { id: 'vip', name: 'VIP', price: 5000, capacity: 5, sold: 0 },
  ],
}

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

describe('buildAttendeePurchases', () => {
  it('only returns purchases for the organizer own events', () => {
    const purchases = buildAttendeePurchases(ORGANIZER)

    expect(purchases).toHaveLength(1)
    expect(purchases[0]).toMatchObject({
      name: 'Chimwemwe Banda',
      email: 'customer@example.com',
      event: 'Lake of Stars Live',
      eventId: 'lake-of-stars',
      ticketType: 'General',
      quantity: 1,
      amount: 35500,
      status: 'Registered',
    })
    expect(purchases[0].purchasedAt).toBeTruthy()
    expect(purchases[0].purchaseDate).not.toBe('Unknown')
  })

  it('returns nothing without a signed-in organizer or owned events', () => {
    expect(buildAttendeePurchases(null)).toEqual([])
    expect(buildAttendeePurchases({ id: 'u-3', name: 'Gate Staff' })).toEqual([])
  })

  it('includes purchases for newly created events owned by the organizer', () => {
    const event = saveEvent(eventInput)
    issueBooking({
      userId: DEMO_CUSTOMER_ID,
      event,
      ticketType: event.ticketTypes[1],
      quantity: 2,
      holder: 'Chimwemwe Banda',
    })

    const purchases = buildAttendeePurchases(ORGANIZER)
    const created = purchases.find((purchase) => purchase.eventId === event.id)

    expect(created).toMatchObject({
      ticketType: 'VIP',
      quantity: 2,
      amount: 10500,
    })
  })

  it('does not leak another organizer event into the results', () => {
    const event = saveEvent({ ...eventInput, ownerId: 'u-4' })
    issueBooking({
      userId: DEMO_CUSTOMER_ID,
      event,
      ticketType: event.ticketTypes[0],
      quantity: 1,
      holder: 'Chimwemwe Banda',
    })

    const purchases = buildAttendeePurchases(ORGANIZER)
    expect(purchases.some((purchase) => purchase.eventId === event.id)).toBe(false)
  })
})

describe('filterAttendees', () => {
  it('filters by customer name, email and event title', () => {
    const purchases = buildAttendeePurchases(ORGANIZER)

    expect(filterAttendees(purchases, { search: 'chimwemwe' })).toHaveLength(1)
    expect(filterAttendees(purchases, { search: 'customer@example.com' })).toHaveLength(1)
    expect(filterAttendees(purchases, { search: 'lake of stars' })).toHaveLength(1)
    expect(filterAttendees(purchases, { search: 'no such customer' })).toHaveLength(0)
  })

  it('filters by event and ticket type', () => {
    const purchases = buildAttendeePurchases(ORGANIZER)

    expect(filterAttendees(purchases, { eventId: 'lake-of-stars' })).toHaveLength(1)
    expect(filterAttendees(purchases, { eventId: 'dev-summit' })).toHaveLength(0)
    expect(filterAttendees(purchases, { ticketType: 'General' })).toHaveLength(1)
    expect(filterAttendees(purchases, { ticketType: 'VIP' })).toHaveLength(0)
    expect(filterAttendees(purchases, { eventId: 'all', ticketType: 'all' })).toHaveLength(1)
  })
})
