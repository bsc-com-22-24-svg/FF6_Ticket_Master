import { api } from './backend'

export type AdminEventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED'

export interface AdminEventRecord {
  id: string
  title: string
  organizer: string
  status: AdminEventStatus | string
}

function recordsFrom(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  const result = value as Record<string, unknown>
  if (Array.isArray(result.data)) return result.data
  if (Array.isArray(result.events)) return result.events
  if (Array.isArray(result.items)) return result.items
  return []
}

export async function listAdminEvents(): Promise<AdminEventRecord[]> {
  const result = await api<unknown>('/admin/events')
  return recordsFrom(result).flatMap((value) => {
    if (!value || typeof value !== 'object') return []
    const event = value as Record<string, unknown>
    const id = event.id ?? event.eventId
    if (id === undefined || id === null) return []
    const organizer = event.organizer
    const organizerName = organizer && typeof organizer === 'object'
      ? (organizer as Record<string, unknown>).name
      : organizer
    return [{
      id: String(id),
      title: typeof event.title === 'string' ? event.title : 'Untitled',
      organizer: typeof event.organizerName === 'string'
        ? event.organizerName
        : typeof organizerName === 'string' ? organizerName : '',
      status: typeof event.status === 'string' ? event.status.toUpperCase() : 'DRAFT',
    }]
  })
}

export function updateAdminEventStatus(
  eventId: string,
  status: AdminEventStatus,
  reason?: string,
): Promise<unknown> {
  return api(`/admin/events/${encodeURIComponent(eventId)}/status`, {
    method: 'PATCH',
    body: { status, ...(reason?.trim() ? { reason: reason.trim() } : {}) },
  })
}
