import { api } from './backend'
import type { EventItem } from '../features/organizer/Data/Events'

// Organizer side of the backend: create, publish, cancel and list the organizer's own events.

export interface NewTicketType {
  name: string
  price: number
  quantity: number
  perOrderLimit?: number
}

export interface NewEventInput {
  name: string
  description: string
  venue: string
  location: string
  startAt: string // ISO date-time
  endAt: string // ISO date-time
  ticketTypes: NewTicketType[]
  status: 'Published' | 'Draft'
}

interface BackendMyEvent {
  id: string
  title: string
  venue: string
  startAt: string
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
}

interface MyEventsPage {
  data: BackendMyEvent[]
  meta: { totalPages: number }
}

interface SalesSummary {
  totals: { sold: number }
}

const STATUS: Record<BackendMyEvent['status'], EventItem['status']> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  CANCELLED: 'Cancelled',
}

// "10 May 2026 • 19:00", the same style the dashboard table already shows
export function formatEventDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${day} • ${time}`
}

// The backend wants the total capacity as well. It is simply the sum of the ticket types.
export function totalCapacity(ticketTypes: NewTicketType[]): number {
  return ticketTypes.reduce((sum, type) => sum + type.quantity, 0)
}

async function soldFor(eventId: string): Promise<number> {
  const summary = await api<SalesSummary>(`/events/${eventId}/sales-summary`)
  return summary.totals.sold
}

// Every event of the logged-in organizer, in all statuses, with tickets sold.
export async function listMyEvents(): Promise<EventItem[]> {
  const events: BackendMyEvent[] = []
  let page = 1
  let totalPages = 1
  do {
    const result = await api<MyEventsPage>(`/events/mine?page=${page}&limit=50`)
    events.push(...result.data)
    totalPages = result.meta.totalPages
    page += 1
  } while (page <= totalPages)

  return Promise.all(
    events.map(async (event) => ({
      id: String(event.id),
      name: event.title,
      date: formatEventDate(event.startAt),
      venue: event.venue,
      ticketsSold: await soldFor(event.id),
      status: STATUS[event.status] ?? 'Draft',
    })),
  )
}

// Publishing makes the event public. Tickets only exist after "generate", so both run together.
// Generating again is safe: it only creates tickets that are still missing.
export async function publishEvent(eventId: string): Promise<void> {
  await api(`/events/${eventId}`, {
    method: 'PATCH',
    body: { status: 'PUBLISHED' },
  })
  try {
    await api(`/tickets/events/${eventId}/generate`, { method: 'POST' })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error'
    throw new Error(`The event is published but its tickets could not be created (${reason}). Press Publish again to retry.`)
  }
}

export async function createOrganizerEvent(input: NewEventInput): Promise<{ id: string }> {
  const created = await api<{ id: string }>('/events', {
    method: 'POST',
    body: {
      title: input.name.trim(),
      description: input.description.trim(),
      venue: input.venue.trim(),
      location: input.location.trim(),
      startAt: input.startAt,
      endAt: input.endAt,
      capacity: totalCapacity(input.ticketTypes),
      ticketTypes: input.ticketTypes.map((type) => ({
        name: type.name.trim(),
        price: type.price,
        currency: 'MWK',
        quantity: type.quantity,
        perOrderLimit: type.perOrderLimit ?? 10,
      })),
    },
  })
  if (input.status === 'Published') await publishEvent(created.id)
  return { id: String(created.id) }
}

export async function cancelOrganizerEvent(eventId: string): Promise<void> {
  await api(`/events/${eventId}`, {
    method: 'PATCH',
    body: { status: 'CANCELLED' },
  })
}
