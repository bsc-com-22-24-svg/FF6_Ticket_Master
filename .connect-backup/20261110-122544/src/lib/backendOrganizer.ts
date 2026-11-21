import { API, api, getToken } from './backend'
import { resolveEventImage } from './backendEvents'
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
  imageUrl?: string // an uploaded image (/uploads/..), a bundled default, or nothing
}

interface BackendMyEvent {
  id: string
  title: string
  venue: string
  startAt: string
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
  publishedAt?: string | null
  imageUrl?: string | null
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
      ticketsSold: event.status === 'PUBLISHED' ? await soldFor(event.id) : 0,
      status: STATUS[event.status] ?? 'Draft',
      ...(event.status === 'CANCELLED'
        ? { restoreStatus: event.publishedAt ? 'Published' as const : 'Draft' as const }
        : {}),
      image: resolveEventImage(event.imageUrl, String(event.id)),
    })),
  )
}

export async function setOrganizerEventStatus(
  eventId: string,
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED',
): Promise<void> {
  await api(`/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: { status },
  })
}

// Publishing makes the event public. Tickets only exist after "generate", so both run together.
// Generating again is safe: it only creates tickets that are still missing.
export async function publishEvent(eventId: string): Promise<void> {
  await api(`/events/${encodeURIComponent(eventId)}/publish`, { method: 'POST' })
  try {
    await api(`/tickets/events/${encodeURIComponent(eventId)}/generate`, { method: 'POST' })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error'
    throw new Error(`The event is published but its tickets could not be created (${reason}). Press Publish again to retry.`)
  }
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

// Sends a picture to the backend and returns the path to save as the event's imageUrl.
export async function uploadEventImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Choose a JPG, PNG or WEBP image.')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('The image must be 5 MB or smaller.')

  const form = new FormData()
  form.append('file', file)
  const token = getToken()

  let response: Response
  try {
    response = await fetch(`${API}/events/images`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }

  let data: { imageUrl?: string; message?: string | string[] } | null = null
  try {
    data = await response.json()
  } catch {
    data = null
  }
  if (!response.ok || !data?.imageUrl) {
    const message = Array.isArray(data?.message) ? data.message.join('. ') : data?.message
    throw new Error(response.status >= 500 ? 'The image could not be uploaded. Try again.' : message || 'The image could not be uploaded.')
  }
  return data.imageUrl
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
      ...(input.imageUrl ? { imageUrl: input.imageUrl } : {}),
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
  await setOrganizerEventStatus(eventId, 'CANCELLED')
}

export async function restoreOrganizerEvent(
  eventId: string,
  status: 'DRAFT' | 'PUBLISHED',
): Promise<void> {
  await setOrganizerEventStatus(eventId, status)
}
