import { api } from '../../lib/backend'
import type { TicketRecord } from '../../lib/tickets'
import type { Ticket, TicketStatus } from './ticketTypes'

interface BackendHistoryTicket {
  ticketNumber: string
  eventId: string
  ticketTypeId: string
  status: 'ISSUED' | 'USED' | 'CANCELLED' | 'REFUNDED'
  issuedAt: string
  purchasedAt: string | null
  checkedInAt: string | null
  event: {
    title: string
    category: string | null
    startAt: string
    endAt: string
  }
  venue: {
    name: string
    address: string | null
    city: string | null
    country: string | null
    location: string | null
  }
  ticketType: {
    name: string
    price: number | string
  }
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

export async function fetchTickets(userId?: string, userName = ''): Promise<Ticket[]> {
  if (!userId) return []

  return (await fetchTicketRecords(userId, userName)).map(toTicketView)
}

export async function fetchTicketRecords(userId: string, userName = ''): Promise<TicketRecord[]> {
  if (!userId) return []
  const records = await api<BackendHistoryTicket[]>('/tickets/mine')

  return records.map((record) => {
    const start = new Date(record.event.startAt)
    return {
      id: record.ticketNumber,
      userId,
      eventId: record.eventId,
      eventName: record.event.title,
      date: start.toLocaleDateString('en-CA'),
      time: start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      venue: record.venue.name,
      city: record.venue.city ?? record.venue.location ?? '',
      ticketType: record.ticketType.name,
      price: Number(record.ticketType.price),
      holder: userName,
      status: TICKET_STATUS[record.status],
      createdAt: record.purchasedAt ?? record.issuedAt,
      qrCodeDataUrl: record.qrCodeDataUrl,
    } satisfies TicketRecord
  })
}
