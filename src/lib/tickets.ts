import type { Event, TicketType } from '../types/event'
import { calculateTotals } from '../features/checkout/format'
import { SERVICE_FEE } from '../features/checkout/mockData'
import { findUserByEmail } from '../features/authentication/authStore'
import { isValidTicketTag, signTicket } from './ticketSignature'

export type TicketStatus = 'valid' | 'used'

export interface TicketRecord {
  id: string
  userId: string
  eventId: string
  eventName: string
  date: string // ISO date, e.g. 2026-11-14
  time: string // 24h, e.g. 18:00
  venue: string
  city: string
  ticketType: string
  price: number // in MK
  holder: string
  status: TicketStatus
  createdAt: string // ISO timestamp, used for sales reporting
  checkedInAt?: string
}

export type BookingStatus = 'confirmed' | 'cancelled'

export interface BookingRecord {
  id: string
  userId: string
  eventId: string
  eventTitle: string
  venue: string
  date: string // ISO date
  quantity: number
  subtotal: number // tickets only, in MK
  serviceFee: number // in MK
  total: number // what the customer paid (subtotal + serviceFee), in MK
  status: BookingStatus
  ticketIds: string[]
  createdAt: string // ISO timestamp, used for sales reporting
}

export type TicketValidationStatus = 'valid' | 'invalid' | 'used' | 'wrong_event'

export interface TicketValidationResult {
  status: TicketValidationStatus
  title: string
  message: string
  ticket?: TicketRecord
  tampered?: boolean // the QR code carried a security tag that did not match
}

// Versioned keys. Records written by older builds are migrated on first read.
export const TICKETS_KEY = 'tm.ticket-master.tickets.v3'
export const BOOKINGS_KEY = 'tm.ticket-master.bookings.v3'
const LEGACY_TICKETS_KEY = 'tm.ticket-master.tickets'
const LEGACY_BOOKINGS_KEY = 'tm.ticket-master.bookings'

// The seeded demo data belongs to the one-tap customer account.
export const DEMO_CUSTOMER_ID = 'u-1'

// A scanned or typed code can look like any of these (all accepted):
//   TM-2026-ABCDEFGHJKLM                  plain ticket id (older form)
//   TICKET:TM-2026-ABCDEFGHJKLM           QR code, unsigned (older form)
//   TICKET:TM-2026-ABCDEFGHJKLM.1A2B3C4D5E   QR code with its security tag
export function parseTicketCode(raw: string): { id: string; tag: string | null } {
  const cleaned = raw.trim().toUpperCase().replace(/^TICKET:/, '')
  const dot = cleaned.lastIndexOf('.')
  if (dot === -1) return { id: cleaned, tag: null }
  return { id: cleaned.slice(0, dot), tag: cleaned.slice(dot + 1) }
}

// the ticket id only, whichever form was scanned
export function normalizeTicketCode(raw: string): string {
  return parseTicketCode(raw).id
}

