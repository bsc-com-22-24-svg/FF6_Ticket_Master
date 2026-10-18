import { listTickets, type TicketRecord } from '../../lib/tickets'
import { withDelay } from '../../mocks/delay'
import type { Ticket } from './ticketTypes'

// The ticket store (src/lib/tickets.ts) is the single source of truth.
// This adapts stored records to the view model the tickets pages use.
export function toTicketView(record: TicketRecord): Ticket {
  return {
    id: record.id,
    eventTitle: record.eventName,
    venue: `${record.venue}, ${record.city}`,
    date: record.date,
    time: record.time,
    ticketType: record.ticketType,
    seat: record.ticketType.toLowerCase() === 'vip' ? 'VIP Section' : 'General Admission',
    price: record.price,
    status: record.status,
  }
}

export async function fetchTickets(): Promise<Ticket[]> {
  return withDelay(
    listTickets().map(toTicketView),
    400,
  )
}
