import type { TicketValidationResult } from '../../../lib/tickets'
import { backendValidationToResult, validateBackendTicket } from '../../../lib/backendTickets'

export async function validateTicket(rawCode: string, eventId: string): Promise<TicketValidationResult> {
  const response = await validateBackendTicket(rawCode, eventId)
  return backendValidationToResult(response)
}