// Demo timestamps are relative to first load so the "last 7 days" chart has
// something to show whenever the demo is opened.
function demoCreatedAt(daysAgo: number, hour: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

const DEMO_TICKETS: TicketRecord[] = [
  {
    id: 'TM-2026-K7QX4ZP9R2WM',
    userId: DEMO_CUSTOMER_ID,
    eventId: 'lake-of-stars',
    eventName: 'Lake of Stars Live',
    date: '2026-11-14',
    time: '17:00',
    venue: 'Cape Maclear Beach',
    city: 'Mangochi',
    ticketType: 'General',
    price: 35000,
    holder: 'Chimwemwe Banda',
    status: 'valid',
    createdAt: demoCreatedAt(2, 18),
  },
  {
    id: 'TM-2026-H3VN8DC5T6YB',
    userId: DEMO_CUSTOMER_ID,
    eventId: 'dev-summit',
    eventName: 'Dev Summit 2026',
    date: '2026-11-06',
    time: '09:00',
    venue: 'Bingu wa Mutharika ICC',
    city: 'Lilongwe',
    ticketType: 'Standard',
    price: 20000,
    holder: 'Chimwemwe Banda',
    status: 'valid',
    createdAt: demoCreatedAt(1, 9),
  },
  {
    id: 'TM-2026-W9FJ2MXA4LEU',
    userId: DEMO_CUSTOMER_ID,
    eventId: 'mzuzu-food-fair',
    eventName: 'Mzuzu Food Fair',
    date: '2026-07-14',
    time: '11:00',
    venue: 'Mzuzu Showgrounds',
    city: 'Mzuzu',
    ticketType: 'Standard',
    price: 20000,
    holder: 'Chimwemwe Banda',
    status: 'used',
    createdAt: demoCreatedAt(5, 11),
    checkedInAt: '2026-07-14T11:42:00.000Z',
  },
]

const DEMO_BOOKINGS: BookingRecord[] = [
  {
    id: 'BK-2026-004871',
    userId: DEMO_CUSTOMER_ID,
    eventId: 'lake-of-stars',
    eventTitle: 'Lake of Stars Live',
    venue: 'Cape Maclear Beach',
    date: '2026-11-14',
    quantity: 1,
    subtotal: 35000,
    serviceFee: SERVICE_FEE,
    total: 35500,
    status: 'confirmed',
    ticketIds: ['TM-2026-K7QX4ZP9R2WM'],
    createdAt: demoCreatedAt(2, 18),
  },
  {
    id: 'BK-2026-009999',
    userId: DEMO_CUSTOMER_ID,
    eventId: 'dev-summit',
    eventTitle: 'Dev Summit 2026',
    venue: 'Bingu wa Mutharika ICC',
    date: '2026-11-06',
    quantity: 1,
    subtotal: 20000,
    serviceFee: SERVICE_FEE,
    total: 20500,
    status: 'confirmed',
    ticketIds: ['TM-2026-H3VN8DC5T6YB'],
    createdAt: demoCreatedAt(1, 9),
  },
  {
    id: 'BK-2026-002540',
    userId: DEMO_CUSTOMER_ID,
    eventId: 'mzuzu-food-fair',
    eventTitle: 'Mzuzu Food Fair',
    venue: 'Mzuzu Showgrounds',
    date: '2026-07-14',
    quantity: 1,
    subtotal: 20000,
    serviceFee: SERVICE_FEE,
    total: 20500,
    status: 'confirmed',
    ticketIds: ['TM-2026-W9FJ2MXA4LEU'],
    createdAt: demoCreatedAt(5, 11),
  },
  {
    id: 'BK-2026-001102',
    userId: DEMO_CUSTOMER_ID,
    eventId: 'lilongwe-jazz-night',
    eventTitle: 'Lilongwe Jazz Night',
    venue: 'Bingu International Conference Centre',
    date: '2026-12-05',
    quantity: 2,
    subtotal: 30000,
    serviceFee: SERVICE_FEE,
    total: 30500,
    status: 'cancelled',
    ticketIds: [],
    createdAt: demoCreatedAt(6, 20),
  },
]

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readList<T>(key: string, seed: T[], legacyKey?: string): T[] {
  if (!hasStorage()) return [...seed]

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    // One-time migration from the pre-userId keys. Real purchases win over
    // the demo seed; an empty legacy list means the demo was never seeded.
    if (legacyKey) {
      const legacyRaw = window.localStorage.getItem(legacyKey)
      if (legacyRaw) {
        window.localStorage.removeItem(legacyKey)
        try {
          const legacy = JSON.parse(legacyRaw) as T[]
          if (Array.isArray(legacy) && legacy.length > 0) {
            window.localStorage.setItem(key, JSON.stringify(legacy))
            return legacy
          }
        } catch {
          // corrupt legacy data: fall through to the fresh seed
        }
      }
    }
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

// Old builds stored an owner email instead of a user id. Map it back to the
// account so tickets bought before the upgrade do not disappear.
function legacyOwnerId(email?: string): string {
  if (!email) return ''
  if (!hasStorage()) return email
  return findUserByEmail(email)?.id ?? email
}

type LegacyTicket = Omit<TicketRecord, 'userId' | 'createdAt'> & {
  userId?: string
  createdAt?: string
  ownerEmail?: string
}

type LegacyBooking = Omit<BookingRecord, 'userId' | 'eventId' | 'createdAt'> & {
  userId?: string
  eventId?: string
  createdAt?: string
}

function normalizeTicket(record: LegacyTicket): TicketRecord {
  const userId =
    record.userId ||
    legacyOwnerId(record.ownerEmail) ||
    (DEMO_TICKETS.some((ticket) => ticket.id === record.id) ? DEMO_CUSTOMER_ID : '')

  return {
    ...record,
    userId,
    createdAt: record.createdAt ?? new Date().toISOString(),
  }
}

function normalizeBooking(record: LegacyBooking): BookingRecord {
  const tickets = listTickets()
  const firstTicket = tickets.find((ticket) => ticket.id === record.ticketIds[0])
  const serviceFee =
    typeof record.serviceFee === 'number' ? record.serviceFee : SERVICE_FEE
  const subtotal =
    typeof record.subtotal === 'number'
      ? record.subtotal
      : Math.max(record.total - serviceFee, 0)

  return {
    ...record,
    userId: record.userId || firstTicket?.userId || '',
    eventId: record.eventId || firstTicket?.eventId || '',
    serviceFee,
    subtotal,
    createdAt: record.createdAt ?? new Date().toISOString(),
  }
}

// Unscoped accessors are for staff, admin and organizer reporting.
export function listTickets(): TicketRecord[] {
  return readList<LegacyTicket>(TICKETS_KEY, DEMO_TICKETS, LEGACY_TICKETS_KEY).map(normalizeTicket)
}

// Customer-facing accessor: only the signed-in user's tickets.
export function listTicketsForUser(userId: string): TicketRecord[] {
  return listTickets().filter((ticket) => ticket.userId === userId)
}

export function getTicket(id: string): TicketRecord | undefined {
  const normalized = normalizeTicketCode(id)
  return listTickets().find((ticket) => ticket.id.toUpperCase() === normalized)
}

// What the QR code of a ticket contains: the id plus its security tag.
// A ticket that is not in the store (sample data) gets the plain older form.
export function ticketQrValue(id: string): string {
  const ticket = getTicket(id)
  if (!ticket) return 'TICKET:' + normalizeTicketCode(id)
  return 'TICKET:' + ticket.id + '.' + signTicket(ticket.id, ticket.eventId)
}

// true when the tag from a scanned QR code matches this ticket
export function hasValidSignature(ticket: TicketRecord, tag: string): boolean {
  return isValidTicketTag(ticket.id, ticket.eventId, tag)
}

export function listBookings(): BookingRecord[] {
  return readList<LegacyBooking>(BOOKINGS_KEY, DEMO_BOOKINGS, LEGACY_BOOKINGS_KEY).map(normalizeBooking)
}

// Customer-facing accessor: only the signed-in user's bookings.
export function listBookingsForUser(userId: string): BookingRecord[] {
  return listBookings().filter((booking) => booking.userId === userId)
}

// Clears current and legacy stores so the demo seed is recreated on reload.
export function resetTicketStore(): void {
  if (!hasStorage()) return
  for (const key of [TICKETS_KEY, BOOKINGS_KEY, LEGACY_TICKETS_KEY, LEGACY_BOOKINGS_KEY]) {
    window.localStorage.removeItem(key)
  }
}

// 32 characters (no I, O, 0 or 1) so each random byte maps to one character evenly
const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// 12 random characters = 60 bits, from the browser's secure random generator
function generateId(prefix: string): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  let serial = ''
  for (const byte of bytes) serial += ID_ALPHABET.charAt(byte & 31)
  return prefix + '-2026-' + serial
}

export interface IssueTicketInput {
  userId: string
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
    createdAt: new Date().toISOString(),
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
  userId: string
  event: Event
  ticketType: TicketType
  quantity: number
  holder: string
  serviceFee?: number // defaults to the checkout service fee
}

export interface IssueBookingResult {
  booking: BookingRecord
  tickets: TicketRecord[]
}

// Issues the tickets and the booking that owns them in one step.
export function issueBooking(input: IssueBookingInput): IssueBookingResult {
  const { userId, event, ticketType, quantity, holder, serviceFee } = input
  const createdAt = new Date().toISOString()

  const tickets: TicketRecord[] = []
  for (let index = 0; index < quantity; index += 1) {
    tickets.push(
      issueTicket({
        userId,
        eventId: event.id,
        eventName: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        city: event.city,
        ticketType: ticketType.name,
        price: ticketType.price,
        holder: holder.trim() || 'Guest',
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
    userId,
    eventId: event.id,
    eventTitle: event.title,
    venue: event.venue,
    date: event.date,
    quantity,
    subtotal: totals.subtotal,
    serviceFee: totals.serviceFee,
    total: totals.total,
    status: 'confirmed',
    ticketIds: tickets.map((ticket) => ticket.id),
    createdAt,
  }

  writeList(BOOKINGS_KEY, [booking, ...bookings])
  return { booking, tickets }
}
