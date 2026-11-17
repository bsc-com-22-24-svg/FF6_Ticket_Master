import { api } from './backend'

export interface AdminKycSubmission {
  organizerId: string
  organizerName: string
  organizerEmail: string
  businessName: string
  registrationNumber: string
  documentType: string
  documentUrl: string
  status: string
  submittedAt: string
  notes: string
}

function getRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  const response = value as Record<string, unknown>
  for (const key of ['data', 'submissions', 'items', 'results']) {
    if (Array.isArray(response[key])) return response[key] as unknown[]
    if (response[key] && typeof response[key] === 'object') {
      const nested = getRows(response[key])
      if (nested.length) return nested
    }
  }
  return []
}

function toSubmission(value: unknown): AdminKycSubmission | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const organizer = raw.organizer && typeof raw.organizer === 'object'
    ? raw.organizer as Record<string, unknown>
    : {}
  const organizerId = raw.organizerId ?? raw.userId ?? organizer.id
  if (organizerId === undefined || organizerId === null) return null

  return {
    organizerId: String(organizerId),
    organizerName: String(raw.organizerName ?? organizer.name ?? raw.name ?? 'Organizer'),
    organizerEmail: String(raw.organizerEmail ?? organizer.email ?? raw.email ?? ''),
    businessName: String(raw.businessName ?? ''),
    registrationNumber: String(raw.registrationNumber ?? ''),
    documentType: String(raw.documentType ?? ''),
    documentUrl: String(raw.documentUrl ?? ''),
    status: String(raw.status ?? 'PENDING').toUpperCase(),
    submittedAt: String(raw.submittedAt ?? raw.createdAt ?? ''),
    notes: String(raw.notes ?? ''),
  }
}

export async function listAdminKyc(): Promise<AdminKycSubmission[]> {
  const result = await api<unknown>('/admin/kyc')
  return getRows(result).flatMap((row) => {
    const submission = toSubmission(row)
    return submission ? [submission] : []
  })
}

export function reviewAdminKyc(
  organizerId: string,
  approved: boolean,
  notes?: string,
): Promise<unknown> {
  return api(`/admin/kyc/${encodeURIComponent(organizerId)}/review`, {
    method: 'PATCH',
    body: { approved, ...(notes?.trim() ? { notes: notes.trim() } : {}) },
  })
}
