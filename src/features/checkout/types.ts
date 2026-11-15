import type { TicketRecord } from '../../lib/tickets'

export interface CheckoutEvent {
  id: string
  name: string
  date: string
  time: string
  venue: string
  city: string
  organizer: string
}

export interface TicketType {
  id: string
  name: string
  price: number
  capacity: number
  sold: number
}

export interface CheckoutInput {
  userId: string
  event: CheckoutEvent
  ticketType: TicketType
  quantity: number
  holder: string
}

export interface CheckoutResult {
  reference: string
  tickets: TicketRecord[]
}
