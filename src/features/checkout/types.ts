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
  event: CheckoutEvent
  ticketType: TicketType
  quantity: number
  holder: string
  email: string // receipt email for PayChangu
  ownerEmail?: string
}

export interface CheckoutResult {
  reference: string
  tickets: TicketRecord[]
}
