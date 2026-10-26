
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
import { OrderSummary } from '../components/OrderSummary'
import { TicketSummaryCard } from '../components/TicketSummaryCard'
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
  const [holder] = useState(user?.name ?? '')
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
      ownerEmail: user.email,
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

  return (
    <div>
      <h1>Confirm your purchase</h1>
      <div className="split" style={{ marginTop: 16 }}>
        <div className="g">
          <TicketSummaryCard
            event={checkoutEvent}
            ticketType={ticketType}
            quantity={quantity}
            onChangeQuantity={setQuantity}
          />

          <div className="card">
            <h4 style={{ marginTop: 0 }}>Ticket type</h4>
            <div className="pills">
              {ticketTypes.map((type) => {
                const left = type.capacity - type.sold
                const disabled = left <= 0
                return (
                  <button
                    key={type.id}
                    type="button"
                    className={`pill ${type.id === selectedTypeId ? 'on' : ''}`}
                    onClick={() => selectTicketType(type.id)}
                    disabled={disabled}
                    style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                  >
                    {type.name} · {formatKwacha(type.price)}
                    {disabled ? ' · sold out' : ''}
                  </button>
                )
              })}
            </div>
            <label className="m" style={{ display: 'block' }}>
              Ticket holder (Your Name)
              <input
                className="in"
                style={{ marginTop: 4, backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                value={holder}
                readOnly
              />
            </label>
          </div>

          <div className="card">
            <h2>Payment</h2>
            <p className="m">
              You pay securely on PayChangu. Choose Airtel Money, TNM Mpamba or a bank card on the next screen.
            </p>
            <p className="m">
              Your receipt goes to <b>{user?.email}</b>.
            </p>
            <p className="m">
              A ticket is issued only after PayChangu confirms the payment. If it fails or you cancel, you are not
              charged and no ticket is issued.
            </p>
          </div>

          {soldOut && ticketType && (
            <div className="alert error">
              <b>Sold out.</b> There are no {ticketType.name} tickets left, so this purchase is
              blocked.
            </div>
          )}
          {!soldOut && exceedsAvailable && ticketType && (
            <div className="alert error">
              Only {remaining} ticket{remaining === 1 ? '' : 's'} left — reduce the quantity to
              continue.
            </div>
          )}
          {errorMessage && <div className="alert error">{errorMessage}</div>}
        </div>

        <OrderSummary
          subtotal={totals.subtotal}
          serviceFee={totals.serviceFee}
          total={totals.total}
          disabled={blocked}
          paying={checkout.isPending}
          onPay={handlePay}
        />
      </div>
    </div>
  )
}
