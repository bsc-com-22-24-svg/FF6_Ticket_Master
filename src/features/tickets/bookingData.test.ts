import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchBookings } from './bookingData'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchBookings', () => {
  it('loads and maps orders from the backend', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([
      {
        orderNumber: 'ORD-1',
        event: { title: 'Live show', venue: 'City Hall', startAt: '2026-12-20T18:00:00.000Z' },
        items: [{ quantity: 2 }],
        totalAmount: 10500,
        status: 'PAID',
      },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchBookings()).resolves.toEqual([{
      id: 'ORD-1',
      eventTitle: 'Live show',
      venue: 'City Hall',
      date: '2026-12-20T18:00:00.000Z',
      quantity: 2,
      total: 10500,
      status: 'confirmed',
    }])
    expect(fetchMock).toHaveBeenCalledWith('/be/orders/mine', expect.any(Object))
  })

  it('surfaces an unsupported backend response instead of showing invented data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([{}]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })))

    await expect(fetchBookings()).rejects.toThrow(/missing its number, event, date, or ticket quantity/)
  })
})
