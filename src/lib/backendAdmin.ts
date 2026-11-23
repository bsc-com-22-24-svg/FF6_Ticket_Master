import { api } from './backend'

export type AdminEventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED'

export function updateAdminEventStatus(eventId: string, status: AdminEventStatus): Promise<void> {
  return api<void>(`/admin/events/${encodeURIComponent(eventId)}/status`, {
    method: 'PATCH',
    body: { status },
  })
}
