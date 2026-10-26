import { useQuery } from '@tanstack/react-query'
import { listBookings } from '../../../lib/tickets'

export interface SalesPoint {
  date: string // YYYY-MM-DD, local calendar day
  label: string // short weekday, used on the chart axis
  tickets: number
}

export const SALES_WINDOW_DAYS = 7

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Groups confirmed ticket sales for one event into the last seven local days.
// Exported separately so the calculation can be unit tested with a fixed clock.
export function buildSalesSeries(eventId: string, now: Date = new Date()): SalesPoint[] {
  const days: SalesPoint[] = []
  for (let offset = SALES_WINDOW_DAYS - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
    days.push({
      date: localDateKey(date),
      label: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      tickets: 0,
    })
  }

  const byDate = new Map(days.map((day) => [day.date, day]))

  for (const booking of listBookings()) {
    if (booking.status !== 'confirmed' || booking.eventId !== eventId) continue
    const createdAt = new Date(booking.createdAt)
    if (Number.isNaN(createdAt.getTime())) continue
    const point = byDate.get(localDateKey(createdAt))
    if (point) point.tickets += booking.quantity
  }

  return days
}

// Keyed by event so changing the selector refreshes the chart.
export function useSalesSeries(eventId?: string) {
  return useQuery({
    queryKey: ['sales-series', eventId],
    queryFn: () => buildSalesSeries(eventId ?? ''),
    enabled: !!eventId,
  })
}
