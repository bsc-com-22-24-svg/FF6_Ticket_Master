import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../lib/backend'
import { getPendingPayment, savePendingPayment } from '../../lib/paychangu'

vi.mock('../../lib/backend', () => ({ api: vi.fn() }))
vi.mock('../../lib/backendTickets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/backendTickets')>()
  return { ...actual, purchaseBackendTicket: vi.fn() }
})

import { purchaseBackendTicket } from '../../lib/backendTickets'
import { completePayment } from './completePayment'

const EVENT_ID = '42'
const TICKET_TYPE_ID = '7'
const apiMock = vi.mocked(api)
const purchase = vi.mocked(purchaseBackendTicket)
let history: Array<Record<string, unknown>>
let verifiedTxRef = ''

const eventResponse = {
  id: EVENT_ID,
  title: 'Backend Test Event',
  description: 'Event loaded from the backend',
  venue: 'Test Grounds',
  location: 'Lilongwe',
  startAt: '2026-12-01T18:00:00.000Z',
  status: 'PUBLISHED',
}

const ticketTypeResponse = [{
  ticketTypeId: TICKET_TYPE_ID,
  name: 'General',
  price: 35000,
  quantity: 100,
  remaining: 100,
}]

function configureBackend() {
  apiMock.mockImplementation(async <T>(path: string): Promise<T> => {
    if (path === `/events/${EVENT_ID}`) return eventResponse as T
    if (path === `/events/${EVENT_ID}/ticket-types`) return ticketTypeResponse as T
    if (path === '/tickets/history') return history as T
    if (path === `/payments/${verifiedTxRef}/verify`) return { status: 'SUCCESS', txRef: verifiedTxRef } as T
    throw new Error(`Unexpected backend request: ${path}`)
  })
}

function pendingOrder(txRef: string) {
  savePendingPayment({
    txRef,
    orderNumber: 'ORD-100',
    eventId: EVENT_ID,
    ticketTypeId: TICKET_TYPE_ID,
    quantity: 2,
    holder: 'Test Holder',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    status: 'pending',
  })
}

function paymentSuccess(txRef: string) {
  verifiedTxRef = txRef
}

function purchased(number: string) {
  return {
    ticketNumber: number,
    qrCodeDataUrl: `data:image/png;base64,${number}`,
    status: 'ISSUED',
  }
}

describe('completePayment with backend ticket storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
    history = []
    verifiedTxRef = ''
    apiMock.mockReset()
    purchase.mockReset()
    configureBackend()
  })

  it('claims tickets from the backend and keeps the server QR image', async () => {
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
    expect(apiMock).toHaveBeenCalledWith('/events/42')
    expect(getPendingPayment('TM-BACKEND-0001')?.status).toBe('completed')
  })

  it('retries only tickets not already returned in backend history', async () => {
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

    history = [{
      ticketNumber: 'TKT-THREE',
      eventId: EVENT_ID,
      ticketTypeId: TICKET_TYPE_ID,
      status: 'ISSUED',
      issuedAt: '2026-11-08T10:00:00.000Z',
      checkedInAt: null,
      qrCodeDataUrl: 'data:image/png;base64,TKT-THREE',
    }]
    purchase.mockResolvedValueOnce(purchased('TKT-FOUR'))
    const retry = await completePayment('TM-BACKEND-0002')

    expect(retry.kind).toBe('success')
    if (retry.kind !== 'success') return
    expect(retry.tickets.map((ticket) => ticket.id).sort()).toEqual(['TKT-FOUR', 'TKT-THREE'])
    expect(purchase).toHaveBeenCalledTimes(3)
  })

  it('reports the payment but issues nothing when the backend refuses every ticket', async () => {
    pendingOrder('TM-BACKEND-0003')
    paymentSuccess('TM-BACKEND-0003')
    purchase.mockRejectedValue(new Error('Tickets are sold out'))

    const result = await completePayment('TM-BACKEND-0003')

    expect(result.kind).toBe('failed')
    if (result.kind !== 'failed') return
    expect(result.message).toContain('no tickets could be issued')
  })
})
