import type { TicketRecord } from '../../lib/tickets'
import type { StoredEvent } from '../../lib/events'
import type { TicketType } from '../../types/event'
import { backendTicketToRecord, purchaseBackendTicket } from '../../lib/backendTickets'
import { fetchBackendEvent } from '../../lib/backendEvents'
import { fetchTicketRecords } from '../tickets/ticketData'
import {
  addPendingTickets,
  getPendingPayment,
  markPaymentCompleted,
  verifyPayment,
  type PendingPayment,
} from '../../lib/paychangu'

export type CompletionResult =
  | { kind: 'success'; tickets: TicketRecord[]; payment: PendingPayment }
  | {
      kind: 'partial'
      tickets: TicketRecord[]
      message: string
      eventId: string
      payment: PendingPayment
    }
  | { kind: 'pending' }
  | { kind: 'failed'; message: string; eventId?: string }
  | { kind: 'unknown' }

const inFlight = new Map<string, Promise<CompletionResult>>()

async function ticketsFor(payment: PendingPayment): Promise<TicketRecord[]> {
  const ids = new Set(payment.ticketIds ?? [])
  if (ids.size === 0) return []

  const tickets = await fetchTicketRecords(payment.userId, payment.holder)
  return tickets.filter((ticket) => ids.has(ticket.id))
}

async function claimBackendTickets(
  pending: PendingPayment,
  event: StoredEvent,
  ticketType: TicketType,
): Promise<CompletionResult> {
  const tickets = await ticketsFor(pending)
  let failure: string | null = null

  for (let index = tickets.length; index < pending.quantity; index += 1) {
    try {
      const purchased = await purchaseBackendTicket(event.id, ticketType.id, pending.txRef)
      const ticket = backendTicketToRecord(purchased, {
        userId: pending.userId,
        event,
        ticketType,
        holder: pending.holder,
      })
      tickets.push(ticket)
      addPendingTickets(pending.txRef, [ticket.id])
    } catch (caught) {
      failure = caught instanceof Error ? caught.message : 'The ticket service could not issue the ticket.'
      break
    }
  }

  const updated = getPendingPayment(pending.txRef) ?? pending

  if (tickets.length >= pending.quantity) {
    markPaymentCompleted(pending.txRef, tickets.map((ticket) => ticket.id))
    return {
      kind: 'success',
      tickets,
      payment: getPendingPayment(pending.txRef) ?? {
        ...updated,
        status: 'completed',
        ticketIds: tickets.map((ticket) => ticket.id),
      },
    }
  }

  const issued = tickets.length
  const message =
    issued > 0
      ? `Your payment (ref ${pending.txRef}) went through. ${issued} of ${pending.quantity} tickets were issued${failure ? `: ${failure}` : '.'} Contact support with this reference for the remaining ticket(s).`
      : `Your payment (ref ${pending.txRef}) went through, but no tickets could be issued${failure ? `: ${failure}` : '.'} Contact support for a refund.`

  if (issued > 0) {
    return { kind: 'partial', tickets, message, eventId: pending.eventId, payment: updated }
  }
  return { kind: 'failed', eventId: pending.eventId, message }
}

async function run(txRef: string): Promise<CompletionResult> {
  const pending = getPendingPayment(txRef)
  if (!pending) return { kind: 'unknown' }

  if (pending.status === 'completed') {
    const tickets = await ticketsFor(pending)
    if (tickets.length < pending.quantity) {
      throw new Error('The backend has not returned all tickets recorded for this payment.')
    }
    return { kind: 'success', tickets, payment: pending }
  }

  const verified = await verifyPayment(txRef)

  if (verified.status === 'pending') return { kind: 'pending' }
  if (verified.status !== 'success') {
    return {
      kind: 'failed',
      eventId: pending.eventId,
      message: 'The payment was not completed. No ticket was issued and you were not charged.',
    }
  }

  if (verified.tx_ref !== pending.txRef) {
    return {
      kind: 'failed',
      eventId: pending.eventId,
      message: 'The backend confirmed a different payment reference. No ticket was issued. Please contact support.',
    }
  }

  let event: StoredEvent
  try {
    event = await fetchBackendEvent(pending.eventId)
  } catch (caught) {
    return {
      kind: 'failed',
      eventId: pending.eventId,
      message: `Payment (ref ${pending.txRef}) was confirmed, but the event details could not be loaded. Please contact support. ${caught instanceof Error ? caught.message : ''}`.trim(),
    }
  }

  const ticketType = event.ticketTypes.find((candidate) => candidate.id === pending.ticketTypeId)
  if (!ticketType) {
    return {
      kind: 'failed',
      eventId: pending.eventId,
      message: `Your payment (ref ${pending.txRef}) went through, but this ticket is no longer available. Please contact support for a refund.`,
    }
  }

  return claimBackendTickets(pending, event, ticketType)
}

export function completePayment(txRef: string): Promise<CompletionResult> {
  const existing = inFlight.get(txRef)
  if (existing) return existing
  const promise = run(txRef).finally(() => inFlight.delete(txRef))
  inFlight.set(txRef, promise)
  return promise
}
