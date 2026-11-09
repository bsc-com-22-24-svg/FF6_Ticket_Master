import { api } from './backend'
import type { StoredEvent } from './events'
import type { TicketType } from '../types/event'

// Published events from the backend, converted to the shape the pages already use.
const KNOWN_CITIES = ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Mangochi', 'Salima']
const IMAGES = ['/images/events/event-1.webp', '/images/events/event-2.jpg', '/images/events/event-3.webp']

interface BackendEvent {
  id: string
  title: string
  description: string
  venue: string
  location: string
  startAt: string
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
}

interface BackendTicketType {
  ticketTypeId: string
  name: string
  price: number | string
  quantity: number
  remaining: number
}

interface Page {
  data: BackendEvent[]
  meta: { totalPages: number }
}

function toTicketType(type: BackendTicketType): TicketType {
  return {
    id: String(type.ticketTypeId),
    name: type.name,
    price: Number(type.price),
    capacity: type.quantity,
    sold: Math.max(0, type.quantity - type.remaining),
  }
}

// The backend has no category, image or organizer name yet.
function toStoredEvent(event: BackendEvent, ticketTypes: BackendTicketType[]): StoredEvent {
  const start = new Date(event.startAt)
  const location = event.location ?? ''
  return {
    id: String(event.id),
    title: event.title,
    description: event.description,
    category: '',
    city: KNOWN_CITIES.find((city) => location.toLowerCase().includes(city.toLowerCase())) ?? location,
    venue: event.venue,
    date: start.toLocaleDateString('en-CA'),
    time: start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    organizer: '',
    image: IMAGES[(Number(event.id) || 0) % IMAGES.length],
    status: event.status === 'DRAFT' ? 'Draft' : event.status === 'CANCELLED' ? 'Cancelled' : 'Published',
    ticketTypes: ticketTypes.map(toTicketType),
  }
}

// All published events with their ticket types.
export async function fetchPublishedEvents(): Promise<StoredEvent[]> {
  const events: BackendEvent[] = []
  let page = 1
  let totalPages = 1
  do {
    const result = await api<Page>(`/events?page=${page}&limit=50`)
    events.push(...result.data)
    totalPages = result.meta.totalPages
    page += 1
  } while (page <= totalPages)

  return Promise.all(
    events.map(async (event) => toStoredEvent(event, await api<BackendTicketType[]>(`/events/${event.id}/ticket-types`))),
  )
}

export async function fetchBackendEvent(eventId: string): Promise<StoredEvent> {
  const event = await api<BackendEvent>(`/events/${encodeURIComponent(eventId)}`)
  const ticketTypes = await api<BackendTicketType[]>(`/events/${encodeURIComponent(eventId)}/ticket-types`)
  return toStoredEvent(event, ticketTypes)
}
