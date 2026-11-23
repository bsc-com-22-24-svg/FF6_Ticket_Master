import { API, api, getToken } from './backend'
import { restoreEvent } from './backendEvents'
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
  imageUrl?: string
}

export interface EditableOrganizerEvent {
  id: string
  title: string
  description: string
  category?: string | null
  imageUrl?: string | null
  venue: string
  location: string
  startAt: string
  endAt: string
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
}

export interface EditableOrganizerTicketType {
  id?: string
  name: string
  description: string
  price: number
  currency: string
  quantity: number
  perOrderLimit: number
  isActive: boolean
}

export async function listOrganizerTicketTypes(eventId: string): Promise<EditableOrganizerTicketType[]> {
  const response = await api<unknown>(`/events/${encodeURIComponent(eventId)}/ticket-types`)
  const rows = Array.isArray(response)
    ? response
    : response && typeof response === 'object' && Array.isArray((response as { data?: unknown }).data)
      ? (response as { data: unknown[] }).data
      : []
  return rows.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const id = row.ticketTypeId ?? row.id
    return [{
      ...(id === undefined || id === null ? {} : { id: String(id) }),
      name: String(row.name ?? ''),
      description: String(row.description ?? ''),
      price: Number(row.price ?? 0),
      currency: String(row.currency ?? 'MWK'),
      quantity: Number(row.quantity ?? 0),
      perOrderLimit: Number(row.perOrderLimit ?? 10),
      isActive: typeof row.isActive === 'boolean' ? row.isActive : row.active !== false,
    }]
  })
}

export function updateOrganizerTicketType(
  eventId: string,
  ticketTypeId: string,
  changes: Partial<Omit<EditableOrganizerTicketType, 'id'>>,
): Promise<unknown> {
  return api(`/events/${encodeURIComponent(eventId)}/ticket-types/${encodeURIComponent(ticketTypeId)}`, {
    method: 'PATCH',
    body: changes,
  })
}

export function createOrganizerTicketType(
  eventId: string,
  ticketType: Omit<EditableOrganizerTicketType, 'id' | 'isActive'>,
): Promise<unknown> {
  return api(`/events/${encodeURIComponent(eventId)}/ticket-types`, {
    method: 'POST',
    body: ticketType,
  })
}

export function fetchEditableOrganizerEvent(eventId: string): Promise<EditableOrganizerEvent> {
  return api<EditableOrganizerEvent>(`/events/${encodeURIComponent(eventId)}`)
}

export function updateOrganizerEvent(
  eventId: string,
  changes: Partial<Omit<EditableOrganizerEvent, 'id' | 'status'>>,
): Promise<unknown> {
  return api(`/events/${encodeURIComponent(eventId)}`, { method: 'PATCH', body: changes })
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

export async function uploadEventImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Please choose a JPG, PNG or WEBP file.')
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('Please choose an image smaller than 5 MB.')

  const form = new FormData()
  form.append('file', file)
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API}/events/images`, { method: 'POST', headers, body: form })
  let data: { imageUrl?: unknown; message?: unknown } = {}
  try {
    data = await response.json()
  } catch {
    // Report a useful fallback if the server returns a non-JSON response.
  }
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Custom image uploads are unavailable right now. Please choose one of the default images.')
    }
    throw new Error(typeof data.message === 'string' ? data.message : `Image upload failed (${response.status}).`)
  }
  if (typeof data.imageUrl !== 'string') throw new Error('The backend did not return the uploaded image URL.')
  return data.imageUrl
}

export function restoreOrganizerEvent(id: string, status: 'DRAFT' | 'PUBLISHED'): Promise<void> {
  return restoreEvent(id, status === 'PUBLISHED' ? 'Published' : 'Draft')
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
  if (input.imageUrl && (input.imageUrl.length > 2048 || input.imageUrl.startsWith('data:'))) {
    throw new Error('This image cannot be saved by the backend. Please choose a default image or use a supported image URL.')
  }
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
  await api(`/events/${eventId}`, {
    method: 'PATCH',
    body: { status: 'CANCELLED' },
  })
}
