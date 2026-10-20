import type { CheckoutEvent, PaymentDetails, TicketType } from './types'

export const CHECKOUT_EVENT: CheckoutEvent = {
  id: 'evt-lakeshore',
  name: 'Lakeshore Music Fest',
  date: 'Sat 24 Oct',
  time: '6:00 PM',
  venue: 'Mount Soche Grounds',
  city: 'Blantyre',
  organizer: 'Nyasa Events',
}

export const CHECKOUT_TICKET_TYPES: TicketType[] = [
  { id: 'general', name: 'General', price: 15000, capacity: 800, sold: 480 },
  { id: 'vip', name: 'VIP', price: 45000, capacity: 120, sold: 120 },
]

export const SERVICE_FEE = 500

export const MOBILE_MONEY_PROVIDERS = ['Airtel Money', 'TNM Mpamba', 'T-Pay']

export const DEMO_HOLDER = 'Chimwemwe Banda'

export const EMPTY_PAYMENT: PaymentDetails = {
  method: 'mobile_money',
  provider: MOBILE_MONEY_PROVIDERS[0],
  phoneNumber: '',
  cardNumber: '',
  cardExpiry: '',
}
