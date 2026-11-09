import { afterEach, describe, expect, it, vi } from 'vitest'
import { issueTicket, normalizeTicketCode } from '../../../lib/tickets'
import { validateTicket } from './useTicketValidator'

function stubValidation(response: object) {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
    new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('ticket ids', () => {
  it('are long, random looking and unique', () => {
    const ids = Array.from({ length: 40 }, () =>
      issueTicket({
        userId: 'u-test',
        eventId: 'event-one',
        eventName: 'Event One',
        date: '2026-11-14',
        time: '18:00',
        venue: 'Test Venue',
        city: 'Blantyre',
        ticketType: 'General',
        price: 35000,
        holder: 'Test Holder',
      }).id,
    )
    for (const id of ids) expect(id).toMatch(/^TM-2026-[A-HJ-NP-Z2-9]{12}$/)
    expect(new Set(ids).size).toBe(40)
  })
})

describe('normalizeTicketCode', () => {
  it('accepts plain, prefixed, and signed ticket codes', () => {
    expect(normalizeTicketCode('TM-2026-ABCDEFGHJKLM')).toBe('TM-2026-ABCDEFGHJKLM')
    expect(normalizeTicketCode('ticket:tm-2026-abcdefghjklm')).toBe('TM-2026-ABCDEFGHJKLM')
    expect(normalizeTicketCode('TICKET:TM-2026-ABCDEFGHJKLM.0123456789')).toBe(
      'TM-2026-ABCDEFGHJKLM',
    )
  })
})

describe('validateTicket', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sends the QR token and maps an accepted backend response', async () => {
    const fetchMock = stubValidation({
      accepted: true,
      reason: null,
      ticketId: '42',
      eventId: '7',
      validatedAt: '2026-11-14T18:00:00.000Z',
      details: { ticketNumber: 'TKT-42', ticketType: 'General' },
    })

    const result = await validateTicket('TICKET:secret-token.signature', '7')

    expect(result.status).toBe('valid')
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      qrToken: 'secret-token',
      eventId: '7',
    })
  })

  it.each([
    ['ALREADY_USED', 'used'],
    ['WRONG_EVENT', 'wrong_event'],
    ['CANCELLED', 'invalid'],
    ['EVENT_CANCELLED', 'invalid'],
    ['NOT_FOUND', 'invalid'],
  ] as const)('maps backend reason %s', async (reason, status) => {
    stubValidation({
      accepted: false,
      reason,
      ticketId: '42',
      eventId: '7',
      validatedAt: null,
      details: { ticketNumber: 'TKT-42', eventTitle: 'Another Event' },
    })

    expect((await validateTicket('secret-token', '7')).status).toBe(status)
  })
})
