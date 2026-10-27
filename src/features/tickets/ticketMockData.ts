import { listTicketsForUser, type TicketRecord } from '../../lib/tickets'
import { withDelay } from '../../mocks/delay'
import type { Ticket } from './ticketTypes'

export function toTicketView(record: TicketRecord): Ticket {
  return {
    id: record.id || 'TM-UNKNOWN',
    eventTitle: record.eventName || 'Event Name Missing',
    venue: record.venue || 'Venue',
    city: record.city || 'City',
    date: record.date || '2026-01-01',
    time: record.time || '12:00',
    ticketType: record.ticketType || 'General',
    seat: (record.ticketType || 'general').toLowerCase() === 'vip' ? 'VIP Section' : 'General Admission',
    price: record.price ?? 0,
    holder: record.holder || 'Guest',
    status: record.status || 'valid',
  }
}

export async function fetchTickets(userId?: string): Promise<Ticket[]> {
  // No signed-in user means nothing to show; never fall back to every ticket.
  const records = userId ? listTicketsForUser(userId) : []
  return withDelay(records.map(toTicketView), 400)
}
