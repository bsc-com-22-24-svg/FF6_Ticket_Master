import { useMutation } from '@tanstack/react-query'
import { issueTicket, type TicketRecord } from '../../../lib/tickets'
import type { CheckoutInput, CheckoutResult, PaymentDetails } from '../types'

export class CheckoutError extends Error {}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function validatePayment(payment: PaymentDetails): string | null {
  if (payment.method === 'mobile_money') {
    if (!payment.provider) return 'Choose a mobile money provider.'
    const phone = payment.phoneNumber.replace(/\s+/g, '')
    if (!/^\d{9,12}$/.test(phone)) return 'Enter a valid mobile money phone number.'
    return null
  }

  const card = payment.cardNumber.replace(/\s+/g, '')
  if (!/^\d{16}$/.test(card)) return 'Enter a valid 16-digit card number.'
  if (!/^\d{2}\/\d{2}$/.test(payment.cardExpiry)) return 'Enter the card expiry as MM/YY.'
  return null
}

function isPaymentAccepted(payment: PaymentDetails): boolean {
  const reference =
    payment.method === 'mobile_money' ? payment.phoneNumber : payment.cardNumber
  const digits = reference.replace(/\s+/g, '')
  return !digits.endsWith('00')
}

async function submitCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  await delay(900)

  const remaining = input.ticketType.capacity - input.ticketType.sold
  if (input.quantity < 1) {
    throw new CheckoutError('Select at least one ticket.')
  }
  if (remaining <= 0) {
    throw new CheckoutError(`${input.ticketType.name} tickets are sold out for this event.`)
  }
  if (input.quantity > remaining) {
    throw new CheckoutError(
      `Only ${remaining} ${input.ticketType.name} ticket${remaining === 1 ? '' : 's'} left.`,
    )
  }

  const paymentError = validatePayment(input.payment)
  if (paymentError) throw new CheckoutError(paymentError)

  if (!isPaymentAccepted(input.payment)) {
    throw new CheckoutError('Payment was declined. No ticket was issued — please try again.')
  }

  const tickets: TicketRecord[] = []
  for (let index = 0; index < input.quantity; index += 1) {
    tickets.push(
      issueTicket({
        eventId: input.event.id,
        eventName: input.event.name,
        date: input.event.date,
        venue: `${input.event.venue}, ${input.event.city}`,
        ticketType: input.ticketType.name,
        holder: input.holder.trim() || 'Guest',
      }),
    )
  }

  return { reference: tickets[0].id, tickets }
}

export function useCheckout() {
  return useMutation({ mutationFn: submitCheckout })
}
