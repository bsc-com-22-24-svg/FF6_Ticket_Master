export type TicketStatus = 'valid' | 'used'

export interface TicketRecord {
  id: string
  eventId: string
  eventName: string
  date: string
  venue: string
  ticketType: string
  holder: string
  status: TicketStatus
  checkedInAt?: string
}

export type TicketValidationStatus = 'valid' | 'invalid' | 'used' | 'wrong_event'

export interface TicketValidationResult {
  status: TicketValidationStatus
  title: string
  message: string
  ticket?: TicketRecord
}

export const STORAGE_KEY = 'tm.ticket-master.tickets'

const DEMO_TICKETS: TicketRecord[] = [
  {
    id: 'TM-2026-004871',
    eventId: 'evt-lakeshore',
    eventName: 'Lakeshore Music Fest',
    date: 'Sat 24 Oct',
    venue: 'Mount Soche Grounds, Blantyre',
    ticketType: 'General',
    holder: 'Chimwemwe Banda',
    status: 'valid',
  },
  {
    id: 'TM-2026-009999',
    eventId: 'evt-dev-summit',
    eventName: 'Dev Summit 2026',
    date: 'Fri 6 Nov',
    venue: 'Bingu wa Mutharika ICC, Lilongwe',
    ticketType: 'General',
    holder: 'Mphatso Gondwe',
    status: 'valid',
  },
  {
    id: 'TM-2026-002540',
    eventId: 'evt-lakeshore',
    eventName: 'Lakeshore Music Fest',
    date: 'Sat 24 Oct',
    venue: 'Mount Soche Grounds, Blantyre',
    ticketType: 'VIP',
    holder: 'Tadala Phiri',
    status: 'used',
  },
]

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readTickets(): TicketRecord[] {
  if (!hasStorage()) return [...DEMO_TICKETS]

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    writeTickets(DEMO_TICKETS)
    return [...DEMO_TICKETS]
  }

  try {
    const parsed = JSON.parse(raw) as TicketRecord[]
    return Array.isArray(parsed) ? parsed : [...DEMO_TICKETS]
  } catch {
    writeTickets(DEMO_TICKETS)
    return [...DEMO_TICKETS]
  }
}

function writeTickets(tickets: TicketRecord[]): void {
  if (!hasStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
}

export function listTickets(): TicketRecord[] {
  return readTickets()
}

export function getTicket(id: string): TicketRecord | undefined {
  const normalized = id.trim().toUpperCase()
  return readTickets().find((ticket) => ticket.id.toUpperCase() === normalized)
}

function generateId(): string {
  const serial = String(Math.floor(100000 + Math.random() * 900000))
  return `TM-2026-${serial}`
}

export interface IssueTicketInput {
  eventId: string
  eventName: string
  date: string
  venue: string
  ticketType: string
  holder: string
}

export function issueTicket(input: IssueTicketInput): TicketRecord {
  const tickets = readTickets()
  let id = generateId()
  while (tickets.some((ticket) => ticket.id === id)) {
    id = generateId()
  }

  const ticket: TicketRecord = {
    ...input,
    id,
    status: 'valid',
  }

  writeTickets([ticket, ...tickets])
  return ticket
}

export function markTicketUsed(id: string): TicketRecord | undefined {
  const normalized = id.trim().toUpperCase()
  const tickets = readTickets()
  const index = tickets.findIndex((ticket) => ticket.id.toUpperCase() === normalized)
  if (index === -1) return undefined

  const updated: TicketRecord = {
    ...tickets[index],
    status: 'used',
    checkedInAt: new Date().toISOString(),
  }
  tickets[index] = updated
  writeTickets(tickets)
  return updated
}
