import { useQuery } from '@tanstack/react-query'
import { getEvent } from '../../../lib/events'
import { listBookings, listTickets } from '../../../lib/tickets'
import { remainingSeats } from '../../../types/event'

export interface EventStats {
  sold: number
  capacity: number
  remaining: number
  revenue: number
  fees: number
  checkedIn: number
}

export const EMPTY_EVENT_STATS: EventStats = {
  sold: 0,
  capacity: 0,
  remaining: 0,
  revenue: 0,
  fees: 0,
  checkedIn: 0,
}

export function buildEventStats(eventId: string): EventStats {
  const event = getEvent(eventId)
  if (!event) return EMPTY_EVENT_STATS

  const sold = event.ticketTypes.reduce((sum, type) => sum + type.sold, 0)
  const capacity = event.ticketTypes.reduce((sum, type) => sum + type.capacity, 0)
  const remaining = event.ticketTypes.reduce((sum, type) => sum + remainingSeats(type), 0)
  const ticketSales = event.ticketTypes.reduce((sum, type) => sum + type.sold * type.price, 0)

  const eventTickets = listTickets().filter((ticket) => ticket.eventId === eventId)
  const eventTicketIds = new Set(eventTickets.map((ticket) => ticket.id))
  const fees = listBookings()
    .filter(
      (booking) =>
        booking.status === 'confirmed' &&
        booking.ticketIds.some((id) => eventTicketIds.has(id)),
    )
    .reduce((sum, booking) => sum + booking.serviceFee, 0)

  const checkedIn = eventTickets.filter((ticket) => ticket.status === 'used').length

  return {
    sold,
    capacity,
    remaining,
    revenue: ticketSales + fees,
    fees,
    checkedIn,
  }
}

// The same reactive source as the sales chart, so check-ins and sales show up
// without a manual refresh.
export function useEventStats(eventId?: string) {
  return useQuery({
    queryKey: ['event-stats', eventId],
    queryFn: () => buildEventStats(eventId ?? ''),
    enabled: !!eventId,
  })
}
