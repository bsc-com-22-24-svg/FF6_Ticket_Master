import { getEvent, incrementSold } from '../../lib/events'
import { issueBooking, listTickets, type TicketRecord } from '../../lib/tickets'
import { remainingSeats } from '../../types/event'
import {
  getPendingPayment,
  markPaymentCompleted,
  verifyPayment,
  type PendingPayment,
} from '../../lib/paychangu'

export type CompletionResult =
  | { kind: 'success'; tickets: TicketRecord[]; payment: PendingPayment }
  | { kind: 'pending' } // payment not confirmed yet (for example the phone prompt is still open)
  | { kind: 'failed'; message: string; eventId?: string }
  | { kind: 'unknown' } // we have no record of this payment on this browser

const inFlight = new Map<string, Promise<CompletionResult>>()

function ticketsFor(payment: PendingPayment): TicketRecord[] {
  const ids = new Set(payment.ticketIds ?? [])
  return listTickets().filter((ticket) => ids.has(ticket.id))
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

  const event = getEvent(pending.eventId)
  const ticketType = event?.ticketTypes.find((candidate) => candidate.id === pending.ticketTypeId)
  if (!event || !ticketType || remainingSeats(ticketType) < pending.quantity) {
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
