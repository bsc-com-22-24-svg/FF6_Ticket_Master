
import { useState } from 'react'
import type { ReactNode } from 'react'
import { calculateTotals, formatKwacha } from '../format'
import { useCheckout, validatePayment } from '../hooks/useCheckout'
import {
  CHECKOUT_EVENT,
  CHECKOUT_TICKET_TYPES,
  DEMO_HOLDER,
  EMPTY_PAYMENT,
  MOBILE_MONEY_PROVIDERS,
} from '../mockData'
import type { CheckoutResult, PaymentDetails } from '../types'
import { OrderSummary } from '../components/OrderSummary'
import { TicketConfirmation } from '../components/TicketConfirmation'
import { TicketSummaryCard } from '../components/TicketSummaryCard'

export function CheckoutPage(): ReactNode {
  const [selectedTypeId, setSelectedTypeId] = useState(CHECKOUT_TICKET_TYPES[0].id)
  const [quantity, setQuantity] = useState(1)
  const [holder, setHolder] = useState(DEMO_HOLDER)
  const [payment, setPayment] = useState<PaymentDetails>(EMPTY_PAYMENT)
  const [clientError, setClientError] = useState<string | null>(null)
  const [result, setResult] = useState<CheckoutResult | null>(null)

  const checkout = useCheckout()

  const ticketType =
    CHECKOUT_TICKET_TYPES.find((type) => type.id === selectedTypeId) ?? CHECKOUT_TICKET_TYPES[0]
  const totals = calculateTotals(ticketType.price, quantity)
  const remaining = ticketType.capacity - ticketType.sold
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
      { event: CHECKOUT_EVENT, ticketType, quantity, holder, payment },
      { onSuccess: (data) => setResult(data) },
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
            event={CHECKOUT_EVENT}
            ticketType={ticketType}
            quantity={quantity}
            onChangeQuantity={setQuantity}
          />

          <div className="card">
            <h4 style={{ marginTop: 0 }}>Ticket type</h4>
            <div className="pills">
              {CHECKOUT_TICKET_TYPES.map((type) => {
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
