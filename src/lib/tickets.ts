// Shapes used by the ticket screens. Tickets, their QR codes and check-in state all
// belong to the backend; nothing here is stored in the browser.

export type { TicketStatus } from '../features/tickets/ticketTypes'
import type { TicketStatus } from '../features/tickets/ticketTypes'

export interface TicketRecord {
  id: string
  userId: string
  eventId: string
  eventName: string
  date: string // ISO date, e.g. 2026-11-14
  time: string // 24h, e.g. 18:00
  venue: string
  city: string
  ticketType: string
  price: number // in MK
  holder: string
  status: TicketStatus
  createdAt: string // ISO timestamp the ticket was issued
  checkedInAt?: string
  qrCodeDataUrl?: string // QR image issued by the backend
}

export type TicketValidationStatus = 'valid' | 'invalid' | 'used' | 'wrong_event'

export interface TicketValidationResult {
  status: TicketValidationStatus
  title: string
  message: string
  ticket?: TicketRecord
}
