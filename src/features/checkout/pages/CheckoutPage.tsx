
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useParams, useSearch, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { calculateTotals, formatKwacha } from '../format'
import { useCheckout } from '../hooks/useCheckout'
import { getEvent } from '../../../lib/events'
import { withDelay } from '../../../mocks/delay'
import { useAuth } from '../../authentication'
import type { CheckoutEvent, TicketType } from '../types'
import { remainingSeats } from '../../../types/event'

const toCheckoutEvent = (ev: import('../../../types/event').Event): CheckoutEvent => ({
  id: ev.id,
  name: ev.title,
  date: ev.date,
  time: ev.time,
  venue: ev.venue,
  city: ev.city,
  organizer: ev.organizer,
})

const toCheckoutTicketTypes = (ev: import('../../../types/event').Event): TicketType[] =>
  ev.ticketTypes.map((t) => ({ ...t }))


export function CheckoutPage(): ReactNode {
  const { eventId } = useParams({ strict: false }) as { eventId?: string }
  const { type, qty } = useSearch({ strict: false }) as { type?: string; qty?: string }
  const parsedQty = parseInt(qty ?? '', 10)

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(() =>
    Number.isNaN(parsedQty) || parsedQty < 1 ? 1 : parsedQty,
  )
  const { user } = useAuth()
  const holder = user?.name ?? ''
  const [clientError, setClientError] = useState<string | null>(null)

  const { data: eventData, isLoading, isError } = useQuery({
    queryKey: ['checkout-event', eventId],
    queryFn: () => {
      const found = getEvent(eventId ?? '')
      // drafts are private to the organizer, so they cannot be bought
      return withDelay(found && found.status === 'Published' ? found : null)
    },
    enabled: !!eventId,
  })

  const ticketTypes: TicketType[] = eventData ? toCheckoutTicketTypes(eventData) : []
  const activeTypeId = selectedTypeId ?? type ?? ticketTypes[0]?.id
  const ticketType =
    ticketTypes.find((candidate) => candidate.id === activeTypeId) ?? ticketTypes[0]
  const checkoutEvent: CheckoutEvent = eventData
    ? toCheckoutEvent(eventData)
    : {
        id: eventId ?? 'unknown',
        name: 'Event',
        date: '',
        time: '',
        venue: '',
        city: '',
        organizer: '',
      }

  const checkout = useCheckout()

  const totals = ticketType
    ? calculateTotals(ticketType.price, quantity)
    : { subtotal: 0, serviceFee: 0, total: 0 }
  const remaining = ticketType ? remainingSeats(ticketType) : 0
  const soldOut = remaining <= 0
  const exceedsAvailable = quantity > remaining
  function selectTicketType(id: string) {
    setSelectedTypeId(id)
    setQuantity(1)
    setClientError(null)
  }

  function handlePay() {
    if (!ticketType || !user) return
    setClientError(null)
    // goes to PayChangu; tickets are issued on the return page once the payment is confirmed
    checkout.mutate({
      event: checkoutEvent,
      ticketType,
      quantity,
      holder,
      email: user.email,
      userId: user.id,
    })
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="h-80 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    )
  }

  if (isError || !eventData) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <p className="mt-2 text-slate-600">We couldn’t find this event to check out.</p>
        <Link to="/events" className="mt-6 inline-block rounded-full bg-navy px-6 py-2 text-white">Browse events</Link>
      </div>
    )
  }

  const mutationError = checkout.error instanceof Error ? checkout.error.message : null
  const errorMessage = clientError ?? mutationError
  const blocked = soldOut || exceedsAvailable

  const MAX_PER_ORDER = 10
  const maxQty = Math.max(1, Math.min(MAX_PER_ORDER, remaining))
  const canPay = !blocked && !checkout.isPending && !!ticketType

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link to="/events" className="text-sm font-medium text-slate-500 hover:text-navy">
          ← Back to events
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">Confirm your purchase</h1>
        <p className="mt-1 text-slate-500">Check your order, then pay securely.</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="bg-navy px-6 py-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Your event</p>
                <h2 className="mt-1 text-2xl font-bold text-white">{checkoutEvent.name}</h2>
                <p className="mt-2 text-sm text-slate-200">
                  {checkoutEvent.date}
                  {checkoutEvent.time ? ` · ${checkoutEvent.time}` : ''}
                </p>
                <p className="text-sm text-slate-200">
                  {checkoutEvent.venue}
                  {checkoutEvent.city ? `, ${checkoutEvent.city}` : ''}
                </p>
              </div>

              <div className="space-y-6 p-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ticket type</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {ticketTypes.map((option) => {
                      const left = option.capacity - option.sold
                      const disabled = left <= 0
                      const selected = option.id === ticketType?.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => selectTicketType(option.id)}
                          disabled={disabled}
                          aria-pressed={selected}
                          className={`rounded-xl border-2 p-4 text-left transition ${
                            selected
                              ? 'border-navy bg-navy/5'
                              : 'border-slate-200 hover:border-slate-300'
                          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          <span className="block font-semibold text-slate-900">{option.name}</span>
                          <span className="mt-1 block text-lg font-bold text-navy">{formatKwacha(option.price)}</span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {disabled ? 'Sold out' : `${left} left`}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Quantity</h3>
                    <p className="mt-1 text-xs text-slate-500">Up to {MAX_PER_ORDER} per order</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="h-10 w-10 rounded-full border border-slate-300 text-lg font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-lg font-bold" aria-live="polite">{quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      disabled={quantity >= maxQty}
                      className="h-10 w-10 rounded-full border border-slate-300 text-lg font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ticket holder</h3>
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                      {(holder || '?').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{holder}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {soldOut && ticketType && (
              <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
                <b>Sold out.</b> There are no {ticketType.name} tickets left.
              </div>
            )}
            {!soldOut && exceedsAvailable && ticketType && (
              <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
                Only {remaining} ticket{remaining === 1 ? '' : 's'} left. Reduce the quantity to continue.
              </div>
            )}
            {errorMessage && (
              <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
                {errorMessage}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold text-navy">Order summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <dt>
                    {quantity} × {ticketType?.name ?? 'Ticket'}
                  </dt>
                  <dd className="font-medium text-slate-900">{formatKwacha(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>Service fee</dt>
                  <dd className="font-medium text-slate-900">{formatKwacha(totals.serviceFee)}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-slate-200 pt-4">
                  <dt className="text-base font-semibold text-slate-900">Total</dt>
                  <dd className="text-2xl font-bold text-navy">{formatKwacha(totals.total)}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={handlePay}
                disabled={!canPay}
                className="mt-6 w-full rounded-xl bg-navy px-4 py-3.5 text-base font-semibold text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checkout.isPending ? 'Redirecting…' : `Pay ${formatKwacha(totals.total)}`}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
