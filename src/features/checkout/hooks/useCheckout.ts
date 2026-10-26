import { useMutation } from '@tanstack/react-query'
import { getEvent } from '../../../lib/events'
import { remainingSeats } from '../../../types/event'
import {
  initiatePayment,
  makeTxRef,
  removePendingPayment,
  savePendingPayment,
} from '../../../lib/paychangu'
import { calculateTotals } from '../format'
import type { CheckoutInput } from '../types'

export class CheckoutError extends Error {}

// Starts a real PayChangu payment. No ticket is issued here: tickets are issued on the
// return page (completePayment.ts) only after PayChangu confirms the money arrived.
async function startPayment(input: CheckoutInput): Promise<never> {
  const stored = getEvent(input.event.id)
  if (!stored || stored.status !== 'Published') {
    throw new CheckoutError('This event is not available for booking.')
  }
  const ticketType = stored.ticketTypes.find((candidate) => candidate.id === input.ticketType.id)
  if (!ticketType) throw new CheckoutError('That ticket type no longer exists.')

  if (input.quantity < 1) throw new CheckoutError('Select at least one ticket.')
  const remaining = remainingSeats(ticketType)
  if (remaining <= 0) throw new CheckoutError(`${ticketType.name} tickets are sold out for this event.`)
  if (input.quantity > remaining) {
    throw new CheckoutError(`Only ${remaining} ${ticketType.name} ticket${remaining === 1 ? '' : 's'} left.`)
  }
  if (!/^\S+@\S+\.\S+$/.test(input.email)) throw new CheckoutError('Your account needs a valid email address.')

  const txRef = makeTxRef()
  const amount = calculateTotals(ticketType.price, input.quantity).total
  const [firstName, ...rest] = (input.holder.trim() || 'Customer').split(/\s+/)

  // remember the order: PayChangu sends the customer back with only the reference
  savePendingPayment({
    txRef,
    eventId: stored.id,
    ticketTypeId: ticketType.id,
    quantity: input.quantity,
    holder: input.holder,
    ownerEmail: input.ownerEmail,
    amount,
    createdAt: new Date().toISOString(),
    status: 'pending',
  })

  try {
    const { checkout_url } = await initiatePayment({
      amount,
      email: input.email,
      first_name: firstName,
      last_name: rest.join(' ') || '-',
      tx_ref: txRef,
      callback_url: `${window.location.origin}/checkout/return`,
      return_url: `${window.location.origin}/checkout/return`,
      title: stored.title,
      description: `${input.quantity} x ${ticketType.name} ticket${input.quantity === 1 ? '' : 's'}`,
    })
    window.location.assign(checkout_url)
  } catch (error) {
    removePendingPayment(txRef)
    throw new CheckoutError(error instanceof Error ? error.message : 'Could not start the payment.')
  }

  // keep the button on "Redirecting…" until the browser leaves the page
  return new Promise<never>(() => {})
}

export function useCheckout() {
  return useMutation({ mutationFn: startPayment })
}
