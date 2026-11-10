// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { issueTicket, normalizeTicketCode } from '../../../lib/tickets'

function newTicket(eventId = 'event-one') {
  return issueTicket({
    userId: 'u-test',
    eventId,
    eventName: 'Event One',
    date: '2026-11-14',
    time: '18:00',
    venue: 'Test Venue',
    city: 'Blantyre',
    ticketType: 'General',
    price: 35000,
    holder: 'Test Holder',
  })
}

describe('ticket ids', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('are long, random looking and unique', () => {
    const ids = Array.from({ length: 40 }, () => newTicket().id)
    for (const id of ids) expect(id).toMatch(/^TM-2026-[A-HJ-NP-Z2-9]{12}$/)
    expect(new Set(ids).size).toBe(40)
  })
})

describe('normalizeTicketCode', () => {
  it('accepts the plain, prefixed and signed forms', () => {
    expect(normalizeTicketCode('TM-2026-ABCDEFGHJKLM')).toBe('TM-2026-ABCDEFGHJKLM')
    expect(normalizeTicketCode('ticket:tm-2026-abcdefghjklm')).toBe('TM-2026-ABCDEFGHJKLM')
    expect(normalizeTicketCode('TICKET:TM-2026-ABCDEFGHJKLM.0123456789')).toBe('TM-2026-ABCDEFGHJKLM')
  })
})
