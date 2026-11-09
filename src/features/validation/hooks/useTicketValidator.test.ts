// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { issueTicket, normalizeTicketCode, ticketQrValue } from '../../../lib/tickets'
import { signTicket } from '../../../lib/ticketSignature'
import { validateTicket } from './useTicketValidator'

// validateTicket requires a logged-in staff user who is assigned to the event.
// Seed both the session (tm_user) and the account row (tm_accounts) before each test.
function loginAsStaff(assignedEventIds: string[] = ['event-one', 'lake-of-stars', 'dev-summit']) {
  window.localStorage.setItem(
    'tm_user',
    JSON.stringify({ id: 'u-3', name: 'Gate Staff', email: 'staff@example.com', role: 'staff' }),
  )
  window.localStorage.setItem(
    'tm_accounts',
    JSON.stringify([
      {
        id: 'u-3',
        name: 'Gate Staff',
        email: 'staff@example.com',
        password: 'password123',
        role: 'staff',
        status: 'active',
        organizerId: 'u-2',
        assignedEventIds,
      },
      {
        id: 'u-2',
        name: 'Nyasa Events',
        email: 'organizer@example.com',
        password: 'password123',
        role: 'organizer',
        status: 'active',
      },
    ]),
  )
}

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
    loginAsStaff()
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

describe('validateTicket', () => {
  beforeEach(() => {
    window.localStorage.clear()
    loginAsStaff()
  })

  it('accepts a ticket scanned from its signed QR code, once', async () => {
    const ticket = newTicket()
    const qr = ticketQrValue(ticket.id)
    expect(qr).toBe('TICKET:' + ticket.id + '.' + signTicket(ticket.id, ticket.eventId))

    expect((await validateTicket(qr, 'event-one')).status).toBe('valid')
    expect((await validateTicket(qr, 'event-one')).status).toBe('used')
  })

  it('rejects a forged tag with a specific message', async () => {
    const ticket = newTicket()
    const result = await validateTicket('TICKET:' + ticket.id + '.0000000000', 'event-one')
    expect(result.status).toBe('invalid')
    expect(result.tampered).toBe(true)
    expect(result.title).toBe('Tampered ticket')
    expect(result.ticket).toBeUndefined()
  })

  it('does not admit the ticket after a forged scan', async () => {
    const ticket = newTicket()
    await validateTicket('TICKET:' + ticket.id + '.0000000000', 'event-one')
    expect((await validateTicket(ticketQrValue(ticket.id), 'event-one')).status).toBe('valid')
  })

  it('rejects another ticket\'s tag on this ticket id', async () => {
    const first = newTicket()
    const second = newTicket()
    const forged = 'TICKET:' + second.id + '.' + signTicket(first.id, first.eventId)
    expect((await validateTicket(forged, 'event-one')).tampered).toBe(true)
  })

  it('rejects a tag that belongs to a different event', async () => {
    const ticket = newTicket('event-one')
    const forged = 'TICKET:' + ticket.id + '.' + signTicket(ticket.id, 'another-event')
    expect((await validateTicket(forged, 'event-one')).tampered).toBe(true)
  })

  it('rejects an altered id that still carries a tag as tampered', async () => {
    const ticket = newTicket()
    const altered = 'TICKET:' + ticket.id.slice(0, -1) + (ticket.id.endsWith('A') ? 'B' : 'A') + '.' + signTicket(ticket.id, ticket.eventId)
    const result = await validateTicket(altered, 'event-one')
    expect(result.status).toBe('invalid')
    expect(result.tampered).toBe(true)
  })

  it('rejects an unknown id as invalid', async () => {
    const result = await validateTicket('TICKET:TM-2026-ZZZZZZZZZZZZ', 'event-one')
    expect(result.status).toBe('invalid')
    expect(result.tampered).toBeUndefined()
    expect(result.title).toBe('Invalid ticket')
  })

  it('still accepts a plain ticket id without a tag (legacy form)', async () => {
    const ticket = newTicket()
    expect((await validateTicket(ticket.id, 'event-one')).status).toBe('valid')
  })

  it('still accepts the seeded demo ticket, plain or from its signed QR code', async () => {
    expect((await validateTicket('TM-2026-K7QX4ZP9R2WM', 'lake-of-stars')).status).toBe('valid')
    expect((await validateTicket(ticketQrValue('TM-2026-H3VN8DC5T6YB'), 'dev-summit')).status).toBe('valid')
  })
})
