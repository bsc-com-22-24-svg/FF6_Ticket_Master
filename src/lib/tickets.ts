export type TicketStatus = 'valid' | 'used' | 'cancelled' | 'refunded'

export interface TicketRecord {
  id: string
  userId: string
  eventId: string
  eventName: string
  date: string
  time: string
  venue: string
  city: string
  ticketType: string
  price: number
  holder: string
  status: TicketStatus
  createdAt: string
  checkedInAt?: string
  qrCodeDataUrl?: string
}

export type TicketValidationStatus = 'valid' | 'invalid' | 'used' | 'wrong_event'

export interface TicketValidationResult {
  status: TicketValidationStatus
  title: string
  message: string
  ticket?: TicketRecord
  tampered?: boolean
}

export function parseTicketCode(raw: string): { id: string; tag: string | null } {
  const cleaned = raw.trim().toUpperCase().replace(/^TICKET:/, '')
  const dot = cleaned.lastIndexOf('.')
  if (dot === -1) return { id: cleaned, tag: null }
  return { id: cleaned.slice(0, dot), tag: cleaned.slice(dot + 1) }
}

export function normalizeTicketCode(raw: string): string {
  return parseTicketCode(raw).id
}
