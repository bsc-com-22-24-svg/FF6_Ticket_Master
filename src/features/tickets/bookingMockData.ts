import { listBookings, listTickets, type BookingRecord } from '../../lib/tickets'
import { withDelay } from '../../mocks/delay'
import type { Booking } from './bookingTypes'

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

export async function fetchBookings(email?: string): Promise<Booking[]> {
  const allTickets = listTickets()
  return withDelay(
    listBookings()
      .filter((b) =>
        b.ticketIds.some((id) => allTickets.find((t) => t.id === id)?.ownerEmail === email)
      )
      .map(toBookingView),
    400,
  )
}
