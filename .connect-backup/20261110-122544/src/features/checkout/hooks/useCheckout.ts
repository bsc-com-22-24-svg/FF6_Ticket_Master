import { useMutation } from '@tanstack/react-query'
import { fetchBackendEvent } from '../../../lib/backendEvents'
import { remainingSeats } from '../../../types/event'
import {
  createOrder,
  initiatePayment,
  savePendingPayment,
} from '../../../lib/paychangu'
import type { CheckoutInput } from '../types'

export class CheckoutError extends Error {}

// The backend owns the order, reserves stock, starts PayChangu and verifies payment.
async function startPayment(input: CheckoutInput): Promise<never> {
  const stored = await fetchBackendEvent(input.event.id)
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

  try {
    const order = await createOrder({
      eventId: stored.id,
      ticketTypeId: ticketType.id,
      quantity: input.quantity,
    })
    const { checkout_url: checkoutUrl, tx_ref: txRef } = await initiatePayment(order.orderNumber)
    savePendingPayment({
      txRef,
      orderNumber: order.orderNumber,
      eventId: stored.id,
      ticketTypeId: ticketType.id,
      quantity: input.quantity,
      holder: input.holder,
      userId: input.userId,
      createdAt: new Date().toISOString(),
      status: 'pending',
    })
    window.location.assign(checkoutUrl)
  } catch (error) {
    throw new CheckoutError(error instanceof Error ? error.message : 'Could not start the payment.')
  }

  // keep the button on "Redirecting…" until the browser leaves the page
  return new Promise<never>(() => {})
}

export function useCheckout() {
  return useMutation({ mutationFn: startPayment })
}
