import { api } from './backend'

export type AdminEventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED'

export function updateAdminEventStatus(eventId: string, status: AdminEventStatus): Promise<void> {
  return api<void>(`/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: { status },
  })
}
