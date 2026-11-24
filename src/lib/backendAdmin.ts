import { api } from './backend'

export type AdminEventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED'

export interface AdminEvent {
  eventId: string
  organizerId?: string
  organizerName?: string
  title: string
  venue?: string
  location?: string
  startAt?: string
  endAt?: string
  capacity?: number
  ticketsIssued?: number
  status: AdminEventStatus | string
  createdAt?: string
}

export interface AdminAuditLog {
  auditId: string
  actorUserId?: string | null
  actorName?: string | null
  actorEmail?: string | null
  action: string
  entityType?: string | null
  entityId?: string | null
  details?: unknown
  createdAt: string
}

export interface AdminKycEntry {
  kycId: string
  organizerId: string
  organizerName?: string
  organizerEmail?: string
  businessName: string
  registrationNumber?: string | null
  documentType: string
  documentUrl: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string
  submittedAt?: string
  reviewedAt?: string | null
  reviewerNotes?: string | null
}

export interface ReviewKycInput {
  approved: boolean
  notes?: string
}

export function listAdminEvents(status?: AdminEventStatus): Promise<AdminEvent[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return api<AdminEvent[]>(`/admin/events${query}`)
}

export function updateAdminEventStatus(
  eventId: string,
  status: AdminEventStatus,
  reason?: string,
): Promise<void> {
  return api<void>(`/admin/events/${encodeURIComponent(eventId)}/status`, {
    method: 'PATCH',
    body: { status, ...(reason ? { reason } : {}) },
  })
}

export function listAdminAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
  return api<AdminAuditLog[]>(`/admin/audit-logs?limit=${Math.min(Math.max(limit, 1), 500)}`)
}

export function listAdminKyc(): Promise<AdminKycEntry[]> {
  return api<AdminKycEntry[]>('/admin/kyc')
}

export function reviewAdminKyc(organizerId: string, input: ReviewKycInput): Promise<void> {
  return api<void>(`/admin/kyc/${encodeURIComponent(organizerId)}/review`, {
    method: 'PATCH',
    body: { approved: input.approved, ...(input.notes ? { notes: input.notes } : {}) },
  })
}
