
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams, useSearch, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { calculateTotals, formatKwacha } from '../format'
import { useCheckout, validatePayment } from '../hooks/useCheckout'
import { events } from '../../../mocks/events'
import { withDelay } from '../../../mocks/delay'
import { DEMO_HOLDER, EMPTY_PAYMENT, MOBILE_MONEY_PROVIDERS } from '../mockData'
import type { CheckoutResult, PaymentDetails, CheckoutEvent, TicketType } from '../types'
import { OrderSummary } from '../components/OrderSummary'
import { TicketConfirmation } from '../components/TicketConfirmation'
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
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [holder, setHolder] = useState(DEMO_HOLDER)
  const [payment, setPayment] = useState<PaymentDetails>(EMPTY_PAYMENT)
  const [clientError, setClientError] = useState<string | null>(null)
  const [result, setResult] = useState<CheckoutResult | null>(null)

  const { eventId } = useParams({ strict: false }) as { eventId?: string }
  const { type, qty } = useSearch({ strict: false }) as { type?: string; qty?: string }

  const { data: eventData, isLoading, isError } = useQuery<import('../../../types/event').Event | null>({
    queryKey: ['checkout-event', eventId],
    queryFn: () => withDelay(events.find((e) => e.id === eventId) ?? null),
    enabled: !!eventId,
  })

  const event = eventData
  const ticketTypes: TicketType[] = eventData ? toCheckoutTicketTypes(eventData) : []
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

  useEffect(() => {
    if (ticketTypes.length > 0) {
      const candidate = ticketTypes.find((t) => t.id === type)
      if (candidate && candidate.id !== selectedTypeId) {
        setSelectedTypeId(candidate.id)
      } else if (!selectedTypeId) {
        setSelectedTypeId(ticketTypes[0].id)
      }
    }
  }, [ticketTypes, type, selectedTypeId])

  useEffect(() => {
    const q = parseInt(qty ?? '', 10)
    if (!Number.isNaN(q) && q > 0) {
      setQuantity(q)
    }
  }, [qty])

  const checkout = useCheckout()

  const ticketType = ticketTypes.find((type) => type.id === selectedTypeId) ?? ticketTypes[0]
  const totals = calculateTotals(ticketType.price, quantity)
  const remaining = remainingSeats(ticketType)
  const soldOut = remaining <= 0
  const exceedsAvailable = quantity > remaining

  function updatePayment(patch: Partial<PaymentDetails>) {
    setPayment((current) => ({ ...current, ...patch }))
  }

  function selectTicketType(id: string) {
    setSelectedTypeId(id)
    setQuantity(1)
    setClientError(null)
  }

  function handlePay() {
    setClientError(null)
    const paymentError = validatePayment(payment)
    if (paymentError) {
      setClientError(paymentError)
      return
    }
    checkout.mutate(
      { event: checkoutEvent, ticketType, quantity, holder, payment },
      { onSuccess: (data) => setResult(data) },
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="h-80 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <p className="mt-2 text-slate-600">We couldn’t find this event to check out.</p>
        <Link to="/events" className="mt-6 inline-block rounded-full bg-navy px-6 py-2 text-white">Browse events</Link>
      </div>
    )
  }

  if (result) {
    return (
      <TicketConfirmation
        tickets={result.tickets}
        onBuyAgain={() => {
          setResult(null)
          setQuantity(1)
          checkout.reset()
        }}
      />
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
              Ticket holder
              <input
                className="in"
                style={{ marginTop: 4 }}
                value={holder}
                onChange={(event) => setHolder(event.target.value)}
              />
            </label>
          </div>

          <div className="card">
            <h2>Payment</h2>
            <div className="pills">
              <button
                type="button"
                className={`pill ${payment.method === 'mobile_money' ? 'on' : ''}`}
                onClick={() => updatePayment({ method: 'mobile_money' })}
              >
                Mobile money
              </button>
              <button
                type="button"
                className={`pill ${payment.method === 'card' ? 'on' : ''}`}
                onClick={() => updatePayment({ method: 'card' })}
              >
                Card
              </button>
            </div>

            {payment.method === 'mobile_money' ? (
              <div className="g g2">
                <label className="m" style={{ display: 'block' }}>
                  Provider
                  <select
                    className="in"
                    style={{ marginTop: 4 }}
                    value={payment.provider}
                    onChange={(event) => updatePayment({ provider: event.target.value })}
                  >
                    {MOBILE_MONEY_PROVIDERS.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="m" style={{ display: 'block' }}>
                  Phone number
                  <input
                    className="in"
                    style={{ marginTop: 4 }}
                    inputMode="numeric"
                    placeholder="0991 234 567"
                    value={payment.phoneNumber}
                    onChange={(event) => updatePayment({ phoneNumber: event.target.value })}
                  />
                </label>
              </div>
            ) : (
              <div className="g g2">
                <label className="m" style={{ display: 'block' }}>
                  Card number
                  <input
                    className="in"
                    style={{ marginTop: 4 }}
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    value={payment.cardNumber}
                    onChange={(event) => updatePayment({ cardNumber: event.target.value })}
                  />
                </label>
                <label className="m" style={{ display: 'block' }}>
                  Expiry (MM/YY)
                  <input
                    className="in"
                    style={{ marginTop: 4 }}
                    placeholder="12/27"
                    value={payment.cardExpiry}
                    onChange={(event) => updatePayment({ cardExpiry: event.target.value })}
                  />
                </label>
              </div>
            )}

            <p className="m">
              If payment fails, no ticket is issued and you can try again. A payment number ending in
              “00” simulates a declined payment.
            </p>
          </div>

          {soldOut && (
            <div className="alert error">
              <b>Sold out.</b> There are no {ticketType.name} tickets left, so this purchase is
              blocked.
            </div>
          )}
          {!soldOut && exceedsAvailable && (
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
