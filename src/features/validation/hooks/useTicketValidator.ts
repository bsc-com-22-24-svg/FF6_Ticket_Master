import {
  getTicket,
  hasValidSignature,
  markTicketUsed,
  parseTicketCode,
  type TicketValidationResult,
} from '../../../lib/tickets'

// The QR code carried a security tag that does not match the ticket.
// Real ticket details are not shown for a forged code.
function tamperedResult(id: string): TicketValidationResult {
  return {
    status: 'invalid',
    tampered: true,
    title: 'Tampered ticket',
    message: 'The QR code for ' + id + ' does not match its security signature. It was altered or forged. Do not admit.',
  }
}

export function validateTicket(rawCode: string, eventId: string): TicketValidationResult {
  const { id: code, tag } = parseTicketCode(rawCode)

  if (!code) {
    return {
      status: 'invalid',
      title: 'Invalid ticket',
      message: 'Enter or scan a ticket ID.',
    }
  }

  const ticket = getTicket(code)
  // a code with a security tag but no matching ticket was altered or invented
  if (!ticket && tag !== null) {
    return tamperedResult(code)
  }
  if (!ticket) {
    return {
      status: 'invalid',
      title: 'Invalid ticket',
      message: `“${code}” is not a ticket issued for this platform.`,
    }
  }

  if (tag !== null && !hasValidSignature(ticket, tag)) {
    return tamperedResult(ticket.id)
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
