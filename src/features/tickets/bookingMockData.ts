import { listBookingsForUser, type BookingRecord } from '../../lib/tickets'
import { withDelay } from '../../mocks/delay'
import type { Booking } from './bookingTypes'

function toBookingView(record: BookingRecord): Booking {
  return {
    id: record.id,
    eventTitle: record.eventTitle,
    venue: record.venue,
    date: record.date,
    quantity: record.quantity,
    subtotal: record.subtotal,
    serviceFee: record.serviceFee,
    total: record.total,
    status: record.status,
  }
}

export async function fetchBookings(userId?: string): Promise<Booking[]> {
  // No signed-in user means nothing to show; never fall back to every booking.
  const records = userId ? listBookingsForUser(userId) : []
  return withDelay(records.map(toBookingView), 400)
}

