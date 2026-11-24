import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StoredEvent } from '../../types/event'
import type { TicketRecord } from '../../lib/tickets'
import { api } from '../../lib/backend'
import { getPendingPayment, savePendingPayment } from '../../lib/paychangu'

vi.mock('../../lib/backend', () => ({ USE_BACKEND: true, api: vi.fn() }))
vi.mock('../../lib/backendEvents', () => ({ fetchBackendEvent: vi.fn() }))
vi.mock('../../lib/backendTickets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/backendTickets')>()
  return { ...actual, purchaseBackendTicket: vi.fn() }
})
vi.mock('../../features/tickets/ticketData', () => ({ fetchTicketRecords: vi.fn() }))

import { fetchBackendEvent } from '../../lib/backendEvents'
import { purchaseBackendTicket } from '../../lib/backendTickets'
import { fetchTicketRecords } from '../../features/tickets/ticketData'
import { completePayment } from './completePayment'

const EVENT: StoredEvent = {
  id: '7',
  status: 'Published',
  title: 'Lake of Stars',
  category: 'Concert',
  city: 'Salima',
  venue: 'Lake Shore',
  date: '2026-12-20',
  time: '18:00',
  description: 'Live music',
  organizer: 'Nyasa Events',
  image: '/images/events/event-1.webp',
  ticketTypes: [{ id: '11', name: 'General', price: 5000, capacity: 100, sold: 0 }],
}

const apiMock = vi.mocked(api)
const eventMock = vi.mocked(fetchBackendEvent)
const purchase = vi.mocked(purchaseBackendTicket)
const ticketRecords = vi.mocked(fetchTicketRecords)

function pendingOrder(txRef: string) {
  savePendingPayment({
    txRef,
    orderNumber: `ORD-${txRef}`,
    eventId: EVENT.id,
    ticketTypeId: '11',
    quantity: 2,
    holder: 'Test Holder',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    status: 'pending',
  })
}

function confirmPayment(txRef: string) {
  apiMock.mockResolvedValue({ paymentStatus: 'success', tx_ref: txRef })
}

function purchased(number: string) {
  return {
    ticketNumber: number,
    qrCodeDataUrl: `data:image/png;base64,${number}`,
    status: 'ISSUED',
  }
}

function existingTicket(number: string): TicketRecord {
  return {
    id: number,
    userId: 'user-1',
    eventId: EVENT.id,
    eventName: EVENT.title,
    date: EVENT.date,
    time: EVENT.time,
    venue: EVENT.venue,
    city: EVENT.city,
    ticketType: 'General',
    price: 5000,
    holder: 'Test Holder',
    status: 'valid',
    createdAt: new Date().toISOString(),
  }
}

describe('completePayment with the backend', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
    eventMock.mockResolvedValue(EVENT)
    ticketRecords.mockResolvedValue([])
  })

  it('claims one backend ticket per seat and keeps the server QR image', async () => {
    pendingOrder('TM-BACKEND-0001')
    confirmPayment('TM-BACKEND-0001')
    purchase
      .mockResolvedValueOnce(purchased('TKT-ONE'))
      .mockResolvedValueOnce(purchased('TKT-TWO'))

    const result = await completePayment('TM-BACKEND-0001')

    expect(result.kind).toBe('success')
    if (result.kind !== 'success') return
    expect(result.tickets.map((ticket) => ticket.id).sort()).toEqual(['TKT-ONE', 'TKT-TWO'])
    expect(result.tickets.every((ticket) => ticket.qrCodeDataUrl?.includes(ticket.id))).toBe(true)
    expect(purchase).toHaveBeenCalledTimes(2)
    expect(purchase).toHaveBeenCalledWith(EVENT.id, '11', 'TM-BACKEND-0001')
    expect(getPendingPayment('TM-BACKEND-0001')?.status).toBe('completed')
  })

  it('reports tickets that were bought when a later claim fails, then retries only the missing seat', async () => {
    pendingOrder('TM-BACKEND-0002')
    confirmPayment('TM-BACKEND-0002')
    purchase
      .mockResolvedValueOnce(purchased('TKT-THREE'))
      .mockRejectedValueOnce(new Error('Tickets are sold out'))

    const first = await completePayment('TM-BACKEND-0002')

    expect(first.kind).toBe('partial')
    if (first.kind !== 'partial') return
    expect(first.tickets.map((ticket) => ticket.id)).toEqual(['TKT-THREE'])
    expect(first.message).toContain('1 of 2')
    expect(getPendingPayment('TM-BACKEND-0002')?.ticketIds).toEqual(['TKT-THREE'])

    ticketRecords.mockResolvedValueOnce([existingTicket('TKT-THREE')])
    purchase.mockResolvedValueOnce(purchased('TKT-FOUR'))
    const retry = await completePayment('TM-BACKEND-0002')

    expect(retry.kind).toBe('success')
    if (retry.kind !== 'success') return
    expect(retry.tickets.map((ticket) => ticket.id).sort()).toEqual(['TKT-FOUR', 'TKT-THREE'])
    expect(purchase).toHaveBeenCalledTimes(3)
    expect(getPendingPayment('TM-BACKEND-0002')?.ticketIds?.sort()).toEqual(['TKT-FOUR', 'TKT-THREE'])
  })

  it('does not claim a ticket when the backend refuses every seat', async () => {
    pendingOrder('TM-BACKEND-0003')
    confirmPayment('TM-BACKEND-0003')
    purchase.mockRejectedValue(new Error('Tickets are sold out'))

    const result = await completePayment('TM-BACKEND-0003')

    expect(result.kind).toBe('failed')
    if (result.kind !== 'failed') return
    expect(result.message).toContain('no tickets could be issued')
    expect(getPendingPayment('TM-BACKEND-0003')?.status).toBe('pending')
  })
})
