import { api } from '../../lib/backend'
import { fetchBackendEvent } from '../../lib/backendEvents'
import type { TicketRecord } from '../../lib/tickets'
import type { Ticket, TicketStatus } from './ticketTypes'

interface BackendHistoryTicket {
  ticketNumber: string
  eventId: string
  ticketTypeId: string
  status: 'ISSUED' | 'USED' | 'CANCELLED' | 'REFUNDED'
  issuedAt: string
  checkedInAt: string | null
  qrCodeDataUrl?: string
}

const TICKET_STATUS: Record<BackendHistoryTicket['status'], TicketStatus> = {
  ISSUED: 'valid',
  USED: 'used',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
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

export async function fetchTicketRecords(userId?: string, userName = ''): Promise<TicketRecord[]> {
  if (!userId) return []
  const records = await api<BackendHistoryTicket[]>('/tickets/history')
  const eventIds = [...new Set(records.map((ticket) => ticket.eventId))]
  const events = await Promise.all(eventIds.map((id) => fetchBackendEvent(id)))
  const eventById = new Map(events.map((event) => [event.id, event]))

  return records.flatMap((record) => {
    const event = eventById.get(record.eventId)
    const ticketType = event?.ticketTypes.find((type) => type.id === record.ticketTypeId)
    if (!event || !ticketType) return []

    return [{
      id: record.ticketNumber,
      userId,
      eventId: event.id,
      eventName: event.title,
      date: event.date,
      time: event.time,
      venue: event.venue,
      city: event.city,
      ticketType: ticketType.name,
      price: ticketType.price,
      holder: userName,
      status: TICKET_STATUS[record.status],
      createdAt: record.issuedAt,
      qrCodeDataUrl: record.qrCodeDataUrl,
    } satisfies TicketRecord]
  })
}

export async function fetchTickets(userId?: string, userName = ''): Promise<Ticket[]> {
  const records = await fetchTicketRecords(userId, userName)
  return records.map(toTicketView)
}
