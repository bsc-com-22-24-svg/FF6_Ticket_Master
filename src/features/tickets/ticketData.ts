import { api } from '../../lib/backend'
import { fetchBackendEvent } from '../../lib/backendEvents'
import type { TicketRecord } from '../../lib/tickets'
import type { Ticket, TicketStatus } from './ticketTypes'

interface BackendHistoryTicket {
  ticketNumber: string
  status: 'ISSUED' | 'USED' | 'CANCELLED' | 'REFUNDED'
  issuedAt: string
  event: {
    eventId: string
  }
  ticketType: {
    ticketTypeId: string
  }
  qrCodeDataUrl?: string
}

export function toTicketView(record: TicketRecord): Ticket {
  return {
    id: record.id,
    eventTitle: record.eventName,
    venue: record.venue,
    city: record.city,
    date: record.date,
    time: record.time,
    ticketType: record.ticketType,
    seat: `${record.ticketType} Admission`,
    price: record.price,
    holder: record.holder,
    status: record.status,
    purchasedAt: record.createdAt,
    qrCodeDataUrl: record.qrCodeDataUrl,
  }
}

export async function fetchTickets(userId?: string, userName = ''): Promise<Ticket[]> {
  if (!userId) return []

  const records = await api<BackendHistoryTicket[]>('/tickets/history')
  const eventIds = [...new Set(records.map((ticket) => ticket.event.eventId))]
  const events = await Promise.all(eventIds.map((id) => fetchBackendEvent(id)))
  const eventById = new Map(events.map((event) => [event.id, event]))

  return records.flatMap((record) => {
    const event = eventById.get(record.event.eventId)
    const ticketType = event?.ticketTypes.find((type) => type.id === record.ticketType.ticketTypeId)
    if (!event || !ticketType) return []

    const statusByBackend: Record<BackendHistoryTicket['status'], TicketStatus> = {
      ISSUED: 'valid',
      USED: 'used',
      CANCELLED: 'cancelled',
      REFUNDED: 'refunded',
    }
    const status = statusByBackend[record.status]

    return [{
      id: record.ticketNumber,
      eventTitle: event.title,
      venue: event.venue,
      city: event.city,
      date: event.date,
      time: event.time,
      ticketType: ticketType.name,
      seat: `${ticketType.name} Admission`,
      price: ticketType.price,
      holder: userName,
      status,
      purchasedAt: record.issuedAt,
      qrCodeDataUrl: record.qrCodeDataUrl,
    } satisfies Ticket]
  })
}
