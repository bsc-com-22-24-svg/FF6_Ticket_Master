import { beforeEach, describe, expect, it } from 'vitest'
import type { Event } from '../types/event'
import {
  getTicket,
  issueBooking,
  issueTicket,
  listBookings,
  listTickets,
  markTicketUsed,
  normalizeTicketCode,
  type IssueTicketInput,
} from './tickets'

const demoEvent: Event = {
  id: 'demo',
  title: 'Demo Event',
  category: 'Music',
  city: 'Lilongwe',
  venue: 'Demo Hall',
  date: '2026-12-01',
  time: '18:00',
  description: '',
  organizer: 'QA',
  image: '',
  ticketTypes: [{ id: 'general', name: 'General', price: 5000, capacity: 100, sold: 0 }],
}

const ticketInput: IssueTicketInput = {
  eventId: 'demo',
  eventName: 'Demo Event',
  date: '2026-12-01',
  time: '18:00',
  venue: 'Demo Hall',
  city: 'Lilongwe',
  ticketType: 'General',
  price: 5000,
  holder: 'Ada',
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('ticket store', () => {
  it('normalizes QR codes by trimming and stripping the TICKET: prefix', () => {
    expect(normalizeTicketCode('  ticket:tm-2026-000001 ')).toBe('TM-2026-000001')
    expect(normalizeTicketCode('tm-2026-000002')).toBe('TM-2026-000002')
  })

  it('issues a ticket that can be looked up by a normalized code', () => {
    const ticket = issueTicket(ticketInput)
    expect(ticket.status).toBe('valid')
    expect(getTicket(`TICKET:${ticket.id.toLowerCase()}`)?.id).toBe(ticket.id)
    expect(listTickets().some((candidate) => candidate.id === ticket.id)).toBe(true)
  })

  it('marks a ticket as used with a checked-in timestamp', () => {
    const ticket = issueTicket(ticketInput)
    const used = markTicketUsed(ticket.id)
    expect(used?.status).toBe('used')
    expect(used?.checkedInAt).toBeTruthy()
    expect(getTicket(ticket.id)?.status).toBe('used')
  })

  it('issues a booking whose tickets and total line up', () => {
    const { booking, tickets } = issueBooking({
      event: demoEvent,
      ticketType: demoEvent.ticketTypes[0],
      quantity: 2,
      holder: 'Ada',
    })
    expect(tickets).toHaveLength(2)
    expect(booking.total).toBe(10000)
    expect(booking.quantity).toBe(2)
    expect(booking.ticketIds).toEqual(tickets.map((ticket) => ticket.id))
    expect(listBookings().some((candidate) => candidate.id === booking.id)).toBe(true)
  })

  it('falls back to "Guest" when no holder is given', () => {
    const { tickets } = issueBooking({
      event: demoEvent,
      ticketType: demoEvent.ticketTypes[0],
      quantity: 1,
      holder: '   ',
    })
    expect(tickets[0].holder).toBe('Guest')
  })

  it('returns undefined for an unknown ticket code', () => {
    expect(getTicket('TM-DOES-NOT-EXIST')).toBeUndefined()
    expect(markTicketUsed('TM-DOES-NOT-EXIST')).toBeUndefined()
  })
})
