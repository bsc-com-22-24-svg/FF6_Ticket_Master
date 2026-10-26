// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { BOOKINGS_KEY, type BookingRecord } from '../../../lib/tickets'
import { buildSalesSeries } from './useSalesSeries'

const NOW = new Date(2026, 9, 26, 12, 0, 0) // 26 Oct 2026, local time

function localTimestamp(daysAgo: number, hour = 12): string {
  const date = new Date(NOW)
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

function booking(patch: Partial<BookingRecord> & { id: string }): BookingRecord {
  return {
    userId: 'u-1',
    eventId: 'evt-test',
    eventTitle: 'Test Concert',
    venue: 'Test Venue',
    date: '2026-11-14',
    quantity: 1,
    subtotal: 35000,
    serviceFee: 500,
    total: 35500,
    status: 'confirmed',
    ticketIds: [],
    createdAt: localTimestamp(0),
    ...patch,
  }
}

describe('buildSalesSeries', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('groups confirmed sales for the selected event into the last 7 days', () => {
    window.localStorage.setItem(
      BOOKINGS_KEY,
      JSON.stringify([
        booking({ id: 'b-today', quantity: 2, createdAt: localTimestamp(0, 9) }),
        booking({ id: 'b-two-days', quantity: 1, createdAt: localTimestamp(2, 15) }),
        // other event — must not appear
        booking({ id: 'b-other', eventId: 'evt-other', quantity: 5, createdAt: localTimestamp(1) }),
        // cancelled — must not appear
        booking({ id: 'b-cancelled', status: 'cancelled', quantity: 3, createdAt: localTimestamp(3) }),
        // outside the window — must not appear
        booking({ id: 'b-old', quantity: 4, createdAt: localTimestamp(8) }),
      ]),
    )

    const series = buildSalesSeries('evt-test', NOW)

    expect(series).toHaveLength(7)
    expect(series.map((point) => point.date)).toEqual([
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ])
    expect(series.reduce((sum, point) => sum + point.tickets, 0)).toBe(3)
    expect(series[6].tickets).toBe(2)
    expect(series[4].tickets).toBe(1)
  })

  it('returns a full zero-filled week when there are no sales', () => {
    const series = buildSalesSeries('evt-test', NOW)
    expect(series).toHaveLength(7)
    expect(series.every((point) => point.tickets === 0)).toBe(true)
  })
})
