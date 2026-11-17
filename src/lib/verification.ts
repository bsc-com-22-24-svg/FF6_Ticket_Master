import { api } from './backend'

export type KYCStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | string

export interface OrganizerKYC {
  id?: string
  organizerId?: string
  businessName: string
  registrationNumber?: string | null
  documentType: string
  documentUrl: string
  status: KYCStatus
  notes?: string | null
  submittedAt?: string
  reviewedAt?: string | null
}

export interface SubmitKycInput {
  businessName: string
  registrationNumber?: string
  documentType: string
  documentUrl: string
}

function unwrapKyc(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  if ('kyc' in record) return record.kyc
  if ('submission' in record) return record.submission
  if ('data' in record && record.data && typeof record.data === 'object') return unwrapKyc(record.data)
  return value
}

function toKyc(value: unknown): OrganizerKYC | null {
  const unwrapped = unwrapKyc(value)
  if (!unwrapped || typeof unwrapped !== 'object') return null
  const raw = unwrapped as Record<string, unknown>
  if (typeof raw.businessName !== 'string') return null

  return {
    ...(typeof raw.id === 'string' || typeof raw.id === 'number' ? { id: String(raw.id) } : {}),
    ...(typeof raw.organizerId === 'string' || typeof raw.organizerId === 'number'
      ? { organizerId: String(raw.organizerId) }
      : {}),
    businessName: raw.businessName,
    registrationNumber: typeof raw.registrationNumber === 'string' ? raw.registrationNumber : null,
    documentType: typeof raw.documentType === 'string' ? raw.documentType : '',
    documentUrl: typeof raw.documentUrl === 'string' ? raw.documentUrl : '',
    status: typeof raw.status === 'string' ? raw.status.toUpperCase() : 'PENDING',
    notes: typeof raw.notes === 'string' ? raw.notes : null,
    submittedAt: typeof raw.submittedAt === 'string' ? raw.submittedAt : undefined,
    reviewedAt: typeof raw.reviewedAt === 'string' ? raw.reviewedAt : null,
  }
}

export async function getMyKyc(): Promise<OrganizerKYC | null> {
  return toKyc(await api<unknown>('/organizers/me/kyc'))
}

export async function submitKyc(input: SubmitKycInput): Promise<OrganizerKYC> {
  const result = await api<unknown>('/organizers/me/kyc', {
    method: 'POST',
    body: {
      businessName: input.businessName.trim(),
      ...(input.registrationNumber?.trim() ? { registrationNumber: input.registrationNumber.trim() } : {}),
      documentType: input.documentType,
      documentUrl: input.documentUrl.trim(),
    },
  })
  const kyc = toKyc(result)
  if (!kyc) throw new Error('The backend returned an invalid KYC submission.')
  return kyc
}
