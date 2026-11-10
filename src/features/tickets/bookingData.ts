import { api } from '../../lib/backend'
import type { Booking, BookingStatus } from './bookingTypes'

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)
}

function firstNumber(...values: unknown[]): number | undefined {
  return values.find((value): value is number => typeof value === 'number' && Number.isFinite(value))
}

function normalizeStatus(value: unknown): BookingStatus {
  if (typeof value !== 'string') throw new Error('The backend returned an order without a status.')
  switch (value.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
    case 'CONFIRMED':
    case 'SUCCESS':
      return 'confirmed'
    case 'CANCELLED':
    case 'CANCELED':
    case 'REFUNDED':
      return 'cancelled'
    case 'PENDING':
    case 'PROCESSING':
    case 'INITIATED':
      return 'pending'
    case 'FAILED':
    case 'EXPIRED':
      return 'failed'
    default:
      throw new Error(`The backend returned an unsupported order status: ${value}`)
  }
}

function mapOrder(value: unknown): Booking {
  if (!isRecord(value)) throw new Error('The backend returned an invalid order.')

  const event = isRecord(value.event) ? value.event : {}
  const id = firstString(value.orderNumber, value.id, value.orderId)
  const eventTitle = firstString(value.eventTitle, event.title, event.name)
  const venue = firstString(value.venue, event.venue) ?? 'Venue not provided'
  const date = firstString(value.eventDate, event.startAt, event.date, value.createdAt, value.created_at)
  const total = firstNumber(value.totalAmount, value.total, value.amount)
  const items = Array.isArray(value.items) ? value.items : []
  const quantity = firstNumber(value.quantity) ??
    items.reduce((sum, item) => sum + (isRecord(item) ? firstNumber(item.quantity) ?? 0 : 0), 0)

  if (!id || !eventTitle || !date || quantity < 1) {
    throw new Error('The backend returned an order missing its number, event, date, or ticket quantity.')
  }

  return {
    id,
    eventTitle,
    venue,
    date,
    quantity,
    ...(total === undefined ? {} : { total }),
    status: normalizeStatus(value.status ?? value.paymentStatus),
  }
}

export async function fetchBookings(): Promise<Booking[]> {
  const result = await api<unknown>('/orders/mine')
  if (!Array.isArray(result)) throw new Error('The backend returned an invalid order history.')
  return result.map(mapOrder)
}
