import { listTickets, type TicketRecord } from '../../lib/tickets'
import { withDelay } from '../../mocks/delay'
import type { Ticket } from './ticketTypes'

export function toTicketView(record: TicketRecord): Ticket {
  return {
    id: record.id || 'TM-UNKNOWN',
    eventTitle: record.eventName || 'Event Name Missing',
    venue: `${record.venue || 'Venue'}, ${record.city || 'City'}`,
    date: record.date || '2026-01-01',
    time: record.time || '12:00',
    ticketType: record.ticketType || 'General',
    seat: (record.ticketType || 'general').toLowerCase() === 'vip' ? 'VIP Section' : 'General Admission',
    price: record.price ?? 0,
    holder: record.holder || 'Guest',
    status: record.status || 'valid',
  }
}

export async function fetchTickets(email?: string): Promise<Ticket[]> {
  return withDelay(
    listTickets()
      .filter((t) => t.ownerEmail === email)
      .map(toTicketView),
    400,
  )
}
