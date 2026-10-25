import type { Event, TicketType } from '../types/event'
import { calculateTotals } from '../features/checkout/format'
import { SERVICE_FEE } from '../features/checkout/mockData'

export type TicketStatus = 'valid' | 'used'

export interface TicketRecord {
  id: string
  eventId: string
  eventName: string
  date: string // ISO date, e.g. 2026-11-14
  time: string // 24h, e.g. 18:00
  venue: string
  city: string
  ticketType: string
  price: number // in MK
  holder: string
  ownerEmail?: string
  status: TicketStatus
  checkedInAt?: string
}

export type BookingStatus = 'confirmed' | 'cancelled'

export interface BookingRecord {
  id: string
  eventTitle: string
  venue: string
  date: string // ISO date
  quantity: number
  subtotal: number // tickets only, in MK
  serviceFee: number // in MK
  total: number // what the customer paid (subtotal + serviceFee), in MK
  status: BookingStatus
  ticketIds: string[]
}

export type TicketValidationStatus = 'valid' | 'invalid' | 'used' | 'wrong_event'

export interface TicketValidationResult {
  status: TicketValidationStatus
  title: string
  message: string
  ticket?: TicketRecord
}

export const TICKETS_KEY = 'tm.ticket-master.tickets'
export const BOOKINGS_KEY = 'tm.ticket-master.bookings'

// QR codes encode "TICKET:<id>"; accept both forms everywhere.
export function normalizeTicketCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/^TICKET:/, '')
}

const DEMO_TICKETS: TicketRecord[] = []

const DEMO_BOOKINGS: BookingRecord[] = []

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readList<T>(key: string, seed: T[]): T[] {
  if (!hasStorage()) return [...seed]

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(seed))
    return [...seed]
  }

  try {
    const parsed = JSON.parse(raw) as T[]
    return Array.isArray(parsed) ? parsed : [...seed]
  } catch {
    window.localStorage.setItem(key, JSON.stringify(seed))
    return [...seed]
  }
}

function writeList<T>(key: string, items: T[]): void {
  if (!hasStorage()) return
  window.localStorage.setItem(key, JSON.stringify(items))
}

export function listTickets(): TicketRecord[] {
  return readList(TICKETS_KEY, DEMO_TICKETS)
}

export function getTicket(id: string): TicketRecord | undefined {
  const normalized = normalizeTicketCode(id)
  return listTickets().find((ticket) => ticket.id.toUpperCase() === normalized)
}

// Older saved bookings have no breakdown. Derive one so the UI never
// shows undefined (subtotal = total - service fee, as the issue asks).
function withBreakdown(record: BookingRecord): BookingRecord {
  if (typeof record.subtotal === 'number' && typeof record.serviceFee === 'number') {
    return record
  }
  return {
    ...record,
    serviceFee: SERVICE_FEE,
    subtotal: Math.max(record.total - SERVICE_FEE, 0),
  }
}

export function listBookings(): BookingRecord[] {
  return readList<BookingRecord>(BOOKINGS_KEY, DEMO_BOOKINGS).map(withBreakdown)
}

function generateId(prefix: string): string {
  const serial = String(Math.floor(100000 + Math.random() * 900000))
  return `${prefix}-2026-${serial}`
}

export interface IssueTicketInput {
  ownerEmail?: string
  eventId: string
  eventName: string
  date: string
  time: string
  venue: string
  city: string
  ticketType: string
  price: number
  holder: string
}

export function issueTicket(input: IssueTicketInput): TicketRecord {
  const tickets = listTickets()
  let id = generateId('TM')
  while (tickets.some((ticket) => ticket.id === id)) {
    id = generateId('TM')
  }

  const ticket: TicketRecord = {
    ...input,
    id,
    status: 'valid',
  }

  writeList(TICKETS_KEY, [ticket, ...tickets])
  return ticket
}

export function markTicketUsed(id: string): TicketRecord | undefined {
  const normalized = normalizeTicketCode(id)
  const tickets = listTickets()
  const index = tickets.findIndex((ticket) => ticket.id.toUpperCase() === normalized)
  if (index === -1) return undefined

  const updated: TicketRecord = {
    ...tickets[index],
    status: 'used',
    checkedInAt: new Date().toISOString(),
  }
  tickets[index] = updated
  writeList(TICKETS_KEY, tickets)
  return updated
}

export interface IssueBookingInput {
  event: Event
  ticketType: TicketType
  quantity: number
  holder: string
  ownerEmail?: string
  serviceFee?: number // defaults to the checkout service fee
}

export interface IssueBookingResult {
  booking: BookingRecord
  tickets: TicketRecord[]
}

// Issues the tickets and the booking that owns them in one step.
export function issueBooking(input: IssueBookingInput): IssueBookingResult {
  const { event, ticketType, quantity, holder, ownerEmail, serviceFee } = input

  const tickets: TicketRecord[] = []
  for (let index = 0; index < quantity; index += 1) {
    tickets.push(
      issueTicket({
        eventId: event.id,
        eventName: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        city: event.city,
        ticketType: ticketType.name,
        price: ticketType.price,
        holder: holder.trim() || 'Guest',
        ownerEmail,
      }),
    )
  }

  const bookings = listBookings()
  let bookingId = generateId('BK')
  while (bookings.some((booking) => booking.id === bookingId)) {
    bookingId = generateId('BK')
  }

  // Same calculation the checkout page uses, so the stored total always
  // matches the amount the customer was charged.
  const totals = calculateTotals(ticketType.price, quantity, serviceFee)

  const booking: BookingRecord = {
    id: bookingId,
    eventTitle: event.title,
    venue: event.venue,
    date: event.date,
    quantity,
    subtotal: totals.subtotal,
    serviceFee: totals.serviceFee,
    total: totals.total,
    status: 'confirmed',
    ticketIds: tickets.map((ticket) => ticket.id),
  }

  writeList(BOOKINGS_KEY, [booking, ...bookings])
  return { booking, tickets }
}
