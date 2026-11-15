import type { ReactNode } from 'react'
import { formatKwacha } from '../format'
import type { CheckoutEvent, TicketType } from '../types'
import { QuantityStepper } from './QuantityStepper'

interface TicketSummaryCardProps {
  event: CheckoutEvent
  ticketType: TicketType
  quantity: number
  onChangeQuantity: (quantity: number) => void
}

export function TicketSummaryCard({
  event,
  ticketType,
  quantity,
  onChangeQuantity,
}: TicketSummaryCardProps): ReactNode {
  const remaining = ticketType.capacity - ticketType.sold
  const soldOut = remaining <= 0

  return (
    <div className="card row">
      <div>
        <b>{event.name}</b>
        <div className="m">
          {event.date} · {ticketType.name} · {event.venue}, {event.city}
        </div>
        <div className="m">
          {formatKwacha(ticketType.price)} each · {soldOut ? 'Sold out' : `${remaining} left`}
        </div>
      </div>
      <QuantityStepper
        value={quantity}
        min={1}
        max={Math.max(remaining, 1)}
        onChange={onChangeQuantity}
      />
    </div>
  )
}
