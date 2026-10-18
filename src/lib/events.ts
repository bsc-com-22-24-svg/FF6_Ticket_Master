import { events as SEED_EVENTS } from '../mocks/events'
import type { Event, TicketType } from '../types/event'

export type EventStatus = 'Draft' | 'Published'

export interface StoredEvent extends Event {
  status: EventStatus
}

export interface EventInput {
  id?: string
  title: string
  description: string
  category: string
  city: string
  venue: string
  date: string
  time: string
  organizer: string
  image: string
  status: EventStatus
  ticketTypes: TicketType[]
}

export const EVENTS_KEY = 'tm.ticket-master.events'

const seed = (): StoredEvent[] => SEED_EVENTS.map((event) => ({ ...event, status: 'Published' }))

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readEvents(): StoredEvent[] {
  if (!hasStorage()) return seed()

  const raw = window.localStorage.getItem(EVENTS_KEY)
  if (!raw) {
    const initial = seed()
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(initial))
    return initial
  }

  try {
    const parsed = JSON.parse(raw) as StoredEvent[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seed()
  } catch {
    const initial = seed()
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(initial))
    return initial
  }
}

function writeEvents(items: StoredEvent[]): void {
  if (!hasStorage()) return
  window.localStorage.setItem(EVENTS_KEY, JSON.stringify(items))
}

// Every event, including drafts — for the organizer workspace.
export function listAllEvents(): StoredEvent[] {
  return readEvents()
}

// Only published events — what the public site shows.
export function listEvents(): StoredEvent[] {
  return readEvents().filter((event) => event.status === 'Published')
}

export function getEvent(id: string): StoredEvent | undefined {
  return readEvents().find((event) => event.id === id)
}

function makeId(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || `event-${Date.now()}`
}

export function saveEvent(input: EventInput): StoredEvent {
  const events = readEvents()
  const existing = input.id ? events.find((event) => event.id === input.id) : undefined

  const saved: StoredEvent = {
    id: existing?.id ?? input.id ?? makeId(input.title),
    title: input.title.trim(),
    description: input.description,
    category: input.category,
    city: input.city,
    venue: input.venue,
    date: input.date,
    time: input.time,
    organizer: input.organizer,
    image: input.image || '/images/events/event-1.webp',
    status: input.status,
    ticketTypes: input.ticketTypes.map((type) => ({ ...type })),
  }

  if (existing) {
    writeEvents(events.map((event) => (event.id === existing.id ? saved : event)))
  } else {
    writeEvents([saved, ...events])
  }

  return saved
}

export function deleteEvent(id: string): void {
  writeEvents(readEvents().filter((event) => event.id !== id))
}

// Called after a successful purchase so remaining seats drop everywhere.
export function incrementSold(eventId: string, ticketTypeId: string, quantity: number): void {
  const events = readEvents()
  const event = events.find((candidate) => candidate.id === eventId)
  if (!event) return

  event.ticketTypes = event.ticketTypes.map((type) =>
    type.id === ticketTypeId
      ? { ...type, sold: Math.min(type.capacity, type.sold + quantity) }
      : type,
  )
  writeEvents([...events])
}

// Wipes organizer changes and restores the seed catalog (demo helper).
export function resetEvents(): void {
  writeEvents(seed())
}
