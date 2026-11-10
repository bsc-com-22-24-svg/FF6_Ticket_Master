import type { Event, TicketType } from '../types/event'
import type { TicketRecord, TicketValidationResult } from './tickets'
import { api } from './backend'

// Endpoints and response shapes from the ticket service. The backend owns ticket
// issuance, the secret QR token and the single-use check-in state.

export interface BackendPurchasedTicket {
  ticketNumber: string
  qrCodeDataUrl: string
  status: string
}

export interface BackendScanDetails {
  ticketNumber?: string
  ticketType?: string
  eventTitle?: string
  checkedInAt?: string | null
  customer?: { name: string; email: string } | null
}

export interface BackendValidationResponse {
  accepted: boolean
  reason: string | null
  ticketId: string | null
  eventId: string | null
  validatedAt: string | null
  details?: BackendScanDetails | null
}

// A backend QR code contains the secret UUID. Accept the raw value as well as
// older TICKET:<id>.<tag> strings so manually pasted codes still work.
export function extractQrToken(raw: string): string {
  const cleaned = raw.trim().replace(/^TICKET:/i, '')
  const dot = cleaned.lastIndexOf('.')
  return (dot === -1 ? cleaned : cleaned.slice(0, dot)).trim()
}

export function purchaseBackendTicket(
  eventId: string,
  ticketTypeId: string,
  txRef?: string,
): Promise<BackendPurchasedTicket> {
  return api<BackendPurchasedTicket>('/tickets/purchase', {
    method: 'POST',
    body: { eventId, ticketTypeId, ...(txRef ? { txRef } : {}) },
  })
}

export function validateBackendTicket(
  rawCode: string,
  eventId: string,
): Promise<BackendValidationResponse> {
  const qrToken = extractQrToken(rawCode)
  if (!qrToken) {
    return Promise.reject(new Error('Enter or scan a ticket QR code.'))
  }
  return api<BackendValidationResponse>('/tickets/validate', {
    method: 'POST',
    body: { qrToken, ...(eventId ? { eventId } : {}) },
  })
}

export function backendTicketToRecord(
  purchased: BackendPurchasedTicket,
  input: {
    userId: string
    event: Event
    ticketType: TicketType
    holder: string
  },
): TicketRecord {
  const { userId, event, ticketType, holder } = input
  return {
    id: purchased.ticketNumber,
    userId,
    eventId: event.id,
    eventName: event.title,
    date: event.date,
    time: event.time,
    venue: event.venue,
    city: event.city,
    ticketType: ticketType.name,
    price: ticketType.price,
    holder: holder.trim() || 'Guest',
    status: purchased.status === 'USED' ? 'used' : 'valid',
    createdAt: new Date().toISOString(),
    qrCodeDataUrl: purchased.qrCodeDataUrl,
  }
}

export function backendValidationToResult(
  response: BackendValidationResponse,
): TicketValidationResult {
  const details = response.details
  const ticketNumber = details?.ticketNumber ?? response.ticketId ?? 'This ticket'

  if (response.accepted) {
    const type = details?.ticketType ? ` · ${details.ticketType}` : ''
    return {
      status: 'valid',
      title: 'Valid',
      message: `${ticketNumber}${type} · admitted, attendance recorded.`,
    }
  }

  switch (response.reason) {
    case 'ALREADY_USED':
      return {
        status: 'used',
        title: 'Already used',
        message: `${ticketNumber} has already been admitted and cannot be accepted again.`,
      }
    case 'WRONG_EVENT':
      return {
        status: 'wrong_event',
        title: 'Wrong event',
        message: `${ticketNumber} is for ${details?.eventTitle ?? 'a different event'}, not this event.`,
      }
    case 'CANCELLED':
      return {
        status: 'invalid',
        title: 'Cancelled ticket',
        message: `${ticketNumber} has been cancelled and cannot be admitted.`,
      }
    case 'EVENT_CANCELLED':
      return {
        status: 'invalid',
        title: 'Event cancelled',
        message: 'This event has been cancelled, so the ticket cannot be admitted.',
      }
    case 'NOT_FOUND':
      return {
        status: 'invalid',
        title: 'Invalid ticket',
        message: 'This QR code is not a ticket issued for this platform.',
      }
    default:
      return {
        status: 'invalid',
        title: 'Invalid ticket',
        message: 'The ticket could not be accepted for this event.',
      }
  }
}
