import { API } from './backend'

// Bundled pictures an organizer can pick instead of uploading their own.
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
