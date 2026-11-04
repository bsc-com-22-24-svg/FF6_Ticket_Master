import {
  getTicket,
  markTicketUsed,
  normalizeTicketCode,
  type TicketValidationResult,
} from '../../../lib/tickets'
import { getUser, staffEventIds } from '../../authentication/authStore'

export function validateTicket(rawCode: string, eventId: string): TicketValidationResult {
  // Staff can only scan the events their organizer assigned to them.
  const user = getUser()
  if (!user || user.role !== 'staff' || !staffEventIds(user.id).includes(eventId)) {
    return {
      status: 'invalid',
      title: 'Not allowed',
      message: 'You are not assigned to this event, or your account is no longer active.',
    }
  }

  const code = normalizeTicketCode(rawCode)

  if (!code) {
    return {
      status: 'invalid',
      title: 'Invalid ticket',
      message: 'Enter or scan a ticket ID.',
    }
  }

  const ticket = getTicket(code)
  if (!ticket) {
    return {
      status: 'invalid',
      title: 'Invalid ticket',
      message: `“${code}” is not a ticket issued for this platform.`,
    }
  }

  if (ticket.eventId !== eventId) {
    return {
      status: 'wrong_event',
      title: 'Wrong event',
      message: `${ticket.id} is for ${ticket.eventName}, not this event.`,
      ticket,
    }
  }

  if (ticket.status === 'used') {
    return {
      status: 'used',
      title: 'Already used',
      message: `${ticket.id} has already been admitted and cannot be accepted again.`,
      ticket,
    }
  }

  const admitted = markTicketUsed(ticket.id)
  return {
    status: 'valid',
    title: 'Valid',
    message: `${ticket.id} · ${ticket.ticketType} · admitted, attendance recorded.`,
    ticket: admitted ?? ticket,
  }
}
