// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import type { Event, TicketType } from '../types/event'
import { calculateTotals } from '../features/checkout/format'
import { SERVICE_FEE } from '../features/checkout/mockData'
import {
  BOOKINGS_KEY,
  DEMO_CUSTOMER_ID,
  TICKETS_KEY,
  issueBooking,
  listBookings,
  listBookingsForUser,
  listTickets,
  listTicketsForUser,
} from './tickets'

const event = {
  id: 'evt-test',
  title: 'Test Concert',
  date: '2026-11-14',
  time: '18:00',
  venue: 'Test Venue',
  city: 'Blantyre',
} as unknown as Event

const ticketType = { id: 'general', name: 'General', price: 35000 } as unknown as TicketType

describe('booking total', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('equals the checkout total for one ticket', () => {
    const charged = calculateTotals(ticketType.price, 1)
    const { booking } = issueBooking({
      userId: 'u-test',
      event,
      ticketType,
      quantity: 1,
      holder: 'Test',
    })

    expect(booking.total).toBe(charged.total)
    expect(booking.total).toBe(35500)
    expect(booking.subtotal).toBe(35000)
    expect(booking.serviceFee).toBe(SERVICE_FEE)
  })

  it('equals the checkout total for several tickets', () => {
    const charged = calculateTotals(ticketType.price, 3)
    const { booking } = issueBooking({
      userId: 'u-test',
      event,
      ticketType,
      quantity: 3,
      holder: 'Test',
    })

    expect(booking.total).toBe(charged.total)
    expect(booking.subtotal).toBe(105000)
  })

  it('keeps the stored total when bookings are read back', () => {
    const { booking } = issueBooking({
      userId: 'u-test',
      event,
      ticketType,
      quantity: 2,
      holder: 'Test',
    })
    const saved = listBookings().find((b) => b.id === booking.id)
    expect(saved?.total).toBe(booking.total)
  })

  it('gives older saved bookings a breakdown instead of undefined', () => {
    window.localStorage.setItem(
      BOOKINGS_KEY,
      JSON.stringify([
        {
          id: 'BK-OLD',
          eventTitle: 'Old Event',
          venue: 'Old Venue',
          date: '2026-09-12',
          quantity: 1,
          total: 35500,
          status: 'confirmed',
          ticketIds: [],
        },
      ]),
    )
    const [old] = listBookings()
    expect(old.serviceFee).toBe(SERVICE_FEE)
    expect(old.subtotal).toBe(35000)
    expect(old.total).toBe(35500)
  })
})

describe('ticket ownership', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows nothing to a brand-new customer', () => {
    expect(listTicketsForUser('u-new')).toEqual([])
    expect(listBookingsForUser('u-new')).toEqual([])
  })

  it('keeps the seeded demo data for the demo customer', () => {
    expect(listTicketsForUser(DEMO_CUSTOMER_ID).map((ticket) => ticket.id)).toEqual(
      expect.arrayContaining(['TM-2026-004871', 'TM-2026-002540', 'TM-2026-009999']),
    )
    expect(listBookingsForUser(DEMO_CUSTOMER_ID).length).toBeGreaterThan(0)
  })

  it('stamps the buyer id on the booking and every ticket', () => {
    const { booking, tickets } = issueBooking({
      userId: 'u-buyer',
      event,
      ticketType,
      quantity: 2,
      holder: 'Buyer',
    })

    expect(booking.userId).toBe('u-buyer')
    expect(booking.createdAt).toBeTruthy()
    expect(booking.eventId).toBe(event.id)
    expect(tickets).toHaveLength(2)
    expect(tickets.every((ticket) => ticket.userId === 'u-buyer')).toBe(true)

    const ownedTickets = listTicketsForUser('u-buyer')
    expect(ownedTickets).toHaveLength(2)
    expect(ownedTickets.every((ticket) => ticket.id.startsWith('TM-2026-'))).toBe(true)

    const ownedBookings = listBookingsForUser('u-buyer')
    expect(ownedBookings).toHaveLength(1)
    expect(ownedBookings[0].id).toBe(booking.id)
  })

  it('separates two accounts on the same browser', () => {
    issueBooking({ userId: 'u-a', event, ticketType, quantity: 1, holder: 'A' })
    issueBooking({ userId: 'u-b', event, ticketType, quantity: 3, holder: 'B' })

    expect(listTicketsForUser('u-a')).toHaveLength(1)
    expect(listTicketsForUser('u-b')).toHaveLength(3)
    expect(listBookingsForUser('u-a')).toHaveLength(1)
    expect(listBookingsForUser('u-b')).toHaveLength(1)
  })

  it('keeps unscoped access for staff and admin', () => {
    issueBooking({ userId: 'u-buyer', event, ticketType, quantity: 1, holder: 'Buyer' })

    const all = listTickets()
    expect(all).toHaveLength(listTicketsForUser(DEMO_CUSTOMER_ID).length + 1)
    expect(all.some((ticket) => ticket.userId === 'u-buyer')).toBe(true)
    expect(all.some((ticket) => ticket.userId === DEMO_CUSTOMER_ID)).toBe(true)
  })

  it('back-fills userId on legacy records that stored an owner email', () => {
    window.localStorage.setItem(
      TICKETS_KEY,
      JSON.stringify([
        {
          id: 'TM-OLD-1',
          eventId: event.id,
          eventName: event.title,
          date: event.date,
          time: event.time,
          venue: event.venue,
          city: event.city,
          ticketType: 'General',
          price: 35000,
          holder: 'Legacy',
          ownerEmail: 'customer@example.com',
          status: 'valid',
        },
      ]),
    )

    const legacy = listTicketsForUser(DEMO_CUSTOMER_ID)
    expect(legacy.map((ticket) => ticket.id)).toContain('TM-OLD-1')
    expect(legacy[0].userId).toBe(DEMO_CUSTOMER_ID)
  })

  it('migrates purchases from the pre-v2 storage keys', () => {
    window.localStorage.setItem(
      'tm.ticket-master.tickets',
      JSON.stringify([
        {
          id: 'TM-MIGRATED-1',
          eventId: event.id,
          eventName: event.title,
          date: event.date,
          time: event.time,
          venue: event.venue,
          city: event.city,
          ticketType: 'General',
          price: 35000,
          holder: 'Legacy',
          ownerEmail: 'customer@example.com',
          status: 'valid',
        },
      ]),
    )

    const tickets = listTicketsForUser(DEMO_CUSTOMER_ID)
    expect(tickets.map((ticket) => ticket.id)).toContain('TM-MIGRATED-1')
    expect(window.localStorage.getItem('tm.ticket-master.tickets')).toBeNull()
  })

  it('seeds the demo tickets when an old empty store is found', () => {
    window.localStorage.setItem('tm.ticket-master.tickets', '[]')
    expect(listTicketsForUser(DEMO_CUSTOMER_ID)).toHaveLength(3)
  })
})
