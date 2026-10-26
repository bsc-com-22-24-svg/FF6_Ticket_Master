import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listBookings, listTickets } from '../../lib/tickets'
import { getEvent } from '../../lib/events'
import { savePendingPayment } from '../../lib/paychangu'
import { completePayment } from './completePayment'

const EVENT_ID = 'lake-of-stars'

function pendingOrder(txRef: string, amount = 70500) {
  const event = getEvent(EVENT_ID)!
  const ticketType = event.ticketTypes[0]
  savePendingPayment({
    txRef,
    eventId: EVENT_ID,
    ticketTypeId: ticketType.id,
    quantity: 2,
    holder: 'Test Holder',
    ownerEmail: 'customer@example.com',
    amount,
    createdAt: new Date().toISOString(),
    status: 'pending',
  })
  return ticketType
}

function payChangu(body: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })),
  )
}

describe('completePayment', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('issues tickets and a booking only after PayChangu confirms the full amount', async () => {
    const ticketType = pendingOrder('TM-TEST-0001')
    const soldBefore = ticketType.sold
    const ticketsBefore = listTickets().length
    const bookingsBefore = listBookings().length
    payChangu({ status: 'success', tx_ref: 'TM-TEST-0001', amount: 70500, currency: 'MWK', channel: 'Mobile Money', reference: 'R1' })

    const result = await completePayment('TM-TEST-0001')

    expect(result.kind).toBe('success')
    expect(listTickets().length).toBe(ticketsBefore + 2)
    expect(listBookings().length).toBe(bookingsBefore + 1)
    expect(getEvent(EVENT_ID)!.ticketTypes[0].sold).toBe(soldBefore + 2)
  })

  it('never issues the same payment twice', async () => {
    pendingOrder('TM-TEST-0002')
    payChangu({ status: 'success', tx_ref: 'TM-TEST-0002', amount: 70500, currency: 'MWK' })

    await completePayment('TM-TEST-0002')
    const ticketsAfterFirst = listTickets().length
    const again = await completePayment('TM-TEST-0002')

    expect(again.kind).toBe('success')
    expect(listTickets().length).toBe(ticketsAfterFirst)
  })

  it('issues nothing when the payment is still pending', async () => {
    pendingOrder('TM-TEST-0003')
    const ticketsBefore = listTickets().length
    payChangu({ status: 'pending', tx_ref: 'TM-TEST-0003', amount: 70500, currency: 'MWK' })

    expect((await completePayment('TM-TEST-0003')).kind).toBe('pending')
    expect(listTickets().length).toBe(ticketsBefore)
  })

  it('issues nothing when the payment failed', async () => {
    pendingOrder('TM-TEST-0004')
    const ticketsBefore = listTickets().length
    payChangu({ status: 'failed', tx_ref: 'TM-TEST-0004', amount: 70500, currency: 'MWK' })

    expect((await completePayment('TM-TEST-0004')).kind).toBe('failed')
    expect(listTickets().length).toBe(ticketsBefore)
  })

  it('rejects a payment for less than the order total', async () => {
    pendingOrder('TM-TEST-0005')
    const ticketsBefore = listTickets().length
    payChangu({ status: 'success', tx_ref: 'TM-TEST-0005', amount: 100, currency: 'MWK' })

    expect((await completePayment('TM-TEST-0005')).kind).toBe('failed')
    expect(listTickets().length).toBe(ticketsBefore)
  })

  it('rejects a confirmation for a different reference or currency', async () => {
    pendingOrder('TM-TEST-0006')
    payChangu({ status: 'success', tx_ref: 'TM-OTHER-9999', amount: 70500, currency: 'MWK' })
    expect((await completePayment('TM-TEST-0006')).kind).toBe('failed')

    pendingOrder('TM-TEST-0007')
    payChangu({ status: 'success', tx_ref: 'TM-TEST-0007', amount: 70500, currency: 'USD' })
    expect((await completePayment('TM-TEST-0007')).kind).toBe('failed')
  })

  it('does not know orders that were never started in this browser', async () => {
    expect((await completePayment('TM-FORGED-0001')).kind).toBe('unknown')
  })
})
