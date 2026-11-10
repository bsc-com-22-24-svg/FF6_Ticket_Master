import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  backendTicketToRecord,
  backendValidationToResult,
  extractQrToken,
  purchaseBackendTicket,
  validateBackendTicket,
} from './backendTickets'
import type { Event, TicketType } from '../types/event'

const TOKEN = '3d594650-3f1c-4c8d-9e4a-1b2c3d4e5f60'

function stubResponse(body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('extractQrToken', () => {
  it('accepts the raw backend UUID and the legacy signed form', () => {
    expect(extractQrToken(TOKEN)).toBe(TOKEN)
    expect(extractQrToken(`TICKET:${TOKEN}.AAAAAAAAAA`)).toBe(TOKEN)
    expect(extractQrToken('  ')).toBe('')
  })
})

describe('purchaseBackendTicket', () => {
  it('passes the PayChangu reference so the backend can verify payment', async () => {
    const fetchMock = stubResponse({ ticketNumber: 'TKT-ABC123', qrCodeDataUrl: 'data:image/png;base64,abc', status: 'ISSUED' })

    await purchaseBackendTicket('4', '7', 'TM-TEST-0001')

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/be/tickets/purchase')
    expect(JSON.parse(String(init.body))).toEqual({ eventId: '4', ticketTypeId: '7', txRef: 'TM-TEST-0001' })
  })
})

describe('validateBackendTicket', () => {
  it('sends the UUID and event id to the backend validation endpoint', async () => {
    const fetchMock = stubResponse({
      accepted: true,
      reason: null,
      ticketId: '10',
      eventId: '4',
      validatedAt: '2026-11-06T10:00:00.000Z',
      details: { ticketNumber: 'TKT-ABC123', ticketType: 'General', eventTitle: 'Lake of Stars' },
    })

    const result = await validateBackendTicket(`TICKET:${TOKEN}.IGNORED`, '4')

    expect(result.accepted).toBe(true)
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/be/tickets/validate')
    expect(JSON.parse(String(init.body))).toEqual({ qrToken: TOKEN, eventId: '4' })
  })
})

describe('backendValidationToResult', () => {
  it('maps an accepted scan to the valid scanner state', () => {
    const result = backendValidationToResult({
      accepted: true,
      reason: null,
      ticketId: '10',
      eventId: '4',
      validatedAt: '2026-11-06T10:00:00.000Z',
      details: { ticketNumber: 'TKT-ABC123', ticketType: 'VIP' },
    })
    expect(result.status).toBe('valid')
    expect(result.message).toContain('TKT-ABC123')
    expect(result.message).toContain('VIP')
  })

  it('maps the backend rejection reasons to scanner states', () => {
    const base = {
      accepted: false,
      ticketId: '10',
      eventId: '4',
      validatedAt: null,
      details: { ticketNumber: 'TKT-ABC123', eventTitle: 'Lake of Stars' },
    }
    expect(backendValidationToResult({ ...base, reason: 'ALREADY_USED' }).status).toBe('used')
    expect(backendValidationToResult({ ...base, reason: 'WRONG_EVENT' }).status).toBe('wrong_event')
    expect(backendValidationToResult({ ...base, reason: 'NOT_FOUND' }).status).toBe('invalid')
    expect(backendValidationToResult({ ...base, reason: 'CANCELLED' }).title).toBe('Cancelled ticket')
    expect(backendValidationToResult({ ...base, reason: 'EVENT_CANCELLED' }).title).toBe('Event cancelled')
  })
})

describe('backendTicketToRecord', () => {
  it('keeps the server ticket number and QR image', () => {
    const event: Event = {
      id: '4',
      title: 'Lake of Stars',
      description: '',
      category: 'Community',
      city: 'Mangochi',
      venue: 'Cape Maclear',
      date: '2026-11-14',
      time: '17:00',
      organizer: 'Organizer',
      image: '',
      ticketTypes: [],
    }
    const ticketType: TicketType = {
      id: '7',
      name: 'VIP',
      price: 50000,
      capacity: 20,
      sold: 1,
    }

    const ticket = backendTicketToRecord(
      { ticketNumber: 'TKT-ABC123', qrCodeDataUrl: 'data:image/png;base64,abc', status: 'ISSUED' },
      { userId: '9', event, ticketType, holder: ' Test Holder ' },
    )

    expect(ticket.id).toBe('TKT-ABC123')
    expect(ticket.holder).toBe('Test Holder')
    expect(ticket.status).toBe('valid')
    expect(ticket.qrCodeDataUrl).toBe('data:image/png;base64,abc')
  })
})
