import type { TicketRecord } from '../../lib/tickets'

export type PaymentMethod = 'mobile_money' | 'card'

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

export interface PaymentDetails {
  method: PaymentMethod
  provider: string
  phoneNumber: string
  cardNumber: string
  cardExpiry: string
}

export interface CheckoutInput {
  ownerEmail?: string
  event: CheckoutEvent
  ticketType: TicketType
  quantity: number
  holder: string
  payment: PaymentDetails
}

export interface CheckoutResult {
  reference: string
  tickets: TicketRecord[]
}
