// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import type { Event, TicketType } from '../types/event'
import { calculateTotals } from '../features/checkout/format'
import { SERVICE_FEE } from '../features/checkout/mockData'
import { BOOKINGS_KEY, issueBooking, listBookings } from './tickets'

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
    const { booking } = issueBooking({ event, ticketType, quantity: 1, holder: 'Test' })

    expect(booking.total).toBe(charged.total)
    expect(booking.total).toBe(35500)
    expect(booking.subtotal).toBe(35000)
    expect(booking.serviceFee).toBe(SERVICE_FEE)
  })

  it('equals the checkout total for several tickets', () => {
    const charged = calculateTotals(ticketType.price, 3)
    const { booking } = issueBooking({ event, ticketType, quantity: 3, holder: 'Test' })

    expect(booking.total).toBe(charged.total)
    expect(booking.subtotal).toBe(105000)
  })

  it('keeps the stored total when bookings are read back', () => {
    const { booking } = issueBooking({ event, ticketType, quantity: 2, holder: 'Test' })
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
