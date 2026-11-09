import { getEvent, incrementSold } from '../../lib/events'
import {
  issueBooking,
  listTickets,
  saveIssuedTickets,
  type TicketRecord,
} from '../../lib/tickets'
import { remainingSeats } from '../../types/event'
import { USE_BACKEND } from '../../lib/backend'
import { backendTicketToRecord, purchaseBackendTicket } from '../../lib/backendTickets'
import { fetchBackendEvent } from '../../lib/backendEvents'
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
  | { kind: 'pending' } // payment not confirmed yet (for example the phone prompt is still open)
  | { kind: 'failed'; message: string; eventId?: string }
  | { kind: 'unknown' } // we have no record of this payment on this browser

const inFlight = new Map<string, Promise<CompletionResult>>()

function ticketsFor(payment: PendingPayment): TicketRecord[] {
  const ids = new Set(payment.ticketIds ?? [])
  return listTickets().filter((ticket) => ids.has(ticket.id))
}

// The backend owns ticket stock and the secret QR token. Claim each missing seat
// separately so a partial failure can be retried without buying extra tickets.
async function claimBackendTickets(
  pending: PendingPayment,
  event: NonNullable<ReturnType<typeof getEvent>>,
  ticketType: NonNullable<ReturnType<typeof getEvent>>['ticketTypes'][number],
): Promise<CompletionResult> {
  const missing = Math.max(0, pending.quantity - ticketsFor(pending).length)
  let failure: string | null = null

  for (let index = 0; index < missing; index += 1) {
    try {
      const purchased = await purchaseBackendTicket(event.id, ticketType.id)
      const ticket = backendTicketToRecord(purchased, {
        userId: pending.userId,
        event,
        ticketType,
        holder: pending.holder,
      })
      saveIssuedTickets([ticket])
      addPendingTickets(pending.txRef, [ticket.id])
    } catch (caught) {
      failure = caught instanceof Error ? caught.message : 'The ticket service could not issue the ticket.'
      break
    }
  }

  const updated = getPendingPayment(pending.txRef) ?? pending
  const tickets = ticketsFor(updated)

  if (tickets.length >= pending.quantity) {
    markPaymentCompleted(pending.txRef, tickets.map((ticket) => ticket.id))
    const done = getPendingPayment(pending.txRef) ?? {
      ...pending,
      status: 'completed' as const,
      ticketIds: tickets.map((ticket) => ticket.id),
    }
    return { kind: 'success', tickets, payment: done }
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

  // refreshing the page must never issue tickets twice
  if (pending.status === 'completed') {
    return { kind: 'success', tickets: ticketsFor(pending), payment: pending }
  }

  const verified = await verifyPayment(txRef)

  if (verified.status === 'pending' || verified.status === 'processing') return { kind: 'pending' }
  if (verified.status !== 'success') {
    return {
      kind: 'failed',
      eventId: pending.eventId,
      message: 'The payment was not completed. No ticket was issued and you were not charged.',
    }
  }

  // PayChangu says it succeeded: make sure it is OUR order and the full amount
  if (verified.tx_ref !== pending.txRef || verified.currency !== 'MWK' || !(verified.amount >= pending.amount)) {
    return {
      kind: 'failed',
      eventId: pending.eventId,
      message: 'The confirmed payment does not match this order. No ticket was issued. Please contact support.',
    }
  }

  let event: NonNullable<ReturnType<typeof getEvent>> | undefined
  try {
    event = USE_BACKEND ? await fetchBackendEvent(pending.eventId) : getEvent(pending.eventId)
  } catch (caught) {
    return {
      kind: 'failed',
      eventId: pending.eventId,
      message: `Payment (ref ${pending.txRef}) was confirmed, but the event details could not be loaded. Please contact support. ${caught instanceof Error ? caught.message : ''}`.trim(),
    }
  }
  const ticketType = event?.ticketTypes.find((candidate) => candidate.id === pending.ticketTypeId)
  if (!event || !ticketType) {
    return {
      kind: 'failed',
      eventId: pending.eventId,
      message: `Your payment (ref ${pending.txRef}) went through, but this ticket is no longer available. Please contact support for a refund.`,
    }
  }

  if (USE_BACKEND) {
    return claimBackendTickets(pending, event, ticketType)
  }

  if (remainingSeats(ticketType) < pending.quantity) {
    return {
      kind: 'failed',
      eventId: pending.eventId,
      message: `Your payment (ref ${pending.txRef}) went through, but these tickets are no longer available. Please contact support for a refund.`,
    }
  }

  const { tickets } = issueBooking({
    event,
    ticketType,
    quantity: pending.quantity,
    holder: pending.holder,
    userId: pending.userId,
  })
  incrementSold(event.id, ticketType.id, pending.quantity)
  markPaymentCompleted(pending.txRef, tickets.map((ticket) => ticket.id))

  const done = getPendingPayment(pending.txRef) ?? { ...pending, status: 'completed' as const }
  return { kind: 'success', tickets, payment: done }
}

// Safe to call many times (React StrictMode, refresh, retry): concurrent calls share one run.
export function completePayment(txRef: string): Promise<CompletionResult> {
  const existing = inFlight.get(txRef)
  if (existing) return existing
  const promise = run(txRef).finally(() => inFlight.delete(txRef))
  inFlight.set(txRef, promise)
  return promise
}
