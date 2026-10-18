import { listBookings, type BookingRecord } from '../../../lib/tickets'
import { withDelay } from '../../../mocks/delay'
import type { Booking } from './bookingTypes'

// Bookings live in the shared store (src/lib/tickets.ts) next to the
// tickets they own, so checkout shows up here automatically.
function toBookingView(record: BookingRecord): Booking {
  return {
    id: record.id,
    eventTitle: record.eventTitle,
    venue: record.venue,
    date: record.date,
    quantity: record.quantity,
    total: record.total,
    status: record.status,
  }
}

export async function fetchBookings(): Promise<Booking[]> {
  return withDelay(
    listBookings().map(toBookingView),
    400,
  )
}
