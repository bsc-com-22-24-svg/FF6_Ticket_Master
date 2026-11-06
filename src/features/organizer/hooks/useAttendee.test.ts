// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { saveEvent, type EventInput } from '../../../lib/events'
import { DEMO_CUSTOMER_ID, issueBooking } from '../../../lib/tickets'
import { buildAttendeePurchases, filterAttendees } from './useAttendee'

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
