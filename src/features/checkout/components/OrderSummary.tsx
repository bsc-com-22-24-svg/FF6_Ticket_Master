import type { ReactNode } from 'react'
import { formatKwacha } from '../format'

interface OrderSummaryProps {
  subtotal: number
  serviceFee: number
  total: number
  disabled: boolean
  paying: boolean
  onPay: () => void
}

export function OrderSummary({
  subtotal,
  serviceFee,
  total,
  disabled,
  paying,
  onPay,
}: OrderSummaryProps): ReactNode {
  return (
    <div className="card">
      <h2>Order summary</h2>
      <div className="row">
        <span>Ticket price</span>
        <span>{formatKwacha(subtotal)}</span>
      </div>
      <div className="row">
        <span>Service fee</span>
        <span>{formatKwacha(serviceFee)}</span>
      </div>
      <hr />
      <div className="row">
        <b>Total</b>
        <span className="p" style={{ fontSize: 20 }}>
          {formatKwacha(total)}
        </span>
      </div>
      <button type="button" className="btn w" onClick={onPay} disabled={disabled || paying}>
        {paying ? 'Processing payment…' : `Pay ${formatKwacha(total)}`}
      </button>
      <p className="m" style={{ textAlign: 'center', marginTop: 8 }}>
        A ticket is issued only after payment is confirmed.
      </p>
    </div>
  )
}
