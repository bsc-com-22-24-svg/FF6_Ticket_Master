// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validateBackendTicket } from '../../../lib/backendTickets'

vi.mock('../../../lib/backendTickets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/backendTickets')>()
  return { ...actual, validateBackendTicket: vi.fn() }
})

import { validateTicket } from './useTicketValidator'

const verify = vi.mocked(validateBackendTicket)

describe('validateTicket', () => {
  beforeEach(() => verify.mockReset())

  it('passes the event id to the backend and maps accepted scans', async () => {
    verify.mockResolvedValue({
      accepted: true,
      reason: null,
      ticketId: 'TKT-ONE',
      eventId: '7',
      validatedAt: '2026-11-24T12:00:00.000Z',
      details: { ticketNumber: 'TKT-ONE', ticketType: 'General' },
    })

    const result = await validateTicket('TICKET:TKT-ONE.signature', '7')

    expect(verify).toHaveBeenCalledWith('TICKET:TKT-ONE.signature', '7')
    expect(result.status).toBe('valid')
    expect(result.message).toContain('TKT-ONE')
  })

  it('maps a used ticket rejection', async () => {
    verify.mockResolvedValue({
      accepted: false,
      reason: 'ALREADY_USED',
      ticketId: 'TKT-TWO',
      eventId: '7',
      validatedAt: '2026-11-24T12:00:00.000Z',
    })

    const result = await validateTicket('TKT-TWO', '7')

    expect(result.status).toBe('used')
    expect(result.title).toBe('Already used')
  })
})
