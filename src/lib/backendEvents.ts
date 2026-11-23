import { API, api } from './backend'
import type { StoredEvent, TicketType } from '../types/event'

// Published events from the backend, converted to the shape the pages already use.
const KNOWN_CITIES = ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Mangochi', 'Salima']
// Bundled pictures an organizer can pick instead of uploading their own.

function cleanId(value: unknown): string {
  // If your backend uses UUIDs, comment out this line and return String(value)
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    console.warn('[event] backend returned a non-numeric id:', value);
    return "";
  }
  return String(numeric);
}

export const DEFAULT_EVENT_IMAGES = [
  '/images/events/event-1.webp',
  '/images/events/event-2.jpg',
  '/images/events/event-3.webp',
]

// The image of an event: the organizer's upload, a chosen default, or (when nothing was
// chosen) one of the defaults picked from the event id.
export function resolveEventImage(imageUrl: string | null | undefined, eventId: string): string {
  if (imageUrl) {
    // uploads live on the backend, which the browser reaches through the /be proxy
    return imageUrl.startsWith('/uploads/') ? `${API}${imageUrl}` : imageUrl
  }
  let hash = 0
  for (const char of eventId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return DEFAULT_EVENT_IMAGES[hash % DEFAULT_EVENT_IMAGES.length]
}

interface BackendEvent {
  id: string
  title: string
  description: string
  venue: string
  location: string
  startAt: string
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
  category?: string | null
  imageUrl?: string | null
  organizerName?: string | null
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

function toStoredEvent(event: BackendEvent, ticketTypes: BackendTicketType[]): StoredEvent {
  const start = new Date(event.startAt)
  const location = event.location ?? ''
  return {
    id: cleanId(event.id),
    title: event.title,
    description: event.description,
    category: event.category ?? '',
    city: KNOWN_CITIES.find((city) => location.toLowerCase().includes(city.toLowerCase())) ?? location,
    venue: event.venue,
    date: start.toLocaleDateString('en-CA'),
    time: start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    organizer: event.organizerName ?? '',
    image: resolveEventImage(event.imageUrl, String(event.id)),
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
  ).then((results) => results.filter((e) => e.id !== ""))
}

export async function fetchBackendEvent(eventId: string): Promise<StoredEvent> {
  const event = await api<BackendEvent>(`/events/${encodeURIComponent(eventId)}`)
  const ticketTypes = await api<BackendTicketType[]>(`/events/${encodeURIComponent(eventId)}/ticket-types`)
  return toStoredEvent(event, ticketTypes)
}



// Safe cancel: only allows cancellation when the event is DRAFT or PUBLISHED.
// Some backend implementations reject DELETE on already-cancelled events.
export async function cancelEvent(id: string): Promise<void> {
  await api(`/events/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function recreateCancelledEvent(eventId: string): Promise<void> {
  const event = await api<BackendEvent>(`/events/${encodeURIComponent(eventId)}`);
  let ticketTypes: BackendTicketType[] = [];
  try {
    ticketTypes = await api<BackendTicketType[]>(`/events/${encodeURIComponent(eventId)}/ticket-types`);
  } catch {
    ticketTypes = [];
  }

  let start = new Date(event.startAt);
  const now = new Date();
  if (Number.isNaN(start.getTime()) || start <= now) {
    start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);

  const rows = (Array.isArray(ticketTypes) ? ticketTypes : []).map((t) => ({
    name: t.name || 'General',
    price: Number(t.price) || 0,
    currency: 'MWK',
    quantity: Number(t.quantity) || 50,
    perOrderLimit: 10,
  }));

  const typesToSave = rows.length > 0 ? rows : [{ name: 'General', price: 0, currency: 'MWK', quantity: 100, perOrderLimit: 10 }];

  await api('/events', {
    method: 'POST',
    body: {
      title: event.title,
      description: event.description,
      venue: event.venue,
      location: event.location,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      ...(event.imageUrl ? { imageUrl: event.imageUrl } : {}),
      capacity: typesToSave.reduce((s, t) => s + t.quantity, 0),
      ticketTypes: typesToSave,
    },
  });
}

// Restore a cancelled event. Attempts direct update via admin status endpoint and
// standard PATCH /events/:id. If the backend refuses because cancelled events are
// locked ("Cancelled events cannot be updated"), it automatically recreates the event
// as an active Draft so the organizer's event details are restored.
export async function restoreEvent(id: string, target: "Draft" | "Published"): Promise<void> {
  const status = target === 'Published' ? 'PUBLISHED' : 'DRAFT';
  try {
    await api(`/admin/events/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: { status },
    });
    return;
  } catch {
    // Proceed to standard endpoints if admin moderation endpoint is not permitted
  }

  try {
    await api(`/events/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { status: 'DRAFT' },
    });
    if (target === 'Published') {
      await api(`/events/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status: 'PUBLISHED' } });
      try {
        await api(`/tickets/events/${encodeURIComponent(id)}/generate`, { method: 'POST' });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown error';
        throw new Error(`The event is published but its tickets could not be created (${reason}). Press Restore again to retry.`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes('cancelled events cannot be updated')) {
      await recreateCancelledEvent(id);
      return;
    }
    throw err;
  }
}
