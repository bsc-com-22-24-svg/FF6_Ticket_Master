import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getEvent } from '../../lib/events'
import { listTickets } from '../../lib/tickets'
import { getPendingPayment, savePendingPayment } from '../../lib/paychangu'

vi.mock('../../lib/backend', () => ({ USE_BACKEND: true, api: vi.fn() }))
vi.mock('../../lib/backendEvents', async () => {
  const { getEvent } = await import('../../lib/events')
  return { fetchBackendEvent: vi.fn(async (eventId: string) => getEvent(eventId)) }
})
vi.mock('../../lib/backendTickets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/backendTickets')>()
  return { ...actual, purchaseBackendTicket: vi.fn() }
})

import { purchaseBackendTicket } from '../../lib/backendTickets'
import { completePayment } from './completePayment'

const EVENT_ID = 'lake-of-stars'
const purchase = vi.mocked(purchaseBackendTicket)

function pendingOrder(txRef: string) {
  const event = getEvent(EVENT_ID)!
  const ticketType = event.ticketTypes[0]
  savePendingPayment({
    txRef,
    eventId: EVENT_ID,
    ticketTypeId: ticketType.id,
    quantity: 2,
    holder: 'Test Holder',
    userId: 'user-1',
    amount: 70500,
    createdAt: new Date().toISOString(),
    status: 'pending',
  })
}

function paymentSuccess(txRef: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(
      JSON.stringify({ status: 'success', tx_ref: txRef, amount: 70500, currency: 'MWK' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )),
  )
}

function purchased(number: string) {
  return {
    ticketNumber: number,
    qrCodeDataUrl: `data:image/png;base64,${number}`,
    status: 'ISSUED',
  }
}

describe('completePayment with the backend', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
    purchase.mockReset()
  })

  it('claims one backend ticket per seat and keeps the server QR image', async () => {
    pendingOrder('TM-BACKEND-0001')
    paymentSuccess('TM-BACKEND-0001')
    purchase
      .mockResolvedValueOnce(purchased('TKT-ONE'))
      .mockResolvedValueOnce(purchased('TKT-TWO'))

    const result = await completePayment('TM-BACKEND-0001')

    expect(result.kind).toBe('success')
    if (result.kind !== 'success') return
    expect(result.tickets.map((ticket) => ticket.id).sort()).toEqual(['TKT-ONE', 'TKT-TWO'])
    expect(result.tickets.every((ticket) => ticket.qrCodeDataUrl?.includes(ticket.id))).toBe(true)
    expect(purchase).toHaveBeenCalledTimes(2)
    expect(purchase).toHaveBeenCalledWith(EVENT_ID, getEvent(EVENT_ID)!.ticketTypes[0].id, 'TM-BACKEND-0001')
    expect(getPendingPayment('TM-BACKEND-0001')?.status).toBe('completed')
  })

  it('reports tickets that were bought when a later claim fails, then retries only the missing seat', async () => {
    pendingOrder('TM-BACKEND-0002')
    paymentSuccess('TM-BACKEND-0002')
    purchase
      .mockResolvedValueOnce(purchased('TKT-THREE'))
      .mockRejectedValueOnce(new Error('Tickets are sold out'))

    const first = await completePayment('TM-BACKEND-0002')

    expect(first.kind).toBe('partial')
    if (first.kind !== 'partial') return
    expect(first.tickets.map((ticket) => ticket.id)).toEqual(['TKT-THREE'])
    expect(first.message).toContain('1 of 2')
    expect(getPendingPayment('TM-BACKEND-0002')?.status).toBe('pending')
    expect(getPendingPayment('TM-BACKEND-0002')?.ticketIds).toEqual(['TKT-THREE'])

    purchase.mockResolvedValueOnce(purchased('TKT-FOUR'))
    const retry = await completePayment('TM-BACKEND-0002')

    expect(retry.kind).toBe('success')
    if (retry.kind !== 'success') return
    expect(retry.tickets.map((ticket) => ticket.id).sort()).toEqual(['TKT-FOUR', 'TKT-THREE'])
    expect(purchase).toHaveBeenCalledTimes(3)
    expect(listTickets().filter((ticket) => ticket.id.startsWith('TKT-'))).toHaveLength(2)
  })

  it('does not claim a ticket when the backend refuses every seat', async () => {
    pendingOrder('TM-BACKEND-0003')
    paymentSuccess('TM-BACKEND-0003')
    purchase.mockRejectedValue(new Error('Tickets are sold out'))

    const result = await completePayment('TM-BACKEND-0003')

    expect(result.kind).toBe('failed')
    if (result.kind !== 'failed') return
    expect(result.message).toContain('no tickets could be issued')
    expect(listTickets().filter((ticket) => ticket.id.startsWith('TKT-'))).toHaveLength(0)
  })
})
